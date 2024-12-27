"use client"

import { PixiConverter } from "@/shared/lib/PixiConverter"
import { generateRandomPixiGraphics } from "@/shared/lib/utils"
import {
  Application,
  Circle,
  Container,
  Ellipse,
  Graphics,
  RoundedRectangle,
  Sprite,
} from "pixi.js-legacy"
import { useEffect, useRef, useState } from "react"

export const PixiJs = () => {
  const container = new Container()

  const [app, setApp] = useState<Application | null>(null)
  const [converter, setConverter] = useState<PixiConverter | null>(null)

  const ref = useRef<HTMLDivElement>(null)

  const initPixiJs = async () => {
    const app = new Application({
      forceCanvas: true,
      backgroundAlpha: 0,
      eventMode: "static",
    })

    setApp(app)

    const subContainer = new Container()
    const imageContainer = new Container()

    const g1 = new Graphics()
    const g2 = new Graphics()
    const g3 = new Graphics()
    const g4 = new Graphics()
    const g5 = new Graphics()

    g1.beginFill("#ff0000")
      .drawShape(new RoundedRectangle(5, 7, 50, 50, 10))
      .endFill()
    g1.scale.set(1.5, 1.7)
    g1.position.set(100, 30)
    g1.angle = 30
    g1.on("pointerdown", () => {
      console.log("g1 pointerdown!")
    })

    g2.beginFill("#0000ff").drawRect(50, 50, 50, 50).endFill()
    g2.position.set(50, 60)
    g2.angle = 5
    g2.scale.set(1.5, 1.7)
    g2.on("pointerup", () => {
      console.log("g2 pointerup!")
    })

    g3.lineStyle(10, "#ff00ff", 1).moveTo(0, 0).lineTo(150, 100)
    g3.angle = -20

    g4.lineStyle(10, "#ffff00", 1).moveTo(0, 70).lineTo(150, -30)
    g4.angle = 20

    g5.beginFill("#00ff00")
      .drawShape(new Ellipse(10, 20, 50, 40))
      .endFill()
    g5.scale.set(1.5, 1.7)

    imageContainer.addChild(Sprite.from("image.png"))
    imageContainer.scale.set(0.9, 0.9)
    imageContainer.position.set(100, 0)
    imageContainer.angle = -4

    subContainer.position.set(75, 50)
    subContainer.angle = 45
    subContainer.addChild(g3, g4)
    container.addChild(g1, g2, g5, subContainer)
    container.addChild(imageContainer)

    app.stage.addChild(container)
    app.renderer.resize(300, 300)

    ref.current?.appendChild(app.view as any)

    const converter = new PixiConverter(300, 300)
    setConverter(converter)
    await converter.initCanvasKit()
    converter.convertPixiContainerToSkia(container)
  }

  useEffect(() => {
    initPixiJs()
  }, [])

  const onRandomShapeButtonClick = () => {
    if (!converter || !app) return

    const { width, height } = converter.getResolution()
    const graphics = generateRandomPixiGraphics(width, height)
    container.addChild(graphics)

    // Rerender canvas due to updated PIXI.js container
    app.stage.addChild(container)
    converter.convertPixiContainerToSkia(container)
  }

  const onExportToPdfButtonClick = () => {
    converter?.exportAsPdf("export.pdf")
  }

  return (
    <div className="flex h-full gap-10">
      <div className="flex flex-col gap-5">
        <button
          onClick={onRandomShapeButtonClick}
          className="bg-slate-500/20 whitespace-nowrap"
        >
          random shape
        </button>
        <button
          onClick={onExportToPdfButtonClick}
          className="bg-slate-500/20 whitespace-nowrap"
        >
          export to PDF
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        <span>pixi.js canvas</span>
        <div>
          <div ref={ref} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span>skia canvas</span>
        <canvas id="skia-canvas" width={300} height={300} />
      </div>
    </div>
  )
}
