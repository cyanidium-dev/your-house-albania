import { describe, expect, it } from 'vitest'
import { buildingPolygonAt } from '../buildingPolygonAt'

const square = (x: number, y: number, size = 1) => [
  [x, y],
  [x + size, y],
  [x + size, y + size],
  [x, y + size],
  [x, y],
]

describe('buildingPolygonAt', () => {
  it('picks the one building of a merged block that holds the pin', () => {
    const block: GeoJSON.MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [[square(0, 0)], [square(2, 0)], [square(4, 0)]],
    }
    expect(buildingPolygonAt(block, 2.5, 0.5)).toEqual({ type: 'Polygon', coordinates: [square(2, 0)] })
  })

  it('returns nothing when the pin is between buildings or in a courtyard', () => {
    const block: GeoJSON.MultiPolygon = { type: 'MultiPolygon', coordinates: [[square(0, 0)], [square(2, 0)]] }
    expect(buildingPolygonAt(block, 1.5, 0.5)).toBeNull()
    const courtyard: GeoJSON.Polygon = { type: 'Polygon', coordinates: [square(0, 0, 10), square(4, 4, 2)] }
    expect(buildingPolygonAt(courtyard, 5, 5)).toBeNull()
    expect(buildingPolygonAt(courtyard, 1, 1)).toEqual(courtyard)
  })

  it('ignores geometry that is not a polygon', () => {
    expect(buildingPolygonAt({ type: 'Point', coordinates: [0, 0] }, 0, 0)).toBeNull()
  })
})
