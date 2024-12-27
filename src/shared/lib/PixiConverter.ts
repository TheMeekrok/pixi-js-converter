import {
  Container,
  DisplayObject,
  Graphics,
  SHAPES,
  Sprite,
} from "pixi.js-legacy"
import { downloadData } from "./utils"

export type CanvasKitShape = {
  x: number
  y: number
  radius?: number
  width?: number
  height?: number
  path?: Array<number>
  transform?: Array<number>
}

export type CanvasKitPaint = {
  color: number
  width: number
  style: "fill" | "stroke"
}

export enum CanvasKitDisplayObjectTag {
  PATH,
  RECT,
  OVAL,
  CIRCLE,
  IMAGE,
}

export type CanvasKitDisplayObject = {
  tag: CanvasKitDisplayObjectTag
  shape: CanvasKitShape
  paint?: CanvasKitPaint
  imageBytes?: ArrayBuffer
}

export class PixiConverter {
  private CanvasKit: any
  private width: number
  private height: number

  private objects: Array<CanvasKitDisplayObject> = []

  /**
   * Constructs a new instance with the specified width and height.
   *
   * @param width - The width of the canvas.
   * @param height - The height of the canvas.
   */
  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  /**
   * Initializes CanvasKit.
   */
  async initCanvasKit() {
    // @ts-ignore
    return await import("/public/canvaskit.js")
      .then((module) => module.default())
      .then((CanvasKit) => (this.CanvasKit = CanvasKit))
  }

  /**
   * Converts a PixiJS container to Skia for rendering.
   *
   * @param container - The PixiJS container to convert.
   */
  async convertPixiContainerToSkia(container: Container) {
    await this.parseObjectsTree(container)
    this.drawOnce()
  }

  /**
   * Parses the tree of objects in the container recursively and extracts relevant data for rendering.
   *
   * @param container - The container whose children will be parsed.
   */
  private async parseObjectsTree(container: Container) {
    for (let index = 0; index < container.children.length; ++index) {
      const child = container.children.at(index)

      if (!child) return

      if (child.children && child.children.length > 0) {
        await this.parseObjectsTree(child as Container)
      } else {
        const x = child.x
        const y = child.y
        const width = "width" in child ? (child.width as number) : undefined
        const height = "height" in child ? (child.height as number) : undefined
        const transform = Array.from(child.worldTransform.toArray(false))

        if (child.isSprite) {
          const sprite = child as Sprite
          const imageUrl = sprite.texture.textureCacheIds.at(0)

          if (imageUrl) {
            // Since rendering images in Promise does not work correctly,
            // it is necessary to load the image before canvas initializing
            const request = await fetch(imageUrl)
            const buffer = await request.arrayBuffer()

            const image: CanvasKitDisplayObject = {
              tag: CanvasKitDisplayObjectTag.IMAGE,
              shape: {
                x: x,
                y: y,
                width: width,
                height: height,
                transform: transform,
              },
              imageBytes: buffer,
            }

            this.objects.push(image)
          }
        } else {
          const graphics = child as Graphics
          const graphicsData = graphics.geometry?.graphicsData.at(0)
          const shape = graphicsData?.shape

          if (!shape) return

          switch (shape.type) {
            case SHAPES.POLY: {
              const pointsLength = graphicsData.points.length
              const path: CanvasKitDisplayObject = {
                tag: CanvasKitDisplayObjectTag.PATH,
                shape: {
                  x: x,
                  y: y,
                  path: graphicsData.points,
                  transform: transform,
                },
                paint: {
                  // A trick to render both Polygon and Line with one method
                  color:
                    pointsLength > 4
                      ? graphicsData.fillStyle.color
                      : graphicsData.lineStyle.color,
                  style: pointsLength > 4 ? "fill" : "stroke",
                  width: graphicsData.lineStyle.width,
                },
              }

              this.objects.push(path)

              break
            }
            case SHAPES.RECT: {
              const rect: CanvasKitDisplayObject = {
                tag: CanvasKitDisplayObjectTag.RECT,
                shape: {
                  x: shape.x,
                  y: shape.y,
                  width: shape.width,
                  height: shape.height,
                  transform: transform,
                },
                paint: {
                  color: graphicsData.fillStyle.color,
                  style: "fill",
                  width: 0,
                },
              }

              this.objects.push(rect)

              break
            }
            case SHAPES.CIRC: {
              const circle: CanvasKitDisplayObject = {
                tag: CanvasKitDisplayObjectTag.CIRCLE,
                shape: {
                  x: shape.x,
                  y: shape.y,
                  radius: shape.radius,
                  transform: transform,
                },
                paint: {
                  color: graphicsData.fillStyle.color,
                  style: "fill",
                  width: 0,
                },
              }

              this.objects.push(circle)

              break
            }
            case SHAPES.ELIP: {
              const oval: CanvasKitDisplayObject = {
                tag: CanvasKitDisplayObjectTag.OVAL,
                shape: {
                  x: shape.x,
                  y: shape.y,
                  width: shape.width,
                  height: shape.height,
                  transform: transform,
                },
                paint: {
                  color: graphicsData.fillStyle.color,
                  style: "fill",
                  width: 0,
                },
              }

              this.objects.push(oval)

              break
            }
            case SHAPES.RREC: {
              const rrect: CanvasKitDisplayObject = {
                tag: CanvasKitDisplayObjectTag.RECT,
                shape: {
                  x: shape.x,
                  y: shape.y,
                  radius: shape.radius,
                  width: shape.width,
                  height: shape.height,
                  transform: transform,
                },
                paint: {
                  color: graphicsData.fillStyle.color,
                  style: "fill",
                  width: 0,
                },
              }

              this.objects.push(rrect)

              break
            }
          }
        }
      }
    }
  }

