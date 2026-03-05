import { DEFAULT_PROJECT_SETTINGS, DEFAULT_ROUNDING_RULES } from './projectSettings'
import { getModuleById } from './modules'
import type {
  CalculatedQuoteLine,
  CostBreakdown,
  ProjectSettings,
  QuoteLineInput,
} from './types'

export interface LegacyItemInput {
  itemName: string
  quantity: string
  unitPrice: string
  laborPercent: string
  overheadPercent: string
}

const toNumber = (value: string, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const legacyItemToQuoteLine = (
  item: LegacyItemInput,
  projectSettings: ProjectSettings = DEFAULT_PROJECT_SETTINGS
): QuoteLineInput => {
  const description = item.itemName.trim()
  const quantity = Math.max(0.0001, toNumber(item.quantity, 0))
  const baseRateExVat = Math.max(0, toNumber(item.unitPrice, 0))
  const laborPercent = Math.max(0, toNumber(item.laborPercent, 0))
  const overheadPercent = Math.max(0, toNumber(item.overheadPercent, 0))

  return {
    source: 'LEGACY_ITEM',
    description: description || 'Legacy item',
    unitType: 'STUK',
    quantity,
    baseRateExVat,
    vatRate: projectSettings.defaultVatRate,
    wasteFactor: 1,
    complexityFactor: 1,
    setupCost: 0,
    minimumCharge: 0,
    roundingRules: DEFAULT_ROUNDING_RULES,
    laborSurchargePercent: laborPercent,
    overheadPercent,
    markupPercent: 0,
    profitPercent: 0,
    distribution: {
      materialPercent: 100,
      laborPercent: 0,
      equipmentPercent: 0,
      subcontractorPercent: 0,
    },
  }
}

export const createQuoteLineFromModule = (
  moduleId: string,
  quantity: number,
  overrides: Partial<QuoteLineInput> = {}
): QuoteLineInput | null => {
  const module = getModuleById(moduleId)
  if (!module) {
    return null
  }

  return {
    source: 'MODULE',
    moduleId: module.id,
    description: module.name,
    unitType: module.unitType,
    quantity,
    baseRateExVat: module.baseRateExVat,
    vatRate: module.defaults.vatRate,
    wasteFactor: module.defaults.wasteFactor,
    complexityFactor: module.defaults.complexityFactor,
    setupCost: module.defaults.setupCost,
    minimumCharge: module.defaults.minimumCharge,
    roundingRules: module.defaults.roundingRules,
    laborSurchargePercent: module.defaults.laborSurchargePercent,
    overheadPercent: module.defaults.overheadPercent,
    markupPercent: module.defaults.markupPercent,
    profitPercent: module.defaults.profitPercent,
    distribution: module.defaults.distribution,
    ...overrides,
  }
}

const cloneBreakdown = (breakdown: CostBreakdown): CostBreakdown => ({
  material: breakdown.material,
  labor: breakdown.labor,
  equipment: breakdown.equipment,
  subcontractor: breakdown.subcontractor,
  markup: breakdown.markup,
  overhead: breakdown.overhead,
  profit: breakdown.profit,
})

export const mergeMarkupIntoOverhead = (
  line: CalculatedQuoteLine
): {
  base: number
  labor: number
  overhead: number
  total: number
  breakdown: CostBreakdown
} => {
  const breakdown = cloneBreakdown(line.breakdown)
  const overhead = breakdown.overhead + breakdown.markup + breakdown.profit
  return {
    base: line.baseAmountExVat,
    labor: breakdown.labor,
    overhead,
    total: line.totalExVat,
    breakdown,
  }
}
