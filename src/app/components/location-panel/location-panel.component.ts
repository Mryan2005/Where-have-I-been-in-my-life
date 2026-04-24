import {
  Component, Input, Output, EventEmitter, OnChanges,
  SimpleChanges, HostListener, ChangeDetectionStrategy, ChangeDetectorRef,
  SecurityContext
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';
import { TravelLocation } from '../../models/location.model';

@Component({
  selector: 'app-location-panel',
  templateUrl: './location-panel.component.html',
  styleUrl: './location-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationPanelComponent implements OnChanges {
  @Input() location!: TravelLocation;
  @Output() closed = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<TravelLocation>();

  renderedContent = '';
  isMinimized = false;
  isMaximized = false;

  windowX = 120;
  windowY = 80;
  windowWidth = 680;
  windowHeight = 520;

  private dragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private savedState = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['location'] && this.location) {
      const raw = marked.parse(this.location.content ?? '') as string;
      this.renderedContent = this.sanitizer.sanitize(SecurityContext.HTML, raw) ?? '';
      this.isMinimized = false;
    }
  }

  // ── Title-bar drag ──────────────────────────────────────────────────────────
  onTitleBarMouseDown(event: MouseEvent): void {
    if (this.isMaximized) return;
    this.dragging = true;
    this.dragOffsetX = event.clientX - this.windowX;
    this.dragOffsetY = event.clientY - this.windowY;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.dragging) return;
    this.windowX = event.clientX - this.dragOffsetX;
    this.windowY = event.clientY - this.dragOffsetY;
    this.cdr.markForCheck();
  }

  @HostListener('document:mouseup')
  onMouseUp(): void { this.dragging = false; }

  // ── Traffic-light buttons ───────────────────────────────────────────────────
  close(): void { this.closed.emit(); }

  toggleMinimize(): void { this.isMinimized = !this.isMinimized; }

  toggleMaximize(): void {
    if (this.isMaximized) {
      this.windowX = this.savedState.x;
      this.windowY = this.savedState.y;
      this.windowWidth = this.savedState.w;
      this.windowHeight = this.savedState.h;
      this.isMaximized = false;
    } else {
      this.savedState = {
        x: this.windowX, y: this.windowY,
        w: this.windowWidth, h: this.windowHeight,
      };
      this.windowX = 0;
      this.windowY = 0;
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
      this.isMaximized = true;
    }
    this.cdr.markForCheck();
  }

  requestEdit(): void { this.editRequested.emit(this.location); }
}
