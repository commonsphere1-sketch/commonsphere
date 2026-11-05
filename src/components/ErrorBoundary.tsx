/**
 * What the site shows when a page fails, as asked, in the site's own manner rather than a plain grey page: its globe,
 * large, the site's name under it, a heading as a window's, one plain sentence, and the way on in the site's pill
 * buttons - try again, reload, or back to the Dashboard. The error's own wording is not shown to the reader, as asked; it
 * stays in the browser's console. A part of the page that could not be fetched - the connection dropped, or the site was
 * updated since the page was opened - is said so plainly, since reloading is then the cure.
 */
import { Component, ReactNode } from "react";
import { SiteMark } from "./SiteMark";

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

/** A failure to fetch a part of the page's code, as the browsers word it. */
const UNFETCHED = /dynamically imported module|Loading chunk|Importing a module script failed|error loading dynamically imported module/i;
const PILL = "inline-flex items-center justify-center px-4 py-2 rounded-full text-[13px] font-medium font-sans transition-colors cursor-pointer";

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      const unfetched = UNFETCHED.test(this.state.error?.message ?? "");
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div role="alert" className="w-full max-w-lg flex flex-col items-center text-center">
            <SiteMark className="!w-24 !h-24 rounded-3xl" />
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-4">CommonSphere</p>
            <div className="w-12 h-px bg-border my-6" aria-hidden />
            <h1 className="text-2xl font-bold font-sans text-foreground leading-tight">{unfetched ? "This page could not finish loading" : "Something went wrong"}</h1>
            <p className="text-[14px] font-sans text-muted-foreground leading-relaxed mt-3 max-w-sm">
              {unfetched ? "The connection may have dropped, or the site has been updated since the page was opened. Reloading will fetch it again." : "The page ran into a problem it could not recover from. Try again, or reload the page."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
              <button
                type="button"
                onClick={() => (unfetched ? window.location.reload() : this.setState({ hasError: false }))}
                className={`${PILL} bg-foreground text-background hover:opacity-90`}
              >
                {unfetched ? "Reload the page" : "Try again"}
              </button>
              {!unfetched && (
                <button type="button" onClick={() => window.location.reload()} className={`${PILL} border border-border text-foreground hover:bg-muted/60`}>
                  Reload the page
                </button>
              )}
              <a href="/dashboard" className={`${PILL} border border-border text-foreground hover:bg-muted/60`}>
                Back to the Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
