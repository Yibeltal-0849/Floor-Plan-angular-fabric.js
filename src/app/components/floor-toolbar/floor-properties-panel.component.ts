// components/floor-properties-panel/floor-properties-panel.component.ts
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { fabric } from "fabric";

@Component({
  selector: "app-floor-properties-panel",
  template: `
    <div class="properties-panel" *ngIf="selectedFloor">
      <h3>Floor Properties</h3>
      <div class="property-group">
        <label>Fill Color:</label>
        <input
          type="color"
          [value]="getFloorFill()"
          (input)="updateFill($event.target.value)"
        />
      </div>
      <div class="property-group">
        <label>Stroke Color:</label>
        <input
          type="color"
          [value]="getFloorStroke()"
          (input)="updateStroke($event.target.value)"
        />
      </div>
      <div class="property-group">
        <label>Stroke Width:</label>
        <input
          type="number"
          [value]="getStrokeWidth()"
          (input)="updateStrokeWidth($event.target.value)"
        />
      </div>
      <button (click)="deleteFloor.emit(selectedFloor)">Delete Floor</button>
    </div>
  `,
  styles: [
    `
      .properties-panel {
        padding: 15px;
        background: #f9f9f9;
        border-left: 1px solid #ddd;
        min-width: 250px;
      }
      .property-group {
        margin-bottom: 15px;
      }
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      input {
        width: 100%;
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      button {
        padding: 8px 12px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    `,
  ],
})
export class FloorPropertiesPanelComponent {
  @Input() selectedFloor: fabric.Object | null = null;
  @Output() deleteFloor = new EventEmitter<fabric.Object>();

  getFloorFill(): string {
    return (this.selectedFloor?.fill as string) || "#cccccc";
  }

  getFloorStroke(): string {
    return (this.selectedFloor?.stroke as string) || "#000000";
  }

  getStrokeWidth(): number {
    return this.selectedFloor?.strokeWidth || 1;
  }

  updateFill(color: string) {
    if (this.selectedFloor) {
      this.selectedFloor.set("fill", color);
      this.selectedFloor.canvas?.requestRenderAll();
    }
  }

  updateStroke(color: string) {
    if (this.selectedFloor) {
      this.selectedFloor.set("stroke", color);
      this.selectedFloor.canvas?.requestRenderAll();
    }
  }

  updateStrokeWidth(width: string) {
    if (this.selectedFloor) {
      this.selectedFloor.set("strokeWidth", parseInt(width, 10));
      this.selectedFloor.canvas?.requestRenderAll();
    }
  }
}
