import Icon from "../common/Icon"

interface ShutdownButtonProps {
  onClicked: () => void;
}

export default function ShutdownButton({ onClicked }: ShutdownButtonProps) {
  return (
    <button class="shutdown-button" onClicked={onClicked}>
      <Icon imageName="shutdown/base" />
    </button>
  )
}