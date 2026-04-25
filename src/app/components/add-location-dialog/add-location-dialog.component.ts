import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges
} from '@angular/core';
import { TravelLocation } from '../../models/location.model';

@Component({
  selector: 'app-add-location-dialog',
  templateUrl: './add-location-dialog.component.html',
  styleUrl: './add-location-dialog.component.scss',
  standalone: false,
})
export class AddLocationDialogComponent implements OnChanges {
  /** Pre-filled lat/lng from map click (add mode) */
  @Input() initialLat: number | null = null;
  @Input() initialLng: number | null = null;
  /** Existing location for edit mode */
  @Input() editLocation: TravelLocation | null = null;

  @Output() saved = new EventEmitter<TravelLocation>();
  @Output() cancelled = new EventEmitter<void>();

  name = '';
  content = '';
  firstVisitDate = '';
  latitude = 0;
  longitude = 0;
  markerColor = '#E74C3C';
  images: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editLocation'] && this.editLocation) {
      const l = this.editLocation;
      this.name = l.name;
      this.content = l.content;
      this.firstVisitDate = l.firstVisitDate;
      this.latitude = l.latitude;
      this.longitude = l.longitude;
      this.markerColor = l.markerColor ?? '#E74C3C';
      this.images = [...l.images];
    } else if (changes['initialLat'] || changes['initialLng']) {
      if (!this.editLocation) {
        this.latitude = this.initialLat ?? 0;
        this.longitude = this.initialLng ?? 0;
      }
    }
  }

  get isEditMode(): boolean { return !!this.editLocation; }

  onImageUpload(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        this.images = [...this.images, reader.result as string];
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.images = this.images.filter((_, i) => i !== index);
  }

  submit(): void {
    const location: TravelLocation = {
      id: this.editLocation?.id ?? crypto.randomUUID(),
      name: this.name.trim(),
      content: this.content,
      firstVisitDate: this.firstVisitDate,
      latitude: +this.latitude,
      longitude: +this.longitude,
      markerColor: this.markerColor,
      images: this.images,
    };
    this.saved.emit(location);
    this.reset();
  }

  cancel(): void {
    this.cancelled.emit();
    this.reset();
  }

  private reset(): void {
    this.name = '';
    this.content = '';
    this.firstVisitDate = '';
    this.latitude = 0;
    this.longitude = 0;
    this.markerColor = '#E74C3C';
    this.images = [];
  }
}
