/**
 * Represents a travel anchor point on the map.
 */
export interface TravelLocation {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Display name of the location */
  name: string;
  /** Markdown-formatted travel notes / journal entry */
  content: string;
  /** Geographic latitude (-90 to 90) */
  latitude: number;
  /** Geographic longitude (-180 to 180) */
  longitude: number;
  /** ISO 8601 date string of the visit */
  firstVisitDate: string;
  /** Base64-encoded or remote image URLs */
  images: string[];
  /** Optional hex color for the marker (defaults to '#E74C3C') */
  markerColor?: string;
}
