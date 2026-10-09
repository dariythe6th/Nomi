import { createContext } from 'react';

export interface BotsContextValue {
  running: boolean;
  ready: boolean;
  setRunning: (value: boolean) => void;
}

export const BotsContext = createContext<BotsContextValue | null>(null);