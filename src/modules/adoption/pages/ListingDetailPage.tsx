import { Link, useParams } from "react-router-dom";
import { BadgeCheck, Heart, Home, Info } from "lucide-react";
import { useApplications, useListing } from "../api/adoptionApi";
import { SPECIES_LABEL, TRI_LABEL } from "@/modules/animal/constants";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { StatusPill } from "@/shared/components/StatusPill";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageLoader } from "@/shared/components/Skeleton";
import { useAppSelector } from "@/app/hooks";
import { ageFrom, formatDate, formatMoney } from "@/lib/utils";

export function ListingDetailPage() {
  const { id = "" } = useParams();
  const role = useAppSelector((s) => s.auth.user?.role);
  const { data: a, isLoading, error } = useListing(id);
  const { data: mine } = useApplications({ animal: id, open: true });
  if (isLoading) return <PageLoader />;
  if (error || !a)
    return (
      <EmptyState
        icon={Heart}
        title="This animal isn't available"
        body="They may have found a home already."
        action={
          <Link to="/adopt" className="nt-btn-primary">
            See other animals
          </Link>
        }
      />
    );
  const existing = role === "owner" ? mine?.[0] : undefined;
  const L = a.listing;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="nt-tile flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <AnimalAvatar name={a.name} species={a.species} photoUrl={a.photoUrl} size={120} />
          <div>
            <h1 className="nt-display text-4xl">{a.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {[
                a.breed || SPECIES_LABEL[a.species],
                ageFrom(a.dateOfBirth),
                a.sex !== "unknown" ? a.sex : null,
                a.colour,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-3 text-lg">{L.headline}</p>
          </div>
        </section>
        <section className="nt-tile">
          <h2 className="text-base font-semibold">About {a.name}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{L.description}</p>
        </section>
        <section className="nt-tile">
          <h2 className="text-base font-semibold">The home {a.name} needs</h2>
          <ul className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <Need
              ok={!L.needsGarden}
              text={L.needsGarden ? "A secure garden" : "No garden needed"}
            />
            <Need
              ok={!L.experiencedHomeOnly}
              text={L.experiencedHomeOnly ? "An experienced owner" : "Suits first-time owners too"}
            />
            <Need
              ok
              text={
                L.minChildAge ? `Children ${L.minChildAge}+ only` : "Fine with children of any age"
              }
            />
            <Need
              ok
              text={
                L.maxHoursAlone != null
                  ? `Alone no more than ${L.maxHoursAlone} hours`
                  : "Time alone: ask the rescue"
              }
            />
            <Need ok text={`With dogs: ${TRI_LABEL[a.behaviour.goodWithDogs]}`} />
            <Need ok text={`With cats: ${TRI_LABEL[a.behaviour.goodWithCats]}`} />
          </ul>
        </section>
      </div>

      <aside className="space-y-4">
        <section className="nt-tile space-y-3">
          {existing ? (
            <>
              <p className="text-sm">You've applied to adopt {a.name}.</p>
              <StatusPill status={existing.status} />
              <Link to={`/applications/${existing.id}`} className="nt-btn-secondary w-full">
                View your application
              </Link>
            </>
          ) : a.status === "reserved" ? (
            <p className="text-sm">{a.name} is reserved for another family right now.</p>
          ) : role === "owner" ? (
            <Link to={`/adopt/${a.id}/apply`} className="nt-btn-primary w-full">
              <Heart className="h-4 w-4" /> Apply to adopt {a.name}
            </Link>
          ) : role ? (
            <p className="text-sm text-muted-foreground">
              Applications are made from an owner & adopter account.
            </p>
          ) : (
            <Link to="/register" className="nt-btn-primary w-full">
              Create an account to apply
            </Link>
          )}
          {L.adoptionFee != null && (
            <p className="flex gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Adoption donation {formatMoney(L.adoptionFee)}, paid to the rescue at handover.
              Nurtail never takes payment for an animal.
            </p>
          )}
        </section>
        {a.organisation && (
          <section className="nt-tile space-y-2">
            <p className="nt-eyebrow">Cared for by</p>
            <p className="flex items-center gap-2 font-semibold">
              <Home className="h-4 w-4 text-primary" /> {a.organisation.name}
            </p>
            {a.organisation.verified && (
              <p className="flex items-center gap-1.5 text-sm text-primary">
                <BadgeCheck className="h-4 w-4" /> Verified by Nurtail
                {a.organisation.verifiedSince
                  ? ` since ${formatDate(a.organisation.verifiedSince)}`
                  : ""}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Verified means Nurtail has checked their registration, insurance and safeguarding
              policy.
            </p>
            {a.organisation.description && <p className="text-sm">{a.organisation.description}</p>}
          </section>
        )}
      </aside>
    </div>
  );
}

function Need({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={ok ? "text-primary" : "text-warning"} aria-hidden>
        ●
      </span>
      {text}
    </li>
  );
}
