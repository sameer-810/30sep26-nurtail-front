import { Link } from "react-router-dom";
import { Heart, Megaphone, PawPrint, ShieldAlert, Store } from "lucide-react";
import { Greeting, QuickAction } from "./Greeting";
import { useDashboard, type OwnerSummary } from "../dashboardApi";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { StatusPill } from "@/shared/components/StatusPill";
import { relativeDays } from "@/lib/utils";

/** The blueprint's owner home: "How are your animals today?" — animals, what's due, three big doors. */
export function OwnerHome() {
  const { data } = useDashboard<OwnerSummary>();
  const lost = data?.animals.filter((a) => a.lostMode) ?? [];
  return (
    <div className="space-y-8">
      <Greeting subtitle="How are your animals today?" />

      {lost.map((a) => (
        <Link
          key={a.id}
          to={`/animals/${a.id}?tab=passport`}
          className="nt-callout flex items-center gap-3 border-brand-coral/60 bg-[#FDEAE6] dark:bg-brand-coral/10"
        >
          <ShieldAlert className="h-5 w-5 text-brand-coral-ink dark:text-brand-coral" />
          <span className="text-sm">
            <strong>{a.name} is marked as lost.</strong> Their passport is in lost mode. Tap to
            update or mark them home.
          </span>
        </Link>
      ))}

      {data?.animals.length ? (
        <section aria-labelledby="h-animals">
          <h2 id="h-animals" className="mb-3 text-base font-semibold">
            Your animals
          </h2>
          <div className="nt-chips">
            {data.animals.map((a) => (
              <Link
                key={a.id}
                to={`/animals/${a.id}`}
                className="nt-card flex w-56 shrink-0 items-center gap-3"
              >
                <AnimalAvatar name={a.name} species={a.species} photoUrl={a.photoUrl} size={48} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{a.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.passportActive ? "Passport active" : "Passport off"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickAction
          to="/animals"
          icon={PawPrint}
          title="Health"
          body="Vaccinations, treatments and your Safety Passport."
          tint="mint"
        />
        <QuickAction
          to="/reports/new"
          icon={Megaphone}
          title="Lost / found"
          body="Report a lost pet, or an animal that needs help."
          tint="coral"
        />
        <QuickAction
          to="/adopt"
          icon={Heart}
          title="Adopt"
          body="Meet animals from verified UK rescues."
          tint="beige"
        />
        <QuickAction
          to="/services"
          icon={Store}
          title="Care services"
          body="Verified walkers, groomers and trainers near you."
          tint="sky"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="nt-tile">
          <h2 className="text-base font-semibold">Coming up</h2>
          {!data?.upcoming.length ? (
            <p className="mt-2 text-sm text-muted-foreground">Nothing due in the next 30 days.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {data.upcoming.map((u) => {
                const overdue = new Date(u.dueDate) < new Date();
                return (
                  <li
                    key={`${u.animal}-${u.title}`}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <Link
                      to={`/animals/${u.animal}?tab=health`}
                      className="min-w-0 hover:underline"
                    >
                      <strong>{u.animalName}</strong> — {u.title}
                    </Link>
                    <StatusPill
                      status={overdue ? "overdue" : "due_soon"}
                      label={overdue ? "Overdue" : relativeDays(u.dueDate)}
                      size="sm"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        {data?.applications?.length ? (
          <section className="nt-tile">
            <h2 className="text-base font-semibold">Your applications</h2>
            <ul className="mt-3 divide-y divide-border">
              {data.applications.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link to={`/applications/${a.id}`} className="font-semibold hover:underline">
                    {a.animalName}
                  </Link>
                  <StatusPill status={a.status} size="sm" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
