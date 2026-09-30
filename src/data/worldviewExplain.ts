/**
 * What each Worldview figure measures and why it matters, in plain words.
 *
 * Written from each source's own definition of its measure - the World
 * Bank's indicator notes, Our World in Data's descriptions and the producers'
 * documentation - and kept to what those definitions say and to what is
 * widely established about each measure. Nothing here is a figure: every
 * number the page shows is in worldview.ts or climateIndicators.ts, with its
 * source and year.
 */

export type Explanation = {
  /** What the figure counts, how it is measured, and what it leaves out. */
  what: string;
  /** Why the figure matters: what it tells us about the world. */
  why: string;
};

export const EXPLAIN: Record<string, Explanation> = {
  // ── Society: quality of life ──
  lifeSatisfaction: {
    what: "The average answer when the Gallup World Poll asks people to picture a ladder, with the best possible life for them at the top, 10, and the worst at the bottom, 0, and to say which step they stand on now - the Cantril ladder. The World Happiness Report gives each country's average over three years of surveys; the world figure is Our World in Data's average of the countries surveyed, weighted by population.",
    why: "It asks people themselves how their lives are going, rather than inferring it from income or health. The World Happiness Report finds that life evaluations go with income, health, having someone to count on, the freedom to make life choices, generosity and trust.",
  },
  healthyLifeExpectancy: {
    what: "The years a newborn could expect to live in full health at the year's rates of death, illness and disability: life expectancy with the years spent in poor health taken off, weighted by how severe the ill health is (World Health Organization).",
    why: "Longer lives matter most if the extra years are healthy ones. The gap between life expectancy and healthy life expectancy shows how many years people spend in poor health.",
  },
  ihdi: {
    what: "The UN Development Programme's Human Development Index adjusted for inequality: each of its parts - health, education and income - is discounted by how unequally it is shared across the population. It equals the HDI where everyone is equal, and falls further below it the more unequal things are.",
    why: "Averages can hide how unevenly progress is shared. The gap between the HDI and this index is the human development lost to inequality.",
  },

  // ── Society: people ──
  population: {
    what: "Everyone living in the world at the middle of the year, whatever their citizenship or legal status. The World Bank builds it from the UN Population Division's estimates, which draw on national censuses, population registers and records of births and deaths.",
    why: "How many people there are frames almost every other figure: the demand for food, water, energy, jobs and schooling, and what any total works out to per person.",
  },
  popGrowth: {
    what: "How fast the world's population grew over the year: the exponential rate of change in the mid-year population from one year to the next. For the world as a whole it is births minus deaths, since migration only moves people between countries.",
    why: "It shows whether the world's population is still swelling or levelling off, which shapes how much food, housing, energy and schooling the coming decades will need.",
  },
  fertility: {
    what: "The number of children a woman would have over her life if, at each age, she had children at the rate women of that age had them in the year. It is a snapshot of the year's birth rates, not a count of any real woman's children.",
    why: "Fertility is the main force behind population growth and ageing. Where few children die young, about 2.1 children per woman keeps a population stable over the long run; well below that, populations eventually shrink and grow older.",
  },
  under15: {
    what: "Children aged 0 to 14 as a share of everyone, from the UN Population Division's estimates.",
    why: "A young population needs schools now and jobs soon; a falling share of children is the first sign of a population growing older.",
  },
  aged65: {
    what: "People aged 65 and over as a share of everyone, counting all residents whatever their citizenship, from the UN Population Division's estimates.",
    why: "An older population needs more health care and pensions, paid for by fewer people of working age. The share of older people is the simplest gauge of how far the world is ageing.",
  },
  urban: {
    what: "People living in urban areas as each country's statistical office defines them - the definitions differ from country to country - gathered and smoothed by the UN Population Division's World Urbanization Prospects.",
    why: "Cities are where most jobs, services and growth are found, and where the pressure on housing, transport and infrastructure falls. The move from the countryside to towns is one of the defining changes of modern times.",
  },
  migrantShare: {
    what: "People living in a country other than the one they were born in, refugees included, as a share of the world's population. The UN estimates this international migrant stock every five years from censuses, population registers and surveys.",
    why: "Migration moves people towards work and safety, sends money home, and changes both the countries people leave and those they settle in. The share shows how much of humanity lives away from its birthplace.",
  },

  // ── Society: health ──
  lifeExpectancy: {
    what: "How many years a newborn would live if the death rates at each age in the year stayed the same throughout its life. It sums up the year's death rates at every age, from infancy to old age; it is not a forecast of how long today's babies will actually live.",
    why: "It is the broadest single measure of a population's health. It rises as fewer children die, diseases are brought under control and older people live longer, and it falls in pandemics, famines and wars.",
  },
  childMortality: {
    what: "The chance that a newborn dies before turning five, per 1,000 live births, at the year's death rates. The UN Inter-agency Group for Child Mortality Estimation - UNICEF, the WHO, the World Bank and the UN Population Division - estimates it from death registration, censuses and household surveys.",
    why: "Most deaths of young children come from causes that can be prevented or treated - complications around birth, infections, diarrhoea and malnutrition - so this rate is one of the clearest signs of a society's health care, nutrition and living conditions.",
  },
  maternalMortality: {
    what: "Women who die from causes related to pregnancy or its management, while pregnant or within 42 days of the pregnancy's end, for every 100,000 live births. Few countries record every such death, so the WHO, UNICEF, UNFPA and the World Bank estimate it with a statistical model.",
    why: "Nearly all maternal deaths can be prevented with skilled care in pregnancy and childbirth, so the ratio shows how well health systems serve women. It is one of the widest gaps in health between rich and poor countries.",
  },
  measles: {
    what: "Children aged 12 to 23 months who had been vaccinated against measles before their first birthday, or at any time before the survey; one dose counts. The WHO and UNICEF estimate it from countries' reports and surveys.",
    why: "Measles is highly contagious and can kill or disable young children, and outbreaks return quickly when coverage slips. That makes it a standard gauge of how well routine immunisation reaches children.",
  },
  hiv: {
    what: "People aged 15 to 49 living with HIV, as a share of everyone that age, whether or not they know it or are being treated. UNAIDS estimates it with models built on surveys and testing data.",
    why: "HIV remains one of the world's major infectious diseases. The share living with it rises when infections spread, but also when treatment keeps people alive for longer, so it is best read alongside new infections and deaths.",
  },
  suicide: {
    what: "Deaths by suicide in the year for every 100,000 people. It is a crude rate - not adjusted for the age make-up of the population - from the WHO's Global Health Observatory, which estimates it where deaths are not fully registered.",
    why: "Suicide is a leading cause of death, not least among young people, and much of it is preventable. The rate reflects mental health, access to care and to means, and social conditions.",
  },
  roadDeaths: {
    what: "Deaths from road traffic injuries for every 100,000 people, as the WHO estimates them - drivers, passengers, cyclists and people on foot. The world figure was last published for 2019.",
    why: "Road crashes are the leading cause of death for children and young adults, and most happen in low- and middle-income countries. Safer roads, vehicles and speeds prevent many of them.",
  },
  healthSpend: {
    what: "What is spent on health care in the year - by governments, insurers and households - as a share of the world's output. It counts the health goods and services used in the year, not hospital buildings, equipment or stockpiles, from the WHO's Global Health Expenditure Database.",
    why: "It shows how much of the world's resources go to health. More is not always better - costs differ, and much depends on how well the money is spent - which is why it carries no verdict here.",
  },

  // ── Society: food ──
  undernourished: {
    what: "People whose usual food intake is too little, in calories, to keep up a normal, active and healthy life. The FAO estimates it from the food available in each country, how unevenly it is shared between households, and how much energy people need.",
    why: "Hunger is the most basic deprivation. It stunts children's growth, weakens resistance to disease and holds back learning and work, and it rises with war, economic shocks and drought.",
  },
  foodInsecure: {
    what: "People in households where at least one adult reported, at times during the year, eating worse food or less of it, or going without, for lack of money or other resources. The FAO measures it with the same eight survey questions in every country - the Food Insecurity Experience Scale.",
    why: "It reaches beyond outright hunger to the many more people whose access to food is uncertain, showing how far poverty and rising prices bite into diets.",
  },
  stunting: {
    what: "Children under five who are too short for their age - more than two standard deviations below the WHO's child growth standards. UNICEF, the WHO and the World Bank estimate it together from household surveys.",
    why: "Stunting is the mark of long-term undernutrition and repeated infection in early childhood. Its effects on health and learning last into adult life, which makes it one of the most telling measures of children's well-being.",
  },

  // ── Society: education ──
  literacy: {
    what: "People aged 15 and over who can both read and write, with understanding, a short simple statement about their everyday life. The UNESCO Institute for Statistics compiles it from censuses and household surveys, which many countries carry out only every few years.",
    why: "Reading and writing open the way to further learning, better work, health information and taking part in public life; literacy is the foundation of an educated society.",
  },
  primaryCompletion: {
    what: "Children entering the last grade of primary school for the first time, whatever their age, as a share of children of the official age for that grade (UNESCO). Because late starters and older pupils count too, it can exceed 100%.",
    why: "Completing primary school is the minimum the world's governments have committed to for every child under the Sustainable Development Goals, and it is the gateway to secondary school.",
  },
  lowerSecondary: {
    what: "Young people entering the last grade of lower secondary school for the first time, whatever their age, as a share of those of the official age for that grade (UNESCO). Late and older pupils count, so it can exceed 100%.",
    why: "Lower secondary school - typically up to about 15 - is where many pupils in poorer countries leave education; completing it widens the path to further study and skilled work.",
  },
  tertiaryEnrol: {
    what: "Everyone enrolled in universities, colleges and other higher education, whatever their age, as a share of the five-year age group that follows the end of secondary school (UNESCO's gross enrolment ratio). Mature students count too, so it measures the scale of higher education rather than the share of young people in it.",
    why: "Higher education trains the professionals, researchers and skilled workers economies depend on, and its growth tracks how far countries are moving into knowledge-based work.",
  },
  schoolingYears: {
    what: "The average number of years adults aged 25 and over have spent in formal education, repeated years not counted. Each person's highest completed level is turned into years - finishing secondary school counts as about twelve, never attending as none - from censuses and surveys, as the UNDP's Human Development Report compiles it.",
    why: "It measures the education a population already has, rather than what today's pupils are getting, and changes slowly as better-schooled generations reach adulthood. It is one of the parts of the Human Development Index.",
  },
  eduSpend: {
    what: "What governments - national, regional and local - spend on education, running costs, buildings and transfers included, as a share of the world's output (UNESCO Institute for Statistics). Fees and other private spending are not counted.",
    why: "It shows how much of the world's resources public budgets give to schooling. It carries no verdict: what is achieved depends as much on how the money is spent as on how much.",
  },

  // ── Society: access & equality ──
  water: {
    what: "People whose drinking water comes from an improved source - piped water, a protected well or spring, a borehole, rainwater, or packaged or delivered water - that is at home, available when needed and free from contamination: the WHO/UNICEF Joint Monitoring Programme's 'safely managed' level, from household surveys, censuses and official records.",
    why: "Safe water at home prevents disease, above all the diarrhoea that kills young children, and saves the hours - mostly women's and girls' - spent fetching water.",
  },
  sanitation: {
    what: "People using a toilet or latrine not shared with other households, whose waste is safely disposed of where it is or carried away and treated: the WHO/UNICEF Joint Monitoring Programme's 'safely managed' level.",
    why: "Safe sanitation keeps human waste out of water and food and cuts the spread of disease. It is also a matter of dignity and safety, particularly for women and girls.",
  },
  handwashing: {
    what: "People whose home has a place to wash hands with soap and water - fixed or mobile, from a sink with a tap to a bucket or basin (WHO/UNICEF Joint Monitoring Programme).",
    why: "Washing hands with soap is one of the cheapest and most effective ways to stop the spread of infections such as diarrhoea and pneumonia.",
  },
  workGap: {
    what: "Men's labour force participation minus women's, in percentage points: the difference between the share of men aged 15 and over who are working or looking for work and the share of women who are, from the ILO's modelled estimates.",
    why: "The gap shows how far women are out of paid work, whether by choice or held back by care duties, social norms or law. Narrowing it raises household incomes and what economies produce.",
  },

  // ── Economy: output & prices ──
  gdp: {
    what: "The total value of the goods and services produced in the world in the year - every country's gross domestic product added up - in current US dollars at market exchange rates. It is not adjusted for inflation, so part of any rise is rising prices, and swings in exchange rates move it too.",
    why: "GDP is the standard measure of the size of economies: the income that pays wages, profits and taxes. It measures activity, not well-being, so this page gives it no verdict.",
  },
  gdpGrowth: {
    what: "How much the world's output grew in the year once inflation is taken out: the change in world GDP at constant 2015 prices and exchange rates.",
    why: "Growth is the headline gauge of economic health. Steady growth brings jobs and rising incomes; a year in which the world economy shrinks, as in 2009 and 2020, is a global recession. It carries no verdict because faster is not always better.",
  },
  inflation: {
    what: "How fast consumer prices rose over the year: the change in the cost of a typical basket of goods and services, from consumer price indices. The world figure is the World Bank's aggregate of countries' rates.",
    why: "Rising prices erode what wages, savings and pensions can buy, and hurt the poorest most. Most central banks aim for low, stable inflation, so a rise or a fall is not simply better or worse, and it carries no verdict.",
  },
  unemployment: {
    what: "People without work who are available for work and looking for it, as a share of the labour force - everyone working or looking. The ILO models it for every country from labour force surveys and other data, so countries and years without a survey are estimated.",
    why: "Joblessness costs people income, skills and well-being, and shows how much of the world's willing labour is going unused. It can be low in poor countries because few people can afford not to work, so it is read alongside vulnerable work.",
  },
  youthUnemployment: {
    what: "Young people aged 15 to 24 who are without work but available for it and looking, as a share of the labour force of that age (ILO modelled estimates). Students who are not looking for work are not counted.",
    why: "Joblessness early in working life can leave lasting marks on pay and prospects, and young people's unemployment rate is usually well above adults'.",
  },
  labourForce: {
    what: "People aged 15 and over who are working or looking for work, as a share of everyone that age (ILO modelled estimates). Students, retirees, carers and others outside paid work are not in the labour force.",
    why: "It shows how much of the population takes part in the economy. It falls as more young people stay in education and populations age, as well as when people give up looking, so it carries no verdict.",
  },

  // ── Economy: saving, investment & money ──
  savings: {
    what: "Gross national saving: what countries earn - their national income - less what they spend on consumption, plus net transfers from abroad, as a share of output.",
    why: "Savings pay for investment in buildings, machinery and infrastructure. Too little leaves economies short of capital; too much, with too little spending, can hold growth back - so it carries no verdict.",
  },
  investment: {
    what: "Gross capital formation: spending on new buildings, machinery, equipment, roads and other lasting assets, plus changes in stocks of goods, as a share of the world's output.",
    why: "Investment builds the capacity to produce more in future, so it is a leading sign of growth - though what it is spent on matters as much as how much.",
  },
  marketCap: {
    what: "The value of the shares of companies listed on the world's stock exchanges - each share's price times the number of shares - at the end of the year, as a share of output (World Federation of Exchanges). Investment funds and companies that only hold other listed shares are left out.",
    why: "It shows how large stock markets are next to the economy, as a way of raising capital and holding wealth. It moves with share prices, so it swings with the markets.",
  },
  remittances: {
    what: "Money people working abroad send home to their families, plus the pay of workers employed across a border or for part of the year, in current US dollars, from countries' balance of payments. Money sent through informal channels is not captured.",
    why: "For many developing countries remittances bring in more money from abroad than aid or foreign investment, and more steadily, and they go straight to households.",
  },

  // ── Economy: debt & openness ──
  govDebt: {
    what: "Everything governments - central, state and local, with their social security funds - owe, as a share of world GDP: the IMF's general government gross debt, from its World Economic Outlook. The latest year may be an IMF estimate; its projections for later years are left out.",
    why: "Borrowing lets governments spread the cost of investment and cushion crises, but as debt rises, more of their budgets go on interest and less room is left for the next emergency.",
  },
  extDebt: {
    what: "What low- and middle-income countries' governments and businesses owe to lenders abroad - public and private, long- and short-term, IMF credit included - as a share of their gross national income (World Bank International Debt Statistics).",
    why: "Debt owed abroad must usually be repaid in foreign currency, so high levels leave countries exposed when their currencies fall or interest rates rise - the root of many debt crises.",
  },
  trade: {
    what: "Exports and imports of goods and services added together, as a share of world output. Since one country's export is another's import, the world figure counts each sale twice, and is best read as how closely economies are tied together.",
    why: "Trade lets countries specialise, spreads technology and lowers prices, but also passes shocks from one economy to another. It is the classic gauge of globalisation, and carries no verdict.",
  },
  fdi: {
    what: "Money investors put into businesses in another country to gain a lasting say in them - at least 10% of the voting shares - less what they take out, as a share of world output (IMF balance of payments).",
    why: "Foreign direct investment brings capital, technology and know-how and ties economies together; it falls when uncertainty rises, making it a gauge of globalisation and of investors' confidence.",
  },

  // ── Economy: poverty ──
  extremePoverty: {
    what: "People living on less than $3.00 a day - the World Bank's international poverty line, set at the typical national poverty line of the poorest countries - at 2021 prices, adjusted for differences in what money buys from country to country. It comes from household surveys of income or consumption.",
    why: "Extreme poverty means struggling to meet the most basic needs for food, shelter and health care. Ending it is the first of the UN's Sustainable Development Goals.",
  },
  poverty420: {
    what: "People living on less than $4.20 a day, at 2021 prices adjusted for what money buys in each country - the World Bank's poverty line for lower-middle-income countries, typical of their national poverty lines.",
    why: "By the standard of lower-middle-income countries, where much of the world lives, living below this line is poor - so it shows how much poverty remains beyond the extreme.",
  },
  poverty830: {
    what: "People living on less than $8.30 a day, at 2021 prices adjusted for what money buys in each country - the World Bank's poverty line for upper-middle-income countries.",
    why: "It is a more demanding standard, closer to what poverty means in middle-income countries, and shows how many people still live on very modest means as extreme poverty falls.",
  },

  // ── Development ──
  hdi: {
    what: "The UN Development Programme's summary of human development, from 0 to 1: a long and healthy life (life expectancy), education (the years of schooling adults have and children can expect) and a decent standard of living (national income per person at purchasing power). Each part is scaled between set limits and the three are combined with a geometric mean.",
    why: "It was designed to judge development by people's lives rather than by income alone. It does not capture inequality, poverty, security or freedom, which the UNDP measures with other indices.",
  },
  gdpPerCapitaPpp: {
    what: "The world's output divided by its population, in constant 2021 international dollars - converted at purchasing power parities, which allow for the different prices of the same things in different countries (World Bank International Comparison Program).",
    why: "It is the standard measure of average material living standards, comparable between countries and over time. As an average, it says nothing about how income is shared.",
  },
  agEmployment: {
    what: "People working in agriculture, hunting, forestry and fishing - farmers working for themselves and unpaid family workers included - as a share of all employment (ILO modelled estimates).",
    why: "As countries develop, workers move from farming into industry and services, where each worker produces more. The share still working the land is a telling sign of how far an economy has modernised.",
  },
  servicesEmployment: {
    what: "People working in services - trade, hotels and restaurants, transport and communications, finance and business services, and community, social and personal services, public administration, health and education among them - as a share of all employment (ILO modelled estimates).",
    why: "Services now employ more people than farming or industry across much of the world. Their rise marks the shift to modern, urban economies, though service jobs run from high-paid professions to informal street trade.",
  },
  wageWorkers: {
    what: "Employees - people with a written or unwritten contract whose basic pay does not depend directly on the revenue of the business they work for - as a share of all employment (ILO modelled estimates).",
    why: "Wage work usually brings a steadier income and, where it exists, access to social protection. The shift from self-employment and family work to wages is a hallmark of development.",
  },
  vulnerableWork: {
    what: "People working for themselves without employees, and those helping unpaid in a family business or farm, as a share of all employment - the two kinds of work the ILO counts as vulnerable (ILO modelled estimates).",
    why: "Such work is less likely to come with a formal contract, social protection or a secure income, so its share is a gauge of how precarious the world's jobs are.",
  },
  accounts: {
    what: "Adults with an account at a bank or other financial institution, alone or jointly, or who used a mobile-money service in the past year, from the World Bank's Global Findex survey, carried out every few years.",
    why: "An account lets people save safely, receive wages and payments, borrow and weather emergencies. Mobile money has brought one to many people who never had a bank.",
  },
  airPassengers: {
    what: "Passengers carried by the world's airlines on domestic and international flights, counted by the country each airline is registered in (International Civil Aviation Organization).",
    why: "Air travel tracks how connected and prosperous the world is - for business, tourism and migration - and it collapsed in the pandemic. It is also a growing source of emissions, so it carries no verdict.",
  },
  agricultureVA: {
    what: "What agriculture, forestry and fishing add to the world's output - the value of what they produce less what they use up in producing it - as a share of GDP.",
    why: "Farming's share shrinks as economies develop, even as farms produce more, because other sectors grow faster; its size shows how far an economy still rests on the land.",
  },
  servicesVA: {
    what: "What services add to the world's output - trade, transport, finance, real estate, business services, public administration, education, health and others - as a share of GDP.",
    why: "Services are the largest part of most economies, and their growing share is the hallmark of modern, high-income economies.",
  },

  // ── Industry ──
  industryReal: {
    what: "What mining, manufacturing, construction, and electricity, gas and water supply add to the world's output - the value they produce less what they use up - in constant 2015 US dollars, so changes are in volume, not prices.",
    why: "It measures the world's capacity to make things: the factories, mines, power plants and building sites that goods, homes and infrastructure come from. Its growth counts as better on this page.",
  },
  manufacturingUsd: {
    what: "What manufacturing - turning materials or components into new products - adds to the world's output, in current US dollars. It is not adjusted for inflation, so part of any rise is rising prices.",
    why: "Manufacturing has been the classic engine of industrialisation, raising productivity and wages, and manufactured goods make up most of the goods the world trades.",
  },
  manufacturingVA: {
    what: "What manufacturing adds to the world's output, as a share of GDP.",
    why: "The share typically rises as countries industrialise and falls as services grow, so it shows where economies stand on that path rather than whether things are improving.",
  },
  industryVA: {
    what: "What industry as a whole - mining, manufacturing, construction, and electricity, gas and water - adds to the world's output, as a share of GDP.",
    why: "Like manufacturing's share, it describes the shape of economies - rising with industrialisation and falling as services take over - so it carries no verdict.",
  },
  industryEmployment: {
    what: "People working in mining and quarrying, manufacturing, construction and public utilities, as a share of all employment (ILO modelled estimates).",
    why: "Industrial jobs have been the way out of farming for much of the world's workforce; the share shows how far that shift has gone.",
  },
  manufacturesExports: {
    what: "Manufactured goods - chemicals, basic manufactures, machinery and transport equipment, and other manufactured goods - as a share of all goods exported (UN Comtrade). Non-ferrous metals are not counted.",
    why: "It shows how much of world trade is in made goods rather than raw materials and food. Countries that export manufactures are less exposed to swings in commodity prices.",
  },
  robotInstalls: {
    what: "Industrial robots installed in the year - machines that are automatically controlled, reprogrammable, able to do a range of tasks and move in three or more directions - as the International Federation of Robotics counts them from robot makers and national robotics associations.",
    why: "Robots weld, assemble, paint and pack in factories, raising output and precision. How fast they are installed is a gauge of how quickly industry is automating.",
  },
  robotStock: {
    what: "Industrial robots in use, as the International Federation of Robotics estimates them: for most countries, the robots installed over the previous twelve years, on the assumption that each is retired after twelve years' service.",
    why: "The stock shows how much automation the world's factories already have, not only what is being added each year.",
  },
  aiInvestment: {
    what: "Money private investors - venture capital and private equity - put into privately held AI companies that raised more than $1.5 million, as tracked by Quid for Stanford University's AI Index Report and adjusted for inflation. It leaves out listed companies, the largest technology firms among them, and companies' own research and data centres, so total spending on AI is far larger.",
    why: "It shows how much money is betting on AI's commercial future and how quickly a new industry is being built. Large single deals can make it jump from one year to the next.",
  },
  genAiInvestment: {
    what: "Private investment - venture capital and private equity - in privately held companies building generative AI, the systems that produce text, images, code and sound, as tracked by Quid for Stanford's AI Index Report and adjusted for inflation. Listed companies and firms' own spending are left out.",
    why: "It shows how much of the private money going into AI now goes to the systems that generate text, images and code.",
  },
  evSalesShare: {
    what: "Battery-electric and plug-in hybrid cars as a share of all new cars sold in the year, from the International Energy Agency's Global EV Outlook. The Outlook's figure for its own year is a projection and is not shown.",
    why: "Road transport burns much of the world's oil, so the electric share of new cars shows how fast one of the world's largest industries is turning away from it.",
  },
  resourceRents: {
    what: "What the world earns from its oil, gas, coal, minerals and forests above the cost of extracting them - the value of production at world prices less its cost - as a share of GDP (World Bank, The Changing Wealth of Nations). The world figure was last published for 2021.",
    why: "Rents measure how far economies live off their natural wealth. Heavy dependence on them ties economies to volatile commodity prices.",
  },
  oilRents: {
    what: "The value of the world's crude oil production at regional prices less what it costs to produce, as a share of GDP (World Bank). Last published for 2021.",
    why: "It moves with both how much oil is pumped and its price, jumping when oil prices spike and falling when they slump.",
  },
  gasRents: {
    what: "The value of the world's natural gas production at regional prices less its cost of production, as a share of GDP (World Bank). Last published for 2021.",
    why: "Like oil rents, it moves with production and with prices, which differ more between regions for gas than for oil.",
  },
  coalRents: {
    what: "The value of the world's hard and soft coal production at world prices less its cost of production, as a share of GDP (World Bank). Last published for 2021.",
    why: "Coal is still a large source of energy and income for some countries; its rents show how much value the world draws from the most carbon-intensive fuel.",
  },
  mineralRents: {
    what: "The value of the world's production of tin, gold, lead, zinc, iron, copper, nickel, silver, bauxite and phosphate at world prices, less its cost of production, as a share of GDP (World Bank). Last published for 2021.",
    why: "Minerals feed industry and the batteries, wiring and equipment of clean energy; their rents rise and fall with metal prices.",
  },
  cerealProduction: {
    what: "The world's harvest of wheat, rice, maize, barley, oats, rye, millet, sorghum, buckwheat and mixed grains, in tonnes (FAO).",
    why: "Cereals are the foundation of the world's food supply - eaten directly, fed to animals and turned into fuel - so the harvest is a basic measure of how well the world can feed itself.",
  },
  cerealYield: {
    what: "Tonnes of grain harvested from each hectare of land under cereals (FAO).",
    why: "Higher yields mean more food from the same land, which spares forests and grasslands from the plough; yields are the heart of farm productivity.",
  },
  fertilizer: {
    what: "Nitrogen, potash and phosphate fertilizers used on each hectare of arable land, in kilograms of plant nutrients (FAO). Manure and other natural fertilizers are not counted.",
    why: "Fertilizer is a large part of why yields have risen, but what crops do not take up washes into rivers and seas and releases greenhouse gases, so it carries no verdict.",
  },

  // ── Energy ──
  electricity: {
    what: "People with access to electricity at home, from national surveys, electricity companies and international sources, as compiled for the UN's tracking of Sustainable Development Goal 7.",
    why: "Electricity powers light, refrigeration, communication, schooling and work after dark. Universal access by 2030 is one of the UN's Sustainable Development Goals.",
  },
  cleanCooking: {
    what: "People who mainly cook with clean fuels and technologies - electricity, gas, biogas, solar or ethanol - rather than wood, charcoal, dung, crop waste, coal or kerosene; under WHO guidelines kerosene does not count as clean.",
    why: "Smoke from cooking on open fires and simple stoves is a major cause of illness and early death, mostly among women and children, and gathering fuel takes hours each day. Clean cooking lags well behind access to electricity.",
  },
  energySupply: {
    what: "All the energy the world uses in the year, before it is turned into electricity, fuels and heat - oil, gas, coal, nuclear, hydropower, wind, solar and other renewables - in terawatt-hours (Energy Institute, Statistical Review of World Energy).",
    why: "Energy drives the economy, and its growth has tracked growth in output and population. How it is supplied decides most of the world's greenhouse gas emissions, so the total carries no verdict.",
  },
  energyPerPerson: {
    what: "Primary energy used per person - what is produced, plus imports and changes in stocks, minus exports and fuel for international shipping and aviation - in kilograms of oil equivalent (IEA, via the World Bank).",
    why: "Energy use per person rises with prosperity; it shows how energy-hungry lives are, and differs enormously between rich and poor countries.",
  },
  electricityGeneration: {
    what: "All the electricity generated in the world in the year, from every source, in terawatt-hours (Ember).",
    why: "Electricity is taking over more of the work fuels once did - in transport, heating and industry - so its growth is central to how the world's energy is changing.",
  },
  electricityPerPerson: {
    what: "Electricity used per person: what power stations produce, less what is lost in transmission and distribution and what the stations use themselves, in kilowatt-hours (IEA, via the World Bank).",
    why: "It reflects both prosperity and how far economies run on electricity, and is many times higher in rich countries than in poor ones.",
  },
  energyIntensity: {
    what: "The energy supplied for each dollar of world output at purchasing power parity - megajoules per 2021 dollar - as tracked for the UN's Sustainable Development Goal 7 (IEA). Lower means less energy for the same output.",
    why: "Falling intensity means the world is getting more out of each unit of energy - through efficiency and a shift to less energy-hungry activities - which cuts costs and emissions. Doubling the rate of improvement is a UN target.",
  },
  fossilShare: {
    what: "Oil, coal and gas together, as a share of all the energy the world uses (Energy Institute, Statistical Review of World Energy).",
    why: "Burning fossil fuels is the main source of the carbon dioxide warming the planet, so the share still met by them is a gauge of how far the energy transition has come.",
  },
  renewables: {
    what: "Renewable energy - hydropower, wind, solar, bioenergy, geothermal and others, including traditional wood and waste burned for cooking and heating - as a share of the energy consumers finally use, as tracked for Sustainable Development Goal 7.",
    why: "Renewables cut emissions and reliance on imported fuels. Because this share counts traditional wood burning, a fall in firewood use can hide the rise of modern renewables.",
  },
  fossilElectricity: {
    what: "The share of the world's electricity generated from coal, gas and oil (Ember).",
    why: "Generating power is the largest single source of energy-related emissions, and it is where cheap solar and wind can most readily replace fossil fuels.",
  },
  renewableElectricity: {
    what: "The share of the world's electricity generated from solar, wind, hydropower, bioenergy, geothermal, wave and tidal power (Ember).",
    why: "Clean electricity is the backbone of plans to cut emissions: as power grids decarbonise, the cars, heating and industry that switch to electricity get cleaner too.",
  },
  oilProduction: {
    what: "The crude oil, condensates, natural gas liquids and other liquid fuels the world produces, measured as the energy they contain, in terawatt-hours (Energy Institute).",
    why: "Oil fuels most of the world's transport and much of its chemical industry; how much is pumped shapes prices, economies and emissions alike, so it carries no verdict.",
  },
  gasProduction: {
    what: "The natural gas the world produces, as the energy it contains in terawatt-hours, not counting gas that is flared or pumped back underground (Energy Institute).",
    why: "Gas heats homes, generates electricity and feeds industry and fertilizer plants. It emits less carbon than coal when burned, but it is still a fossil fuel.",
  },
  coalProduction: {
    what: "The coal the world produces, measured as the energy it contains, in terawatt-hours (Energy Institute).",
    why: "Coal is the most carbon-intensive fuel and still the largest single source of the world's electricity, so its production is watched as a measure of progress on climate.",
  },

  // ── Technology ──
  internet: {
    what: "People who have used the internet in the last three months, from any place and any device - a computer, mobile phone, games console or television (International Telecommunication Union, from household surveys and estimates).",
    why: "The internet is now how people learn, work, bank, find news and reach public services; those still offline are increasingly left out.",
  },
  mobile: {
    what: "Subscriptions to mobile phone services that can make voice calls - contracts and prepaid accounts used in the last three months - for every 100 people (International Telecommunication Union). One person can hold several.",
    why: "Mobile phones brought calls, mobile money and the internet to billions who never had a landline. Because subscriptions can outnumber people, the figure carries no verdict.",
  },
  broadband: {
    what: "Fixed connections to the internet at 256 kbit/s or faster - cable, DSL, fibre, satellite and fixed wireless - for every 100 people (International Telecommunication Union). Mobile data subscriptions are not counted.",
    why: "Fixed broadband carries the heavy traffic of homes, schools and businesses. It is far less widespread in poorer countries, where most people get online by phone.",
  },
  landlines: {
    what: "Fixed telephone lines - analogue lines, internet telephony, fixed wireless and ISDN channels - and public payphones, for every 100 people (International Telecommunication Union).",
    why: "Landlines are being given up for mobiles, so their fall reflects a change of technology rather than lost connection; it carries no verdict.",
  },
  secureServers: {
    what: "Distinct, publicly trusted security certificates (TLS/SSL) for websites, found by Netcraft's Secure Server Survey and counted by the country that hosts them, per million people.",
    why: "Secure servers underpin online banking, shopping and government services, so their number reflects how much of economic life has moved online. Hosting is concentrated in a few countries, so it carries no verdict.",
  },
  research: {
    what: "Spending on research and development - basic research, applied research and experimental development, by businesses, governments, universities and non-profits, capital and running costs alike - as a share of world output (UNESCO Institute for Statistics).",
    why: "Research is the source of new technologies, medicines and knowledge, and the long-run growth of productivity depends on it.",
  },
  researchers: {
    what: "People working as researchers - professionals creating new knowledge, products, processes, methods or systems - per million people (UNESCO Institute for Statistics). The world figure is published only every few years.",
    why: "Researchers are the capacity behind invention and discovery; their number shows how much of the world's talent works on new knowledge.",
  },
  sciArticles: {
    what: "Articles published in peer-reviewed science and engineering journals, and in selected conference proceedings, indexed in the Scopus database, as counted by the US National Science Foundation.",
    why: "It shows how much research the world publishes. Counts reward volume rather than quality, so the figure carries no verdict.",
  },
  aiPublications: {
    what: "Scholarly publications on artificial intelligence - journal articles, conference papers, working papers and preprints - that the Center for Security and Emerging Technology identifies as AI with machine-learning models, from papers with an English title or abstract. The world figure adds up the countries, so papers by authors in several countries count more than once.",
    why: "It tracks how fast AI research is growing. Research published only in other languages, and many Chinese journals, are poorly covered, so it carries no verdict.",
  },
  patents: {
    what: "Patent applications filed by residents of each country - at their own national patent office or through the international Patent Cooperation Treaty - added up across the world (World Intellectual Property Organization, via the World Bank). A patent protects an invention, generally for 20 years.",
    why: "Patents are a gauge of inventive activity, but filing habits differ greatly between countries and many applications are never granted, so the figure carries no verdict.",
  },
  highTechExports: {
    what: "Products that take a lot of research to develop - aircraft, computers, medicines, scientific instruments and electrical machinery - as a share of manufactured exports (UN Comtrade).",
    why: "It shows how much of what the world makes and sells is advanced technology, although assembling high-tech goods counts the same as inventing them.",
  },
  ictGoodsExports: {
    what: "Computers and their parts, communication equipment, consumer electronics, electronic components and other information technology goods, as a share of all goods exported (UNCTAD).",
    why: "Digital hardware is one of the largest parts of world trade, made in a small number of manufacturing hubs.",
  },
  ictServiceExports: {
    what: "Exports of computer services, telecommunications and postal and courier services, and information services such as data processing and news, as a share of all services exported (IMF balance of payments).",
    why: "Digital services - software, cloud computing and outsourced IT - can be sold across borders without shipping anything, and are among the fastest-growing parts of trade.",
  },
  ipReceipts: {
    what: "What countries receive from abroad for the use of patents, trademarks, copyrights, industrial designs, trade secrets and franchises, and for licences to copy or distribute software, films, recordings and other works, in current US dollars (IMF balance of payments).",
    why: "It measures the trade in ideas - what the world pays to use others' inventions, brands and creative works - which flows mostly to a few rich economies.",
  },

  // ── Politics ──
  electoralDemocracy: {
    what: "V-Dem's electoral democracy index: how far rulers are chosen in free and fair elections in which almost all adults can vote, with freedom of expression and association and sources of information other than the government. Each country's score, from 0 to 1, comes from V-Dem's country experts' ratings combined in a statistical model; the world figure averages the countries weighted by population.",
    why: "Free and fair elections are the core of democracy - the way people choose and remove those who govern them. V-Dem builds all its other democracy measures on this electoral core.",
  },
  liberalDemocracy: {
    what: "V-Dem's liberal democracy index: electoral democracy combined with the protection of individual and minority rights - equality before the law and individual liberty - and the courts' and legislature's checks on the executive. Scored 0 to 1 from V-Dem's expert ratings, averaged across the world's people.",
    why: "Elections alone can produce governments that override minorities' rights or the limits on their power; the liberal measure asks whether power, once won, is restrained.",
  },
  participatoryDemocracy: {
    what: "V-Dem's participatory democracy index: electoral democracy combined with how far citizens take part beyond elections - in civil society organisations, in direct democracy such as referendums, and in elected regional and local government. 0 to 1, averaged across the world's people.",
    why: "It treats democracy as something people do, not only something they vote for every few years.",
  },
  deliberativeDemocracy: {
    what: "V-Dem's deliberative democracy index: electoral democracy combined with how far decisions are reached by reasoned debate - whether leaders justify their positions, appeal to the common good, respect counterarguments and consult widely, and whether society at large debates policy. 0 to 1, averaged across the world's people.",
    why: "It captures the quality of public reasoning: whether decisions are argued out in the open rather than imposed, bargained over in private or won with emotional appeals.",
  },
  egalitarianDemocracy: {
    what: "V-Dem's egalitarian democracy index: electoral democracy combined with how equally rights and freedoms, access to power, and resources such as education and health are spread across social groups. 0 to 1, averaged across the world's people.",
    why: "Formal rights mean little to groups too poor, excluded or discriminated against to use them; this measure asks whether democracy works for everyone.",
  },
  womenParliament: {
    what: "Seats held by women in national parliaments - the single or lower chamber - as a share of all seats (Inter-Parliamentary Union).",
    why: "Women are half the population but hold a minority of political power; their share of seats is the most widely used gauge of their political representation.",
  },
  womenEmpowerment: {
    what: "V-Dem's women's political empowerment index: how far women enjoy civil liberties, take part in civil society organisations and are represented in politics - in legislatures and in political power. 0 to 1, from V-Dem's expert ratings, averaged across the world's people.",
    why: "It goes beyond counting seats to whether women can speak, organise and hold power in practice.",
  },

  // ── Civic ──
  civilLiberties: {
    what: "V-Dem's civil liberties index: freedom from government violence such as torture and political killing; private liberties such as property, movement, religion and freedom from forced labour; and political liberties - expression and association. 0 to 1, from V-Dem's expert ratings, averaged across the world's people.",
    why: "Civil liberties are the everyday freedoms that let people live, speak and believe as they choose without fear of the state; every other right rests on them.",
  },
  physicalIntegrity: {
    what: "V-Dem's physical violence index: how far people are free from torture and political killings by the government and its agents. 0 to 1, averaged across the world's people.",
    why: "Freedom from torture and political murder is the most basic protection a person can have against the state.",
  },
  womenCivilLiberties: {
    what: "V-Dem's women's civil liberties index: how far women are free from forced labour, have property rights and access to justice, and can move freely at home and abroad. 0 to 1, averaged across the world's people.",
    why: "It shows whether half of humanity has the basic freedoms to own, work, move and seek justice.",
  },
  equalityBeforeLaw: {
    what: "V-Dem's equality before the law and individual liberty index: whether laws are clear and enforced predictably, public administration is impartial, people have access to justice, and they are free from torture, political killing and forced labour and free to move and to worship. 0 to 1, averaged across the world's people.",
    why: "The rule of law means little unless it applies to everyone alike; this measure asks whether ordinary people can rely on the law.",
  },
  privateLiberties: {
    what: "V-Dem's private civil liberties index: freedom from forced labour, the right to own property, freedom of movement at home and abroad, and freedom of religion. 0 to 1, averaged across the world's people.",
    why: "These are the freedoms of private life - to work freely, own, travel and worship - that authoritarian governments often restrict.",
  },
  freeExpression: {
    what: "V-Dem's freedom of expression and alternative sources of information index: freedom to discuss politics at home and in public, academic and cultural freedom, a press free from censorship and harassment, and media that present a range of views. 0 to 1, averaged across the world's people.",
    why: "Without free speech and a free press, people cannot learn what their government is doing, debate it or hold it to account; it is usually among the first freedoms to suffer when democracy erodes.",
  },
  freeAssociation: {
    what: "V-Dem's freedom of association index: whether parties, the opposition included, can form and take part in elections, and civil society organisations can form and operate freely. 0 to 1, averaged across the world's people.",
    why: "People need to be free to organise - into parties, unions, charities and campaigns - to compete for power and press their interests.",
  },
  politicalLiberties: {
    what: "V-Dem's political civil liberties index: freedom of expression and freedom of association together. 0 to 1, averaged across the world's people.",
    why: "They are the liberties people need to take part in politics - to speak, organise and oppose - between elections as well as at them.",
  },
  voterTurnout: {
    what: "Votes cast in national elections as a share of the voting-age population, from official results as V-Dem compiles them. Here each country's latest national election in the five years to date counts, and countries are averaged with each counting equally; countries with no national election in those five years are left out.",
    why: "Voting is the most common way people take part in politics, and turnout shows how engaged they are, or how much they believe their vote counts. Turnout is also high where voting is compulsory or elections are staged, so it is not a measure of freedom on its own.",
  },
  civilSociety: {
    what: "V-Dem's civil society participation index: whether major civil society organisations are routinely consulted by policymakers, how many people take part in them, whether women can, and whether parties choose their legislative candidates openly. 0 to 1, averaged across the world's people.",
    why: "Civil society - charities, unions, religious and community groups, campaigns - is how citizens organise between elections and make their voices heard.",
  },
  engagedSociety: {
    what: "V-Dem's experts' estimate of how far ordinary people discuss important policy changes independently - among themselves, in the media, in associations and neighbourhoods, and in the streets - averaged across the world's people. It is on V-Dem's own scale rather than 0 to 1; the note gives the range countries span.",
    why: "Public debate is how societies reason about the choices before them and how people come to understand and shape policy; an engaged society is harder to govern without its consent.",
  },

  // ── Governance ──
  ruleOfLaw: {
    what: "V-Dem's rule of law index: whether the government complies with the law and the courts, the courts are independent, laws are clear and enforced predictably, officials are impartial and free of corruption, and justice is accessible. 0 to 1, from V-Dem's expert ratings, averaged across the world's people.",
    why: "The rule of law means that those in power are bound by the same law as everyone else. It protects rights and property and gives people and businesses the certainty to plan and invest.",
  },
  judicialConstraints: {
    what: "V-Dem's index of judicial constraints on the executive: how far the executive respects the constitution and obeys court rulings, and the higher and lower courts are independent. 0 to 1, averaged across the world's people.",
    why: "Independent courts that the government obeys are the main check on the abuse of executive power; attacks on them are an early warning sign of democratic erosion.",
  },
  legislativeConstraints: {
    what: "V-Dem's index of legislative constraints on the executive: how far the legislature, opposition parties included, questions, oversees and investigates the executive. 0 to 1, averaged across the world's people.",
    why: "A legislature that can hold ministers to account keeps power answerable between elections; where it cannot, executives govern unchecked.",
  },
  taxRevenue: {
    what: "Compulsory payments to government - taxes on income, profits, goods, services and trade - as a share of GDP (IMF Government Finance Statistics). Fines, penalties and most social security contributions are not counted.",
    why: "Taxes pay for public services, infrastructure and social protection, so what states collect shows their capacity to provide them. How much is right is a political choice, so it carries no verdict.",
  },
  govRevenue: {
    what: "Everything governments take in - taxes, social contributions, fees and income from property and sales - except grants, as a share of GDP (IMF Government Finance Statistics).",
    why: "It is the full measure of states' resources, beyond tax alone.",
  },
  govExpense: {
    what: "What governments spend on their operations - wages, goods and services, interest, subsidies, grants and social benefits - as a share of GDP; buying lasting assets such as buildings is not counted (IMF Government Finance Statistics).",
    why: "It shows how large a role the state plays in the economy, which countries decide differently, so it carries no verdict.",
  },
  interestPayments: {
    what: "The interest governments pay on their debts - bonds, loans and other borrowing, at home and abroad - as a share of all their revenue (IMF Government Finance Statistics).",
    why: "Revenue spent on interest is not spent on services or investment, so the share shows how heavily past borrowing weighs on budgets.",
  },
  womenMinisters: {
    what: "Women's share of ministerial and equivalent posts in governments, deputy prime ministers included, and heads of government only where they hold a ministry (Inter-Parliamentary Union and UN Women).",
    why: "Ministers run governments day to day; women's share of those posts shows how far they have reached executive power, not only parliament.",
  },

  // ── Ideology: democracy & autocracy ──
  democracyShare: {
    what: "The share of the world's people living in countries V-Dem's Regimes of the World classes as democracies, electoral or liberal: countries that hold multiparty elections for the executive and legislature that are free and fair enough, with at least the basic freedoms of expression and association, as V-Dem's expert ratings judge them. Countries V-Dem does not classify are left out.",
    why: "It shows how much of humanity chooses its government in free elections. Because it counts people, one populous country changing class moves it sharply.",
  },
  liberalDemocracyShare: {
    what: "The share of the world's people living in countries V-Dem classes as liberal democracies: democracies that also meet the liberal standard - the rule of law, respect for individual rights, and courts and legislatures that check the executive. Countries V-Dem does not classify are left out.",
    why: "It counts the people who enjoy the fullest form of democracy V-Dem measures. Because it counts people, a single populous country changing class can move it by several points.",
  },
  electoralAutocracyShare: {
    what: "The share of the world's people living in countries V-Dem classes as electoral autocracies: they hold multiparty elections for the executive, but the elections are not free and fair, or the basic freedoms democracy needs are missing.",
    why: "Electoral autocracies hold elections for legitimacy while denying a fair contest. The share carries no verdict because it grows both when democracies slide into it and when closed autocracies open up to it.",
  },
  closedAutocracyShare: {
    what: "The share of the world's people living in countries V-Dem classes as closed autocracies: there are no multiparty elections for the chief executive or the legislature - one-party states, absolute monarchies and military governments among them.",
    why: "People in closed autocracies have no say at the ballot box over who governs them.",
  },
  democracies: {
    what: "How many countries V-Dem's Regimes of the World classes as democracies, electoral or liberal. Each country counts once, whatever its size; the breakdown gives all four classes, and the list below names every country in each.",
    why: "Counting countries rather than people shows how widespread democracy is as a system of government, without the weight of a few populous countries.",
  },
  autocratizing: {
    what: "How many countries are in an episode of autocratization, as V-Dem's Episodes of Regime Transformation identify it: a substantial and sustained decline in V-Dem's electoral democracy index, whether a democracy eroding or an autocracy hardening.",
    why: "It is the clearest measure of which way the world's political tide is running. Autocratization today usually proceeds gradually and under a legal cover - elected leaders curbing the media, the courts and civil society - rather than by coups.",
  },
  democratizing: {
    what: "How many countries are in an episode of democratization, as V-Dem's Episodes of Regime Transformation identify it: a substantial and sustained rise in V-Dem's electoral democracy index, whether an autocracy liberalising or a democracy deepening.",
    why: "Set against the count of countries autocratizing, it shows whether freedom is spreading or retreating.",
  },
  autocratizingShare: {
    what: "The share of the world's people living in countries in an episode of autocratization, as V-Dem's Episodes of Regime Transformation identify them. Countries V-Dem does not classify are left out.",
    why: "Weighted by people, it shows how many lives the trend touches; a few populous countries can dominate it.",
  },
  democratizingShare: {
    what: "The share of the world's people living in countries in an episode of democratization, as V-Dem's Episodes of Regime Transformation identify them. Countries V-Dem does not classify are left out.",
    why: "It shows how many people live where democracy is expanding.",
  },

  // ── Ideology: religion (Pew Research Center) ──
  christians: {
    what: "People who identify as Christians - Catholic, Protestant, Orthodox and others - as a share of everyone, from Pew Research Center's estimates for 2010 and 2020, built from more than 2,700 censuses and surveys covering 201 countries and territories.",
    why: "Religion shapes the values, laws, customs and politics of much of the world. Faiths grow or shrink through births and deaths and through people joining or leaving them, changing societies over generations; the shares carry no verdict.",
  },
  muslims: {
    what: "People who identify as Muslims, Sunni and Shia alike, as a share of everyone, from Pew Research Center's estimates for 2010 and 2020.",
    why: "A faith's share of the world changes mainly through births and deaths - a young, growing population adds followers - and through people joining or leaving it.",
  },
  unaffiliated: {
    what: "People who have no religion - atheists, agnostics and those who describe their religion as 'nothing in particular' - as a share of everyone, from Pew Research Center's estimates for 2010 and 2020.",
    why: "The share without religion rises or falls with secularisation - people leaving the faith they were raised in - and with population change in the countries where many people have none.",
  },
  hindus: {
    what: "People who identify as Hindus, as a share of everyone, from Pew Research Center's estimates for 2010 and 2020.",
    why: "Most of the world's Hindus live in India, so their share of the world moves largely with India's population.",
  },
  buddhists: {
    what: "People who identify as Buddhists, of every tradition, as a share of everyone, from Pew Research Center's estimates for 2010 and 2020.",
    why: "Buddhists live mostly in East and South-East Asia, where populations are ageing and births are few - which weighs on their share of the world.",
  },
  jews: {
    what: "People who identify as Jews by religion, as a share of everyone, from Pew Research Center's estimates for 2010 and 2020.",
    why: "Jews are a small share of the world's people, living mostly in Israel and the United States.",
  },
  otherReligions: {
    what: "Followers of all other religions together - among them Sikhs, Jains, Baha'is, Taoists, Shintoists and many folk and traditional religions - as a share of everyone, from Pew Research Center's estimates for 2010 and 2020.",
    why: "Together they are a small and varied share of the world, from faiths centred on South Asia to China's folk religions and Africa's traditional faiths.",
  },

  // ── Ideology: ideas & division ──
  academicFreedom: {
    what: "V-Dem's academic freedom index: freedom to research and teach, freedom of academic exchange and publication, universities' autonomy, campuses free from surveillance and intrusion, and freedom of academic and cultural expression. 0 to 1, averaged across the world's people.",
    why: "Free inquiry is how knowledge advances and societies correct their mistakes, and governments that want to control what people think tend to restrict it.",
  },
  polarization: {
    what: "V-Dem's experts' estimate of how far society is split into antagonistic political camps - where political differences sour social relationships and people avoid contact across the divide - averaged across the world's people. It is on V-Dem's own scale, higher meaning more divided, rather than 0 to 1.",
    why: "Toxic polarization makes compromise hard and turns opponents into enemies, and V-Dem's research finds it often precedes democratic decline.",
  },

  // ── Security ──
  conflicts: {
    what: "Armed conflicts in which at least one side is a state's government - fighting another state or an armed group - and at least 25 people are killed in battle in the year (Uppsala Conflict Data Program).",
    why: "War is the greatest destroyer of lives, homes and economies. The number of conflicts shows how widespread organised violence is, though a few large wars account for most of the deaths.",
  },
  conflictDeaths: {
    what: "People killed in the year in fighting involving states, in fighting between armed groups, and in one-sided attacks on civilians - the Uppsala Conflict Data Program's best estimate, from news reports, other contemporary sources and research. Deaths from the hunger and disease that war brings are not counted.",
    why: "It measures the direct human toll of organised violence, which swings with a few great wars and is always an undercount of war's full cost.",
  },
  displaced: {
    what: "People forced to flee persecution, conflict, violence or human rights abuses - refugees, asylum-seekers, people displaced inside their own countries, Palestine refugees under UNRWA's mandate, and others in need of international protection - as UNHCR counts them.",
    why: "Displacement gathers the consequences of war and persecution in one number: people who have lost their homes, often for years, and the strain on the places that take them in.",
  },
  militaryGdp: {
    what: "What the world's countries spend on their armed forces - personnel, operations, weapons and military construction - as a share of world output (Stockholm International Peace Research Institute, via the World Bank).",
    why: "It shows how much of the world's resources go to defence. Whether more is better depends on the threats countries face, so it carries no verdict.",
  },
  militaryShare: {
    what: "Military spending as a share of all government spending (Stockholm International Peace Research Institute).",
    why: "It shows what defence takes from public budgets that also pay for schools, health and welfare.",
  },
  armedForces: {
    what: "Active-duty military personnel, including paramilitary forces trained and equipped to support or replace the regular military (International Institute for Strategic Studies, The Military Balance).",
    why: "The size of the world's armed forces is one gauge of its military power, though modern forces depend more on equipment than on numbers.",
  },
  armsTransfers: {
    what: "The volume of major conventional weapons - aircraft, armoured vehicles, artillery, radar, missiles and ships - sold, given or licensed for manufacture across borders, in the Stockholm International Peace Research Institute's trend-indicator values, which measure the military capability transferred rather than the price paid.",
    why: "The arms trade shows where military power is being built up and who supplies it; it carries no verdict.",
  },
  nuclearWarheads: {
    what: "Nuclear warheads in the stockpiles of the nine nuclear-armed states, plus retired warheads awaiting dismantlement, as the Federation of American Scientists estimates them from public information. The true numbers are secret.",
    why: "Nuclear weapons can destroy whole cities in an instant; the size of the arsenals shows how far the disarmament that followed the Cold War has gone.",
  },
  terrorAttacks: {
    what: "Attacks by non-state groups or individuals that use or threaten illegal force to reach a political, economic, religious or social goal through fear, coercion or intimidation, as recorded by the Global Terrorism Database from news reports. Its public release ends in 2021.",
    why: "Terrorism aims to spread fear far beyond its victims. The count shows how widespread it is, though a handful of countries account for most attacks.",
  },
  terrorDeaths: {
    what: "Everyone killed in terrorist attacks, victims and attackers alike, as confirmed by the Global Terrorism Database. Its public release ends in 2021.",
    why: "Deaths measure the human cost of terrorism, which is concentrated in countries at war.",
  },
  homicide: {
    what: "Intentional killings - unlawful deaths inflicted with intent to kill or seriously injure - per 100,000 people, from police and health records compiled by the UN Office on Drugs and Crime. Deaths in armed conflict are not included.",
    why: "Murder is the most serious crime, and its rate is the most reliable measure of violent crime and personal safety that can be compared between countries.",
  },

  // ── Ecology ──
  co2: {
    what: "Carbon dioxide released in the year by burning fossil fuels, by industry, by farming and by waste, in millions of tonnes (EDGAR, via the World Bank). Emissions and absorption from changes in land use and forests are not counted, as they are much less certain.",
    why: "Carbon dioxide is the main cause of global warming, and it stays in the air for centuries, so the world's temperature depends on the total ever emitted; halting warming requires emissions to fall to net zero.",
  },
  co2PerPerson: {
    what: "The world's carbon dioxide emissions divided by its population, in tonnes per person, not counting land use and forestry (EDGAR, via the World Bank).",
    why: "It separates the effect of population from how carbon-intensive lives are, and differs many times over between rich and poor countries.",
  },
  methane: {
    what: "Methane released by farming - livestock and rice - by the oil, gas and coal industries, and by waste, counted in carbon dioxide equivalents with the factors of the IPCC's Fifth Assessment Report, not counting land use (EDGAR, via the World Bank).",
    why: "Methane traps far more heat than carbon dioxide, tonne for tonne, but lasts only about a decade in the air, so cutting it is one of the fastest ways to slow warming.",
  },
  ghg: {
    what: "All six greenhouse gases covered by the Kyoto Protocol - carbon dioxide, methane, nitrous oxide and three fluorinated gases - from energy, industry, farming and waste, added up in carbon dioxide equivalents, not counting land use and forestry (EDGAR, via the World Bank).",
    why: "It is the full measure of what humanity adds to the warming of the planet each year, and the figure the Paris Agreement's goals ultimately depend on.",
  },
  pm25: {
    what: "The average concentration of fine particles - PM2.5, smaller than 2.5 microns - in the outdoor air people breathe, weighted by where people live, in micrograms per cubic metre (Global Burden of Disease, via the World Bank). The WHO's guideline for a year's exposure is 5.",
    why: "Fine particles reach deep into the lungs and the blood; outdoor air pollution is one of the leading environmental causes of death, from heart disease, stroke and lung disease.",
  },
  waterWithdrawals: {
    what: "Freshwater taken from rivers, lakes and aquifers - for farming, industry and homes, desalinated water included where it matters - as a share of the renewable freshwater that arises within countries (FAO AQUASTAT). It can exceed 100% where aquifers are being drained or water is reused.",
    why: "It shows the pressure on the world's water. High withdrawals against supply mean water stress, though a world average hides very dry and very wet regions.",
  },
  forest: {
    what: "Land under natural or planted stands of trees at least 5 metres tall, as a share of all land (FAO). Trees in orchards, agroforestry and urban parks are not counted.",
    why: "Forests are home to much of the life on land, store carbon, and protect soils and water; losing them speeds climate change and the loss of species.",
  },
  farmland: {
    what: "Land used for farming - arable land, permanent crops and permanent pasture - as a share of all land (FAO).",
    why: "Farming is humanity's largest use of land and the main driver of lost forests and wildlife, but that land also feeds the world, so it carries no verdict.",
  },
  protectedLand: {
    what: "Land in protected areas - national parks, nature reserves, wildlife sanctuaries and other areas set aside to conserve nature - as a share of all land (UNEP-WCMC, Protected Planet).",
    why: "Protected areas are the main tool for saving species and ecosystems; the world agreed in the Kunming-Montreal Global Biodiversity Framework to protect 30% of land and sea by 2030.",
  },
  protectedSea: {
    what: "Marine areas reserved by law or other effective means to protect part or all of their environment, as a share of territorial waters (UNEP-WCMC, Protected Planet).",
    why: "Marine protected areas shelter fish stocks, reefs and other sea life from overfishing and damage, and count towards the same goal of protecting 30% of land and sea by 2030.",
  },
  disasterDeaths: {
    what: "People killed or missing in natural disasters - earthquakes, storms, floods, droughts, extreme temperatures, wildfires, volcanoes and landslides - that overwhelm local capacity and call for national or international help, as recorded by EM-DAT.",
    why: "The toll is dominated by rare, great events - a single earthquake or cyclone can kill more than all other disasters in years - so it swings from year to year and carries no verdict.",
  },
  disasterDisplacement: {
    what: "Times people were forced from their homes within their own country by disasters in the year - floods, storms, earthquakes, wildfires and others - with each displacement counted, so one person can be counted more than once (Internal Displacement Monitoring Centre).",
    why: "It shows how many lives disasters upend even when few die. It also rises with better counting and with evacuations that save lives, so it carries no verdict.",
  },
};

