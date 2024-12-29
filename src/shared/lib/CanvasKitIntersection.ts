import {
  CanvasKitDisplayObject,
  CanvasKitDisplayObjectTag,
  CanvasKitShape,
  Point,
} from "./typings"

export class CanvasKitIntersection {
  /**
   * Determines if a point lies within a given display object.
   * @param point - The point to test.
   * @param object - The display object to test against.
   * @returns True if the point lies within the object, otherwise false.
   */
  static isPointInObject(point: Point, object: CanvasKitDisplayObject) {
    // If shape has applied transform matrix we transform point appliyng the inverted
    // matrix of shape
    point = object.shape.transform
      ? CanvasKitIntersection.transformPoint(point, object.shape.transform)
      : point

    const handler = (() => {
      switch (object.tag) {
        case CanvasKitDisplayObjectTag.PATH: {
          return CanvasKitIntersection.isPointInPath
        }
        case CanvasKitDisplayObjectTag.RECT: {
          return CanvasKitIntersection.isPointInRect
        }
        case CanvasKitDisplayObjectTag.OVAL: {
          return CanvasKitIntersection.isPointInOval
        }
        case CanvasKitDisplayObjectTag.CIRCLE: {
          return CanvasKitIntersection.isPointInCircle
        }
        case CanvasKitDisplayObjectTag.IMAGE: {
          return CanvasKitIntersection.isPointInRect
        }
      }
    })()

    return handler(point, object.shape)
  }

  /**
   * Determines if a point lies within a given path.
   * @param point - The point to test.
   * @param shape - The path to test against.
   * @returns True if the point lies within the path, otherwise false.
   */
  private static isPointInPath(point: Point, shape: CanvasKitShape) {
    if (!shape.path) return

    let inside = false
    const { x, y } = point

    for (
      let i = 0, j = shape.path.length - 2;
      i < shape.path.length;
      j = i, i += 2
    ) {
      const xi = shape.path[i],
        yi = shape.path[i + 1]
      const xj = shape.path[j],
        yj = shape.path[j + 1]
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
      if (intersect) inside = !inside
    }

    return inside
  }

  /**
   * Determines if a point lies within a given rectangle.
   * @param point - The point to test.
   * @param shape - The rectangle to test against.
   * @returns True if the point lies within the rectangle, otherwise false.
   */
  private static isPointInRect(point: Point, shape: CanvasKitShape) {
    if (!shape.width || !shape.height) return

    const { x, y } = point
    // If shape is rounded rect
    const radius = shape.radius ?? 0

    if (
      x >= shape.x + radius &&
      x <= shape.x + shape.width - radius &&
      y >= shape.y + radius &&
      y <= shape.y + shape.height - radius
    ) {
      return true
    }

    const cornerCircles = [
      { cx: shape.x + radius, cy: shape.y + radius },
      { cx: shape.x + shape.width - radius, cy: shape.y + radius },
      { cx: shape.x + radius, cy: shape.y + shape.height - radius },
      {
        cx: shape.x + shape.width - radius,
        cy: shape.y + shape.height - radius,
      },
    ]

    for (const corner of cornerCircles) {
      const dx = x - corner.cx
      const dy = y - corner.cy
      if (dx * dx + dy * dy <= Math.pow(radius, 2)) {
        return true
      }
    }

    return false
  }

  /**
   * Determines if a point lies within a given oval.
   * @param point - The point to test.
   * @param shape - The oval to test against.
   * @returns True if the point lies within the oval, otherwise false.
   */
  private static isPointInOval(point: Point, shape: CanvasKitShape) {
    if (!shape.width || !shape.height) return

    const { x, y } = point

    const cx = shape.x
    const cy = shape.y

    const rx = shape.width
    const ry = shape.height

    const dx = x - cx
    const dy = y - cy

    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1
  }

  /**
   * Determines if a point lies within a given circle.
   * @param point - The point to test.
   * @param shape - The circle to test against.
   * @returns True if the point lies within the circle, otherwise false.
   */
  private static isPointInCircle(point: Point, shape: CanvasKitShape) {
    if (!shape.radius) return

    const { x, y } = point

    const dx = x - shape.x
    const dy = y - shape.y

    return Math.pow(dx, 2) + Math.pow(dy, 2) <= Math.pow(shape.radius, 2)
  }

  /**
   * Calculates the inverse of a 3x3 transformation matrix.
   * @param matrix - The matrix to invert.
   * @returns The inverse matrix, or undefined if the matrix is singular.
   */
  private static invertMatrix(matrix: Array<number>) {
    const [a, b, c, d, e, f, g, h, i] = matrix

    const x = e * i - h * f
    const y = f * g - d * i
    const z = d * h - g * e
    const det = a * x + b * y + c * z

    if (det === 0) return

    return [
      x,
      c * h - b * i,
      b * f - c * e,
      y,
      a * i - c * g,
      d * c - a * f,
      z,
      g * b - a * h,
      a * e - d * b,
    ].map((v) => (v /= det))
  }

  /**
   * Transforms a point using the inverse of a given transformation matrix.
   * @param point - The point to transform.
   * @param matrix - The transformation matrix.
   * @returns The transformed point.
   */
  private static transformPoint(point: Point, matrix: Array<number>): Point {
    const invertedMatrix = CanvasKitIntersection.invertMatrix(matrix)
    if (!invertedMatrix) return point

    const [a, b, c, d, e, f] = invertedMatrix
    const { x, y } = point

    return {
      x: a * x + b * y + c,
      y: d * x + e * y + f,
    }
  }
}
