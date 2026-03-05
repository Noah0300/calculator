import './ItemList.css'

interface Item {
  itemName: string
  quantity: string
  unitPrice: string
  laborPercent: string
  overheadPercent: string
}

interface ItemListProps {
  items: Item[]
}

export default function ItemList({ items }: ItemListProps) {
  const calculateItemCosts = (item: Item) => {
    const quantity = Number(item.quantity)
    const unitPrice = Number(item.unitPrice)
    const laborPercent = Number(item.laborPercent)
    const overheadPercent = Number(item.overheadPercent)

    const baseCost = quantity * unitPrice
    const laborCost = baseCost * (laborPercent / 100)
    const overheadCost = baseCost * (overheadPercent / 100)
    const totalCost = baseCost + laborCost + overheadCost

    return {
      baseCost,
      laborCost,
      overheadCost,
      totalCost,
    }
  }

  const calculateTotalByCategory = () => {
    let totalBase = 0
    let totalLabor = 0
    let totalOverhead = 0

    items.forEach(item => {
      const costs = calculateItemCosts(item)
      totalBase += costs.baseCost
      totalLabor += costs.laborCost
      totalOverhead += costs.overheadCost
    })

    return {
      totalBase,
      totalLabor,
      totalOverhead,
      grandTotal: totalBase + totalLabor + totalOverhead,
    }
  }

  if (items.length === 0) {
    return null
  }

  const totals = calculateTotalByCategory()

  return (
    <div className="item-list-container">
      <h2>Item Summary</h2>
      <div className="table-wrapper">
        <table className="item-list-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Base Cost</th>
              <th>Labor Cost</th>
              <th>Overhead Cost</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const costs = calculateItemCosts(item)
              return (
                <tr key={index}>
                  <td>{item.itemName}</td>
                  <td className="numeric">{parseFloat(item.quantity).toFixed(2)}</td>
                  <td className="numeric">${parseFloat(item.unitPrice).toFixed(2)}</td>
                  <td className="numeric">${costs.baseCost.toFixed(2)}</td>
                  <td className="numeric">${costs.laborCost.toFixed(2)}</td>
                  <td className="numeric">${costs.overheadCost.toFixed(2)}</td>
                  <td className="numeric total">${costs.totalCost.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={3} className="totals-label">Grand Totals</td>
              <td className="numeric">${totals.totalBase.toFixed(2)}</td>
              <td className="numeric">${totals.totalLabor.toFixed(2)}</td>
              <td className="numeric">${totals.totalOverhead.toFixed(2)}</td>
              <td className="numeric grand-total">${totals.grandTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
