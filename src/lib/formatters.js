export function formatFloatTokenAmount(amount, useGrouping = true, maximumSignificantDigits = 4) {
    if (isNaN(amount) || isNaN(parseFloat(amount)) || !(typeof amount === 'number' || typeof amount === 'string')) return amount
    return ((typeof amount === 'number') ? amount : parseFloat(amount)).toLocaleString('fullwide', { useGrouping, maximumSignificantDigits })
}   