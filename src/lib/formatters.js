export function formatFloatTokenAmount(amount, useGrouping = true, maximumFractionDigits = 18) {
    if (isNaN(amount) || isNaN(parseFloat(amount)) || !(typeof amount === 'number' || typeof amount === 'string')) return amount

    try {
        const minimumFractionDigits = 2
        return ((typeof amount === 'number') ? amount : parseFloat(amount))
            .toLocaleString(undefined,
                {
                    useGrouping,
                    maximumFractionDigits: Math.max(minimumFractionDigits, maximumFractionDigits),
                    minimumFractionDigits
                })
    } catch (err) {
        console.error(err)
        return amount
    }
}