import { createContext } from 'react';

export interface LocationContextValue {
  coords: GeolocationCoordinates | null;
  isAvailable: boolean;
  isEnabled: boolean;
}

export const LocationContext = createContext<LocationContextValue | null>(null);