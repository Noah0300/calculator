import type { CostBreakdown, RoundingStrategy } from './types'

export const roundMoney = (
  value: number,
  decimals: number,
  strategy: RoundingStrategy
): number => {
  const factor = 10 ** decimals
  if (strategy === 'BANKERS') {
    const scaled = value * factor
    const floor = Math.floor(scaled)
    const diff = scaled - floor
    const epsilon = 1e-10
    if (diff > 0.5 + epsilon) {
      return (floor + 1) / factor
    }
    if (diff < 0.5 - epsilon) {
      return floor / factor
    }
    return (floor % 2 === 0 ? floor : floor + 1) / factor
  }

  return Math.round((value + Number.EPSILON) * factor) / factor
}

const rebalanceRoundedParts = (
  rounded: number[],
  raw: number[],
  target: number,
  decimals: number,
  strategy: RoundingStrategy
): number[] => {
  const step = 1 / 10 ** decimals
  let current = roundMoney(rounded.reduce((sum, v) => sum + v, 0), decimals, strategy)
  const diff = roundMoney(target - current, decimals, strategy)
  const stepsToAdjust = Math.round(diff / step)

  if (stepsToAdjust === 0) {
    return rounded
  }

  const indexes = raw
    .map((value, index) => ({
      index,
      remainder: value - rounded[index],
    }))
    .sort((a, b) =>
      stepsToAdjust > 0
        ? b.remainder - a.remainder
        : a.remainder - b.remainder
    )

  const adjusted = [...rounded]
  for (let i = 0; i < Math.abs(stepsToAdjust); i += 1) {
    const pick = indexes[i % indexes.length]
    adjusted[pick.index] = roundMoney(
      adjusted[pick.index] + (stepsToAdjust > 0 ? step : -step),
      decimals,
      strategy
    )
  }

  current = roundMoney(adjusted.reduce((sum, v) => sum + v, 0), decimals, strategy)
  if (current !== target) {
    adjusted[adjusted.length - 1] = roundMoney(
      adjusted[adjusted.length - 1] + (target - current),
      decimals,
      strategy
    )
  }
  return adjusted
}

export const roundBreakdownToTotal = (
  raw: CostBreakdown,
  target: number,
  decimals: number,
  strategy: RoundingStrategy
): CostBreakdown => {
  const keys: Array<keyof CostBreakdown> = [
    'material',
    'labor',
    'equipment',
    'subcontractor',
    'markup',
    'overhead',
    'profit',
  ]

  const rawParts = keys.map(key => raw[key])
  const roundedParts = rawParts.map(value => roundMoney(value, decimals, strategy))
  const normalizedParts = rebalanceRoundedParts(
    roundedParts,
    rawParts,
    target,
    decimals,
    strategy
  )

  return keys.reduce(
    (acc, key, index) => {
      acc[key] = normalizedParts[index]
      return acc
    },
    {
      material: 0,
      labor: 0,
      equipment: 0,
      subcontractor: 0,
      markup: 0,
      overhead: 0,
      profit: 0,
    } as CostBreakdown
  )
}
