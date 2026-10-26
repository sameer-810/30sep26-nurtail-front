import { ArrowLeft } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Privacy notice for the interest form only. Plain-English UK GDPR basics:
 * what, why, lawful basis, retention, rights. The legal entity and contact
 * details are left for the founder to confirm before launch.
 */
export function Privacy() {
  const contact = CONTACT_EMAIL ? (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-semibold text-forest underline underline-offset-2"
    >
      {CONTACT_EMAIL}
    </a>
  ) : (
    "replying to any email we send you"
  );
  return (
    <main id="main" className="container-page max-w-3xl py-16 sm:py-24">
      <a
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Nurtail
      </a>
      <h1 className="display mt-6 text-[2.4rem] leading-tight sm:text-[3rem]">Privacy notice</h1>
      <p className="mt-3 text-ink-muted">For people who register their interest on this website.</p>

      <div className="prose-nurtail mt-10 space-y-8 text-[17px] leading-relaxed">
        <section>
          <h2>What we collect</h2>
          <p>
            Your name, email address and who you are (for example, a rescue or an owner). If you
            choose to, your organisation, postcode, roughly how many animals you help each year, and
            your message. We also record the date you agreed to be contacted and the exact wording
            you agreed to.
          </p>
        </section>
        <section>
          <h2>Why we use it</h2>
          <p>
            Only to reply to you about Nurtail's pilot and launch — for example, to arrange a call
            with a founding rescue partner, or to tell you when Nurtail opens for you. We don't use
            it for advertising, and we never sell or share it.
          </p>
        </section>
        <section>
          <h2>Our lawful basis</h2>
          <p>
            Your consent, which you give by ticking the box on the form. You can withdraw it at any
            time.
          </p>
        </section>
        <section>
          <h2>How long we keep it</h2>
          <p>
            Until Nurtail launches for you and you've decided whether to join, or until you ask us
            to delete it — whichever comes first.
          </p>
        </section>
        <section>
          <h2>Where it's stored</h2>
          <p>
            On secure, access-controlled servers. Only the small Nurtail team can see it, and every
            change to it is logged.
          </p>
        </section>
        <section>
          <h2>Your rights</h2>
          <p>
            You can ask to see, correct or delete your details at any time by {contact}. If you're
            unhappy with how we've handled your information, you can complain to the Information
            Commissioner's Office at{" "}
            <a
              href="https://ico.org.uk/make-a-complaint/"
              className="font-semibold text-forest underline underline-offset-2"
            >
              ico.org.uk
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
