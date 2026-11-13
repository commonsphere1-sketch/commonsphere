/**
 * The political compass's legend, as asked: the political ideas the grid is read by - ideologies, political theories and
 * philosophies, and forms of government - each set where the two-axis model places it by what it holds on its two
 * questions: who should own and direct the economy (across: common or state ownership and planning on the left, private
 * property and free markets on the right), and how much authority the state, tradition or faith should hold over personal
 * life (up and down: the most at the top, the individual's liberty at the foot). An idea that answers only one of the two
 * stands on the other's middle line. The places are a reading of each idea's defining principles, as a guide to the grid -
 * not a measurement, and many ideas span more than one place.
 *
 * Each idea's description and works to read are the site's own record of political ideas (politicalTheories.ts: the
 * opening of its Wikipedia article, with the Encyclopaedia Britannica's, the Stanford Encyclopedia's or the Internet
 * Encyclopedia of Philosophy's entry), by its name there; ideas that record does not hold - centrism among them - are
 * given the same way by build-compass-ideas.cjs (compassMoreIdeas.ts).
 */
import { COMPASS_MORE_IDEAS } from "./compassMoreIdeas";

export type CompassIdea = {
  /** Its name in the site's record of political ideas. */
  name: string;
  /** Left (-1) to right (1). */
  x: number;
  /** Authoritarian (-1, the top) to libertarian (1, the foot). */
  y: number;
};

