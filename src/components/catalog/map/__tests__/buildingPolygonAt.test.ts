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

describe('inflatePolygon', () => {
  it('pushes every vertex of a 20 m square about 0.8 m further from the centre', async () => {
    const { inflatePolygon } = await import('../buildingPolygonAt')
    const d = 10 / 111_320
    const sq: GeoJSON.Polygon = { type: 'Polygon', coordinates: [[[-d, -d], [d, -d], [d, d], [-d, d], [-d, -d]]] }
    const out = inflatePolygon(sq, 0.8).coordinates[0]
    expect(out).toHaveLength(5)
    const r0 = Math.hypot(d, d) * 111_320
    const r1 = Math.hypot(out[0][0], out[0][1]) * 111_320
    expect(r1 - r0).toBeCloseTo(0.8, 2)
  })
})
