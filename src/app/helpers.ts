import { fabric } from "fabric";
import { Canvas } from "fabric/fabric-impl";
const {
  Group,
  Rect,
  Line,
  Circle,
  Ellipse,
  Path,
  Polygon,
  Polyline,
  Triangle,
} = fabric;

const RL_FILL = "#FFF",
  RL_STROKE = "#000",
  RL_PREVIEW_WIDTH = 140,
  RL_PREVIEW_HEIGHT = 120,
  RL_CHAIR_STROKE = "#999",
  RL_CHAIR_FILL = "#FFF",
  RL_CHAIR_TUCK = 6,
  RL_VIEW_WIDTH = 120,
  RL_VIEW_HEIGHT = 56,
  RL_FOOT = 12,
  RL_AISLEGAP = 12 * 3,
  RL_ROOM_OUTER_SPACING = 48,
  RL_ROOM_INNER_SPACING = 4,
  RL_ROOM_STROKE = "#000",
  RL_CORNER_FILL = "#88f",
  RL_UNGROUPABLES = ["CHAIR", "MISCELLANEOUS", "DOOR"],
  RL_CREDIT_TEXT = "Created By https://github.com/ilhccc",
  RL_CREDIT_TEXT_PARAMS = {
    fontSize: 12,
    fontFamily: "Arial",
    fill: "#999",
    left: 12,
  };

//  canvas!: fabric.Canvas;

const createText = (properties) => {
  let { text } = properties;
  if (properties.direction === "VERTICAL") {
    const chars = [];
    for (const char of text) {
      chars.push(char);
    }
    text = chars.join("\n");
  }

  return new fabric.IText(text, {
    fontSize: properties.font_size,
    lineHeight: 0.8,
    name: properties.name,
    hasControls: false,
  });
};

/** Create Basic Shape  */
const createBasicShape = (
  part: any,
  stroke: string = "#aaaaaa",
  fill: string = "white"
) => {
  // debugger;
  if (part.definition.fill == null) part.definition.fill = fill;

  if (part.definition.stroke == null) part.definition.stroke = stroke;
  else if (part.definition.stroke == "chair")
    part.definition.stroke = RL_CHAIR_STROKE;

  let fObj;

  switch (part.type) {
    case "circle":
      fObj = new Circle(part.definition);
      break;
    case "ellipse":
      fObj = new Ellipse(part.definition);
      break;
    case "line":
      fObj = new Line(part.line, part.definition);
      break;
    case "path":
      fObj = new Path(part.path, part.definition);
      break;
    case "polygon":
      fObj = new Polygon(part.definition);
      break;
    case "polyline":
      fObj = new Polyline(part.definition);
      break;
    case "rect":
      fObj = new Rect(part.definition);
      break;
    case "triangle":
      fObj = new Triangle(part.definition);
      break;
  }

  return fObj;
};

// --- helpers ---------------------------------------------------------------

/** Mark type guard */

const isFloorObject = (obj?: fabric.Object | null) =>
  !!obj && (obj as any).isFloor === true;

