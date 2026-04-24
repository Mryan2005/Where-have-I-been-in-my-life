import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LocationService } from './services/location.service';
import { TravelLocation } from './models/location.model';

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
  },
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  // ── Multi-window state ─────────────────────────────────────────────────────
  openWindows: TravelLocation[] = [];
  minimizedWindowIds = new Set<string>();

  // ── Panel visibility ───────────────────────────────────────────────────────
  showListPanel = false;
  showSettingsPanel = false;
  showDock = false;

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
    // Force change detection on the Set
    this.minimizedWindowIds = new Set(this.minimizedWindowIds);
  }

  restoreWindow(loc: TravelLocation): void {
    this.minimizedWindowIds.delete(loc.id);
    this.minimizedWindowIds = new Set(this.minimizedWindowIds);
  }

  openLocationFromList(loc: TravelLocation): void {
    this.onLocationSelected(loc);
  }

  // ── Topbar panel toggles ───────────────────────────────────────────────────
  toggleListPanel(): void {
    this.showListPanel = !this.showListPanel;
    if (this.showListPanel) this.showSettingsPanel = false;
  }

  toggleSettingsPanel(): void {
    this.showSettingsPanel = !this.showSettingsPanel;
    if (this.showSettingsPanel) this.showListPanel = false;
  }

  toggleDock(): void {
    this.showDock = !this.showDock;
  }

  closeAllPanels(): void {
    this.showListPanel = false;
    this.showSettingsPanel = false;
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
