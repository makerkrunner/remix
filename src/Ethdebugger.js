'use strict'
var TxBrowser = require('./TxBrowser')
var StepManager = require('./StepManager')
var TraceManager = require('./trace/traceManager')
var VmDebugger = require('./VmDebugger')
var Sticker = require('./Sticker')
var style = require('./styles/basicStyles')
var util = require('./helpers/global')
var EventManager = require('./lib/eventManager')
var yo = require('yo-yo')
var init = require('./helpers/init')
var ui = require('./helpers/ui')

function Ethdebugger () {
  util.extend(this, new EventManager())
  this.currentStepIndex = -1
  this.tx

  this.web3 = init.loadWeb3()
  this.traceManager = new TraceManager(this.web3)

  var self = this
  this.txBrowser = new TxBrowser(this.web3)
  this.txBrowser.register('newTxRequested', this, function (blockNumber, txIndex, tx) {
    self.startDebugging(blockNumber, txIndex, tx)
  })
  this.txBrowser.register('unloadRequested', this, function (blockNumber, txIndex, tx) {
    self.unLoad()
  })
  this.stepManager = new StepManager(this, this.traceManager)
  this.stepManager.register('stepChanged', this, function (stepIndex) {
    self.stepChanged(stepIndex)
  })
  this.vmDebugger = new VmDebugger(this, this.traceManager, this.web3)
  this.sticker = new Sticker(this, this.traceManager, this.web3)
}

Ethdebugger.prototype.render = function () {
  return (
  yo`<div style=${ui.formatCss(style.font)}>
        <h1 style=${ui.formatCss(style.container)}>VM Debugger</h1>
        <div style='display:inline-block'>
          ${this.txBrowser.render()}
          ${this.stepManager.render()}
        </div>
        <div style='display:inline-block'>
          ${this.sticker.render()}
        </div>
        ${this.vmDebugger.render()}
     </div>`
  )
}

Ethdebugger.prototype.unLoad = function () {
  this.traceManager.init()
  this.stepManager.reset()
  this.trigger('traceUnloaded')
}

Ethdebugger.prototype.stepChanged = function (stepIndex) {
  this.currentStepIndex = stepIndex
  this.trigger('indexChanged', [stepIndex])
}

Ethdebugger.prototype.startDebugging = function (blockNumber, txIndex, tx) {
  if (this.traceManager.isLoading) {
    return
  }
  console.log('loading trace...')
  this.tx = tx
  var self = this
  this.traceManager.resolveTrace(tx, function (error, result) {
    console.log('trace loaded ' + result + ' ' + error)
    if (result) {
      self.trigger('newTraceLoaded')
    }
  })
}

module.exports = Ethdebugger