export const COMPASS_IDEAS: CompassIdea[] = [
  // Authoritarian left
  { name: "Juche", x: -0.5, y: -0.88 },
  { name: "Maoism", x: -0.85, y: -0.74 },
  { name: "Democratic centralism", x: -0.35, y: -0.72 },
  { name: "Leninism", x: -0.6, y: -0.6 },
  { name: "Saint-Simonianism", x: -0.22, y: -0.52 },
  { name: "National communism", x: -0.42, y: -0.44 },
  { name: "Communism", x: -0.85, y: -0.44 },
  { name: "Chavismo", x: -0.35, y: -0.3 },
  { name: "Trotskyism", x: -0.68, y: -0.26 },
  { name: "Dirigisme", x: -0.22, y: -0.17 },
  { name: "Communitarianism", x: -0.12, y: -0.08 },
  { name: "Guided democracy", x: -0.12, y: -0.4 },
  { name: "Legalism (Chinese philosophy)", x: -0.12, y: -0.96 },
  // On the line across: ideas held with more and with less state authority alike.
  { name: "Marxism", x: -0.9, y: 0 },
  { name: "Socialism", x: -0.62, y: 0 },
  { name: "Egalitarianism", x: -0.36, y: 0 },
  { name: "Protectionism", x: -0.2, y: 0 },
  // On the line up and down: ideas of the state's power and its shape, not of the economy.
  { name: "Totalitarianism", x: 0, y: -0.94 },
  { name: "Dictatorship", x: 0, y: -0.84 },
  { name: "Authoritarianism", x: 0, y: -0.74 },
  { name: "One-party state", x: 0, y: -0.62 },
  { name: "Technocracy", x: 0, y: -0.4 },
  { name: "Majoritarianism", x: 0, y: -0.2 },
  { name: "Representative democracy", x: 0, y: 0.1 },
  { name: "Constitutionalism", x: 0, y: 0.22 },
  { name: "Pluralism (political philosophy)", x: 0, y: 0.34 },
  { name: "Deliberative democracy", x: 0, y: 0.46 },
  { name: "Direct democracy", x: 0, y: 0.58 },
  { name: "Decentralization", x: 0, y: 0.7 },
  { name: "Federation", x: 0, y: 0.82 },
  { name: "Confederation", x: 0, y: 0.92 },
  // Authoritarian right
  { name: "Nazism", x: 0.55, y: -0.92 },
  { name: "Neo-fascism", x: 0.38, y: -0.86 },
  { name: "Militarism", x: 0.12, y: -0.8 },
  { name: "Fascism", x: 0.28, y: -0.74 },
  { name: "Dominion theology", x: 0.72, y: -0.76 },
  { name: "Ultranationalism", x: 0.48, y: -0.7 },
  { name: "Bonapartism", x: 0.2, y: -0.64 },
  { name: "Theocracy", x: 0.58, y: -0.62 },
  { name: "Integral nationalism", x: 0.38, y: -0.58 },
  { name: "Integralism", x: 0.22, y: -0.52 },
  { name: "Christian nationalism", x: 0.62, y: -0.5 },
  { name: "Carlism", x: 0.42, y: -0.46 },
  { name: "Hindutva", x: 0.52, y: -0.42 },
  { name: "Nativism (politics)", x: 0.66, y: -0.4 },
  { name: "Paleoconservatism", x: 0.82, y: -0.4 },
  { name: "Corporatism", x: 0.28, y: -0.38 },
  { name: "Nationalism", x: 0.5, y: -0.3 },
  { name: "Christian right", x: 0.72, y: -0.3 },
  { name: "Neoconservatism", x: 0.75, y: -0.2 },
  { name: "Thatcherism", x: 0.88, y: -0.14 },
  { name: "Conservatism", x: 0.5, y: -0.13 },
  { name: "Christian democracy", x: 0.2, y: -0.06 },
  { name: "Military government", x: 0.22, y: -0.92 },
  { name: "Monarchy", x: 0.33, y: -0.66 },
  { name: "Aristocracy", x: 0.62, y: -0.82 },
  { name: "Alt-right", x: 0.72, y: -0.92 },
  { name: "Feudalism", x: 0.88, y: -0.84 },
  { name: "Oligarchy", x: 0.88, y: -0.6 },
  { name: "Confucianism", x: 0.08, y: -0.56 },
  { name: "Meritocracy", x: 0.12, y: -0.22 },
  // Libertarian left
  { name: "Eurocommunism", x: -0.85, y: 0.16 },
  { name: "Neo-Marxism", x: -0.72, y: 0.06 },
  { name: "Capability approach", x: -0.28, y: 0.4 },
  { name: "Deep ecology", x: -0.55, y: 0.56 },
  { name: "Christian socialism", x: -0.55, y: 0.2 },
  { name: "Social democracy", x: -0.32, y: 0.28 },
  { name: "Socialist feminism", x: -0.78, y: 0.32 },
  { name: "Democratic socialism", x: -0.62, y: 0.44 },
  { name: "New liberalism (ideology)", x: -0.18, y: 0.44 },
  { name: "Progressivism", x: -0.35, y: 0.56 },
  { name: "Social ecology (Bookchin)", x: -0.7, y: 0.64 },
  { name: "Fourierism", x: -0.85, y: 0.74 },
  { name: "Mutualism (economic theory)", x: -0.42, y: 0.8 },
  { name: "Anarchism", x: -0.65, y: 0.86 },
  { name: "Anarchist communism", x: -0.9, y: 0.92 },
  // Libertarian right
  { name: "Third Way", x: 0.1, y: 0.12 },
  { name: "Liberal democracy", x: 0.2, y: 0.2 },
  { name: "Neoliberalism", x: 0.7, y: 0.2 },
  { name: "Liberalism", x: 0.3, y: 0.32 },
  { name: "Classical liberalism", x: 0.65, y: 0.46 },
  { name: "Open society", x: 0.18, y: 0.58 },
  { name: "Liberal feminism", x: 0.1, y: 0.48 },
  { name: "Classical radicalism", x: 0.36, y: 0.62 },
  { name: "Libertarianism", x: 0.75, y: 0.68 },
  { name: "Individualism", x: 0.52, y: 0.76 },
  { name: "Voluntaryism", x: 0.88, y: 0.9 },
  // From build-compass-ideas.cjs (compassMoreIdeas.ts): ideas the site's record does not hold.
  { name: "Centrism", x: 0, y: 0 },
  { name: "Keynesian economics", x: -0.1, y: 0 },
  { name: "Capitalism", x: 0.6, y: 0 },
  { name: "Laissez-faire", x: 0.95, y: 0 },
  { name: "Autocracy", x: 0, y: -0.52 },
  { name: "Stalinism", x: -0.72, y: -0.94 },
  { name: "Marxism–Leninism", x: -0.7, y: -0.82 },
  { name: "Ba'athism", x: -0.28, y: -0.66 },
  { name: "State socialism", x: -0.72, y: -0.12 },
  { name: "Distributism", x: -0.05, y: -0.3 },
  { name: "Absolute monarchy", x: 0.42, y: -0.94 },
  { name: "Plutocracy", x: 0.75, y: -0.55 },
  { name: "Social conservatism", x: 0.38, y: -0.24 },
  { name: "National conservatism", x: 0.62, y: -0.08 },
  { name: "Fiscal conservatism", x: 0.7, y: 0.04 },
  { name: "Liberal conservatism", x: 0.48, y: 0.06 },
  { name: "Ordoliberalism", x: 0.42, y: 0.18 },
  { name: "Georgism", x: 0.3, y: 0.45 },
  { name: "Objectivism", x: 0.9, y: 0.62 },
  { name: "Agorism", x: 0.95, y: 0.75 },
  { name: "Right-libertarianism", x: 0.82, y: 0.8 },
  { name: "Minarchism", x: 0.62, y: 0.86 },
  { name: "Anarcho-capitalism", x: 0.95, y: 0.97 },
  { name: "Market socialism", x: -0.45, y: 0.12 },
  { name: "Green politics", x: -0.42, y: 0.42 },
  { name: "Eco-socialism", x: -0.78, y: 0.5 },
  { name: "Left communism", x: -0.95, y: 0.4 },
  { name: "Council communism", x: -0.92, y: 0.6 },
  { name: "Libertarian socialism", x: -0.55, y: 0.72 },
  { name: "Left-libertarianism", x: -0.3, y: 0.88 },
  { name: "Anarcho-syndicalism", x: -0.78, y: 0.96 },
];

/** Its name as the compass shows it: the record's name without the words that tell it from others of that name. */
export const shownName = (name: string) => name.replace(/ \([^)]*\)$/, "");

/** Ideas the site's record of political ideas does not hold, given the same way (build-compass-ideas.cjs). */
export const MORE_IDEAS = COMPASS_MORE_IDEAS;

/** The two-axis model itself, to read. */
export const COMPASS_MODEL_SOURCES = [
  { label: "The Political Compass — the two axes explained", url: "https://www.politicalcompass.org/analysis2" },
  { label: "Wikipedia — Political compass", url: "https://en.wikipedia.org/wiki/Political_compass" },
];
