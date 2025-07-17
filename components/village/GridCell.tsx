interface GridCellProps {
  x: number
  y: number
  type: 'grass' | 'house' | 'office' | 'break'
}

export default function GridCell({ x, y, type }: GridCellProps) {
  const getStyles = () => {
    switch (type) {
      case 'house':
        return 'bg-yellow-100 border-yellow-300 shadow-sm hover:shadow-md transition-shadow duration-200'
      case 'office':
        return 'bg-blue-100 border-blue-300 shadow-sm hover:shadow-md transition-shadow duration-200'
      case 'break':
        return 'bg-purple-100 border-purple-300 shadow-sm hover:shadow-md transition-shadow duration-200'
      default:
        return 'bg-green-100 border-green-200/50'
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
      className={`
        rounded-lg border-2 ${getStyles()} 
        flex items-center justify-center
        ${type !== 'grass' ? 'relative transform hover:scale-105 transition-transform duration-200 cursor-pointer' : ''}
      `}
      style={{
        gridColumn: x,
        gridRow: y,
      }}
    >
      <span className={`
        ${type !== 'grass' ? 'text-3xl' : ''} 
        ${type !== 'grass' ? 'drop-shadow-md' : ''}
      `}>
        {getLabel()}
      </span>
    </div>
  )
}