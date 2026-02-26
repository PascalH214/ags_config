import { Gtk } from "ags/gtk4"
import { createComputed, type Accessor } from "gnim"

type MaybeAccessor<T> = T | Accessor<T>
const get = <T,>(v: MaybeAccessor<T>): T => (typeof v === "function" ? (v as Accessor<T>)() : v)

export interface IconProps extends Omit<JSX.IntrinsicElements["image"], "file"> {
  imageParentFolder?: MaybeAccessor<string>
  imageSubFolder?: MaybeAccessor<string | undefined>
  imageName: MaybeAccessor<string>
  fileEnding?: string
}

export default function Icon({
  imageParentFolder = `${SRC}/images`,
  imageSubFolder,
  imageName,
  fileEnding = ".svg",
  class: incomingClass,
  ...props
}: IconProps) {
  const filePrefix = createComputed(() => {
    const parent = get(imageParentFolder)
    const sub = imageSubFolder === undefined ? undefined : get(imageSubFolder)
    return `${parent}${sub == undefined ? "/" : `/${sub}/`}`
  })

  const file = createComputed(() => {
    const prefix = filePrefix()
    const name = get(imageName)
    return `${prefix}${name}${fileEnding}`
  })

  const mergedClass = incomingClass == undefined ? "image" : `image ${incomingClass}`

  return (
    <Gtk.Image
      file={file}
      class={mergedClass}
      {...props}
    />
  )
}