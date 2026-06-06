const Product = require('../models/Product')

const getOrderStockAdjustments = (orderItems = []) => {
  const totals = new Map()
  orderItems.forEach((item) => {
    const productId = String(item?.product || '')
    if (!productId) return
    const qty = Math.max(1, Number(item?.qty || 1))
    totals.set(productId, (totals.get(productId) || 0) + qty)
  })
  return totals
}

const stockWasReserved = (order) => {
  if (!order) return false
  if (order.stockReserved === true) return true
  if (order.stockReserved === false) return false

  const status = String(order.status || '').toLowerCase()
  if (status === 'payment_pending' || status === 'cancelled') return false

  return true
}

const restoreOrderStock = async (order, session = null) => {
  const adjustments = getOrderStockAdjustments(order?.orderItems || [])
  if (!adjustments.size) return

  const ops = [...adjustments.entries()].map(([productId, qty]) => ({
    updateOne: {
      filter: { _id: productId },
      update: { $inc: { stock: qty } },
    },
  }))

  const options = {}
  if (session) options.session = session
  await Product.bulkWrite(ops, options)
}

const reserveOrderStock = async (order, session = null) => {
  const adjustments = getOrderStockAdjustments(order?.orderItems || [])
  if (!adjustments.size) return

  const query = Product.find({ _id: { $in: [...adjustments.keys()] } }).select('name stock')
  if (session) query.session(session)
  const inventoryProducts = await query
  const inventoryMap = new Map(inventoryProducts.map((product) => [String(product._id), product]))

  for (const [productId, qtyNeeded] of adjustments.entries()) {
    const product = inventoryMap.get(productId)
    if (!product) {
      throw new Error('Invalid product in order')
    }

    const availableStock = Math.max(0, Number(product.stock || 0))
    if (availableStock < qtyNeeded) {
      throw new Error(`${product.name} has only ${availableStock} item(s) left in stock`)
    }
  }

  const ops = inventoryProducts
    .map((product) => {
      const qtyNeeded = adjustments.get(String(product._id)) || 0
      if (!qtyNeeded) return null
      return {
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { stock: -qtyNeeded } },
        },
      }
    })
    .filter(Boolean)

  if (!ops.length) return

  const options = {}
  if (session) options.session = session
  await Product.bulkWrite(ops, options)
}

module.exports = {
  getOrderStockAdjustments,
  reserveOrderStock,
  restoreOrderStock,
  stockWasReserved,
}
