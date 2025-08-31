// import { Injectable } from "@angular/core";
// import { Subject, BehaviorSubject } from "rxjs";

// @Injectable({
//   providedIn: "root",
// })
// export class AppService {
//   roomEdit = false;

//   states = [];
//   redoStates = [];

//   roomEditOperate = "CORNER";
//   roomEditStates = [];
//   roomEditRedoStates = [];

//   selections: any[] = [];
//   copied: any;

//   ungroupable = false;

//   insertObject: Subject<any> = new Subject<any>();
//   defaultChair: Subject<any> = new Subject<any>();
//   performOperation: Subject<any> = new Subject<any>();
//   roomEdition: Subject<boolean> = new Subject<boolean>();
//   saveState = new Subject<any>();
//   zoom = 100;

//   constructor() {
//     this.saveState.subscribe((res) => {
//       if (this.roomEdit) {
//         this.roomEditStates.push(res);
//         this.roomEditRedoStates = [];
//         return;
//       }
//       this.states.push(res);
//       this.redoStates = [];
//     });
//   }

//   editRoom() {
//     this.roomEdit = true;
//     this.roomEdition.next(true);
//   }

//   endEditRoom() {
//     this.roomEdit = false;
//     this.roomEdition.next(false);
//   }

//   undo() {
//     if (
//       (this.states.length === 1 && !this.roomEdit) ||
//       (this.roomEditStates.length === 1 && this.roomEdit)
//     ) {
//       return;
//     }
//     this.performOperation.next("UNDO");
//   }

//   redo() {
//     if (
//       (this.redoStates.length === 0 && !this.roomEdit) ||
//       (this.roomEditRedoStates.length === 0 && this.roomEdit)
//     ) {
//       return;
//     }
//     this.performOperation.next("REDO");
//   }

//   clone() {
//     this.copy(true);
//   }

//   copy(doClone = false) {
//     this.performOperation.next("COPY");
//     if (doClone) {
//       setTimeout(() => this.paste(), 100);
//     }
//   }

//   paste() {
//     this.performOperation.next("PASTE");
//   }

//   delete() {
//     if (!this.selections.length) {
//       return;
//     }
//     this.performOperation.next("DELETE");
//   }

//   rotateAntiClockWise() {
//     this.performOperation.next("ROTATE_ANTI");
//   }

//   rotateClockWise() {
//     this.performOperation.next("ROTATE");
//   }

//   group() {
//     this.performOperation.next("GROUP");
//   }

//   ungroup() {
//     this.performOperation.next("UNGROUP");
//   }

//   placeInCenter(direction) {
//     this.performOperation.next(direction);
//   }

//   arrange(side) {
//     this.performOperation.next(side);
//   }

//   zoomIn() {
//     if (this.zoom >= 150) {
//       return;
//     }
//     this.zoom += 10;
//     this.performOperation.next("ZOOM");
//   }

//   zoomOut() {
//     if (this.zoom <= 20) {
//       return;
//     }
//     this.zoom -= 10;
//     this.performOperation.next("ZOOM");
//   }
// }

import { Injectable } from "@angular/core";
import { Subject, BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AppService {
  roomEdit = false;
  floorEdit = false; // ✅ NEW: support editing floors separately

  states = [];
  redoStates = [];

  roomEditOperate = "CORNER";
  roomEditStates = [];
  roomEditRedoStates = [];

  floorEditStates = []; // ✅ NEW: track floor edit history
  floorEditRedoStates = [];

  selections: any[] = [];
  copied: any;

  ungroupable = false;

  insertObject: Subject<any> = new Subject<any>();
  defaultChair: Subject<any> = new Subject<any>();
  performOperation: Subject<any> = new Subject<any>();
  roomEdition: Subject<boolean> = new Subject<boolean>();
  floorEdition: Subject<boolean> = new Subject<boolean>(); // ✅ NEW
  saveState = new Subject<any>();
  zoom = 100;

  constructor() {
    this.saveState.subscribe((res) => {
      if (this.roomEdit) {
        this.roomEditStates.push(res);
        this.roomEditRedoStates = [];
        return;
      }
      if (this.floorEdit) {
        // ✅ handle floor editing separately
        this.floorEditStates.push(res);
        this.floorEditRedoStates = [];
        return;
      }
      this.states.push(res);
      this.redoStates = [];
    });
  }

  // ✅ Floor editing controls
  editFloor() {
    this.floorEdit = true;
    this.floorEdition.next(true);
  }

  endEditFloor() {
    this.floorEdit = false;
    this.floorEdition.next(false);
  }

  // Existing room editing stays as is
  editRoom() {
    this.roomEdit = true;
    this.roomEdition.next(true);
  }

  endEditRoom() {
    this.roomEdit = false;
    this.roomEdition.next(false);
  }

  undo() {
    // debugger;
    if (
      (this.states.length === 1 && !this.roomEdit && !this.floorEdit) ||
      (this.roomEditStates.length === 1 && this.roomEdit) ||
      (this.floorEditStates.length === 1 && this.floorEdit)
    ) {
      return;
    }
    this.performOperation.next("UNDO");
  }

  redo() {
    if (
      (this.redoStates.length === 0 && !this.roomEdit && !this.floorEdit) ||
      (this.roomEditRedoStates.length === 0 && this.roomEdit) ||
      (this.floorEditRedoStates.length === 0 && this.floorEdit)
    ) {
      return;
    }
    this.performOperation.next("REDO");
  }

  clone() {
    this.copy(true);
  }

  copy(doClone = false) {
    this.performOperation.next("COPY");
    if (doClone) {
      setTimeout(() => this.paste(), 100);
    }
  }

  paste() {
    this.performOperation.next("PASTE");
  }

  delete() {
    if (!this.selections.length) {
      return;
    }
    this.performOperation.next("DELETE");
  }

  rotateAntiClockWise() {
    this.performOperation.next("ROTATE_ANTI");
  }

  rotateClockWise() {
    this.performOperation.next("ROTATE");
  }

  group() {
    this.performOperation.next("GROUP");
  }

  ungroup() {
    this.performOperation.next("UNGROUP");
  }

  placeInCenter(direction) {
    this.performOperation.next(direction);
  }

  arrange(side) {
    this.performOperation.next(side);
  }

  zoomIn() {
    if (this.zoom >= 150) {
      return;
    }
    this.zoom += 10;
    this.performOperation.next("ZOOM");
  }

  zoomOut() {
    if (this.zoom <= 20) {
      return;
    }
    this.zoom -= 10;
    this.performOperation.next("ZOOM");
  }
}
