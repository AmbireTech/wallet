export function formatFloatTokenAmount(amount, useGrouping = true, maximumSignificantDigits = 4) {
    if (isNaN(amount) || isNaN(parseFloat(amount))) return amount
    return parseFloat(amount).toLocaleString('fullwide', { useGrouping, maximumSignificantDigits })
}   