import { type ReactNode } from 'react';
import { BotsContext } from './BotsContext';
import { useBots } from './useBots';

export function BotsProvider({ children }: { children: ReactNode }) {
  const { running, ready, setRunning } = useBots();

  return (
    <BotsContext.Provider value={{ running, ready, setRunning }}>
      {children}
    </BotsContext.Provider>
  );
}