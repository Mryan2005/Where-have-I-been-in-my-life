import {
  Component, OnInit, OnDestroy, Output, EventEmitter,
  NgZone, ChangeDetectionStrategy
} from '@angular/core';
import { Subscription } from 'rxjs';
import * as maplibregl from 'maplibre-gl';
import { LocationService } from '../../services/location.service';
import { TravelLocation } from '../../models/location.model';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit, OnDestroy {
  @Output() locationSelected = new EventEmitter<TravelLocation>();

  private map!: maplibregl.Map;
  private markers = new Map<string, maplibregl.Marker>();
  private userMarker: maplibregl.Marker | null = null;
  private sub!: Subscription;

  constructor(
    private locationService: LocationService,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.map = new maplibregl.Map({
        container: 'map-container',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [104.1954, 35.8617],
        zoom: 3.5,
        pitch: 45,
        bearing: -10,
        canvasContextAttributes: { antialias: true },
      });

      this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
      this.map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
      this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');

      const geoControl = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      });

      geoControl.on('geolocate', (pos: GeolocationPosition) => {
        this.placeUserMarker(pos.coords.longitude, pos.coords.latitude);
      });

      this.map.addControl(geoControl, 'top-right');

      this.map.on('load', () => {
        // 3-D terrain
        this.map.addSource('terrain', {
          type: 'raster-dem',
          tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
          encoding: 'terrarium',
          tileSize: 256,
        });
        this.map.setTerrain({ source: 'terrain', exaggeration: 1.8 });

        // Sky / atmosphere layer
        this.map.setSky({
          'atmosphere-blend': 0.5,
        });

        // Subscribe to location list
        this.sub = this.locationService.locations$.subscribe(locations => {
          this.zone.run(() => this.syncMarkers(locations));
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.map?.remove();
  }

  /** Fly the map camera to the given coordinates. */
  flyTo(lng: number, lat: number, zoom = 12): void {
    if (!this.map) return;
    this.zone.runOutsideAngular(() => {
      this.map.flyTo({ center: [lng, lat], zoom, duration: 1400, essential: true });
    });
  }

  private placeUserMarker(lng: number, lat: number): void {
    this.zone.runOutsideAngular(() => {
      if (this.userMarker) {
        this.userMarker.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        this.userMarker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(this.map);
      }
    });
  }

  private syncMarkers(locations: TravelLocation[]): void {
    // Remove stale markers
    const ids = new Set(locations.map(l => l.id));
    this.markers.forEach((marker, id) => {
      if (!ids.has(id)) { marker.remove(); this.markers.delete(id); }
    });

    // Add / update markers
    locations.forEach(loc => {
      if (this.markers.has(loc.id)) {
        this.markers.get(loc.id)!.setLngLat([loc.longitude, loc.latitude]);
      } else {
        const el = this.createMarkerEl(loc);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([loc.longitude, loc.latitude])
          .addTo(this.map);
        this.markers.set(loc.id, marker);
      }
    });
  }

  private createMarkerEl(loc: TravelLocation): HTMLElement {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.setProperty('--color', loc.markerColor ?? '#E74C3C');
    el.innerHTML = `
      <div class="marker-pin"></div>
      <div class="marker-label">${loc.name}</div>
    `;
    el.addEventListener('click', () =>
      this.zone.run(() => this.locationSelected.emit(loc))
    );
    return el;
  }
}
