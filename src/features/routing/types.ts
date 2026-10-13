export type LngLat = [number, number];

export interface Place {
  name: string;
  lat: number;
  lon: number;
  stopId?: string;
}

export interface Leg {
  mode: string;
  from: Place;
  to: Place;
  startTime: string;
  endTime: string;
  duration: number;
  distance: number;
  legGeometry: {
    points: string;
    length: number;
  };
  routeShortName?: string;
  routeLongName?: string;
  headsign?: string;
  intermediateStops?: Place[];
}

export interface Itinerary {
  duration: number;
  startTime: string;
  endTime: string;
  transfers: number;
  legs: Leg[];
}

export interface PlanResponse {
  itineraries: Itinerary[];
}