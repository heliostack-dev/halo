-- Halo core schema.
-- Conventions (see heliostack `data-layer` skill):
--   * bigint identity ids (monotonic → id-based cursors), exposed to TS as strings
--   * timestamptz everywhere, default now()
--   * denormalised counters maintained by triggers, never by application code
--   * every foreign key has an index; every list query has a matching index

create table users (
  id              bigint generated always as identity primary key,
  handle          text not null check (handle ~ '^[A-Za-z0-9_]{3,15}$'),
  email           text not null check (position('@' in email) > 1),
  password_hash   text not null,
  display_name    text not null check (char_length(display_name) between 1 and 50),
  bio             text not null default '' check (char_length(bio) <= 160),
  location        text not null default '' check (char_length(location) <= 30),
  website         text not null default '' check (char_length(website) <= 100),
  avatar_hue      smallint not null default 0 check (avatar_hue between 0 and 359),
  verified        boolean not null default false,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  posts_count     integer not null default 0,
  created_at      timestamptz not null default now()
);
create unique index users_handle_key on users (lower(handle));
create unique index users_email_key on users (lower(email));
create index users_search_idx on users (lower(display_name) text_pattern_ops);

create table sessions (
  token_hash  text primary key,               -- sha-256 of the cookie token, base64url
  user_id     bigint not null references users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  user_agent  text not null default ''
);
create index sessions_user_idx on sessions (user_id);

create table posts (
  id            bigint generated always as identity primary key,
  author_id     bigint not null references users (id) on delete cascade,
  body          text not null default '' check (char_length(body) <= 280),
  reply_to_id   bigint references posts (id) on delete set null,
  root_id       bigint references posts (id) on delete set null,  -- thread root for replies
  quote_of_id   bigint references posts (id) on delete set null,
  repost_of_id  bigint references posts (id) on delete cascade,   -- a repost is a post row
  like_count    integer not null default 0,
  repost_count  integer not null default 0,
  reply_count   integer not null default 0,
  quote_count   integer not null default 0,
  created_at    timestamptz not null default now(),
  search        tsvector generated always as (to_tsvector('simple', body)) stored,
  check (repost_of_id is null or (body = '' and reply_to_id is null and quote_of_id is null)),
  check (repost_of_id is not null or char_length(body) > 0)
);
create index posts_author_idx on posts (author_id, id desc);
create index posts_reply_to_idx on posts (reply_to_id, id) where reply_to_id is not null;
create index posts_root_idx on posts (root_id, id) where root_id is not null;
create index posts_quote_idx on posts (quote_of_id) where quote_of_id is not null;
create unique index posts_repost_once on posts (author_id, repost_of_id) where repost_of_id is not null;
create index posts_search_idx on posts using gin (search);
create index posts_recent_idx on posts (id desc) where reply_to_id is null and repost_of_id is null;

create table likes (
  user_id    bigint not null references users (id) on delete cascade,
  post_id    bigint not null references posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index likes_post_idx on likes (post_id);
create index likes_user_recent_idx on likes (user_id, created_at desc);

create table bookmarks (
  user_id    bigint not null references users (id) on delete cascade,
  post_id    bigint not null references posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index bookmarks_user_recent_idx on bookmarks (user_id, created_at desc);

create table follows (
  follower_id bigint not null references users (id) on delete cascade,
  followee_id bigint not null references users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on follows (followee_id, created_at desc);

create table post_hashtags (
  post_id    bigint not null references posts (id) on delete cascade,
  tag        text not null,                   -- lower-cased, without '#'
  created_at timestamptz not null default now(),
  primary key (post_id, tag)
);
create index post_hashtags_trend_idx on post_hashtags (created_at desc, tag);
create index post_hashtags_tag_idx on post_hashtags (tag, post_id desc);

create table post_mentions (
  post_id bigint not null references posts (id) on delete cascade,
  user_id bigint not null references users (id) on delete cascade,
  primary key (post_id, user_id)
);

create table notifications (
  id           bigint generated always as identity primary key,
  recipient_id bigint not null references users (id) on delete cascade,
  actor_id     bigint not null references users (id) on delete cascade,
  kind         text not null check (kind in ('like', 'repost', 'reply', 'quote', 'mention', 'follow')),
  post_id      bigint references posts (id) on delete cascade,
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);
-- one row per (recipient, actor, kind, post) — re-liking refreshes instead of duplicating
create unique index notifications_dedupe on notifications (recipient_id, actor_id, kind, coalesce(post_id, 0));
create index notifications_inbox_idx on notifications (recipient_id, id desc);
create index notifications_unread_idx on notifications (recipient_id) where read_at is null;

create table conversations (
  id          bigint generated always as identity primary key,
  dm_key      text unique,                     -- '<low id>:<high id>' for 1:1 conversations
  created_at  timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table conversation_members (
  conversation_id bigint not null references conversations (id) on delete cascade,
  user_id         bigint not null references users (id) on delete cascade,
  last_read_at    timestamptz not null default 'epoch',
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on conversation_members (user_id);

create table messages (
  id              bigint generated always as identity primary key,
  conversation_id bigint not null references conversations (id) on delete cascade,
  sender_id       bigint not null references users (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 1000),
  created_at      timestamptz not null default now()
);
create index messages_conversation_idx on messages (conversation_id, id desc);

-- ---------------------------------------------------------------- counter triggers

create function posts_counters() returns trigger language plpgsql as $$
declare
  delta integer := case when tg_op = 'INSERT' then 1 else -1 end;
  r posts := case when tg_op = 'INSERT' then new else old end;
begin
  if r.repost_of_id is not null then
    update posts set repost_count = repost_count + delta where id = r.repost_of_id;
    return null;
  end if;
  update users set posts_count = posts_count + delta where id = r.author_id;
  if r.reply_to_id is not null then
    update posts set reply_count = reply_count + delta where id = r.reply_to_id;
  end if;
  if r.quote_of_id is not null then
    update posts set quote_count = quote_count + delta where id = r.quote_of_id;
  end if;
  return null;
end $$;
create trigger posts_counters after insert or delete on posts
  for each row execute function posts_counters();

create function likes_counters() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update posts set like_count = like_count + 1 where id = new.post_id;
  else
    update posts set like_count = like_count - 1 where id = old.post_id;
  end if;
  return null;
end $$;
create trigger likes_counters after insert or delete on likes
  for each row execute function likes_counters();

create function follows_counters() returns trigger language plpgsql as $$
declare
  delta integer := case when tg_op = 'INSERT' then 1 else -1 end;
  r follows := case when tg_op = 'INSERT' then new else old end;
begin
  update users set following_count = following_count + delta where id = r.follower_id;
  update users set followers_count = followers_count + delta where id = r.followee_id;
  return null;
end $$;
create trigger follows_counters after insert or delete on follows
  for each row execute function follows_counters();
