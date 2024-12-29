import { CanvasKitDisplayObjectEvents } from "./typings"

import {
  Circle,
  Ellipse,
  Graphics,
  Polygon,
  Rectangle,
  RoundedRectangle,
  SHAPES,
} from "pixi.js-legacy"

export const downloadData = (data: Uint8Array, fileName: string) => {
  var a = document.createElement("a")
  document.body.appendChild(a)
  const blob = new Blob([data], { type: "application/pdf" })
  const url = window.URL.createObjectURL(blob)
  a.href = url
  a.download = fileName
  a.click()
  window.URL.revokeObjectURL(url)
}

export const getRandomInt = (min: number, max: number) => {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled)
}

export const generateRandomPixiGraphics = (
  id: number,
  canvasWidth: number,
  canvasHeight: number,
  events: CanvasKitDisplayObjectEvents
) => {
  const graphics = new Graphics()

  const max = Math.min(canvasWidth, canvasHeight)

  const x = getRandomInt(0, max)
  const y = getRandomInt(0, max)
  const width = getRandomInt(0, max)
  const height = getRandomInt(0, max)
  const radius = getRandomInt(0, max / 2)

  const color = "#" + getRandomInt(0, 0xffffff).toString(16).padStart(6, "0")

  const shape = (() => {
    switch (id) {
      case SHAPES.RECT: {
        return { name: "rect", shape: new Rectangle(x, y, width, height) }
      }
      case SHAPES.CIRC: {
        return { name: "circle", shape: new Circle(x, y, radius) }
      }
      case SHAPES.ELIP: {
        return { name: "oval", shape: new Ellipse(x, y, width / 2, height / 2) }
      }
      case SHAPES.RREC: {
        return {
          name: "rounded rect",
          shape: new RoundedRectangle(x, y, width, height, radius),
        }
      }
      default: {
        const pointsLength = getRandomInt(3, 5) * 2
        const points = new Array(pointsLength)
          .fill(0)
          .map((_) => getRandomInt(0, max))
        return { name: "poligon", shape: new Polygon(points) }
      }
    }
  })()

  graphics
    .beginFill(color)
    .drawShape(shape.shape)
    .endFill()
    .on("pointerup", () => events.pointerup?.fn())
    .on("pointerdown", () => events.pointerdown?.fn())

  return graphics
}