/** The same for the climate readings, by their ids in climateIndicators.ts. */
export const EXPLAIN_CLIMATE: Record<string, Explanation> = {
  warming: {
    what: "How much warmer the Earth's surface - land and sea together - was than its average for 1951-1980, from NASA's GISTEMP analysis of readings from weather stations, ships and buoys. That baseline is already warmer than pre-industrial times, so this is not the same number as the Paris Agreement's 1.5 °C limit.",
    why: "Global temperature is the headline measure of climate change: each increment brings more intense heatwaves, heavier downpours, rising seas and stress on ecosystems.",
  },
  co2: {
    what: "The concentration of carbon dioxide in the air at Mauna Loa Observatory in Hawaii, in parts per million, where it has been measured since 1958. The seasonally adjusted trend is used, since the level swings through the year with plant growth in the northern hemisphere.",
    why: "Carbon dioxide in the air is the running total of what humanity has added and nature has not yet absorbed; its steady rise is what drives warming.",
  },
  "co2-global": {
    what: "The concentration of carbon dioxide in the air, averaged across NOAA's network of sampling sites at the ocean surface, in parts per million.",
    why: "It confirms the Mauna Loa record with a global average: carbon dioxide mixes through the atmosphere, so its rise is the same everywhere.",
  },
  ch4: {
    what: "The concentration of methane in the air, averaged across NOAA's network of sampling sites at the ocean surface, in parts per billion.",
    why: "Methane is the second-largest contributor to warming after carbon dioxide; its rise reflects emissions from farming, fossil fuels and wetlands.",
  },
  n2o: {
    what: "The concentration of nitrous oxide in the air, averaged across NOAA's network of sampling sites at the ocean surface, in parts per billion.",
    why: "Nitrous oxide, largely from fertilizer and manure, is a long-lived greenhouse gas and now the largest emission destroying the ozone layer.",
  },
  aggi: {
    what: "NOAA's Annual Greenhouse Gas Index: the warming influence of all the long-lived greenhouse gases in the air - carbon dioxide, methane, nitrous oxide and the fluorinated gases - compared with 1990, which is set at 1.",
    why: "It combines every gas into one measure of how much more heat the atmosphere traps than in 1990, the year the world's first climate treaty was being negotiated.",
  },
  "sea-ice": {
    what: "The area of the Arctic Ocean covered by at least 15% sea ice in September, when the ice is at its smallest, measured from satellites by the US National Snow and Ice Data Center.",
    why: "Summer Arctic ice is shrinking as the Arctic warms several times faster than the world as a whole; less ice leaves darker water that absorbs more sunlight, speeding the warming.",
  },
};

