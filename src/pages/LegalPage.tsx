import React from "react";
import {
  Scroll,
  ShieldCheck,
  Database,
  Eye,
  Warning,
} from "@phosphor-icons/react";

/**
 * Terms, privacy and the other policies, in one page with anchored sections.
 *
 * The privacy text describes what this build actually does rather than the
 * usual boilerplate: there is no backend, the only outbound request is to the
 * World Bank, and everything a person types is held in their own browser. Each
 * claim here was checked against the source, so if the app gains a server or
 * an analytics script this page has to be revisited.
 */

const EFFECTIVE = "8 September 2026";

/** How the accessibility claim below was arrived at. */
const AUDIT = { tool: "4.10.2", date: "8 September 2026" };

/**
 * Known WCAG failures, as measured. Listing them is what an accessibility
 * statement is for; claiming conformance the audit contradicts is not.
 */
const KNOWN_ISSUES = [
  {
    criterion: "1.4.3 Contrast (Minimum) — AA",
    detail:
      "Some small text uses status colours — greens, reds, ambers for values and deltas — that fall below the 4.5:1 ratio against a white background. This affects figures on the dashboard, countries, economies and crime pages in light mode. The value is always available as text and never conveyed by colour alone, but the contrast itself is short of the standard.",
  },
  {
    criterion: "1.1.1 Non-text Content — A",
    detail:
      "Segments inside some charts on the crime page are drawn without text alternatives of their own. The same figures appear as labelled text next to the chart.",
  },
  {
    criterion: "2.1.1 Keyboard — A",
    detail:
      "One scrollable list on the crime page cannot be scrolled by keyboard alone, because the region is not focusable.",
  },
  {
    criterion: "2.5.8 Target Size (Minimum) — AA (WCAG 2.2)",
    detail:
      "At least one inline source link is smaller than the 24×24 pixel minimum.",
  },
];

/** The keys this app writes, so the privacy section can be specific. */
const STORED_KEYS = [
  ["cs-display-name", "The name shown in the header"],
  ["cs-email", "The email on the profile screen"],
  ["cs-username", "The chosen username"],
  ["cs-profile-photo", "The avatar image, downscaled in the browser"],
  ["cs-avatar-color", "The avatar colour, or the glass option"],
  ["cs-theme", "Light or dark"],
  ["cs-filters-open", "Whether the filter row is folded away"],
  ["cs_pinned_countries", "Countries pinned to the dashboard strip"],
  ["cs_pinned_states", "States pinned to the dashboard strip"],
] as const;

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="bg-card border border-border rounded-2xl p-6 scroll-mt-24"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-secondary">{icon}</span>
        <h2 className="text-lg font-bold font-sans text-foreground">{title}</h2>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-sans leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[13px] font-bold font-sans text-foreground mt-2">
      {children}
    </h3>
  );
}

