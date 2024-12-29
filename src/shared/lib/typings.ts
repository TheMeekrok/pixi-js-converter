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

export enum CanvasKitEvent {
  pointerup = "pointerup",
  pointerdown = "pointerdown",
}

export type CanvasKitDisplayObjectEvent = {
  fn: (...args: Array<any>) => void
}

export type CanvasKitDisplayObjectEvents = Partial<
  Record<CanvasKitEvent, CanvasKitDisplayObjectEvent>
>

export type CanvasKitDisplayObject = {
  tag: CanvasKitDisplayObjectTag
  shape: CanvasKitShape
  events: CanvasKitDisplayObjectEvents
  paint?: CanvasKitPaint
  imageBytes?: ArrayBuffer
}

export type Point = {
  x: number
  y: number
}