/**
 * Who publishes each source, and how it gathers its figures, matched on the
 * start of a figure's source label.
 */
export const SOURCE_ABOUT: [RegExp, string][] = [
  [/^World Bank/, "The World Bank's World Development Indicators gather statistics from national statistical offices and international agencies - the UN's agencies, the IMF, the ILO and others - and build world and regional totals from them. Each indicator names the agency behind it."],
  [/^IMF/, "The International Monetary Fund's World Economic Outlook, published twice a year, gathers its member countries' economic figures and adds the IMF's own estimates and projections; the projections are left out here."],
  [/^Uppsala/, "The Uppsala Conflict Data Program, at Uppsala University in Sweden, records organised violence around the world from news reports, other contemporary sources and research, and is one of the most widely used sources on armed conflict."],
  [/^UNHCR/, "UNHCR, the UN Refugee Agency, counts refugees, asylum-seekers, internally displaced and stateless people from governments' figures and its own registrations."],
  [/^V-Dem/, "Varieties of Democracy (V-Dem), based at the University of Gothenburg in Sweden, asks thousands of country experts to rate hundreds of aspects of each country's politics every year, and combines their ratings with a statistical model that allows for disagreement between experts and for how strict each one is. Our World in Data publishes its measures with world averages weighted by population."],
  [/^Global Terrorism Database/, "The Global Terrorism Database, kept by the START consortium at the University of Maryland, records terrorist attacks around the world from news reports; its public release runs to 2021."],
  [/^Federation of American Scientists/, "The Federation of American Scientists estimates the world's nuclear arsenals from public information, historical records and leaks, since governments keep the true numbers secret."],
  [/^Pew/, "Pew Research Center, a nonpartisan research organisation in Washington, DC, estimated the religious make-up of 201 countries and territories for 2010 and 2020 from more than 2,700 censuses and surveys."],
  [/^UNDP/, "The UN Development Programme's Human Development Report compiles the Human Development Index and its parts - health, education and income - from UN agencies' data."],
  [/^UN World Population/, "The UN Population Division's World Population Prospects estimates every country's population from censuses, registers and surveys, and projects it forward."],
  [/^Energy Institute/, "The Energy Institute's Statistical Review of World Energy, published every year since 1952 and by BP until 2022, compiles each country's production and use of every fuel from governments and industry."],
  [/^Ember/, "Ember, an independent energy think tank, compiles each country's electricity generation by source from national and international statistics and publishes it openly."],
  [/^FAO/, "The Food and Agriculture Organization of the UN collects countries' figures on farming, food and land in its FAOSTAT database."],
  [/^International Federation of Robotics/, "The International Federation of Robotics counts robot installations around the world from figures supplied by robot makers and national robotics associations; its numbers are published in Stanford University's AI Index Report."],
  [/^Quid/, "Quid, a data company, tracks investment deals in AI companies for Stanford University's AI Index Report; Our World in Data adjusts the amounts for inflation."],
  [/^Center for Security and Emerging Technology/, "The Center for Security and Emerging Technology at Georgetown University tracks AI research around the world, identifying AI papers with machine-learning models."],
  [/^IEA/, "The International Energy Agency's Global EV Outlook reports electric car sales and stocks each year from national registration and sales data."],
  [/^EM-DAT/, "EM-DAT, the international disaster database kept by CRED at UCLouvain in Belgium, records disasters that kill at least ten people, affect at least a hundred, or lead to a declared emergency or a call for international help."],
  [/^World Happiness Report/, "The World Happiness Report, published each year by the Wellbeing Research Centre at the University of Oxford with Gallup, draws on the Gallup World Poll, which surveys nationally representative samples - more than 100,000 people in over 140 countries - every year."],
  [/^World Health Organization/, "The World Health Organization's Global Health Observatory publishes the WHO's health statistics for its member states, estimated with models where records are incomplete."],
  [/^Freedom House/,"Freedom House rates every country's political rights and civil liberties each year in its Freedom in the World report."],
  [/^NASA/, "NASA's Goddard Institute for Space Studies combines temperature readings from thousands of weather stations, ships and buoys into its GISTEMP record, which goes back to 1880."],
  [/^NOAA/, "NOAA's Global Monitoring Laboratory measures the greenhouse gases in the air at observatories and sampling sites around the world, Mauna Loa in Hawaii among them."],
  [/^NSIDC/, "The US National Snow and Ice Data Center tracks the polar ice from satellites, with a record going back to 1979."],
];

/** What the source behind a label is and how it works, where one is known. */
export const aboutSource = (label: string): string | undefined => SOURCE_ABOUT.find(([r]) => r.test(label))?.[1];
