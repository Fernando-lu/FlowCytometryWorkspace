// 这个方法不能直接用啊，我现在做的是单例的，需要根据实际需求确定要用单例还是每个图形创建一个对象

import type { Ref } from 'vue'
import { Container, Graphics, Sprite, Ticker } from 'pixi.js'
import { nextTick, ref } from 'vue'

const rectStrokeWidth = 4

type LabelInfo =
  | {
    x: number
    y: number
    width: number
    height: number
  }
  | undefined
class TbnkChart {
  rawData: Ref<string[][]>
  container: any
  labelInfo: LabelInfo
  rect: any
  submitLabelInfo: LabelInfo
  texture: any
  textureSelected: any
  loading: Ref<boolean>
  insideContainer: any

  constructor() {
    this.rawData = ref([])
    this.labelInfo = undefined
    this.rect = undefined
    this.loading = ref(false)
  }

  /**
   * 解析 CSV 字符串为二维数组
   * @param csv - 逗号分隔的字符串
   */
  parse(csv: string) {
    const rows: string[] = csv.trim().split('\n')
    const result: string[][] = rows.map(row => row.split(','))
    this.rawData.value = result
    return result
  }

  drawRect(container, x, y) {
    if (this.rect) {
      container.removeChild(this.rect)
    }
    this.labelInfo = {
      x,
      y,
      width: 0,
      height: 0,
    }
    const rect = new Graphics()
      .rect(x, y, 1, 1)
      .stroke({ width: rectStrokeWidth, color: 0xFEEB77 })
    this.rect = rect
    container.addChild(rect)
  }

  updateRect(container, x: number, y: number) {
    if (!this.labelInfo)
      return
    container.removeChild(this.rect)
    this.labelInfo.width = x - this.labelInfo.x
    this.labelInfo.height = y - this.labelInfo.y

    this.rect.destroy()
    const rect = new Graphics()
      .rect(
        this.labelInfo.x,
        this.labelInfo.y,
        this.labelInfo.width,
        this.labelInfo.height,
      )
      .stroke({ width: rectStrokeWidth, color: 0xFEEB77 })
    this.rect = rect
    container.addChild(rect)
  }

  async submit(app, container, dotList, xValue, yValue) {
    if (!this.labelInfo)
      return
    if (this.insideContainer) {
      this.insideContainer.destroy()
      container.removeChild(this.insideContainer)
      this.insideContainer = null
    }
    await nextTick()
    this.submitLabelInfo = { ...this.labelInfo }
    this.labelInfo = undefined
    // 移除rect
    container.removeChild(this.rect)
    this.rect.fill('transparent')

    this.renderInsideDots(app, container, dotList, xValue, yValue)
    // 绘制rect
    container.addChild(this.rect)
  }

  renderInsideDots(app, container, dotList, xValue, yValue) {
    const xIndex = dotList[0].findIndex(i => i === xValue)
    const yIndex = dotList[0].findIndex(i => i === yValue)

    this.insideContainer = new Container()
    this.insideContainer.width = 1024
    this.insideContainer.height = 1024

    for (let i = 1; i < 10000; i++) {
      const row = dotList[i]
      const x = +row[xIndex]
      const y = 1024 - +row[yIndex]
      if (this.rect.containsPoint({ x, y })) {
        const dot = new Sprite(this.textureSelected)
        if (x < 0 || y < 0 || x > 1024 || y > 1024)
          continue
        dot.x = x
        dot.y = y
        this.insideContainer.addChild(dot)
      }
    }

    this.__transformDotsToSprite(app, this.insideContainer)

    container.addChild(this.insideContainer)
  }

  renderDot(app, container, dotList, xValue, yValue) {
    // 使用 texture 比重复创建 circle 的性能要好
    const xIndex = dotList[0].findIndex(i => i === xValue)
    const yIndex = dotList[0].findIndex(i => i === yValue)
    // 透明层是用来固定 container 的宽高的
    const rect = new Graphics().rect(0, 0, 1024, 1024).fill('transparent')
    container.addChild(rect)
    for (let i = 1; i < dotList.length; i++) {
      const row = dotList[i]
      const x = +row[xIndex]
      const y = 1024 - +row[yIndex]
      let texture = this.texture
      if (this.submitLabelInfo) {
        if (this.rect.containsPoint({ x, y })) {
          texture = this.textureSelected
        }
      }
      const dot = new Sprite(texture)
      // 溢出的数据就不渲染了，否则后面把container处理成sprite会被撑得很大，展示区域错乱
      if (x < 0 || y < 0 || x > 1024 || y > 1024)
        continue
      dot.x = x
      dot.y = y
      container.addChild(dot)
    }

    this.__transformDotsToSprite(app, container)
  }

  // 把十万个点转成sprite，不要重复渲染10万个点
  __transformDotsToSprite(app, container) {
    Ticker.shared.addOnce(() => {
      if (!container)
        return
      const texture = app.renderer.generateTexture(container)
      container.removeChildren()
      const sprite = new Sprite(texture)
      container.addChild(sprite)
      console.log('换换换~~~')
    })
  }

  /**
   * 销毁数据
   */
  destroy(): void {
    this.rawData.value = []
  }
}

export default new TbnkChart()
