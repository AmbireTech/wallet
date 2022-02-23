export function formatFloatTokenAmount(amount, useGrouping = true, maximumFractionDigits = 18) {
    if (isNaN(amount) || isNaN(parseFloat(amount)) || !(typeof amount === 'number' || typeof amount === 'string')) return amount
    return ((typeof amount === 'number') ? amount : parseFloat(amount)).toLocaleString(undefined, { useGrouping, maximumFractionDigits, minimumFractionDigits: 2 })
}