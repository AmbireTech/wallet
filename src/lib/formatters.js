export function formatFloatTokenAmount(amount, useGrouping = true, maximumSignificantDigits = 4) {
    return amount.toLocaleString('fullwide', { useGrouping, maximumSignificantDigits })
}   