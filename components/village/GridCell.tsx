interface GridCellProps {
  x: number
  y: number
  type: 'grass' | 'house' | 'office' | 'break'
}

export default function GridCell({ x, y, type }: GridCellProps) {
  const getBackgroundColor = () => {
    switch (type) {
      case 'house':
        return 'bg-yellow-200 border-yellow-400'
      case 'office':
        return 'bg-blue-200 border-blue-400'
      case 'break':
        return 'bg-purple-200 border-purple-400'
      default:
        return 'bg-green-200 border-green-300'
    }
  }

  const getLabel = () => {
    switch (type) {
      case 'house':
        return '🏠'
      case 'office':
        return '🏢'
      case 'break':
        return '☕'
      default:
        return ''
    }
  }

  return (
    <div
      className={`relative rounded border-2 ${getBackgroundColor()} flex items-center justify-center`}
      style={{
        gridColumn: x,
        gridRow: y,
      }}
    >
      <span className="text-2xl">{getLabel()}</span>
    </div>
  )
}