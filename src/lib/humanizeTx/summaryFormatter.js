function SummaryFormatter(network, contractManager){

    this.cm = contractManager
    this.network = network
    this._mainAction = null//TODO
    this.actions = []

    this.currentSegments = []
    this.currentRichSegments = []

    this.mainAction = function(action){
        this._mainAction = action
        return this
    }

    this.actions = function(actions) {
        return {
            action:this._mainAction,
            actions: actions.filter(a => a !== null && a !== false)
        }
    }

    this.action = function(){
        const action = {
            plain: this.currentSegments.join(' '),
            rich: this.currentRichSegments
        }
        this.currentSegments = []
        this.currentRichSegments = []
        return action
    }

    this.add = function(){
        if(this.segments.length){
            this.actions.push({
                segments: this.currentSegments,
                richSegments: this.currentRichSegments
            })
            this.currentSegments = []
            this.currentRichSegments = []
        }
        return this
    }

    /*this.format = function(){
        this.actions.push({
              segments: this.currentSegments,
              richSegments: this.currentRichSegments
        })
        return this.actions
    }*/

    //Formatting funcs
    this.text = function (content) {
        this.currentSegments.push(content)
        this.currentRichSegments.push({
            type: 'plain',
            data: content
        })
        return this
    }

    this.tokenAmount = function (address, weiValue, displayDecimals=4, unknownCallback, amountCallback) {
        const humanAmount = this.cm.humanAmount(this.network, address, weiValue, displayDecimals, amountCallback)
        const tokenData = this.cm.tokenData(this.network, address, unknownCallback)
        this.currentSegments.push(humanAmount + ' ' + tokenData.symbol)
        this.currentRichSegments.push({
            type: 'tokenAmount',
            data: {...tokenData, humanAmount:humanAmount, amount:weiValue.toString()}
        })
        return this
    }

    this.alias = function(txOriginAddress, address){
        const aliasData = this.cm.aliasData(this.network, txOriginAddress, address)
        this.currentSegments.push(aliasData.alias)
        this.currentRichSegments.push({
            type: 'alias',
            data: aliasData
        })
        return this
    }

    return this
}

module.exports = SummaryFormatter
