import { DEFAULT_ROUNDING_RULES } from './projectSettings'
import { roundBreakdownToTotal, roundMoney } from './rounding'
import type {
  BreakdownDistribution,
  CalculateModuleQuoteInput,
  CostBreakdown,
  ModuleQuoteResult,
  QuoteLineInput,
  RoundingRules,
} from './types'
import { validateCalculateModuleQuoteInput } from './validators'

const safeDistribution = (
  line: QuoteLineInput,
  warnings: string[]
): BreakdownDistribution => {
  const distribution: BreakdownDistribution = {
    materialPercent: line.distribution?.materialPercent ?? 100,
    laborPercent: line.distribution?.laborPercent ?? 0,
    equipmentPercent: line.distribution?.equipmentPercent ?? 0,
    subcontractorPercent: line.distribution?.subcontractorPercent ?? 0,
  }

  const sum =
    distribution.materialPercent +
    distribution.laborPercent +
    distribution.equipmentPercent +
    distribution.subcontractorPercent

  if (sum <= 100) {
    return distribution
  }

  warnings.push(
    `Line "${line.description}": breakdown distribution exceeded 100% and was normalized.`
  )

  return {
    materialPercent: (distribution.materialPercent / sum) * 100,
    laborPercent: (distribution.laborPercent / sum) * 100,
    equipmentPercent: (distribution.equipmentPercent / sum) * 100,
    subcontractorPercent: (distribution.subcontractorPercent / sum) * 100,
  }
}

const resolveRoundingRules = (line: QuoteLineInput): RoundingRules => ({
  lineDecimals: line.roundingRules?.lineDecimals ?? DEFAULT_ROUNDING_RULES.lineDecimals,
  totalDecimals:
    line.roundingRules?.totalDecimals ?? DEFAULT_ROUNDING_RULES.totalDecimals,
  strategy: line.roundingRules?.strategy ?? DEFAULT_ROUNDING_RULES.strategy,
})

const calculateLineBase = (line: QuoteLineInput, vatRate: number): number => {
  const wasteFactor = line.wasteFactor ?? 1
  const complexityFactor = line.complexityFactor ?? 1
  const setupCost = line.setupCost ?? 0
  const minimumCharge = line.minimumCharge ?? 0

  const rateExVat = line.rateIncludesVat
    ? line.baseRateExVat / (1 + vatRate / 100)
    : line.baseRateExVat

  const calculated = line.quantity * rateExVat * wasteFactor * complexityFactor + setupCost
  return Math.max(calculated, minimumCharge)
}

const calculateRawBreakdown = (
  baseAmount: number,
  line: QuoteLineInput,
  distribution: BreakdownDistribution
): CostBreakdown => {
  const laborSurchargePercent = line.laborSurchargePercent ?? 0
  const overheadPercent = line.overheadPercent ?? 0
  const markupPercent = line.markupPercent ?? 0
  const profitPercent = line.profitPercent ?? 0

  const material = baseAmount * (distribution.materialPercent / 100)
  const laborBase = baseAmount * (distribution.laborPercent / 100)
  const equipment = baseAmount * (distribution.equipmentPercent / 100)
  const subcontractor = baseAmount * (distribution.subcontractorPercent / 100)
  const allocated = material + laborBase + equipment + subcontractor
  const markupBase = Math.max(0, baseAmount - allocated)

  const laborSurcharge = baseAmount * (laborSurchargePercent / 100)
  const overhead = baseAmount * (overheadPercent / 100)
  const markupSurcharge = baseAmount * (markupPercent / 100)
  const profit = baseAmount * (profitPercent / 100)

  return {
    material,
    labor: laborBase + laborSurcharge,
    equipment,
    subcontractor,
    markup: markupBase + markupSurcharge,
    overhead,
    profit,
  }
}

export const calculateModuleQuote = (
  rawInput: CalculateModuleQuoteInput
): ModuleQuoteResult => {
  const input = validateCalculateModuleQuoteInput(rawInput)
  const warnings: string[] = []

  const lines = input.lines.map((line, index) => {
    const rounding = resolveRoundingRules(line)
    const vatRate = line.vatRate ?? input.projectSettings.defaultVatRate
    const baseAmount = calculateLineBase(line, vatRate)

    const estimatedBaseWithoutMinimum = calculateLineBase(
      { ...line, minimumCharge: 0 },
      vatRate
    )
    if ((line.minimumCharge ?? 0) > 0 && estimatedBaseWithoutMinimum < (line.minimumCharge ?? 0)) {
      warnings.push(
        `Line "${line.description}": minimum charge applied (${line.minimumCharge?.toFixed(2)}).`
      )
    }

    const distribution = safeDistribution(line, warnings)
    const rawBreakdown = calculateRawBreakdown(baseAmount, line, distribution)
    const rawTotalExVat = Object.values(rawBreakdown).reduce((sum, value) => sum + value, 0)
    const roundedTotalExVat = roundMoney(
      rawTotalExVat,
      rounding.lineDecimals,
      rounding.strategy
    )

    const breakdown = roundBreakdownToTotal(
      rawBreakdown,
      roundedTotalExVat,
      rounding.lineDecimals,
      rounding.strategy
    )

    const totalExVat = roundMoney(
      Object.values(breakdown).reduce((sum, value) => sum + value, 0),
      rounding.lineDecimals,
      rounding.strategy
    )
    const vatAmount = roundMoney(
      totalExVat * (vatRate / 100),
      rounding.lineDecimals,
      rounding.strategy
    )
    const totalIncVat = roundMoney(
      totalExVat + vatAmount,
      rounding.lineDecimals,
      rounding.strategy
    )

    return {
      id: line.id ?? `line-${index + 1}`,
      source: line.source,
      moduleId: line.moduleId,
      description: line.description,
      unitType: line.unitType,
      quantity: line.quantity,
      baseRateExVat: line.rateIncludesVat
        ? roundMoney(line.baseRateExVat / (1 + vatRate / 100), 4, rounding.strategy)
        : line.baseRateExVat,
      vatRate,
      baseAmountExVat: roundMoney(baseAmount, rounding.lineDecimals, rounding.strategy),
      totalExVat,
      vatAmount,
      totalIncVat,
      breakdown,
    }
  })

  const totalsExVat = roundMoney(
    lines.reduce((sum, line) => sum + line.totalExVat, 0),
    DEFAULT_ROUNDING_RULES.totalDecimals,
    DEFAULT_ROUNDING_RULES.strategy
  )
  const vatAmount = roundMoney(
    lines.reduce((sum, line) => sum + line.vatAmount, 0),
    DEFAULT_ROUNDING_RULES.totalDecimals,
    DEFAULT_ROUNDING_RULES.strategy
  )
  const totalsIncVat = roundMoney(
    totalsExVat + vatAmount,
    DEFAULT_ROUNDING_RULES.totalDecimals,
    DEFAULT_ROUNDING_RULES.strategy
  )

  return {
    lines,
    totalsExVat,
    vatAmount,
    totalsIncVat,
    displayTotal: input.projectSettings.vatMode === 'INCL' ? totalsIncVat : totalsExVat,
    warnings,
  }
}
