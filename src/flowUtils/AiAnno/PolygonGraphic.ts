import type { Sprite } from "pixi.js";
import type KmAnno from "./KmAnno";
import { Graphics } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

export interface Dot {
  id: string;
  x: number;
  y: number;
}

export default class PolygonGraphic {
  public id: string;
  public selected = false;
  public points: Dot[];
  public pointIdSet: Set<string>;
  public layer: Graphics;
  public pointGraphicList: Sprite[] = [];
  private kmAnno: KmAnno;

  constructor(points: Dot[], kmAnno: KmAnno) {
    this.id = uuidv4();
    this.points = points;
    this.pointIdSet = new Set(points.map((p) => p.id));
    this.kmAnno = kmAnno;
    this.layer = new Graphics();
    this.renderPolygon();
    this.bindEvents();
  }

  private renderPolygon() {
    this.layer.clear();
    this.layer
      .poly(this.points)
      .fill({
        color: 0xff0000,
        alpha: this.selected ? 0.4 : 0.2,
      })
      .stroke({
        width: 3,
        color: 0x000000,
      });
  }

  public rerender() {
    this.renderPolygon();
    this.updatePointVisibility();
  }

  private bindEvents() {
    this.layer.interactive = true;
    this.layer.on("mousedown", this.handlePolygonClick.bind(this));
  }

  private handlePolygonClick() {
    if (this.selected) return;
    this.kmAnno.polygonGraphicList.forEach((graphic) => {
      graphic.selected = graphic.id === this.id;
      graphic.rerender();
    });
  }

  private updatePointVisibility() {
    if (!this.selected) return;
    for (const [id, dotSprite] of this.kmAnno.dotSpriteMapper) {
      dotSprite.visible = this.pointIdSet.has(id);
    }
  }
}
