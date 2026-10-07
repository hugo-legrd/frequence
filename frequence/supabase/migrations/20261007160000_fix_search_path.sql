alter function public.get_active_genres() set search_path to 'public';
alter function public.get_random_upcoming_event() set search_path to 'public';
alter function public.search_all(text) set search_path to 'public';
alter function public.sync_event_genres(uuid) set search_path to 'public';
alter function public.trg_sync_event_genres() set search_path to 'public';
