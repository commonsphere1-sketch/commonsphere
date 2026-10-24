/**
 * What is legal, restricted, decriminalised and illegal in a country, subject by subject - same-sex marriage, abortion,
 * cannabis, the death penalty and the rest - with a short note on each: the list the countries' windows show under
 * Law, and the Worldview page's law panel with it. Keyed by the country's id in countriesData. A country with no entry
 * has no list: nothing is filled in for it here.
 *
 * Moved out of the Countries page unchanged, so that a page can show the list without carrying that page.
 */
export interface LegalItem {
  label: string;
  status: "legal" | "illegal" | "restricted" | "decriminalized";
  note?: string;
}

export interface CountryLegalStatus {
  items: LegalItem[];
}

export const COUNTRY_LEGAL_STATUS: Record<string, CountryLegalStatus> = {
  us: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Obergefell v. Hodges (2015), codified 2022",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Dobbs (2022) returned to states; banned in ~14 states",
      },
      {
        label: "Cannabis (recreational)",
        status: "restricted",
        note: "Legal in 24 states; federally illegal Schedule I",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active in 27 states; federal also active",
      },
      {
        label: "Gun ownership",
        status: "legal",
        note: "Constitutional right (2nd Amendment); state restrictions vary",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized federally (FOSTA-SESTA); varies by state",
      },
      {
        label: "Euthanasia (medical aid in dying)",
        status: "restricted",
        note: "Legal in 10 states (Oregon, California, etc.)",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Varies by state; online gambling limited",
      },
      {
        label: "Assisted suicide",
        status: "restricted",
        note: "Legal in limited jurisdictions with strict criteria",
      },
      {
        label: "Polygamy",
        status: "illegal",
        note: "Illegal in all 50 states",
      },
    ],
  },
  cn: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; no civil partnership framework",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Broadly available; government now encourages more births",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Strictly prohibited; severe penalties",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "World's largest executor (~1,000+ per year, state secret)",
      },
      {
        label: "Gun ownership (civilian)",
        status: "illegal",
        note: "Prohibited for civilians",
      },
      {
        label: "VPN usage",
        status: "restricted",
        note: "Technically illegal without government approval",
      },
      {
        label: "Political opposition",
        status: "illegal",
        note: "One-party state; opposition parties banned",
      },
      {
        label: "Falun Gong practice",
        status: "illegal",
        note: "Banned since 1999; practitioners persecuted",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized; periodic crackdowns",
      },
      {
        label: "Gambling",
        status: "illegal",
        note: "Prohibited on mainland; legal in Macau",
      },
    ],
  },
  de: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized October 2017",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Legal up to 12 weeks; counseling required; reform debate ongoing",
      },
      {
        label: "Cannabis (recreational)",
        status: "legal",
        note: "Legalized April 2024 (up to 25g personal possession)",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1949 (West), 1987 (East); constitutionally banned",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "Heavily regulated; permit required; sport/hunting use",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Legalized and regulated since 2002 (Prostitution Act)",
      },
      {
        label: "Euthanasia",
        status: "legal",
        note: "Assisted suicide legal (BVerfG ruling 2020)",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Regulated; online gambling requires state license",
      },
      {
        label: "Nazi symbols/hate speech",
        status: "illegal",
        note: "§86a StGB; Holocaust denial illegal",
      },
      {
        label: "Polygamy",
        status: "illegal",
        note: "Criminal offense under §172 StGB",
      },
    ],
  },
  gb: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "England/Wales 2014, Scotland 2014, N. Ireland 2020",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Up to 24 weeks; NHS-funded in England/Wales/Scotland",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Class B drug; decriminalization debated but not enacted",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1969 (England/Wales), 1973 (N. Ireland)",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "Handguns banned (1997); shotguns/rifles with license",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling sex legal; brothel-keeping and soliciting illegal",
      },
      {
        label: "Euthanasia",
        status: "illegal",
        note: "Assisted dying bill passed House of Commons 2024; Lords stage",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Legal and regulated under Gambling Act 2005",
      },
      {
        label: "Fox hunting",
        status: "illegal",
        note: "Banned Hunting Act 2004",
      },
      {
        label: "Polygamy",
        status: "illegal",
        note: "Criminal offense; bigamy law applies",
      },
    ],
  },
  fr: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized May 2013 (Loi Taubira)",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Up to 14 weeks; constitutionally enshrined March 2024",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Illegal; possession fined €200 (forfait pénal)",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1981 under Mitterrand",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "Regulated; category-based licensing system",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling sex decriminalized; buying sex illegal (2016 law)",
      },
      {
        label: "Euthanasia",
        status: "restricted",
        note: "Deep sedation until death legal; active euthanasia bill debated",
      },
      {
        label: "Religious face coverings in public",
        status: "illegal",
        note: "Banned in public spaces since 2011",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Regulated by ANJ; online and physical gambling legal",
      },
      {
        label: "Hate speech",
        status: "illegal",
        note: "Loi Gayssot (1990); Holocaust denial and incitement illegal",
      },
    ],
  },
  jp: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized nationally; local partnerships exist in 300+ cities",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Legal up to ~22 weeks but requires spousal consent; reform pending",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Zero-tolerance; revised law 2023 criminalizes use",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; executions often carried out with minimal notice",
      },
      {
        label: "Gun ownership",
        status: "illegal",
        note: "Virtually banned; one of the world's strictest regimes",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Prostitution Act 1956 bans direct prostitution; gray areas persist",
      },
      {
        label: "Gambling (casino)",
        status: "restricted",
        note: "Casinos legalized 2018 (IR Promotion Act); first opening ~2029",
      },
      {
        label: "Dual citizenship",
        status: "illegal",
        note: "Adults must choose one nationality",
      },
      {
        label: "Pornography (uncensored)",
        status: "illegal",
        note: "Genitalia must be pixelated under obscenity law",
      },
      {
        label: "Polygamy",
        status: "illegal",
        note: "Criminal offense; Japan only recognizes monogamous marriage",
      },
    ],
  },
  in: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 2018 (Navtej Singh Johar); marriage not yet recognized",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Up to 24 weeks under MTP Act 2021",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "NDPS Act bans; Bhang (traditional drink) permitted in some states",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; used for 'rarest of rare' crimes",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "Permitted with license under Arms Act 1959",
      },
      {
        label: "Cow slaughter",
        status: "illegal",
        note: "Banned in most states; federal protection varies",
      },
      {
        label: "Conversion therapy (court-ordered)",
        status: "illegal",
        note: "SC guidelines restrict; state laws vary",
      },
      {
        label: "Triple talaq (instant Muslim divorce)",
        status: "illegal",
        note: "Criminalized 2019 (Muslim Women Protection Act)",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Most gambling illegal; Goa and Sikkim have casinos",
      },
      {
        label: "Untouchability practice",
        status: "illegal",
        note: "Art. 17 Constitution; Civil Rights Act 1955",
      },
    ],
  },
  br: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legal since 2013 by Supreme Court ruling",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Only for rape, risk to mother, or anencephaly; reform pending",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Personal use decriminalized; cultivation/sale illegal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Banned by 1988 Constitution (except wartime)",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "Heavily restricted under Disarmament Statute; relaxed under Bolsonaro, being reversed",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling sex legal; running a brothel/living off earnings illegal",
      },
      {
        label: "Gambling (casinos)",
        status: "illegal",
        note: "Banned since 1946; reform bill passed Senate 2023",
      },
      {
        label: "Deforestation in protected areas",
        status: "illegal",
        note: "Forest Code; enforcement has been historically weak",
      },
      {
        label: "Hate speech (racism)",
        status: "illegal",
        note: "Racism is a non-bailable crime under Lei Caó (1989)",
      },
      {
        label: "Polygamy",
        status: "illegal",
        note: "Criminal offense under Penal Code",
      },
    ],
  },
  kp: {
    items: [
      {
        label: "Political opposition",
        status: "illegal",
        note: "Death penalty or kwanliso (concentration camp)",
      },
      {
        label: "Foreign media/music",
        status: "illegal",
        note: "K-pop listeners sentenced to death; USB drives banned",
      },
      {
        label: "Christianity/unauthorized religion",
        status: "illegal",
        note: "Death penalty; documented in UN COI 2014",
      },
      {
        label: "Unauthorized movement within country",
        status: "illegal",
        note: "Internal travel permit required",
      },
      {
        label: "Contacting foreigners without permission",
        status: "illegal",
        note: "Considered espionage; severe punishment",
      },
      {
        label: "Jeans/Western fashion",
        status: "restricted",
        note: "Blue jeans and Western clothing subject to fines/detention",
      },
      {
        label: "Abortion (unauthorized)",
        status: "illegal",
        note: "State controls reproduction; coerced abortions documented",
      },
      {
        label: "Internet access (public)",
        status: "illegal",
        note: "Only state intranet (Kwangmyong) available to most citizens",
      },
      {
        label: "Leaving the country without permission",
        status: "illegal",
        note: "Defectors face imprisonment or execution if caught",
      },
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; no documented legal cases but severe social control",
      },
    ],
  },
  au_oc: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized December 2017 by referendum",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Decriminalized in all states by 2022; access varies",
      },
      {
        label: "Cannabis (recreational)",
        status: "restricted",
        note: "Legal in ACT (personal use); decriminalized in SA",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished by all states and territories",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "Heavily regulated post-Port Arthur massacre (1996)",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Varies by state; decriminalized in NSW, Victoria, and ACT",
      },
      {
        label: "Euthanasia (voluntary assisted dying)",
        status: "legal",
        note: "Legal in all 6 states with strict criteria",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Legal and heavily regulated; Australians are world's biggest gamblers per capita",
      },
      {
        label: "Hate speech",
        status: "illegal",
        note: "Racial Discrimination Act; state-level vilification laws",
      },
      {
        label: "Smoking in enclosed public spaces",
        status: "illegal",
        note: "Banned nationally and in all states",
      },
    ],
  },
  ca: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized July 2005 — first G7 nation",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Fully legal with no gestational limits; no criminal restrictions",
      },
      {
        label: "Cannabis (recreational)",
        status: "legal",
        note: "Federally legalized October 2018",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1976; last execution 1962",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "License required; handguns tightly regulated; assault rifles banned",
      },
      {
        label: "Medical assistance in dying (MAID)",
        status: "legal",
        note: "Expanded 2021; for physical illness; mental illness expansion delayed",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling sex legal; buying sex illegal under 'Nordic model' (2014)",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Provincial jurisdiction; online gambling legal",
      },
      {
        label: "Conversion therapy",
        status: "illegal",
        note: "Criminalized federally 2022",
      },
      {
        label: "Polygamy",
        status: "illegal",
        note: "Criminal Code s.293; Bountiful BC case upheld prohibition (2011)",
      },
    ],
  },
  kr: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; Court ruled lack of health benefits unconstitutional 2023",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Decriminalized 2021; up to 14 weeks without restriction",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Strictly prohibited; even use abroad by Koreans is criminal",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Legal but de facto moratorium since 1997",
      },
      {
        label: "Gun ownership",
        status: "illegal",
        note: "Essentially banned for civilians",
      },
      {
        label: "National Security Law violations",
        status: "illegal",
        note: "Praising North Korea or 'anti-state' activity criminalized",
      },
      {
        label: "Gambling (casinos)",
        status: "restricted",
        note: "18 casinos legal only for foreigners; one (Kangwon Land) for Koreans",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Special Act on Sex Trade (2004) criminalized all parties",
      },
      {
        label: "Defamation (true facts)",
        status: "illegal",
        note: "Truth is no absolute defense; criminal defamation law",
      },
      {
        label: "Adultery",
        status: "legal",
        note: "Decriminalized by Constitutional Court 2015",
      },
    ],
  },
  sg: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitution amended 2023 to lock in opposite-sex definition",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Up to 24 weeks; legal under Termination of Pregnancy Act",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Death penalty for trafficking >500g; zero tolerance",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Mandatory for many drug offenses; active use",
      },
      {
        label: "Gun ownership",
        status: "illegal",
        note: "Essentially banned; Arms Offences Act",
      },
      {
        label: "Chewing gum (import/sale)",
        status: "illegal",
        note: "Banned since 1992; medical gum with prescription exempted",
      },
      {
        label: "Littering/jaywalking",
        status: "illegal",
        note: "S$300–S$1,000 fine; repeated offenders face community work",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Legal in designated red-light districts; street solicitation banned",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Two casinos licensed (Marina Bay Sands, RWS)",
      },
      {
        label: "Oral/anal sex (consensual adults)",
        status: "legal",
        note: "Section 377A (same-sex) repealed October 2022",
      },
    ],
  },
  ae: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Federal Penal Code; up to 10 years imprisonment",
      },
      {
        label: "Alcohol consumption",
        status: "restricted",
        note: "Legal for non-Muslims in licensed venues and at home",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Zero tolerance; imprisonment for any amount",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; applied for murder, drug trafficking, terrorism",
      },
      {
        label: "Adultery/cohabitation outside marriage",
        status: "illegal",
        note: "Criminal offence; reformed 2020 but unmarried couples still at risk",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized; significant underground trade in Dubai",
      },
      {
        label: "Criticism of ruling family/government",
        status: "illegal",
        note: "Up to 15 years under Cybercrime Law",
      },
      {
        label: "Gambling",
        status: "illegal",
        note: "Prohibited under Islamic law; no casinos; Dubai Lottery existed briefly",
      },
      {
        label: "Proselytizing non-Muslim religions",
        status: "illegal",
        note: "Attempting to convert Muslims is a criminal offense",
      },
      {
        label: "Import of pork products (Muslim-only spaces)",
        status: "restricted",
        note: "Available in some outlets for non-Muslims; not sold publicly",
      },
    ],
  },
  il_as: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not performed domestically; foreign same-sex marriages recognized",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Legal with committee approval; broadly available in practice",
      },
      {
        label: "Cannabis (recreational)",
        status: "decriminalized",
        note: "Decriminalized 2019; medical legal; full legalization debated",
      },
      {
        label: "Death penalty (civilian)",
        status: "illegal",
        note: "Abolished for civilian crimes; legal for genocide/wartime treason",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "Permitted for security/military personnel; civilians with need",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Purchase of sexual services criminalized 2019",
      },
      {
        label: "Conversion therapy",
        status: "illegal",
        note: "Banned by medical bodies; formal law passed 2023",
      },
      {
        label: "Gambling",
        status: "illegal",
        note: "Largely prohibited; state lottery and sports betting legal",
      },
      {
        label: "Marriage without religious ceremony",
        status: "illegal",
        note: "No civil marriage; must use religious (Jewish/Muslim/Christian) courts",
      },
      {
        label: "Holocaust denial",
        status: "illegal",
        note: "Denied or minimized Holocaust Law",
      },
    ],
  },
  tr: {
    items: [
      {
        label: "Same-sex marriage/civil union",
        status: "illegal",
        note: "Constitution defines marriage as opposite-sex (2010 amendment)",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Legal up to 10 weeks; government discourages access since 2012",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; limited industrial hemp cultivation allowed",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 2004 (EU accession prerequisite)",
      },
      {
        label: "Insulting the President",
        status: "illegal",
        note: "Article 299 TCK; thousands prosecuted including cartoonists",
      },
      {
        label: "Insulting 'Turkishness'",
        status: "illegal",
        note: "Article 301 TCK; used against journalists and academics",
      },
      {
        label: "Kurdish language in public sphere",
        status: "restricted",
        note: "Partially liberalized; TV/education still restricted",
      },
      {
        label: "Gambling",
        status: "illegal",
        note: "Casinos banned 1997; horse racing and state lottery permitted",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Regulated in licensed state brothels (genelevs); street work illegal",
      },
      {
        label: "Alcohol (advertising restrictions)",
        status: "restricted",
        note: "Sale restricted near mosques/schools; advertising heavily limited",
      },
    ],
  },
  za: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized 2006 — first in Africa, fifth in world",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks (Choice on Termination of Pregnancy Act 1996)",
      },
      {
        label: "Cannabis (recreational)",
        status: "decriminalized",
        note: "Private use/possession decriminalized 2018 (Prince case); commercial framework pending",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1995; Constitutional Court ruling",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "License required; Firearms Control Act 2000",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized; legal reform debated (Sex Workers Education and Advocacy Taskforce)",
      },
      {
        label: "Hate speech/apartheid symbolism",
        status: "illegal",
        note: "Equality Act; hate speech with serious intent illegal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Regulated by National Gambling Board; casinos in all provinces",
      },
      {
        label: "Polygamy",
        status: "restricted",
        note: "Legal under customary law (Recognition of Customary Marriages Act)",
      },
      {
        label: "Corporal punishment in schools",
        status: "illegal",
        note: "Banned 1996; Constitutional Court upheld ban",
      },
    ],
  },
  ng: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Same Sex Marriage Prohibition Act 2014; up to 14 years prison",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminal Code; only legal to save mother's life; unsafe abortions widespread",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "NDLEA strictly enforces; industrial hemp licences introduced 2021",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; hanging and firing squad; Sharia stoning in 12 northern states",
      },
      {
        label: "Blasphemy",
        status: "illegal",
        note: "Sharia criminal law in 12 northern states; death penalty imposed",
      },
      {
        label: "Criticizing the government (online)",
        status: "restricted",
        note: "Cybercrime Act 2015 s.24 used to silence critics",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under federal and state law",
      },
      {
        label: "Gambling (sports betting)",
        status: "legal",
        note: "Multi-billion dollar industry; regulated by NLRC",
      },
      {
        label: "Child marriage (under 18)",
        status: "illegal",
        note: "Child Rights Act 2003; not ratified by all states (12 North resist)",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Prohibited in 12 northern Sharia states; legal elsewhere",
      },
    ],
  },
  eg: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Article 278 Penal Code; 'debauchery' law used; up to 3 years",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized except to save mother's life",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; use common in some areas historically",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; one of Africa's most frequent users",
      },
      {
        label: "Criticizing the President/government",
        status: "illegal",
        note: "Law 180/2018 Anti-Cybercrime; thousands imprisoned",
      },
      {
        label: "Atheism/apostasy (public expression)",
        status: "restricted",
        note: "Not formally illegal but prosecuted under blasphemy/contempt of religion laws",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized; periodic crackdowns, often used against LGBTQ+ individuals",
      },
      {
        label: "Gambling",
        status: "illegal",
        note: "Prohibited except in licensed tourist hotels",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Legal for non-Muslims; sale in licensed venues only",
      },
      {
        label: "Female genital mutilation (FGM)",
        status: "illegal",
        note: "Banned 2008; amended 2021 with tougher penalties; practice persists",
      },
    ],
  },
  mx: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legal in all 31 states and CDMX (completed 2022)",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Decriminalized by Supreme Court 2021; legal in 12+ states; illegal in others",
      },
      {
        label: "Cannabis (recreational)",
        status: "decriminalized",
        note: "Personal use decriminalized; legalization framework stalled in Congress",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 2005" },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "One legal gun store (SEDENA); heavily restricted but illegal guns endemic",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling sex legal; organizing/profiting from it illegal; varies by state",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Regulated; state-licensed casinos and betting shops",
      },
      {
        label: "Drug trafficking",
        status: "illegal",
        note: "Federally criminalized; cartel enforcement exists parallel to state law",
      },
      {
        label: "Euthanasia",
        status: "illegal",
        note: "Not legal; palliative care right recognized",
      },
      {
        label: "Polygamy",
        status: "illegal",
        note: "Criminal offense nationwide",
      },
    ],
  },
  sa: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Death penalty under Sharia for men; Vision 2030 reforms minimal",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Only permitted to save mother's life; medical exception allowed",
      },
      {
        label: "Alcohol",
        status: "illegal",
        note: "Prohibited for all; vision 2030 introduced non-alcoholic venues",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Death penalty for trafficking; severe penalties for possession",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "One of world's highest per capita executors; beheading method",
      },
      {
        label: "Religious conversion from Islam",
        status: "illegal",
        note: "Apostasy is death penalty under Sharia interpretation",
      },
      {
        label: "Women driving",
        status: "legal",
        note: "Legalized June 2018 under Vision 2030 reforms",
      },
      {
        label: "Cinema/entertainment",
        status: "legal",
        note: "Cinemas reopened 2018 after 35-year ban; concerts now allowed",
      },
      { label: "Sex work", status: "illegal", note: "Strictly prohibited" },
      {
        label: "Criticism of ruling family",
        status: "illegal",
        note: "Imprisonment and torture documented (Jamal Khashoggi case)",
      },
    ],
  },
  ar: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized July 2010 — first in Latin America",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Legalized up to 14 weeks December 2020",
      },
      {
        label: "Cannabis (recreational)",
        status: "decriminalized",
        note: "Personal use decriminalized; medical legal since 2017",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for peacetime offenses since 1984",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "License required; strict controls",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling sex tolerated; third-party exploitation illegal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Provincial jurisdiction; casinos and sports betting legal",
      },
      {
        label: "Currency controls",
        status: "restricted",
        note: "Cepo cambiario (FX controls) historically present; Milei loosening",
      },
      {
        label: "Dual citizenship",
        status: "legal",
        note: "Argentina permits dual nationality",
      },
      { label: "Polygamy", status: "illegal", note: "Criminal offense" },
    ],
  },
  cl: {
    items: [
      {
        label: "Same-sex civil union",
        status: "legal",
        note: "AUC (civil union) since 2015; full marriage legalized Dec 2021",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Legal only in 3 cases: rape, fetal malformation, risk to mother (2017)",
      },
      {
        label: "Cannabis (recreational)",
        status: "decriminalized",
        note: "Personal use (up to 10g) decriminalized; medicinal legal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 2001 for peacetime crimes",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "License required; Ley de Control de Armas",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling sex legal; brothels and pimping illegal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Regulated casinos under Ley de Casinos",
      },
      {
        label: "Indigenous land occupation protests",
        status: "restricted",
        note: "Mapuche protests regularly prosecuted under anti-terrorism law",
      },
      {
        label: "Euthanasia",
        status: "illegal",
        note: "Not legal; euthanasia bill repeatedly rejected",
      },
      {
        label: "Polygamy",
        status: "illegal",
        note: "Criminal offense under Penal Code",
      },
    ],
  },
  ir: {
    items: [
      {
        label: "Same-sex relationships (male)",
        status: "illegal",
        note: "Death penalty under Sharia; documented executions",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized except to save mother's life; limited fetal defect exceptions",
      },
      {
        label: "Alcohol",
        status: "illegal",
        note: "Prohibited since Islamic Revolution 1979; underground trade",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Death penalty for trafficking; imprisonment for use",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "World's 2nd most executions; hanging and stoning documented",
      },
      {
        label: "Hijab for women",
        status: "illegal",
        note: "Mandatory by law since 1983; Woman-Life-Freedom uprising 2022",
      },
      {
        label: "Satellite dish / foreign media",
        status: "illegal",
        note: "Widespread use despite ban; periodic confiscations",
      },
      {
        label: "Insulting Supreme Leader",
        status: "illegal",
        note: "Up to 5 years imprisonment under Article 514 IC",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized; temporary marriage (sigheh) provides legal gray area",
      },
      {
        label: "Social media (unfiltered)",
        status: "illegal",
        note: "WhatsApp, Instagram banned; VPN use widespread but restricted",
      },
    ],
  },
  my: {
    items: [
      {
        label: "Same-sex relationships (male)",
        status: "illegal",
        note: "Section 377A PC up to 20 years; Sharia caning for Muslims",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Legal up to 120 days if health risk; broad access in practice",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Death penalty for trafficking >200g; severe penalties",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; mandatory for drug trafficking (reform underway 2023)",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Legal for non-Muslims; prohibited for Muslims under Sharia",
      },
      {
        label: "Gambling (non-Muslim)",
        status: "restricted",
        note: "Genting Highland casino legal; online and street gambling illegal",
      },
      {
        label: "Sedition/criticism of royalty",
        status: "illegal",
        note: "Sedition Act 1948; Penal Code 499; MCMC cyber laws used",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under Penal Code and Sharia law",
      },
      {
        label: "Proselytizing to Muslims",
        status: "illegal",
        note: "Evangelizing to Muslims is criminal under state Sharia laws",
      },
      {
        label: "Dual citizenship",
        status: "illegal",
        note: "Generally not permitted; automatic loss upon acquiring another",
      },
    ],
  },
  vn: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; same-sex ceremonies not criminalized since 2015",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Broadly legal up to 22 weeks; widely available",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Death penalty for large-scale trafficking; imprisonment for use",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; mainly for drug trafficking, murder, terrorism",
      },
      {
        label: "Criticizing the Communist Party",
        status: "illegal",
        note: "Article 117/331 Penal Code; journalists and bloggers imprisoned",
      },
      {
        label: "Gun ownership",
        status: "illegal",
        note: "Effectively banned for civilians",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Prohibited for Vietnamese citizens; allowed for foreigners in designated resorts; reform ongoing",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized; widespread practice",
      },
      {
        label: "Formation of independent unions",
        status: "illegal",
        note: "Only state-controlled VGCL permitted; independent unions banned",
      },
      {
        label: "Spreading 'false information' online",
        status: "illegal",
        note: "Cybersecurity Law 2019; broad definition used to silence dissent",
      },
    ],
  },
  id: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Not federally criminalized but Aceh province applies Sharia caning; new KUHP 2022 vague",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "New Penal Code 2022: banned except rape and health risk; medical exceptions limited",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Strict; possession can lead to 12-year imprisonment",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; mainly for drug trafficking and terrorism",
      },
      {
        label: "Blasphemy",
        status: "illegal",
        note: "Blasphemy Law (No.1/PNPS/1965); up to 5 years; used against minorities",
      },
      {
        label: "Sex outside marriage (new KUHP)",
        status: "illegal",
        note: "Criminalized in 2022 Criminal Code (effective 2026); controversial",
      },
      {
        label: "Gambling",
        status: "illegal",
        note: "Prohibited; widespread illegal gambling",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Legal nationally; banned in several Sharia-influenced districts",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under public morals laws",
      },
      {
        label: "Cohabitation outside marriage (new KUHP)",
        status: "illegal",
        note: "Criminalized under 2022 KUHP; applies to foreigners too",
      },
    ],
  },
  th: {
    items: [
      {
        label: "Same-sex civil partnership",
        status: "legal",
        note: "Marriage Equality Act passed September 2024; effective January 2025",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Legal up to 12 weeks (2021 reform); up to 20 weeks for health",
      },
      {
        label: "Cannabis (recreational)",
        status: "restricted",
        note: "Decriminalized 2022 but 2024 law re-restricts recreational use; medical legal",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; lethal injection since 2003; rare use",
      },
      {
        label: "Lèse-majesté (criticizing monarchy)",
        status: "illegal",
        note: "Article 112 Criminal Code; up to 15 years; hundreds charged 2020-2024",
      },
      {
        label: "Gambling (casinos)",
        status: "illegal",
        note: "Prohibited; government studying legalization (2024 commission)",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized but widespread; 'massage parlor' economy tolerated",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "License required; regulations less strict than many Asian nations",
      },
      {
        label: "Magic mushrooms (psilocybin)",
        status: "illegal",
        note: "Narcotic; removed from traditional medicine list 2021",
      },
      {
        label: "Dual citizenship",
        status: "illegal",
        note: "Generally not permitted; some exceptions",
      },
    ],
  },
  pk: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Section 377 PPC; up to 2 years or life imprisonment",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save mother's life; widespread unsafe abortions",
      },
      {
        label: "Blasphemy",
        status: "illegal",
        note: "Death penalty under 295-C PPC; widely misused; extrajudicial killings",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Prohibited for Muslims; licensed for non-Muslims",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited under CNSA; traditional cannabis (charas) use widespread",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; one of highest death-row populations in the world",
      },
      {
        label: "Criticizing the military",
        status: "illegal",
        note: "PECA cybercrime law; Army Act used; thousands of cases",
      },
      {
        label: "Apostasy (leaving Islam)",
        status: "restricted",
        note: "Not explicitly illegal but treated as blasphemy in practice; life-threatening",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized; practiced in designated red-light areas in major cities",
      },
      {
        label: "Child marriage (under 16 girls)",
        status: "illegal",
        note: "Child Marriage Restraint Act; enforcement weak in rural areas",
      },
    ],
  },
  bd: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Section 377 Penal Code (British colonial era); up to life imprisonment",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "'Menstrual regulation' (MR) widely available up to 10 weeks; otherwise illegal",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; enforcement inconsistent",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; used for murder, rape, and terrorism",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Permits required for non-Muslims; widely available in cities",
      },
      {
        label: "Blasphemy / criticizing Islam",
        status: "illegal",
        note: "Digital Security Act 2018 used; online critics imprisoned",
      },
      {
        label: "Criticizing the government online",
        status: "illegal",
        note: "DSA/Cyber Security Act; 1,000+ cases filed 2018-2023",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized; Kandapara brothel is an officially registered exception",
      },
      {
        label: "Gambling",
        status: "illegal",
        note: "Prohibited; widespread cricket/kabaddi betting underground",
      },
      {
        label: "Child labor (under 14)",
        status: "illegal",
        note: "BLCA 2006 prohibits; enforcement weak in garment industry",
      },
    ],
  },
  et: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Article 629 Criminal Code; up to 15 years imprisonment",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Legal for rape, incest, fetal defect, and mother's health; access limited",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited under Drug Administration Law",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Active; used for terrorism and atrocity crimes",
      },
      {
        label: "Criticizing the government",
        status: "restricted",
        note: "Anti-terrorism proclamation 2009 used broadly; journalists imprisoned",
      },
      {
        label: "Hate speech (ethnic incitement)",
        status: "illegal",
        note: "Hate Speech and Disinformation Law 2020; concerns about misuse",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under Proclamation 414/2004",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Some legal casinos in Addis Ababa; regulation inconsistent",
      },
      {
        label: "Female genital mutilation (FGM)",
        status: "illegal",
        note: "Criminalized 2005 but practiced in ~65% of girls in rural areas",
      },
      {
        label: "Child marriage",
        status: "illegal",
        note: "FDRE Family Law sets 18 minimum age; enforcement weak in remote areas",
      },
    ],
  },
  ke: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Sections 162-165 Penal Code; upheld by Supreme Court 2023",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Only when mother's life at risk; Access limited despite broader Article 26(4) Constitution",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; Narcotic Drugs and Psychotropic Substances Act",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Legal but de facto moratorium since 1987; commuted to life sentences",
      },
      {
        label: "Corruption (formal law)",
        status: "illegal",
        note: "EACC Act; Anti-Corruption prosecutions have increased under Ruto",
      },
      {
        label: "Female genital mutilation (FGM)",
        status: "illegal",
        note: "Prohibition of FGM Act 2011; practice persists in some communities",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized but enforcement inconsistent in Nairobi",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Regulated by Betting Control and Licensing Board; M-Pesa betting major industry",
      },
      {
        label: "Child marriage",
        status: "illegal",
        note: "Marriage Act 2014; minimum age 18",
      },
      {
        label: "Drug trafficking",
        status: "illegal",
        note: "Narcotic Drugs Act; Mombasa port a significant transit point",
      },
    ],
  },
  ua: {
    items: [
      {
        label: "Same-sex civil partnership",
        status: "restricted",
        note: "Bill 9103 proposed 2023; under wartime consideration; not yet passed",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Up to 12 weeks; up to 22 weeks for health reasons",
      },
      {
        label: "Cannabis (medical)",
        status: "legal",
        note: "Medical cannabis legalized July 2023; recreational still illegal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 2000; moratorium preceded abolition",
      },
      {
        label: "Defection/desertion (wartime)",
        status: "illegal",
        note: "Military Code; severe penalties under martial law",
      },
      {
        label: "Collaboration with Russia (wartime)",
        status: "illegal",
        note: "Criminal Code amendments 2022; up to life imprisonment",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Online gambling legalized 2020; industry growing rapidly",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under Administrative Code Article 181",
      },
      {
        label: "Denial of Russian aggression as war",
        status: "illegal",
        note: "Legitimizing or justifying Russian aggression criminalized",
      },
      {
        label: "Dual citizenship",
        status: "illegal",
        note: "Officially prohibited; enforcement limited given diaspora scale",
      },
    ],
  },
  pl: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitution defines marriage as man-woman; civil partnership bill pending (Tusk govt)",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Near-total ban since 2021 (Constitutional Tribunal); life-threatening exceptions remain; reform stalled",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Medical cannabis legal 2017; recreational illegal",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1997" },
      {
        label: "Holocaust statement violations",
        status: "illegal",
        note: "'Defamation of the Polish nation' law 2018 (IPN Act); partially amended after protest",
      },
      {
        label: "Hate speech (racial/ethnic)",
        status: "illegal",
        note: "Article 256 KK; incitement to hatred criminalized",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "State monopoly on slot machines; online gambling restricted to licensed operators",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling sex legal; buying and organizing illegal",
      },
      {
        label: "Conversion therapy",
        status: "restricted",
        note: "Not explicitly illegal; Tusk government seeking ban",
      },
      {
        label: "Dual citizenship",
        status: "legal",
        note: "Permitted; common among Polish diaspora",
      },
    ],
  },
  it: {
    items: [
      {
        label: "Same-sex civil union",
        status: "legal",
        note: "Unioni Civili legalized 2016; adoption rights limited",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Up to 90 days (Law 194/1978); but 70%+ of doctors are conscientious objectors",
      },
      {
        label: "Cannabis (personal)",
        status: "decriminalized",
        note: "Administrative fine; medical cannabis legal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1948 (constitution); military abolition 1994",
      },
      {
        label: "Fascist apologia (public glorification)",
        status: "illegal",
        note: "Mancino Law 1993; promotion of fascism or racial hatred illegal",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling sex legal; procuring/pimping/brothels illegal (Law Merlin 1958)",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Regulated by ADM; major gambling market; loot box debate ongoing",
      },
      {
        label: "Surrogate pregnancy",
        status: "illegal",
        note: "Law 40/2004; illegal for Italian couples; 2024 extended ban for overseas surrogacy",
      },
      {
        label: "Dual citizenship",
        status: "legal",
        note: "Permitted; jus sanguinis allows Italian descent claims generations back",
      },
      { label: "Polygamy", status: "illegal", note: "Criminal offense" },
    ],
  },
  se: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized May 2009",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 18 weeks; counseling available but not required",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Strictly illegal; one of Europe's most restrictive approaches",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1972" },
      {
        label: "Sex work (buying)",
        status: "illegal",
        note: "Purchasing sex illegal since 1999 (Nordic model); selling legal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Regulated under Gambling Act 2019 by Spelinspektionen",
      },
      {
        label: "Hate speech",
        status: "illegal",
        note: "Chapter 16 §8 BrB; ethnicity, religion, sexuality protected",
      },
      {
        label: "Surrogate pregnancy",
        status: "illegal",
        note: "Commercial surrogacy illegal; altruistic surrogacy legal gray area",
      },
      {
        label: "Euthanasia / assisted suicide",
        status: "illegal",
        note: "Not legal; palliative sedation only",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "License required for hunting/sport; strict criteria",
      },
    ],
  },
  no: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized January 2009",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks; to 18 weeks with committee approval",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Decriminalization reform reversed 2023; possession fined/imprisoned",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1979 (civilian), 1979 (military)",
      },
      {
        label: "Sex work (buying)",
        status: "illegal",
        note: "Nordic model since 2009; selling sex legal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "State monopoly (Norsk Tipping); independent online operators blocked",
      },
      {
        label: "Hate speech",
        status: "illegal",
        note: "Section 185 Penal Code; race, religion, sexual orientation protected",
      },
      {
        label: "Euthanasia",
        status: "illegal",
        note: "Not legal; government commission studying 2024",
      },
      {
        label: "Dual citizenship",
        status: "legal",
        note: "Permitted since 2020 reform",
      },
      {
        label: "Alcohol (spirits) monopoly",
        status: "restricted",
        note: "Vinmonopolet state monopoly for wines and spirits above 4.75% ABV",
      },
    ],
  },
  ru: {
    items: [
      {
        label: "Same-sex marriage/relationships",
        status: "illegal",
        note: "'LGBT movement' designated extremist organization Nov 2023",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Up to 12 weeks; government restricting access in some regions 2024",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Strictly prohibited; criminal penalties from 3 years",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Moratorium since 1996; Chechnya reportedly uses it",
      },
      {
        label: "Criticizing the war in Ukraine",
        status: "illegal",
        note: "'Discrediting the army' law 2022; up to 15 years",
      },
      {
        label: "'Gay propaganda'",
        status: "illegal",
        note: "Extended to all ages in 2023",
      },
      {
        label: "VPN usage",
        status: "restricted",
        note: "Unauthorized VPNs blocked; use technically restricted",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Legal in 4 special zones only; online gambling banned",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under Administrative Code",
      },
      {
        label: "Foreign agent activities without registration",
        status: "illegal",
        note: "Foreign Agents Law broadly applied to NGOs and journalists",
      },
    ],
  },
  ph: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; SOGIE equality bill stalled in Congress for years",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized under the Revised Penal Code; no explicit rape or incest exception",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Medical access only via compassionate special permits",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 2006; restoration bills filed repeatedly since",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Prostitution criminalized; anti-trafficking law used for enforcement",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed by PAGCOR; offshore POGO licences banned from 2024",
      },
    ],
  },
  cd: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; same-sex acts not explicitly criminalized in the penal code",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Maputo Protocol applied since 2018 for rape, incest and health grounds",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; widely cultivated informally in the east",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained; the long-standing moratorium was lifted in March 2024",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Solicitation and procuring criminalized rather than the act itself",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed casinos and a national lottery operate under state regulation",
      },
    ],
  },
  tz: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; penalties up to life imprisonment",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited under the Drugs Control and Enforcement Act",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions carried out since 1994",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under the Penal Code",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and regulated by the Gaming Board of Tanzania",
      },
    ],
  },
  mm: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Section 377 of the colonial-era penal code retained",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; severe narcotics penalties",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Executions resumed in 2022 after a decades-long pause",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under the Suppression of Prostitution Act",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "2019 law permits licensed casinos for foreign visitors only",
      },
    ],
  },
  co_co: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Constitutional Court ruling, April 2016",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Decriminalized up to 24 weeks, Constitutional Court, February 2022",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Personal possession decriminalized and medical use legal; recreational sale bills have failed",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1910; prohibited by the constitution",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Recognized as work by the Constitutional Court; exploitation remains criminal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Regulated by Coljuegos; first country in Latin America to licence online gambling, 2016",
      },
    ],
  },
  es: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized July 2005, the third country worldwide to do so",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request to 14 weeks; 2023 reform removed parental consent for 16-17 year olds",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Private consumption and cultivation tolerated; public use draws administrative fines",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 1995; barred by the constitution",
      },
      {
        label: "Euthanasia",
        status: "legal",
        note: "Legalized March 2021 under strict eligibility conditions",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not itself criminalized, but procuring and third-party profit are",
      },
    ],
  },
  sd: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; the death penalty for the offence was removed in 2020",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, fetal death, or to save the life of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited under narcotics law",
      },
      { label: "Death penalty", status: "legal", note: "Retained and applied" },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Ban lifted for non-Muslims in 2020",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
    ],
  },
  ug: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Anti-Homosexuality Act 2023; aggravated offences carry the death penalty",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; limited licensed medical export cultivation",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained; no civilian executions since 2005",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under the Penal Code Act",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Regulated by the national gaming board; new licences suspended at times",
      },
    ],
  },
  dz: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized under Article 338 of the penal code",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted where the life or health of the pregnant woman is at risk",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; a significant transit route",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1993",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Production legal; sale and public consumption heavily restricted",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
    ],
  },
  iq: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "2024 amendment criminalizes same-sex relations, up to 15 years",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized with a narrow exception to save the life of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; severe narcotics penalties",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained and applied, including for terrorism offences",
      },
      {
        label: "Alcohol",
        status: "illegal",
        note: "Import and sale banned by a 2016 law, enforced from 2023",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
    ],
  },
  af: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; severe corporal penalties under Taliban rule",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Effectively prohibited in practice",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Cultivation banned by decree in 2022",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained; public executions have resumed",
      },
      { label: "Gambling", status: "illegal", note: "Prohibited" },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
    ],
  },
  ma: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized under Article 489 of the penal code",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted to save the life of the pregnant woman; 2015 reform widened grounds to rape and incest",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical and industrial cultivation legalized in 2021; recreational use remains illegal",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1993",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under the penal code",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed casinos and a state lottery operate",
      },
    ],
  },
  uz: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Article 120 criminalizes male same-sex relations; retained in the 2021 penal code revision",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request in the first trimester",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; strict narcotics penalties",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 2008",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Administrative and criminal penalties apply",
      },
      {
        label: "Gambling",
        status: "illegal",
        note: "Banned since 2007; limited state lottery",
      },
    ],
  },
  ao: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized by the 2019 penal code, effective 2021; discrimination also banned",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, fetal impairment, or risk to health",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1992; barred by the constitution",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed casinos operate under state regulation",
      },
    ],
  },
  pe: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; foreign marriages have been registered following court rulings",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted only on therapeutic grounds to protect life or health",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical use legalized 2017; small-quantity possession not penalized",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained only for treason in wartime; no executions since 1979",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Legal and registered in designated areas; procuring is criminal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Casinos and sports betting licensed; online betting regulated from 2023",
      },
    ],
  },
  ye: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; capital punishment provided for in law",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "legal", note: "Retained and applied" },
      {
        label: "Alcohol",
        status: "illegal",
        note: "Prohibited for Muslims; very limited exceptions",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
    ],
  },
  gh: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized as unnatural carnal knowledge; a bill to widen penalties passed parliament in 2024",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to health",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "2020 act permits licensed low-THC industrial cultivation; recreational use illegal",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Removed for ordinary crimes in 2023; retained for high treason",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under the Criminal Offences Act",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed by the Gaming Commission of Ghana",
      },
    ],
  },
  mz: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized by the 2015 penal code",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks since the 2014 penal code reform",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1990; barred by the constitution",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed casinos operate in tourist areas",
      },
    ],
  },
  np: {
    items: [
      {
        label: "Same-sex marriage",
        status: "restricted",
        note: "Interim Supreme Court order allowed registration from 2023; full legislation pending",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks; later on specified grounds",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Banned since 1976; decriminalization bills debated",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1997; barred by the constitution",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under anti-trafficking legislation",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Casinos licensed for foreign nationals; citizens largely barred",
      },
    ],
  },
  ve: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; constitution defines marriage as between a man and a woman",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; small-quantity possession may be treated as personal use",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1863, the first country to do so for all crimes",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Not criminalized; regulated in practice through health registration",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Casinos restricted; state lottery operates",
      },
    ],
  },
  mg: {
    items: [
      {
        label: "Same-sex relationships",
        status: "restricted",
        note: "Legal between adults; an age-of-consent provision applies only to same-sex acts",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Long prohibited outright; a 2017 law permits therapeutic abortion",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2015" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed casinos operate in tourist centres",
      },
    ],
  },
  cm: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Section 347-1 criminalizes same-sex relations; up to five years",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape or to protect health",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1997",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed casinos and betting shops operate",
      },
    ],
  },
  ci: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized, though public-decency provisions have been used against couples",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to life",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 2000; barred by the constitution",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed lottery and betting under state regulation",
      },
    ],
  },
  ne: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized; no anti-discrimination protection",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted to save life or on serious health grounds",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1976",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not itself criminalized; procuring is",
      },
    ],
  },
  tw: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized May 2019, the first in Asia",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Permitted up to 24 weeks on broad grounds; spousal consent requirement debated",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Category 2 narcotic; strict penalties",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained; a 2024 constitutional ruling sharply narrowed its application",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Legal only inside designated zones, which local governments have not established",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Sports lottery legal; casinos not permitted on the main island",
      },
    ],
  },
  bf: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized historically; a 2024 draft penal code proposed criminalization",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to life",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for ordinary crimes in the 2018 penal code",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not itself criminalized; procuring is",
      },
    ],
  },
  ml: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized by the 2024 penal code, which reversed prior non-criminalization",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, or to save life",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1980",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not itself criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "State lottery and licensed betting operate",
      },
    ],
  },
  lk: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Sections 365 and 365A retained; a decriminalization bill has progressed since 2023",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Prohibited generally; permitted in licensed ayurvedic medicine",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1976",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under the Vagrants Ordinance",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed casinos operate; a regulatory authority was created in 2025",
      },
    ],
  },
  sy: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Article 520 criminalizes same-sex relations",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "legal", note: "Retained" },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      { label: "Gambling", status: "restricted", note: "Tightly restricted" },
    ],
  },
  mw: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; a constitutional challenge was rejected in 2024",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman; reform bill stalled",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Industrial and medical cultivation legalized 2020; recreational use illegal",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Mandatory death sentences struck down; no executions since 1992",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not itself criminalized; related offences are enforced",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed by the Malawi Gaming Board",
      },
    ],
  },
  ro: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; ECHR ruled in 2023 that the lack of civil partnership breaches the Convention",
      },
      { label: "Abortion", status: "legal", note: "On request up to 14 weeks" },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Recreational use prohibited; medical framework very limited",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1990; barred by the constitution",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Subject to administrative penalties",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and regulated by the national gambling office",
      },
    ],
  },
  zm: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; penalties up to life imprisonment",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on broad health and socio-economic grounds, but requires three doctors",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Licensed medical and export cultivation permitted from 2019; recreational use illegal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for murder and treason in 2022",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and betting operate",
      },
    ],
  },
  kz: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 1998; no anti-discrimination protection",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; constitution defines marriage as between a man and a woman",
      },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited despite widespread wild growth",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 2021",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Casinos permitted only in two designated zones",
      },
    ],
  },
  so: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; sharia penalties applied in some regions",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; khat is legal and widely used",
      },
      { label: "Death penalty", status: "legal", note: "Retained and applied" },
      { label: "Alcohol", status: "illegal", note: "Prohibited" },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
    ],
  },
  ec: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Constitutional Court ruling, June 2019",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape and risk to health following 2021-22 court rulings and law",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Personal possession below threshold quantities not penalized; medical use permitted",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1906; barred by the constitution",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Not criminalized; regulated through health registration",
      },
      {
        label: "Gambling",
        status: "illegal",
        note: "Casinos banned by 2011 referendum",
      },
    ],
  },
  nl: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized April 2001, the first country in the world",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request to viability (about 24 weeks); the mandatory five-day wait was removed in 2023",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Sale tolerated in licensed coffeeshops; a regulated supply-chain trial began in 2023",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for ordinary crimes 1870, for all crimes 1982",
      },
      {
        label: "Euthanasia",
        status: "legal",
        note: "Legalized 2002 under strict due-care criteria",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Legal and licensed since 2000",
      },
    ],
  },
  gt: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred; civil code defines marriage as between a man and a woman",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 2000",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Not criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Operates in a limited legal framework",
      },
    ],
  },
  sn: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Article 319 criminalizes same-sex acts; bills to widen penalties have been rejected",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2004" },
      {
        label: "Sex work",
        status: "legal",
        note: "Legal for registered workers over 21; unregistered work is penalized",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "State lottery and licensed casinos operate",
      },
    ],
  },
  td: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized by the 2017 penal code",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to life",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for ordinary crimes in 2020",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  kh: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; same-sex relations are not criminalized",
      },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited, though historically tolerated in some cooking",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1989; barred by the constitution",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "Criminalized under the 2008 anti-trafficking law",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Casinos licensed for foreigners; citizens barred from most gaming",
      },
    ],
  },
  zw: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Male same-sex acts criminalized; constitution bars same-sex marriage",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to life",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Licensed medical and industrial cultivation permitted from 2018",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for ordinary crimes in December 2024",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Soliciting and public offences enforced",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and sports betting operate",
      },
    ],
  },
  rw: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized; no anti-discrimination protection",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, forced marriage, or risk to health",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; strict penalties",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 2007" },
      { label: "Gambling", status: "legal", note: "Licensed and regulated" },
    ],
  },
  gn: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized under the penal code",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to life",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for ordinary crimes in 2016",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  bj: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized; public-decency provisions may still apply",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "legal",
        note: "Broadly legalized in 2021 up to 12 weeks, among the most permissive in the region",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2016" },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not itself criminalized; procuring is",
      },
    ],
  },
  bi: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized since 2009; penalties of up to two years",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted to save life or protect health",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2009" },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  bo: {
    items: [
      {
        label: "Same-sex marriage",
        status: "restricted",
        note: "Marriage constitutionally barred; free unions registrable since a 2020 ruling",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, or risk to health",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; coca cultivation is separately legal and regulated",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1997" },
      {
        label: "Sex work",
        status: "legal",
        note: "Legal and regulated through health registration",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed under the national gaming authority",
      },
    ],
  },
  tn: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Article 230 criminalizes sodomy; up to three years",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks since 1973, among the earliest in the region",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; Law 52 penalties eased by 2017 reform",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1991",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Legal only in a small number of licensed establishments",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Casinos licensed for foreign visitors",
      },
    ],
  },
  be: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized June 2003, the second country worldwide",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks; extension to 18 weeks has been debated",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Possession of up to 3g by adults not prosecuted as a priority",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 1996; barred by the constitution",
      },
      {
        label: "Euthanasia",
        status: "legal",
        note: "Legalized 2002; extended to minors in 2014",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Decriminalized in 2022 with employment rights added in 2024",
      },
    ],
  },
  ht: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; same-sex relations are not criminalized",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized; a 2020 draft penal code liberalizing it was not brought into force",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1987; barred by the constitution",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not clearly criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Lottery and casinos operate",
      },
    ],
  },
  ss: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized under the 2008 penal code",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "legal", note: "Retained and applied" },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited regulated operation",
      },
    ],
  },
  do: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Total ban; the three-grounds exception has been repeatedly rejected",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1966; barred by the constitution",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Not criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Casinos and sports betting licensed",
      },
    ],
  },
  cu: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Approved by referendum in the 2022 Families Code",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Legal and free on request up to 10 weeks since 1965",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; severe penalties",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 2003",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not itself criminalized; pimping and harassment offences enforced",
      },
      {
        label: "Gambling",
        status: "illegal",
        note: "Casinos banned since 1959",
      },
    ],
  },
  cz: {
    items: [
      {
        label: "Same-sex marriage",
        status: "restricted",
        note: "Partnership upgraded in 2024 to give near-marriage rights, without the name",
      },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Possession of small amounts is an administrative offence; medical use legal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1990; barred by the charter of rights",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not criminalized but unregulated; brothels formally prohibited",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and regulated, including online",
      },
    ],
  },
  gr: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized February 2024, the first Orthodox-majority country to do so",
      },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical cannabis legalized 2017; recreational use prohibited",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 2004",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Legal and licensed, though licences are hard to obtain in practice",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and regulated by the national gaming commission",
      },
    ],
  },
  hn: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred; an Inter-American Court ruling in 2025 found this in breach",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Total ban; emergency contraception was legalized in 2023",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1956; barred by the constitution",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Not criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Casinos and lottery licensed",
      },
    ],
  },
  pt: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized June 2010; adoption rights added 2016",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 10 weeks following the 2007 referendum",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "All personal drug possession decriminalized in 2001, treated as a health matter",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for civil crimes in 1867, among the earliest in Europe",
      },
      {
        label: "Euthanasia",
        status: "legal",
        note: "Passed in 2023 after repeated vetoes; implementation has been slow",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not criminalized; procuring and brothel-keeping are",
      },
    ],
  },
  jo: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized since 1951, though public-morality provisions are used",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted to protect the life or health of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; strict penalties",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained; executions resumed in 2014 after an eight-year pause",
      },
      { label: "Gambling", status: "illegal", note: "Prohibited" },
    ],
  },
  az_as: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 2000; no anti-discrimination protection",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks; sex-selective abortion separately restricted",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1998, the first in the South Caucasus",
      },
      {
        label: "Gambling",
        status: "illegal",
        note: "Banned since 1998; state lottery permitted",
      },
    ],
  },
  pg: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized under the criminal code; up to 14 years",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to preserve the life or health of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished January 2022",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed under the national gaming board",
      },
    ],
  },
  tj: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 1998; severe social and police pressure persists",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Moratorium in force since 2004; not formally abolished",
      },
      { label: "Gambling", status: "illegal", note: "Banned since 2007" },
    ],
  },
  hu: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred since 2012; registered partnership available",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks; a 2022 decree added a fetal heartbeat requirement",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; no medical programme",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1990 by constitutional court ruling",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Legal for registered workers in designated zones",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "State-concession model; online licensing opened in 2023",
      },
    ],
  },
  by: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 1994; no anti-discrimination protection",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred",
      },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; severe penalties under Decree No. 6",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "The only country in Europe still carrying out executions",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos operate; online gambling regulated since 2019",
      },
    ],
  },
  at: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized January 2019 by constitutional court ruling",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks; not covered by public insurance",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical use permitted; possession is an offence though often not prosecuted",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 1968",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Legal and regulated, with registration and health checks required",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Operated under a limited state concession model",
      },
    ],
  },
  tg: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized under the penal code",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to life",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2009" },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not itself criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "State lottery and licensed betting operate",
      },
    ],
  },
  ch: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Approved by referendum in September 2021, effective July 2022",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks since a 2002 referendum",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Possession under 10g fined; regulated adult-use pilot trials running since 2022",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 1992",
      },
      {
        label: "Assisted suicide",
        status: "legal",
        note: "Permitted where no selfish motive is involved, uniquely open to non-residents",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Legal and regulated at cantonal level",
      },
    ],
  },
  sl: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Male same-sex acts criminalized under colonial-era law",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted to save life; the 2022 Safe Motherhood Bill has not been enacted",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2021" },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not itself criminalized; related offences enforced",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed betting and lottery operate",
      },
    ],
  },
  py: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; constitution defines marriage as between a man and a woman",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical and industrial cultivation licensed; recreational use illegal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1992; barred by the constitution",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Legal from age 18; procuring is criminal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed by the national gaming commission",
      },
    ],
  },
  la: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; same-sex relations are not criminalized",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only on narrow medical grounds",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; strict penalties",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no confirmed executions in decades",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Casinos licensed in special economic zones for foreigners",
      },
    ],
  },
  ni: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; same-sex relations decriminalized in 2008",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Total ban since 2006, with no exception to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 1979" },
      {
        label: "Sex work",
        status: "legal",
        note: "Not criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Casinos and lottery licensed",
      },
    ],
  },
  kg: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 1998; a 2023 law restricts related public expression",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred",
      },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited despite extensive wild growth",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 2007" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Banned in 2012; casinos for foreign visitors permitted again from 2021",
      },
    ],
  },
  rs: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred; a same-sex union bill was shelved in 2021",
      },
      { label: "Abortion", status: "legal", note: "On request up to 10 weeks" },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; medical framework very limited",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 2002" },
      {
        label: "Sex work",
        status: "illegal",
        note: "An administrative offence under the public order act",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and regulated, including online",
      },
    ],
  },
  ly: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; penalties of up to five years",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained; applied by competing authorities",
      },
      { label: "Alcohol", status: "illegal", note: "Prohibited since 1969" },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
    ],
  },
  bg: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred; no civil partnership, though ECHR rulings have found a violation",
      },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; among the stricter regimes in the EU",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1998" },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not criminalized but unregulated; procuring is criminal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and regulated; state monopoly on lottery since 2020",
      },
    ],
  },
  sv: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred since 2015",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Total ban since 1998, including where the life of the pregnant woman is at risk",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Abolished for ordinary crimes; retained in military law for wartime",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Not criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Casinos and lottery licensed",
      },
    ],
  },
  tm: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Male same-sex acts criminalized; up to two years",
      },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; severe penalties",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1999, the first in Central Asia",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      { label: "Gambling", status: "illegal", note: "Prohibited" },
    ],
  },
  dk: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized June 2012; the first country to recognize registered partnership, in 1989",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request; the limit was extended from 12 to 18 weeks in 2025",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; a medical pilot programme runs alongside",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for ordinary crimes 1933, for all crimes 1994",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Decriminalized 1999; procuring remains illegal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and regulated since the 2012 liberalization",
      },
    ],
  },
  cg: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized between adults; a higher age of consent applies",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, or risk to life",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2015" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed casinos operate",
      },
    ],
  },
  cf: {
    items: [
      {
        label: "Same-sex relationships",
        status: "restricted",
        note: "Not criminalized as such; public displays are penalized under the penal code",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape or risk to life",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2022" },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
    ],
  },
  fi: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized March 2017 following a citizens initiative",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks since the 2023 reform removed the two-doctor requirement",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; possession usually results in a fine",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for ordinary crimes 1949, for all crimes 1972",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling is legal; purchasing from a trafficked person is criminal",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "State monopoly under Veikkaus; a licensing system is being introduced",
      },
    ],
  },
  ps: {
    items: [
      {
        label: "Same-sex relationships",
        status: "restricted",
        note: "Not criminalized in the West Bank; criminalized in Gaza under the 1936 code",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained; executions have been carried out in Gaza",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      { label: "Gambling", status: "illegal", note: "Prohibited" },
    ],
  },
  sk: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred since 2014; no civil partnership",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks; repeated restriction bills have narrowly failed",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; among the stricter regimes in the EU",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1990" },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not criminalized but unregulated; procuring is criminal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and regulated, including online since 2019",
      },
    ],
  },
  lr: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Voluntary sodomy is a misdemeanour under the penal code",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to health",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law despite ratifying an abolition protocol; no recent executions",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed by the national lottery authority",
      },
    ],
  },
  lb: {
    items: [
      {
        label: "Same-sex relationships",
        status: "restricted",
        note: "Article 534 still used, though several courts have declined to apply it",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; personal status is governed by religious courts",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized with a narrow exception to save life",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical and industrial cultivation legalized in 2020; recreational use illegal",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 2004",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Casino du Liban holds an exclusive concession",
      },
    ],
  },
  cr: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized May 2020, the first in Central America",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted to protect the life or health of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical and hemp cultivation legalized 2022; recreational use illegal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1877, among the earliest worldwide",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Not criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Casinos licensed; a long-standing online licensing hub",
      },
    ],
  },
  nz: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized August 2013, the first in the Asia-Pacific region",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Removed from the Crimes Act in 2020; on request up to 20 weeks",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical use legal since 2018; a 2020 legalization referendum narrowly failed",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for murder 1961, for all crimes 1989",
      },
      {
        label: "Euthanasia",
        status: "legal",
        note: "Assisted dying approved by referendum, in force from November 2021",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Fully decriminalized by the Prostitution Reform Act 2003",
      },
    ],
  },
  ie: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Approved by referendum in May 2015, the first country to do so by popular vote",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Legalized after the 2018 referendum repealed the Eighth Amendment; on request to 12 weeks",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; a medical access programme operates",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1990; constitutionally barred by referendum in 2001",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling legal; purchasing criminalized under the 2017 Nordic-model law",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed under a regulatory authority established in 2024",
      },
    ],
  },
  mr: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; capital punishment provided for in law for Muslim men",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1987",
      },
      { label: "Alcohol", status: "illegal", note: "Prohibited for Muslims" },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
    ],
  },
  om: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized under the 2018 penal code",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only on narrow medical grounds",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; severe penalties",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained; rarely applied",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Licensed sale to non-Muslims; personal licences required",
      },
      { label: "Gambling", status: "illegal", note: "Prohibited" },
    ],
  },
  pa: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Supreme Court upheld the ban in 2023",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, fetal impairment, or risk to life, subject to a review board",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical use legalized 2021; recreational use illegal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1922; barred by the constitution",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Legal and registered; procuring is criminal",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and regulated; online gaming permitted",
      },
    ],
  },
  kw: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; the transgender impersonation offence was struck down in 2022",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on medical grounds with spousal consent",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; severe penalties",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained; executions resumed in 2022",
      },
      { label: "Alcohol", status: "illegal", note: "Prohibited since 1964" },
      { label: "Gambling", status: "illegal", note: "Prohibited" },
    ],
  },
  hr: {
    items: [
      {
        label: "Same-sex marriage",
        status: "restricted",
        note: "Constitutionally barred; life partnership grants most rights, and adoption was allowed by a 2022 ruling",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 10 weeks; conscientious objection is widespread",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical use legal since 2015; possession is a misdemeanour",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1990" },
      { label: "Sex work", status: "illegal", note: "A misdemeanour offence" },
      { label: "Gambling", status: "legal", note: "Licensed and regulated" },
    ],
  },
  ge_as: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 2000; a 2024 law restricts related public expression",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred since 2018",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks, with a mandatory waiting period",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Constitutional Court removed penalties for personal consumption in 2018; sale remains illegal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1997; barred by the constitution",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and a significant sector; advertising restricted from 2022",
      },
    ],
  },
  er: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized under the penal code",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted to save life or on grave health grounds",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no confirmed judicial executions in recent years",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      { label: "Gambling", status: "illegal", note: "Prohibited" },
    ],
  },
  uy: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized August 2013",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks since 2012, the first in South America",
      },
      {
        label: "Cannabis",
        status: "legal",
        note: "Fully legalized in 2013, the first country in the world to do so",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1907, among the earliest worldwide",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Legal and regulated with registration",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "State casinos and licensed private operators",
      },
    ],
  },
  mn_as: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 2002; hate-crime protection added in the 2017 criminal code",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2017" },
      {
        label: "Gambling",
        status: "illegal",
        note: "Casinos prohibited; state lottery permitted",
      },
    ],
  },
  ba: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; a same-sex partnership law has been drafted in one entity",
      },
      { label: "Abortion", status: "legal", note: "On request up to 10 weeks" },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2001" },
      { label: "Sex work", status: "illegal", note: "A misdemeanour offence" },
      { label: "Gambling", status: "legal", note: "Licensed at entity level" },
    ],
  },
  pr: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legal since Obergefell v. Hodges, 2015, as a US territory",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Legal; restriction bills have been repeatedly rejected",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical cannabis legal since 2017; recreational use illegal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Barred by the territorial constitution since 1952",
      },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "Licensing liberalized by the 2020 weapons act",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Casinos and sports betting licensed",
      },
    ],
  },
  am: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 2003; no anti-discrimination protection",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred; foreign marriages are recognized on paper",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks; sex-selective abortion separately restricted",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2003" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Casinos confined to designated zones; online gambling restricted from 2024",
      },
    ],
  },
  jm: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "The buggery law is retained; a constitutional challenge was dismissed in 2023",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized under the Offences Against the Person Act; reform repeatedly stalled",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Possession of up to 2oz decriminalized in 2015; medical industry licensed",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1988",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed by the Betting, Gaming and Lotteries Commission",
      },
    ],
  },
  lt: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred; a civil union bill has repeatedly failed",
      },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical use permitted since 2019; possession is an administrative offence",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1998 by constitutional court ruling",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "An administrative offence for both parties",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and regulated; advertising banned from 2021",
      },
    ],
  },
  al_al: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 1995; anti-discrimination law in force since 2010",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical and industrial cultivation legalized in 2023; recreational use illegal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 2007",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Most betting banned in 2019; casinos permitted in limited locations",
      },
    ],
  },
  qa: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized under the penal code and sharia provisions",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on narrow medical grounds with committee approval",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; severe penalties",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained; rarely applied",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Licensed sale to non-Muslims in designated venues",
      },
      { label: "Gambling", status: "illegal", note: "Prohibited" },
    ],
  },
  gm: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; aggravated homosexuality penalties introduced in 2014 remain",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Moratorium since 2018; abolition proposed in the draft constitution",
      },
      {
        label: "Female genital mutilation (FGM)",
        status: "illegal",
        note: "Banned in 2015; a 2024 repeal attempt was defeated",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed lottery and betting operate",
      },
    ],
  },
  bw: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized by the High Court in 2019, upheld on appeal in 2021",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to health",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained and still carried out",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed by the national gambling authority",
      },
    ],
  },
  na: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Sodomy law struck down by the High Court in 2024",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Foreign marriages recognized by a 2023 Supreme Court ruling; parliament moved to bar them",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to health",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1990; barred by the constitution",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and betting operate",
      },
    ],
  },
  md: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred; no civil partnership",
      },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; possession is an administrative offence",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1995; barred by the constitution since 2006",
      },
      {
        label: "Sex work",
        status: "illegal",
        note: "An administrative offence",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "State monopoly on lottery and betting since 2016",
      },
    ],
  },
  ls: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Male same-sex acts decriminalized by the 2012 penal code",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, or risk to health",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Licensed medical cultivation since 2017, the first in Africa",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1995",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and lottery operate",
      },
    ],
  },
  ga_af: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Criminalized in 2019 and decriminalized again in 2020",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, or risk to health",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2010" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed casinos operate",
      },
    ],
  },
  si: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized by constitutional court ruling in 2022, the first post-communist EU state",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 10 weeks; constitutionally protected",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Possession of small amounts is an administrative offence; medical use permitted",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1989; barred by the constitution",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Decriminalized 2003; procuring remains illegal",
      },
      { label: "Gambling", status: "legal", note: "Licensed and regulated" },
    ],
  },
  mk: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; no civil partnership",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks; 2019 law removed earlier procedural barriers",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical cannabis legalized 2016 with an export industry; recreational use illegal",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1991" },
      { label: "Sex work", status: "illegal", note: "A misdemeanour offence" },
      { label: "Gambling", status: "legal", note: "Licensed and regulated" },
    ],
  },
  gw: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized; no anti-discrimination protection",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on health grounds and in cases of rape",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; a known trafficking transit point",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1993; barred by the constitution",
      },
      {
        label: "Female genital mutilation (FGM)",
        status: "illegal",
        note: "Banned since 2011",
      },
    ],
  },
  lv: {
    items: [
      {
        label: "Same-sex marriage",
        status: "restricted",
        note: "Constitutionally barred; civil partnership available since July 2024",
      },
      { label: "Abortion", status: "legal", note: "On request up to 12 weeks" },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; possession is an administrative offence at first instance",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 2012, the last EU state to do so",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Legal and regulated with health requirements; brothels prohibited",
      },
      { label: "Gambling", status: "legal", note: "Licensed and regulated" },
    ],
  },
  xk: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitution is read as permitting it, but the civil code recognizing unions failed in 2022",
      },
      { label: "Abortion", status: "legal", note: "On request up to 10 weeks" },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Barred by the constitution",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "illegal",
        note: "Banned in 2019 following violent incidents",
      },
    ],
  },
  bh: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 1976; public-morality provisions still used",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on medical grounds",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; severe penalties",
      },
      {
        label: "Death penalty",
        status: "legal",
        note: "Retained; executions resumed in 2017",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Licensed sale to non-Muslims",
      },
    ],
  },
  gq: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized; no anti-discrimination protection",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on narrow medical grounds",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished September 2022",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  tt: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Decriminalized by the High Court in 2018, but that ruling was overturned on appeal in 2025",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized with a narrow health exception under case law",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Possession of up to 30g decriminalized in 2019; home cultivation permitted",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Mandatory for murder in law; no executions since 1999",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed under the 2021 gambling control act",
      },
    ],
  },
  ee: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized January 2024, the first Baltic and post-Soviet state to do so",
      },
      { label: "Abortion", status: "legal", note: "On request up to 11 weeks" },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; small-quantity possession is a misdemeanour",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1998" },
      {
        label: "Sex work",
        status: "legal",
        note: "Not criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed and regulated, including online",
      },
    ],
  },
  tl: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized; no anti-discrimination protection",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Barred by the constitution since independence",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  mu: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Sodomy law struck down by the Supreme Court in October 2023",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to health since 2012",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 1995" },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos, lottery and betting operate",
      },
    ],
  },
  cy: {
    items: [
      {
        label: "Same-sex marriage",
        status: "restricted",
        note: "Civil partnership since 2015; marriage not available",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks since the 2018 reform",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical cannabis legalized 2019; recreational use illegal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 2002",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not criminalized; brothels and procuring are",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "One integrated casino resort licensed; online casino games banned",
      },
    ],
  },
  sz: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Common-law sodomy offence retained; registration of an LGBTQ group was refused in 2022",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, or risk to health",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; medical framework debated",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1983",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      { label: "Gambling", status: "legal", note: "Licensed casinos operate" },
    ],
  },
  dj: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized; strong social stigma persists",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; khat is legal and widely used",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1995; barred by the constitution",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "One licensed casino operates",
      },
    ],
  },
  fj: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 2010; the constitution bars discrimination on sexual orientation",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to health",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 2015",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed lottery and limited gaming",
      },
    ],
  },
  km: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized under Article 318 of the penal code",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1997",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Restricted for Muslims; available to visitors",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
    ],
  },
  gy: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Buggery law retained, though cross-dressing laws were struck down in 2018",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 8 weeks since 1995, unusually permissive for the region",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; sentencing reform has been debated",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1997",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and lottery operate",
      },
    ],
  },
  bt: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized by parliament in 2020, effective 2021",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, or risk to health",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited despite growing wild",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 2004" },
      {
        label: "Tobacco",
        status: "restricted",
        note: "A total sales ban applied from 2010 until it was lifted in 2021",
      },
    ],
  },
  sb: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized under the penal code",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1966; barred by the constitution",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  lu: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized January 2015",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks; decriminalized fully in 2014",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Home cultivation of up to four plants and private use permitted from 2023",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1979" },
      { label: "Euthanasia", status: "legal", note: "Legalized 2009" },
      {
        label: "Sex work",
        status: "legal",
        note: "Not criminalized; procuring is",
      },
    ],
  },
  sr: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized; equal age of consent since 2015",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Criminalized in law but widely available in practice",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2015" },
      { label: "Gambling", status: "legal", note: "Licensed casinos operate" },
    ],
  },
  me_eu: {
    items: [
      {
        label: "Same-sex marriage",
        status: "restricted",
        note: "Life partnership recognized since 2021; marriage not available",
      },
      { label: "Abortion", status: "legal", note: "On request up to 10 weeks" },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2002" },
      { label: "Sex work", status: "illegal", note: "A misdemeanour offence" },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and betting operate",
      },
    ],
  },
  eh: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Moroccan penal code applied in the areas under Moroccan administration",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Follows Moroccan law where that applies",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Moroccan law applies; a long-standing execution moratorium is in force",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Governed by the administering authority",
      },
    ],
  },
  cv: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 2004; anti-discrimination protection in the penal code",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks since 1986",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1981; barred by the constitution",
      },
      { label: "Gambling", status: "legal", note: "Licensed casinos operate" },
    ],
  },
  mv: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; penalties include imprisonment and flogging",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only on narrow medical or religious grounds",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; severe penalties",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1954",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Prohibited for citizens; served in resorts to visitors",
      },
      { label: "Gambling", status: "illegal", note: "Prohibited" },
    ],
  },
  mt_eu: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized July 2017",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Near-total ban until a narrow life-and-health exception was added in 2023",
      },
      {
        label: "Cannabis",
        status: "legal",
        note: "Personal use and home cultivation legalized in December 2021, the first in the EU",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished for all crimes in 2000",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not criminalized; soliciting and procuring are",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "A major licensing jurisdiction under the Malta Gaming Authority",
      },
    ],
  },
  bn: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Criminalized; the 2019 sharia code provides for stoning, under an execution moratorium",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized with a narrow exception to save life",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; severe penalties",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1957",
      },
      {
        label: "Alcohol",
        status: "illegal",
        note: "Sale banned since 1991; limited personal import for non-Muslims",
      },
      { label: "Gambling", status: "illegal", note: "Prohibited" },
    ],
  },
  bz: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized by the Supreme Court in 2016",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on health and socio-economic grounds",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Possession of up to 10g decriminalized in 2017",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1985",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and lottery operate",
      },
    ],
  },
  bs: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 1991; unequal age of consent removed later",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized with a narrow exception to save life",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; a medical and decriminalization bill has been proposed",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 2000",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Casinos licensed; residents were long barred, with rules eased from 2014",
      },
    ],
  },
  is: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized June 2010 by unanimous parliamentary vote",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 22 weeks since 2019, among the most permissive limits",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; possession usually results in a fine",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1928" },
      {
        label: "Sex work",
        status: "restricted",
        note: "Selling legal; purchasing criminalized under the 2009 Nordic-model law",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Only licensed charitable lotteries permitted; no commercial casinos",
      },
    ],
  },
  vu: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized; no anti-discrimination protection",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on health grounds",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Licensed medical and industrial cultivation permitted from 2018",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished at independence in 1980",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and an online licensing regime operate",
      },
    ],
  },
  bb: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Buggery and indecency laws struck down by the High Court in December 2022",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized; civil union has been proposed",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Permitted on broad grounds up to 12 weeks since 1983",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Sacramental use permitted and small-quantity possession decriminalized in 2019",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Mandatory sentence removed in 2018; no executions since 1984",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Lottery and betting licensed; casinos not permitted",
      },
    ],
  },
  st: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 2012",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on health grounds and in cases of rape",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1990; barred by the constitution",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  ws: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Male same-sex acts criminalized; the impersonation offence was repealed in 2013",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted to protect life or mental health",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2004" },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed lottery and limited gaming",
      },
    ],
  },
  lc: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Buggery law retained though not actively enforced",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to health",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; decriminalization has been debated regionally",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1995",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and lottery operate",
      },
    ],
  },
  gu: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legal since 2015, ahead of and then confirmed by Obergefell, as a US territory",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Legal but no provider practised on-island for years; a 2021 telemedicine law was contested",
      },
      {
        label: "Cannabis",
        status: "legal",
        note: "Recreational use legalized in 2019",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1952" },
      {
        label: "Gun ownership",
        status: "restricted",
        note: "Licensing required under territorial law",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed gaming; casino proposals repeatedly rejected",
      },
    ],
  },
  ki: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Male same-sex acts criminalized under the penal code",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished at independence in 1979",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  fm: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized at national level",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished; barred by the constitution",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Regulated at state level",
      },
    ],
  },
  gd: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Buggery law retained though not actively enforced",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on health grounds",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; Rastafarian sacramental use has been debated",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1978",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and lottery operate",
      },
    ],
  },
  vc: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Buggery law retained; a constitutional challenge was dismissed in 2024",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on health grounds",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical and sacramental cannabis licensed since 2018",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1995",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and lottery operate",
      },
    ],
  },
  to: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Male same-sex acts criminalized under the criminal offences act",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1982",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  sc: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized 2016",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted for rape, incest, fetal impairment, or risk to health",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1993; barred by the constitution",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and betting operate",
      },
    ],
  },
  ag: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Buggery law struck down by the High Court in July 2022",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted to save the life of the pregnant woman",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Possession of up to 15g and home cultivation decriminalized in 2018",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1991",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and online gaming operate",
      },
    ],
  },
  ad: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Civil union upgraded to full marriage equality in February 2023",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Historically a total ban; a narrow exception framework was agreed in 2024",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1990, the first in Western Europe to do so constitutionally",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "A single casino concession was awarded in 2019",
      },
    ],
  },
  dm: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Buggery and indecency laws struck down by the High Court in April 2024",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on health grounds",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Possession of small quantities decriminalized in 2020",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; no executions since 1986",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and online gaming operate",
      },
    ],
  },
  bm: {
    items: [
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Legalized in 2017, then reversed; the Privy Council upheld the reversal in 2022",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Permitted on broad grounds since the 2016 reform",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Possession of up to 7g decriminalized; a legalization bill was blocked by the governor",
      },
      { label: "Death penalty", status: "illegal", note: "Abolished 1999" },
      {
        label: "Gun ownership",
        status: "illegal",
        note: "Private firearm ownership effectively prohibited",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "A casino framework was legislated but not brought into operation",
      },
    ],
  },
  gl: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Danish marriage law extended to Greenland in 2016",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "On request up to 12 weeks under Danish-derived law",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished; Danish law applies",
      },
      {
        label: "Sex work",
        status: "legal",
        note: "Not criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Regulated under Danish licensing",
      },
    ],
  },
  fo: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized July 2017 after a narrow parliamentary vote",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "More restrictive than Denmark; permitted on specified grounds rather than on request",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished; Danish law applies",
      },
      {
        label: "Alcohol",
        status: "restricted",
        note: "Sold through a state monopoly after a long prohibition era",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  kn: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Buggery and indecency laws struck down by the High Court in August 2022",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on health grounds",
      },
      {
        label: "Cannabis",
        status: "decriminalized",
        note: "Possession of small quantities and sacramental use decriminalized in 2020",
      },
      {
        label: "Death penalty",
        status: "restricted",
        note: "Retained in law; last execution in 2008",
      },
      {
        label: "Gambling",
        status: "legal",
        note: "Licensed casinos and online gaming operate",
      },
    ],
  },
  mh: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished; barred by the constitution",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  li: {
    items: [
      {
        label: "Same-sex marriage",
        status: "legal",
        note: "Legalized by parliament in 2024, in force from January 2025",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized; a 2011 liberalization referendum was rejected",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 1987" },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "legal",
        note: "Casinos licensed since 2017; a phase-out was approved by referendum in 2025",
      },
    ],
  },
  mc: {
    items: [
      {
        label: "Same-sex marriage",
        status: "restricted",
        note: "Cohabitation contract available since 2020; marriage not recognized",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Decriminalized for the woman in 2019; still not generally available",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1962; barred by the constitution",
      },
      {
        label: "Sex work",
        status: "restricted",
        note: "Not criminalized; procuring is",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Casinos licensed, but Monegasque citizens are barred from gaming rooms",
      },
    ],
  },
  sm: {
    items: [
      {
        label: "Same-sex marriage",
        status: "restricted",
        note: "Civil union with near-marriage rights since 2018; marriage not available",
      },
      {
        label: "Abortion",
        status: "legal",
        note: "Legalized by referendum in 2021, ending a ban dating to 1865",
      },
      {
        label: "Cannabis",
        status: "restricted",
        note: "Medical cannabis permitted; recreational use illegal",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1865, among the first in the world",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Limited licensed operation",
      },
    ],
  },
  pw: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized in the 2014 penal code",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Constitutionally barred since 2008",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized with a narrow exception to save life",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished; barred by the constitution",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Casino proposals have been repeatedly rejected",
      },
    ],
  },
  ck: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized by the 2023 crimes act",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on health grounds",
      },
      {
        label: "Cannabis",
        status: "illegal",
        note: "Prohibited; a medical framework has been debated",
      },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished; not provided for in law",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Licensed lottery and limited gaming",
      },
    ],
  },
  tv: {
    items: [
      {
        label: "Same-sex relationships",
        status: "illegal",
        note: "Male same-sex acts criminalized under the penal code",
      },
      {
        label: "Abortion",
        status: "illegal",
        note: "Permitted only to save the life of the pregnant woman",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished 1978 at independence",
      },
      { label: "Sex work", status: "illegal", note: "Criminalized" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Very limited regulated activity",
      },
    ],
  },
  nr: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Decriminalized in the 2016 crimes act",
      },
      { label: "Same-sex marriage", status: "illegal", note: "Not recognized" },
      {
        label: "Abortion",
        status: "illegal",
        note: "Criminalized with a narrow exception to save life",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      { label: "Death penalty", status: "illegal", note: "Abolished 2016" },
      {
        label: "Gambling",
        status: "restricted",
        note: "Very limited regulated activity",
      },
    ],
  },
  nu: {
    items: [
      {
        label: "Same-sex relationships",
        status: "legal",
        note: "Not criminalized; New Zealand-derived law applies",
      },
      {
        label: "Same-sex marriage",
        status: "illegal",
        note: "Not recognized locally",
      },
      {
        label: "Abortion",
        status: "restricted",
        note: "Permitted on health grounds",
      },
      { label: "Cannabis", status: "illegal", note: "Prohibited" },
      {
        label: "Death penalty",
        status: "illegal",
        note: "Abolished; not provided for in law",
      },
      {
        label: "Gambling",
        status: "restricted",
        note: "Very limited regulated activity",
      },
    ],
  },
};

/** Where the list's subjects are recorded. */
export const LEGAL_STATUS_SOURCES = [
  {
    label: "ILGA World – Homophobia Report",
    url: "https://ilga.org/reports-and-data/state-sponsored-homophobia-report/",
  },
  { label: "Equaldex – Global LGBTQ+ Laws", url: "https://equaldex.com/" },
  {
    label: "Center for Reproductive Rights",
    url: "https://reproductiverights.org/maps/abortion-laws/",
  },
  { label: "UNODC Drug Laws", url: "https://www.unodc.org/wdr2023/" },
];
