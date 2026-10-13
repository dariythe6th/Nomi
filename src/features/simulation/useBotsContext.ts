import { useContext } from 'react';
import { BotsContext } from './BotsContext';

export function useBotsContext() {
  const ctx = useContext(BotsContext);
  if (!ctx) throw new Error('useBotsContext must be used within BotsProvider');
  return ctx;
}