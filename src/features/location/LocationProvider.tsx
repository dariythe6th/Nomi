import { type ReactNode } from 'react';
import { useGeolocated } from 'react-geolocated';
import { LocationContext } from './LocationContext';

export function LocationProvider({ children }: { children: ReactNode }) {
  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: { enableHighAccuracy: true },
    watchPosition: true,
  });

  return (
    <LocationContext.Provider
      value={{
        coords: coords ?? null,
        isAvailable: isGeolocationAvailable,
        isEnabled: isGeolocationEnabled,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}