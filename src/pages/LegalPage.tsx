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
            <P>
              The aim is WCAG 2.1 AA. Text and interface colours are checked for
              contrast against the surface they sit on, in both light and dark
              themes, and chart palettes are checked for separation under
              colour-vision deficiency so that series stay distinguishable.
            </P>
            <P>
              Charts do not rely on colour alone: series are labelled or carry a
              legend, and figures are given as text beside the graphic. Controls
              are reachable by keyboard and carry accessible names.
            </P>
            <P>
              If something is unusable with a screen reader, a keyboard or at
              high zoom, that is a defect worth reporting — including which page
              and which assistive technology.
            </P>
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
