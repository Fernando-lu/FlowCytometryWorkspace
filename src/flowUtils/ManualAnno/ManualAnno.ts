import type {
  FederatedPointerEvent,
} from 'pixi.js'
import {
  Application,
  Container,
  Graphics,
  Sprite,
} from 'pixi.js'
import BaseAnno, { CONFIG, type DotPosition } from '../BaseAnno'
import Polygon from './Polygon'

export default class KmAnno extends BaseAnno {
  selectedPointId?: string
  dotPosition?: DotPosition
  crosshairLayer = new Graphics()
  drawMode?: 'crosshair' | 'polygon' | 'rect'
  polygon?: Polygon
  cacheGraph?: Graphics
  starterSprite?: Sprite
  starter?: DotPosition
  polygonPoints: DotPosition[] = []

  constructor() {
    super()
  }

  public async init(
    el: HTMLElement,
    xLabels: string[],
    yLabels: string[],
    img: string,
    dotPosition: DotPosition,
  ): Promise<void> {
    this.xLabels = xLabels
    this.yLabels = yLabels
    this.img = img
    this.dotPosition = this.calcPos(dotPosition)

    const app = new Application()
    await app.init({
      width: CONFIG.StageSize,
      height: CONFIG.StageSize,
      backgroundColor: 0xD9F9E3,
      antialias: true,
      resolution: 1,
      preference: 'webgl',
    })

    this.app = app
    el.appendChild(app.canvas)

    this.generateDotTexture()
    this.renderAxisLabels()

    this.container = this.initContainer()
    this.app.stage.addChild(this.container)

    this.appendImageToStage(this.img)
    this.container.x = CONFIG.marginLeft + 1
    this.container.y = CONFIG.marginTop - 1
    this.container.scale = CONFIG.dotVisibleSize / 1024
    this.container.interactive = true
    this.container.addChild(this.crosshairLayer)
    this.updateCrosshair(this.dotPosition.x, this.dotPosition.y)
  }

  private initContainer(): Container {
    const container = new Container()
    container.addChild(
      new Graphics().rect(0, 0, 1024, 1024).fill('transparent'),
    )
    container.eventMode = 'static'
    this.bindDrawEvents(container)
    return container
  }

  private bindDrawEvents(container: Container) {
    container.on('mousedown', e => this.onMouseDown(e))
    container.on('mousemove', e => this.onMouseMove(e))
    container.on('mouseup', e => this.onMouseUp(e))
  }

  private onMouseDown(e: FederatedPointerEvent) {
    if (!this.drawMode || this.polygon)
      return
    const { x, y } = this.container!.toLocal(e.global)

    switch (this.drawMode) {
      case 'crosshair':
        this.updateCrosshair(x, y)
        break
      case 'rect':
        this.handleDrawRectStart(x, y)
        break
      case 'polygon':
        this.handleDrawPolygonClick(x, y)
        break
    }
  }

  private onMouseMove(e: FederatedPointerEvent) {
    const { x, y } = this.container!.toLocal(e.global)
    if (this.drawMode === 'rect' && this.starter) {
      const w = x - this.starter.x
      const h = y - this.starter.y
      this.cacheGraph?.clear()
      this.cacheGraph
        ?.rect(this.starter.x, this.starter.y, w, h)
        .stroke({ width: 2, color: 0x000000 })
    }
  }

  private onMouseUp(e: FederatedPointerEvent) {
    const { x, y } = this.container!.toLocal(e.global)
    if (this.drawMode === 'rect' && this.starter) {
      this.finishRectPolygon(x, y)
      this.setDrawMode(undefined)
    }
  }

  private updateCrosshair(x: number, y: number) {
    this.crosshairLayer.clear()
    this.dotPosition = { x, y }
    this.drawDashedLine(0, y, 1024, y)
    this.drawDashedLine(x, 0, x, 1024)
    this.setDrawMode(undefined)
  }

  private drawDashedLine(x1: number, y1: number, x2: number, y2: number) {
    const dash = 6
    const gap = 4
    const graphics = this.crosshairLayer
    const isVertical = x1 === x2
    if (isVertical) {
      for (let y = y1; y < y2; y += dash + gap) {
        graphics
          .moveTo(x1, y)
          .lineTo(x1, Math.min(y + dash, y2))
          .stroke({ width: 2, color: 0x000000 })
      }
    }
    else {
      for (let x = x1; x < x2; x += dash + gap) {
        graphics
          .moveTo(x, y1)
          .lineTo(Math.min(x + dash, x2), y1)
          .stroke({ width: 2, color: 0x000000 })
      }
    }
  }

  setDrawMode(mode: KmAnno['drawMode']) {
    this.drawMode = mode
  }

  handleBubbleEvent(event: string, { x, y }: DotPosition) {
    if (event === 'bubble:mousedown' && this.drawMode === 'crosshair') {
      this.updateCrosshair(x, y)
    }
  }

  resetDrawLayer() {
    this.starter = undefined
    if (this.starterSprite)
      this.container?.removeChild(this.starterSprite)
    this.starterSprite = undefined
    this.cacheGraph?.clear()
    this.cacheGraph = undefined
    this.polygonPoints = []
  }

  removePolygon() {
    if (!this.polygon)
      return
    this.container?.removeChild(this.polygon.layer)
    this.polygon = undefined
    this.resetDrawLayer()
  }

  private handleDrawRectStart(x: number, y: number) {
    this.starter = { x, y }
    this.cacheGraph = new Graphics()
      .rect(x, y, 0, 0)
      .stroke({ width: 2, color: 0x000000 })
    this.container?.addChild(this.cacheGraph)
  }

  private finishRectPolygon(x: number, y: number) {
    const s = this.starter!
    const points = [
      { x: s.x, y: s.y },
      { x, y: s.y },
      { x, y },
      { x: s.x, y },
    ]
    this.resetDrawLayer()
    this.polygon = new Polygon(points, this)
    this.container?.addChild(this.polygon.layer)
  }

  private handleDrawPolygonClick(x: number, y: number) {
    if (!this.starter)
      this.initPolygonStart(x, y)
    this.addPolygonPoint(x, y)
  }

  private initPolygonStart(x: number, y: number) {
    this.starter = { x, y }
    this.cacheGraph = new Graphics().moveTo(x, y)
    this.container?.addChild(this.cacheGraph)

    this.starterSprite = new Sprite(this.pointTexture)
    this.starterSprite.anchor.set(0.5)
    this.starterSprite.position.set(x, y)
    this.starterSprite.interactive = true
    this.container?.addChild(this.starterSprite)
    this.starterSprite.on('mousedown', () => {
      if (this.polygonPoints.length <= 2)
        return
      this.polygon = new Polygon(this.polygonPoints, this)
      this.container?.addChild(this.polygon.layer)
      this.resetDrawLayer()
    })
  }

  private addPolygonPoint(x: number, y: number) {
    this.polygonPoints.push({ x, y })
    this.cacheGraph?.lineTo(x, y).stroke({ width: 2, color: 0x000000 })
  }
}
