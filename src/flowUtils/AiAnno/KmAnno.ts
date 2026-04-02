import type {
  FederatedPointerEvent,
} from 'pixi.js'
import {
  Application,
  Container,
  Graphics,
  Sprite,
} from 'pixi.js'
import BaseAnno, { CONFIG } from '../BaseAnno'
import PolygonGraphic, { type Dot } from './PolygonGraphic'

export default class KmAnno extends BaseAnno {
  originalPolygons: Dot[][] = []
  standardizedPolygons: Dot[][] = []
  polygonGraphicList: PolygonGraphic[] = []
  dotMapper: Map<string, Dot & { id: string }> = new Map()
  dotSpriteMapper: Map<string, Sprite> = new Map()
  selectedPointId?: string

  constructor() {
    super()
  }

  public async init(
    el: HTMLElement,
    xLabels: string[],
    yLabels: string[],
    img: string,
    rawPolygonList: Dot[][],
  ): Promise<void> {
    this.xLabels = xLabels
    this.yLabels = yLabels
    this.img = img
    this.originalPolygons = rawPolygonList
    this.standardizeDotsWithId()

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

    this.container = this.createContainer()
    this.app.stage.addChild(this.container)
    this.appendImageToStage(this.img)
    this.container.x = CONFIG.marginLeft + 1
    this.container.y = CONFIG.marginTop - 1
    this.container.scale = CONFIG.dotVisibleSize / 1024
    this.container.interactive = true

    this.renderPolygons()
  }

  // 构建唯一 dot ID，并统一替换引用
  private standardizeDotsWithId() {
    const dotMap = new Map<string, Dot & { id: string }>()
    for (const polygon of this.originalPolygons) {
      for (const dot of polygon) {
        const id = this.buildDotId(dot)
        if (!dotMap.has(id)) {
          dotMap.set(id, { ...this.calcPos(dot), id })
        }
      }
    }
    this.dotMapper = dotMap

    this.standardizedPolygons = this.originalPolygons.map(polygon =>
      polygon.map((dot) => {
        const id = this.buildDotId(dot)
        return dotMap.get(id)!
      }),
    )
  }

  private buildDotId(dot: Dot): string {
    return `${dot.x}##${dot.y}`
  }

  private createContainer(): Container {
    const container = new Container()

    container
      .addChild(new Graphics().rect(0, 0, 1024, 1024))
      .fill('transparent')

    container.on('mousemove', this.handleMouseMove.bind(this))
    container.on('mouseup', this.handleMouseUp.bind(this))

    return container
  }

  private renderPolygons() {
    for (const polygon of this.standardizedPolygons) {
      const polygonGraphic = new PolygonGraphic(polygon, this)
      this.container!.addChild(polygonGraphic.layer!)
      this.polygonGraphicList.push(polygonGraphic)
    }
    this.renderDraggablePoints()
  }

  private renderDraggablePoints() {
    for (const [id, point] of this.dotMapper) {
      const sprite = new Sprite(this.pointTexture)
      sprite.anchor.set(0.5)
      sprite.x = point.x
      sprite.y = point.y
      sprite.interactive = true
      sprite.cursor = 'pointer'
      sprite.on('mousedown', () => {
        this.selectedPointId = id
      })
      this.container!.addChild(sprite)
      this.dotSpriteMapper.set(id, sprite)
      sprite.visible = false
    }
  }

  private handleMouseMove(e: FederatedPointerEvent) {
    if (!this.selectedPointId)
      return

    const local = this.container!.toLocal(e.global)
    const point = this.dotMapper.get(this.selectedPointId)
    const sprite = this.dotSpriteMapper.get(this.selectedPointId)

    if (!point || !sprite)
      return

    // 原始位置
    const currentX = point.x
    const currentY = point.y
    const isAtLeftOrRightEdge = currentX === 0 || currentX === 1024
    const isAtTopOrBottomEdge = currentY === 0 || currentY === 1024
    const isAtCorner = isAtLeftOrRightEdge && isAtTopOrBottomEdge
    if (isAtCorner)
      return

    // 处理边界限制逻辑
    let { x, y } = local
    if (x <= 0)
      x = 1
    if (x >= 1024)
      x = 1023
    if (y <= 0)
      y = 1
    if (y >= 1024)
      y = 1023

    if (!isAtLeftOrRightEdge)
      point.x = sprite.x = x
    if (!isAtTopOrBottomEdge)
      point.y = sprite.y = y
    this.polygonGraphicList.forEach(poly => poly.rerender())
  }

  private handleMouseUp() {
    this.selectedPointId = undefined
  }
}
