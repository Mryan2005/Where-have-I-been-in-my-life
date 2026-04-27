import {
  Component, Input, Output, EventEmitter, OnChanges,
  SimpleChanges, HostListener, ChangeDetectionStrategy, ChangeDetectorRef,
  SecurityContext, OnInit
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';
import { TravelLocation } from '../../models/location.model';

@Component({
  selector: 'app-location-panel',
  templateUrl: './location-panel.component.html',
  styleUrl: './location-panel.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationPanelComponent implements OnInit, OnChanges {
  @Input() location!: TravelLocation;
  @Input() zIndex = 1000;
  @Output() closed = new EventEmitter<void>();
  @Output() minimizeToggled = new EventEmitter<void>();
  @Output() focused = new EventEmitter<void>();

  renderedContent = '';
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

  get isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  ngOnInit(): void {
    if (this.isMobile) {
      this.maximizeForMobile();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['location'] && this.location) {
      const raw = marked.parse(this.location.content ?? '') as string;
      this.renderedContent = this.sanitizer.sanitize(SecurityContext.HTML, raw) ?? '';
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
}
