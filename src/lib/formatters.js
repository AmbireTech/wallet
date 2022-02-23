export function formatFloatTokenAmount(amount, useGrouping = true, maximumSignificantDigits = 4) {
    if (isNaN(amount)) return amount
    return amount.toLocaleString('fullwide', { useGrouping, maximumSignificantDigits })
}   