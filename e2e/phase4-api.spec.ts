import { test, expect } from "@playwright/test";
import { API, RUN_TAG, anonApi, apiAs, expectData } from "./helpers";

/**
 * Phase 4 — Community reports: safety gate, automatic routing, privacy (no
 * public naming, approximate locations), moderation, messages and sightings,
 * lost-mode integration, intake from a report, closure.
 */
const base = (overrides: Record<string, unknown> = {}) => ({
  type: "found",
  species: "dog",
  description: `${RUN_TAG} Friendly brown dog wandering near the shops, no collar.`,
  location: { area: "Wells Road shops", postcode: "BS4 2AB" },
  safetyAcknowledged: true,
  ...overrides,
});

test.describe("Phase 4 · API", () => {
  test("guest report: safety gate and contact are required; routed automatically; trackable", async () => {
    const anon = await anonApi();
    const noSafety = await anon.post(`${API}/public/reports`, {
      data: { ...base(), safetyAcknowledged: false, guest: { name: "A", phone: "07700900000" } },
    });
    expect(noSafety.status()).toBe(400);
    const noContact = await anon.post(`${API}/public/reports`, {
      data: { ...base(), guest: { name: "A" } },
    });
    expect(noContact.status()).toBe(400);

    const created = await expectData(
      await anon.post(`${API}/public/reports`, {
        data: { ...base(), guest: { name: `${RUN_TAG} Guest`, phone: "07700 900111" } },
      }),
      201,
    );
    expect(created.ref).toMatch(/^NT-R-\d{6}$/);
    expect(created.routed).toBe(true);
    expect(created.trackingToken.length).toBeGreaterThanOrEqual(30);

    const staff = await apiAs("staff");
    const notes = await expectData(await staff.ctx.get(`${API}/notifications`));
    expect(notes.some((n: any) => n.title.includes(created.ref))).toBe(true);

    const tracking = await expectData(
      await anon.get(`${API}/public/reports/${created.trackingToken}`),
    );
    expect(tracking.routedTo).toBe("Hope Hollow Animal Rescue");
    const replied = await expectData(
      await anon.post(`${API}/public/reports/${created.trackingToken}/messages`, {
        data: { body: "She's asleep in my shed now" },
      }),
      201,
    );
    expect(replied.messages.at(-1).body).toContain("shed");
  });

  test("unrouted reports wait for an admin; rescues outside the area can't see them; only verified rescues can hold them", async () => {
    const owner = await apiAs("owner");
    const r = await expectData(
      await owner.ctx.post(`${API}/reports`, {
        data: base({ type: "trapped", location: { area: "Headingley", postcode: "LS6 3AA" } }),
      }),
      201,
    );
    expect(r.status).toBe("new");
    expect(r.priority).toBe("urgent");
    expect(r.routedTo).toBeNull();

    const hope = await apiAs("manager");
    expect((await hope.ctx.get(`${API}/reports/${r.id}`)).status()).toBe(404);

    const admin = await apiAs("admin");
    const queue = await expectData(await admin.ctx.get(`${API}/reports?unrouted=true`));
    expect(queue.map((x: any) => x.id)).toContain(r.id);
    const northern = (
      await expectData(await admin.ctx.get(`${API}/organisations?search=Northern`))
    )[0];
    expect(
      (
        await admin.ctx.post(`${API}/reports/${r.id}/route`, {
          data: { organisationId: northern.id },
        })
      ).status(),
    ).toBe(400);
    const hopeOrg = hope.user.organisation.id;
    const routed = await expectData(
      await admin.ctx.post(`${API}/reports/${r.id}/route`, { data: { organisationId: hopeOrg } }),
    );
    expect(routed.routedTo.name).toBe("Hope Hollow Animal Rescue");
    expect((await hope.ctx.get(`${API}/reports/${r.id}`)).status()).toBe(200);
  });

  test("privacy: welfare reports never reach the community view; locations are approximate; others' reports are 404", async () => {
    const owner = await apiAs("owner");
    const welfare = await expectData(
      await owner.ctx.post(`${API}/reports`, {
        data: base({
          type: "welfare_concern",
          description: `${RUN_TAG} Dog left outside with no water all day in the heat.`,
        }),
      }),
      201,
    );
    const community = await expectData(await owner.ctx.get(`${API}/reports/community`));
    expect(community.every((c: any) => c.type === "lost" || c.type === "found")).toBe(true);
    expect(community.map((c: any) => c.id)).not.toContain(welfare.id);
    for (const c of community) {
      expect(c).not.toHaveProperty("reporter");
      expect(c).not.toHaveProperty("messages");
      if (c.location.lat) expect(Math.round(c.location.lat * 100) / 100).toBe(c.location.lat);
      expect(c.location.postcode).toBeUndefined();
    }
    const other = await apiAs("owner2");
    expect((await other.ctx.get(`${API}/reports/${welfare.id}`)).status()).toBe(404);

    // The handler sees the precise postcode; the reporter sees the district.
    const hope = await apiAs("manager");
    const asHandler = await expectData(await hope.ctx.get(`${API}/reports/${welfare.id}`));
    expect(asHandler.location.postcode).toBe("BS4 2AB");
    const asReporter = await expectData(await owner.ctx.get(`${API}/reports/${welfare.id}`));
    expect(asReporter.location.postcode).toBeUndefined();
    expect(asReporter.location.district).toBe("BS4");
  });

  test("moderation: naming and contact details are held, hidden, then redacted by an admin", async () => {
    const owner = await apiAs("owner");
    const r = await expectData(
      await owner.ctx.post(`${API}/reports`, {
        data: base({
          type: "found",
          description: `${RUN_TAG} Found this dog, the owner is scum. Call me on 07700 900555 or email me@example.com`,
        }),
      }),
      201,
    );
    expect(r.moderation.flagged).toBe(true);
    const community = await expectData(await owner.ctx.get(`${API}/reports/community`));
    expect(community.map((c: any) => c.id)).not.toContain(r.id);

    const admin = await apiAs("admin");
    const held = await expectData(await admin.ctx.get(`${API}/reports?flagged=true`));
    expect(held.map((x: any) => x.id)).toContain(r.id);
    const done = await expectData(
      await admin.ctx.post(`${API}/reports/${r.id}/moderate`, {
        data: {
          decision: "redacted",
          redactedDescription: `${RUN_TAG} Found this dog near the shops. Contact via Nurtail.`,
        },
      }),
    );
    expect(done.moderation.flagged).toBe(false);
    expect(done.description).not.toContain("scum");
    const after = await expectData(await owner.ctx.get(`${API}/reports/community`));
    expect(after.map((c: any) => c.id)).toContain(r.id);
  });

  test("messages: internal notes stay with the team; sightings only on lost reports", async () => {
    const owner = await apiAs("owner");
    const r = await expectData(
      await owner.ctx.post(`${API}/reports`, {
        data: base({
          type: "lost",
          description: `${RUN_TAG} Our cat Bramble slipped out of the back door.`,
        }),
      }),
      201,
    );
    const hope = await apiAs("manager");
    await expectData(
      await hope.ctx.post(`${API}/reports/${r.id}/messages`, {
        data: { body: `${RUN_TAG} check the chip database`, kind: "internal" },
      }),
      201,
    );
    await expectData(
      await hope.ctx.post(`${API}/reports/${r.id}/messages`, {
        data: { body: "We've shared this with our volunteers." },
      }),
      201,
    );
    const mine = await expectData(await owner.ctx.get(`${API}/reports/${r.id}`));
    expect(mine.messages.map((m: any) => m.body)).not.toContain(
      `${RUN_TAG} check the chip database`,
    );
    expect(mine.messages.some((m: any) => m.kind === "update")).toBe(true);
    expect(
      (
        await owner.ctx.post(`${API}/reports/${r.id}/messages`, {
          data: { body: "x", kind: "internal" },
        })
      ).status(),
    ).toBe(403);

    const neighbour = await apiAs("owner2");
    await expectData(
      await neighbour.ctx.post(`${API}/reports/${r.id}/sightings`, {
        data: { body: "Under a car", area: "Wells Road" },
      }),
      201,
    );
    const notes = await expectData(await owner.ctx.get(`${API}/notifications`));
    expect(notes.some((n: any) => n.title === `Possible sighting for ${r.ref}`)).toBe(true);

    const welfare = (
      await expectData(await hope.ctx.get(`${API}/reports?type=welfare_concern`))
    )[0];
    expect(
      (
        await neighbour.ctx.post(`${API}/reports/${welfare.id}/sightings`, {
          data: { body: "Saw it by the gate", area: "Stapleton Road" },
        })
      ).status(),
    ).toBe(404);
  });

  test("lost mode opens a routed lost report; home safe closes it as reunited", async () => {
    const owner = await apiAs("owner");
    const a = await expectData(
      await owner.ctx.post(`${API}/animals`, {
        data: { name: `${RUN_TAG} Pepperpot`, species: "cat" },
      }),
      201,
    );
    const lost = await owner.ctx.post(`${API}/animals/${a.id}/lost`, {
      data: { lastSeenArea: "St Andrews Park", postcode: "BS6 5BB" },
    });
    const body = await lost.json();
    expect(body.meta.reportRef).toMatch(/^NT-R-/);
    const r = await expectData(await owner.ctx.get(`${API}/reports/${body.meta.reportId}`));
    expect(r.type).toBe("lost");
    expect(r.routedTo.name).toBe("Hope Hollow Animal Rescue");
    expect(r.linkedAnimalId).toBe(a.id);

    await expectData(await owner.ctx.post(`${API}/animals/${a.id}/found`, { data: {} }));
    const closed = await expectData(await owner.ctx.get(`${API}/reports/${r.id}`));
    expect(closed.status).toBe("closed");
    expect(closed.outcome).toBe("reunited");
  });

  test("a rescue takes a reported animal into care; the report links to the case", async () => {
    const anon = await anonApi();
    const created = await expectData(
      await anon.post(`${API}/public/reports`, {
        data: {
          ...base({
            type: "injured",
            description: `${RUN_TAG} Cat hit by a car, lying on the verge.`,
          }),
          guest: { name: "Driver", phone: "07700900222" },
        },
      }),
      201,
    );
    const hope = await apiAs("manager");
    const list = await expectData(await hope.ctx.get(`${API}/reports?type=injured`));
    const r = list.find((x: any) => x.ref === created.ref);
    const c = await expectData(
      await hope.ctx.post(`${API}/cases/intake`, {
        data: {
          animal: { name: `${RUN_TAG} Verge cat`, species: "cat" },
          source: "community_report",
          priority: "emergency",
          reportId: r.id,
        },
      }),
      201,
    );
    expect(c.reportId).toBe(r.id);
    const after = await expectData(await hope.ctx.get(`${API}/reports/${r.id}`));
    expect(after.status).toBe("in_progress");
    expect(after.linkedCaseId).toBe(c.id);
    const tracking = await expectData(
      await anon.get(`${API}/public/reports/${created.trackingToken}`),
    );
    expect(tracking.messages.some((m: any) => m.body.includes("taken the animal into care"))).toBe(
      true,
    );
  });

  test("closing: reporters close their own lost/found reports, not welfare ones; closed reports are read-only", async () => {
    const owner = await apiAs("owner");
    const found = await expectData(await owner.ctx.post(`${API}/reports`, { data: base() }), 201);
    const closed = await expectData(
      await owner.ctx.post(`${API}/reports/${found.id}/close`, {
        data: { outcome: "reunited", notes: "Owner collected" },
      }),
    );
    expect(closed.status).toBe("closed");
    expect(
      (
        await owner.ctx.post(`${API}/reports/${found.id}/messages`, { data: { body: "hi" } })
      ).status(),
    ).toBe(409);

    const welfare = await expectData(
      await owner.ctx.post(`${API}/reports`, { data: base({ type: "welfare_concern" }) }),
      201,
    );
    expect(
      (
        await owner.ctx.post(`${API}/reports/${welfare.id}/close`, {
          data: { outcome: "no_further_action" },
        })
      ).status(),
    ).toBe(403);
    const hope = await apiAs("manager");
    expect(
      (
        await expectData(
          await hope.ctx.post(`${API}/reports/${welfare.id}/close`, {
            data: { outcome: "referred_to_authorities" },
          }),
        )
      ).status,
    ).toBe("closed");
  });

  test("dashboards count routed reports, moderation holds and unrouted reports", async () => {
    const hope = await apiAs("manager");
    expect(
      (await expectData(await hope.ctx.get(`${API}/dashboard`))).reportsRouted,
    ).toBeGreaterThan(0);
    const admin = await apiAs("admin");
    const d = await expectData(await admin.ctx.get(`${API}/dashboard`));
    expect(d.safetyFlags).toBeGreaterThanOrEqual(1);
    expect(typeof d.unroutedReports).toBe("number");
  });
});
