import { test, expect } from "@playwright/test";
import { API, ACCOUNTS, PASSWORD, RUN_TAG, anonApi, apiAs, expectData } from "./helpers";

/**
 * Phase 0 — Foundation: auth + RBAC + tenancy, organisations, audit store.
 */
test.describe("Phase 0 · API", () => {
  test("every seeded role can sign in and /me reflects role + organisation", async () => {
    for (const who of ["admin", "manager", "foster", "owner", "vendor", "vet"] as const) {
      const { ctx, user } = await apiAs(who);
      const me = await expectData(await ctx.get(`${API}/auth/me`));
      expect(me.email).toBe(ACCOUNTS[who]);
      expect(me.role).toBe(user.role);
      expect(me).not.toHaveProperty("password");
      if (who === "manager") expect(me.organisation.name).toBe("Hope Hollow Animal Rescue");
      await ctx.dispose();
    }
  });

  test("login failure is generic and does not reveal whether the email exists", async () => {
    const ctx = await anonApi();
    const a = await ctx.post(`${API}/auth/login`, {
      data: { email: ACCOUNTS.owner, password: "wrong-password-123" },
    });
    const b = await ctx.post(`${API}/auth/login`, {
      data: { email: "nobody@nowhere.test", password: "wrong-password-123" },
    });
    expect(a.status()).toBe(401);
    expect(b.status()).toBe(401);
    expect((await a.json()).error.message).toBe((await b.json()).error.message);
  });

  test("rescue sign-up creates an unverified organisation with the user as manager", async () => {
    const ctx = await anonApi();
    const email = `${RUN_TAG.toLowerCase()}-rescue@e2e.test`;
    const data = await expectData(
      await ctx.post(`${API}/auth/register`, {
        data: {
          name: `${RUN_TAG} Founder`,
          email,
          password: "a-long-enough-pass",
          role: "rescue",
          organisation: { name: `${RUN_TAG} Rescue`, type: "rescue", postcode: "bs14aa" },
        },
      }),
      201,
    );
    expect(data.user.orgRole).toBe("manager");
    expect(data.user.organisation.verificationStatus).toBe("unverified");

    // Duplicate email is refused.
    const dup = await ctx.post(`${API}/auth/register`, {
      data: { name: "x", email, password: "a-long-enough-pass", role: "owner" },
    });
    expect(dup.status()).toBe(409);
  });

  test("sign-up validation: short password, missing org, foster self-sign-up refused", async () => {
    const ctx = await anonApi();
    const bad = await ctx.post(`${API}/auth/register`, {
      data: { name: "x", email: `${RUN_TAG}-v@e2e.test`, password: "short", role: "rescue" },
    });
    expect(bad.status()).toBe(400);
    const paths = (await bad.json()).error.details.map((d: any) => d.path);
    expect(paths).toContain("body.password");
    expect(paths).toContain("body.organisation");

    const foster = await ctx.post(`${API}/auth/register`, {
      data: {
        name: "x",
        email: `${RUN_TAG}-f@e2e.test`,
        password: "a-long-enough-pass",
        role: "foster",
      },
    });
    expect(foster.status()).toBe(400);
  });

  test("RBAC: owner cannot list users or organisations; admin can", async () => {
    const owner = await apiAs("owner");
    expect((await owner.ctx.get(`${API}/auth/users`)).status()).toBe(403);
    expect((await owner.ctx.get(`${API}/organisations`)).status()).toBe(403);
    const admin = await apiAs("admin");
    const orgs = await expectData(await admin.ctx.get(`${API}/organisations?limit=50`));
    expect(orgs.length).toBeGreaterThanOrEqual(4);
  });

  test("tenancy: a rescue manager only sees and manages their own organisation", async () => {
    const hope = await apiAs("manager");
    const members = await expectData(await hope.ctx.get(`${API}/auth/users?limit=100`));
    expect(members.length).toBeGreaterThan(0);
    for (const m of members) expect(m.organisation?.name).toBe("Hope Hollow Animal Rescue");

    // Another organisation's record reads as not found, not forbidden.
    const northern = await apiAs("northern");
    const hopeOrgId = hope.user.organisation.id;
    expect((await northern.ctx.get(`${API}/organisations/${hopeOrgId}`)).status()).toBe(404);
  });

  test("manager can invite staff and fosters but not admins or vendors", async () => {
    const { ctx } = await apiAs("manager");
    const ok = await ctx.post(`${API}/auth/users`, {
      data: {
        name: `${RUN_TAG} Fosterer`,
        email: `${RUN_TAG.toLowerCase()}-foster@e2e.test`,
        password: "temp-password-123",
        role: "foster",
      },
    });
    const created = await expectData(ok, 201);
    expect(created.organisation.name).toBe("Hope Hollow Animal Rescue");

    const admin = await ctx.post(`${API}/auth/users`, {
      data: {
        name: "x",
        email: `${RUN_TAG.toLowerCase()}-adm@e2e.test`,
        password: "temp-password-123",
        role: "admin",
      },
    });
    expect(admin.status()).toBe(403);
    const vendor = await ctx.post(`${API}/auth/users`, {
      data: {
        name: "x",
        email: `${RUN_TAG.toLowerCase()}-ven@e2e.test`,
        password: "temp-password-123",
        role: "vendor",
      },
    });
    expect(vendor.status()).toBe(403);
  });

  test("the last active admin cannot be deactivated", async () => {
    const { ctx, user } = await apiAs("admin");
    const self = await ctx.patch(`${API}/auth/users/${user.id}`, { data: { isActive: false } });
    expect(self.status()).toBe(400);
  });

  test("public directory lists only verified organisations", async () => {
    const ctx = await anonApi();
    const orgs = await expectData(await ctx.get(`${API}/organisations/public`));
    expect(orgs.length).toBeGreaterThan(0);
    for (const o of orgs) {
      expect(o.verified).toBe(true);
      expect(o).not.toHaveProperty("evidence");
    }
    expect(orgs.map((o: any) => o.name)).not.toContain("Northern Paws Sanctuary");
  });

  test("audit trail is scoped, immutable and passes the integrity check", async () => {
    const admin = await apiAs("admin");
    const events = await expectData(await admin.ctx.get(`${API}/audit?limit=50`));
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].hash).toMatch(/^[a-f0-9]{64}$/);

    const integrity = await expectData(await admin.ctx.get(`${API}/audit/integrity`));
    expect(integrity.valid).toBe(true);
    expect(integrity.checked).toBeGreaterThan(0);

    // Owners only see their own actions; they cannot run the integrity check.
    const owner = await apiAs("owner");
    const mine = await expectData(await owner.ctx.get(`${API}/audit?limit=50`));
    for (const e of mine) expect(e.actorId).toBe(owner.user.id);
    expect((await owner.ctx.get(`${API}/audit/integrity`)).status()).toBe(403);
  });

  test("password change requires the current password", async () => {
    const { ctx } = await apiAs("owner2");
    const wrong = await ctx.post(`${API}/auth/me/password`, {
      data: { currentPassword: "nope", newPassword: "another-long-pass" },
    });
    expect(wrong.status()).toBe(400);
    const ok = await ctx.post(`${API}/auth/me/password`, {
      data: { currentPassword: PASSWORD, newPassword: PASSWORD },
    });
    expect(ok.status()).toBe(200);
  });

  test("notifications endpoint returns an unread count", async () => {
    const { ctx } = await apiAs("manager");
    const res = await ctx.get(`${API}/notifications`);
    expect(res.status()).toBe(200);
    expect(typeof (await res.json()).meta.unread).toBe("number");
  });
});
