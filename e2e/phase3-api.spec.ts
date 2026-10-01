import { test, expect } from "@playwright/test";
import { API, RUN_TAG, anonApi, apiAs, expectData } from "./helpers";

/**
 * Phase 3 — Adoption: verified-only listings, explainable matching, review
 * decisions, handover with custody transfer, follow-up.
 */
const answers = (overrides: Record<string, unknown> = {}) => ({
  homeType: "house",
  tenure: "own",
  hasGarden: true,
  gardenSecure: true,
  adults: 2,
  children: 0,
  otherDogs: 0,
  otherCats: 0,
  experience: "some",
  hoursAlone: 3,
  activityLevel: "high",
  whyThisAnimal: `${RUN_TAG} We have a big garden and walk every day on the Downs.`,
  ...overrides,
});

async function listingByName(name: string) {
  const anon = await anonApi();
  const all = await expectData(await anon.get(`${API}/adoption/listings`));
  return all.find((a: any) => a.name === name);
}

test.describe("Phase 3 · API", () => {
  test("listings are public and only show verified rescues' listed, ready animals", async () => {
    const anon = await anonApi();
    const all = await expectData(await anon.get(`${API}/adoption/listings`));
    const names = all.map((a: any) => a.name);
    expect(names).toEqual(expect.arrayContaining(["Luna", "Bertie", "Pip", "Clover"]));
    expect(names).not.toContain("Mabel"); // in care, not listed
    for (const a of all) {
      expect(a.organisation.verified).toBe(true);
      expect(a).not.toHaveProperty("microchip");
      expect(a).not.toHaveProperty("location");
    }
    const cats = await expectData(await anon.get(`${API}/adoption/listings?goodWithCats=true`));
    expect(cats.map((a: any) => a.name)).toContain("Bertie");
    expect(cats.map((a: any) => a.name)).not.toContain("Luna");

    // An unverified organisation's listing never appears, however it's set up.
    const northern = await apiAs("northern");
    const c = await expectData(
      await northern.ctx.post(`${API}/cases/intake`, {
        data: { animal: { name: `${RUN_TAG} Hidden`, species: "dog" }, source: "stray" },
      }),
      201,
    );
    await expectData(
      await northern.ctx.patch(`${API}/animals/${c.animal.id}`, {
        data: { status: "ready", listing: { listed: true, headline: "x", description: "y" } },
      }),
    );
    const again = await expectData(await anon.get(`${API}/adoption/listings`));
    expect(again.map((a: any) => a.name)).not.toContain(`${RUN_TAG} Hidden`);
    expect((await anon.get(`${API}/adoption/listings/${c.animal.id}`)).status()).toBe(404);
  });

  test("apply: explainable match with key concerns; duplicates refused; rescue notified", async () => {
    const bertie = await listingByName("Bertie");
    const owner = await apiAs("owner2");
    const res = await owner.ctx.post(`${API}/applications`, {
      data: {
        animalId: bertie.id,
        answers: answers({
          children: 1,
          youngestChildAge: 3,
          tenure: "rent",
          landlordPermission: false,
        }),
      },
    });
    const app = await expectData(res, 201);
    expect(app.ref).toMatch(/^NT-A-\d{6}$/);
    expect(app.status).toBe("submitted");
    const byKey = Object.fromEntries(app.match.factors.map((f: any) => [f.key, f]));
    expect(byKey.children.result).toBe("unmet");
    expect(byKey.children.detail).toContain("5+");
    expect(byKey.housing.blocking).toBe(true);
    expect(app.match.blockers).toBe(2);
    expect(app).not.toHaveProperty("reviewerNotes");

    const dup = await owner.ctx.post(`${API}/applications`, {
      data: { animalId: bertie.id, answers: answers() },
    });
    expect(dup.status()).toBe(409);

    const staff = await apiAs("staff");
    const notes = await expectData(await staff.ctx.get(`${API}/notifications`));
    expect(notes.some((n: any) => n.title === "New application for Bertie")).toBe(true);

    const rescue = await apiAs("manager");
    expect(
      (
        await rescue.ctx.post(`${API}/applications`, {
          data: { animalId: bertie.id, answers: answers() },
        })
      ).status(),
    ).toBe(403);
    const short = await owner.ctx.post(`${API}/applications`, {
      data: { animalId: bertie.id, answers: answers({ whyThisAnimal: "because" }) },
    });
    expect(short.status()).toBe(400);
  });

  test("privacy: other owners and other rescues can't read an application", async () => {
    const owner = await apiAs("owner");
    const [luna] = await expectData(await owner.ctx.get(`${API}/applications`));
    const other = await apiAs("owner2");
    expect((await other.ctx.get(`${API}/applications/${luna.id}`)).status()).toBe(404);
    const northern = await apiAs("northern");
    expect((await northern.ctx.get(`${API}/applications/${luna.id}`)).status()).toBe(404);
  });

  test("review decisions follow the allowed path; approval reserves and moves the case", async () => {
    const clover = await listingByName("Clover");
    const owner = await apiAs("owner");
    const app = await expectData(
      await owner.ctx.post(`${API}/applications`, {
        data: { animalId: clover.id, answers: answers({ activityLevel: "low" }) },
      }),
      201,
    );
    const rescue = await apiAs("manager");
    const url = `${API}/applications/${app.id}/status`;

    expect((await rescue.ctx.post(url, { data: { status: "approved" } })).status()).toBe(409);
    await expectData(
      await rescue.ctx.post(url, {
        data: { status: "under_review", reviewerNotes: `${RUN_TAG} private note` },
      }),
    );
    expect((await rescue.ctx.post(url, { data: { status: "meet_scheduled" } })).status()).toBe(400);
    await expectData(
      await rescue.ctx.post(url, {
        data: { status: "meet_scheduled", meetAt: new Date(Date.now() + 86_400_000).toISOString() },
      }),
    );
    const approved = await expectData(await rescue.ctx.post(url, { data: { status: "approved" } }));
    expect(approved.status).toBe("approved");
    expect(approved.reviewerNotes).toContain(RUN_TAG);

    const animal = await expectData(await rescue.ctx.get(`${API}/animals/${clover.id}`));
    expect(animal.status).toBe("reserved");
    const c = await expectData(await rescue.ctx.get(`${API}/cases/${animal.currentCaseId}`));
    expect(c.stage).toBe("match");

    // The applicant never sees internal notes; declines need a reason.
    const mine = await expectData(await owner.ctx.get(`${API}/applications/${app.id}`));
    expect(mine.reviewerNotes).toBeUndefined();
    expect((await rescue.ctx.post(url, { data: { status: "declined" } })).status()).toBe(400);
  });

  test("handover transfers custody with full history, closes other applications, schedules follow-up", async () => {
    const rescue = await apiAs("manager");
    const owner = await apiAs("owner");
    const sophie = await apiAs("owner2");
    const luna = await listingByName("Luna");

    // A second applicant for Luna who will be closed kindly at handover.
    const rival = await expectData(
      await sophie.ctx.post(`${API}/applications`, {
        data: { animalId: luna.id, answers: answers() },
      }),
      201,
    );

    const [jamesApp] = (await expectData(await owner.ctx.get(`${API}/applications`))).filter(
      (a: any) => a.animal.name === "Luna",
    );
    const url = `${API}/applications/${jamesApp.id}`;
    await expectData(await rescue.ctx.post(`${url}/status`, { data: { status: "under_review" } }));
    await expectData(await rescue.ctx.post(`${url}/status`, { data: { status: "approved" } }));

    const incomplete = await rescue.ctx.post(`${url}/handover`, {
      data: { contractSigned: true, healthRecordsShared: true, microchipTransferred: false },
    });
    expect(incomplete.status()).toBe(400);
    const done = await expectData(
      await rescue.ctx.post(`${url}/handover`, {
        data: {
          contractSigned: true,
          healthRecordsShared: true,
          microchipTransferred: true,
          microchipTransferRef: `${RUN_TAG}-PETLOG`,
          carePackGiven: true,
        },
      }),
    );
    expect(done.status).toBe("adopted");
    expect(done.followUps).toHaveLength(1);

    // Custody moved: James sees Luna with her rescue health history; the rescue no longer reads her.
    const mine = await expectData(await owner.ctx.get(`${API}/animals/${luna.id}`));
    expect(mine.custody).toBe("owner");
    expect(mine.status).toBe("owned");
    const health = await expectData(await owner.ctx.get(`${API}/animals/${luna.id}/health`));
    expect(health.some((r: any) => r.title === "Spay")).toBe(true);
    const docs = await expectData(await owner.ctx.get(`${API}/animals/${luna.id}/documents`));
    expect(docs.some((d: any) => d.kind === "handover_pack")).toBe(true);
    expect((await rescue.ctx.get(`${API}/animals/${luna.id}`)).status()).toBe(404);

    const rivalNow = await expectData(await sophie.ctx.get(`${API}/applications/${rival.id}`));
    expect(rivalNow.status).toBe("declined");
    expect(rivalNow.declineReason).toContain("found a home");

    const c = await expectData(await rescue.ctx.get(`${API}/cases/${done.caseId}`));
    expect(c.stage).toBe("follow_up");
    expect(c.tasks.some((t: any) => t.title.startsWith("2-week follow-up call"))).toBe(true);

    const fu = await expectData(
      await rescue.ctx.post(`${url}/follow-ups/${done.followUps[0].id}`, {
        data: { outcome: "settling_well", notes: "Loves Milo" },
      }),
    );
    expect(fu.followUps[0].outcome).toBe("settling_well");

    const closed = await expectData(
      await rescue.ctx.post(`${API}/cases/${done.caseId}/close`, { data: { outcome: "adopted" } }),
    );
    expect(closed.stage).toBe("closed");
    expect((await expectData(await owner.ctx.get(`${API}/animals/${luna.id}`))).status).toBe(
      "owned",
    );
  });

  test("applicant can withdraw; approved withdrawal releases the reservation", async () => {
    const pip = await listingByName("Pip");
    const owner = await apiAs("owner");
    const app = await expectData(
      await owner.ctx.post(`${API}/applications`, {
        data: { animalId: pip.id, answers: answers({ experience: "experienced" }) },
      }),
      201,
    );
    const rescue = await apiAs("manager");
    await expectData(
      await rescue.ctx.post(`${API}/applications/${app.id}/status`, {
        data: { status: "under_review" },
      }),
    );
    await expectData(
      await rescue.ctx.post(`${API}/applications/${app.id}/status`, {
        data: { status: "approved" },
      }),
    );
    const w = await expectData(await owner.ctx.post(`${API}/applications/${app.id}/withdraw`));
    expect(w.status).toBe("withdrawn");
    expect((await expectData(await rescue.ctx.get(`${API}/animals/${pip.id}`))).status).toBe(
      "ready",
    );
  });

  test("dashboards show applications to review and the owner's applications", async () => {
    const rescue = await apiAs("manager");
    const d = await expectData(await rescue.ctx.get(`${API}/dashboard`));
    expect(d.applicationsToReview).toBeGreaterThanOrEqual(1);
    const owner = await apiAs("owner2");
    const o = await expectData(await owner.ctx.get(`${API}/dashboard`));
    expect(o.applications.length).toBeGreaterThan(0);
  });
});
