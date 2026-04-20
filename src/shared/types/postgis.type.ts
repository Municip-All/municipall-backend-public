export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface Polygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface MultiPolygon {
  type: 'MultiPolygon';
  coordinates: [number, number][][][];
}
