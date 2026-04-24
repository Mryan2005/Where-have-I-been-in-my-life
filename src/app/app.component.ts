import {
  Component, OnInit, OnDestroy, ViewChild,
  HostListener, AfterViewInit
} from '@angular/core';
import { Subscription } from 'rxjs';
import { LocationService } from './services/location.service';
import { TravelLocation } from './models/location.model';
import { MapComponent } from './components/map/map.component';

type Lang = 'zh' | 'en';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  zh: {
    appName: '我去过的地方',
    list: '列表',
    settings: '设置',
    search: '搜索地点…',
    language: '语言',
    theme: '主题',
    dark: '深色模式',
    light: '浅色模式',
    minimizedWindows: '已最小化窗口',
    noResults: '没有匹配的地点',
    noMinimized: '没有最小化的窗口',
    restore: '恢复',
    locations: '地点列表',
    settingsTitle: '偏好设置',
  },
  en: {
    appName: 'Where I\'ve Been',
    list: 'List',
    settings: 'Settings',
    search: 'Search locations…',
    language: 'Language',
    theme: 'Theme',
    dark: 'Dark Mode',
    light: 'Light Mode',
    minimizedWindows: 'Minimized Windows',
    noResults: 'No matching locations',
    noMinimized: 'No minimized windows',
    restore: 'Restore',
    locations: 'Locations',
    settingsTitle: 'Preferences',
  },
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MapComponent) mapComp!: MapComponent;

  // ── Multi-window state ─────────────────────────────────────────────────────
  openWindows: TravelLocation[] = [];
  minimizedWindowIds = new Set<string>();

  // ── Panel window visibility ────────────────────────────────────────────────
  showListPanel = false;
  showSettingsPanel = false;

  // ── List window drag state ─────────────────────────────────────────────────
  listWindowX = 80;
  listWindowY = 60;
  private listWinDragging = false;
  private listWinOffsetX = 0;
  private listWinOffsetY = 0;

  // ── Settings window drag state ─────────────────────────────────────────────
  settingsWindowX = 260;
  settingsWindowY = 60;
  private settingsWinDragging = false;
  private settingsWinOffsetX = 0;
  private settingsWinOffsetY = 0;

  // ── List search ────────────────────────────────────────────────────────────
  searchQuery = '';
  allLocations: TravelLocation[] = [];

  // ── i18n & theme ──────────────────────────────────────────────────────────
  currentLang: Lang = 'zh';
  isDarkMode = true;

  private sub!: Subscription;

  constructor(private locationService: LocationService) {}

  ngOnInit(): void {
    this.sub = this.locationService.locations$.subscribe(locs => {
      this.allLocations = locs;
    });
    this.applyTheme();
  }

  ngAfterViewInit(): void { /* mapComp is now available */ }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ── Translation helper ─────────────────────────────────────────────────────
  t(key: string): string {
    return TRANSLATIONS[this.currentLang][key] ?? key;
  }

  // ── Filtered locations for list panel ─────────────────────────────────────
  get filteredLocations(): TravelLocation[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.allLocations;
    return this.allLocations.filter(l =>
      l.name.toLowerCase().includes(q) || l.content?.toLowerCase().includes(q)
    );
  }

  get minimizedWindows(): TravelLocation[] {
    return this.openWindows.filter(l => this.minimizedWindowIds.has(l.id));
  }

  get visibleWindows(): TravelLocation[] {
    return this.openWindows.filter(l => !this.minimizedWindowIds.has(l.id));
  }

  // ── Window management ──────────────────────────────────────────────────────
  onLocationSelected(loc: TravelLocation): void {
    const existing = this.openWindows.find(w => w.id === loc.id);
    if (!existing) {
      this.openWindows = [...this.openWindows, loc];
    }
    // If minimized, restore it
    this.minimizedWindowIds.delete(loc.id);
    this.showListPanel = false;
  }

  onWindowClosed(loc: TravelLocation): void {
    this.openWindows = this.openWindows.filter(w => w.id !== loc.id);
    this.minimizedWindowIds.delete(loc.id);
  }

  onMinimizeToggled(loc: TravelLocation): void {
    this.minimizedWindowIds.add(loc.id);
    this.minimizedWindowIds = new Set(this.minimizedWindowIds);
  }

  restoreWindow(loc: TravelLocation): void {
    this.minimizedWindowIds.delete(loc.id);
    this.minimizedWindowIds = new Set(this.minimizedWindowIds);
  }

  /** Open location detail window and fly the map to it. */
  openLocationFromList(loc: TravelLocation): void {
    this.onLocationSelected(loc);
    this.mapComp?.flyTo(loc.longitude, loc.latitude);
  }

  // ── Topbar panel window toggles ────────────────────────────────────────────
  toggleListPanel(): void {
    this.showListPanel = !this.showListPanel;
    if (this.showListPanel) this.showSettingsPanel = false;
  }

  toggleSettingsPanel(): void {
    this.showSettingsPanel = !this.showSettingsPanel;
    if (this.showSettingsPanel) this.showListPanel = false;
  }

  closeAllPanels(): void {
    this.showListPanel = false;
    this.showSettingsPanel = false;
  }

  // ── List window drag ───────────────────────────────────────────────────────
  onListTitleBarMouseDown(e: MouseEvent): void {
    this.listWinDragging = true;
    this.listWinOffsetX = e.clientX - this.listWindowX;
    this.listWinOffsetY = e.clientY - this.listWindowY;
    e.preventDefault();
  }

  // ── Settings window drag ───────────────────────────────────────────────────
  onSettingsTitleBarMouseDown(e: MouseEvent): void {
    this.settingsWinDragging = true;
    this.settingsWinOffsetX = e.clientX - this.settingsWindowX;
    this.settingsWinOffsetY = e.clientY - this.settingsWindowY;
    e.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onDocMouseMove(e: MouseEvent): void {
    if (this.listWinDragging) {
      this.listWindowX = e.clientX - this.listWinOffsetX;
      this.listWindowY = e.clientY - this.listWinOffsetY;
    }
    if (this.settingsWinDragging) {
      this.settingsWindowX = e.clientX - this.settingsWinOffsetX;
      this.settingsWindowY = e.clientY - this.settingsWinOffsetY;
    }
  }

  @HostListener('document:mouseup')
  onDocMouseUp(): void {
    this.listWinDragging = false;
    this.settingsWinDragging = false;
  }

  // ── i18n & theme ──────────────────────────────────────────────────────────
  toggleLang(): void {
    this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
    }
  }
}
