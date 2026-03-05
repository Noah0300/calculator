import type { ProjectSettings, RoundingRules } from './types'

export const DEFAULT_ROUNDING_RULES: RoundingRules = {
  lineDecimals: 2,
  totalDecimals: 2,
  strategy: 'HALF_UP',
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  currency: 'EUR',
  vatMode: 'EXCL',
  defaultVatRate: 21,
  defaultMarkupPercent: 5,
  defaultOverheadPercent: 8,
  laborRatePerHour: 45,
  defaultProductivityPerHour: 6,
}