export function LegalPage() {
  const sections = [
    { id: "terms", label: "Terms of Use" },
    { id: "privacy", label: "Privacy & Your Data" },
    { id: "sources", label: "Data & Accuracy" },
    { id: "accessibility", label: "Accessibility" },
    { id: "gdpr", label: "Your Rights (GDPR)" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-4xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-sans text-foreground">
            Terms &amp; Policies
          </h1>
          <p className="text-muted-foreground text-sm font-sans">
            How CommonSphere may be used, what happens to your data, and where
            the numbers come from
          </p>
          <p className="text-[11px] font-mono text-muted-foreground mt-2">
            Effective {EFFECTIVE}
          </p>
        </div>

        {/* ── Jump links ── */}
        <nav
          aria-label="Sections"
          className="flex flex-wrap items-center gap-2 mb-6"
        >
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-3 py-1 rounded-full text-[11px] font-medium font-sans border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-4">
          {/* ── Terms ── */}
          <Section
            id="terms"
            icon={<Scroll size={18} weight="fill" />}
            title="Terms of Use"
          >
            <P>
              CommonSphere presents public-interest data — economies, states,
              countries, cities, policy, conflict and environmental indicators —
              for research and reference. Using the site means accepting the
              terms on this page.
            </P>

            <H>What you may do</H>
            <P>
              Read, search, compare and export the data for personal, academic,
              journalistic or professional research, including commercial
              research. Exported CSVs are yours to keep and cite. Where a figure
              carries a source, cite that source rather than this site, since
              the underlying publishers set their own licences.
            </P>

            <H>What you may not do</H>
            <P>
              Do not present the site's figures as your own original
              measurements, scrape it in a way that degrades it for others, or
              re-publish it as a competing mirror. Do not use it to make
              decisions that require verified, current data — see the accuracy
              section below.
            </P>

            <H>No warranty</H>
            <P>
              The site is provided as-is. Figures are gathered from public
              sources and curated datasets, and may be out of date, incomplete
              or wrong. Nothing here is legal, financial, medical or investment
              advice. To the extent the law allows, CommonSphere accepts no
              liability for decisions taken on the basis of what it shows.
            </P>

            <H>Changes</H>
            <P>
              These terms may change as the site does. The effective date above
              moves when they do.
            </P>
          </Section>

          {/* ── Privacy ── */}
          <Section
            id="privacy"
            icon={<ShieldCheck size={18} weight="fill" />}
            title="Privacy &amp; Your Data"
          >
            <P>
              This section describes what this build actually does, rather than
              reserving rights it does not exercise.
            </P>

            <H>There is no server collecting anything</H>
            <P>
              CommonSphere is a static site. It has no backend, no database and
              no API of its own. Nothing you type — a note, a display name, an
              email, a search — is transmitted anywhere, because there is
              nowhere for it to go.
            </P>

            <H>What is kept, and where</H>
            <P>
              Preferences and profile details are stored in your own browser
              using localStorage, on the device you are using. They are not
              synced, not backed up and not visible to anyone else. Clearing
              your browser data removes them permanently.
            </P>
            <div className="rounded-xl border border-border overflow-hidden mt-1">
              {STORED_KEYS.map(([key, what], i) => (
                <div
                  key={key}
                  className={`flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 ${
                    i % 2 ? "bg-muted/30" : ""
                  }`}
                >
                  <code className="text-[11px] font-mono text-foreground">
                    {key}
                  </code>
                  <span className="text-[11px] font-sans text-muted-foreground">
                    {what}
                  </span>
                </div>
              ))}
            </div>

            <H>Profile photos never leave the device</H>
            <P>
              A photo you add is resized in the browser and written to
              localStorage as image data. It is never uploaded.
            </P>

            <H>No analytics, no advertising, no third-party tracking</H>
            <P>
              There is no analytics script, no advertising network, no tag
              manager and no tracking pixel. No cookies are set for tracking.
            </P>

            <H>The one outbound request</H>
            <P>
              To keep indicators current, the site calls the World Bank's public
              API (api.worldbank.org) from your browser. That request carries no
              account details and no identifier — only the indicator being
              fetched. As with any web request, the World Bank will see your IP
              address, as its own privacy policy describes.
            </P>

            <H>Signing in</H>
            <P>
              Account sign-in is handled by an external authentication provider.
              Credentials are entered with that provider and are never stored by
              this site — the app never sees or keeps a password.
            </P>

            <H>Children</H>
            <P>
              The site is not directed at children and asks for no information
              about them.
            </P>

            <H>Your control</H>
            <P>
              Because everything is local, you hold it all. Editing your profile
              overwrites it; clearing site data in your browser erases it. There
              is no request to make of us, because there is no copy on our side
              to delete.
            </P>
          </Section>

          {/* ── Sources ── */}
          <Section
            id="sources"
            icon={<Database size={18} weight="fill" />}
            title="Data &amp; Accuracy"
          >
            <H>Where the figures come from</H>
            <P>
              Indicators are drawn from public sources — the World Bank, IMF,
              UN agencies, USGS, national statistical offices and comparable
              publishers — together with curated datasets compiled for this
              site. Panels name their source where one applies.
            </P>

            <H>What "current" means here</H>
            <P>
              World Bank indicators are fetched live and carry a timestamp.
              Everything else is curated and updates when the underlying figures
              are revised, not continuously. A year label on a figure is the
              year that figure refers to, which is often behind today's date
              because official statistics are published in arrears.
            </P>

            <H>Derived figures</H>
            <P>
              Some views combine or rescale source data — rankings, per-capita
              conversions, index scores. Where a value is derived rather than
              reported, the panel says so. Derived values are a reading of the
              source, not a new measurement.
            </P>

            <H>Corrections</H>
            <P>
              Errors are worth reporting and will be fixed. Where the error is
              in an upstream source, it will be corrected here when the
              publisher revises it.
            </P>
          </Section>

          {/* ── Accessibility ── */}
          <Section
            id="accessibility"
            icon={<Eye size={18} weight="fill" />}
            title="Accessibility"
          >
            <H>Conformance status</H>
            <P>
              The target is WCAG 2.1 level AA. CommonSphere is currently{" "}
              <strong>partially conformant</strong>: it meets much of the
              standard, but the known exceptions below are real and are not yet
              fixed. This is stated plainly rather than claimed as full
              conformance, because an overstated accessibility statement is
              itself a defect.
            </P>

            <H>How this was assessed</H>
            <P>
              Automated testing with axe-core {AUDIT.tool} against WCAG 2.1 A
              and AA rules, run over the main pages in both light and dark
              themes on {AUDIT.date}. Automated tools catch only part of the
              standard — roughly a third of the success criteria — so the
              absence of a reported error is not proof of conformance. No
              independent audit and no assistive-technology user testing has
              been carried out.
            </P>

            <H>Known non-conformances</H>
            <div className="flex flex-col gap-2 mt-1">
              {KNOWN_ISSUES.map((k) => (
                <div key={k.criterion} className="flex gap-2.5">
                  <div
                    className="w-1 rounded-full shrink-0 mt-1 bg-warning"
                    style={{ minHeight: 14 }}
                  />
                  <div>
                    <p className="text-[12px] font-bold font-sans text-foreground">
                      {k.criterion}
                    </p>
                    <p className="text-[12px] font-sans leading-relaxed text-muted-foreground">
                      {k.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <H>What does work</H>
            <P>
              Charts do not rely on colour alone: series carry a legend or
              direct labels, and figures appear as text beside the graphic.
              Chart palettes are checked for separation under colour-vision
              deficiency. Interactive controls carry accessible names, and the
              interface is operable with a keyboard.
            </P>

            <H>Feedback</H>
            <P>
              If something is unusable with a screen reader, a keyboard or at
              high zoom, that is a defect worth reporting — including the page
              and the assistive technology in use. Reports about accessibility
              are treated as bugs, not requests.
            </P>
          </Section>

          {/* ── GDPR ── */}
          <Section
            id="gdpr"
            icon={<Database size={18} weight="fill" />}
            title="Your Rights (GDPR)"
          >
            <P>
              Where the General Data Protection Regulation applies, these are
              the rights it gives you and how they work here.
            </P>

            <H>What personal data is processed</H>
            <P>
              A display name, email address, username and avatar image, if you
              enter them. All of it is written to your own browser's storage and
              none of it is sent anywhere — this site has no server to receive
              it. In GDPR terms almost nothing is processed by the operator at
              all, because the data never leaves your device.
            </P>

            <H>Legal basis</H>
            <P>
              The profile details you enter are stored to provide the feature
              you asked for, on the basis of your consent, which you give by
              entering them and withdraw by clearing them. Preferences such as
              theme are strictly necessary for the interface you requested. No
              processing is carried out for marketing, profiling or automated
              decision-making — none of those happen here.
            </P>

            <H>Who else is involved</H>
            <P>
              Two third parties can see something. The World Bank receives your
              IP address when the site fetches indicator data from its public
              API, as any web request implies. The authentication provider
              handles sign-in and processes the credentials you give it
              directly; this site never receives them. Each operates under its
              own privacy notice.
            </P>

            <H>Retention</H>
            <P>
              Data stays in your browser until you remove it. There is no
              server-side copy, so there is no retention schedule to run and
              nothing to expire.
            </P>

            <H>Your rights</H>
            <P>
              You have the right to access your data, correct it, erase it,
              restrict or object to its processing, and to data portability.
              Because everything is held locally, you exercise most of these
              directly: the settings screen shows and edits what is stored, and
              clearing site data in your browser erases it completely and
              immediately. You also have the right to lodge a complaint with
              your national supervisory authority.
            </P>

            <H>Transfers outside the EEA</H>
            <P>
              No personal data is transferred by this site, because none is
              collected by it. Requests to the World Bank's API reach servers
              outside the EEA and carry your IP address.
            </P>

            {/* Unmissable on the page, because shipping this section with the
                controller unnamed would be a GDPR failure in itself. */}
            <div className="bg-destructive/5 border border-destructive/30 rounded-xl p-3 mt-2">
              <p className="text-[12px] font-bold font-sans text-foreground mb-1">
                Outstanding — must be completed before publication
              </p>
              <p className="text-[12px] font-sans leading-relaxed text-muted-foreground">
                GDPR requires the identity and contact details of the data
                controller, and a contact point for privacy requests. Those are
                facts about whoever operates CommonSphere, so they are not
                filled in here rather than guessed. Add the operating entity's
                legal name, address and a contact email, plus a Data Protection
                Officer if one is appointed and the relevant supervisory
                authority.
              </p>
            </div>
          </Section>

          {/* ── Standing caveat ── */}
          <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <Warning
                size={16}
                weight="fill"
                className="text-warning shrink-0 mt-0.5"
              />
              <div>
                <p className="text-[12px] font-bold font-sans text-foreground mb-1">
                  Not a source of record
                </p>
                <p className="text-[12px] font-sans leading-relaxed text-muted-foreground">
                  CommonSphere is a reference and research tool. For anything
                  with legal, financial or safety consequences, go to the
                  primary publisher and verify the figure there.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
