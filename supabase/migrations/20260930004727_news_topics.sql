-- Each headline also carries the topics of the site's pages it serves, so
-- each page's banner reads the desks that cover its subject: world affairs,
-- US news, the economy, public policy, humanitarian crises, the climate,
-- crime and justice.
-- A topical headline need not name a place ("Carbon dioxide hits a new
-- high" is climate news), so a row now needs a place or a topic.
--
-- Applied 30 September 2026, before refresh-data version 4, which writes
-- topics: the news job's upsert names the column.
alter table public.news_items
  add column topics text[] not null default '{}'
    check (topics <@ array['world', 'us', 'economy', 'policy', 'humanitarian', 'climate', 'crime']::text[]);
comment on column public.news_items.topics is
  'The site pages the headline''s desk serves: world, us, economy, policy, humanitarian, climate, crime. Empty on rows fetched before topics existed.';

alter table public.news_items drop constraint news_items_places_check;
alter table public.news_items add constraint news_items_places_check
  check (cardinality(places) <= 20 and (cardinality(places) >= 1 or cardinality(topics) >= 1));

create index news_items_topics_idx on public.news_items using gin (topics);
