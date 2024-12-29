"use client"

import { PixiConverter } from "@/shared/lib/PixiConverter"
import { generateRandomPixiGraphics, getRandomInt } from "@/shared/lib/utils"
import {
  Application,
  Circle,
  Container,
  Ellipse,
  Graphics,
  RoundedRectangle,
  SHAPES,
  Sprite,
} from "pixi.js-legacy"
import { useEffect, useMemo, useRef, useState } from "react"

export const PixiJs = () => {
  const [app, setApp] = useState<Application | null>(null)
  const container = useMemo(() => new Container(), [])

  const [converter, setConverter] = useState<PixiConverter | null>(null)

  const [message, setMessage] = useState<string>()

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
    g1.on("pointerdown", () => addNewMessage("pointerdown on RRECT"))

    g2.beginFill("#0000ff").drawRect(50, 50, 50, 50).endFill()
    g2.position.set(50, 60)
    g2.angle = 5
    g2.scale.set(1.5, 1.7)
    g2.on("pointerdown", () => addNewMessage("pointerdown on RECT"))

    g3.lineStyle(10, "#ff00ff", 1).moveTo(0, 0).lineTo(150, 100)
    g3.angle = -20

    g4.lineStyle(10, "#ffff00", 1).moveTo(0, 70).lineTo(150, -30)
    g4.angle = 20

    g5.beginFill("#00ff00")
      .drawShape(new Ellipse(10, 20, 50, 40))
      .endFill()
    g5.scale.set(1.5, 1.7)
    g5.on("pointerdown", () => addNewMessage("pointerdown on ELIP"))

    const sprite = Sprite.from("image.png")
    sprite.scale.set(0.9, 0.9)
    sprite.angle = -4
    sprite.on("pointerup", () => addNewMessage("pointerup on IMAGE"))
    imageContainer.position.set(200, 0)
    imageContainer.addChild(sprite)

    subContainer.position.set(75, 50)
    subContainer.angle = 45
    subContainer.addChild(g3, g4)
    container.addChild(g1, g2, g5, subContainer)
    container.addChild(imageContainer)

    app.stage.addChild(container)
    app.renderer.resize(300, 300)

    ref.current?.appendChild(app.view as any)

    const converter = new PixiConverter(300, 300, "skia-canvas")
    setConverter(converter)

    await converter.initCanvasKit()
    converter.convertPixiContainerToSkia(container)
  }

  useEffect(() => {
    initPixiJs()
  }, [])

  const addNewMessage = (message: string) => {
    setMessage(message)
  }

  const onRandomShapeButtonClick = () => {
    if (!converter || !app) return

    const shapeId = getRandomInt(0, 5)

    const { width, height } = converter.getResolution()
    const graphics = generateRandomPixiGraphics(shapeId, width, height, {
      pointerup: {
        fn: () =>
          addNewMessage(`pointerup on ${Object.values(SHAPES)[shapeId]}`),
      },
    })

    container.addChild(graphics)

    // Rerender canvas due to updated PIXI.js container
    app.stage.addChild(container)
    converter.convertPixiContainerToSkia(container)
  }

  const onExportToPdfButtonClick = () => {
    if (!converter) return

    converter.exportAsPdf("export.pdf")
  }

  const onClearButtonClick = () => {
    if (!converter) return

    container.removeChildren()
    converter.convertPixiContainerToSkia(container)
  }

  return (
    <div className="flex flex-col gap-5 items-center">
      <div className="flex items-center gap-10 justify-center">
        <div className="flex flex-col gap-5">
          <button
            onClick={onRandomShapeButtonClick}
            className="rounded-full py-2.5 px-5 bg-slate-500/20 whitespace-nowrap hover:bg-slate-400/20"
          >
            Create random shape
          </button>
          <button
            onClick={onExportToPdfButtonClick}
            className="rounded-full py-2.5 px-5 bg-slate-500/20 whitespace-nowrap hover:bg-slate-400/20"
          >
            Export to PDF
          </button>
          <button
            onClick={onClearButtonClick}
            className="rounded-full py-2.5 px-5 bg-slate-500/20 whitespace-nowrap hover:bg-slate-400/20"
          >
            Clear
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-center text-xl">pixi.js Canvas</span>
          <div>
            <div ref={ref} className="border rounded-lg border-gray" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-center text-xl">SKIA Canvas</span>
          <canvas
            id="skia-canvas"
            className="border rounded-lg border-gray"
            width={300}
            height={300}
          />
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        {message && (
          <span className="py-1 bg-slate-100/20 rounded-full  px-2.5 text-center">
            {message}
          </span>
        )}
      </div>
    </div>
  )
}
