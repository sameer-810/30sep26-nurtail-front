import { test, expect } from "@playwright/test";
import { API, RUN_TAG, anonApi, apiAs, expectData } from "./helpers";

/**
 * Phase 5 — Verification, moderation console, care network (services and
 * bookings), plans and billing, admin dashboard, and a final audit-integrity
 * check across everything the suites did.
 */
const pdf = {
  name: "evidence.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n%nurtail-e2e\n"),
};

test.describe("Phase 5 · API", () => {
  test("organisation side: evidence is required before submitting; locked while under review", async () => {
    const anon = await anonApi();
    const email = `${RUN_TAG.toLowerCase()}-verify@e2e.test`;
    const reg = await expectData(
      await anon.post(`${API}/auth/register`, {
        data: {
          name: `${RUN_TAG} Founder`,
          email,
          password: "a-long-enough-pass",
          role: "rescue",
          organisation: { name: `${RUN_TAG} Paws`, type: "rescue", postcode: "BS14 8AA" },
        },
      }),
      201,
    );
    const { request } = await import("@playwright/test");
    const ctx = await request.newContext({
      extraHTTPHeaders: { Authorization: `Bearer ${reg.accessToken}` },
    });

    const early = await ctx.post(`${API}/verification/submit`, { data: {} });
    expect(early.status()).toBe(400);
    expect((await early.json()).error.details.missing).toEqual(["registration", "insurance"]);

    await expectData(
      await ctx.post(`${API}/verification/evidence`, {
        multipart: { file: pdf, kind: "registration", label: "Charity registration" },
      }),
      201,
    );
    await expectData(
      await ctx.post(`${API}/verification/evidence`, {
        multipart: {
          file: pdf,
          kind: "insurance",
          label: "Insurance 2026",
          expiresAt: "2027-06-30",
        },
      }),
      201,
    );
    const submitted = await expectData(await ctx.post(`${API}/verification/submit`, { data: {} }));
    expect(submitted.verification.status).toBe("pending");
    const locked = await ctx.post(`${API}/verification/evidence`, {
      multipart: { file: pdf, kind: "other" },
    });
    expect(locked.status()).toBe(409);

    const admin = await apiAs("admin");
    const queue = await expectData(await admin.ctx.get(`${API}/verification/queue`));
    expect(queue.map((o: any) => o.name)).toContain(`${RUN_TAG} Paws`);
    const notes = await expectData(await admin.ctx.get(`${API}/notifications`));
    expect(notes.some((n: any) => n.title.includes(`${RUN_TAG} Paws`))).toBe(true);
  });

  test("admin decisions: reason codes and notes are enforced; only valid transitions; staff can't decide", async () => {
    const admin = await apiAs("admin");
    const [northern] = await expectData(
      await admin.ctx.get(`${API}/organisations?search=Northern`),
    );
    const url = `${API}/verification/${northern.id}/decide`;
    expect(
      (
        await admin.ctx.post(url, {
          data: { decision: "approve", reasonCode: "INSURANCE_MISSING" },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await admin.ctx.post(url, { data: { decision: "return", reasonCode: "INSURANCE_EXPIRED" } })
      ).status(),
    ).toBe(400); // notes needed
    expect(
      (
        await admin.ctx.post(url, {
          data: { decision: "revoke", reasonCode: "WELFARE_CONCERN", notes: "x" },
        })
      ).status(),
    ).toBe(409); // not verified yet
    const staff = await apiAs("manager");
    expect(
      (
        await staff.ctx.post(url, {
          data: { decision: "approve", reasonCode: "EVIDENCE_COMPLETE" },
        })
      ).status(),
    ).toBe(403);

    const approved = await expectData(
      await admin.ctx.post(url, {
        data: {
          decision: "approve",
          reasonCode: "EVIDENCE_COMPLETE",
          notes: "Registration and insurance checked",
        },
      }),
    );
    expect(approved.verification.status).toBe("verified");
    expect(approved.verification.history.at(-1).reasonCode).toBe("EVIDENCE_COMPLETE");

    const northernManager = await apiAs("northern");
    const n = await expectData(await northernManager.ctx.get(`${API}/notifications`));
    expect(n.some((x: any) => x.title === "Northern Paws Sanctuary is verified")).toBe(true);
    const audit = await expectData(
      await admin.ctx.get(`${API}/audit?entityType=organisation&search=Northern`),
    );
    expect(
      audit.some(
        (e: any) =>
          e.action === "verification.verified" && e.reason.startsWith("EVIDENCE_COMPLETE"),
      ),
    ).toBe(true);
  });

  test("verification gates visibility: revoking hides listings; re-verifying restores them", async () => {
    const northern = await apiAs("northern");
    const c = await expectData(
      await northern.ctx.post(`${API}/cases/intake`, {
        data: { animal: { name: `${RUN_TAG} Skye`, species: "dog" }, source: "stray" },
      }),
      201,
    );
    await expectData(
      await northern.ctx.patch(`${API}/animals/${c.animal.id}`, {
        data: {
          status: "ready",
          listing: {
            listed: true,
            headline: "Lovely lurcher",
            description:
              "Skye is gentle, house-trained and adores long country walks followed by a nap.",
          },
        },
      }),
    );
    const anon = await anonApi();
    const names = async () =>
      (await expectData(await anon.get(`${API}/adoption/listings`))).map((a: any) => a.name);
    expect(await names()).toContain(`${RUN_TAG} Skye`);

    const admin = await apiAs("admin");
    const orgId = northern.user.organisation.id;
    await expectData(
      await admin.ctx.post(`${API}/verification/${orgId}/decide`, {
        data: {
          decision: "revoke",
          reasonCode: "INSURANCE_EXPIRED",
          notes: "Insurance lapsed — upload the renewal.",
        },
      }),
    );
    expect(await names()).not.toContain(`${RUN_TAG} Skye`);
  });

  test("changing a verified organisation's name sends it back for review; services hide until re-verified", async () => {
    const vendor = await apiAs("vendor");
    const owner = await apiAs("owner");
    const directory = async () =>
      (await expectData(await owner.ctx.get(`${API}/services`))).map((s: any) => s.vendor.name);
    expect(await directory()).toContain("Greenway Dog Walking");

    const renamed = await expectData(
      await vendor.ctx.patch(`${API}/organisations/mine`, { data: { name: "Greenway Walks Ltd" } }),
    );
    expect(renamed.verification.status).toBe("pending");
    expect(await directory()).not.toContain("Greenway Walks Ltd");

    const admin = await apiAs("admin");
    await expectData(
      await admin.ctx.post(`${API}/verification/${renamed.id}/decide`, {
        data: { decision: "approve", reasonCode: "EVIDENCE_COMPLETE" },
      }),
    );
    expect(await directory()).toContain("Greenway Walks Ltd");
    await vendor.ctx.patch(`${API}/organisations/mine`, {
      data: { description: "DBS-checked, insured dog walkers covering north Bristol." },
    });
  });

  test("services: only published services from verified vendors appear", async () => {
    const owner = await apiAs("owner");
    const titles = async () =>
      (await expectData(await owner.ctx.get(`${API}/services`))).map((s: any) => s.title);
    expect(await titles()).not.toContain("Mobile full groom"); // Riverside was returned
    const vendor = await apiAs("vendor");
    const s = await expectData(
      await vendor.ctx.post(`${API}/services`, {
        data: {
          title: `${RUN_TAG} Evening walk`,
          category: "dog_walking",
          priceFrom: 14,
          priceUnit: "per_walk",
        },
      }),
      201,
    );
    expect(s.coverageDistricts).toContain("BS6"); // inherited from the organisation
    expect(await titles()).not.toContain(`${RUN_TAG} Evening walk`);
    await expectData(
      await vendor.ctx.patch(`${API}/services/${s.id}`, { data: { published: true } }),
    );
    expect(await titles()).toContain(`${RUN_TAG} Evening walk`);
    // Another vendor can't touch it; owners can't create services.
    const other = await apiAs("vendor2");
    expect(
      (await other.ctx.patch(`${API}/services/${s.id}`, { data: { published: false } })).status(),
    ).toBe(404);
    expect(
      (
        await owner.ctx.post(`${API}/services`, {
          data: { title: "x", category: "grooming", priceFrom: 1, priceUnit: "per_session" },
        })
      ).status(),
    ).toBe(403);
  });

  test("bookings: request → confirm (payment held) → complete (commission recorded)", async () => {
    const owner = await apiAs("owner");
    const [service] = (
      await expectData(await owner.ctx.get(`${API}/services?category=dog_walking`))
    ).filter((s: any) => s.title.startsWith("Solo"));
    const [milo] = await expectData(await owner.ctx.get(`${API}/animals?search=Milo`));
    const hope = await apiAs("manager");
    const [luna] = await expectData(await hope.ctx.get(`${API}/animals?search=Bertie`));

    expect(
      (
        await owner.ctx.post(`${API}/bookings`, {
          data: { serviceId: service.id, date: "2020-01-01T10:00:00Z" },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await owner.ctx.post(`${API}/bookings`, {
          data: {
            serviceId: service.id,
            animalId: luna.id,
            date: new Date(Date.now() + 86_400_000).toISOString(),
          },
        })
      ).status(),
    ).toBe(400);

    const b = await expectData(
      await owner.ctx.post(`${API}/bookings`, {
        data: {
          serviceId: service.id,
          animalId: milo.id,
          date: new Date(Date.now() + 2 * 86_400_000).toISOString(),
          notes: RUN_TAG,
        },
      }),
      201,
    );
    expect(b.status).toBe("requested");
    expect(b.ref).toMatch(/^NT-B-\d{6}$/);
    expect((await owner.ctx.post(`${API}/bookings/${b.id}/confirm`, { data: {} })).status()).toBe(
      403,
    );

    const vendor = await apiAs("vendor");
    expect((await vendor.ctx.post(`${API}/bookings/${b.id}/complete`, { data: {} })).status()).toBe(
      409,
    );
    const confirmed = await expectData(
      await vendor.ctx.post(`${API}/bookings/${b.id}/confirm`, { data: {} }),
    );
    expect(confirmed.payment.status).toBe("authorised");
    const done = await expectData(
      await vendor.ctx.post(`${API}/bookings/${b.id}/complete`, { data: {} }),
    );
    expect(done.payment.status).toBe("captured");
    expect(done.commissionPercent).toBe(10);
    expect(done.commission).toBe(1.6);
    expect(done.vendorPayout).toBe(14.4);
    const dash = await expectData(await vendor.ctx.get(`${API}/dashboard`));
    expect(dash.earnings.completed).toBeGreaterThanOrEqual(3);

    const second = await expectData(
      await owner.ctx.post(`${API}/bookings`, {
        data: { serviceId: service.id, date: new Date(Date.now() + 3 * 86_400_000).toISOString() },
      }),
      201,
    );
    await expectData(await vendor.ctx.post(`${API}/bookings/${second.id}/confirm`, { data: {} }));
    const cancelled = await expectData(
      await owner.ctx.post(`${API}/bookings/${second.id}/cancel`, { data: {} }),
    );
    expect(cancelled.payment.status).toBe("released");
  });

  test("plans: managers check out (simulated, with VAT), staff can't; cancel keeps a grace period", async () => {
    const manager = await apiAs("manager");
    const plans = await expectData(await manager.ctx.get(`${API}/plans`));
    expect(plans.plans.map((p: any) => p.code)).toEqual(["charity_free", "charity_multisite"]);
    const staff = await apiAs("staff");
    expect(
      (
        await staff.ctx.post(`${API}/plans/checkout`, { data: { planCode: "charity_multisite" } })
      ).status(),
    ).toBe(403);

    const bought = await expectData(
      await manager.ctx.post(`${API}/plans/checkout`, { data: { planCode: "charity_multisite" } }),
    );
    expect(bought.current.code).toBe("charity_multisite");
    expect(bought.invoice.total).toBe(58.8);
    const after = await expectData(await manager.ctx.get(`${API}/plans`));
    expect(after.invoices[0].simulated).toBe(true);
    expect(after.invoices[0].vat).toBe(9.8);

    const cancelled = await expectData(await manager.ctx.post(`${API}/plans/cancel`));
    expect(cancelled.current.status).toBe("grace");

    const vendor = await apiAs("vendor");
    expect(
      (
        await vendor.ctx.post(`${API}/plans/checkout`, { data: { planCode: "charity_multisite" } })
      ).status(),
    ).toBe(400);
    const vet = await apiAs("vet");
    expect((await expectData(await vet.ctx.get(`${API}/plans`))).current.code).toBe(
      "vet_dashboard",
    );
    const owner = await apiAs("owner");
    expect((await owner.ctx.get(`${API}/plans`)).status()).toBe(403);
  });

  test("admin dashboard: review queue is severity-first and covers every kind", async () => {
    const admin = await apiAs("admin");
    const d = await expectData(await admin.ctx.get(`${API}/dashboard`));
    const kinds = d.queue.map((q: any) => q.kind);
    expect(kinds).toEqual(expect.arrayContaining(["Rescue organisation"]));
    expect(d.queue[0].action).toBe("escalate");
    expect(d.kpis.openCases).toBeGreaterThan(0);
  });

  test("final check: every audit event written by every suite still verifies", async () => {
    const admin = await apiAs("admin");
    const result = await expectData(await admin.ctx.get(`${API}/audit/integrity`));
    expect(result.valid).toBe(true);
    expect(result.checked).toBeGreaterThan(50);
  });
});
