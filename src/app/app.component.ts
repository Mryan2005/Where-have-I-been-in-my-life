import { Component } from '@angular/core';
import { LocationService } from './services/location.service';
import { TravelLocation } from './models/location.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  selectedLocation: TravelLocation | null = null;
  showDialog = false;
  dialogInitialLat: number | null = null;
  dialogInitialLng: number | null = null;
  editingLocation: TravelLocation | null = null;

  constructor(private locationService: LocationService) {}

  onLocationSelected(loc: TravelLocation): void {
    this.selectedLocation = loc;
  }

  onMapClicked(coords: { lat: number; lng: number }): void {
    this.dialogInitialLat = coords.lat;
    this.dialogInitialLng = coords.lng;
    this.editingLocation = null;
    this.showDialog = true;
  }

  onPanelClosed(): void {
    this.selectedLocation = null;
  }

  onEditRequested(loc: TravelLocation): void {
    this.editingLocation = loc;
    this.showDialog = true;
  }

  onLocationSaved(loc: TravelLocation): void {
    if (this.editingLocation) {
      this.locationService.update(loc);
      if (this.selectedLocation?.id === loc.id) {
        this.selectedLocation = loc;
      }
    } else {
      this.locationService.add(loc);
    }
    this.showDialog = false;
    this.editingLocation = null;
  }

  onDialogCancelled(): void {
    this.showDialog = false;
    this.editingLocation = null;
  }

  openAddDialog(): void {
    this.editingLocation = null;
    this.dialogInitialLat = null;
    this.dialogInitialLng = null;
    this.showDialog = true;
  }
}
