import type ManualAnno from './ManualAnno'
import { Container, Graphics, Sprite } from 'pixi.js'

interface Dot {
  x: number
  y: number
}

export default class PolygonGraphic {
  public layer: Container
  private polygon: Graphics | undefined
  private points: Dot[]
  private pointSprites: Sprite[] = []
  private draggingIndex: number | null = null
  private anno: ManualAnno

  constructor(points: Dot[], anno: ManualAnno) {
    this.points = points
    this.anno = anno
    this.layer = new Container()

    this.initLayer()
    this.createPolygon()
    this.createPointSprites()
    this.bindEvents()
  }

  private initLayer() {
    const workspace = new Graphics().rect(0, 0, 1024, 1024).fill('transparent')
    this.layer.interactive = false
    this.layer.eventMode = 'static'
    this.layer.addChild(workspace)
  }

  private createPolygon() {
    this.polygon = new Graphics()
    this.layer.addChild(this.polygon)
    this.drawPolygon()
  }

  private drawPolygon() {
    this.polygon!.clear()
    this.polygon!.poly(this.points).stroke({
      width: 2,
      color: 0x00AA00,
    })
  }

  private createPointSprites() {
    this.points.forEach(({ x, y }) => {
      const sprite = new Sprite(this.anno.pointTexture)
      sprite.anchor.set(0.5)
      sprite.position.set(x, y)
      sprite.cursor = 'pointer'
      sprite.eventMode = 'static'
      this.layer.addChild(sprite)
      this.pointSprites.push(sprite)
    })
  }

  private bindEvents() {
    // 拖拽起始
    this.pointSprites.forEach((sprite, index) => {
      sprite.on('mousedown', () => {
        this.draggingIndex = index
        sprite.cursor = 'grabbing'
      })
    })

    // 全局 mouseup 清除状态
    this.layer.on('mouseup', () => {
      this.draggingIndex = null
      this.pointSprites.forEach(s => (s.cursor = 'pointer'))
    })

    // 拖拽中
    this.layer.on('mousemove', (e) => {
      if (this.draggingIndex === null)
        return
      const { x, y } = e.getLocalPosition(this.layer)
      const point = this.points[this.draggingIndex]
      point.x = x
      point.y = y

      const sprite = this.pointSprites[this.draggingIndex]
      sprite.position.set(x, y)
      this.drawPolygon()
    })

    // 冒泡事件
    this.layer.on('mousedown', (e) => {
      const { x, y } = e.getLocalPosition(this.layer)
      this.anno.handleBubbleEvent('bubble:mousedown', { x, y })
    })
  }
}
