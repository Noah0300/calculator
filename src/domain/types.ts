export type UnitType = 'M2' | 'M3' | 'M1' | 'STUK' | 'UUR'

export type VatMode = 'EXCL' | 'INCL'

export type Currency = 'EUR'

export type RoundingStrategy = 'HALF_UP' | 'BANKERS'

export interface RoundingRules {
  lineDecimals: number
  totalDecimals: number
  strategy: RoundingStrategy
}

export interface ProjectSettings {
  currency: Currency
  vatMode: VatMode
  defaultVatRate: number
  defaultMarkupPercent: number
  defaultOverheadPercent: number
  laborRatePerHour?: number
  defaultProductivityPerHour?: number
}

export interface CostBreakdown {
  material: number
  labor: number
  equipment: number
  subcontractor: number
  markup: number
  overhead: number
  profit: number
}

export interface BreakdownDistribution {
  materialPercent: number
  laborPercent: number
  equipmentPercent: number
  subcontractorPercent: number
}

export interface QuoteLineInput {
  id?: string
  source: 'MODULE' | 'LEGACY_ITEM'
  moduleId?: string
  description: string
  unitType: UnitType
  quantity: number
  baseRateExVat: number
  vatRate?: number
  rateIncludesVat?: boolean
  wasteFactor?: number
  complexityFactor?: number
  setupCost?: number
  minimumCharge?: number
  roundingRules?: Partial<RoundingRules>
  laborSurchargePercent?: number
  overheadPercent?: number
  markupPercent?: number
  profitPercent?: number
  distribution?: Partial<BreakdownDistribution>
}

export interface CalculatedQuoteLine {
  id: string
  source: 'MODULE' | 'LEGACY_ITEM'
  moduleId?: string
  description: string
  unitType: UnitType
  quantity: number
  baseRateExVat: number
  vatRate: number
  baseAmountExVat: number
  totalExVat: number
  vatAmount: number
  totalIncVat: number
  breakdown: CostBreakdown
}

export interface ModuleDefaults {
  wasteFactor: number
  complexityFactor: number
  setupCost: number
  minimumCharge: number
  roundingRules: RoundingRules
  vatRate?: number
  distribution: BreakdownDistribution
  laborSurchargePercent: number
  overheadPercent: number
  markupPercent: number
  profitPercent: number
}

export interface PricingModule {
  id: string
  name: string
  unitType: UnitType
  baseRateExVat: number
  defaults: ModuleDefaults
}

export interface CalculateModuleQuoteInput {
  projectSettings: ProjectSettings
  lines: QuoteLineInput[]
}

export interface ModuleQuoteResult {
  lines: CalculatedQuoteLine[]
  totalsExVat: number
  vatAmount: number
  totalsIncVat: number
  displayTotal: number
  warnings: string[]
}
