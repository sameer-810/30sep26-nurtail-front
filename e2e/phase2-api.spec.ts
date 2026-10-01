import { test, expect } from "@playwright/test";
import { API, RUN_TAG, apiAs, expectData } from "./helpers";

/**
 * Phase 2 — Rescue case engine: intake, pipeline, readiness gate, fostering,
 * daily logs and welfare escalation, tasks and closure.
 */
async function intake(ctx: any, overrides: Record<string, unknown> = {}) {
  return expectData(
    await ctx.post(`${API}/cases/intake`, {
      data: {
        animal: { name: `${RUN_TAG} Wren`, species: "dog", breed: "Collie", sex: "female" },
        source: "stray",
        sourceDetails: { foundLocation: "Castle Park", postcode: "BS1 3XX" },
        priority: "routine",
        intakeCondition: "Bright, a little thin",
        immediateNeeds: ["Vet check"],
        ...overrides,
      },
    }),
    201,
  );
}

test.describe("Phase 2 · API", () => {
  test("intake opens a case with a reference, first tasks and an audit event", async () => {
    const { ctx } = await apiAs("staff");
    const c = await intake(ctx);
    expect(c.ref).toMatch(/^NT-C-\d{6}$/);
    expect(c.stage).toBe("intake");
    expect(c.animal.status).toBe("intake");
    const titles = c.tasks.map((t: any) => t.title);
    expect(titles.some((t: string) => t.startsWith("Scan"))).toBe(true); // no microchip given
    expect(titles.some((t: string) => t.startsWith("Vet health check"))).toBe(true);
    const tl = await expectData(await ctx.get(`${API}/cases/${c.id}/timeline`));
    expect(tl[0].action).toBe("case.intake");
  });

  test("an emergency intake alerts the whole team", async () => {
    const staff = await apiAs("staff");
    await intake(staff.ctx, {
      priority: "emergency",
      animal: { name: `${RUN_TAG} Flint`, species: "cat" },
    });
    const manager = await apiAs("manager");
    const notes = await expectData(await manager.ctx.get(`${API}/notifications`));
    expect(notes.some((n: any) => n.title === `Emergency intake: ${RUN_TAG} Flint`)).toBe(true);
  });

  test("only rescue staff can intake; other organisations can't see the case", async () => {
    for (const who of ["owner", "foster", "vendor"] as const) {
      const { ctx } = await apiAs(who);
      const res = await ctx.post(`${API}/cases/intake`, {
        data: { animal: { name: "x", species: "dog" }, source: "stray" },
      });
      expect(res.status(), who).toBe(403);
    }
    const hope = await apiAs("manager");
    const c = await intake(hope.ctx);
    const northern = await apiAs("northern");
    expect((await northern.ctx.get(`${API}/cases/${c.id}`)).status()).toBe(404);
    const northernList = await expectData(await northern.ctx.get(`${API}/cases`));
    expect(northernList.length).toBe(0);
  });

  test("readiness gate: Ready is refused until every item is ticked; animal status follows the stage", async () => {
    const { ctx } = await apiAs("manager");
    const c = await intake(ctx, {
      animal: { name: `${RUN_TAG} Moss`, species: "dog", microchip: "826098000777001" },
    });
    await expectData(await ctx.post(`${API}/cases/${c.id}/move`, { data: { stage: "care" } }));
    const afterCare = await expectData(await ctx.get(`${API}/animals/${c.animal.id}`));
    expect(afterCare.status).toBe("in_care");

    const blocked = await ctx.post(`${API}/cases/${c.id}/move`, { data: { stage: "ready" } });
    expect(blocked.status()).toBe(400);
    const body = await blocked.json();
    expect(body.error.code).toBe("READINESS_INCOMPLETE");
    expect(body.error.details.missing).not.toContain("microchipped"); // chip given at intake

    for (const item of body.error.details.missing) {
      await expectData(
        await ctx.post(`${API}/cases/${c.id}/readiness`, { data: { item, done: true } }),
      );
    }
    const ready = await expectData(
      await ctx.post(`${API}/cases/${c.id}/move`, { data: { stage: "ready" } }),
    );
    expect(ready.stage).toBe("ready");
    const animal = await expectData(await ctx.get(`${API}/animals/${c.animal.id}`));
    expect(animal.status).toBe("ready");

    expect(
      (await ctx.post(`${API}/cases/${c.id}/move`, { data: { stage: "closed" } })).status(),
    ).toBe(400);
    expect(
      (await ctx.post(`${API}/cases/${c.id}/move`, { data: { stage: "ready" } })).status(),
    ).toBe(409);
  });

  test("fostering: placement over capacity warns, notifies the carer; handover needs a condition", async () => {
    const { ctx } = await apiAs("manager");
    const c = await intake(ctx, { animal: { name: `${RUN_TAG} Tansy`, species: "cat" } });
    await expectData(await ctx.post(`${API}/cases/${c.id}/move`, { data: { stage: "care" } }));
    const fosters = await expectData(await ctx.get(`${API}/fosters`));
    const daniel = fosters.find((f: any) => f.name === "Daniel Price"); // capacity 1, already has Hazel

    const res = await ctx.post(`${API}/cases/${c.id}/foster`, {
      data: { fosterId: daniel.id, note: "Needs quiet" },
    });
    const body = await res.json();
    expect(res.status()).toBe(200);
    expect(body.meta.warning).toContain("capacity");
    expect(body.data.foster.name).toBe("Daniel Price");
    const animal = await expectData(await ctx.get(`${API}/animals/${c.animal.id}`));
    expect(animal.status).toBe("fostered");

    const foster2 = await apiAs("foster2");
    const mine = await expectData(await foster2.ctx.get(`${API}/animals`));
    expect(mine.map((a: any) => a.name)).toContain(`${RUN_TAG} Tansy`);
    const notes = await expectData(await foster2.ctx.get(`${API}/notifications`));
    expect(notes.some((n: any) => n.title.includes(`${RUN_TAG} Tansy`))).toBe(true);

    expect(
      (await ctx.post(`${API}/cases/${c.id}/foster/end`, { data: { condition: "" } })).status(),
    ).toBe(400);
    const ended = await expectData(
      await ctx.post(`${API}/cases/${c.id}/foster/end`, {
        data: { condition: "Healthy and settled" },
      }),
    );
    expect(ended.foster).toBeNull();
    expect((await expectData(await ctx.get(`${API}/animals/${c.animal.id}`))).status).toBe(
      "in_care",
    );
  });

  test("foster daily log and welfare escalation create an urgent task and alert staff", async () => {
    const foster = await apiAs("foster");
    const [biscuit] = await expectData(await foster.ctx.get(`${API}/animals`));
    const plain = await expectData(
      await foster.ctx.post(`${API}/animals/${biscuit.id}/care-logs`, {
        data: { appetite: "good", behaviour: `${RUN_TAG} calm` },
      }),
      201,
    );
    expect(plain.welfareFlag).toBe(false);

    const noConcern = await foster.ctx.post(`${API}/animals/${biscuit.id}/care-logs`, {
      data: { appetite: "poor", welfareFlag: true },
    });
    expect(noConcern.status()).toBe(400);

    const staff = await apiAs("staff");
    const before = await expectData(await staff.ctx.get(`${API}/dashboard`));
    const flagged = await expectData(
      await foster.ctx.post(`${API}/animals/${biscuit.id}/care-logs`, {
        data: {
          appetite: "not_eating",
          welfareFlag: true,
          welfareConcern: `${RUN_TAG} refusing food`,
        },
      }),
      201,
    );
    expect(flagged.taskId).toBeTruthy();
    const after = await expectData(await staff.ctx.get(`${API}/dashboard`));
    expect(after.welfareFlags).toBe(before.welfareFlags + 1);
    const tasks = await expectData(await staff.ctx.get(`${API}/tasks?scope=all`));
    const t = tasks.find((x: any) => x.title.includes(`${RUN_TAG} refusing food`));
    expect(t.priority).toBe("urgent");
    expect(t.source).toBe("welfare_flag");
    const notes = await expectData(await staff.ctx.get(`${API}/notifications`));
    expect(notes.some((n: any) => n.title === "Welfare concern raised for Biscuit")).toBe(true);

    // A foster can't log for an animal that isn't with them.
    const hope = await apiAs("manager");
    const [luna] = await expectData(await hope.ctx.get(`${API}/animals?search=Luna`));
    expect(
      (
        await foster.ctx.post(`${API}/animals/${luna.id}/care-logs`, { data: { appetite: "good" } })
      ).status(),
    ).toBe(404);
  });

  test("tasks: add and complete, audited", async () => {
    const { ctx } = await apiAs("manager");
    const c = await intake(ctx);
    const t = await expectData(
      await ctx.post(`${API}/cases/${c.id}/tasks`, {
        data: { title: `${RUN_TAG} home check`, priority: "urgent" },
      }),
      201,
    );
    const done = await expectData(
      await ctx.patch(`${API}/tasks/${t.id}`, { data: { status: "done" } }),
    );
    expect(done.status).toBe("done");
    expect(done.completedByName).toBe("Emma Clarke");
    const tl = await expectData(await ctx.get(`${API}/cases/${c.id}/timeline`));
    expect(tl.some((e: any) => e.action === "task.completed")).toBe(true);
  });

  test("closing requires an outcome, locks the case and sets the animal's final status", async () => {
    const { ctx } = await apiAs("manager");
    const c = await intake(ctx);
    expect((await ctx.post(`${API}/cases/${c.id}/close`, { data: {} })).status()).toBe(400);
    const closed = await expectData(
      await ctx.post(`${API}/cases/${c.id}/close`, {
        data: { outcome: "reunited", notes: "Owner found via microchip" },
      }),
    );
    expect(closed.stage).toBe("closed");
    expect(closed.tasks.every((t: any) => t.status === "done")).toBe(true);
    expect((await expectData(await ctx.get(`${API}/animals/${c.animal.id}`))).status).toBe(
      "reunited",
    );
    expect(
      (await ctx.post(`${API}/cases/${c.id}/move`, { data: { stage: "care" } })).status(),
    ).toBe(409);
    expect(
      (await ctx.patch(`${API}/cases/${c.id}`, { data: { priority: "urgent" } })).status(),
    ).toBe(409);
  });

  test("board counts and dashboard KPIs reflect the pipeline; admin reads but can't move", async () => {
    const { ctx } = await apiAs("manager");
    const res = await ctx.get(`${API}/cases`);
    const body = await res.json();
    expect(body.meta.counts.ready).toBeGreaterThanOrEqual(4);
    expect(body.data[0].priority).toBe("emergency"); // emergencies first
    const dash = await expectData(await ctx.get(`${API}/dashboard`));
    expect(dash.kpis.inCare).toBeGreaterThanOrEqual(10);
    expect(dash.pipeline.care).toBeGreaterThanOrEqual(4);

    const admin = await apiAs("admin");
    const all = await expectData(await admin.ctx.get(`${API}/cases`));
    expect(all.length).toBeGreaterThan(0);
    expect(
      (
        await admin.ctx.post(`${API}/cases/${all[0].id}/move`, { data: { stage: "care" } })
      ).status(),
    ).toBe(403);
  });
});
