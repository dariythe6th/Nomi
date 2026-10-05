import { useCallback, useState } from 'react';
import { planRoute, type PlanParams } from './motisApi';
import type { Itinerary } from './types';

interface State {
  loading: boolean;
  error: string | null;
  itineraries: Itinerary[];
}

export function useRoutePlan() {
  const [state, setState] = useState<State>({
    loading: false,
    error: null,
    itineraries: [],
  });

  const findRoute = useCallback(async (params: PlanParams) => {
    setState({ loading: true, error: null, itineraries: [] });
    try {
      const result = await planRoute(params);
      setState({ loading: false, error: null, itineraries: result.itineraries });
      return result.itineraries;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      setState({ loading: false, error: message, itineraries: [] });
      return [];
    }
  }, []);

  return { ...state, findRoute };
}