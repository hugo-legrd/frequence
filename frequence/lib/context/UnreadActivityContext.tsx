import { createContext, useContext } from 'react';
import { useUnreadActivityCount } from '../../hooks/social/useUnreadActivityCount';

const UnreadActivityContext = createContext<ReturnType<typeof useUnreadActivityCount> | null>(null);

export function UnreadActivityProvider({ children }: { children: React.ReactNode }) {
  const value = useUnreadActivityCount();
  return (
    <UnreadActivityContext.Provider value={value}>
      {children}
    </UnreadActivityContext.Provider>
  );
}

export function useUnreadActivity() {
  const ctx = useContext(UnreadActivityContext);
  if (!ctx) throw new Error('useUnreadActivity must be used within UnreadActivityProvider');
  return ctx
}