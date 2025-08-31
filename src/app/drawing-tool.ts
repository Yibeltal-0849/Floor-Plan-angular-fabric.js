// drawing-tool.ts
import { fabric } from "fabric";

// ========== Floor Helpers ==========

// Convert any shape (rect, circle, ellipse, triangle, line) into editable polygon
const convertFloorToPolygon = (floor: fabric.Object, canvas: fabric.Canvas) => {
  const {
    left = 0,
    top = 0,
    width = 0,
    height = 0,
    scaleX = 1,
    scaleY = 1,
  } = floor;

  let points: fabric.Point[] = [];

  if (floor.type === "rect" || floor.type === "triangle") {
    points = [
      new fabric.Point(left, top),
      new fabric.Point(left + width * scaleX, top),
      new fabric.Point(left + width * scaleX, top + height * scaleY),
      new fabric.Point(left, top + height * scaleY),
    ];
  } else if (floor.type === "circle" || floor.type === "ellipse") {
    const steps = 16; // approximate circle with polygon
    const cx = left + (width * scaleX) / 2;
    const cy = top + (height * scaleY) / 2;
    const rx = (width * scaleX) / 2;
    const ry = (height * scaleY) / 2;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      points.push(
        new fabric.Point(cx + rx * Math.cos(angle), cy + ry * Math.sin(angle))
      );
    }
  } else if (floor.type === "line") {
    const line = floor as fabric.Line;
    points = [
      new fabric.Point(line.x1 ?? 0, line.y1 ?? 0),
      new fabric.Point(line.x2 ?? 0, line.y2 ?? 0),
    ];
  } else {
    return floor; // already polygon/polyline
  }

  const newFloor = new fabric.Polygon(points, {
    fill: floor.fill ?? "rgba(200,200,200,0.3)",
    stroke: floor.stroke ?? "black",
    strokeWidth: floor.strokeWidth ?? 1,
    selectable: true,
    evented: true,
  }) as any;

  newFloor.isFloor = true;

  canvas.remove(floor);
  canvas.add(newFloor);
  canvas.sendToBack(newFloor);

  return newFloor;
};

// Insert a new vertex into polygon/polyline nearest edge
const insertPointIntoFloor = (
  floor: fabric.Polygon | fabric.Polyline,
  pointer: fabric.Point,
  canvas: fabric.Canvas
) => {
  const points = floor.get("points") ?? [];
  let insertAt = -1;
  let minDist = Infinity;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const dist = pointToSegmentDist(pointer, p1, p2);
    if (dist < minDist) {
      minDist = dist;
      insertAt = i + 1;
    }
  }

  if (insertAt >= 0) {
    points.splice(insertAt, 0, new fabric.Point(pointer.x, pointer.y));
    floor.set({ points });
    canvas.renderAll();
  }
};

// Distance from point to segment
const pointToSegmentDist = (
  p: fabric.Point,
  v: fabric.Point,
  w: fabric.Point
): number => {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(
    p.x - (v.x + t * (w.x - v.x)),
    p.y - (v.y + t * (w.y - v.y))
  );
};

// ========== Enable Editing of Existing Floors ==========
export const enableFloorEditing = (canvas: fabric.Canvas) => {
  canvas.on("mouse:down", (opt) => {
    const evt = opt.e as MouseEvent;
    let target = opt.target as any;

    if (target && target.isFloor) {
      const pointer = canvas.getPointer(evt);
      const fp = new fabric.Point(pointer.x, pointer.y);

      // convert to polygon first if needed
      if (
        ["rect", "circle", "ellipse", "triangle", "line"].includes(target.type)
      ) {
        target = convertFloorToPolygon(target, canvas);
      }

      if (target.type === "polygon" || target.type === "polyline") {
        insertPointIntoFloor(target, fp, canvas);
      }
    }
  });

  canvas.on("selection:created", (opt: any) => {
    const target = opt.selected?.[0];
    if (target?.isFloor && target.type === "polygon") {
      addVertexHandles(target, canvas);
    }
  });

  canvas.on("selection:updated", (opt: any) => {
    const target = opt.selected?.[0];
    if (target?.isFloor && target.type === "polygon") {
      addVertexHandles(target, canvas);
    }
  });

  // Remove handles when deselecting
  canvas.on("selection:cleared", () => {
    removeVertexHandles(canvas);
  });
};

// ========== Enable Drawing New Floors ==========
export const enableFloorDrawing = (canvas: fabric.Canvas) => {
  let drawing = false;
  let points: fabric.Point[] = [];
  let tempPolyline: fabric.Polyline | null = null;

  canvas.on("mouse:down", (opt) => {
    const pointer = canvas.getPointer(opt.e);
    const fp = new fabric.Point(pointer.x, pointer.y);

    if (!drawing) {
      drawing = true;
      points = [fp];
      tempPolyline = new fabric.Polyline(points, {
        fill: "rgba(200,200,200,0.3)",
        stroke: "black",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(tempPolyline);
    } else {
      points.push(fp);
      tempPolyline?.set({ points });
      canvas.renderAll();
    }
  });

  // Double click ends drawing
  canvas.on("mouse:dblclick", () => {
    if (drawing && points.length > 2) {
      const floor = new fabric.Polygon(points, {
        fill: "rgba(200,200,200,0.3)",
        stroke: "black",
        strokeWidth: 1,
        selectable: true,
        evented: true,
      }) as any;

      floor.isFloor = true;

      canvas.remove(tempPolyline!);
      canvas.add(floor);
      canvas.sendToBack(floor);
      canvas.renderAll();
    }

    drawing = false;
    points = [];
    tempPolyline = null;
  });
};

// ========== Vertex Editing Helpers ==========
const addVertexHandles = (floor: fabric.Polygon, canvas: fabric.Canvas) => {
  // Remove old handles if any
  removeVertexHandles(canvas);

  const points = floor.get("points") ?? [];

  points.forEach((pt, i) => {
    const handle = new fabric.Circle({
      left: pt.x,
      top: pt.y,
      radius: 5,
      fill: "red",
      stroke: "black",
      strokeWidth: 1,
      hasBorders: false,
      hasControls: false,
      originX: "center",
      originY: "center",
      selectable: true,
      evented: true,
    }) as any;

    handle.isVertexHandle = true;
    handle.vertexIndex = i;
    handle.parentFloor = floor;

    // When dragging handle → update polygon
    handle.on("moving", () => {
      const floorPoints = floor.get("points") ?? [];
      floorPoints[i].x = handle.left ?? 0;
      floorPoints[i].y = handle.top ?? 0;
      floor.set({ points: floorPoints });
      canvas.renderAll();
    });

    canvas.add(handle);
  });

  canvas.renderAll();
};

const removeVertexHandles = (canvas: fabric.Canvas) => {
  const toRemove: fabric.Object[] = [];
  canvas.forEachObject((obj) => {
    if ((obj as any).isVertexHandle) toRemove.push(obj);
  });
  toRemove.forEach((h) => canvas.remove(h));
  canvas.renderAll();
};