// Fixed scalePolygonPoints function
function scalePolygonPoints(poly: fabric.Polygon, factor: number) {
  if (!poly.points) return;

  const cx = poly.pathOffset.x;
  const cy = poly.pathOffset.y;

  poly.points = poly.points.map(
    (p) => new fabric.Point(cx + (p.x - cx) * factor, cy + (p.y - cy) * factor)
  );

  poly.dirty = true;
  poly.setCoords();
}
export function resizeFloor(
  floor: fabric.Object,
  opts: { factor?: number; step?: number; min?: number } = {},
  canvas?: fabric.Canvas
) {
  if (!isFloorObject(floor)) return;

  const type = (floor.type || "").toLowerCase();
  const { factor, step, min = 6 } = opts;

  const center =
    floor.getCenterPoint?.() ??
    new fabric.Point(floor.left ?? 0, floor.top ?? 0);

  const baseWidth = (floor as any).width ?? 0;
  const baseHeight = (floor as any).height ?? 0;
  const currentScaleX = floor.scaleX ?? 1;
  const currentScaleY = floor.scaleY ?? 1;

  function scaleFromStepPx(
    basePx: number,
    currentScale: number,
    stepPx: number
  ) {
    const desiredPx = Math.max(min, basePx * currentScale + stepPx);
    return desiredPx / Math.max(1, basePx);
  }

  // RECT / TRIANGLE
  if (type === "rect" || type === "triangle") {
    if (factor) {
      floor.scaleX = currentScaleX * factor;
      floor.scaleY = currentScaleY * factor;
    } else if (step) {
      const stepPx = step * 2;
      floor.scaleX = scaleFromStepPx(baseWidth, currentScaleX, stepPx);
      floor.scaleY = scaleFromStepPx(baseHeight, currentScaleY, stepPx);
    }
  }

  // POLYGON / POLYLINE
  else if (type === "polygon" || type === "polyline") {
    if (factor) scalePolygonPoints(floor as fabric.Polygon, factor);
    else if (step) scalePolygonPoints(floor as fabric.Polygon, 1 + step / 100);
  }

  // CIRCLE
  else if (type === "circle") {
    const c = floor as fabric.Circle;
    const baseR = c.radius ?? baseWidth / 2;
    if (factor) {
      floor.scaleX = currentScaleX * factor;
      floor.scaleY = currentScaleY * factor;
    } else if (step) {
      const desiredR = Math.max(min / 2, baseR * currentScaleX + step);
      const newScale = desiredR / Math.max(1, baseR);
      floor.scaleX = newScale;
      floor.scaleY = newScale;
    }
  }

  // ELLIPSE
  else if (type === "ellipse") {
    const e = floor as fabric.Ellipse;
    const baseRx = e.rx ?? baseWidth / 2;
    const baseRy = e.ry ?? baseHeight / 2;

    if (factor) {
      floor.scaleX = currentScaleX * factor;
      floor.scaleY = currentScaleY * factor;
    } else if (step) {
      if (baseRx > 0 && baseRy > 0) {
        floor.scaleX = scaleFromStepPx(baseRx * 2, currentScaleX, step * 2);
        floor.scaleY = scaleFromStepPx(baseRy * 2, currentScaleY, step * 2);
      } else {
        const f = 1 + step / 100;
        floor.scaleX = currentScaleX * f;
        floor.scaleY = currentScaleY * f;
      }
    }
  }

  // LINE
  else if (type === "line") {
    const ln = floor as fabric.Line;
    const x1 = ln.x1 ?? 0,
      y1 = ln.y1 ?? 0,
      x2 = ln.x2 ?? 0,
      y2 = ln.y2 ?? 0;

    const length = Math.hypot(x2 - x1, y2 - y1);
    const f = factor ?? (step ? 1 + step / Math.max(1, length) : 1);

    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    const p1 = { x: cx + (x1 - cx) * f, y: cy + (y1 - cy) * f };
    const p2 = { x: cx + (x2 - cx) * f, y: cy + (y2 - cy) * f };

    ln.set({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
  }

  // OTHER TYPES (path, group, etc.)
  else {
    if (factor) {
      floor.scaleX = currentScaleX * factor;
      floor.scaleY = currentScaleY * factor;
    } else if (step) {
      const f = 1 + step / 100;
      floor.scaleX = currentScaleX * f;
      floor.scaleY = currentScaleY * f;
    }
  }

  floor.setPositionByOrigin(center, "center", "center");
  floor.setCoords();

  if (canvas?.requestRenderAll) canvas.requestRenderAll();
  else canvas?.renderAll();
}

/** Optional: keyboard shortcuts to resize selected floor objects on a canvas */
/**
 * Enable hotkeys for resizing floor objects
 *   '[' = shrink, ']' = grow
 */
export function enableFloorResizeHotkeys(
  canvas: fabric.Canvas,
  stepPx = 8,
  factorSmall = 1.05
) {
  if ((canvas as any).__floorResizeHandler) return;

  const handleKey = (e: KeyboardEvent) => {
    const active = canvas.getActiveObject();
    if (!isFloorObject(active)) return;

    if (e.key === "+") {
      resizeFloor(active, { factor: factorSmall, step: stepPx }, canvas);
      e.preventDefault();
    } else if (e.key === "_") {
      resizeFloor(active, { factor: 1 / factorSmall, step: -stepPx }, canvas);
      e.preventDefault();
    }
  };

  document.addEventListener("keydown", handleKey);
  (canvas as any).__floorResizeHandler = handleKey;
}
/**
 * Enable interactions for floor objects (polygon editing, vertex insertion)
 */
function enableFloorInteractions(canvas: fabric.Canvas) {
  // Double-click polygon to add vertex
  canvas.on("mouse:dblclick", (opt) => {
    const target = opt.target;
    if (!isFloorObject(target)) return;
    if (target.type === "polygon") {
      enableVertexInsertion(canvas, target as fabric.Polygon);
    }
  });

  // Custom scaling for polygons
  canvas.on("object:scaling", (opt) => {
    const target = opt.target;
    if (!isFloorObject(target)) return;

    if (target.type === "polygon") {
      const poly = target as fabric.Polygon;
      const sx = target.scaleX ?? 1;
      scalePolygonPoints(poly, sx);
      target.scaleX = 1;
      target.scaleY = 1;
      target.setCoords();
      canvas.requestRenderAll();
    }
  });
}

//added

/**
 * Convert shape to polygon for editing.
 */
export function normalizeToPolygon(
  floor: fabric.Object
): fabric.Polygon | null {
  let poly: fabric.Polygon;
  // debugger;
  if (floor.type === "rect") {
    const w = (floor.width ?? 0) * (floor.scaleX ?? 1);
    const h = (floor.height ?? 0) * (floor.scaleY ?? 1);
    const points = [
      { x: -w / 2, y: -h / 2 },
      { x: w / 2, y: -h / 2 },
      { x: w / 2, y: h / 2 },
      { x: -w / 2, y: h / 2 },
    ];
    poly = new fabric.Polygon(points, {
      ...floor.toObject(),
      originX: "center",
      originY: "center",
    });
  } else if (floor.type === "circle" || floor.type === "ellipse") {
    const rx =
      floor.type === "circle" ? (floor.width ?? 0) / 2 : (floor as any).rx;
    const ry =
      floor.type === "circle" ? (floor.height ?? 0) / 2 : (floor as any).ry;
    const steps = 32;
    const points = [];
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      points.push({ x: rx * Math.cos(angle), y: ry * Math.sin(angle) });
    }
    poly = new fabric.Polygon(points, {
      ...floor.toObject(),
      originX: "center",
      originY: "center",
    });
  } else if (floor.type === "polygon" || floor.type === "polyline") {
    return floor as fabric.Polygon;
  } else {
    return null;
  }

  //to delete floor only selected floor
  (poly as any).isFloor = true;
  (poly as any).uuid = `floor-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  // this is used to import edited type that is type is not polygon
  poly.toObject = (function (toObject) {
    return function () {
      return fabric.util.object.extend(toObject.call(this), {
        type: "polygon", // 👈 Force correct type
        points: this.points,
        isFloor: true, // Optional: preserve your custom flag
      });
    };
  })(poly.toObject);

  return poly;
}
export function normalizeAndAddFloor(
  canvas: fabric.Canvas,
  floor: fabric.Object
) {
  const normalized = normalizeToPolygon(floor);
  if (!normalized) return;

  const name = normalized.name;
  const alreadyExists = canvas
    .getObjects()
    .some((obj) => (obj as any).isFloor && obj.name === name);

  if (!alreadyExists) {
    canvas.add(normalized);
    canvas.requestRenderAll();
  } else {
    console.warn("Skipped duplicate floor:", name);
  }
}

/**
 * Enable draggable vertex handles for polygon editing.
 */

/**
 * Insert a new vertex by double-clicking the polygon edge.
 */

// -------------------- UNDO + POLYGON EDITING (TypeScript) --------------------

/* History state */
const floorHistory: string[] = [];
let historyIndex = -1;

let interactionTimer: number | null = null;
let interactionTarget: fabric.Object | null = null;
let interactionChanged = false;
let lastSnapshot: string | null = null;

const HISTORY_INTERVAL_MS = 250; // lower = more steps, more memory
const HISTORY_MAX = 300;

/** save a JSON snapshot of the whole canvas (deduped) */
function snapshotCanvas(canvas: fabric.Canvas) {
  // debugger;
  const json = JSON.stringify(canvas.toJSON(["isFloor", "name", "points"]));
  // console.log(json);
  if (lastSnapshot === json) return false;
  lastSnapshot = json;

  // drop future (redo) states if we are mid-history
  floorHistory.splice(historyIndex + 1);
  floorHistory.push(json);
  historyIndex = floorHistory.length - 1;
  // console.log(historyIndex);

  // cap history size
  if (floorHistory.length > HISTORY_MAX) {
    floorHistory.shift();
    historyIndex--;
  }
  return true;
}

function startInteractionRecording(canvas: fabric.Canvas) {
  if (interactionTimer != null) return;
  // ensure there's an initial snapshot
  snapshotCanvas(canvas);

  interactionTimer = window.setInterval(() => {
    if (interactionChanged) {
      snapshotCanvas(canvas);
      interactionChanged = false;
    }
  }, HISTORY_INTERVAL_MS);
}

function stopInteractionRecording(canvas: fabric.Canvas) {
  if (interactionTimer != null) {
    clearInterval(interactionTimer);
    interactionTimer = null;
  }
  if (interactionChanged) snapshotCanvas(canvas);
  interactionChanged = false;
  interactionTarget = null;
}

/** called after loadFromJSON to restore editing handlers / controls */
function restoreAfterLoad(canvas: fabric.Canvas) {
  // re-enable global interactions for floors
  enableFloorResizeHotkeys(canvas);
  enableFloorInteractions(canvas);

  // ensure polygons have fabric.Point instances and re-enable per-polygon editing/insert
  canvas.getObjects().forEach((obj) => {
    if ((obj as any).isFloor) {
      if (obj.type === "polygon") {
        const poly = obj as fabric.Polygon;

        // convert point objects to fabric.Point instances (if needed)
        poly.points = (poly.points || []).map((p: any) =>
          p instanceof fabric.Point ? p : new fabric.Point(p.x ?? 0, p.y ?? 0)
        );

        // rebuild controls & vertex insertion for this polygon
        enablePolygonEditing(canvas, poly);
        enableVertexInsertion(canvas, poly);
      }
    }
  });

  canvas.requestRenderAll();
}

/** call once when canvas created */
function enableUndoHotkey(canvas: fabric.Canvas) {
  // prevent double-enabling
  if ((canvas as any).__undoEnabled) return;
  (canvas as any).__undoEnabled = true;

  // initial snapshot
  snapshotCanvas(canvas);

  // typical events that create new states
  canvas.on("object:modified", () => snapshotCanvas(canvas));
  canvas.on("object:added", () => snapshotCanvas(canvas));
  canvas.on("object:removed", () => snapshotCanvas(canvas));

  // start fine-grained recording when the user begins interacting with a floor object
  canvas.on("mouse:down", (opt) => {
    const t = (opt as any).target;
    if (!isFloorObject(t)) return;
    interactionTarget = t;
    interactionChanged = false;
    startInteractionRecording(canvas);
  });

  // stop recording on mouse up
  canvas.on("mouse:up", () => {
    if (interactionTarget) stopInteractionRecording(canvas);
  });

  // ctrl+z / redo handlers
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      undoFloor(canvas);
    } else if (
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") ||
      (e.ctrlKey && e.key.toLowerCase() === "y")
    ) {
      e.preventDefault();
      redoFloor(canvas);
    }
  });
}

export function undoFloor(canvas: fabric.Canvas) {
  debugger;
  if (historyIndex <= 0) return;
  historyIndex--;
  const json = floorHistory[historyIndex];
  canvas.loadFromJSON(json, () => {
    restoreAfterLoad(canvas);
  });
}

export function redoFloor(canvas: fabric.Canvas) {
  if (historyIndex >= floorHistory.length - 1) return;
  historyIndex++;
  const json = floorHistory[historyIndex];
  canvas.loadFromJSON(json, () => {
    restoreAfterLoad(canvas);
  });
}

// -------------------- Polygon vertex editing + insertion --------------------

/**
 * Enable draggable vertex handles for polygon editing.
 * This version marks `interactionChanged = true` while dragging so the recorder captures intermediate snapshots.
 */
export function enablePolygonEditing(
  canvas: fabric.Canvas,
  poly: fabric.Polygon
) {
  // Rebuild fresh controls
  poly.controls = {};

  const controls: Record<string, fabric.Control> = {};

  poly.points?.forEach((_, index) => {
    controls[`p${index}`] = new fabric.Control({
      positionHandler: (dim, matrix, target) => {
        const p = (target as fabric.Polygon).points![index];
        return fabric.util.transformPoint(
          new fabric.Point(
            p.x - (target as any).pathOffset.x,
            p.y - (target as any).pathOffset.y
          ),
          fabric.util.multiplyTransformMatrices(
            canvas.viewportTransform ?? fabric.iMatrix,
            target.calcTransformMatrix()
          )
        );
      },

      actionHandler: (eventData, transform, x, y) => {
        const polygon = transform.target as fabric.Polygon;

        const local = polygon.toLocalPoint(
          new fabric.Point(x, y),
          "center",
          "center"
        );

        // keep type-safety: use fabric.Point
        polygon.points![index] = new fabric.Point(
          local.x + polygon.pathOffset.x,
          local.y + polygon.pathOffset.y
        );

        polygon.dirty = true;
        polygon.setCoords();

        // mark that interaction changed so interval snapshot will record intermediate states
        interactionChanged = true;

        canvas.requestRenderAll();
        return true;
      },

      render: (ctx, left, top) => {
        ctx.save();
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(left, top, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },
    });
  });

  poly.controls = controls;
  poly.hasBorders = false;
  canvas.setActiveObject(poly);
  canvas.requestRenderAll();
}

/**
 * Insert a new vertex by double-clicking the polygon edge.
 * Idempotent: calling multiple times won't add duplicate handlers.
 */
export function enableVertexInsertion(
  canvas: fabric.Canvas,
  poly: fabric.Polygon
) {
  // guard to avoid adding multiple identical handlers
  if ((poly as any).__vertexInsertionEnabled) return;
  (poly as any).__vertexInsertionEnabled = true;

  const handler = (opt: fabric.IEvent) => {
    if ((opt as any).target !== poly) return;

    const pointer = canvas.getPointer(opt.e);
    const fabricPoint = new fabric.Point(pointer.x, pointer.y);
    const local = poly.toLocalPoint(fabricPoint, "center", "center");

    let minDist = Infinity;
    let insertIndex = 0;
    poly.points!.forEach((p1, i) => {
      const p2 = poly.points![(i + 1) % poly.points!.length];
      const dist = pointLineDistance(local, p1, p2);
      if (dist < minDist) {
        minDist = dist;
        insertIndex = i + 1;
      }
    });

    // insert new vertex as fabric.Point
    poly.points!.splice(
      insertIndex,
      0,
      new fabric.Point(local.x + poly.pathOffset.x, local.y + poly.pathOffset.y)
    );

    poly.dirty = true;
    poly.setCoords();

    // refresh controls and ensure a snapshot is saved immediately
    enablePolygonEditing(canvas, poly);
    snapshotCanvas(canvas);

    canvas.requestRenderAll();
  };

  canvas.on("mouse:dblclick", handler);

  // keep reference so we could remove the handler later if desired
  (poly as any).__vertexInsertHandler = handler;
}
//to delete floor
export function enableFloorDeletionHotkey(canvas: fabric.Canvas) {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Delete") {
      const active = canvas.getActiveObject();
      console.log("Deleting object:", active?.type, active?.name);
      console.log(
        "Canvas objects:",
        canvas.getObjects().map((obj) => obj.name || obj.type)
      );

      console.log(
        "All floor objects:",
        canvas
          .getObjects()
          .filter((obj) => (obj as any).isFloor)
          .map((obj) => obj.name)
      );

      //  const active = canvas.getActiveObject();

      if (active && (active as any).isFloor) {
        const targetUUID = (active as any).uuid;

        canvas.getObjects().forEach((obj) => {
          if ((obj as any).isFloor && (obj as any).uuid === targetUUID) {
            if ((obj as any).__vertexInsertHandler) {
              canvas.off("mouse:dblclick", (obj as any).__vertexInsertHandler);
              delete (obj as any).__vertexInsertHandler;
            }

            obj.controls = {};
            canvas.remove(obj);
          }
        });

        canvas.discardActiveObject();
        canvas.requestRenderAll();
        snapshotCanvas(canvas);

        console.log("✅ Deleted floor with UUID:", targetUUID);
      }
    }
  };

  if (!(canvas as any).__floorDeleteHandlerAttached) {
    document.addEventListener("keydown", handler);
    (canvas as any).__floorDeleteHandler = handler;
    (canvas as any).__floorDeleteHandlerAttached = true;
  }
}

export function disableFloorDeletionHotkey(canvas: fabric.Canvas) {
  const handler = (canvas as any).__floorDeleteHandler;
  if (handler) {
    document.removeEventListener("keydown", handler);
    delete (canvas as any).__floorDeleteHandler;
    delete (canvas as any).__floorDeleteHandlerAttached;
  }
}

// distance from point pt to line p1-p2

function pointLineDistance(pt: fabric.Point, p1: any, p2: any) {
  const A = pt.x - p1.x;
  const B = pt.y - p1.y;
  const C = p2.x - p1.x;
  const D = p2.y - p1.y;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  const param = lenSq !== 0 ? dot / lenSq : -1;
  let xx, yy;
  if (param < 0) {
    xx = p1.x;
    yy = p1.y;
  } else if (param > 1) {
    xx = p2.x;
    yy = p2.y;
  } else {
    xx = p1.x + param * C;
    yy = p1.y + param * D;
  }
  return Math.hypot(pt.x - xx, pt.y - yy);
}

const createFurniture = (
  type: string,
  object: any,
  chair: any = {},
  canvas?: fabric.Canvas // optional
) => {
  if (type === "TABLE") {
    return createTable(object, chair);
  } else if (type === "TEXT") {
    return createText(object);
  } else if (type.startsWith("FLOOR")) {
    let floor: fabric.Object | undefined;
    console.log(type, " ", object, " ", canvas, "Floor");

    // debugger;
    switch ((object.shape || "rect").toLowerCase()) {
      case "rect":
        floor = new fabric.Rect({
          width: object.width,
          height: object.height,
          fill: object.fill || "rgba(200,200,200,0.3)",
          stroke: object.stroke || "black",
          strokeWidth: object.strokeWidth || 1,
          originX: "center",
          originY: "center",
          angle: object.angle || 0,
        });
        break;

      case "circle":
        floor = new fabric.Circle({
          radius: object.width / 2,
          fill: object.fill || "rgba(200,200,200,0.3)",
          stroke: object.stroke || "black",
          strokeWidth: object.strokeWidth || 1,
          originX: "center",
          originY: "center",
          angle: object.angle || 0,
        });
        break;

      case "ellipse":
        floor = new fabric.Ellipse({
          rx: object.width / 2,
          ry: object.height / 2,
          fill: object.fill || "rgba(200,200,200,0.3)",
          stroke: object.stroke || "black",
          strokeWidth: object.strokeWidth || 1,
          originX: "center",
          originY: "center",
          angle: object.angle || 0,
        });
        break;

      case "polygon":
        if (object.points) {
          floor = new fabric.Polygon(object.points, {
            fill: object.fill || "rgba(200,200,200,0.3)",
            stroke: object.stroke || "black",
            strokeWidth: object.strokeWidth || 1,
            originX: "center",
            originY: "center",
            angle: object.angle || 0,
          });
        }
        break;

      case "line":
        if (object.points) {
          // points: [x1, y1, x2, y2]
          floor = new fabric.Line(object.points, {
            stroke: object.stroke || "black",
            strokeWidth: object.strokeWidth || 1,
            selectable: true,
            evented: true,
            angle: object.angle || 0,
          });
        }
        break;

      case "path":
        if (object.path) {
          floor = new fabric.Path(object.path, {
            fill: object.fill || "rgba(200,200,200,0.3)",
            stroke: object.stroke || "black",
            strokeWidth: object.strokeWidth || 1,
            angle: object.angle || 0,
            selectable: true,
            evented: true,
          });
        }
        break;

      case "polyline":
        if (object.points) {
          floor = new fabric.Polyline(object.points, {
            fill: object.fill || "rgba(200,200,200,0.3)",
            stroke: object.stroke || "black",
            strokeWidth: object.strokeWidth || 1,
            angle: object.angle || 0,
            selectable: true,
            evented: true,
          });
        }
        break;

      case "triangle":
        floor = new fabric.Triangle({
          width: object.width,
          height: object.height,
          fill: object.fill || "rgba(200,200,200,0.3)",
          stroke: object.stroke || "black",
          strokeWidth: object.strokeWidth || 1,
          angle: object.angle || 0,
          originX: "center",
          originY: "center",
        });
        break;
    }

    if (floor) {
      // Assign UUID early to original shape
      const uuid = `floor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      (floor as any).uuid = uuid;
      (floor as any).isFloor = true;

      const poly = normalizeToPolygon(floor);

      if (poly) {
        (poly as any).uuid = uuid; // Share same UUID
        (poly as any).isFloor = true;
        canvas.remove(floor); // Remove original
      }

      const finalObject = poly ?? floor;

      finalObject.set({
        name: object.name || `${type}:${object.title}`,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockScalingFlip: true,
        lockUniScaling: false,
      });

      if (canvas) {
        canvas.add(finalObject);
        canvas.setActiveObject(finalObject);
        canvas.sendToBack(finalObject);

        enableFloorResizeHotkeys(canvas);
        enableFloorInteractions(canvas);
        enableUndoHotkey(canvas);
        enableFloorDeletionHotkey(canvas);

        if (poly) {
          enablePolygonEditing(canvas, poly);
          enableVertexInsertion(canvas, poly);
        }
      }

      return finalObject;
    }

    return floor;
  } else if (type === "LAYOUT") {
    return object;
  } else {
    // default = chairs, rooms, etc.
    return createShape(object, RL_STROKE, RL_FILL, type);
  }
};

