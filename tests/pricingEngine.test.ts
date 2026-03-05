import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PROJECT_SETTINGS,
  calculateModuleQuote,
  roundMoney,
} from '../src/domain'
import type { CalculateModuleQuoteInput, QuoteLineInput } from '../src/domain'

const createInput = (lines: QuoteLineInput[]): CalculateModuleQuoteInput => ({
  projectSettings: DEFAULT_PROJECT_SETTINGS,
  lines,
})

describe('pricing engine', () => {
  it('calculates a legacy-style line (base + labor + overhead)', () => {
    const result = calculateModuleQuote(
      createInput([
        {
          source: 'LEGACY_ITEM',
          description: 'Legacy line',
          unitType: 'STUK',
          quantity: 10,
          baseRateExVat: 20,
          laborSurchargePercent: 15,
          overheadPercent: 10,
          distribution: { materialPercent: 100 },
        },
      ])
    )

    expect(result.lines[0].baseAmountExVat).toBe(200)
    expect(result.lines[0].breakdown.labor).toBe(30)
    expect(result.lines[0].breakdown.overhead).toBe(20)
    expect(result.lines[0].totalExVat).toBe(250)
  })

  it('supports per-line VAT override', () => {
    const result = calculateModuleQuote(
      createInput([
        {
          source: 'MODULE',
          description: 'Line 21%',
          unitType: 'M2',
          quantity: 1,
          baseRateExVat: 100,
          distribution: { materialPercent: 100 },
        },
        {
          source: 'MODULE',
          description: 'Line 9%',
          unitType: 'M2',
          quantity: 1,
          baseRateExVat: 100,
          vatRate: 9,
          distribution: { materialPercent: 100 },
        },
      ])
    )

    expect(result.lines[0].vatAmount).toBe(21)
    expect(result.lines[1].vatAmount).toBe(9)
    expect(result.vatAmount).toBe(30)
  })

  it('returns INCL display total when vatMode is INCL', () => {
    const result = calculateModuleQuote({
      projectSettings: { ...DEFAULT_PROJECT_SETTINGS, vatMode: 'INCL' },
      lines: [
        {
          source: 'MODULE',
          description: 'INCL mode',
          unitType: 'M2',
          quantity: 1,
          baseRateExVat: 100,
          distribution: { materialPercent: 100 },
        },
      ],
    })

    expect(result.displayTotal).toBe(result.totalsIncVat)
  })

  it('returns EXCL display total when vatMode is EXCL', () => {
    const result = calculateModuleQuote(
      createInput([
        {
          source: 'MODULE',
          description: 'EXCL mode',
          unitType: 'M2',
          quantity: 1,
          baseRateExVat: 100,
          distribution: { materialPercent: 100 },
        },
      ])
    )

    expect(result.displayTotal).toBe(result.totalsExVat)
  })

  it('applies minimum charge and emits a warning', () => {
    const result = calculateModuleQuote(
      createInput([
        {
          source: 'MODULE',
          description: 'Minimum test',
          unitType: 'M2',
          quantity: 1,
          baseRateExVat: 10,
          minimumCharge: 150,
          distribution: { materialPercent: 100 },
        },
      ])
    )

    expect(result.lines[0].baseAmountExVat).toBe(150)
    expect(result.warnings.some(w => w.includes('minimum charge applied'))).toBe(true)
  })

  it('normalizes distribution above 100% and emits a warning', () => {
    const result = calculateModuleQuote(
      createInput([
        {
          source: 'MODULE',
          description: 'Distribution test',
          unitType: 'M2',
          quantity: 1,
          baseRateExVat: 100,
          distribution: {
            materialPercent: 90,
            laborPercent: 40,
            equipmentPercent: 20,
          },
        },
      ])
    )

    expect(
      result.warnings.some(w => w.includes('distribution exceeded 100%'))
    ).toBe(true)
    expect(result.lines[0].totalExVat).toBe(100)
  })

  it('keeps per-line rounding consistent with summed totals', () => {
    const result = calculateModuleQuote(
      createInput([
        {
          source: 'MODULE',
          description: 'Line A',
          unitType: 'M2',
          quantity: 3,
          baseRateExVat: 33.3333,
          laborSurchargePercent: 12.345,
          overheadPercent: 7.891,
          distribution: { materialPercent: 100 },
        },
        {
          source: 'MODULE',
          description: 'Line B',
          unitType: 'M2',
          quantity: 5,
          baseRateExVat: 17.7777,
          laborSurchargePercent: 3.333,
          overheadPercent: 2.222,
          distribution: { materialPercent: 100 },
        },
      ])
    )

    const sumEx = result.lines.reduce((acc, line) => acc + line.totalExVat, 0)
    const sumVat = result.lines.reduce((acc, line) => acc + line.vatAmount, 0)
    expect(result.totalsExVat).toBe(sumEx)
    expect(result.vatAmount).toBe(sumVat)
    expect(result.totalsIncVat).toBe(result.totalsExVat + result.vatAmount)
  })

  it('supports BANKERS rounding strategy', () => {
    expect(roundMoney(1.005, 2, 'BANKERS')).toBe(1)
    expect(roundMoney(1.015, 2, 'BANKERS')).toBe(1.02)
  })

  it('converts input rate when rateIncludesVat is true', () => {
    const result = calculateModuleQuote(
      createInput([
        {
          source: 'MODULE',
          description: 'Rate incl VAT',
          unitType: 'M2',
          quantity: 1,
          baseRateExVat: 121,
          rateIncludesVat: true,
          vatRate: 21,
          distribution: { materialPercent: 100 },
        },
      ])
    )

    expect(result.lines[0].baseRateExVat).toBe(100)
    expect(result.lines[0].totalExVat).toBe(100)
  })

  it('keeps rounded breakdown sum equal to line total', () => {
    const result = calculateModuleQuote(
      createInput([
        {
          source: 'MODULE',
          description: 'Breakdown rounding',
          unitType: 'M2',
          quantity: 2.75,
          baseRateExVat: 47.91,
          laborSurchargePercent: 8.5,
          overheadPercent: 6.5,
          markupPercent: 2.75,
          profitPercent: 1.95,
          distribution: {
            materialPercent: 37.5,
            laborPercent: 44.2,
            equipmentPercent: 10.1,
            subcontractorPercent: 3.3,
          },
        },
      ])
    )

    const line = result.lines[0]
    const breakdownSum = Object.values(line.breakdown).reduce(
      (sum, value) => sum + value,
      0
    )
    expect(breakdownSum).toBe(line.totalExVat)
  })

  it('throws for empty lines', () => {
    expect(() =>
      calculateModuleQuote({
        projectSettings: DEFAULT_PROJECT_SETTINGS,
        lines: [],
      })
    ).toThrow()
  })
})
