import { useEffect, useState, type ReactNode } from "react";
import { ArrowSquareOut, Spinner } from "@phosphor-icons/react";

/**
 * History in Wikipedia's words, two ways.
 *
 * HistoryPanel: a country's or US state's history - its "History of …"
 * article, found through Wikidata's link from the place (property P2184,
 * "history of topic"), looked up by ISO code - "FR" for a country (ISO
 * 3166-1), "US-TX" for a state (ISO 3166-2) - so no article name is guessed
 * ("History of Georgia (U.S. state)" is not the country's). For a place with
 * no such article (Bouvet Island, Tokelau), the History section of its own
 * article.
 *
 * ArticlePanel: the story of a person, a family or an organisation from its
 * own article, named by title (data/wikiArticles.ts, where each title was
 * found and checked by build-wiki-articles.cjs). A person's is their life:
 * the article's opening, then each part of the biography. An organisation's
 * or a family's is the article's History section where it has one, else its
 * parts.
 *
 * Shown either way: the opening, then each part with its first paragraph,
 * each linking to the full section. Fetched when the panel opens, and kept
 * for the visit. The text is Wikipedia's, under CC BY-SA 4.0, and says so
 * with a link to the article.
 */

type Era = { title: string; text: string };
type History = { article: string; fromSection: boolean; lead: string[]; eras: Era[] };
type State = { status: "loading" } | { status: "error" } | { status: "none" } | { status: "ok"; history: History };

const cache = new Map<string, History | null>();

/** Sections that are the article's apparatus, not its history. */
const APPARATUS = /^(see also|references|notes|citations|sources|bibliography|further reading|external links|footnotes|works cited|historiography|general and cited references|explanatory notes|notes and references)$/i;

/** Sections of a biography or an organisation's article that are lists and honours, not its story. */
const NOT_STORY =
  /^(honou?rs|awards|awards and honou?rs|honou?rs and awards|titles.*|arms|ancestry|issue|family tree|electoral history|publications|selected works|works|writings|filmography|discography|gallery|in popular culture|members|member states|membership|list of .*|organi[sz]ation|structure|organi[sz]ational structure|summits|secretaries[- ]general|leadership)$/i;

const wikiUrl = (title: string, section?: string) =>
  `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}${section ? `#${encodeURIComponent(section.replace(/ /g, "_"))}` : ""}`;

