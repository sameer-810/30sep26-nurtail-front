import { useState } from "react";
import { useCreateMember, type CreateMemberPayload } from "@/modules/auth/api/authApi";
import { Modal } from "@/shared/components/Modal";
import { ErrorSummary, Field, Input, Select } from "@/shared/components/Field";
import { getApiErrorMessage, getApiFieldErrors } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import type { Role } from "@/modules/auth/authSlice";

/**
 * Add someone to an organisation (manager) or to the platform (admin). The
 * prototype sets an initial password here; the MVP sends an invite email with
 * a set-password link instead.
 */
export function MemberDialog({
  open,
  onOpenChange,
  roleOptions,
  organisationId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roleOptions: { value: Role; label: string }[];
  organisationId?: string;
}) {
  const create = useCreateMember();
  const [v, setV] = useState<CreateMemberPayload>({
    name: "",
    email: "",
    password: "",
    role: roleOptions[0]?.value ?? "owner",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit() {
    const e: Record<string, string> = {};
    if (!v.name.trim()) e["m-name"] = "Enter their name";
    if (!/^\S+@\S+\.\S+$/.test(v.email)) e["m-email"] = "Enter a valid email address";
    if (v.password.length < 12)
      e["m-password"] = "Temporary password must be at least 12 characters";
    setErrors(e);
    if (Object.keys(e).length) return;
    create.mutate(
      { ...v, organisation: organisationId },
      {
        onSuccess: (u) => {
          toast.success(`${u.name} added`);
          setV({ name: "", email: "", password: "", role: roleOptions[0]?.value ?? "owner" });
          onOpenChange(false);
        },
        onError: (err) => {
          const f = getApiFieldErrors(err);
          setErrors(
            Object.keys(f).length
              ? Object.fromEntries(Object.entries(f).map(([k, m]) => [`m-${k}`, m]))
              : { form: getApiErrorMessage(err) },
          );
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add a team member"
      description="They can sign in straight away with the temporary password you set, and should change it from Settings."
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            onClick={submit}
            disabled={create.isPending}
          >
            {create.isPending ? "Adding…" : "Add member"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorSummary errors={errors} />
        <Field id="m-name" label="Full name" error={errors["m-name"]} required>
          <Input
            id="m-name"
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
            invalid={!!errors["m-name"]}
          />
        </Field>
        <Field id="m-email" label="Email address" error={errors["m-email"]} required>
          <Input
            id="m-email"
            type="email"
            value={v.email}
            onChange={(e) => setV({ ...v, email: e.target.value })}
            invalid={!!errors["m-email"]}
          />
        </Field>
        <Field id="m-role" label="Role" required>
          <Select
            id="m-role"
            value={v.role}
            onChange={(e) => setV({ ...v, role: e.target.value as Role })}
          >
            {roleOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          id="m-password"
          label="Temporary password"
          hint="At least 12 characters. Share it with them securely."
          error={errors["m-password"]}
          required
        >
          <Input
            id="m-password"
            type="text"
            autoComplete="off"
            value={v.password}
            onChange={(e) => setV({ ...v, password: e.target.value })}
            invalid={!!errors["m-password"]}
            hasHint
          />
        </Field>
      </div>
    </Modal>
  );
}
