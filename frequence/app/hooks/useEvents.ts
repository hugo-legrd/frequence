import { useState, useEffect } from 'react';
import { fetchEvents, TicketmasterEvent } from '../../lib/services/ticketmaster';

export function useEvents(filters?: { genre?: string }) {
  const [events, setEvents] = useState<TicketmasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchEvents({ genre: filters?.genre })
      .then(data => {
        setEvents(data);
        setError(null);
      })
      .catch(e => {
        console.error(e);
        setError('Impossible de charger les événments.');
      })
      .finally(() => setLoading(false));
  }, [filters?.genre]);

  return { events, loading, error };
}