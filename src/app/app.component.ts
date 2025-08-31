import { Component, OnInit, AfterViewInit } from "@angular/core";
import { FormGroup, FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { library } from "@fortawesome/fontawesome-svg-core";
import { enableFloorClickToDraw } from "./floorClickToDraw";
import {
  faReply,
  faShare,
  faClone,
  faTrash,
  faUndo,
  faRedo,
  faObjectGroup,
  faObjectUngroup,
  faPlus,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";

import { FURNISHINGS } from "./models/furnishings";
import { AppService } from "./app.service";
import { ChairsLayoutComponent } from "./components/chairs-layout/chairs-layout.component";
import { fabric } from "fabric";

library.add(
  faReply,
  faShare,
  faClone,
  faTrash,
  faUndo,
  faRedo,
  faObjectGroup,
  faObjectUngroup,
  faMinus,
  faPlus
);

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, AfterViewInit {
  title = "room-layout";

  init = false;
  furnishings = FURNISHINGS;
  defaultChairIndex = 0;

  textForm: FormGroup;

  previewItem = null;
  previewType = null;

  // icons
  faReply = faReply;
  faShare = faShare;
  faClone = faClone;
  faTrash = faTrash;
  faUndo = faUndo;
  faRedo = faRedo;
  faObjectGroup = faObjectGroup;
  faObjectUngroup = faObjectUngroup;
  faPlus = faPlus;
  faMinus = faMinus;

  // ✅ Add Fabric.js canvas reference
  canvas!: fabric.Canvas;

  constructor(public app: AppService, private dialog: MatDialog) {}

  ngAfterViewInit() {
    this.canvas = new fabric.Canvas("canvas", {});

    // expose globally for helpers
    (window as any).canvas = this.canvas;

    // attach floor click drawing
    enableFloorClickToDraw(this.canvas, "rect"); // or whatever shape you want
  }

  ngOnInit() {
    const defaultChair = FURNISHINGS.chairs[0];
    setTimeout(() => {
      this.app.defaultChair.next(defaultChair);
      this.init = true;
    }, 100);
    this.initTextForm();

    // ✅ initialize canvas
  }

  insert(object: any, type: string) {
    if (this.app.roomEdit) {
      return;
    }
    // debugger;

    // ✅ Rooms (and all other object types) stay the same
    this.app.insertObject.next({ type, object });
  }

  defaultChairChanged(index: number) {
    this.defaultChairIndex = index;
    this.app.defaultChair.next(FURNISHINGS.chairs[index]);
  }

  initTextForm() {
    this.textForm = new FormGroup({
      text: new FormControl("New Text"),
      font_size: new FormControl(16),
      direction: new FormControl("HORIZONTAL"),
    });
  }

  insertNewText() {
    this.insert({ ...this.textForm.value, name: "TEXT:Text" }, "TEXT");
  }

  layoutChairs() {
    const ref = this.dialog.open(ChairsLayoutComponent);
    ref.afterClosed().subscribe((res) => {
      if (!res) {
        return;
      }
      this.insert(res, "LAYOUT");
    });
  }

  download(format: string) {
    this.app.performOperation.next(format);
  }

  onZoom(value) {
    this.app.zoom = value;
    this.app.performOperation.next("ZOOM");
  }
}