  /**
   * Returns the resolution (width and height) of the canvas.
   *
   * @returns An object containing the width and height of the canvas.
   */
  getResolution() {
    return { width: this.width, height: this.height }
  }

  /**
   * Exports the current canvas content as a PDF file with the specified filename.
   *
   * @param fileName - The name of the PDF file to export.
   */
  exportAsPdf(fileName: string) {
    const stream = this.CanvasKit.createDynamicMemoryWStream()
    const document = this.CanvasKit.createPDFDocument(stream)
    const canvas = this.CanvasKit.beginDocumentPage(
      document,
      this.width,
      this.height
    )

    this.render(canvas, this.objects)

    this.CanvasKit.closeDocumentPage(document)

    const data = this.CanvasKit.detachStreamAsData(stream)
    downloadData(data, fileName)
  }

  /**
   * Draws the objects once on the Skia canvas.
   */
  private drawOnce() {
    const surface = this.CanvasKit.MakeSWCanvasSurface("skia-canvas")

    surface.drawOnce((canvas: any) => {
      this.render(canvas, this.objects)
    })
  }

  /**
   * Renders all display objects onto the provided canvas.
   *
   * @param canvas - The canvas to draw the objects onto.
   * @param objects - An array of display objects to be rendered.
   */
  private render(canvas: any, objects: Array<CanvasKitDisplayObject>) {
    objects.forEach((object) => {
      switch (object.tag) {
        case CanvasKitDisplayObjectTag.PATH: {
          this.renderPath(canvas, object)
          break
        }
        case CanvasKitDisplayObjectTag.RECT: {
          this.renderRect(canvas, object)
          break
        }
        case CanvasKitDisplayObjectTag.OVAL: {
          this.renderOval(canvas, object)
          break
        }
        case CanvasKitDisplayObjectTag.CIRCLE: {
          this.renderCircle(canvas, object)
          break
        }
        case CanvasKitDisplayObjectTag.IMAGE: {
          this.renderImage(canvas, object)
          break
        }
      }
    })
  }

  /**
   * Renders a custom path on the provided canvas based on the given display object.
   * If path array contains more than 4 elements it will be interpreted as Shape, else
   * Line
   *
   * @param canvas - The canvas to draw the path onto.
   * @param object - The display object containing the path definition and paint settings.
   */
  private renderPath(canvas: any, object: CanvasKitDisplayObject) {
    if (!object.shape.path || !object.paint) return

    const path = new this.CanvasKit.Path()
    path.moveTo(object.shape.path[0], object.shape.path[1])

    for (let i = 2; i < object.shape.path.length; i += 2) {
      path.lineTo(object.shape.path[i], object.shape.path[i + 1])
    }

    const paint = this.createPaint(object.paint)
    if (object.shape.transform) path.transform(object.shape.transform)
    canvas.drawPath(path, paint)
    canvas.save()

    paint.delete()
    path.delete()
  }

