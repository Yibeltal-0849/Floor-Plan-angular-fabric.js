// services/floor.service.ts
import { Injectable } from "@angular/core";
import { fabric } from "fabric";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class FloorService {
  private floors: fabric.Object[] = [];
  private selectedFloor = new BehaviorSubject<fabric.Object | null>(null);

  selectedFloor$ = this.selectedFloor.asObservable();

  addFloor(floor: fabric.Object) {
    this.floors.push(floor);
  }

  // removeFloor(floor: fabric.Object) {
  //   const index = this.floors.indexOf(floor);
  //   if (index > -1) {
  //     this.floors.splice(index, 1);
  //   }
  // }

  setSelectedFloor(floor: fabric.Object | null) {
    this.selectedFloor.next(floor);
  }

  getFloors(): fabric.Object[] {
    return this.floors;
  }
}
