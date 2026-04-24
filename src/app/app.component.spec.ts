import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { MapComponent } from './components/map/map.component';
import { LocationPanelComponent } from './components/location-panel/location-panel.component';
import { AddLocationDialogComponent } from './components/add-location-dialog/add-location-dialog.component';
import { FormsModule } from '@angular/forms';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule],
      declarations: [
        AppComponent,
        MapComponent,
        LocationPanelComponent,
        AddLocationDialogComponent,
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should start with no selected location', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.selectedLocation).toBeNull();
  });

  it('should start with dialog hidden', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.showDialog).toBeFalse();
  });

  it('should open dialog when openAddDialog is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.openAddDialog();
    expect(app.showDialog).toBeTrue();
    expect(app.editingLocation).toBeNull();
  });

  it('should close panel when onPanelClosed is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.onPanelClosed();
    expect(app.selectedLocation).toBeNull();
  });
});
