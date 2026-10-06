/**
 * The cities the site profiles: who each is and where, and the site's own
 * notes on its languages, landmarks and religions.
 *
 * It holds no figures. A city's population, land area and built-up area are
 * the United Nations', in cityFigures.ts (build-city-figures.cjs), matched to
 * the city by name, country and position. The figures that stood here - GDP,
 * "indices" of cost of living, crime, safety and air quality, a tourism rank,
 * counts of headquarters and "tech hubs", five years of "trends" - were typed
 * in and no body publishes them as given; they are gone.
 *
 * Each city's first line is read by build-city-places.cjs and
 * build-city-figures.cjs: keep id, name, country and countryCode on it, in
 * that order.
 */
export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: string;
  languages: string[];
  landmarks: string[];
  religions: string[];
}

export const citiesData: City[] = [
  {
    id: "sgp", name: "Singapore", country: "Singapore", countryCode: "SG", region: "Southeast Asia",
    languages: ["English", "Mandarin", "Malay", "Tamil"],
    landmarks: ["Marina Bay Sands", "Gardens by the Bay", "Jewel Changi Airport", "Sentosa Island", "Merlion Park"],
    religions: ["Buddhism", "Christianity", "Islam", "Taoism", "Hinduism"],
  },
  {
    id: "seo26", name: "Seoul", country: "South Korea", countryCode: "KR", region: "East Asia",
    languages: ["Korean", "English"],
    landmarks: ["Gyeongbokgung Palace", "N Seoul Tower", "Bukchon Hanok Village", "Dongdaemun Design Plaza", "Lotte World Tower"],
    religions: ["Christianity", "Buddhism", "No Religion", "Confucianism"],
  },
  {
    id: "tky26", name: "Tokyo", country: "Japan", countryCode: "JP", region: "East Asia",
    languages: ["Japanese"],
    landmarks: ["Senso-ji Temple", "Shibuya Crossing", "teamLab Borderless", "Tokyo Skytree", "Odaiba"],
    religions: ["Shinto", "Buddhism"],
  },
  {
    id: "sfo", name: "San Francisco Bay Area", country: "United States", countryCode: "US", region: "North America",
    languages: ["English", "Spanish", "Mandarin", "Tagalog"],
    landmarks: ["Golden Gate Bridge", "Alcatraz", "Silicon Valley Tech Campus Loop", "Salesforce Tower", "Ferry Building"],
    religions: ["No Religion", "Christianity", "Buddhism", "Hinduism", "Judaism"],
  },
  {
    id: "sha26", name: "Shanghai", country: "China", countryCode: "CN", region: "East Asia",
    languages: ["Mandarin Chinese", "Shanghainese (Wu)", "English"],
    landmarks: ["The Bund", "Yu Garden", "Oriental Pearl Tower", "Shanghai Tower", "Zhujiajiao Water Town"],
    religions: ["Buddhism", "Taoism", "Christianity", "Islam"],
  },
  {
    id: "dxb26", name: "Dubai", country: "United Arab Emirates", countryCode: "AE", region: "Middle East",
    languages: ["Arabic", "English", "Hindi", "Urdu", "Tagalog"],
    landmarks: ["Burj Khalifa", "Museum of the Future", "Dubai Creek Harbour", "Palm Jumeirah", "Dubai Frame"],
    religions: ["Islam", "Christianity", "Hinduism", "Buddhism"],
  },
  {
    id: "ams26", name: "Amsterdam", country: "Netherlands", countryCode: "NL", region: "Western Europe",
    languages: ["Dutch", "English", "Arabic", "Turkish"],
    landmarks: ["Rijksmuseum", "Anne Frank House", "Van Gogh Museum", "Canal Ring", "Vondelpark"],
    religions: ["No Religion", "Christianity", "Islam", "Judaism"],
  },
  {
    id: "tal", name: "Tallinn", country: "Estonia", countryCode: "EE", region: "Northern Europe",
    languages: ["Estonian", "Russian", "English"],
    landmarks: ["Tallinn Old Town (UNESCO)", "Kadriorg Palace", "Lennusadam Seaplane Harbour", "Kumu Art Museum", "Toompea Castle"],
    religions: ["No Religion", "Christianity (Lutheran/Orthodox)"],
  },
  {
    id: "hel26", name: "Helsinki", country: "Finland", countryCode: "FI", region: "Northern Europe",
    languages: ["Finnish", "Swedish", "English"],
    landmarks: ["Helsinki Cathedral", "Suomenlinna Sea Fortress", "Temppeliaukio Church", "Design District", "Market Square"],
    religions: ["Christianity (Lutheran)", "No Religion", "Orthodox Christianity", "Islam"],
  },
  {
    id: "zur26", name: "Zurich", country: "Switzerland", countryCode: "CH", region: "Central Europe",
    languages: ["German", "English", "Italian", "French"],
    landmarks: ["Old Town (Altstadt)", "Lake Zurich", "ETH Zurich Campus", "Kunsthaus Museum", "Bahnhofstrasse"],
    religions: ["Christianity (Protestant/Catholic)", "Islam", "No Religion"],
  },
  {
    id: "cph26", name: "Copenhagen", country: "Denmark", countryCode: "DK", region: "Northern Europe",
    languages: ["Danish", "English", "Arabic"],
    landmarks: ["Tivoli Gardens", "The Little Mermaid", "Nyhavn", "Christiansborg Palace", "The Bicycle Superhighway Network"],
    religions: ["Christianity (Lutheran)", "Islam", "No Religion"],
  },
  {
    id: "lon26", name: "London", country: "United Kingdom", countryCode: "GB", region: "Western Europe",
    languages: ["English", "Polish", "Bengali", "Gujarati", "Arabic"],
    landmarks: ["Big Ben & Elizabeth Tower", "Tower of London", "The Shard", "Tate Modern", "Sky Garden"],
    religions: ["No Religion", "Christianity", "Islam", "Hinduism", "Judaism"],
  },
  {
    id: "nyc26", name: "New York City", country: "United States", countryCode: "US", region: "North America",
    languages: ["English", "Spanish", "Chinese", "French", "Bengali"],
    landmarks: ["Statue of Liberty", "Central Park", "One World Trade Center", "High Line", "Brooklyn Bridge"],
    religions: ["Christianity", "Judaism", "Islam", "Hinduism", "Buddhism"],
  },
  {
    id: "par26", name: "Paris", country: "France", countryCode: "FR", region: "Western Europe",
    languages: ["French", "Arabic", "Portuguese", "Spanish", "English"],
    landmarks: ["Eiffel Tower", "Louvre Museum", "Notre-Dame Cathedral (restored)", "Arc de Triomphe", "Centre Pompidou"],
    religions: ["No Religion", "Christianity (Catholic)", "Islam", "Judaism", "Buddhism"],
  },
  {
    id: "bei26", name: "Beijing", country: "China", countryCode: "CN", region: "East Asia",
    languages: ["Mandarin Chinese"],
    landmarks: ["Forbidden City", "Great Wall (Badaling)", "Temple of Heaven", "National Speed Skate Oval", "Tiananmen Square"],
    religions: ["Buddhism", "Taoism", "Confucianism", "Christianity", "Islam"],
  },
  {
    id: "ber26", name: "Berlin", country: "Germany", countryCode: "DE", region: "Central Europe",
    languages: ["German", "English", "Turkish", "Arabic"],
    landmarks: ["Brandenburg Gate", "Berlin Wall Memorial", "Reichstag", "Museum Island", "East Side Gallery"],
    religions: ["No Religion", "Christianity (Protestant/Catholic)", "Islam", "Judaism"],
  },
  {
    id: "tor26", name: "Toronto", country: "Canada", countryCode: "CA", region: "North America",
    languages: ["English", "French", "Mandarin", "Tagalog", "Spanish"],
    landmarks: ["CN Tower", "Royal Ontario Museum", "Distillery District", "Ripley's Aquarium", "Nathan Phillips Square"],
    religions: ["Christianity", "Islam", "Hinduism", "Judaism", "Sikhism"],
  },
  {
    id: "syd26", name: "Sydney", country: "Australia", countryCode: "AU", region: "Oceania",
    languages: ["English", "Mandarin", "Arabic", "Cantonese", "Vietnamese"],
    landmarks: ["Sydney Opera House", "Sydney Harbour Bridge", "Bondi Beach", "Vivid Sydney Light Festival", "The Rocks"],
    religions: ["Christianity", "No Religion", "Islam", "Buddhism", "Hinduism"],
  },
  {
    id: "mum26", name: "Mumbai", country: "India", countryCode: "IN", region: "South Asia",
    languages: ["Marathi", "Hindi", "English", "Gujarati", "Urdu"],
    landmarks: ["Gateway of India", "Chhatrapati Shivaji Terminus", "Marine Drive", "Bandra-Worli Sea Link", "Elephanta Caves"],
    religions: ["Hinduism", "Islam", "Christianity", "Buddhism", "Jainism"],
  },
  {
    id: "sao26", name: "São Paulo", country: "Brazil", countryCode: "BR", region: "South America",
    languages: ["Portuguese", "Spanish", "Italian", "Japanese", "English"],
    landmarks: ["São Paulo Museum of Art (MASP)", "Ibirapuera Park", "Paulista Avenue", "Liberdade (Japantown)", "Pinacoteca"],
    religions: ["Christianity (Catholic)", "Evangelical Christianity", "Spiritism", "No Religion"],
  },
  {
    id: "ist26", name: "Istanbul", country: "Turkey", countryCode: "TR", region: "Middle East",
    languages: ["Turkish", "Kurdish", "Arabic", "English"],
    landmarks: ["Hagia Sophia", "Blue Mosque", "Topkapi Palace", "Grand Bazaar", "Galata Tower"],
    religions: ["Islam (Sunni)", "Christianity", "Judaism"],
  },
  {
    id: "mos26", name: "Moscow", country: "Russia", countryCode: "RU", region: "Eastern Europe",
    languages: ["Russian", "English", "Ukrainian", "Tatar"],
    landmarks: ["Red Square", "Kremlin", "St. Basil's Cathedral", "Bolshoi Theatre", "Tretyakov Gallery"],
    religions: ["Christianity (Orthodox)", "Islam", "Judaism", "No Religion"],
  },
  {
    id: "mex26", name: "Mexico City", country: "Mexico", countryCode: "MX", region: "North America",
    languages: ["Spanish", "Nahuatl", "English", "Mixtec"],
    landmarks: ["Zócalo (Main Square)", "Chapultepec Castle", "Frida Kahlo Museum", "Xochimilco", "UNAM Campus"],
    religions: ["Christianity (Catholic)", "Evangelical Christianity", "No Religion"],
  },
  {
    id: "bue26", name: "Buenos Aires", country: "Argentina", countryCode: "AR", region: "South America",
    languages: ["Spanish", "Italian", "English", "German"],
    landmarks: ["Casa Rosada", "La Boca (Caminito)", "Teatro Colón", "Recoleta Cemetery", "MALBA Art Museum"],
    religions: ["Christianity (Catholic)", "Evangelical Christianity", "Judaism", "No Religion"],
  },
  {
    id: "lag26", name: "Lagos", country: "Nigeria", countryCode: "NG", region: "Africa",
    languages: ["Yoruba", "English", "Igbo", "Hausa", "Pidgin English"],
    landmarks: ["Lekki Conservation Centre", "Nike Art Gallery", "National Museum Lagos", "Eko Atlantic City", "Balogun Market"],
    religions: ["Christianity", "Islam", "Traditional Yoruba Religion"],
  },
  {
    id: "bar26", name: "Barcelona", country: "Spain", countryCode: "ES", region: "Western Europe",
    languages: ["Catalan", "Spanish", "English", "Arabic"],
    landmarks: ["Sagrada Família", "Park Güell", "La Rambla", "Casa Batlló", "Camp Nou (New)"],
    religions: ["Christianity (Catholic)", "Islam", "No Religion"],
  },
  {
    id: "vie26", name: "Vienna", country: "Austria", countryCode: "AT", region: "Central Europe",
    languages: ["German", "English", "Turkish", "Serbian"],
    landmarks: ["Schönbrunn Palace", "St. Stephen's Cathedral", "Belvedere Palace", "Vienna State Opera", "Prater & Giant Ferris Wheel"],
    religions: ["Christianity (Catholic)", "Islam", "No Religion", "Orthodox Christianity"],
  },
  {
    id: "mel26", name: "Melbourne", country: "Australia", countryCode: "AU", region: "Oceania",
    languages: ["English", "Mandarin", "Arabic", "Vietnamese", "Greek"],
    landmarks: ["Federation Square", "Royal Botanic Gardens", "Melbourne Cricket Ground", "Southbank Promenade", "Yarra River Walk"],
    religions: ["Christianity", "No Religion", "Islam", "Buddhism", "Hinduism"],
  },
  {
    id: "hk26", name: "Hong Kong", country: "China (SAR)", countryCode: "HK", region: "East Asia",
    languages: ["Cantonese", "English", "Mandarin"],
    landmarks: ["Victoria Peak", "Victoria Harbour", "Tian Tan Buddha", "West Kowloon Cultural District", "M+ Museum"],
    religions: ["Buddhism", "Taoism", "Christianity", "Confucianism"],
  },
  {
    id: "fra26", name: "Frankfurt", country: "Germany", countryCode: "DE", region: "Central Europe",
    languages: ["German", "English", "Turkish", "Arabic"],
    landmarks: ["Römerberg", "European Central Bank", "Frankfurt Cathedral", "Städel Museum", "Main Tower Sky Terrace"],
    religions: ["Christianity (Catholic/Protestant)", "Islam", "Judaism"],
  },
  {
    id: "joh26", name: "Johannesburg", country: "South Africa", countryCode: "ZA", region: "Africa",
    languages: ["Zulu", "Sotho", "Tswana", "Xhosa", "Afrikaans", "English"],
    landmarks: ["Apartheid Museum", "Soweto Township", "Sandton City", "Constitution Hill", "Walter Sisulu Botanical Garden"],
    religions: ["Christianity (Protestant/Catholic/Zionist)", "Islam", "Hinduism", "Traditional African"],
  },
  {
    id: "kar26", name: "Karachi", country: "Pakistan", countryCode: "PK", region: "South Asia",
    languages: ["Urdu", "Sindhi", "Punjabi", "Pashto", "English"],
    landmarks: ["Mazar-e-Quaid (Jinnah Mausoleum)", "Clifton Beach", "Mohatta Palace", "Frere Hall", "Pakistan Maritime Museum"],
    religions: ["Islam (Sunni)", "Islam (Shia)", "Hinduism", "Christianity"],
  },
  {
    id: "bkk26", name: "Bangkok", country: "Thailand", countryCode: "TH", region: "Southeast Asia",
    languages: ["Thai", "English", "Chinese dialects"],
    landmarks: ["Grand Palace", "Wat Pho", "Chatuchak Market", "Chao Phraya River", "ICON SIAM"],
    religions: ["Buddhism (Theravada)", "Islam", "Christianity", "Hinduism"],
  },
  {
    id: "mco", name: "Monaco", country: "Monaco", countryCode: "MC", region: "Western Europe",
    // A city-state: population, GDP and GDP per capita are the World Bank's
    // country figures (population 2025, GDP 2024), the same ones the
    // Countries page shows. Density is population over the 2 km² area.
    languages: ["French", "Monégasque", "English", "Italian"],
    landmarks: ["Prince\'s Palace", "Monte Carlo Casino", "Oceanographic Museum", "Formula 1 Circuit de Monaco", "Jardin Exotique"],
    religions: ["Christianity (Catholic)", "No Religion", "Islam"],
  },
];
