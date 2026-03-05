interface Item {
  itemName: string
  quantity: string
  unitPrice: string
  laborPercent: string
  overheadPercent: string
}

interface ProjectDetails {
  projectName: string
  customerName: string
  preparedBy: string
  quoteNumber: string
}

interface CostSummary {
  totalBase: number
  totalLabor: number
  totalOverhead: number
  grandTotal: number
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const escapePdfText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')


const calculateItemCosts = (item: Item) => {
  const quantity = Number(item.quantity)
  const unitPrice = Number(item.unitPrice)
  const laborPercent = Number(item.laborPercent)
  const overheadPercent = Number(item.overheadPercent)

  const baseCost = quantity * unitPrice
  const laborCost = baseCost * (laborPercent / 100)
  const overheadCost = baseCost * (overheadPercent / 100)

  return {
    baseCost,
    laborCost,
    overheadCost,
    totalCost: baseCost + laborCost + overheadCost,
  }
}

class SimplePdf {
  private commands: string[] = []

  text(x: number, y: number, text: string, size = 11) {
    this.commands.push(`BT /F1 ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET`)
  }

  line(x1: number, y1: number, x2: number, y2: number, width = 1) {
    this.commands.push(`${width.toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`)
  }

  fillRect(x: number, y: number, w: number, h: number, r: number, g: number, b: number) {
    this.commands.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`)
  }

  toBlob(): Blob {
    const stream = this.commands.join('\n')

    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    ]

    let pdf = '%PDF-1.4\n'
    const offsets = [0]

    objects.forEach(obj => {
      offsets.push(pdf.length)
      pdf += `${obj}\n`
    })

    const xrefStart = pdf.length
    pdf += `xref\n0 ${objects.length + 1}\n`
    pdf += '0000000000 65535 f \n'
    for (let i = 1; i < offsets.length; i += 1) {
      pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`
    }

    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

    return new Blob([pdf], { type: 'application/pdf' })
  }
}

export const exportQuoteToPdf = ({
  projectDetails,
  items,
  totals,
}: {
  projectDetails: ProjectDetails
  items: Item[]
  totals: CostSummary
}) => {
  const pdf = new SimplePdf()

  const titleColor = { r: 0.31, g: 0.27, b: 0.9 }
  const lightGray = { r: 0.95, g: 0.96, b: 0.98 }

  pdf.fillRect(36, 780, 523, 42, titleColor.r, titleColor.g, titleColor.b)
  pdf.text(48, 796, 'Project Quotation', 18)
  pdf.text(380, 796, `Date: ${new Date().toLocaleDateString()}`, 10)

  pdf.fillRect(36, 730, 523, 36, lightGray.r, lightGray.g, lightGray.b)
  pdf.text(48, 750, `Quote #: ${projectDetails.quoteNumber || 'N/A'}`, 11)
  pdf.text(220, 750, `Prepared By: ${projectDetails.preparedBy || 'N/A'}`, 11)
  pdf.text(48, 736, `Project: ${projectDetails.projectName || 'N/A'}`, 11)
  pdf.text(320, 736, `Customer: ${projectDetails.customerName || 'N/A'}`, 11)

  const headers = ['Item', 'Qty', 'Unit', 'Base', 'Labor', 'Overhead', 'Total']
  const columns = [48, 170, 220, 290, 355, 430, 505]

  pdf.fillRect(36, 700, 523, 24, titleColor.r, titleColor.g, titleColor.b)
  headers.forEach((header, i) => {
    const x = i === headers.length - 1 ? columns[i] - 30 : columns[i]
    pdf.text(x, 708, header, 9)
  })

  let y = 686
  items.forEach(item => {
    if (y < 130) {
      return
    }
    const costs = calculateItemCosts(item)
    pdf.line(36, y - 2, 559, y - 2, 0.4)
    pdf.text(columns[0], y, item.itemName.slice(0, 20), 9)
    pdf.text(columns[1], y, Number(item.quantity).toFixed(2), 9)
    pdf.text(columns[2], y, currency.format(Number(item.unitPrice)), 9)
    pdf.text(columns[3], y, currency.format(costs.baseCost), 9)
    pdf.text(columns[4], y, currency.format(costs.laborCost), 9)
    pdf.text(columns[5], y, currency.format(costs.overheadCost), 9)
    pdf.text(columns[6] - 40, y, currency.format(costs.totalCost), 9)
    y -= 20
  })

  pdf.fillRect(320, 80, 239, 82, 0.93, 0.98, 0.95)
  pdf.line(320, 80, 559, 80)
  pdf.line(320, 162, 559, 162)
  pdf.text(332, 146, `Base Cost: ${currency.format(totals.totalBase)}`, 11)
  pdf.text(332, 130, `Labor Cost: ${currency.format(totals.totalLabor)}`, 11)
  pdf.text(332, 114, `Overhead Cost: ${currency.format(totals.totalOverhead)}`, 11)
  pdf.text(332, 96, `Final Price: ${currency.format(totals.grandTotal)}`, 13)

  pdf.text(36, 56, 'This quotation is valid for 30 days unless otherwise stated.', 10)

  const blob = pdf.toBlob()
  const quoteRef = (projectDetails.quoteNumber || 'quotation').replace(/[^a-zA-Z0-9-_]/g, '_')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${quoteRef}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
