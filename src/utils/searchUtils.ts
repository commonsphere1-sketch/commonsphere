export type SearchResult = {
  title: string;
  path: string;
  description?: string;
};

const PAGES: SearchResult[] = [
  { title: "US States", path: "/us-states", description: "Explore all 50 US states" },
  { title: "Cities", path: "/global-cities", description: "Global cities data" },
  { title: "Countries", path: "/international-community", description: "Country profiles" },
  { title: "Economies", path: "/global", description: "Global economic data" },
  { title: "Policy Hub", path: "/public-policy", description: "Public policy analysis" },
  { title: "Congress", path: "/congress", description: "US Congress data" },
  { title: "Policy Positions", path: "/polls", description: "Political polls & positions" },
  { title: "Research Notes", path: "/research-notes", description: "Research and analysis notes" },
  { title: "Quizzes", path: "/quiz", description: "Political knowledge quizzes" },
  { title: "Political Library", path: "/political-ideologies", description: "Political ideologies" },
  { title: "Memberships", path: "/shop-and-memberships", description: "Join CommonSphere" },
];

export type SearchIndex = SearchResult[];

export function buildSearchIndex(): SearchIndex {
  return PAGES;
}

export function performSearch(query: string, index: SearchIndex): SearchResult[] {
  const q = query.toLowerCase();
  return index.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
  );
}
