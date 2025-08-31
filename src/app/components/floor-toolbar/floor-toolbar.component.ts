// components/floor-toolbar/floor-toolbar.component.ts
import { Component, EventEmitter, Output } from "@angular/core";

@Component({
  selector: "app-floor-toolbar",
  template: `
    <div class="floor-toolbar">
      <button (click)="selectTool.emit('rect')">Rectangle</button>
      <button (click)="selectTool.emit('circle')">Circle</button>
      <button (click)="selectTool.emit('ellipse')">Ellipse</button>
      <button (click)="selectTool.emit('polygon')">Polygon</button>
      <button (click)="selectTool.emit('path')">Path</button>
      <button (click)="selectTool.emit('free')">Freehand</button>
    </div>
  `,
  styles: [
    `
      .floor-toolbar {
        display: flex;
        gap: 8px;
        padding: 10px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
      }
      button {
        padding: 8px 12px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        border-radius: 4px;
      }
      button:hover {
        background: #e9e9e9;
      }
    `,
  ],
})
export class FloorToolbarComponent {
  @Output() selectTool = new EventEmitter<string>();
}
