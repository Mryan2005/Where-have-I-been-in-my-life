import {
  Component, Input, Output, EventEmitter, OnInit,
  HostListener, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';

export interface ImageViewerData {
  id: string;
  src: string;
  title: string;
}

@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewerComponent implements OnInit {
  @Input() imageData!: ImageViewerData;
  @Input() zIndex = 1000;
  @Output() closed = new EventEmitter<void>();
  @Output() minimizeToggled = new EventEmitter<void>();
  @Output() focused = new EventEmitter<void>();

  isMaximized = false;
  zoomScale = 1;

  windowX = 200;
  windowY = 150;
  windowWidth = 600;
  windowHeight = 500;

  private dragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private savedState = { x: 0, y: 0, w: 0, h: 0 };

  constructor(private cdr: ChangeDetectorRef) {}

  get isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  ngOnInit(): void {
    if (this.isMobile) {
      this.maximizeForMobile();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isMobile && !this.isMaximized) {
      this.maximizeForMobile();
      this.cdr.markForCheck();
    }
  }

  private maximizeForMobile(): void {
    this.savedState = { x: this.windowX, y: this.windowY, w: this.windowWidth, h: this.windowHeight };
    this.windowX = 0;
    this.windowY = 0;
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
    this.isMaximized = true;
  }

  // ── Title-bar drag (mouse) ─────────────────────────────────────────────────
  onTitleBarMouseDown(event: MouseEvent): void {
    this.focused.emit();
    if (this.isMaximized) return;
    this.dragging = true;
    this.dragOffsetX = event.clientX - this.windowX;
    this.dragOffsetY = event.clientY - this.windowY;
    event.preventDefault();
  }

  onWindowMouseDown(): void {
    this.focused.emit();
  }

  // ── Title-bar drag (touch) ─────────────────────────────────────────────────
  onTitleBarTouchStart(event: TouchEvent): void {
    if (this.isMaximized) return;
    const touch = event.touches[0];
    this.dragging = true;
    this.dragOffsetX = touch.clientX - this.windowX;
    this.dragOffsetY = touch.clientY - this.windowY;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.dragging) return;
    this.windowX = event.clientX - this.dragOffsetX;
    this.windowY = event.clientY - this.dragOffsetY;
    this.cdr.markForCheck();
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.dragging) return;
    const touch = event.touches[0];
    this.windowX = touch.clientX - this.dragOffsetX;
    this.windowY = touch.clientY - this.dragOffsetY;
    this.cdr.markForCheck();
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  onPointerUp(): void { this.dragging = false; }

  // ── Traffic-light buttons ───────────────────────────────────────────────────
  close(): void { this.closed.emit(); }

  minimize(): void { this.minimizeToggled.emit(); }

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

  // ── Image Zoom (Mouse Wheel) ────────────────────────────────────────────────
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1;
    this.zoomScale += zoomDelta;
    this.zoomScale = Math.max(0.1, Math.min(this.zoomScale, 10)); // Clamp between 0.1x and 10x
    this.cdr.markForCheck();
  }
}
