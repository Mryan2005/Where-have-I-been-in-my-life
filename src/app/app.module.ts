import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './components/map/map.component';
import { LocationPanelComponent } from './components/location-panel/location-panel.component';
import { AddLocationDialogComponent } from './components/add-location-dialog/add-location-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    LocationPanelComponent,
    AddLocationDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
