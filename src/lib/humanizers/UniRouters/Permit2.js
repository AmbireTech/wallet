import { Interface } from 'ethers/lib/utils'
import { token, getName } from 'lib/humanReadableTransactions'
import { constants } from 'ethers'

const recipientText = (humanizerInfo, recipient, txnFrom, extended = false) => recipient.toLowerCase() === txnFrom.toLowerCase()
  ? !extended ? ``: [] : !extended ? ` and send it to ${recipient}` : ['and send it to', { type: 'address', address: recipient, name: getName(humanizerInfo, recipient) }]

const deadlineText = (deadlineSecs, mined) => {
    if (mined) return ''
    const minute = 60000
    const deadline = deadlineSecs * 1000
    const diff = deadline - Date.now()
    if (diff < 0 && diff > -minute*2) return `, expired just now`
    // Disabled this: this is a bit of a hack cause we don't want it to show for mined txns
    // we don't really need it for pending ones, simply because we'll show the big error message instead
    //if (diff < 0) return `, expired ${Math.floor(-diff / minute)} minutes ago`
    if (diff < 0) return ''
    if (diff < minute) return `, expires in less than a minute`
    if (diff < 10*minute) return `, expires in ${Math.floor(diff / minute)} minutes`
    return ''
}

const toExtended = (action, word, recipient = [], tokenToApprove, expires = []) => {
  return [[
    action,
    ...recipient,
    word,
    {
      type: 'token',
      ...tokenToApprove
    },
    expires
  ]]
}

const Permit2 = (humanizerInfo) => {
  const ifacePermit2 = new Interface(humanizerInfo.abis.Permit2)

  return {
    [ifacePermit2.getSighash('approve')]: (txn, network, opts = {}) => {
        // token - the token address to approve
        // spender - the spender address to approve
        // amount - the approved amount of the token, type(uint160).max is treated as an unlimited allowance
        // expiration - the timestamp at which the approval is no longer valid, passing in 0 will expire the permissions at block.timestamp
        const [ params ] = ifacePermit2.parseTransaction(txn).args
        const approvedAddress = params.sender
        const tokenToApprove = params.token
        const name = getName(humanizerInfo, approvedAddress)
        const tokenName = getName(humanizerInfo, tokenToApprove)
       
        if (params.amount.eq(0)) {
            return !opts.extended
                ? [`Revoke approval for ${name} to use ${tokenName} ${deadlineText(params.expiration)}`]
                : toExtended(
                    'Revoke approval for',
                    'to use',
                    recipientText(humanizerInfo, approvedAddress, txn.from, true),
                    token(humanizerInfo, tokenToApprove, params.amount, true),
                    deadlineText(params.expiration, opts.mined)
                )
        }   

        if (opts.extended) return toExtended(
                'Approve',
                `to use${params.amount.eq(constants.MaxUint256) ? ' your' : ''}`,
                recipientText(humanizerInfo, approvedAddress, txn.from, true),
                token(humanizerInfo, tokenToApprove, params.amount, true),
                deadlineText(params.expiration, opts.mined)
            )

        if (params.amount.eq(constants.MaxUint256)) return [`Approve ${name} to use your ${tokenName}`]
        
        return [`Approve ${name} to use ${token(humanizerInfo, tokenToApprove, params.amount)}`]
    },
    [ifacePermit2.getSighash('permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)')]: (txn, network, opts = {}) => {
        // owner - the address of the token’s owner
        // permitSingle - constructed with the following:
        //     struct PermitSingle {
        //         // the permit data for a single token allowance
        //         PermitDetails details;
        //         // address permissioned on the allowed tokens
        //         address spender;
        //         // deadline on the permit signature
        //         uint256 sigDeadline;
        //     }
        
        //     struct PermitDetails {
        //         // ERC20 token address
        //         address token;
        //         // the maximum amount allowed to spend
        //         uint160 amount;
        //         // timestamp at which a spender's token allowances become invalid
        //         uint48 expiration;
        //         // an incrementing value indexed per owner,token,and spender for each signature
        //         uint48 nonce;
        //     }
        // signature - the signature over the permit data. Supports EOA signatures, compact signatures defined by EIP-2098, and contract signatures defined by EIP-1271
        
        return []
    },
    [ifacePermit2.getSighash('permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)')]: (txn, network, opts = {}) => {
        // owner - the address of the token’s owner
        // permitBatch - constructed with the following:
        //     struct PermitBatch {
        //         // the permit data for multiple token allowances
        //         PermitDetails[] details;
        //         // address permissioned on the allowed tokens
        //         address spender;
        //         // deadline on the permit signature
        //         uint256 sigDeadline;
        //     }
        //     struct PermitDetails {
        //         // ERC20 token address
        //         address token;
        //         // the maximum amount allowed to spend
        //         uint160 amount;
        //         // timestamp at which a spender's token allowances become invalid
        //         uint48 expiration;
        //         // an incrementing value indexed per owner,token,and spender for each signature
        //         uint48 nonce;
        //     }
        // signature - the signature over the permit data. Supports EOA signatures, compact signatures defined by EIP-2098, and contract signatures defined by EIP-1271
        return []
    },
    [ifacePermit2.getSighash('transferFrom((address,address,uint160,address)[])')]: (txn, network, opts = {}) => {
        // from - the address to transfer the token from
        // to - the address of the recipient
        // amount - the amount of the token to transfer, the maximum amount is type(uint160).max
        // token - the address of the token to be transferred
        return []
    },
    [ifacePermit2.getSighash('transferFrom(address,address,uint160,address)')]: (txn, network, opts = {}) => {
        // transferDetails - constructed with the following
        // struct AllowanceTransferDetails {
        //         // the owner of the token
        //         address from;
        //         // the recipient of the token
        //         address to;
        //         // the amount of the token
        //         uint160 amount;
        //         // the token to be transferred
        //         address token;
        //     }
        return []
    }
  }
}

export default Permit2