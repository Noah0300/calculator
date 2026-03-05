import { z } from 'zod'
import {
  DEFAULT_PROJECT_SETTINGS,
  DEFAULT_ROUNDING_RULES,
} from './projectSettings'

const percentSchema = z.number().finite().min(0).max(500)

const roundingRulesSchema = z.object({
  lineDecimals: z.number().int().min(0).max(4),
  totalDecimals: z.number().int().min(0).max(4),
  strategy: z.enum(['HALF_UP', 'BANKERS']),
})

const projectSettingsSchema = z.object({
  currency: z.literal('EUR'),
  vatMode: z.enum(['EXCL', 'INCL']),
  defaultVatRate: percentSchema.max(100),
  defaultMarkupPercent: percentSchema,
  defaultOverheadPercent: percentSchema,
  laborRatePerHour: z.number().finite().positive().optional(),
  defaultProductivityPerHour: z.number().finite().positive().optional(),
})

const distributionSchema = z.object({
  materialPercent: percentSchema,
  laborPercent: percentSchema,
  equipmentPercent: percentSchema,
  subcontractorPercent: percentSchema,
})

const quoteLineInputSchema = z.object({
  id: z.string().min(1).optional(),
  source: z.enum(['MODULE', 'LEGACY_ITEM']),
  moduleId: z.string().min(1).optional(),
  description: z.string().trim().min(1),
  unitType: z.enum(['M2', 'M3', 'M1', 'STUK', 'UUR']),
  quantity: z.number().finite().positive(),
  baseRateExVat: z.number().finite().nonnegative(),
  vatRate: percentSchema.max(100).optional(),
  rateIncludesVat: z.boolean().optional(),
  wasteFactor: z.number().finite().positive().optional(),
  complexityFactor: z.number().finite().positive().optional(),
  setupCost: z.number().finite().min(0).optional(),
  minimumCharge: z.number().finite().min(0).optional(),
  roundingRules: roundingRulesSchema.partial().optional(),
  laborSurchargePercent: percentSchema.optional(),
  overheadPercent: percentSchema.optional(),
  markupPercent: percentSchema.optional(),
  profitPercent: percentSchema.optional(),
  distribution: distributionSchema.partial().optional(),
})

export const calculateModuleQuoteInputSchema = z.object({
  projectSettings: projectSettingsSchema.default(DEFAULT_PROJECT_SETTINGS),
  lines: z.array(quoteLineInputSchema).min(1),
})

export const validateCalculateModuleQuoteInput = (input: unknown) =>
  calculateModuleQuoteInputSchema.parse(input)

export const validateRoundingRules = (input: unknown) =>
  roundingRulesSchema.parse(input ?? DEFAULT_ROUNDING_RULES)