  /**
   * Renders a rectangle on the provided canvas based on the given display object.
   *
   * @param canvas - The canvas to draw the rectangle onto.
   * @param object - The display object containing the rectangle's properties and paint settings.
   */
  private renderRect(canvas: any, object: CanvasKitDisplayObject) {
    if (!object.paint || !object.shape.width || !object.shape.height) return

    const rect = this.CanvasKit.XYWHRect(
      object.shape.x,
      object.shape.y,
      object.shape.width,
      object.shape.height
    )
    const paint = this.createPaint(object.paint)
    const path = new this.CanvasKit.Path()

    if ("radius" in object.shape) {
      const rrect = this.CanvasKit.RRectXY(
        rect,
        object.shape.radius,
        object.shape.radius
      )
      path.addRRect(rrect)
    } else {
      path.addRect(rect)
    }

    if (object.shape.transform) path.transform(object.shape.transform)
    canvas.drawPath(path, paint)
    canvas.save()

    paint.delete()
    path.delete()
  }

  /**
   * Renders an oval on the provided canvas based on the given display object.
   *
   * @param canvas - The canvas to draw the oval onto.
   * @param object - The display object containing the oval's properties and paint settings.
   */
  private renderOval(canvas: any, object: CanvasKitDisplayObject) {
    if (!object.paint || !object.shape.width || !object.shape.height) return

    // Translate and scale Oval because PIXI.js construct Ellipses with half width and half height
    const rect = this.CanvasKit.XYWHRect(
      object.shape.x - object.shape.width,
      object.shape.y - object.shape.height,
      object.shape.width * 2,
      object.shape.height * 2
    )
    const paint = this.createPaint(object.paint)
    const path = new this.CanvasKit.Path()

    path.addOval(rect)

    if (object.shape.transform) path.transform(object.shape.transform)
    canvas.drawPath(path, paint)
    canvas.save()

    paint.delete()
    path.delete()
  }

  /**
   * Renders a circle on the provided canvas based on the given display object.
   *
   * @param canvas - The canvas to draw the circle onto.
   * @param object - The display object containing the circle's properties and paint settings.
   */
  private renderCircle(canvas: any, object: CanvasKitDisplayObject) {
    if (!object.paint) return

    const path = new this.CanvasKit.Path()
    const paint = this.createPaint(object.paint)

    path.addCircle(object.shape.x, object.shape.y, object.shape.radius)

    if (object.shape.transform) path.transform(object.shape.transform)
    canvas.drawPath(path, paint)
    canvas.save()

    paint.delete()
    path.delete()
  }

  /**
   * Renders an image on the provided canvas based on the given display object.
   *
   * @param canvas - The canvas to draw the image onto.
   * @param object - The display object containing the image data and transformation information.
   */
  private renderImage(canvas: any, object: CanvasKitDisplayObject) {
    const image = this.CanvasKit.MakeImageFromEncoded(object.imageBytes)
    const paint = new this.CanvasKit.Paint()

    // Since we are using matrix transformation, the images need to
    // be transformed using ImageFilter
    const filter = this.CanvasKit.ImageFilter.MakeMatrixTransform(
      object.shape.transform,
      { filter: this.CanvasKit.FilterMode.Linear },
      null
    )

    paint.setImageFilter(filter)
    canvas.drawImage(image, object.shape.x, object.shape.y, paint)
    canvas.save()

    paint.delete()
    image.delete()
  }

  /**
   * Creates a Paint object with the specified parameters.
   *
   * @param options - An object containing the parameters to create the Paint.
   * @returns A Paint object with the configured parameters.
   */
  private createPaint(options: CanvasKitPaint) {
    const { color, style, width } = options
    const paint = new this.CanvasKit.Paint()

    paint.setColor(
      this.CanvasKit.parseColorString("#" + color.toString(16).padStart(6, "0"))
    )

    const paintStyle = (() => {
      switch (style) {
        case "stroke": {
          return this.CanvasKit.PaintStyle.Stroke
        }
        case "fill": {
          return this.CanvasKit.PaintStyle.Fill
        }
      }
    })()

    paint.setStrokeWidth(width)
    paint.setStyle(paintStyle)
    paint.setAntiAlias(true)

    return paint
  }
}
