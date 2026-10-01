import { test, expect } from "@playwright/test";
import { API, RUN_TAG, anonApi, apiAs, expectData } from "./helpers";

/**
 * Phase 1 — Animal record, health timeline, documents, Safety Passport, lost
 * mode and vet consent.
 */
test.describe("Phase 1 · API", () => {
  test("owner adds an animal; microchip is validated and duplicates warn", async () => {
    const { ctx } = await apiAs("owner");
    const bad = await ctx.post(`${API}/animals`, {
      data: { name: `${RUN_TAG} Chip`, species: "dog", microchip: "12345" },
    });
    expect(bad.status()).toBe(400);

    const res = await ctx.post(`${API}/animals`, {
      data: { name: `${RUN_TAG} Rex`, species: "dog", microchip: "826098000123451" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data.custody).toBe("owner");
    expect(body.data.status).toBe("owned");
    expect(body.meta.warnings.length).toBe(1); // Bramble at Hope Hollow already has this chip
  });

  test("tenancy: each role lists only what it may see; others read as 404", async () => {
    const owner = await apiAs("owner");
    const mine = await expectData(await owner.ctx.get(`${API}/animals?limit=100`));
    expect(mine.every((a: any) => a.owner?.id === owner.user.id)).toBe(true);

    const hope = await apiAs("manager");
    const orgAnimals = await expectData(await hope.ctx.get(`${API}/animals?limit=100`));
    expect(orgAnimals.length).toBeGreaterThanOrEqual(10);
    expect(orgAnimals.every((a: any) => a.organisation?.name === "Hope Hollow Animal Rescue")).toBe(
      true,
    );

    const luna = orgAnimals.find((a: any) => a.name === "Luna");
    expect((await owner.ctx.get(`${API}/animals/${luna.id}`)).status()).toBe(404);
    const northern = await apiAs("northern");
    expect((await northern.ctx.get(`${API}/animals/${luna.id}`)).status()).toBe(404);
    const milo = mine.find((a: any) => a.name === "Milo");
    expect((await hope.ctx.get(`${API}/animals/${milo.id}`)).status()).toBe(404);
  });

  test("microchip search finds the animal", async () => {
    const { ctx } = await apiAs("manager");
    const hits = await expectData(await ctx.get(`${API}/animals?search=826098000123454`));
    expect(hits.map((a: any) => a.name)).toContain("Luna");
  });

  test("health timeline: add, weight updates headline, future dates refused, void keeps the entry", async () => {
    const { ctx } = await apiAs("owner");
    const [milo] = (await expectData(await ctx.get(`${API}/animals?search=Milo`))) as any[];

    const future = await ctx.post(`${API}/animals/${milo.id}/health`, {
      data: { type: "vaccination", title: "Booster", date: "2099-01-01" },
    });
    expect(future.status()).toBe(400);

    const w = await expectData(
      await ctx.post(`${API}/animals/${milo.id}/health`, {
        data: { type: "weight", title: "Weigh-in", date: new Date().toISOString(), weightKg: 33.1 },
      }),
      201,
    );
    expect(w.weightKg).toBe(33.1);
    const after = await expectData(await ctx.get(`${API}/animals/${milo.id}`));
    expect(after.weightKg).toBe(33.1);

    const noReason = await ctx.post(`${API}/animals/${milo.id}/health/${w.id}/void`, {
      data: { reason: "" },
    });
    expect(noReason.status()).toBe(400);
    const voided = await expectData(
      await ctx.post(`${API}/animals/${milo.id}/health/${w.id}/void`, {
        data: { reason: `${RUN_TAG} typo` },
      }),
    );
    expect(voided.voidedAt).toBeTruthy();
    const list = await expectData(await ctx.get(`${API}/animals/${milo.id}/health`));
    expect(list.find((r: any) => r.id === w.id).voidReason).toContain(RUN_TAG);
  });

  test("overdue care is computed server-side", async () => {
    const { ctx } = await apiAs("owner");
    const [milo] = (await expectData(await ctx.get(`${API}/animals?search=Milo`))) as any[];
    const records = await expectData(await ctx.get(`${API}/animals/${milo.id}/health`));
    const flea = records.find((r: any) => r.title === "Flea & worm treatment");
    expect(flea.dueState).toBe("overdue");
  });

  test("foster: may add observations to an assigned animal, not vaccinations; unassigned reads 404", async () => {
    const foster = await apiAs("foster");
    const assigned = await expectData(await foster.ctx.get(`${API}/animals`));
    expect(assigned.map((a: any) => a.name)).toEqual(["Biscuit"]);
    const biscuit = assigned[0];

    const obs = await foster.ctx.post(`${API}/animals/${biscuit.id}/health`, {
      data: { type: "observation", title: `${RUN_TAG} ate well`, date: new Date().toISOString() },
    });
    expect(obs.status()).toBe(201);
    const vacc = await foster.ctx.post(`${API}/animals/${biscuit.id}/health`, {
      data: { type: "vaccination", title: "Booster", date: new Date().toISOString() },
    });
    expect(vacc.status()).toBe(403);
    const patch = await foster.ctx.patch(`${API}/animals/${biscuit.id}`, {
      data: { name: "Nope" },
    });
    expect(patch.status()).toBe(403);

    const hope = await apiAs("manager");
    const [luna] = (await expectData(await hope.ctx.get(`${API}/animals?search=Luna`))) as any[];
    expect((await foster.ctx.get(`${API}/animals/${luna.id}`)).status()).toBe(404);
  });

  test("an observation flagged for professional review alerts the rescue team", async () => {
    const foster = await apiAs("foster");
    const [biscuit] = (await expectData(await foster.ctx.get(`${API}/animals`))) as any[];
    await expectData(
      await foster.ctx.post(`${API}/animals/${biscuit.id}/health`, {
        data: {
          type: "observation",
          title: `${RUN_TAG} scratching ear`,
          date: new Date().toISOString(),
          needsProfessionalReview: true,
        },
      }),
      201,
    );
    const staff = await apiAs("staff");
    const notes = await expectData(await staff.ctx.get(`${API}/notifications`));
    expect(notes.some((n: any) => n.title.includes("Biscuit needs professional review"))).toBe(
      true,
    );
  });

  test("Safety Passport: off by default, masked chip, contact relay, switch-off and link rotation", async () => {
    const owner = await apiAs("owner");
    const created = await expectData(
      await owner.ctx.post(`${API}/animals`, {
        data: { name: `${RUN_TAG} Poppy`, species: "cat", microchip: "826098000555001" },
      }),
      201,
    );
    expect(created.passport.active).toBe(false);
    expect(created.passport.shareUrl).toBeNull();

    const on = await expectData(
      await owner.ctx.patch(`${API}/animals/${created.id}/passport`, {
        data: { active: true, message: "Shy cat" },
      }),
    );
    const token = on.passport.shareUrl.split("/p/")[1];
    expect(token.length).toBeGreaterThanOrEqual(30);

    const anon = await anonApi();
    const pub = await expectData(await anon.get(`${API}/public/passport/${token}`));
    expect(pub.name).toBe(`${RUN_TAG} Poppy`);
    expect(pub.microchip).toMatch(/5001$/);
    expect(pub.microchip).not.toContain("826098");
    expect(pub.health).toBeNull();
    expect(JSON.stringify(pub)).not.toContain("owner@nurtail.test");

    await expectData(
      await anon.post(`${API}/public/passport/${token}/contact`, {
        data: {
          name: `${RUN_TAG} Finder`,
          contact: "07700 900999",
          message: "Seen by the park gates",
        },
      }),
    );
    const notes = await expectData(await owner.ctx.get(`${API}/notifications`));
    expect(notes.some((n: any) => n.title.includes(`${RUN_TAG} Finder`))).toBe(true);

    const rotated = await expectData(
      await owner.ctx.patch(`${API}/animals/${created.id}/passport`, {
        data: { regenerateLink: true },
      }),
    );
    const newToken = rotated.passport.shareUrl.split("/p/")[1];
    expect(newToken).not.toBe(token);
    expect((await anon.get(`${API}/public/passport/${token}`)).status()).toBe(404);

    await expectData(
      await owner.ctx.patch(`${API}/animals/${created.id}/passport`, { data: { active: false } }),
    );
    expect((await anon.get(`${API}/public/passport/${newToken}`)).status()).toBe(404);
  });

  test("lost mode: report lost, public page shows the notice, mark home safe", async () => {
    const owner = await apiAs("owner");
    const a = await expectData(
      await owner.ctx.post(`${API}/animals`, {
        data: { name: `${RUN_TAG} Scout`, species: "dog" },
      }),
      201,
    );
    const lost = await expectData(
      await owner.ctx.post(`${API}/animals/${a.id}/lost`, {
        data: { lastSeenArea: "Eastville Park", postcode: "BS5 6XX" },
      }),
    );
    expect(lost.status).toBe("lost");
    expect(lost.passport.lostMode).toBe(true);
    const token = lost.passport.shareUrl.split("/p/")[1];
    const anon = await anonApi();
    const pub = await expectData(await anon.get(`${API}/public/passport/${token}`));
    expect(pub.lostMode).toBe(true);
    expect(pub.lastSeenArea).toBe("Eastville Park");

    const again = await owner.ctx.post(`${API}/animals/${a.id}/lost`, {
      data: { lastSeenArea: "Somewhere" },
    });
    expect(again.status()).toBe(409);
    // Lost status can't be set by a plain edit.
    const patch = await owner.ctx.patch(`${API}/animals/${a.id}`, { data: { status: "owned" } });
    expect(patch.status()).toBe(400);

    const found = await expectData(
      await owner.ctx.post(`${API}/animals/${a.id}/found`, { data: {} }),
    );
    expect(found.status).toBe("owned");
    expect(found.passport.lostMode).toBe(false);
  });

  test("vet consent: grant, read-only access, audited view, revoke", async () => {
    const owner = await apiAs("owner");
    const [willow] = (await expectData(
      await owner.ctx.get(`${API}/animals?search=Willow`),
    )) as any[];

    const notVet = await owner.ctx.post(`${API}/animals/${willow.id}/grants`, {
      data: { vetEmail: "olivia@nurtail.test", days: 7 },
    });
    expect(notVet.status()).toBe(404);

    const grant = await expectData(
      await owner.ctx.post(`${API}/animals/${willow.id}/grants`, {
        data: { vetEmail: "vet@nurtail.test", days: 7 },
      }),
      201,
    );
    expect(grant.live).toBe(true);

    const vet = await apiAs("vet");
    const shared = await expectData(await vet.ctx.get(`${API}/access-grants/mine`));
    expect(shared.map((g: any) => g.animalName)).toEqual(
      expect.arrayContaining(["Milo", "Willow"]),
    );
    const view = await expectData(await vet.ctx.get(`${API}/animals/${willow.id}`));
    expect(view.access).toBe("vet");
    expect(view.passport.shareUrl).toBeUndefined();
    expect(
      (await vet.ctx.patch(`${API}/animals/${willow.id}`, { data: { name: "x" } })).status(),
    ).toBe(403);

    const timeline = await expectData(await owner.ctx.get(`${API}/animals/${willow.id}/timeline`));
    expect(timeline.some((e: any) => e.action === "animal.viewed_by_vet")).toBe(true);
    expect(timeline.some((e: any) => e.action === "consent.granted")).toBe(true);

    await expectData(await owner.ctx.post(`${API}/animals/${willow.id}/grants/${grant.id}/revoke`));
    expect((await vet.ctx.get(`${API}/animals/${willow.id}`)).status()).toBe(404);
  });

  test("status rules: rescue can move org statuses; owner cannot set rescue statuses", async () => {
    const hope = await apiAs("manager");
    const [mabel] = (await expectData(await hope.ctx.get(`${API}/animals?search=Mabel`))) as any[];
    const moved = await expectData(
      await hope.ctx.patch(`${API}/animals/${mabel.id}`, { data: { status: "ready" } }),
    );
    expect(moved.status).toBe("ready");
    const tl = await expectData(await hope.ctx.get(`${API}/animals/${mabel.id}/timeline`));
    expect(tl[0].action).toBe("animal.status_changed");
    expect(tl[0].changes[0]).toMatchObject({ field: "status", from: "in_care", to: "ready" });
    await hope.ctx.patch(`${API}/animals/${mabel.id}`, { data: { status: "in_care" } });

    const owner = await apiAs("owner");
    const [milo] = (await expectData(await owner.ctx.get(`${API}/animals?search=Milo`))) as any[];
    expect(
      (await owner.ctx.patch(`${API}/animals/${milo.id}`, { data: { status: "ready" } })).status(),
    ).toBe(400);
  });

  test("documents and photos upload; non-image photo refused", async () => {
    const { ctx } = await apiAs("owner");
    const [milo] = (await expectData(await ctx.get(`${API}/animals?search=Milo`))) as any[];
    const pdf = Buffer.from("%PDF-1.4\n%e2e\n");
    const doc = await expectData(
      await ctx.post(`${API}/animals/${milo.id}/documents`, {
        multipart: {
          file: { name: `${RUN_TAG}-cert.pdf`, mimeType: "application/pdf", buffer: pdf },
          kind: "vaccination_certificate",
        },
      }),
      201,
    );
    // Storage-agnostic: local disk in dev, Cloudinary when configured.
    expect(doc.url).toMatch(/^https?:\/\//);
    const notImage = await ctx.post(`${API}/animals/${milo.id}/photo`, {
      multipart: { file: { name: "x.pdf", mimeType: "application/pdf", buffer: pdf } },
    });
    expect(notImage.status()).toBe(415);
    const bad = await ctx.post(`${API}/animals/${milo.id}/documents`, {
      multipart: {
        file: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") },
      },
    });
    expect(bad.status()).toBe(415);
  });

  test("uploaded files are actually retrievable from storage (photo and PDF)", async () => {
    const { ctx } = await apiAs("owner");
    const [willow] = (await expectData(await ctx.get(`${API}/animals?search=Willow`))) as any[];
    // A real 1×1 PNG, so the image pipeline accepts it.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
    const withPhoto = await expectData(
      await ctx.post(`${API}/animals/${willow.id}/photo`, {
        multipart: { file: { name: `${RUN_TAG}-willow.png`, mimeType: "image/png", buffer: png } },
      }),
    );
    const img = await fetch(withPhoto.photoUrl);
    expect(img.status, `photo not retrievable: ${withPhoto.photoUrl}`).toBe(200);
    expect(img.headers.get("content-type")).toContain("image/");

    const doc = await expectData(
      await ctx.post(`${API}/animals/${willow.id}/documents`, {
        multipart: {
          file: {
            name: `${RUN_TAG}-vet-record.pdf`,
            mimeType: "application/pdf",
            buffer: Buffer.from("%PDF-1.4\n%%EOF\n"),
          },
          kind: "vet_record",
        },
      }),
      201,
    );
    const file = await fetch(doc.url);
    // On Cloudinary this needs Settings → Security → "Allow delivery of PDF and ZIP files".
    expect(file.status, `PDF not retrievable (Cloudinary PDF delivery setting?): ${doc.url}`).toBe(
      200,
    );
  });
});
