export interface Opening {
  id: string
  name: string
  width: number
  height: number
}

export interface RoomMeasurement {
  id: string
  name: string
  length: number
  width: number
  height: number
  openings: Opening[]
}

export type SurfaceScope = 'FLOOR' | 'WALLS' | 'CEILING' | 'BOTH' | 'VOLUME'

export interface RoomTakeoffSummary {
  roomId: string
  roomName: string
  floorArea: number
  wallsArea: number
  ceilingArea: number
  openingsArea: number
  volume: number
  netArea: number
}

export interface TakeoffResult {
  scope: SurfaceScope
  roomSummaries: RoomTakeoffSummary[]
  subtotalArea: number
  wasteArea: number
  totalArea: number
  warnings: string[]
}

const clampToZero = (value: number) => (value < 0 ? 0 : value)

export const calculateFloorArea = (room: RoomMeasurement): number =>
  clampToZero(room.length * room.width)

export const calculateWallsArea = (room: RoomMeasurement): number =>
  clampToZero(room.width * room.height)

export const calculateCeilingArea = (room: RoomMeasurement): number =>
  clampToZero(room.length * room.width)

export const calculateOpeningsArea = (room: RoomMeasurement): number =>
  clampToZero(
    room.openings.reduce((sum, opening) => sum + opening.width * opening.height, 0)
  )

export const calculateVolume = (room: RoomMeasurement): number =>
  clampToZero(room.length * room.width * room.height)

export const calculateRoomNetArea = (
  room: RoomMeasurement,
  scope: SurfaceScope
): RoomTakeoffSummary => {
  const floorArea = calculateFloorArea(room)
  const wallsArea = calculateWallsArea(room)
  const ceilingArea = calculateCeilingArea(room)
  const openingsArea = calculateOpeningsArea(room)
  const volume = calculateVolume(room)
  const netWalls = clampToZero(wallsArea - openingsArea)

  let netArea = 0
  if (scope === 'FLOOR') {
    netArea = floorArea
  } else if (scope === 'WALLS') {
    netArea = netWalls
  } else if (scope === 'CEILING') {
    netArea = ceilingArea
  } else if (scope === 'VOLUME') {
    netArea = volume
  } else {
    netArea = netWalls + ceilingArea
  }

  return {
    roomId: room.id,
    roomName: room.name,
    floorArea,
    wallsArea,
    ceilingArea,
    openingsArea,
    volume,
    netArea,
  }
}

export const calculateTakeoffResult = ({
  rooms,
  scope,
  wastePercent = 0,
}: {
  rooms: RoomMeasurement[]
  scope: SurfaceScope
  wastePercent?: number
}): TakeoffResult => {
  const warnings: string[] = []
  const roomSummaries = rooms.map(room => {
    const summary = calculateRoomNetArea(room, scope)
    if (summary.openingsArea > summary.wallsArea && (scope === 'WALLS' || scope === 'BOTH')) {
      warnings.push(
        `Room "${room.name}": openings area exceeds walls area; walls clamped to 0.`
      )
    }
    return summary
  })

  const subtotalArea = roomSummaries.reduce((sum, room) => sum + room.netArea, 0)
  const wasteArea = subtotalArea * (wastePercent / 100)
  const totalArea = subtotalArea + wasteArea

  return {
    scope,
    roomSummaries,
    subtotalArea,
    wasteArea,
    totalArea,
    warnings,
  }
}
