import { execFileSync } from 'node:child_process'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

type BoundingBox = {
  width: number
  height: number
  x: number
  y: number
}

function getLargestOpaqueComponent(filePath: string): BoundingBox {
  const output = execFileSync(
    'magick',
    [
      filePath,
      '-alpha',
      'extract',
      '-threshold',
      '50%',
      '-define',
      'connected-components:verbose=true',
      '-connected-components',
      '8',
      'null:',
    ],
    { encoding: 'utf8' }
  )

  const whiteComponentLines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.endsWith('srgb(255,255,255)'))

  const largestComponent = whiteComponentLines[0]
  if (!largestComponent) {
    throw new Error(`opaque component를 찾을 수 없습니다: ${output}`)
  }

  const match = largestComponent.match(/(\d+)x(\d+)\+(\d+)\+(\d+)/)
  if (!match) {
    throw new Error(`component bounding box를 해석할 수 없습니다: ${largestComponent}`)
  }

  return {
    width: Number(match[1]),
    height: Number(match[2]),
    x: Number(match[3]),
    y: Number(match[4]),
  }
}

describe('character home frame alignment', () => {
  it('character2의 home 프레임은 크기 차이가 과하게 벌어지지 않습니다', () => {
    const home1 = getLargestOpaqueComponent(
      path.resolve(__dirname, '../public/characters/character2/home_1.webp')
    )
    const home2 = getLargestOpaqueComponent(
      path.resolve(__dirname, '../public/characters/character2/home_2.webp')
    )

    expect(Math.abs(home1.width - home2.width)).toBeLessThanOrEqual(12)
    expect(Math.abs(home1.height - home2.height)).toBeLessThanOrEqual(12)
    expect(Math.abs(home1.x - home2.x)).toBeLessThanOrEqual(4)
    expect(Math.abs(home1.y - home2.y)).toBeLessThanOrEqual(12)
  })
})
