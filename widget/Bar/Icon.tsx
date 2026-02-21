import { Gtk } from "ags/gtk4"
import type { Accessor } from "gnim"

export interface IconProps extends Omit<JSX.IntrinsicElements["image"], "file"> {
  imageParentFolder?: string,
  imageSubFolder?: string,
  imageName: Accessor<string> | string,
  fileEnding?: string,
}

export default function Icon({
  imageParentFolder = `${SRC}/images`,
  imageSubFolder,
  imageName,
  fileEnding = ".svg",
  ...props
}: IconProps) {
  const filePrefix = `${imageParentFolder}${imageSubFolder == undefined ? "/" : `/${imageSubFolder}/`}`
  const file =
    typeof imageName === "function"
      ? imageName((name) => `${filePrefix}${name}${fileEnding}`)
      : `${filePrefix}${imageName}${fileEnding}`

  return (
    <Gtk.Image
      file={file} 
      {...props}
    />
  )
}