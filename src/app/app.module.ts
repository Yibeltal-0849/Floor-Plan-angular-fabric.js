// import { BrowserModule } from '@angular/platform-browser';
// import { NgModule } from '@angular/core';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// import { SharedModule } from './shared/shared.module';

// import { AppComponent } from './app.component';
// import { ViewComponent } from './components/view/view.component';
// import { PreviewFurnitureComponent } from './components/preview-furniture/preview-furniture.component';
// import { ChairsLayoutComponent } from './components/chairs-layout/chairs-layout.component';
// import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// @NgModule({
//   declarations: [
//     AppComponent,
//     ViewComponent,
//     PreviewFurnitureComponent,
//     ChairsLayoutComponent
//   ],
//   imports: [
//     BrowserModule,
//     BrowserAnimationsModule,
//     SharedModule,
//     FormsModule,
//     ReactiveFormsModule,
//     FontAwesomeModule
//   ],
//   providers: [],
//   bootstrap: [AppComponent],
//   entryComponents: [ChairsLayoutComponent]
// })
// export class AppModule { }

import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { SharedModule } from "./shared/shared.module";

import { AppComponent } from "./app.component";
import { ViewComponent } from "./components/view/view.component";
import { PreviewFurnitureComponent } from "./components/preview-furniture/preview-furniture.component";
import { ChairsLayoutComponent } from "./components/chairs-layout/chairs-layout.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

// New components for floor functionality
import { FloorToolbarComponent } from "./components/floor-toolbar/floor-toolbar.component";
import { FloorPropertiesPanelComponent } from "./components/floor-toolbar/floor-properties-panel.component";

// Services
import { FloorService } from "./services/floor.service";
import { DrawingService } from "./services/drawing.service";

@NgModule({
  declarations: [
    AppComponent,
    ViewComponent,
    PreviewFurnitureComponent,
    ChairsLayoutComponent,
    FloorToolbarComponent, // Add floor toolbar component
    FloorPropertiesPanelComponent, // Add floor properties panel component
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
  ],
  providers: [
    FloorService, // Add floor service
    DrawingService, // Add drawing service
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ChairsLayoutComponent,
    FloorToolbarComponent, // Add to entry components if needed
    FloorPropertiesPanelComponent, // Add to entry components if needed
  ],
})
export class AppModule {}
