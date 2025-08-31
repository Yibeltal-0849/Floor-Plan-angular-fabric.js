// --- enableFloorClickToDraw ---
// put this in helpers.ts or floorClickToDraw.ts and import startDrawing from your drawing-tool
import { fabric } from "fabric";
// import { startDrawing } from "./drawing-tool"; // adjust path if needed?
// import { RL_FILL, RL_STROKE } from "./helpers"; // or './helpers' depending on file layout

export function enableFloorClickToDraw(
  canvas: fabric.Canvas,
  shape:
    | "rect"
    | "circle"
    | "ellipse"
    | "polygon"
    | "path"
    | "polyline"
    | "line"
    | "free" = "rect",
  opts: { debug?: boolean } = {}
) {
  const { debug = false } = opts;
  const upperCanvasEl = (canvas as any).upperCanvasEl as
    | HTMLCanvasElement
    | undefined;
  if (!upperCanvasEl) {
    console.warn("enableFloorClickToDraw: canvas.upperCanvasEl not found");
    return () => {};
  }

  // helpers
  const pd2 = (ax: number, ay: number, bx: number, by: number) =>
    (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
  const pointToSegmentDist = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const l2 = pd2(x1, y1, x2, y2);
    if (l2 === 0) return Math.sqrt(pd2(px, py, x1, y1));
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projx = x1 + t * (x2 - x1);
    const projy = y1 + t * (y2 - y1);
    return Math.sqrt(pd2(px, py, projx, projy));
  };

  // transform an object-local point into canvas coords using the object's transform matrix
  const localToCanvas = (obj: any, pt: fabric.Point) => {
    try {
      const m = obj.calcTransformMatrix();
      return fabric.util.transformPoint(pt, m);
    } catch {
      // fallback (no rotation/scale)
      return new fabric.Point((obj.left ?? 0) + pt.x, (obj.top ?? 0) + pt.y);
    }
  };

  // robust hit test for a floor object
  const hitTestObject = (o: fabric.Object, p: { x: number; y: number }) => {
    if (!o || !(o as any).isFloor) return false;

    // try built-in containsPoint (works for filled shapes)
    try {
      if (typeof (o as any).containsPoint === "function") {
        const contains = (o as any).containsPoint(new fabric.Point(p.x, p.y));
        if (contains) return true;
      }
    } catch {}

    // line: check distance to segment
    if (o.type === "line") {
      const ln = o as unknown as fabric.Line;
      const a = localToCanvas(ln, new fabric.Point(ln.x1 ?? 0, ln.y1 ?? 0));
      const b = localToCanvas(ln, new fabric.Point(ln.x2 ?? 0, ln.y2 ?? 0));
      const tol = (ln.strokeWidth ?? 1) / 2 + 6; // tolerance in px
      const d = pointToSegmentDist(p.x, p.y, a.x, a.y, b.x, b.y);
      return d <= tol;
    }

    // polygon / polyline: transform points and test segments + optionally fill containment for polygon
    const pts = (o as any).points;
    if (Array.isArray(pts) && pts.length) {
      try {
        const transformed = pts.map((pt: any) =>
          localToCanvas(o, new fabric.Point(pt.x ?? pt[0], pt.y ?? pt[1]))
        );
        const strokeWidth = (o as any).strokeWidth ?? 1;
        const tol = strokeWidth / 2 + 6;
        for (let i = 0; i < transformed.length - 1; i++) {
          const a = transformed[i],
            b = transformed[i + 1];
          if (pointToSegmentDist(p.x, p.y, a.x, a.y, b.x, b.y) <= tol)
            return true;
        }
        // closed polygon: last -> first
        if (o.type === "polygon" && transformed.length >= 3) {
          if (
            pointToSegmentDist(
              p.x,
              p.y,
              transformed[transformed.length - 1].x,
              transformed[transformed.length - 1].y,
              transformed[0].x,
              transformed[0].y
            ) <= tol
          )
            return true;
          // point-in-polygon (raycast)
          let inside = false;
          for (
            let i = 0, j = transformed.length - 1;
            i < transformed.length;
            j = i++
          ) {
            const xi = transformed[i].x,
              yi = transformed[i].y;
            const xj = transformed[j].x,
              yj = transformed[j].y;
            const intersect =
              yi > p.y !== yj > p.y &&
              p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-9) + xi;
            if (intersect) inside = !inside;
          }
          if (inside) return true;
        }
      } catch {}
    }

    // path: try bounding box or containsPoint fallback
    if (o.type === "path") {
      try {
        if ((o as any).containsPoint) {
          if ((o as any).containsPoint(new fabric.Point(p.x, p.y))) return true;
        }
      } catch {}
    }

    // fallback: bounding rect (coarse)
    try {
      const br = (o as any).getBoundingRect?.(true) ?? o.getBoundingRect();
      if (
        br &&
        p.x >= br.left &&
        p.x <= br.left + br.width &&
        p.y >= br.top &&
        p.y <= br.top + br.height
      ) {
        return true;
      }
    } catch {}

    return false;
  };

  const domHandler = (evt: PointerEvent) => {
    try {
      const pointer = canvas.getPointer(evt as any, true);
      const p = { x: pointer.x, y: pointer.y };

      // prefer Fabric's findTarget
      let target = canvas.findTarget(evt as any, true) as fabric.Object | null;
      if (debug)
        console.log("findTarget ->", target ? (target as any).name : null);

      // fallback: scan top-first objects to find a floor hit (includes strokes/edges)
      if (!target || !(target as any).isFloor) {
        const objs = canvas.getObjects().slice().reverse();
        for (const o of objs) {
          try {
            if (hitTestObject(o, p)) {
              target = o;
              if (debug) console.log("fallback hit ->", (o as any).name);
              break;
            }
          } catch (err) {
            // ignore
          }
        }
      }

      if (!target || !(target as any).isFloor) {
        if (debug) console.log("click not on floor");
        return;
      }

      // start drawing on this floor
      evt.preventDefault();
      evt.stopPropagation();
      canvas.discardActiveObject?.();
      canvas.requestRenderAll?.();

      // temporarily mute the clicked floor so it won't be selected/moved while drawing
      const orig = {
        selectable: (target as any).selectable,
        evented: (target as any).evented,
        lockMovementX: (target as any).lockMovementX,
        lockMovementY: (target as any).lockMovementY,
      };
      (target as any).selectable = false;
      (target as any).evented = false;
      (target as any).lockMovementX = true;
      (target as any).lockMovementY = true;

      const template = {
        // fill: (target as any).fill ?? RL_FILL,
        // stroke: (target as any).stroke ?? RL_STROKE,
        strokeWidth: (target as any).strokeWidth ?? 1,
        opacity: (target as any).opacity ?? 1,
      };

      // call your drawing starter with the initial click point (initPoint supported by your startDrawing)
      // startDrawing(canvas, shape as any, template, { x: p.x, y: p.y });

      // restore object flags on pointerup
      const restore = () => {
        try {
          (target as any).selectable = orig.selectable;
          (target as any).evented = orig.evented;
          (target as any).lockMovementX = orig.lockMovementX;
          (target as any).lockMovementY = orig.lockMovementY;
          canvas.requestRenderAll?.();
        } finally {
          window.removeEventListener("pointerup", restore, true);
        }
      };
      window.addEventListener("pointerup", restore, {
        capture: true,
        passive: true,
      });
    } catch (err) {
      if (debug) console.error("enableFloorClickToDraw.domHandler error:", err);
    }
  };

  // attach in capture phase so this runs before Fabric selection handling
  upperCanvasEl.addEventListener("pointerdown", domHandler, { capture: true });

  // return cleanup
  return () => {
    try {
      upperCanvasEl.removeEventListener("pointerdown", domHandler, {
        capture: true,
      } as any);
    } catch {}
  };
}
