import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TravelLocation } from '../models/location.model';
import { DEFAULT_LOCATIONS } from '../data/locations.data';

const STORAGE_KEY = 'travel_locations';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly _locations$ = new BehaviorSubject<TravelLocation[]>(this.load());

  /** Observable stream of all locations */
  readonly locations$ = this._locations$.asObservable();

  get snapshot(): TravelLocation[] {
    return this._locations$.getValue();
  }

  add(location: TravelLocation): void {
    const updated = [...this.snapshot, location];
    this.save(updated);
  }

  update(location: TravelLocation): void {
    const updated = this.snapshot.map(l => l.id === location.id ? location : l);
    this.save(updated);
  }

  remove(id: string): void {
    const updated = this.snapshot.filter(l => l.id !== id);
    this.save(updated);
  }

  getById(id: string): TravelLocation | undefined {
    return this.snapshot.find(l => l.id === id);
  }

  private load(): TravelLocation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: TravelLocation[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore parse errors
    }
    return DEFAULT_LOCATIONS;
  }

  private save(locations: TravelLocation[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    this._locations$.next(locations);
  }
}
