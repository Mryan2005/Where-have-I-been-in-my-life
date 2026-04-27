import {
  Component, OnInit, OnDestroy, ViewChild,
  HostListener, AfterViewInit, NgZone
} from '@angular/core';
import { Subscription } from 'rxjs';
import { LocationService } from './services/location.service';
import { TravelLocation } from './models/location.model';
import { MapComponent } from './components/map/map.component';
import { ABOUT_CONTENT } from './data/about.data';

type Lang = 'zh' | 'en';

interface CalendarDay {
  date: Date;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  locations: TravelLocation[];
}

const MONTH_NAMES_ZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const MONTH_NAMES_EN = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
const DAY_NAMES_ZH = ['日','一','二','三','四','五','六'];
const DAY_NAMES_EN = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  zh: {
    appName: '我去过的地方',
    list: '列表',
    calendar: '日历',
    settings: '设置',
    window: '窗口',
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
    calendarTitle: '旅行日历',
    about: '关于',
    showLabels: '显示锚点名称',
    hideLabels: '隐藏锚点名称',
    fullscreen: '全屏',
    exitFullscreen: '退出全屏',
    terrain: '3D 地形',
    atmosphere: '大气效果',
    on: '开启',
    off: '关闭',
    mapSettings: '地图设置',
    noOpenWindows: '没有打开的窗口',
  },
  en: {
    appName: 'Where I\'ve Been',
    list: 'List',
    calendar: 'Calendar',
    settings: 'Settings',
    window: 'Window',
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
    calendarTitle: 'Travel Calendar',
    about: 'About',
    showLabels: 'Show Marker Labels',
    hideLabels: 'Hide Marker Labels',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    terrain: '3D Terrain',
    atmosphere: 'Atmosphere',
    on: 'On',
    off: 'Off',
    mapSettings: 'Map Settings',
    noOpenWindows: 'No open windows',
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
  private windowZIndexCounter = 1000;
  windowZIndexes = new Map<string, number>();

  // ── Panel window visibility ────────────────────────────────────────────────
  showListPanel = false;
  showSettingsPanel = false;
  showCalendarPanel = false;
  showWindowPanel = false;

  // ── Map feature toggles ────────────────────────────────────────────────────
  showMarkerLabels = true;
  isFullscreen = false;
  showTerrain = true;
  showAtmosphere = true;

  // ── Calendar picker state ──────────────────────────────────────────────────
  calPickerMode = false;
  calPickerYear: number = new Date().getFullYear();
  calDayLocations: TravelLocation[] = [];   // locations for selected day
  calDayDate = '';                          // display label for selected day

  // ── About window ───────────────────────────────────────────────────────────
  showAboutPanel = false;
  aboutWindowX = 200;
  aboutWindowY = 80;
  private aboutWinDragging = false;
  private aboutWinOffsetX = 0;
  private aboutWinOffsetY = 0;

  // ── Minimized dock visibility ──────────────────────────────────────────────
  showMinimizedDock = true;

  // ── List window drag ───────────────────────────────────────────────────────
  listWindowX = 80;
  listWindowY = 60;
  private listWinDragging = false;
  private listWinOffsetX = 0;
  private listWinOffsetY = 0;

  // ── Settings window drag ───────────────────────────────────────────────────
  settingsWindowX = 260;
  settingsWindowY = 60;
  private settingsWinDragging = false;
  private settingsWinOffsetX = 0;
  private settingsWinOffsetY = 0;

  // ── Calendar window drag ───────────────────────────────────────────────────
  calendarWindowX = 440;
  calendarWindowY = 60;
  private calWinDragging = false;
  private calWinOffsetX = 0;
  private calWinOffsetY = 0;

  // ── Calendar month/year ────────────────────────────────────────────────────
  calendarYear: number;
  calendarMonth: number; // 0-based

  // ── List search ────────────────────────────────────────────────────────────
  searchQuery = '';
  allLocations: TravelLocation[] = [];

  // ── i18n & theme ──────────────────────────────────────────────────────────
  currentLang: Lang = 'zh';
  isDarkMode = true;

  readonly aboutContent = ABOUT_CONTENT;

  private sub!: Subscription;
  private colorSchemeQuery!: MediaQueryList;
  private colorSchemeListener!: (e: MediaQueryListEvent) => void;
  private fullscreenListener!: () => void;

  constructor(private locationService: LocationService, private zone: NgZone) {
    const now = new Date();
    this.calendarYear = now.getFullYear();
    this.calendarMonth = now.getMonth();

    // ── Auto-detect system language ────────────────────────────────────────
    const lang = navigator.language ?? navigator.languages?.[0] ?? '';
    this.currentLang = lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';

    // ── Auto-detect system color scheme ───────────────────────────────────
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.isDarkMode = this.colorSchemeQuery.matches;
    }
  }

  ngOnInit(): void {
    this.sub = this.locationService.locations$.subscribe(locs => {
      this.allLocations = locs;
    });
    this.applyTheme();

    // Listen for OS color scheme changes
    if (this.colorSchemeQuery) {
      this.colorSchemeListener = (e: MediaQueryListEvent) => {
        this.zone.run(() => {
          this.isDarkMode = e.matches;
          this.applyTheme();
        });
      };
      this.colorSchemeQuery.addEventListener('change', this.colorSchemeListener);
    }

    // Track browser fullscreen state
    this.fullscreenListener = () => {
      this.zone.run(() => {
        this.isFullscreen = !!document.fullscreenElement;
      });
    };
    document.addEventListener('fullscreenchange', this.fullscreenListener);
  }

  ngAfterViewInit(): void {
    // Auto-request geolocation on first visit
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.mapComp?.setUserLocation(pos.coords.longitude, pos.coords.latitude);
        },
        () => { /* permission denied or unavailable */ },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.colorSchemeQuery && this.colorSchemeListener) {
      this.colorSchemeQuery.removeEventListener('change', this.colorSchemeListener);
    }
    document.removeEventListener('fullscreenchange', this.fullscreenListener);
  }

  // ── Translation helper ─────────────────────────────────────────────────────
  t(key: string): string {
    return TRANSLATIONS[this.currentLang][key] ?? key;
  }

  // ── Calendar computed properties ───────────────────────────────────────────
  get calendarDayNames(): string[] {
    return this.currentLang === 'zh' ? DAY_NAMES_ZH : DAY_NAMES_EN;
  }

  get calendarMonthLabel(): string {
    const names = this.currentLang === 'zh' ? MONTH_NAMES_ZH : MONTH_NAMES_EN;
    if (this.currentLang === 'zh') {
      return `${this.calendarYear}年${names[this.calendarMonth]}`;
    }
    return `${names[this.calendarMonth]} ${this.calendarYear}`;
  }

  get calendarDays(): CalendarDay[] {
    const year = this.calendarYear;
    const month = this.calendarMonth;
    const today = new Date();
    const todayStr = this.toDateStr(today);

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const startDow = firstOfMonth.getDay(); // 0=Sun

    const days: CalendarDay[] = [];

    // Fill leading days from previous month
    for (let i = 0; i < startDow; i++) {
      const d = new Date(year, month, i - startDow + 1);
      days.push({ date: d, dayNum: d.getDate(), isCurrentMonth: false, isToday: false, locations: [] });
    }

    // Fill current month
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = this.toDateStr(date);
      const locations = this.allLocations.filter(l => l.firstVisitDate === dateStr);
      days.push({
        date,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        locations,
      });
    }

    // Fill trailing days from next month (up to 42 cells = 6 rows × 7 cols)
    let trailing = 42 - days.length;
    // Minimum: always complete the last row (at least 0 trailing days)
    if (trailing < 0) trailing = 0;
    for (let i = 1; i <= trailing; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, dayNum: d.getDate(), isCurrentMonth: false, isToday: false, locations: [] });
    }

    return days;
  }

  toDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ── Calendar navigation ────────────────────────────────────────────────────
  prevCalendarMonth(): void {
    if (this.calendarMonth === 0) {
      this.calendarMonth = 11;
      this.calendarYear--;
    } else {
      this.calendarMonth--;
    }
  }

  nextCalendarMonth(): void {
    if (this.calendarMonth === 11) {
      this.calendarMonth = 0;
      this.calendarYear++;
    } else {
      this.calendarMonth++;
    }
  }

  goToToday(): void {
    const now = new Date();
    this.calendarYear = now.getFullYear();
    this.calendarMonth = now.getMonth();
  }

  onCalendarDayClicked(day: CalendarDay): void {
    if (!day.locations.length) return;
    if (this.calDayLocations.length && this.calDayDate === this.toDateStr(day.date)) {
      // Second click on same day: clear selection
      this.calDayLocations = [];
      this.calDayDate = '';
      return;
    }
    // Show location list for this day
    this.calDayLocations = day.locations;
    this.calDayDate = this.toDateStr(day.date);
  }

  /** Fly to a location from the cal-day locations panel */
  flyToCalLoc(loc: TravelLocation): void {
    this.mapComp?.flyTo(loc.longitude, loc.latitude);
    this.closeAllPanels();
  }

  /** Toggle year/month picker mode */
  toggleCalPicker(): void {
    this.calPickerMode = !this.calPickerMode;
    if (this.calPickerMode) {
      this.calPickerYear = this.calendarYear;
      this.calDayLocations = [];
      this.calDayDate = '';
    }
  }

  /** Select year + month from picker */
  selectYearMonth(year: number, month: number): void {
    this.calendarYear = year;
    this.calendarMonth = month;
    this.calPickerMode = false;
    this.calDayLocations = [];
    this.calDayDate = '';
  }

  /** Years available in the picker (10 years back, 5 ahead) */
  get calPickerYears(): number[] {
    const base = this.calPickerYear - 4;
    return Array.from({ length: 9 }, (_, i) => base + i);
  }

  get calPickerMonthNames(): string[] {
    return this.currentLang === 'zh'
      ? ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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

  // ── Window z-index management ──────────────────────────────────────────────
  getWindowZIndex(loc: TravelLocation): number {
    return this.windowZIndexes.get(loc.id) ?? 1000;
  }

  onWindowFocused(loc: TravelLocation): void {
    this.windowZIndexCounter++;
    this.windowZIndexes.set(loc.id, this.windowZIndexCounter);
  }

  // ── Window management ──────────────────────────────────────────────────────
  onLocationSelected(loc: TravelLocation): void {
    const existing = this.openWindows.find(w => w.id === loc.id);
    if (!existing) {
      this.openWindows = [...this.openWindows, loc];
    }
    // Auto-minimize all other visible windows when a new location is selected
    this.openWindows
      .filter(w => w.id !== loc.id && !this.minimizedWindowIds.has(w.id))
      .forEach(w => this.minimizedWindowIds.add(w.id));
    this.minimizedWindowIds = new Set(this.minimizedWindowIds);
    this.minimizedWindowIds.delete(loc.id);
    // Bring this window to the front
    this.onWindowFocused(loc);
    this.showListPanel = false;
    this.showCalendarPanel = false;
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

  openLocationFromList(loc: TravelLocation): void {
    this.onLocationSelected(loc);
    this.mapComp?.flyTo(loc.longitude, loc.latitude);
  }

  /** Jump to location on map without opening the detail window */
  jumpToLocation(loc: TravelLocation): void {
    this.closeAllPanels();
    this.mapComp?.flyTo(loc.longitude, loc.latitude);
  }

  // ── Topbar panel toggles ───────────────────────────────────────────────────
  toggleListPanel(): void {
    this.showListPanel = !this.showListPanel;
    if (this.showListPanel) { this.showSettingsPanel = false; this.showCalendarPanel = false; this.showWindowPanel = false; }
  }

  toggleCalendarPanel(): void {
    this.showCalendarPanel = !this.showCalendarPanel;
    if (this.showCalendarPanel) { this.showListPanel = false; this.showSettingsPanel = false; this.showWindowPanel = false; }
    if (!this.showCalendarPanel) { this.calPickerMode = false; this.calDayLocations = []; this.calDayDate = ''; }
  }

  toggleSettingsPanel(): void {
    this.showSettingsPanel = !this.showSettingsPanel;
    if (this.showSettingsPanel) { this.showListPanel = false; this.showCalendarPanel = false; this.showWindowPanel = false; }
  }

  toggleWindowPanel(): void {
    this.showWindowPanel = !this.showWindowPanel;
    if (this.showWindowPanel) { this.showListPanel = false; this.showSettingsPanel = false; this.showCalendarPanel = false; }
  }

  closeAllPanels(): void {
    this.showListPanel = false;
    this.showSettingsPanel = false;
    this.showCalendarPanel = false;
    this.showAboutPanel = false;
    this.showWindowPanel = false;
    this.calDayLocations = [];
    this.calDayDate = '';
    this.calPickerMode = false;
  }

  // ── About window ───────────────────────────────────────────────────────────
  toggleAbout(): void {
    this.showAboutPanel = !this.showAboutPanel;
    if (this.showAboutPanel) {
      this.showListPanel = false;
      this.showSettingsPanel = false;
      this.showCalendarPanel = false;
    }
  }

  onAboutTitleBarMouseDown(e: MouseEvent): void {
    this.aboutWinDragging = true;
    this.aboutWinOffsetX = e.clientX - this.aboutWindowX;
    this.aboutWinOffsetY = e.clientY - this.aboutWindowY;
    e.preventDefault();
  }

  // ── Marker label toggle ────────────────────────────────────────────────────
  toggleMarkerLabels(): void {
    this.showMarkerLabels = !this.showMarkerLabels;
    this.mapComp?.setShowLabels(this.showMarkerLabels);
  }

  // ── Fullscreen toggle ──────────────────────────────────────────────────────
  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {/* ignore */});
    } else {
      document.exitFullscreen().catch(() => {/* ignore */});
    }
  }

  // ── Map terrain / atmosphere toggles ──────────────────────────────────────
  toggleTerrain(): void {
    this.showTerrain = !this.showTerrain;
    this.mapComp?.setTerrain(this.showTerrain);
  }

  toggleAtmosphere(): void {
    this.showAtmosphere = !this.showAtmosphere;
    this.mapComp?.setAtmosphere(this.showAtmosphere);
  }

  // ── Bring a window to front from the Window menu ──────────────────────────
  bringWindowToFront(loc: TravelLocation): void {
    this.restoreWindow(loc);
    this.onWindowFocused(loc);
    this.mapComp?.flyTo(loc.longitude, loc.latitude);
    this.showWindowPanel = false;
  }

  // ── Dock toggle ────────────────────────────────────────────────────────────
  toggleDock(): void {
    this.showMinimizedDock = !this.showMinimizedDock;
  }

  // ── Window drag handlers ───────────────────────────────────────────────────
  onListTitleBarMouseDown(e: MouseEvent): void {
    this.listWinDragging = true;
    this.listWinOffsetX = e.clientX - this.listWindowX;
    this.listWinOffsetY = e.clientY - this.listWindowY;
    e.preventDefault();
  }

  onSettingsTitleBarMouseDown(e: MouseEvent): void {
    this.settingsWinDragging = true;
    this.settingsWinOffsetX = e.clientX - this.settingsWindowX;
    this.settingsWinOffsetY = e.clientY - this.settingsWindowY;
    e.preventDefault();
  }

  onCalendarTitleBarMouseDown(e: MouseEvent): void {
    this.calWinDragging = true;
    this.calWinOffsetX = e.clientX - this.calendarWindowX;
    this.calWinOffsetY = e.clientY - this.calendarWindowY;
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
    if (this.calWinDragging) {
      this.calendarWindowX = e.clientX - this.calWinOffsetX;
      this.calendarWindowY = e.clientY - this.calWinOffsetY;
    }
    if (this.aboutWinDragging) {
      this.aboutWindowX = e.clientX - this.aboutWinOffsetX;
      this.aboutWindowY = e.clientY - this.aboutWinOffsetY;
    }
  }

  @HostListener('document:mouseup')
  onDocMouseUp(): void {
    this.listWinDragging = false;
    this.settingsWinDragging = false;
    this.calWinDragging = false;
    this.aboutWinDragging = false;
  }

  // ── i18n & theme ──────────────────────────────────────────────────────────
  toggleLang(): void {
    this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    // Stop following system preference after manual override
    if (this.colorSchemeQuery && this.colorSchemeListener) {
      this.colorSchemeQuery.removeEventListener('change', this.colorSchemeListener);
    }
  }

  // ── Mobile detection ───────────────────────────────────────────────────────
  get isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  @HostListener('window:resize')
  onWindowResize(): void { /* triggers change detection on resize */ }

  private applyTheme(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
    }
  }
}
