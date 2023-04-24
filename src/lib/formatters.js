export function formatFloatTokenAmount(amount, useGrouping = true, maximumFractionDigits = 18) {
  if (
    isNaN(amount) ||
    isNaN(parseFloat(amount)) ||
    !(typeof amount === 'number' || typeof amount === 'string')
  )
    return amount

  try {
    const minimumFractionDigits = Math.min(2, maximumFractionDigits || 0)
    return (typeof amount === 'number' ? amount : parseFloat(amount)).toLocaleString(undefined, {
      useGrouping,
      maximumFractionDigits: Math.max(minimumFractionDigits, maximumFractionDigits),
      minimumFractionDigits
    })
  } catch (err) {
    console.error(err)
    return amount
  }
}

// Round a floating point number to a specific decimal places, i.e. 1.156 => 1.16
export function roundFloatingNumber(number, places = 2) {
  const decimals = 10 ** places

  return Math.round((number + Number.EPSILON) * decimals) / decimals
}