/** Adding Chairs */
const createShape = (
  object: any,
  stroke = RL_CHAIR_STROKE,
  fill = RL_CHAIR_FILL,
  type: string = "CHAIR"
): fabric.Group => {
  const parts = object.parts.map((obj) => createBasicShape(obj, stroke, fill));
  const group = new Group(parts, {
    name: `${type}:${object.title}`,
    hasControls: false,
    originX: "center",
    originY: "center",
  });

  return group;
};

// All Create[Name]Object() functions should return a group

const createTable = (
  def: any,
  RL_DEFAULT_CHAIR: any,
  type: string = "TABLE"
) => {
  // tables with chairs have the chairs full-height around the table

  const components = [];
  let index = 0;

  // Note that we're using the provided width and height for table placement
  // Issues may arise if rendered shape is larger/smaller, since it's positioned from center point
  const chairWidth = RL_DEFAULT_CHAIR.width;
  const chairHeight = RL_DEFAULT_CHAIR.height;
  const tableLeft = def.leftChairs > 0 ? chairHeight - RL_CHAIR_TUCK : 0;
  const tableTop = chairHeight - RL_CHAIR_TUCK;

  if (def.shape == "circle") {
    const origin_x = def.width / 2 + chairHeight - RL_CHAIR_TUCK;
    const origin_y = def.width / 2 + chairHeight - RL_CHAIR_TUCK;
    const x2 = origin_x;
    const y2 = 0 + chairHeight / 2;

    const rotation_origin = new fabric.Point(origin_x, origin_y);

    const tableRadius = def.width / 2;
    const radius = def.width / 2 + chairHeight; // outer radius of whole shape unit
    let angle = 0;
    const angleIncrement = 360 / (def.chairs > 0 ? def.chairs : 1);

    for (let x = 0; x < def.chairs; ++x) {
      // Note that width and height are the same for circle tables
      // width of whole area when done
      const width = def.width + chairHeight - RL_CHAIR_TUCK * 2;

      components[index] = createShape(
        RL_DEFAULT_CHAIR,
        RL_CHAIR_STROKE,
        RL_CHAIR_FILL
      );

      const angle_radians = fabric.util.degreesToRadians(angle);
      const end = fabric.util.rotatePoint(
        new fabric.Point(x2, y2),
        rotation_origin,
        angle_radians
      );
      components[index].left = end.x;
      components[index].top = end.y;
      components[index].angle = angle + 180 > 360 ? angle - 180 : angle + 180;
      index++;
      angle += angleIncrement;
    }

    const tableCircle = {
      left: origin_x,
      top: origin_y,
      radius: tableRadius,
      fill: RL_FILL,
      stroke: RL_STROKE,
      originX: "center",
      originY: "center",
      name: "DESK",
    };
    components[index] = new fabric.Circle(tableCircle);
  } else if (def.shape == "rect") {
    const tableRect = {
      width: def.width,
      height: def.height,
      fill: RL_FILL,
      stroke: RL_STROKE,
      name: "DESK",
    };

    // calculate gap between chairs, with extra for gap to end of table
    let gap = 0,
      firstOffset = 0,
      leftOffset = 0,
      topOffset = 0;

    // top chair row
    // Note that chairs 'look up' by default, so the bottom row isn't rotated
    // and the top row is.
    gap = (def.width - def.topChairs * chairWidth) / (def.topChairs + 1);
    firstOffset = gap + tableLeft;
    leftOffset = firstOffset;
    topOffset = 0;

    for (let x = 0; x < def.topChairs; x++) {
      components[index] = createShape(
        RL_DEFAULT_CHAIR,
        RL_CHAIR_STROKE,
        RL_CHAIR_FILL
      );
      components[index].angle = -180;
      components[index].left = leftOffset + chairWidth / 2;
      components[index].top = topOffset + chairHeight / 2;
      index++;

      leftOffset += chairWidth + gap;
    }

    // bottom chair row
    gap = (def.width - def.bottomChairs * chairWidth) / (def.bottomChairs + 1);
    firstOffset = gap + tableLeft;
    leftOffset = firstOffset;
    topOffset = tableRect.height + chairHeight - RL_CHAIR_TUCK * 2;

    for (let x = 0; x < def.bottomChairs; x++) {
      components[index] = createShape(
        RL_DEFAULT_CHAIR,
        RL_CHAIR_STROKE,
        RL_CHAIR_FILL
      );
      components[index].left = leftOffset + chairWidth / 2;
      components[index].top = topOffset + chairWidth / 2;
      ++index;

      leftOffset += chairWidth + gap;
    }

    // left chair row
    gap = (def.height - def.leftChairs * chairWidth) / (def.leftChairs + 1);
    leftOffset = chairWidth / 2;
    topOffset = tableTop + gap + chairWidth / 2; // top of table plus first gap, then to center

    for (let x = 0; x < def.leftChairs; x++) {
      components[index] = createShape(
        RL_DEFAULT_CHAIR,
        RL_CHAIR_STROKE,
        RL_CHAIR_FILL
      );
      components[index].angle = 90;
      components[index].left = leftOffset;
      components[index].top = topOffset;
      ++index;

      topOffset += chairWidth + gap;
    }

    // right chair row
    gap = (def.height - def.rightChairs * chairWidth) / (def.rightChairs + 1);
    leftOffset = tableRect.width + chairWidth / 2;
    topOffset = tableTop + gap + chairWidth / 2; // top of table plus first gap, then to center

    for (let x = 0; x < def.rightChairs; x++) {
      components[index] = createShape(
        RL_DEFAULT_CHAIR,
        RL_CHAIR_STROKE,
        RL_CHAIR_FILL
      );
      components[index].angle = -90;
      components[index].left = leftOffset + chairHeight - RL_CHAIR_TUCK * 2;
      components[index].top = topOffset;
      ++index;

      topOffset += chairWidth + gap;
    }

    // add table on top of chairs
    components[index] = new fabric.Rect(tableRect);
    components[index].left = tableLeft;
    components[index].top = tableTop;
  }

  const tableGroup = new fabric.Group(components, {
    left: 0,
    top: 0,
    hasControls: false,
    // set origin for all groups to center
    originX: "center",
    originY: "center",
    name: `${type}:${def.title}`,
  });

  return tableGroup;
};

export {
  createBasicShape,
  createTable,
  createShape,
  createText,
  createFurniture,
  RL_FILL,
  RL_STROKE,
  RL_CHAIR_STROKE,
  RL_CHAIR_FILL,
  RL_CHAIR_TUCK,
  RL_PREVIEW_HEIGHT,
  RL_PREVIEW_WIDTH,
  RL_VIEW_WIDTH,
  RL_VIEW_HEIGHT,
  RL_FOOT,
  RL_AISLEGAP,
  RL_ROOM_OUTER_SPACING,
  RL_ROOM_INNER_SPACING,
  RL_ROOM_STROKE,
  RL_CORNER_FILL,
  RL_UNGROUPABLES,
  RL_CREDIT_TEXT,
  RL_CREDIT_TEXT_PARAMS,
};
