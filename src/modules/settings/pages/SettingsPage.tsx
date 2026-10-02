import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Moon, Sun } from "lucide-react";
import { authApi } from "@/modules/auth/api/authApi";
import { setUser } from "@/modules/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useTheme } from "@/app/theme";
import { PageHeader } from "@/shared/components/PageHeader";
import { Field, Input, Textarea, CheckboxRow } from "@/shared/components/Field";
import { toast } from "@/shared/lib/toast";
import { getApiErrorMessage } from "@/shared/api/http";
import { ROLE_LABELS } from "@/shared/lib/roles";

export function SettingsPage() {
  const user = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState({
    name: user.name,
    phone: user.phone ?? "",
    postcode: user.postcode ?? "",
    capacity: user.fosterProfile?.capacity ?? 1,
    hasGarden: user.fosterProfile?.hasGarden ?? false,
    fosterNotes: user.fosterProfile?.notes ?? "",
    practiceName: user.vetProfile?.practiceName ?? "",
    rcvsNumber: user.vetProfile?.rcvsNumber ?? "",
  });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });

  const saveProfile = useMutation({
    mutationFn: () =>
      authApi.updateMe({
        name: profile.name,
        phone: profile.phone,
        postcode: profile.postcode,
        ...(user.role === "foster"
          ? {
              fosterProfile: {
                capacity: Number(profile.capacity),
                hasGarden: profile.hasGarden,
                notes: profile.fosterNotes,
              },
            }
          : {}),
        ...(user.role === "vet"
          ? { vetProfile: { practiceName: profile.practiceName, rcvsNumber: profile.rcvsNumber } }
          : {}),
      }),
    onSuccess: (u) => {
      dispatch(setUser(u));
      toast.success("Profile saved");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const changePw = useMutation({
    mutationFn: () => authApi.changePassword(pw),
    onSuccess: () => {
      setPw({ currentPassword: "", newPassword: "" });
      toast.success("Password changed");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const upd =
    (k: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setProfile((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description={`Signed in as ${user.email} · ${ROLE_LABELS[user.role]}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          className="nt-tile space-y-4 lg:col-span-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile.mutate();
          }}
        >
          <h2 className="text-base font-semibold">Your profile</h2>
          <Field id="s-name" label="Full name" required>
            <Input id="s-name" value={profile.name} onChange={upd("name")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="s-phone" label="Phone">
              <Input id="s-phone" type="tel" value={profile.phone} onChange={upd("phone")} />
            </Field>
            <Field id="s-postcode" label="Postcode">
              <Input
                id="s-postcode"
                value={profile.postcode}
                onChange={upd("postcode")}
                className="uppercase"
              />
            </Field>
          </div>

          {user.role === "foster" && (
            <fieldset className="space-y-3 rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-semibold">Foster declarations</legend>
              <Field id="s-capacity" label="How many animals can you care for at once?" required>
                <Input
                  id="s-capacity"
                  type="number"
                  min={0}
                  max={10}
                  value={profile.capacity}
                  onChange={upd("capacity")}
                  className="w-28"
                />
              </Field>
              <CheckboxRow
                id="s-garden"
                checked={profile.hasGarden}
                onChange={(v) => setProfile((p) => ({ ...p, hasGarden: v }))}
                label="I have a secure garden"
              />
              <Field id="s-fnotes" label="Anything your rescue should know">
                <Textarea id="s-fnotes" value={profile.fosterNotes} onChange={upd("fosterNotes")} />
              </Field>
            </fieldset>
          )}

          {user.role === "vet" && (
            <fieldset className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
              <legend className="px-1 text-sm font-semibold">Practice</legend>
              <Field id="s-practice" label="Practice name">
                <Input
                  id="s-practice"
                  value={profile.practiceName}
                  onChange={upd("practiceName")}
                />
              </Field>
              <Field id="s-rcvs" label="RCVS number">
                <Input id="s-rcvs" value={profile.rcvsNumber} onChange={upd("rcvsNumber")} />
              </Field>
            </fieldset>
          )}

          <button type="submit" className="nt-btn-primary" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? "Saving…" : "Save profile"}
          </button>
        </form>

        <div className="space-y-6">
          <section className="nt-tile space-y-3">
            <h2 className="text-base font-semibold">Appearance</h2>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Theme">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={theme === t}
                  onClick={() => setTheme(t)}
                  className={`flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm font-medium ${
                    theme === t
                      ? "border-primary bg-accent text-primary"
                      : "border-border hover:shadow-lift"
                  }`}
                >
                  {t === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {t === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
          </section>

          <form
            className="nt-tile space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              changePw.mutate();
            }}
          >
            <h2 className="text-base font-semibold">Change password</h2>
            <Field id="s-cur" label="Current password" required>
              <Input
                id="s-cur"
                type="password"
                autoComplete="current-password"
                value={pw.currentPassword}
                onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
              />
            </Field>
            <Field id="s-new" label="New password" hint="At least 12 characters." required>
              <Input
                id="s-new"
                type="password"
                autoComplete="new-password"
                value={pw.newPassword}
                onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
                hasHint
              />
            </Field>
            <button
              type="submit"
              className="nt-btn-secondary w-full"
              disabled={changePw.isPending || pw.newPassword.length < 12}
            >
              Change password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