/** The opening sentences of a paragraph, to about `max` characters, ending where a sentence does. */
function opening(p: string, max = 480): string {
  if (p.length <= max) return p;
  const cut = p.slice(0, max);
  const end = [...cut.matchAll(/[.!?]["”’)]?(?=\s)/g)].pop();
  return end?.index !== undefined && end.index > max * 0.4 ? cut.slice(0, end.index + end[0].length) : `${cut.replace(/\s+\S*$/, "")}…`;
}

type Section = { level: number; title: string; paras: string[] };

/** A plain-text extract with "== Heading ==" lines, split into its opening and its sections. */
function split(text: string): { lead: string[]; sections: Section[] } {
  const lead: string[] = [];
  const sections: Section[] = [];
  let cur: Section | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const h = /^(={2,6})\s*(.+?)\s*\1$/.exec(line);
    if (h) {
      cur = { level: h[1].length, title: h[2], paras: [] };
      sections.push(cur);
    } else if (line) (cur ? cur.paras : lead).push(line);
  }
  return { lead, sections };
}

/** Each section at `level` with the first paragraph found in it or its subsections. */
function eras(sections: Section[], level: number, skip?: RegExp): Era[] {
  const out: Era[] = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (s.level !== level || APPARATUS.test(s.title) || skip?.test(s.title)) continue;
    let text = s.paras[0];
    for (let j = i + 1; !text && j < sections.length && sections[j].level > level; j++) text = sections[j].paras[0];
    if (text) out.push({ title: s.title, text: opening(text) });
  }
  return out;
}

/** An article's plain text, by title, following redirects. */
async function extractOf(article: string): Promise<{ title: string; extract: string } | null> {
  const api = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=wiki&redirects=1&format=json&origin=*&titles=${encodeURIComponent(article)}`;
  const wr = await fetch(api);
  if (!wr.ok) throw new Error(`Wikipedia ${wr.status}`);
  const pages = ((await wr.json()) as { query?: { pages?: Record<string, { title?: string; extract?: string }> } }).query?.pages ?? {};
  const page = Object.values(pages)[0];
  return page?.extract ? { title: page.title ?? article, extract: page.extract } : null;
}

/** The History section of an article, its subsections as eras; null where it has none. */
function historySection(title: string, sections: Section[]): History | null {
  const at = sections.findIndex((s) => s.level === 2 && /^history/i.test(s.title));
  if (at < 0) return null;
  let end = at + 1;
  while (end < sections.length && sections[end].level > 2) end++;
  const part = sections.slice(at + 1, end);
  const lead = sections[at].paras.slice(0, 2).map((p) => opening(p, 640));
  const parts = eras(part, 3);
  return lead.length || parts.length ? { article: title, fromSection: true, lead, eras: parts } : null;
}

async function loadHistory(code: string): Promise<History | null> {
  // ISO 3166-1 alpha-2 for a country, ISO 3166-2 for a state; nothing else reaches the query.
  const prop = /^[A-Z]{2}$/.test(code) ? "P297" : /^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(code) ? "P300" : null;
  if (!prop) return null;
  const q = `SELECT ?hist ?main WHERE {
    ?item wdt:${prop} "${code}" .
    OPTIONAL { ?item wdt:P2184 ?h . ?hist schema:about ?h ; schema:isPartOf <https://en.wikipedia.org/> . }
    OPTIONAL { ?main schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }
  }`;
  const res = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Wikidata ${res.status}`);
  const rows = ((await res.json()) as { results: { bindings: Record<string, { value: string } | undefined>[] } }).results.bindings;
  const title = (url?: string) => (url ? decodeURIComponent(url.split("/wiki/")[1] ?? "").replace(/_/g, " ") : "");
  const main = title(rows.find((b) => b.main)?.main?.value);
  const histories = [...new Set(rows.map((b) => title(b.hist?.value)).filter(Boolean))];
  // "History of France" over "History of Ivory Coast (1960–1999)": the one named for the place, else the shortest.
  const history =
    histories.find((t) => t === `History of ${main}` || t === `History of the ${main}`) ??
    [...histories].sort((a, b) => a.length - b.length)[0];
  const article = history || main;
  if (!article) return null;

  const page = await extractOf(article);
  if (!page) return null;
  const { lead, sections } = split(page.extract);

  if (history) return { article: page.title, fromSection: false, lead: lead.slice(0, 2).map((p) => opening(p, 640)), eras: eras(sections, 2) };

  // No history article: the History section of the place's own article, its subsections as eras.
  return historySection(page.title, sections);
}

/**
 * An article's story. A life: its opening and each part of the biography.
 * A history: its History section where it has one, else its opening and its
 * parts.
 */
async function loadArticle(article: string, mode: "life" | "history"): Promise<History | null> {
  const page = await extractOf(article);
  if (!page) return null;
  const { lead, sections } = split(page.extract);
  if (mode === "history") {
    const h = historySection(page.title, sections);
    if (h) return h;
  }
  const parts = eras(sections, 2, NOT_STORY);
  const open = lead.slice(0, 2).map((p) => opening(p, 640));
  return open.length || parts.length ? { article: page.title, fromSection: false, lead: open, eras: parts } : null;
}

/** Loads once per key and keeps the answer for the visit. */
function useLoaded(key: string, load: () => Promise<History | null>): State {
  const [state, setState] = useState<State>(() => {
    const hit = cache.get(key);
    return hit === undefined ? { status: "loading" } : hit ? { status: "ok", history: hit } : { status: "none" };
  });

  useEffect(() => {
    const hit = cache.get(key);
    if (hit !== undefined) {
      setState(hit ? { status: "ok", history: hit } : { status: "none" });
      return;
    }
    let live = true;
    setState({ status: "loading" });
    load()
      .then((h) => {
        cache.set(key, h);
        if (live) setState(h ? { status: "ok", history: h } : { status: "none" });
      })
      .catch(() => {
        if (live) setState({ status: "error" });
      });
    return () => {
      live = false;
    };
    // The key says what is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

/** The opening, then each part with its first paragraph, then where it is from. */
function HistoryView({ state, what, none, note }: { state: State; what: string; none: string; note: (h: History) => ReactNode }) {
  if (state.status === "loading")
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
        <Spinner size={16} className="animate-spin" />
        <span className="text-xs font-sans">Loading {what} from Wikipedia…</span>
      </div>
    );
  if (state.status === "error")
    return <p className="text-xs font-sans text-destructive py-4">This could not be loaded from Wikipedia. Try again in a moment.</p>;
  if (state.status === "none") return <p className="text-xs font-sans text-muted-foreground py-6 text-center leading-relaxed">{none}</p>;

  const { history } = state;
  return (
    <div className="animate-fade-in space-y-4">
      {history.lead.length > 0 && (
        <div className="modal-tile rounded-xl p-4 space-y-2">
          {history.lead.map((p) => (
            <p key={p.slice(0, 40)} className="text-[12px] font-sans text-foreground/90 leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      )}

      {history.eras.length > 0 && (
        <ol className="relative border-l border-border ml-2 space-y-4">
          {history.eras.map((era) => (
            <li key={era.title} className="pl-5 relative">
              <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-foreground/70 ring-4 ring-background" aria-hidden />
              <a
                href={wikiUrl(history.article, era.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-[13px] font-semibold font-sans text-foreground hover:underline"
              >
                {era.title}
                <ArrowSquareOut size={11} className="text-muted-foreground group-hover:text-foreground" />
              </a>
              <p className="mt-1 text-[11.5px] font-sans text-muted-foreground leading-relaxed">{era.text}</p>
            </li>
          ))}
        </ol>
      )}

      <p className="text-[10px] font-sans text-muted-foreground leading-snug">
        {note(history)} Text under{" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          CC BY-SA 4.0
        </a>
        .
      </p>
    </div>
  );
}

const articleLink = (h: History) => {
  const section = h.fromSection ? "History" : undefined;
  return (
    <a href={wikiUrl(h.article, section)} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
      {h.article}
      {section ? ` (its ${section} section)` : ""}
    </a>
  );
};

export function HistoryPanel({ code, name }: { code: string; name: string }) {
  const state = useLoaded(`place:${code}`, () => loadHistory(code));
  return (
    <HistoryView
      state={state}
      what="the history"
      none={`Wikipedia has no history of ${name} to show here.`}
      note={(h) => (
        <>
          From Wikipedia's article {articleLink(h)}, the one Wikidata links to {name}, shortened to each part's opening; the full article has
          more.
        </>
      )}
    />
  );
}

/** The opening of an article and nothing else: what a place is, in Wikipedia's words. */
async function loadLead(article: string): Promise<History | null> {
  const page = await extractOf(article);
  if (!page) return null;
  const open = split(page.extract).lead.slice(0, 2).map((p) => opening(p, 640));
  return open.length ? { article: page.title, fromSection: false, lead: open, eras: [] } : null;
}

/** A description of a place from the opening of its Wikipedia article, named by title. */
export function ArticleLead({ title, name }: { title: string; name: string }) {
  const state = useLoaded(`lead:${title}`, () => loadLead(title));
  return (
    <HistoryView
      state={state}
      what="the description"
      none={`Wikipedia's article on ${name} has no opening to show here.`}
      note={(h) => <>The opening of Wikipedia's article {articleLink(h)}.</>}
    />
  );
}

/**
 * The story of a person, a family or an organisation from its Wikipedia
 * article: a `life` as the biography's parts, a `history` as the article's
 * History section where it has one. `title` is the article, as
 * data/wikiArticles.ts names it.
 */
export function ArticlePanel({ title, name, mode }: { title: string; name: string; mode: "life" | "history" }) {
  const state = useLoaded(`${mode}:${title}`, () => loadArticle(title, mode));
  return (
    <HistoryView
      state={state}
      what={mode === "life" ? "the biography" : "the history"}
      none={`Wikipedia's article on ${name} has nothing to show here.`}
      note={(h) => (
        <>
          From Wikipedia's article {articleLink(h)}, shortened to each part's opening; the full article has more.
        </>
      )}
    />
  );
}
