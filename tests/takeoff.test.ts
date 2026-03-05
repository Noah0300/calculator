import { describe, expect, it } from 'vitest'
import {
  calculateCeilingArea,
  calculateFloorArea,
  calculateOpeningsArea,
  calculateRoomNetArea,
  calculateTakeoffResult,
  calculateWallsArea,
} from '../src/domain'

const baseRoom = {
  id: 'r1',
  name: 'Room 1',
  length: 5,
  width: 4,
  height: 2.8,
  openings: [],
}

describe('takeoff formulas', () => {
  it('calculates floor area as length * width', () => {
    expect(calculateFloorArea(baseRoom)).toBe(20)
  })

  it('calculates walls area as 2*(L+B)*H', () => {
    expect(calculateWallsArea(baseRoom)).toBeCloseTo(11.2, 5)
  })

  it('calculates ceiling area as L*B', () => {
    expect(calculateCeilingArea(baseRoom)).toBe(20)
  })

  it('sums opening area', () => {
    expect(
      calculateOpeningsArea({
        ...baseRoom,
        openings: [
          { id: 'o1', name: 'Door', width: 0.9, height: 2.1 },
          { id: 'o2', name: 'Window', width: 1.2, height: 1.5 },
        ],
      })
    ).toBeCloseTo(3.69, 5)
  })

  it('subtracts openings from wall area', () => {
    const summary = calculateRoomNetArea(
      {
        ...baseRoom,
        openings: [{ id: 'o1', name: 'Window', width: 1, height: 1.5 }],
      },
      'WALLS'
    )
    expect(summary.netArea).toBeCloseTo(9.7, 5)
  })

  it('supports BOTH mode (walls-openings + ceiling)', () => {
    const summary = calculateRoomNetArea(
      {
        ...baseRoom,
        openings: [{ id: 'o1', name: 'Window', width: 1, height: 1.5 }],
      },
      'BOTH'
    )
    expect(summary.netArea).toBeCloseTo(29.7, 5)
  })

  it('supports VOLUME mode for demolition', () => {
    const summary = calculateRoomNetArea(baseRoom, 'VOLUME')
    expect(summary.netArea).toBeCloseTo(56, 5)
  })

  it('clamps wall area to 0 when openings exceed walls', () => {
    const summary = calculateRoomNetArea(
      {
        ...baseRoom,
        openings: [{ id: 'o1', name: 'Huge', width: 20, height: 10 }],
      },
      'WALLS'
    )
    expect(summary.netArea).toBe(0)
  })

  it('calculates project total with waste', () => {
    const result = calculateTakeoffResult({
      rooms: [
        baseRoom,
        {
          ...baseRoom,
          id: 'r2',
          name: 'Room 2',
          length: 3,
          width: 4,
        },
      ],
      scope: 'FLOOR',
      wastePercent: 10,
    })

    expect(result.subtotalArea).toBe(32)
    expect(result.wasteArea).toBeCloseTo(3.2, 5)
    expect(result.totalArea).toBeCloseTo(35.2, 5)
  })

  it('returns warning when openings exceed wall area in WALLS scope', () => {
    const result = calculateTakeoffResult({
      rooms: [
        {
          ...baseRoom,
          openings: [{ id: 'o1', name: 'Huge', width: 20, height: 10 }],
        },
      ],
      scope: 'WALLS',
    })
    expect(result.warnings.length).toBe(1)
  })

  it('does not warn for FLOOR scope with large openings', () => {
    const result = calculateTakeoffResult({
      rooms: [
        {
          ...baseRoom,
          openings: [{ id: 'o1', name: 'Huge', width: 20, height: 10 }],
        },
      ],
      scope: 'FLOOR',
    })
    expect(result.warnings.length).toBe(0)
  })
})
