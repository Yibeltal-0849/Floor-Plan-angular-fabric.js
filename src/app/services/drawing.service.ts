// services/drawing.service.ts
import { Injectable } from "@angular/core";
import { fabric } from "fabric";
// import { startDrawing, stopDrawing, cancelDrawing } from "../drawing-tool";

@Injectable({
  providedIn: "root",
})
export class DrawingService {
  startDrawing(
    canvas: fabric.Canvas,
    shape: string,
    template: any = {},
    initPoint?: { x: number; y: number }
  ) {
    // startDrawing(canvas, shape as any, template, initPoint);
  }

  stopDrawing() {
    // stopDrawing();
  }

  cancelDrawing() {
    // cancelDrawing();
  }

  enableFloorClickToDraw(canvas: fabric.Canvas, shape: string, opts: any = {}) {
    // You'll need to implement or import this function
    // import { enableFloorClickToDraw } from '../utils/floorClickToDraw';
    // enableFloorClickToDraw(canvas, shape, opts);
  }
}
