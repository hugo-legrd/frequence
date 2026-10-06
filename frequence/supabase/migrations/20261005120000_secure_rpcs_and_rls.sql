-- Sécurisation des RPC, de genre_slug_map et de la vue event_interest_counts.
--
-- Problème : les RPC sociales sont SECURITY DEFINER (elles contournent la RLS)
-- et font confiance à un `current_user_id` fourni par le client. N'importe qui
-- disposant de la clé anon pouvait donc appeler /rest/v1/rpc/... avec l'UUID
-- d'un autre utilisateur.
--
-- Correctif : les signatures sont INCHANGÉES (l'app continue de fonctionner),
-- mais le paramètre `current_user_id` est ignoré ; l'identité vient de
-- auth.uid() (JWT). Sans session valide, auth.uid() est NULL => 0 ligne.
-- Les droits EXECUTE sont ensuite retirés à `anon`.
-- Le paramètre pourra être retiré côté client dans un second temps.

begin;

-- ---------------------------------------------------------------------------
-- 1. RPC : l'identité vient de auth.uid(), plus du paramètre
-- ---------------------------------------------------------------------------

create or replace function public.get_all_genres_with_selection(current_user_id uuid)
returns table(id uuid, name text, selected boolean)
language sql stable security definer
set search_path to 'public'
as $function$
  select g.id, g.name,
         exists (
           select 1 from user_genres ug
           where ug.user_id = auth.uid() and ug.genre_id = g.id
         ) as selected
  from genres g
  order by g.name;
$function$;

create or replace function public.get_event_counts(event_ids uuid[], current_user_id uuid)
returns table(event_id uuid, interested_count bigint, going_count bigint, friends_going bigint, friends_interested bigint)
language sql stable security definer
set search_path to 'public'
as $function$
  select
    e.id as event_id,
    count(i.*) filter (where i.status = 'interested') as interested_count,
    count(i.*) filter (where i.status = 'going') as going_count,
    count(i.*) filter (
      where i.status = 'going' and exists (
        select 1 from follows f
        where f.follower_id = auth.uid() and f.following_id = i.user_id)
    ) as friends_going,
    count(i.*) filter (
      where i.status = 'interested' and exists (
        select 1 from follows f
        where f.follower_id = auth.uid() and f.following_id = i.user_id)
    ) as friends_interested
  from unnest(event_ids) as e(id)
  left join interests i on i.event_id = e.id
  group by e.id;
$function$;

create or replace function public.get_follow_list(target_user_id uuid, current_user_id uuid, kind text)
returns table(id uuid, display_name text, handle text, avatar_url text, is_following boolean)
language sql stable security definer
set search_path to 'public'
as $function$
  select u.id, u.name, u.handle, u.avatar_url,
         exists (
           select 1 from follows f2
           where f2.follower_id = auth.uid() and f2.following_id = u.id
         ) as is_following
  from follows f
  join public.users u
    on u.id = case when kind = 'followers' then f.follower_id else f.following_id end
  where ((kind = 'followers' and f.following_id = target_user_id)
     or  (kind = 'following' and f.follower_id  = target_user_id))
  -- listes masquees si le profil cible est prive et qu'on ne le suit pas
  and exists (
    select 1 from public.users t
    where t.id = target_user_id
      and (t.profile_visibility = 'public'
           or t.id = auth.uid()
           or exists (select 1 from follows f3
                      where f3.follower_id = auth.uid()
                        and f3.following_id = target_user_id))
  )
  order by u.name;
$function$;
-- NB : j'ai ajouté des parenthèses autour du OR de kind. Dans la version
-- d'origine, `A or B and exists(...)` s'évaluait comme `A or (B and exists(...))`
-- : la condition de visibilité ne s'appliquait donc PAS au cas 'followers'.

create or replace function public.get_friends_activity(current_user_id uuid, limit_count integer default 50)
returns table(actor_id uuid, actor_display_name text, status text, event_id uuid, event_name text, artist_name text, venue_name text, starts_at timestamp without time zone, created_at timestamp without time zone)
language sql stable security definer
set search_path to 'public'
as $function$
  SELECT
    i.user_id AS actor_id,
    trim(
      COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(u.raw_user_meta_data->>'last_name', '')
    ) AS actor_display_name,
    i.status,
    e.id AS event_id,
    e.name AS event_name,
    a.name AS artist_name,
    v.name AS venue_name,
    e.starts_at,
    i.created_at
  FROM interests i
  JOIN follows f ON f.following_id = i.user_id
  JOIN auth.users u ON u.id = i.user_id
  LEFT JOIN events e ON e.id = i.event_id
  LEFT JOIN artists a ON a.id = e.artist_id
  LEFT JOIN venues v ON v.id = e.venue_id
  WHERE f.follower_id = auth.uid()
  ORDER BY i.created_at DESC
  LIMIT limit_count;
$function$;

create or replace function public.get_friends_going(target_event_id uuid, current_user_id uuid)
returns table(user_id uuid, display_name text, handle text, avatar_url text, status text)
language sql stable security definer
set search_path to 'public'
as $function$
  select u.id, u.name, u.handle, u.avatar_url, i.status
  from interests i
  join follows f on f.following_id = i.user_id and f.follower_id = auth.uid()
  join public.users u on u.id = i.user_id
  where i.event_id = target_event_id
  order by (i.status = 'going') desc, u.name;
$function$;

create or replace function public.get_home_friends_pick(current_user_id uuid)
returns table(event_id uuid, event_name text, artist_name text, venue_name text, friend_names text[], friends_count bigint)
language sql stable security definer
set search_path to 'public'
as $function$
  SELECT
    e.id AS event_id,
    e.name AS event_name,
    a.name AS artist_name,
    v.name AS venue_name,
    array_agg(
      trim(COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(u.raw_user_meta_data->>'last_name', ''))
      ORDER BY i.created_at
    ) AS friend_names,
    count(*) AS friends_count
  FROM interests i
  JOIN follows f ON f.following_id = i.user_id
  JOIN auth.users u ON u.id = i.user_id
  JOIN events e ON e.id = i.event_id
  LEFT JOIN artists a ON a.id = e.artist_id
  LEFT JOIN venues v ON v.id = e.venue_id
  WHERE f.follower_id = auth.uid()
    AND e.starts_at > now()
  GROUP BY e.id, e.name, a.name, v.name
  ORDER BY friends_count DESC
  LIMIT 1;
$function$;

create or replace function public.get_mutual_friends(target_user_id uuid, current_user_id uuid, limit_count integer default 3)
returns table(id uuid, display_name text)
language sql stable security definer
set search_path to 'public'
as $function$
  SELECT
    u.id,
    trim(
      COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(u.raw_user_meta_data->>'last_name', '')
    ) AS display_name
  FROM follows f1
  JOIN follows f2 ON f1.following_id = f2.following_id
  JOIN auth.users u ON u.id = f1.following_id
  WHERE f1.follower_id = auth.uid()
    AND f2.follower_id = target_user_id
  LIMIT limit_count;
$function$;

create or replace function public.get_mutual_friends_count(target_user_id uuid, current_user_id uuid)
returns bigint
language sql stable security definer
set search_path to 'public'
as $function$
  SELECT count(*)
  FROM follows f1
  JOIN follows f2 ON f1.following_id = f2.following_id
  WHERE f1.follower_id = auth.uid()
    AND f2.follower_id = target_user_id;
$function$;

-- get_my_* n'avaient pas de search_path fixé : on le fixe au passage.
create or replace function public.get_my_artists(current_user_id uuid)
returns table(artist_id uuid, artist_name text, image_url text, events_count bigint)
language sql security definer
set search_path to 'public'
as $function$
  SELECT
    a.id AS artist_id,
    a.name AS artist_name,
    a.image_url AS image_url,
    count(DISTINCT e.id) AS events_count
  FROM interests i
  JOIN events e ON e.id = i.event_id
  JOIN artists a ON a.id = e.artist_id
  WHERE i.user_id = auth.uid()
  GROUP BY a.id, a.name, a.image_url
  ORDER BY events_count DESC;
$function$;

create or replace function public.get_my_events(current_user_id uuid)
returns table(event_id uuid, event_name text, artist_name text, venue_name text, starts_at timestamp with time zone, status text, is_past boolean, image_url text, style text[])
language sql security definer
set search_path to 'public'
as $function$
  SELECT
    e.id AS event_id,
    e.name AS event_name,
    a.name AS artist_name,
    v.name AS venue_name,
    e.starts_at,
    i.status,
    (e.starts_at < now()) AS is_past,
    e.image_url,
    e.style
  FROM interests i
  JOIN events e ON e.id = i.event_id
  LEFT JOIN artists a ON a.id = e.artist_id
  LEFT JOIN venues v ON v.id = e.venue_id
  WHERE i.user_id = auth.uid()
  ORDER BY e.starts_at DESC;
$function$;

create or replace function public.get_my_profile(current_user_id uuid)
returns table(id uuid, display_name text, member_since timestamp with time zone, city text, avatar_url text, concerts_count bigint, artists_count bigint, follower_count bigint, following_count bigint, genres json)
language sql security definer
set search_path to 'public'
as $function$
  SELECT
    u.id AS id,
    trim(
      COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(u.raw_user_meta_data->>'last_name', '')
    ) AS display_name,
    u.created_at AS member_since,
    u.raw_user_meta_data->>'city' AS city,
    u.raw_user_meta_data->>'avatar_url' AS avatar_url,
    (SELECT count(*) FROM interests WHERE user_id = auth.uid()) AS concerts_count,
    (SELECT count(DISTINCT e.artist_id)
      FROM interests i
      JOIN events e ON e.id = i.event_id
      WHERE i.user_id = auth.uid()) AS artists_count,
    (SELECT count(*) FROM follows WHERE following_id = auth.uid()) AS follower_count,
    (SELECT count(*) FROM follows WHERE follower_id = auth.uid()) AS following_count,
    (SELECT json_agg(json_build_object('id', g.id, 'name', g.name))
      FROM user_genres ug
      JOIN genres g ON g.id = ug.genre_id
      WHERE ug.user_id = auth.uid()) AS genres
  FROM auth.users u
  WHERE u.id = auth.uid();
$function$;

create or replace function public.get_public_profile(target_user_id uuid, current_user_id uuid)
returns table(id uuid, display_name text, handle text, avatar_url text, profile_visibility text, is_following boolean, can_view boolean, followers_count bigint, following_count bigint, events_count bigint)
language sql stable security definer
set search_path to 'public'
as $function$
  with rel as (
    select exists (
      select 1 from follows f
      where f.follower_id = auth.uid() and f.following_id = target_user_id
    ) as following
  )
  select
    u.id,
    u.name as display_name,
    u.handle,
    u.avatar_url,
    u.profile_visibility,
    rel.following as is_following,
    (u.profile_visibility = 'public' or rel.following or u.id = auth.uid()) as can_view,
    (select count(*) from follows where following_id = u.id) as followers_count,
    (select count(*) from follows where follower_id = u.id) as following_count,
    case
      when u.profile_visibility = 'public' or rel.following or u.id = auth.uid()
        then (select count(*) from interests i where i.user_id = u.id)
      else 0::bigint
    end as events_count
  from public.users u, rel
  where u.id = target_user_id;
$function$;

create or replace function public.get_user_events(target_user_id uuid, current_user_id uuid)
returns table(event_id uuid, event_name text, artist_name text, venue_name text, starts_at timestamp with time zone, status text, is_past boolean, image_url text, style text[])
language sql stable security definer
set search_path to 'public'
as $function$
  select e.id, e.name, a.name, v.name, e.starts_at, i.status,
         (e.starts_at < now()), e.image_url, e.style
  from interests i
  join events e on e.id = i.event_id
  left join artists a on a.id = e.artist_id
  left join venues v on v.id = e.venue_id
  where i.user_id = target_user_id
    and exists (
      select 1 from public.users u
      where u.id = target_user_id
        and (u.profile_visibility = 'public'
             or u.id = auth.uid()
             or exists (select 1 from follows f
                        where f.follower_id = auth.uid()
                          and f.following_id = target_user_id))
    )
  order by e.starts_at desc;
$function$;

create or replace function public.search_users(search_term text, current_user_id uuid)
returns table(id uuid, display_name text, handle text, is_following boolean)
language sql stable security definer
set search_path to 'public'
as $function$
  select u.id,
         u.name as display_name,
         u.handle,
         exists (
           select 1 from public.follows f
           where f.follower_id = auth.uid() and f.following_id = u.id
         ) as is_following
  from public.users u
  where u.id <> auth.uid()
    and (
      u.name ilike '%' || search_term || '%'
      or u.handle ilike '%' || search_term || '%'
    )
  order by
    (u.handle ilike search_term || '%') desc,
    (u.name ilike search_term || '%') desc,
    u.name
  limit 20;
$function$;

-- ---------------------------------------------------------------------------
-- 2. Droits EXECUTE : plus d'accès pour `anon` (ni PUBLIC)
-- ---------------------------------------------------------------------------

revoke execute on function
  public.get_all_genres_with_selection(uuid),
  public.get_event_counts(uuid[], uuid),
  public.get_follow_list(uuid, uuid, text),
  public.get_friends_activity(uuid, integer),
  public.get_friends_going(uuid, uuid),
  public.get_home_friends_pick(uuid),
  public.get_mutual_friends(uuid, uuid, integer),
  public.get_mutual_friends_count(uuid, uuid),
  public.get_my_artists(uuid),
  public.get_my_events(uuid),
  public.get_my_profile(uuid),
  public.get_public_profile(uuid, uuid),
  public.get_user_events(uuid, uuid),
  public.search_users(text, uuid),
  public.set_my_handle(text),
  public.set_my_visibility(text),
  public.can_view_user(uuid)
from public, anon;

grant execute on function
  public.get_all_genres_with_selection(uuid),
  public.get_event_counts(uuid[], uuid),
  public.get_follow_list(uuid, uuid, text),
  public.get_friends_activity(uuid, integer),
  public.get_friends_going(uuid, uuid),
  public.get_home_friends_pick(uuid),
  public.get_mutual_friends(uuid, uuid, integer),
  public.get_mutual_friends_count(uuid, uuid),
  public.get_my_artists(uuid),
  public.get_my_events(uuid),
  public.get_my_profile(uuid),
  public.get_public_profile(uuid, uuid),
  public.get_user_events(uuid, uuid),
  public.search_users(text, uuid),
  public.set_my_handle(text),
  public.set_my_visibility(text),
  public.can_view_user(uuid)   -- utilisée par les policies RLS (rôle authenticated)
to authenticated;

-- Fonction de trigger : n'a pas à être appelable via l'API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- is_handle_available reste volontairement accessible à anon : elle est
-- appelée à l'inscription, avant d'avoir une session.

-- ---------------------------------------------------------------------------
-- 3. genre_slug_map : activer la RLS, lecture seule (aucune policy d'écriture)
-- ---------------------------------------------------------------------------

alter table public.genre_slug_map enable row level security;

create policy "Public read genre_slug_map"
  on public.genre_slug_map
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 4. Vue event_interest_counts : respecter la RLS de l'appelant
-- ---------------------------------------------------------------------------
-- Attention : les compteurs ne couvriront alors que les intérêts que
-- l'appelant a le droit de voir (voir policy "Read visible interests").
-- La vue n'est pas utilisée par l'app (elle passe par get_event_counts).

alter view public.event_interest_counts set (security_invoker = true);

commit;
