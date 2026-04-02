import type {
  Application,
  Texture,
} from 'pixi.js'
import {
  Assets,
  BitmapText,
  Container,
  Graphics,
  Sprite,
  TextStyle,
} from 'pixi.js'

const textStyle = new TextStyle({
  fill: 0x000000,
  fontSize: 12,
})

export const CONFIG = {
  StageSize: 400,
  dotVisibleSize: 340,
  marginLeft: 30,
  marginTop: 30,
}

export interface DotPosition {
  x: number
  y: number
}

export default abstract class BaseAnno {
  app: Application | undefined
  xLabels: string[] = []
  yLabels: string[] = []
  img: string | undefined
  container: Container | undefined
  pointTexture: Texture | undefined

  protected constructor() {}

  protected renderAxisLabels(): void {
    if (!this.app)
      return

    const container = new Container()
    this.app.stage.addChild(container)
    container.x = CONFIG.marginLeft
    container.y = CONFIG.marginTop

    const graphics = new Graphics()
    this.container?.addChild(graphics)
    graphics
      .moveTo(0, 0)
      .lineTo(0, CONFIG.dotVisibleSize)
      .lineTo(CONFIG.dotVisibleSize, CONFIG.dotVisibleSize)
      .stroke({ width: 1, color: 0x000000 })
    container.addChild(graphics)

    const gapX = CONFIG.dotVisibleSize / (this.xLabels.length - 1)
    for (let i = 0; i < this.xLabels.length; i++) {
      const label = new BitmapText({
        text: this.xLabels[i],
        style: textStyle,
      })
      label.x = gapX * i
      label.y = 345
      container.addChild(label)
    }

    const gapY = CONFIG.dotVisibleSize / (this.yLabels.length - 1)
    for (let i = 0; i < this.yLabels.length; i++) {
      const label = new BitmapText({
        text: this.yLabels[i],
        style: textStyle,
      })
      label.x = -30
      label.y = gapY * i
      container.addChild(label)
    }
  }

  protected async appendImageToStage(
    imageUrl: string = 'https://pixijs.com/assets/bunny.png',
  ): Promise<void> {
    if (!this.app)
      return

    const container = new Container()
    this.app.stage.addChildAt(container, 1)
    const texture = await Assets.load(imageUrl)
    const img = new Sprite(texture)
    img.width = CONFIG.dotVisibleSize
    img.height = CONFIG.dotVisibleSize
    img.x = CONFIG.marginLeft
    img.y = CONFIG.marginTop

    container.addChildAt(img, 0)
  }

  protected generateDotTexture() {
    const circle = new Graphics().circle(0, 0, 16).fill(0xFFFFFF).stroke({
      width: 4,
      color: 0x000000,
    })
    this.pointTexture = this.app!.renderer.generateTexture(circle)
  }

  public calcPos({ x, y }: { x: number, y: number }) {
    return { x, y: 1024 - y }
  }
}
