/**
 * What the site shows when a page fails, as asked, in the site's own manner rather than a plain grey page: its globe, a
 * caption in the small mono capitals its charts are titled in, a heading as a window's, what went wrong in a tile, and
 * the way on in the site's pill buttons - try again, reload, or back to the Dashboard. A part of the page that could not
 * be fetched - the connection dropped, or the site was updated since the page was opened - is said so plainly, since
 * reloading is then the cure.
 */
import { Component, ReactNode } from "react";
import { SiteMark } from "./SiteMark";

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

/** A failure to fetch a part of the page's code, as the browsers word it. */
const UNFETCHED = /dynamically imported module|Loading chunk|Importing a module script failed|error loading dynamically imported module/i;
const PILL = "inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[12px] font-medium font-sans transition-colors cursor-pointer";

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
      const message = this.state.error?.message ?? "";
      const unfetched = UNFETCHED.test(message);
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div role="alert" className="w-full max-w-md flex flex-col items-center text-center gap-4">
            <SiteMark />
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Something went wrong</p>
            <h2 className="text-xl font-bold font-sans text-foreground leading-tight">{unfetched ? "A part of this page could not be loaded" : "This page could not be shown"}</h2>
            <p className="text-[13px] font-sans text-muted-foreground leading-relaxed">
              {unfetched
                ? "The connection may have dropped, or the site may have been updated since the page was opened. Reloading fetches it again."
                : "Trying again often clears it. If it does not, reload the page, or go back to the Dashboard."}
            </p>
            {message && (
              <div className="modal-tile rounded-xl px-4 py-3 w-full text-left">
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">What the page said</p>
                <p className="text-[11px] font-mono text-foreground break-words leading-snug">{message}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              {unfetched ? (
                <button type="button" onClick={() => window.location.reload()} className={`${PILL} bg-foreground text-background hover:opacity-90`}>
                  Reload the page
                </button>
              ) : (
                <button type="button" onClick={() => this.setState({ hasError: false })} className={`${PILL} bg-foreground text-background hover:opacity-90`}>
                  Try again
                </button>
              )}
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
