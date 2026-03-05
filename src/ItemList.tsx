import { exportQuoteToPdf } from './quotePdf'
import { useLanguage } from './LanguageContext'
import { useTranslation } from './i18n'
import { calculateModuleQuote, mergeMarkupIntoOverhead } from './domain'
import type { ProjectSettings, QuoteLineInput } from './domain'
import './ItemList.css'

interface ProjectDetails {
  projectName: string
  customerName: string
  preparedBy: string
  quoteNumber: string
}

interface ItemListProps {
  quoteLines: QuoteLineInput[]
  projectDetails: ProjectDetails
  projectSettings: ProjectSettings
}

export default function ItemList({
  quoteLines,
  projectDetails,
  projectSettings,
}: ItemListProps) {
  const { language } = useLanguage()
  const { t } = useTranslation(language)

  if (quoteLines.length === 0) {
    return null
  }

  const quote = calculateModuleQuote({
    projectSettings,
    lines: quoteLines,
  })

  const totals = quote.lines.reduce(
    (acc, line) => {
      const summary = mergeMarkupIntoOverhead(line)
      return {
        totalBase: acc.totalBase + summary.base,
        totalLabor: acc.totalLabor + summary.labor,
        totalOverhead: acc.totalOverhead + summary.overhead,
        grandTotal: acc.grandTotal + summary.total,
      }
    },
    {
      totalBase: 0,
      totalLabor: 0,
      totalOverhead: 0,
      grandTotal: 0,
    }
  )

  return (
    <div className="item-list-container">
      <div className="item-list-header">
        <h2>{t('itemSummary')}</h2>
        <button
          type="button"
          className="export-pdf-btn"
          onClick={() =>
            exportQuoteToPdf({
              projectDetails,
              items: quote.lines.map(line => {
                const overhead =
                  line.breakdown.overhead + line.breakdown.markup + line.breakdown.profit
                return {
                  itemName: line.description,
                  quantity: line.quantity.toString(),
                  unitPrice: line.baseRateExVat.toString(),
                  laborPercent:
                    line.baseAmountExVat > 0
                      ? ((line.breakdown.labor / line.baseAmountExVat) * 100).toString()
                      : '0',
                  overheadPercent:
                    line.baseAmountExVat > 0
                      ? ((overhead / line.baseAmountExVat) * 100).toString()
                      : '0',
                }
              }),
              totals,
              rows: quote.lines.map(line => {
                const summary = mergeMarkupIntoOverhead(line)
                return {
                  itemName: line.description,
                  quantity: line.quantity,
                  unitPrice: line.baseRateExVat,
                  baseCost: summary.base,
                  laborCost: summary.labor,
                  overheadCost: summary.overhead,
                  totalCost: summary.total,
                }
              }),
            })
          }
        >
          {t('exportQuotationPDF')}
        </button>
      </div>
      {quote.warnings.length > 0 && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#fff3cd',
            color: '#5c4500',
            borderRadius: '6px',
            fontSize: '0.9rem',
          }}
        >
          {quote.warnings.join(' ')}
        </div>
      )}
      <div className="table-wrapper">
        <table className="item-list-table">
          <thead>
            <tr>
              <th>{t('itemName_header')}</th>
              <th>{t('quantity_header')}</th>
              <th>{t('unitPrice_header')}</th>
              <th>{t('baseCost_header')}</th>
              <th>{t('laborCost_header')}</th>
              <th>{t('overheadCost_header')}</th>
              <th>{t('totalCost_header')}</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((line, index) => {
              const summary = mergeMarkupIntoOverhead(line)
              return (
                <tr key={index}>
                  <td>{line.description}</td>
                  <td className="numeric">{line.quantity.toFixed(2)}</td>
                  <td className="numeric">${line.baseRateExVat.toFixed(2)}</td>
                  <td className="numeric">${summary.base.toFixed(2)}</td>
                  <td className="numeric">${summary.labor.toFixed(2)}</td>
                  <td className="numeric">${summary.overhead.toFixed(2)}</td>
                  <td className="numeric total">${summary.total.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={3} className="totals-label">{t('grandTotals')}</td>
              <td className="numeric">${totals.totalBase.toFixed(2)}</td>
              <td className="numeric">${totals.totalLabor.toFixed(2)}</td>
              <td className="numeric">${totals.totalOverhead.toFixed(2)}</td>
              <td className="numeric grand-total" data-testid="quote-grand-total">
                ${(
                  projectSettings.vatMode === 'INCL'
                    ? quote.totalsIncVat
                    : totals.grandTotal
                ).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
