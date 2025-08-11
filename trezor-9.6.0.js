(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["TrezorConnect"] = factory();
	else
		root["TrezorConnect"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 46:
/***/ ((module) => {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ src)
});

// UNUSED EXPORTS: BLOCKCHAIN, BLOCKCHAIN_EVENT, Bip32, BitcoinNetworkInfo, BlockchainLink, Bundle, CARDANO, CORE_EVENT, CardanoAddressParameters, CardanoAssetGroup, CardanoAuxiliaryData, CardanoAuxiliaryDataSupplement, CardanoCVoteRegistrationDelegation, CardanoCVoteRegistrationParameters, CardanoCertificate, CardanoCertificatePointer, CardanoCollateralInput, CardanoDRep, CardanoGetAddress, CardanoGetNativeScriptHash, CardanoGetPublicKey, CardanoInput, CardanoMint, CardanoNativeScript, CardanoNativeScriptHash, CardanoOutput, CardanoPoolMargin, CardanoPoolMetadata, CardanoPoolOwner, CardanoPoolParameters, CardanoPoolRelay, CardanoReferenceInput, CardanoRequiredSigner, CardanoSignTransaction, CardanoSignTransactionExtended, CardanoSignedTxData, CardanoSignedTxWitness, CardanoToken, CardanoWithdrawal, CoinInfo, CoinObj, CoinSupport, DEFAULT_SORTING_STRATEGY, DEVICE, DEVICE_EVENT, DerivationPath, DeviceUniquePath, ERRORS, EosAuthorization, EosPublicKey, EosSDKTransaction, EosSignTransaction, EosTxAction, EosTxActionCommon, EosTxHeader, EthereumAccessList, EthereumNetworkInfo, EthereumNetworkInfoDefinitionValues, EthereumSignMessage, EthereumSignTransaction, EthereumSignTypedData, EthereumSignTypedDataMessage, EthereumSignTypedDataTypes, EthereumSignTypedHash, EthereumSignedTx, EthereumTransaction, EthereumTransactionEIP1559, EthereumVerifyMessage, FIRMWARE, FeeInfo, FeeLevel, FirmwareType, GetAddress, GetPublicKey, IFRAME, IntermediaryVersion, MiscNetworkInfo, NEM, NETWORK, Network, POPUP, PROTO, PublicKey, RESPONSE_EVENT, RipplePayment, RippleSignTransaction, RippleSignedTx, RippleTransaction, SelectFeeLevel, SignMessage, SolanaComposeTransaction, SolanaComposedTransaction, SolanaProgramName, SolanaPublicKey, SolanaSignTransaction, SolanaSignedTransaction, SolanaTxAdditionalInfo, SolanaTxTokenAccountInfo, StellarAccountMergeOperation, StellarAllowTrustOperation, StellarAsset, StellarBumpSequenceOperation, StellarChangeTrustOperation, StellarClaimClaimableBalanceOperation, StellarCreateAccountOperation, StellarInflationOperation, StellarManageBuyOfferOperation, StellarManageDataOperation, StellarManageSellOfferOperation, StellarOperation, StellarOperationMessage, StellarPassiveSellOfferOperation, StellarPathPaymentStrictReceiveOperation, StellarPathPaymentStrictSendOperation, StellarPaymentOperation, StellarSetOptionsOperation, StellarSignTransaction, StellarSignedTx, StellarTransaction, TRANSPORT, TRANSPORT_EVENT, TezosDelegationOperation, TezosManagerTransfer, TezosOperation, TezosOriginationOperation, TezosParametersManager, TezosRevealOperation, TezosSignTransaction, TezosTransactionOperation, UI, UI_EVENT, UI_REQUEST, UI_RESPONSE, VerifyMessage, WEBEXTENSION, createBlockchainMessage, createDeviceMessage, createErrorMessage, createIFrameMessage, createPopupMessage, createResponseMessage, createTransportMessage, createUiMessage, createUiResponse, parseConnectSettings, parseMessage

;// ../connect/src/events/ui-request.ts
/*
 * messages to UI emitted as UI_EVENT
 */

const ui_request_UI_EVENT = 'UI_EVENT';
const UI_REQUEST = {
  TRANSPORT: 'ui-no_transport',
  BOOTLOADER: 'ui-device_bootloader_mode',
  NOT_IN_BOOTLOADER: 'ui-device_not_in_bootloader_mode',
  REQUIRE_MODE: 'ui-device_require_mode',
  INITIALIZE: 'ui-device_not_initialized',
  SEEDLESS: 'ui-device_seedless',
  FIRMWARE_OLD: 'ui-device_firmware_old',
  FIRMWARE_OUTDATED: 'ui-device_firmware_outdated',
  FIRMWARE_NOT_SUPPORTED: 'ui-device_firmware_unsupported',
  FIRMWARE_NOT_COMPATIBLE: 'ui-device_firmware_not_compatible',
  FIRMWARE_NOT_INSTALLED: 'ui-device_firmware_not_installed',
  FIRMWARE_PROGRESS: 'ui-firmware-progress',
  /** connect is waiting for device to be automatically reconnected */
  FIRMWARE_RECONNECT: 'ui-firmware_reconnect',
  FIRMWARE_DOWNLOADED: 'ui-firmware_downloaded',
  DEVICE_NEEDS_BACKUP: 'ui-device_needs_backup',
  REQUEST_UI_WINDOW: 'ui-request_window',
  CLOSE_UI_WINDOW: 'ui-close_window',
  REQUEST_PERMISSION: 'ui-request_permission',
  REQUEST_CONFIRMATION: 'ui-request_confirmation',
  REQUEST_PIN: 'ui-request_pin',
  INVALID_PIN: 'ui-invalid_pin',
  REQUEST_PASSPHRASE: 'ui-request_passphrase',
  REQUEST_PASSPHRASE_ON_DEVICE: 'ui-request_passphrase_on_device',
  INVALID_PASSPHRASE: 'ui-invalid_passphrase',
  CONNECT: 'ui-connect',
  LOADING: 'ui-loading',
  SET_OPERATION: 'ui-set_operation',
  SELECT_DEVICE: 'ui-select_device',
  SELECT_ACCOUNT: 'ui-select_account',
  SELECT_FEE: 'ui-select_fee',
  UPDATE_CUSTOM_FEE: 'ui-update_custom_fee',
  INSUFFICIENT_FUNDS: 'ui-insufficient_funds',
  REQUEST_BUTTON: 'ui-button',
  REQUEST_WORD: 'ui-request_word',
  LOGIN_CHALLENGE_REQUEST: 'ui-login_challenge_request',
  BUNDLE_PROGRESS: 'ui-bundle_progress',
  ADDRESS_VALIDATION: 'ui-address_validation',
  IFRAME_FAILURE: 'ui-iframe_failure'
};

// ButtonRequest_FirmwareUpdate is a artificial button request thrown by "uploadFirmware" method
// at the beginning of the uploading process

// todo: not used at the moment

/**
 * Prompt user to reconnect device during firmware installation.
 */

const createUiMessage = (type, payload) => ({
  event: ui_request_UI_EVENT,
  type,
  payload
});
;// ../connect/src/events/ui-response.ts

/*
 * messages from UI sent by popup or using .uiResponse method
 */

const UI_RESPONSE = {
  RECEIVE_PERMISSION: 'ui-receive_permission',
  RECEIVE_CONFIRMATION: 'ui-receive_confirmation',
  RECEIVE_FIRMWARE: 'ui-receive_firmware',
  RECEIVE_PIN: 'ui-receive_pin',
  RECEIVE_PASSPHRASE: 'ui-receive_passphrase',
  RECEIVE_DEVICE: 'ui-receive_device',
  RECEIVE_ACCOUNT: 'ui-receive_account',
  RECEIVE_FEE: 'ui-receive_fee',
  RECEIVE_WORD: 'ui-receive_word',
  INVALID_PASSPHRASE_ACTION: 'ui-invalid_passphrase_action',
  CHANGE_SETTINGS: 'ui-change_settings',
  LOGIN_CHALLENGE_RESPONSE: 'ui-login_challenge_response'
};
const createUiResponse = (type, payload) => ({
  event: UI_EVENT,
  type,
  payload
});
;// ../connect/src/events/index.ts














// NOTE: for backward compatibility wrap ui const into one
const UI = {
  ...UI_REQUEST,
  ...UI_RESPONSE
};
;// ../connect/src/factory.ts

const factory = ({
  eventEmitter,
  manifest,
  init,
  call,
  setTransports,
  requestLogin,
  uiResponse,
  cancel,
  dispose
}, extraMethods = {}) => ({
  manifest,
  init,
  setTransports,
  on: (type, fn) => {
    eventEmitter.on(type, fn);
  },
  off: (type, fn) => {
    eventEmitter.removeListener(type, fn);
  },
  removeAllListeners: type => {
    if (typeof type === 'string') {
      eventEmitter.removeAllListeners(type);
    } else {
      eventEmitter.removeAllListeners();
    }
  },
  uiResponse,
  // methods

  bleUnpair: params => call({
    ...params,
    method: 'bleUnpair'
  }),
  blockchainGetAccountBalanceHistory: params => call({
    ...params,
    method: 'blockchainGetAccountBalanceHistory'
  }),
  blockchainGetCurrentFiatRates: params => call({
    ...params,
    method: 'blockchainGetCurrentFiatRates'
  }),
  blockchainGetFiatRatesForTimestamps: params => call({
    ...params,
    method: 'blockchainGetFiatRatesForTimestamps'
  }),
  blockchainGetInfo: params => call({
    ...params,
    method: 'blockchainGetInfo'
  }),
  blockchainEvmRpcCall: params => call({
    ...params,
    method: 'blockchainEvmRpcCall'
  }),
  blockchainDisconnect: params => call({
    ...params,
    method: 'blockchainDisconnect'
  }),
  blockchainEstimateFee: params => call({
    ...params,
    method: 'blockchainEstimateFee'
  }),
  blockchainGetTransactions: params => call({
    ...params,
    method: 'blockchainGetTransactions'
  }),
  blockchainSetCustomBackend: params => call({
    ...params,
    method: 'blockchainSetCustomBackend'
  }),
  blockchainSubscribe: params => call({
    ...params,
    method: 'blockchainSubscribe'
  }),
  blockchainSubscribeFiatRates: params => call({
    ...params,
    method: 'blockchainSubscribeFiatRates'
  }),
  blockchainUnsubscribe: params => call({
    ...params,
    method: 'blockchainUnsubscribe'
  }),
  blockchainUnsubscribeFiatRates: params => call({
    ...params,
    method: 'blockchainUnsubscribeFiatRates'
  }),
  requestLogin: params => requestLogin(params),
  cardanoGetAddress: params => call({
    ...params,
    method: 'cardanoGetAddress',
    useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0
  }),
  cardanoGetNativeScriptHash: params => call({
    ...params,
    method: 'cardanoGetNativeScriptHash'
  }),
  cardanoGetPublicKey: params => call({
    ...params,
    method: 'cardanoGetPublicKey'
  }),
  cardanoSignTransaction: params => call({
    ...params,
    method: 'cardanoSignTransaction'
  }),
  cardanoComposeTransaction: params => call({
    ...params,
    method: 'cardanoComposeTransaction'
  }),
  cipherKeyValue: params => call({
    ...params,
    method: 'cipherKeyValue'
  }),
  composeTransaction: params => call({
    ...params,
    method: 'composeTransaction'
  }),
  discoverAccounts: params => call({
    ...params,
    method: 'discoverAccounts'
  }),
  ethereumGetAddress: params => call({
    ...params,
    method: 'ethereumGetAddress',
    useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0
  }),
  ethereumGetPublicKey: params => call({
    ...params,
    method: 'ethereumGetPublicKey'
  }),
  ethereumSignMessage: params => call({
    ...params,
    method: 'ethereumSignMessage'
  }),
  ethereumSignTransaction: params => call({
    ...params,
    method: 'ethereumSignTransaction'
  }),
  // @ts-expect-error generic param
  ethereumSignTypedData: params => call({
    ...params,
    method: 'ethereumSignTypedData'
  }),
  ethereumVerifyMessage: params => call({
    ...params,
    method: 'ethereumVerifyMessage'
  }),
  getAccountDescriptor: params => call({
    ...params,
    method: 'getAccountDescriptor'
  }),
  getAccountInfo: params => call({
    ...params,
    method: 'getAccountInfo'
  }),
  getAddress: params => call({
    ...params,
    method: 'getAddress',
    useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0
  }),
  getDeviceState: params => call({
    ...params,
    method: 'getDeviceState'
  }),
  getFeatures: params => call({
    ...params,
    method: 'getFeatures'
  }),
  getFirmwareHash: params => call({
    ...params,
    method: 'getFirmwareHash'
  }),
  getOwnershipId: params => call({
    ...params,
    method: 'getOwnershipId'
  }),
  getOwnershipProof: params => call({
    ...params,
    method: 'getOwnershipProof'
  }),
  getPublicKey: params => call({
    ...params,
    method: 'getPublicKey'
  }),
  nemGetAddress: params => call({
    ...params,
    method: 'nemGetAddress',
    useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0
  }),
  nemSignTransaction: params => call({
    ...params,
    method: 'nemSignTransaction'
  }),
  pushTransaction: params => call({
    ...params,
    method: 'pushTransaction'
  }),
  rippleGetAddress: params => call({
    ...params,
    method: 'rippleGetAddress',
    useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0
  }),
  rippleSignTransaction: params => call({
    ...params,
    method: 'rippleSignTransaction'
  }),
  signMessage: params => call({
    ...params,
    method: 'signMessage'
  }),
  signTransaction: params => call({
    ...params,
    method: 'signTransaction'
  }),
  solanaComposeTransaction: params => call({
    ...params,
    method: 'solanaComposeTransaction'
  }),
  solanaGetPublicKey: params => call({
    ...params,
    method: 'solanaGetPublicKey'
  }),
  solanaGetAddress: params => call({
    ...params,
    method: 'solanaGetAddress'
  }),
  solanaSignTransaction: params => call({
    ...params,
    method: 'solanaSignTransaction'
  }),
  stellarGetAddress: params => call({
    ...params,
    method: 'stellarGetAddress',
    useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0
  }),
  stellarSignTransaction: params => call({
    ...params,
    method: 'stellarSignTransaction'
  }),
  tezosGetAddress: params => call({
    ...params,
    method: 'tezosGetAddress',
    useEventListener: eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0
  }),
  tezosGetPublicKey: params => call({
    ...params,
    method: 'tezosGetPublicKey'
  }),
  tezosSignTransaction: params => call({
    ...params,
    method: 'tezosSignTransaction'
  }),
  unlockPath: params => call({
    ...params,
    method: 'unlockPath'
  }),
  eosGetPublicKey: params => call({
    ...params,
    method: 'eosGetPublicKey'
  }),
  eosSignTransaction: params => call({
    ...params,
    method: 'eosSignTransaction'
  }),
  verifyMessage: params => call({
    ...params,
    method: 'verifyMessage'
  }),
  resetDevice: params => call({
    ...params,
    method: 'resetDevice'
  }),
  loadDevice: params => call({
    ...params,
    method: 'loadDevice'
  }),
  wipeDevice: params => call({
    ...params,
    method: 'wipeDevice'
  }),
  applyFlags: params => call({
    ...params,
    method: 'applyFlags'
  }),
  applySettings: params => call({
    ...params,
    method: 'applySettings'
  }),
  getSettings: () => call({
    method: 'getSettings'
  }),
  authenticateDevice: params => call({
    ...params,
    method: 'authenticateDevice'
  }),
  authorizeCoinjoin: params => call({
    ...params,
    method: 'authorizeCoinjoin'
  }),
  cancelCoinjoinAuthorization: params => call({
    ...params,
    method: 'cancelCoinjoinAuthorization'
  }),
  showDeviceTutorial: params => call({
    ...params,
    method: 'showDeviceTutorial'
  }),
  backupDevice: params => call({
    ...params,
    method: 'backupDevice'
  }),
  changeLanguage: params => call({
    ...params,
    method: 'changeLanguage'
  }),
  changePin: params => call({
    ...params,
    method: 'changePin'
  }),
  changeWipeCode: params => call({
    ...params,
    method: 'changeWipeCode'
  }),
  firmwareUpdate: params => call({
    ...params,
    method: 'firmwareUpdate'
  }),
  recoveryDevice: params => call({
    ...params,
    method: 'recoveryDevice'
  }),
  getCoinInfo: params => call({
    ...params,
    method: 'getCoinInfo'
  }),
  setBrightness: params => call({
    ...params,
    method: 'setBrightness'
  }),
  setBusy: params => call({
    ...params,
    method: 'setBusy'
  }),
  setProxy: params => call({
    ...params,
    method: 'setProxy'
  }),
  dispose,
  cancel,
  ...extraMethods
});
;// ../utils/src/getMutex.ts
/**
 * Ensures that since the awaited lock is obtained until unlock return from it
 * is called, no other part of code can enter the same lock.
 *
 * Optionally, it also takes `lockId` param, in which case only actions with
 * the same lock id are blocking each other.
 *
 * Example:
 *
 * ```
 * const lock = getMutex();
 *
 * lock().then(unlock => writeToSocket('foo').finally(unlock));
 * lock().then(unlock => writeToSocket('bar').finally(unlock));
 * lock('differentLockId').then(unlock => writeToAnotherSocket('baz').finally(unlock));
 *
 * const unlock = await lock();
 * await readFromSocket();
 * unlock();
 * ```
 */
const getMutex = () => {
  const DEFAULT_ID = Symbol();
  const locks = {};
  return async (lockId = DEFAULT_ID) => {
    while (locks[lockId]) {
      await locks[lockId];
    }
    let resolve = () => {};
    locks[lockId] = new Promise(res => {
      resolve = res;
    }).finally(() => {
      delete locks[lockId];
    });
    return resolve;
  };
};
;// ../utils/src/getSynchronize.ts


/**
 * Ensures that all async actions passed to the returned function are called
 * immediately one after another, without interfering with each other.
 * Optionally, it also takes `lockId` param, in which case only actions with
 * the same lock id are blocking each other.
 *
 * Example:
 *
 * ```
 * const synchronize = getSynchronize();
 * synchronize(() => asyncAction1());
 * synchronize(() => asyncAction2());
 * synchronize(() => asyncAction3(), 'differentLockId');
 * ```
 */
const getSynchronize = mutex => {
  const lock = mutex ?? getMutex();
  return (action, lockId) => lock(lockId).then(unlock => Promise.resolve().then(action).finally(unlock));
};
;// ../connect/src/constants/errors.ts
const ERROR_CODES = {
  Init_NotInitialized: 'TrezorConnect not initialized',
  // race condition: call on not initialized Core (usually hot-reloading)
  Init_AlreadyInitialized: 'TrezorConnect has been already initialized',
  // thrown by .init called multiple times
  Init_IframeBlocked: 'Iframe blocked',
  // iframe injection blocked (ad-blocker)
  Init_IframeTimeout: 'Iframe timeout',
  // iframe didn't load in specified time
  Init_ManifestMissing: 'Manifest not set. Read more at https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/index.md',
  // manifest is not set

  Popup_ConnectionMissing: 'Unable to establish connection with iframe',
  // thrown by popup
  Desktop_ConnectionMissing: 'Unable to establish connection with Suite',
  // thrown by suite-desktop

  Transport_Missing: 'Transport is missing',
  // no transport available

  Method_InvalidPackage: 'This package is not suitable to work with browser. Use @trezor/connect-web package instead',
  // thrown by node and react-native env while using regular 'web' package
  Method_InvalidParameter: '',
  // replaced by generic text
  Method_NotAllowed: 'Method not allowed for this configuration',
  // example: device management in popup mode
  Method_PermissionsNotGranted: 'Permissions not granted',
  // permission/confirmation not granted in popup
  Method_Cancel: 'Cancelled',
  // permission/confirmation not granted in popup OR .cancel() custom error
  Method_Interrupted: 'Popup closed',
  // interruption: popup closed
  Method_UnknownCoin: 'Coin not found',
  // coin definition not found
  Method_AddressNotMatch: 'Addresses do not match',
  // thrown by all getAddress methods with custom UI validation
  Method_Discovery_BundleException: '',
  // thrown by getAccountInfo method
  Method_Override: 'override',
  // inner "error", it's more like a interruption
  Method_NoResponse: 'Call resolved without response',
  // thrown by npm index(es), call to Core resolved without response, should not happen

  Backend_NotSupported: 'BlockchainLink settings not found in coins.json',
  // thrown by methods which using backends, blockchainLink not defined for this coin
  Backend_WorkerMissing: '',
  // thrown by BlockchainLink class, worker not specified
  Backend_Disconnected: 'Backend disconnected',
  // thrown by BlockchainLink class
  Backend_Invalid: 'Invalid backend',
  // thrown by BlockchainLink class, invalid backend (ie: backend for wrong coin set)
  Backend_Error: '',
  // thrown by BlockchainLink class, generic message from 'blockchain-link'

  Runtime: '',
  // thrown from several places, this shouldn't ever happen tho

  Device_NotFound: 'Device not found',
  Device_InitializeFailed: '',
  // generic error from firmware while calling "Initialize" message
  Device_FwException: '',
  // generic FirmwareException type
  Device_ModeException: '',
  // generic Device.UnexpectedMode type
  Device_Disconnected: 'Device disconnected',
  // device disconnected during call
  Device_UsedElsewhere: 'Device is used in another window',
  // interruption: current session toked by other application
  Device_InvalidState: 'Passphrase is incorrect',
  // authorization error (device state comparison)
  Device_CallInProgress: 'Device call in progress',
  // thrown when trying to make another call while current is still running
  Device_MultipleNotSupported: 'Multiple devices are not supported',
  // thrown by methods which require single device
  Device_MissingCapability: 'Device is missing capability',
  // thrown by methods which require specific capability
  Device_MissingCapabilityBtcOnly: 'Device is missing capability (BTC only)',
  // thrown by methods which require specific capability when using BTC only firmware

  Failure_ActionCancelled: 'Action cancelled by user',
  Failure_FirmwareError: 'Firmware installation failed',
  Failure_UnknownCode: 'Unknown error',
  Failure_PinCancelled: 'PIN cancelled',
  Failure_PinInvalid: 'PIN invalid',
  Failure_PinMismatch: 'PIN mismatch',
  Failure_WipeCodeMismatch: 'Wipe code mismatch',
  Failure_EntropyCheck: '',
  // message from verifyEntropy process

  Deeplink_VersionMismatch: 'Not compatible with current version of the app'
};
class TrezorError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.message = message;
  }

  // Error.prototype.toString() does not include custom property `code`
  toString() {
    return `${this.name} (code: ${this.code}): ${this.message}`;
  }
}
const TypedError = (id, message) => new TrezorError(id, message || ERROR_CODES[id]);

// serialize Error/TypeError object into payload error type (Error object/class is converted to string while sent via postMessage)
const errors_serializeError = payload => {
  if (payload && payload.error instanceof Error) {
    return {
      error: payload.error.message,
      code: payload.error.code
    };
  }
  if (payload instanceof TrezorError) {
    return {
      error: payload.message,
      code: payload.code
    };
  }
  if (payload instanceof Error) {
    return {
      error: payload.message,
      code: 'code' in payload ? payload.code : 'Failure_UnknownCode'
    };
  }
  return {
    ...payload
  };
};

// trezord error prefix.
// user has insufficient permissions. may occur in Linux (missing udev rules), Windows and MacOS.
const LIBUSB_ERROR_MESSAGE = 'LIBUSB_ERROR';
;// ../connect/src/events/core.ts
const CORE_EVENT = 'CORE_EVENT';
// parse MessageEvent .data into CoreMessage
const parseMessage = messageData => {
  const message = {
    event: messageData.event,
    type: messageData.type,
    payload: messageData.payload,
    device: messageData.device
  };
  if (typeof messageData.id === 'number') {
    message.id = messageData.id;
  }
  if (typeof messageData.success === 'boolean') {
    message.success = messageData.success;
  }
  return message;
};

// common response used straight from npm index (not from Core)
const createErrorMessage = error => ({
  success: false,
  payload: {
    error: error.message,
    code: error.code
  }
});
;// ../connect/src/utils/proxy-event-emitter.ts
/**
 * ProxyEventEmitter is an EventEmitter that allows to use multiple EventEmitters as one
 * This is used in connect-web to allow switching between iframe and core-in-popup implementations
 */
class ProxyEventEmitter {
  constructor(eventEmitters) {
    this.eventEmitters = eventEmitters;
  }
  emit(eventName, ...args) {
    this.eventEmitters.forEach(emitter => emitter.emit(eventName, ...args));
    return true;
  }
  on(eventName, listener) {
    this.eventEmitters.forEach(emitter => emitter.on(eventName, listener));
    return this;
  }
  off(eventName, listener) {
    this.eventEmitters.forEach(emitter => emitter.off(eventName, listener));
    return this;
  }
  once(eventName, listener) {
    this.eventEmitters.forEach(emitter => emitter.once(eventName, listener));
    return this;
  }
  addListener(eventName, listener) {
    this.eventEmitters.forEach(emitter => emitter.addListener(eventName, listener));
    return this;
  }
  prependListener(eventName, listener) {
    this.eventEmitters.forEach(emitter => emitter.prependListener(eventName, listener));
    return this;
  }
  prependOnceListener(eventName, listener) {
    this.eventEmitters.forEach(emitter => emitter.prependOnceListener(eventName, listener));
    return this;
  }
  removeAllListeners(event) {
    this.eventEmitters.forEach(emitter => emitter.removeAllListeners(event));
    return this;
  }
  removeListener(eventName, listener) {
    this.eventEmitters.forEach(emitter => emitter.removeListener(eventName, listener));
    return this;
  }
  setMaxListeners(n) {
    this.eventEmitters.forEach(emitter => emitter.setMaxListeners(n));
    return this;
  }

  // for the following methods, we just use the first EventEmitter
  // since all EventEmitters should be in sync, the result should be the same
  eventNames() {
    return this.eventEmitters[0].eventNames();
  }
  getMaxListeners() {
    return this.eventEmitters[0].getMaxListeners();
  }
  listenerCount(eventName, listener) {
    return this.eventEmitters[0].listenerCount(eventName, listener);
  }
  rawListeners(eventName) {
    return this.eventEmitters[0].rawListeners(eventName);
  }
  listeners(eventName) {
    return this.eventEmitters[0].listeners(eventName);
  }
}
;// ../connect/src/impl/dynamic.ts




/**
 * Implementation of TrezorConnect that can dynamically switch between different implementations.
 *
 */
class TrezorConnectDynamic {
  callPending = 0;
  beforeCallSynchronize = getSynchronize();
  constructor({
    implementations,
    getInitTarget,
    handleBeforeCall,
    handleErrorFallback
  }) {
    this.implementations = implementations;
    this.currentTarget = this.implementations[0].type;
    this.getInitTarget = getInitTarget;
    this.handleBeforeCall = handleBeforeCall;
    this.handleErrorFallback = handleErrorFallback;
    this.eventEmitter = new ProxyEventEmitter(this.implementations.map(impl => impl.impl.eventEmitter));
  }
  getTarget() {
    return this.implementations.find(impl => impl.type === this.currentTarget).impl;
  }
  getTargetType() {
    return this.currentTarget;
  }
  async switchTarget(target) {
    if (this.currentTarget === target) {
      return;
    }
    if (!this.lastSettings) {
      throw TypedError('Init_ManifestMissing');
    }

    // Go back to the old target if the new target fails to initialize
    const oldTargetType = this.getTargetType();
    const oldTarget = this.getTarget();
    try {
      this.currentTarget = target;
      await this.getTarget().init(this.lastSettings);
      await oldTarget.dispose();
    } catch {
      this.currentTarget = oldTargetType;
    }
  }
  manifest(manifest) {
    this.lastSettings = {
      ...this.lastSettings,
      manifest
    };
    this.getTarget().manifest(manifest);
  }
  async init(settings) {
    if (!settings?.manifest) {
      throw TypedError('Init_ManifestMissing');
    }
    // Save settings for later use
    this.lastSettings = settings;
    this.currentTarget = this.getInitTarget(settings);
    this.callPending = 0;

    // Initialize the target
    try {
      return await this.getTarget().init(this.lastSettings);
    } catch (error) {
      // Handle error by switching to other implementation if available as defined in `handleErrorFallback`.
      if (await this.handleErrorFallback(error.code)) {
        return;
      }
      throw error;
    }
  }
  setTransports({
    transports
  }) {
    this.lastSettings = {
      ...this.lastSettings,
      transports
    };
    this.getTarget().setTransports({
      transports
    });
  }
  async call(params) {
    try {
      // Edge case - if there are simultaneous calls, we only want to call `handleBeforeCall` once
      if (this.callPending === 0) {
        await this.beforeCallSynchronize(async () => {
          this.callPending++;
          await this.handleBeforeCall();
        });
      }
      const response = await this.getTarget().call(params);
      if (!response.success) {
        if (await this.handleErrorFallback(response.payload.code)) {
          return await this.getTarget().call(params);
        }
      }
      return response;
    } catch (error) {
      // Don't throw but return error payload
      return createErrorMessage(error);
    } finally {
      this.callPending--;
    }
  }
  requestLogin(params) {
    return this.getTarget().requestLogin(params);
  }
  uiResponse(params) {
    return this.getTarget().uiResponse(params);
  }
  cancel(error) {
    return this.getTarget().cancel(error);
  }
  dispose() {
    this.eventEmitter.removeAllListeners();
    this.callPending = 0;
    return this.getTarget().dispose();
  }
}
;// ../connect/src/data/thpSettings.ts
const parseThpSettings = ({
  manifest,
  thp
}) => {
  const settings = {
    pairingMethods: []
  };
  if (Array.isArray(thp?.pairingMethods)) {
    settings.pairingMethods = thp.pairingMethods;
  } else {
    settings.pairingMethods = ['CodeEntry'];
  }
  if (typeof thp?.hostName === 'string') {
    settings.hostName = thp.hostName;
  } else if (typeof manifest?.appName === 'string') {
    settings.hostName = manifest?.appName;
  }
  if (typeof thp?.staticKey === 'string') {
    settings.staticKey = thp.staticKey;
  }
  if (Array.isArray(thp?.knownCredentials)) {
    settings.knownCredentials = thp.knownCredentials.flatMap(k => {
      if (k && typeof k === 'object' && typeof k.credential === 'string' && typeof k.trezor_static_pubkey === 'string') {
        return k;
      }
      return [];
    });
  }
  return settings;
};
;// ../connect/src/data/version.ts
const VERSION = '9.6.0';
const versionN = VERSION.split('.').map(s => parseInt(s, 10));
const isBeta = VERSION.includes('beta');
const DEFAULT_DOMAIN = isBeta ? `https://connect.trezor.io/${VERSION}/` : `https://connect.trezor.io/${versionN[0]}/`;

// Increment with content script changes
const CONTENT_SCRIPT_VERSION = 1;
// Increment with deeplink protocol changes
const DEEPLINK_VERSION = 1;
;// ../connect/src/data/connectSettings.ts
// origin: https://github.com/trezor/connect/blob/develop/src/js/data/ConnectSettings.js



/*
 * Initial settings for connect.
 * It could be changed by passing values into TrezorConnect.init(...) method
 */

const DEFAULT_PRIORITY = 2;
const initialSettings = {
  configSrc: './data/config.json',
  // constant
  version: VERSION,
  // constant
  debug: false,
  priority: DEFAULT_PRIORITY,
  trustedHost: true,
  connectSrc: DEFAULT_DOMAIN,
  iframeSrc: `${DEFAULT_DOMAIN}iframe.html`,
  popup: false,
  popupSrc: `${DEFAULT_DOMAIN}popup.html`,
  webusbSrc: `${DEFAULT_DOMAIN}webusb.html`,
  transports: undefined,
  pendingTransportEvent: true,
  env: 'node',
  lazyLoad: false,
  timestamp: new Date().getTime(),
  interactionTimeout: 1200,
  // 20 minutes
  sharedLogger: true,
  deeplinkUrl: `${DEFAULT_DOMAIN}deeplink/${DEEPLINK_VERSION}/`,
  transportReconnect: true
};
const parseManifest = manifest => {
  if (!manifest) return;
  if (typeof manifest.email !== 'string') return;
  if (typeof manifest.appUrl !== 'string') return;
  // todo [connect10]: appName should become required
  if (typeof manifest.appName !== 'undefined' && typeof manifest.appName !== 'string') return;
  if (typeof manifest.appIcon !== 'undefined' && typeof manifest.appIcon !== 'string') return;
  return {
    email: manifest.email,
    appUrl: manifest.appUrl,
    appName: manifest.appName,
    appIcon: manifest.appIcon
  };
};
const parseLocalFirmwares = localFirmwares => {
  if (!localFirmwares) return;
  if (typeof localFirmwares.firmwareDir !== 'string') return;
  if (!Array.isArray(localFirmwares.firmwareList)) return;
  return {
    firmwareDir: localFirmwares.firmwareDir,
    firmwareList: localFirmwares.firmwareList
  };
};

// Cors validation copied from Trezor Bridge
// see: https://github.com/trezor/trezord-go/blob/05991cea5900d18bcc6ece5ae5e319d138fc5551/server/api/api.go#L229
// Its pointless to allow `@trezor/connect` endpoints { connectSrc } for domains other than listed below
// `trezord` will block communication anyway
const corsValidator = url => {
  if (typeof url !== 'string') return;
  if (url === '../') return url; // suite-web way
  if (url.match(/^https:\/\/([A-Za-z0-9\-_]+\.)*trezor\.io\//)) return url;
  if (url.match(/^https?:\/\/localhost:[58][0-9]{3}\//)) return url;
  if (url.match(/^https:\/\/([A-Za-z0-9\-_]+\.)*sldev\.cz\//)) return url;
  if (url.match(/^https?:\/\/([A-Za-z0-9\-_]+\.)*trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad\.onion\//)) return url;
};
const parseConnectSettings = (input = {}) => {
  const settings = {
    ...initialSettings
  };
  if ('debug' in input) {
    if (typeof input.debug === 'boolean') {
      settings.debug = input.debug;
    } else if (typeof input.debug === 'string') {
      settings.debug = input.debug === 'true';
    }
  }

  // trust level can only be lowered by implementator!
  if (input.trustedHost === false) {
    settings.trustedHost = input.trustedHost;
  }
  if (typeof input.connectSrc === 'string') {
    settings.connectSrc = corsValidator(input.connectSrc);
  } else if (settings.trustedHost) {
    settings.connectSrc = input.connectSrc;
  }
  const src = settings.connectSrc || DEFAULT_DOMAIN;
  settings.iframeSrc = `${src}iframe.html`;
  settings.popupSrc = `${src}popup.html`;
  settings.webusbSrc = `${src}webusb.html`;
  if (typeof input.transportReconnect === 'boolean') {
    settings.transportReconnect = input.transportReconnect;
  }
  if (typeof input.localFirmwares === 'object') {
    settings.localFirmwares = parseLocalFirmwares(input.localFirmwares);
  }
  if (Array.isArray(input.transports)) {
    settings.transports = input.transports;
  }
  if (typeof input.popup === 'boolean') {
    settings.popup = input.popup;
  }
  if (typeof input.lazyLoad === 'boolean') {
    settings.lazyLoad = input.lazyLoad;
  }
  if (typeof input.pendingTransportEvent === 'boolean') {
    settings.pendingTransportEvent = input.pendingTransportEvent;
  }
  if (typeof input.extension === 'string') {
    settings.extension = input.extension;
  }
  if (typeof input.env === 'string') {
    settings.env = input.env;
  }
  if (typeof input.timestamp === 'number') {
    settings.timestamp = input.timestamp;
  }
  if (typeof input.interactionTimeout === 'number') {
    settings.interactionTimeout = input.interactionTimeout;
  }
  if (typeof input.manifest === 'object') {
    settings.manifest = parseManifest(input.manifest);
  }
  if (typeof input.sharedLogger === 'boolean') {
    settings.sharedLogger = input.sharedLogger;
  }
  if (typeof input.coreMode === 'string' && ['auto', 'popup', 'iframe', 'suite-desktop'].includes(input.coreMode)) {
    settings.coreMode = input.coreMode;
  }
  if (typeof input._extendWebextensionLifetime === 'boolean') {
    settings._extendWebextensionLifetime = input._extendWebextensionLifetime;
  }
  if (typeof input._sessionsBackgroundUrl === 'string' || input._sessionsBackgroundUrl === null) {
    settings._sessionsBackgroundUrl = input._sessionsBackgroundUrl;
  }
  if (typeof input.binFilesBaseUrl === 'string') {
    settings.binFilesBaseUrl = input.binFilesBaseUrl;
  }
  if (typeof input.enableFirmwareHashCheck === 'boolean') {
    settings.enableFirmwareHashCheck = Boolean(input.enableFirmwareHashCheck);
  }
  if (typeof input.npmVersion === 'string') {
    settings.npmVersion = input.npmVersion;
  }
  settings.thp = parseThpSettings(input);
  return settings;
};
;// ./src/connectSettings.ts

const getEnv = () => {
  if (typeof chrome !== 'undefined' && typeof chrome.runtime?.onConnect !== 'undefined') {
    return 'webextension';
  }
  if (typeof navigator !== 'undefined') {
    if (typeof navigator.product === 'string' && navigator.product.toLowerCase() === 'reactnative') {
      return 'react-native';
    }
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf(' electron/') > -1) {
      return 'electron';
    }
  }
  return 'web';
};
/**
 * Settings from host
 * @param input Partial<ConnectSettings>
 */
const connectSettings_parseConnectSettings = (input = {}) => {
  const settings = {
    popup: true,
    ...input
  };
  // For debugging purposes `connectSrc` could be defined in `global.__TREZOR_CONNECT_SRC` variable
  let globalSrc;
  if (typeof window !== 'undefined') {
    // @ts-expect-error not defined in globals outside of the package
    globalSrc = window.__TREZOR_CONNECT_SRC;
  } else if (typeof __webpack_require__.g !== 'undefined') {
    globalSrc = __webpack_require__.g.__TREZOR_CONNECT_SRC;
  }
  if (typeof globalSrc === 'string') {
    settings.connectSrc = globalSrc;
    settings.debug = true;
  }
  if (typeof input.env !== 'string') {
    settings.env = getEnv();
  }
  return parseConnectSettings(settings);
};
// EXTERNAL MODULE: ../../node_modules/events/events.js
var events = __webpack_require__(46);
var events_default = /*#__PURE__*/__webpack_require__.n(events);
;// ../transport/src/constants.ts
// usb const
const CONFIGURATION_ID = 1;
const INTERFACE_ID = 0;
const ENDPOINT_ID = 1;
const DEBUGLINK_INTERFACE_ID = 1;
const DEBUGLINK_ENDPOINT_ID = 2;
const T1_HID_VENDOR = 0x534c;
const T1_HID_PRODUCT = 0x0001;
const WEBUSB_FIRMWARE_PRODUCT = 0x53c1;
const WEBUSB_BOOTLOADER_PRODUCT = 0x53c0;
const TREZOR_USB_DESCRIPTORS = [
// TREZOR v1
// won't get opened, but we can show error at least
{
  vendorId: 0x534c,
  productId: T1_HID_PRODUCT
},
// TREZOR webusb Bootloader
{
  vendorId: 0x1209,
  productId: WEBUSB_BOOTLOADER_PRODUCT
},
// TREZOR webusb Firmware
{
  vendorId: 0x1209,
  productId: WEBUSB_FIRMWARE_PRODUCT
}];

/**
 * How long is single transport action (call, acquire) allowed to take
 */
const ACTION_TIMEOUT = 10000;
const TRANSPORT = {
  /* events */
  START: 'transport-start',
  ERROR: 'transport-error',
  DEVICE_CONNECTED: 'transport-device_connected',
  DEVICE_DISCONNECTED: 'transport-device_disconnected',
  DEVICE_SESSION_CHANGED: 'transport-device_session_changed',
  DEVICE_REQUEST_RELEASE: 'transport-device_request_release',
  /* messages */
  DISABLE_WEBUSB: 'transport-disable_webusb',
  REQUEST_DEVICE: 'transport-request_device',
  GET_INFO: 'transport-get_info',
  SET_TRANSPORTS: 'transport-set_transports'
};
;// ../connect/src/data/config.ts
// origin: https://github.com/trezor/connect/blob/develop/src/data/config.json


const config = {
  webusb: TREZOR_USB_DESCRIPTORS,
  whitelist: [{
    origin: 'chrome-extension://imloifkgjagghnncjkhggdhalmcnfklk',
    priority: 1
  }, {
    origin: 'chrome-extension://niebkpllfhmpfbffbfifagfgoamhpflf',
    priority: 1
  }, {
    origin: 'file://',
    priority: 2
  }, {
    origin: 'trezor.io',
    priority: 0
  }, {
    origin: 'sldev.cz',
    priority: 0
  }, {
    origin: 'localhost',
    priority: 0
  }, {
    origin: 'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion',
    priority: 0
  }],
  management: [{
    origin: 'trezor.io'
  }, {
    origin: 'sldev.cz'
  }, {
    origin: 'localhost'
  }],
  knownHosts: [{
    origin: 'imloifkgjagghnncjkhggdhalmcnfklk',
    label: 'Trezor Password Manager (Develop)'
  }, {
    origin: 'niebkpllfhmpfbffbfifagfgoamhpflf',
    label: 'Trezor Password Manager'
  }, {
    origin: 'mnpfhpndmjholfdlhpkjfmjkgppmodaf',
    label: 'MetaMask'
  }, {
    origin: 'webextension@metamask.io',
    label: 'MetaMask'
  }, {
    origin: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
    label: 'MetaMask'
  }, {
    origin: 'bpcdaglidgnlggelgbjfagekoapjmccp',
    label: 'Rainbow DEV'
  }, {
    origin: 'opfgelmcmbiajamepnmloijbpoleiama',
    label: 'Rainbow'
  }, {
    origin: 'acmacodkjbdgmoleebolmdjonilkdbch',
    label: 'Rabby'
  }, {
    origin: 'ehnpnhnhcickeknioaiodjmielfaoajd',
    label: 'Ambire DEV'
  }, {
    origin: 'ehgjhhccekdedpbkifaojjaefeohnoea',
    label: 'Ambire'
  }, {
    origin: 'file://',
    label: ' '
  }],
  onionDomains: {
    'trezor.io': 'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion'
  },
  supportedBrowsers: {
    chrome: {
      version: 59,
      download: 'https://www.google.com/chrome/',
      update: 'https://support.google.com/chrome/answer/95414'
    },
    mobilechrome: {
      version: 59,
      download: 'https://www.google.com/chrome/',
      update: 'https://support.google.com/chrome/answer/95414'
    },
    chromium: {
      version: 59,
      download: 'https://www.chromium.org/',
      update: 'https://www.chromium.org/'
    },
    electron: {
      version: 0,
      download: 'https://www.electronjs.org/',
      update: 'https://www.electronjs.org/'
    },
    firefox: {
      version: 54,
      download: 'https://www.mozilla.org/en-US/firefox/new/',
      update: 'https://support.mozilla.org/en-US/kb/update-firefox-latest-version'
    },
    mobilefirefox: {
      version: 54,
      download: 'https://www.mozilla.org/en-US/firefox/new/',
      update: 'https://support.mozilla.org/en-US/kb/update-firefox-latest-version'
    },
    brave: {
      // Chromium based
      version: 59,
      download: 'https://brave.com/download/',
      update: 'https://brave.com/download/'
    },
    edge: {
      // Since version 79, Edge is based on Chromium
      version: 79,
      download: 'https://www.microsoft.com/en-us/edge',
      update: 'https://www.microsoft.com/en-us/edge'
    },
    opera: {
      // Chromium based
      version: 95,
      download: 'https://www.opera.com/download',
      update: 'https://www.opera.com/download'
    }
  },
  supportedFirmware: [{
    coin: ['xrp', 'txrp'],
    methods: ['getAccountInfo'],
    min: {
      T1B1: '0',
      T2T1: '2.1.0'
    },
    max: undefined,
    // NOTE: max field is not used anywhere at the moment, it is here for type compatibility
    comment: ["Since firmware 2.1.0 there is a new protobuf field 'destination_tag' in RippleSignTx"]
  }, {
    coin: ['bnb'],
    min: {
      T1B1: '1.9.0',
      T2T1: '2.3.0'
    },
    comment: ['There were protobuf backwards incompatible changes with introduction of 1.9.0/2.3.0 firmwares']
  }, {
    coin: ['eth', 'tsep', 'thol'],
    min: {
      T1B1: '1.8.0',
      T2T1: '2.1.0'
    },
    comment: ['There were protobuf backwards incompatible changes.']
  }, {
    coin: ['ada', 'tada'],
    min: {
      T1B1: '0',
      T2T1: '2.4.3'
    },
    comment: ['Since 2.4.3 there is initialize.derive_cardano message']
  }, {
    methods: ['rippleGetAddress', 'rippleSignTransaction'],
    min: {
      T1B1: '0',
      T2T1: '2.1.0'
    },
    comment: ["Since firmware 2.1.0 there is a new protobuf field 'destination_tag' in RippleSignTx"]
  }, {
    methods: ['cardanoGetAddress', 'cardanoGetPublicKey'],
    min: {
      T1B1: '0',
      T2T1: '2.4.3'
    },
    comment: ['Since 2.4.3 Cardano derivation behavior has changed']
  }, {
    methods: ['cardanoSignTransaction'],
    min: {
      T1B1: '0',
      T2T1: '2.6.0'
    },
    comment: ['Before 2.6.0 not all Cardano transactions were supported']
  }, {
    methods: ['cardanoGetNativeScriptHash'],
    min: {
      T1B1: '0',
      T2T1: '2.4.3'
    },
    comment: ['Since 2.4.3 Cardano derivation behavior has changed']
  }, {
    methods: ['tezosSignTransaction'],
    min: {
      T1B1: '0',
      T2T1: '2.1.8'
    },
    comment: ['Since 2.1.8 there are new protobuf fields in tezos transaction (Babylon fork)']
  }, {
    methods: ['stellarSignTransaction'],
    min: {
      T1B1: '1.9.0',
      T2T1: '2.3.0'
    },
    comment: ['There were protobuf backwards incompatible changes with introduction of 1.9.0/2.3.0 firmwares']
  }, {
    capabilities: ['replaceTransaction', 'amountUnit'],
    min: {
      T1B1: '1.9.4',
      T2T1: '2.3.5'
    },
    comment: ['new sign tx process since 1.9.4/2.3.5']
  }, {
    capabilities: ['decreaseOutput'],
    min: {
      T1B1: '1.10.0',
      T2T1: '2.4.0'
    },
    comment: ['allow reduce output in RBF transaction since 1.10.0/2.4.0']
  }, {
    capabilities: ['eip1559'],
    min: {
      T1B1: '1.10.4',
      T2T1: '2.4.2'
    },
    comment: ['new eth transaction pricing mechanism (EIP1559) since 1.10.4/2.4.2']
  }, {
    capabilities: ['taproot', 'signMessageNoScriptType'],
    min: {
      T1B1: '1.10.4',
      T2T1: '2.4.3'
    },
    comment: ['new btc accounts taproot since 1.10.4/2.4.3 (BTC + TEST only)', 'SignMessage with no_script_type support']
  }, {
    coin: ['dcr', 'tdcr'],
    methods: ['signTransaction'],
    min: {
      T1B1: '1.10.1',
      T2T1: '2.4.0'
    },
    comment: ['']
  }, {
    methods: ['ethereumSignTypedData'],
    min: {
      T1B1: '1.10.5',
      T2T1: '2.4.3'
    },
    comment: ['EIP-712 typed signing support added in 1.10.5/2.4.3']
  }, {
    capabilities: ['eip712-domain-only'],
    min: {
      T1B1: '1.10.6',
      T2T1: '2.4.4'
    },
    comment: ['EIP-712 domain-only signing, when primaryType=EIP712Domain']
  }, {
    capabilities: ['coinjoin'],
    methods: ['authorizeCoinjoin', 'cancelCoinjoinAuthorization', 'getOwnershipId', 'getOwnershipProof', 'setBusy', 'unlockPath'],
    min: {
      T1B1: '1.12.1',
      T2T1: '2.5.3'
    }
  }, {
    methods: ['showDeviceTutorial', 'authenticateDevice'],
    min: {
      T1B1: '0',
      T2T1: '0',
      T3T1: '2.8.0'
    }
  }, {
    capabilities: ['getFirmwareHash'],
    methods: ['getFirmwareHash'],
    min: {
      T1B1: '1.11.1',
      T2T1: '2.5.1'
    }
  }, {
    methods: ['solanaGetPublicKey', 'solanaGetAddress', 'solanaSignTransaction'],
    min: {
      T1B1: '0',
      T2T1: '2.6.4',
      T2B1: '2.6.4'
    }
  }, {
    capabilities: ['chunkify'],
    min: {
      T1B1: '0',
      T2T1: '2.6.3',
      T2B1: '2.6.3'
    },
    comment: ["Since firmware 2.6.3 there is a new protobuf field 'chunkify' in almost all getAddress and signTx methods"]
  }, {
    methods: ['changeLanguage'],
    min: {
      T1B1: '0',
      T2T1: '2.7.0',
      T2B1: '2.7.0'
    }
  }, {
    capabilities: ['entropyCheck'],
    min: {
      T1B1: '1.13.1',
      T2T1: '2.8.7',
      T2B1: '2.8.7',
      T3B1: '2.8.7',
      T3T1: '2.8.7'
    }
  }]
};
;// ../connect/src/events/popup.ts

const POPUP = {
  // Message called from popup.html inline script before "window.onload" event. This is first message from popup to window.opener.
  BOOTSTRAP: 'popup-bootstrap',
  // Message from popup.js to window.opener, called after "window.onload" event. This is second message from popup to window.opener.
  LOADED: 'popup-loaded',
  // Message from popup run in "core" mode. Connect core has been loaded, popup is ready to handle messages
  // This is similar to IFRAME.LOADED message which signals the same but core is loaded in different context
  CORE_LOADED: 'popup-core-loaded',
  // Message from window.opener to popup.js. Send settings to popup. This is first message from window.opener to popup.
  INIT: 'popup-init',
  // Error message from popup to window.opener. Could be thrown during popup initialization process (POPUP.INIT)
  ERROR: 'popup-error',
  // Message to webextensions, opens "trezor-usb-permission.html" within webextension
  EXTENSION_USB_PERMISSIONS: 'open-usb-permissions',
  // Message called from both [popup > iframe] then [iframe > popup] in this exact order.
  // Firstly popup call iframe to resolve popup promise in Core
  // Then iframe reacts to POPUP.HANDSHAKE message and sends ConnectSettings, transport information and requested method details back to popup
  HANDSHAKE: 'popup-handshake',
  // Event emitted from PopupManager at the end of popup closing process.
  // Sent from popup thru window.opener to an iframe because message channel between popup and iframe is no longer available
  CLOSED: 'popup-closed',
  // Message called from iframe to popup, it means that popup will not be needed (example: Blockchain methods are not using popup at all)
  // This will close active popup window and/or clear opening process in PopupManager (maybe popup wasn't opened yet)
  CANCEL_POPUP_REQUEST: 'ui-cancel-popup-request',
  // Message called from inline element in popup.html (window.closeWindow), this is used only with webextensions to properly handle popup close event
  CLOSE_WINDOW: 'window.close',
  // todo: shouldn't it be UI_RESPONSE?
  ANALYTICS_RESPONSE: 'popup-analytics-response',
  /** webextension injected content script and content script notified popup */
  CONTENT_SCRIPT_LOADED: 'popup-content-script-loaded',
  /** method.info async getter result passed from core to popup */
  METHOD_INFO: 'popup-method-info'
};
const createPopupMessage = (type, payload) => ({
  event: UI_EVENT,
  type,
  payload
});
;// ../connect/src/events/call.ts


// conditionally unwrap TrezorConnect api method Success<T> response

// https://github.com/microsoft/TypeScript/issues/32164
// there is no native way how to get Parameters<Fn> for overloaded function
// current TrezorConnect api methods have exactly 2 overloads (if any)

// map TrezorConnect api with unwrapped methods

const RESPONSE_EVENT = 'RESPONSE_EVENT';
const createResponseMessage = (id, success, payload, device) => ({
  event: RESPONSE_EVENT,
  type: RESPONSE_EVENT,
  id,
  success,
  payload: success ? payload : serializeError(payload),
  device: device ? {
    path: device?.getUniquePath(),
    state: device?.getState(),
    instance: device?.getInstance()
  } : undefined
});
;// ../connect/src/events/device.ts
const DEVICE_EVENT = 'DEVICE_EVENT';
const DEVICE = {
  // device list events
  CONNECT: 'device-connect',
  CONNECT_UNACQUIRED: 'device-connect_unacquired',
  DISCONNECT: 'device-disconnect',
  CHANGED: 'device-changed',
  FIRMWARE_VERSION_CHANGED: 'device-firmware_version_changed',
  // trezor-link events in protobuf format
  BUTTON: 'button',
  PIN: 'pin',
  PASSPHRASE: 'passphrase',
  PASSPHRASE_ON_DEVICE: 'passphrase_on_device',
  WORD: 'word'
};
const createDeviceMessage = (type, payload) => ({
  event: DEVICE_EVENT,
  type,
  payload
});
;// ../connect/src/events/transport.ts




const TRANSPORT_EVENT = 'TRANSPORT_EVENT';
const createTransportMessage = (type, payload) => ({
  event: TRANSPORT_EVENT,
  type,
  payload: 'error' in payload ? serializeError(payload) :
  // suggest udev installer without setting "preferred" field
  {
    ...payload,
    udev: suggestUdevInstaller(),
    bridge: suggestBridgeInstaller()
  }
});
;// ../connect/src/events/blockchain.ts
const BLOCKCHAIN_EVENT = 'BLOCKCHAIN_EVENT';
const BLOCKCHAIN = {
  CONNECT: 'blockchain-connect',
  RECONNECTING: 'blockchain-reconnecting',
  ERROR: 'blockchain-error',
  BLOCK: 'blockchain-block',
  NOTIFICATION: 'blockchain-notification',
  FIAT_RATES_UPDATE: 'fiat-rates-update'
};
const createBlockchainMessage = (type, payload) => ({
  event: BLOCKCHAIN_EVENT,
  type,
  payload
});
;// ../connect/src/events/iframe.ts

const IFRAME = {
  // Message called from iframe.html inline script before "window.onload" event. This is first message from iframe to window.opener.
  BOOTSTRAP: 'iframe-bootstrap',
  // Message from iframe.js to window.opener, called after "window.onload" event. This is second message from iframe to window.opener.
  LOADED: 'iframe-loaded',
  // Message from window.opener to iframe.js
  INIT: 'iframe-init',
  // Error message from iframe.js to window.opener. Could be thrown during iframe initialization process
  ERROR: 'iframe-error',
  // Message from window.opener to iframe. Call method
  CALL: 'iframe-call',
  // Message from third party window to iframe to add log to shared worker logger.
  LOG: 'iframe-log'
};
const createIFrameMessage = (type, payload) => ({
  event: UI_EVENT,
  type,
  payload
});
;// ../utils/src/logs.ts
class Log {
  css = '';
  MAX_ENTRIES = 100;
  constructor(prefix, enabled, logWriter) {
    this.prefix = prefix;
    this.enabled = enabled;
    this.messages = [];
    if (logWriter) {
      this.logWriter = logWriter;
    }
  }
  setColors(colors) {
    this.css = typeof window !== 'undefined' && colors[this.prefix] ? colors[this.prefix] : '';
  }
  addMessage({
    level,
    prefix,
    timestamp
  }, ...args) {
    const message = {
      level,
      prefix,
      css: this.css,
      message: args,
      timestamp: timestamp || Date.now()
    };
    this.messages.push(message);
    if (this.logWriter) {
      try {
        this.logWriter.add(message);
      } catch (err) {
        // If this error happens it probably means that we are logging an object with a circular reference.
        // If there is any `device` logged, do it with `device.toMessageObject()` instead.
        console.error('There was an error adding log message', err, message);
      }
    }
    if (this.messages.length > this.MAX_ENTRIES) {
      this.messages.shift();
    }
  }
  setWriter(logWriter) {
    this.logWriter = logWriter;
  }
  log(...args) {
    this.addMessage({
      level: 'log',
      prefix: this.prefix
    }, ...args);
    if (this.enabled) {
      // eslint-disable-next-line no-console
      console.log(`%c${this.prefix}`, this.css, ...args);
    }
  }
  error(...args) {
    this.addMessage({
      level: 'error',
      prefix: this.prefix
    }, ...args);
    if (this.enabled) {
      console.error(`%c${this.prefix}`, this.css, ...args);
    }
  }
  info(...args) {
    this.addMessage({
      level: 'info',
      prefix: this.prefix
    }, ...args);
    if (this.enabled) {
      // eslint-disable-next-line no-console
      console.info(`%c${this.prefix}`, this.css, ...args);
    }
  }
  warn(...args) {
    this.addMessage({
      level: 'warn',
      prefix: this.prefix
    }, ...args);
    if (this.enabled) {
      console.warn(`%c${this.prefix}`, this.css, ...args);
    }
  }
  debug(...args) {
    this.addMessage({
      level: 'debug',
      prefix: this.prefix
    }, ...args);
    if (this.enabled) {
      if (this.css) {
        // eslint-disable-next-line no-console
        console.log(`%c${this.prefix}`, this.css, ...args);
      } else {
        // eslint-disable-next-line no-console
        console.log(this.prefix, ...args);
      }
    }
  }
  getLog() {
    return this.messages;
  }
}
;// ../utils/src/logsManager.ts

class LogsManager {
  logs = {};
  colors = {};
  constructor({
    colors
  }) {
    this.colors = colors;
  }
  initLog(prefix, enabled, logWriter) {
    const instanceWriter = logWriter || this.writer;
    const instance = new Log(prefix, !!enabled, instanceWriter);
    if (this.colors) {
      instance.setColors(this.colors);
    }
    this.logs[prefix] = instance;
    return instance;
  }
  setLogWriter(logWriterFactory) {
    Object.keys(this.logs).forEach(key => {
      this.writer = logWriterFactory();
      if (this.writer) {
        this.logs[key].setWriter(this.writer);
        const {
          messages
        } = this.logs[key];
        // If there are any messages in the log when init, add them to the writer.
        messages.forEach(message => {
          this.writer?.add(message);
        });
      }
    });
  }
  enableLog(enabled) {
    Object.keys(this.logs).forEach(key => {
      this.logs[key].enabled = !!enabled;
    });
  }
  enableLogByPrefix(prefix, enabled) {
    if (this.logs[prefix]) {
      this.logs[prefix].enabled = enabled;
    }
  }
  getLog() {
    let logs = [];
    Object.keys(this.logs).forEach(key => {
      logs = logs.concat(this.logs[key].messages);
    });
    logs.sort((a, b) => a.timestamp - b.timestamp);
    return logs;
  }
}
;// ../connect/src/utils/debug.ts

const green = '#bada55';
const blue = '#20abd8';
const orange = '#f4a744';
const yellow = '#fbd948';
const colors = {
  // blue, npm package related
  '@trezor/connect': `color: ${blue}; background: #000;`,
  '@trezor/connect-web': `color: ${blue}; background: #000;`,
  '@trezor/connect-webextension': `color: ${blue}; background: #000;`,
  // orange, api related
  IFrame: `color: ${orange}; background: #000;`,
  Core: `color: ${orange}; background: #000;`,
  // green, device related
  DeviceList: `color: ${green}; background: #000;`,
  Device: `color: ${green}; background: #000;`,
  DeviceCommands: `color: ${green}; background: #000;`,
  '@trezor/transport': `color: ${green}; background: #000;`,
  InteractionTimeout: `color: ${green}; background: #000;`,
  // yellow, ui related
  '@trezor/connect-popup': `color: ${yellow}; background: #000;`
};
const logsManager = new LogsManager({
  colors
});
const initLog = logsManager.initLog.bind(logsManager);
const setLogWriter = logsManager.setLogWriter.bind(logsManager);
const enableLog = logsManager.enableLog.bind(logsManager);
const enableLogByPrefix = logsManager.enableLogByPrefix.bind(logsManager);
const getLog = logsManager.getLog.bind(logsManager);
;// ../utils/src/createDeferred.ts
// unwrap promise response from Deferred

const createDeferred = id => {
  let localResolve = () => {};
  let localReject = () => {};
  const promise = new Promise((resolve, reject) => {
    localResolve = resolve;
    localReject = reject;
  });
  return {
    id,
    resolve: localResolve,
    reject: localReject,
    promise
  };
};
;// ../utils/src/createDeferredManager.ts

/**
 * Handles the frequently repeated pattern of many deferred promises with unique ids
 * (usually requests), which can be resolved or rejected in a random order, or they can
 * time out
 *
 * @param options optional default timeout and onTimeout callback
 *
 * @returns Deferred promise manager instance
 */
const createDeferredManager = options => {
  const {
    initialId = 0,
    timeout: defaultTimeout = 0,
    onTimeout
  } = options ?? {};
  const promises = [];
  let ID = initialId;
  let timeoutHandle;
  const length = () => promises.length;
  const nextId = () => ID;
  const replanTimeout = () => {
    const now = Date.now();
    const nearestDeadline = promises.reduce((prev, {
      deadline
    }) => (prev && deadline ? Math.min : Math.max)(prev, deadline), 0);
    if (timeoutHandle) clearTimeout(timeoutHandle);
    timeoutHandle = nearestDeadline ?
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setTimeout(timeoutCallback, Math.max(nearestDeadline - now, 0)) // TODO min safe interval instead of zero?
    : undefined;
  };
  const timeoutCallback = () => {
    const now = Date.now();
    promises.filter(promise => promise.deadline && promise.deadline <= now).forEach(promise => {
      onTimeout?.(promise.id);
      promise.deadline = 0;
    });
    replanTimeout();
  };
  const create = (timeout = defaultTimeout) => {
    const promiseId = ID++;
    const deferred = createDeferred(promiseId);
    const deadline = timeout && Date.now() + timeout;
    promises.push({
      ...deferred,
      deadline
    });
    if (timeout) replanTimeout();
    return {
      promiseId,
      promise: deferred.promise
    };
  };
  const extract = promiseId => {
    const index = promises.findIndex(({
      id
    }) => id === promiseId);
    const [promise] = index >= 0 ? promises.splice(index, 1) : [undefined];
    if (promise?.deadline) replanTimeout();
    return promise;
  };
  const resolve = (promiseId, value) => {
    const promise = extract(promiseId);
    promise?.resolve(value);
    return !!promise;
  };
  const reject = (promiseId, error) => {
    const promise = extract(promiseId);
    promise?.reject(error);
    return !!promise;
  };
  const rejectAll = error => {
    promises.forEach(promise => promise.reject(error));
    const deleted = promises.splice(0, promises.length);
    if (deleted.length) replanTimeout();
  };
  return {
    length,
    nextId,
    create,
    resolve,
    reject,
    rejectAll
  };
};
;// ../connect/src/utils/urlUtils.ts
// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/urlUtils.js


const getOrigin = url => {
  if (typeof url !== 'string') return 'unknown';
  if (url.indexOf('file://') === 0) return 'file://';
  const [origin] = url.match(/^https?:\/\/[^/]+/) ?? [];
  return origin ?? 'unknown';
};
const getHost = url => {
  if (typeof url !== 'string') return;
  const [,, uri] = url.match(/^(https?):\/\/([^:/]+)?/i) ?? [];
  if (uri) {
    const parts = uri.split('.');

    // allow localhost subdomains
    if (parts[parts.length - 1] === 'localhost') return 'localhost';
    return parts.length > 2 ?
    // slice subdomain
    parts.slice(parts.length - 2, parts.length).join('.') : uri;
  }
};
const getOnionDomain = (url, dict) => {
  if (Array.isArray(url)) return url.map(u => urlToOnion(u, dict) ?? u);
  if (typeof url === 'string') return urlToOnion(url, dict) ?? url;
  return url;
};
;// ./src/iframe/inlineStyles.ts
// origin: https://github.com/trezor/connect/blob/develop/src/js/iframe/inline-styles.js

const css = '.trezorconnect-container{position:fixed!important;display:-webkit-box!important;display:-webkit-flex!important;display:-ms-flexbox!important;display:flex!important;-webkit-box-orient:vertical!important;-webkit-box-direction:normal!important;-webkit-flex-direction:column!important;-ms-flex-direction:column!important;flex-direction:column!important;-webkit-box-align:center!important;-webkit-align-items:center!important;-ms-flex-align:center!important;align-items:center!important;z-index:10000!important;width:100%!important;height:100%!important;top:0!important;left:0!important;background:rgba(0,0,0,.35)!important;overflow:auto!important;padding:20px!important;margin:0!important}.trezorconnect-container .trezorconnect-window{position:relative!important;display:block!important;width:370px!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif!important;margin:auto!important;border-radius:3px!important;background-color:#fff!important;text-align:center!important;overflow:hidden!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head{text-align:left;padding:12px 24px!important;display:-webkit-box!important;display:-webkit-flex!important;display:-ms-flexbox!important;display:flex!important;-webkit-box-align:center!important;-webkit-align-items:center!important;-ms-flex-align:center!important;align-items:center!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-logo{-webkit-box-flex:1;-webkit-flex:1;-ms-flex:1;flex:1}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close{cursor:pointer!important;height:24px!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close svg{fill:#757575;-webkit-transition:fill .3s ease-in-out!important;transition:fill .3s ease-in-out!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close:hover svg{fill:#494949}.trezorconnect-container .trezorconnect-window .trezorconnect-body{padding:24px 24px 32px!important;background:#FBFBFB!important;border-top:1px solid #EBEBEB}.trezorconnect-container .trezorconnect-window .trezorconnect-body h3{color:#505050!important;font-size:16px!important;font-weight:500!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body p{margin:8px 0 24px!important;font-weight:400!important;color:#A9A9A9!important;font-size:12px!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button{width:100%!important;padding:12px 24px!important;margin:0!important;border-radius:3px!important;font-size:14px!important;font-weight:300!important;cursor:pointer!important;background:#01B757!important;color:#fff!important;border:0!important;-webkit-transition:background-color .3s ease-in-out!important;transition:background-color .3s ease-in-out!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button:hover{background-color:#00AB51!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button:active{background-color:#009546!important}/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImlucHV0IiwiJHN0ZGluIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWNBLHlCQUNJLFNBQUEsZ0JBQ0EsUUFBQSxzQkFDQSxRQUFBLHVCQUNBLFFBQUEsc0JBRUEsUUFBQSxlQUNBLG1CQUFBLG1CQUNBLHNCQUFBLGlCQUNBLHVCQUFBLGlCQUNBLG1CQUFBLGlCQUNBLGVBQUEsaUJBRUEsa0JBQUEsaUJBQ0Esb0JBQUEsaUJBQ0EsZUFBQSxpQkNmTSxZQUFhLGlCREFyQixRQUFTLGdCQWtCSCxNQUFBLGVBQ0EsT0FBQSxlQUNBLElBQUEsWUFDQSxLQUFBLFlBQ0EsV0FBQSwwQkFDQSxTQUFBLGVBQ0EsUUFBQSxlQUNBLE9BQUEsWUNkUiwrQ0RYRSxTQUFVLG1CQTZCQSxRQUFBLGdCQUNBLE1BQUEsZ0JBQ0EsWUFBQSxjQUFBLG1CQUFBLFdBQUEsT0FBQSxpQkFBQSxNQUFBLHFCQUNBLE9BQUEsZUNmVixjQUFlLGNEakJmLGlCQWlCRSxlQWtCWSxXQUFBLGlCQ2ZkLFNBQVUsaUJEbUJJLG1FQUNBLFdBQUEsS0NoQmQsUUFBUyxLQUFLLGVEeEJkLFFBQVMsc0JBMENTLFFBQUEsdUJBQ0EsUUFBQSxzQkNmbEIsUUFBUyxlRGlCSyxrQkE1QlosaUJBOEJvQixvQkFBQSxpQkNoQmxCLGVBQWdCLGlCRC9CWixZQWlCTixpQkFzQ1EsdUZBQ0EsaUJBQUEsRUNwQlYsYUFBYyxFRHBDVixTQUFVLEVBMkRBLEtBQUEsRUFFQSx3RkNwQmQsT0FBUSxrQkR6Q1IsT0FBUSxlQWlFTSw0RkFDQSxLQUFBLFFBQ0EsbUJBQUEsS0FBQSxJQUFBLHNCQ3BCZCxXQUFZLEtBQUssSUFBSyxzQkR3QlIsa0dBQ0EsS0FBQSxRQUVBLG1FQUNBLFFBQUEsS0FBQSxLQUFBLGVBQ0EsV0FBQSxrQkFDQSxXQUFBLElBQUEsTUFBQSxRQUVBLHNFQUNBLE1BQUEsa0JBQ0EsVUFBQSxlQ3JCZCxZQUFhLGNEd0JLLHFFQ3JCbEIsT0FBUSxJQUFJLEVBQUksZUR3QkYsWUFBQSxjQUNJLE1BQUEsa0JDdEJsQixVQUFXLGVBRWIsMEVBQ0UsTUFBTyxlQUNQLFFBQVMsS0FBSyxlQUNkLE9BQVEsWUFDUixjQUFlLGNBQ2YsVUFBVyxlQUNYLFlBQWEsY0FDYixPQUFRLGtCQUNSLFdBQVksa0JBQ1osTUFBTyxlQUNQLE9BQVEsWUFDUixtQkFBb0IsaUJBQWlCLElBQUssc0JBQzFDLFdBQVksaUJBQWlCLElBQUssc0JBRXBDLGdGQUNFLGlCQUFrQixrQkFFcEIsaUZBQ0UsaUJBQWtCIn0= */';
/* harmony default export */ const inlineStyles = (css);
;// ./src/iframe/index.ts
// origin: https://github.com/trezor/connect/blob/develop/src/js/iframe/builder.js







let instance;
let origin;
let initPromise = createDeferred();
let timeout = 0;
let error;
const dispose = () => {
  if (instance && instance.parentNode) {
    try {
      instance.parentNode.removeChild(instance);
    } catch {
      // do nothing
    }
  }
  instance = null;
  timeout = 0;
};
const handleIframeBlocked = () => {
  window.clearTimeout(timeout);
  error = TypedError('Init_IframeBlocked');
  dispose();
  initPromise.reject(error);
};
const injectStyleSheet = () => {
  if (!instance) {
    throw TypedError('Init_IframeBlocked');
  }
  const doc = instance.ownerDocument;
  const head = doc.head || doc.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.setAttribute('id', 'TrezorConnectStylesheet');

  // @ts-expect-error
  if (style.styleSheet) {
    // @ts-expect-error
    style.styleSheet.cssText = inlineStyles;
    head.appendChild(style);
  } else {
    style.appendChild(document.createTextNode(inlineStyles));
    head.append(style);
  }
};
const init = async settings => {
  initPromise = createDeferred();
  const existedFrame = document.getElementById('trezorconnect');
  if (existedFrame) {
    instance = existedFrame;
  } else {
    instance = document.createElement('iframe');
    instance.frameBorder = '0';
    instance.width = '0px';
    instance.height = '0px';
    instance.style.position = 'absolute';
    instance.style.display = 'none';
    instance.style.border = '0px';
    instance.style.width = '0px';
    instance.style.height = '0px';
    instance.id = 'trezorconnect';
  }
  let src;
  if (settings.env === 'web') {
    const manifestString = settings.manifest ? JSON.stringify(settings.manifest) : 'undefined'; // note: btoa(undefined) === btoa('undefined') === "dW5kZWZpbmVk"
    const manifest = `version=${settings.version}&manifest=${encodeURIComponent(btoa(JSON.stringify(manifestString)))}`;
    src = `${settings.iframeSrc}?${manifest}`;
  } else {
    src = settings.iframeSrc;
  }
  if (!src.startsWith('http://') && !src.startsWith('https://')) {
    return;
  }
  instance.setAttribute('src', src);
  if (navigator.usb) {
    instance.setAttribute('allow', 'usb');
  }
  origin = getOrigin(instance.src);
  timeout = window.setTimeout(() => {
    initPromise.reject(TypedError('Init_IframeTimeout'));
  }, 10000);
  const onLoad = () => {
    if (!instance) {
      initPromise.reject(TypedError('Init_IframeBlocked'));
      return;
    }
    try {
      // if hosting page is able to access cross-origin location it means that the iframe is not loaded
      const iframeOrigin = instance.contentWindow?.location.origin;
      if (!iframeOrigin || iframeOrigin === 'null') {
        handleIframeBlocked();
        return;
      }
    } catch {
      // empty
    }
    let extension;
    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.onConnect !== 'undefined') {
      chrome.runtime.onConnect.addListener(() => {});
      extension = chrome.runtime.id;
    }
    instance.contentWindow?.postMessage({
      type: IFRAME.INIT,
      payload: {
        settings,
        extension
      }
    }, origin);
    instance.onload = null;
  };

  // IE hack
  // @ts-expect-error
  if (instance.attachEvent) {
    // @ts-expect-error
    instance.attachEvent('onload', onLoad);
  } else {
    instance.onload = onLoad;
  }
  // inject iframe into host document body
  if (document.body) {
    document.body.appendChild(instance);
    injectStyleSheet();
  }
  try {
    await initPromise.promise;
  } catch (e) {
    // reset state to allow initialization again
    if (instance) {
      if (instance.parentNode) {
        instance.parentNode.removeChild(instance);
      }
      instance = null;
    }
    throw e;
  } finally {
    window.clearTimeout(timeout);
    timeout = 0;
  }
};
const postMessage = message => {
  if (!instance) {
    throw TypedError('Init_IframeBlocked');
  }
  instance.contentWindow?.postMessage(message, origin);
};
const iframe_clearTimeout = () => {
  window.clearTimeout(timeout);
};
const initIframeLogger = () => {
  const logWriterFactory = () => ({
    add: message => {
      postMessage({
        type: IFRAME.LOG,
        payload: message
      });
    }
  });
  setLogWriter(logWriterFactory);
};
;// ../utils/src/scheduleAction.ts
// Ignored when attempts is AttemptParams[]

const isArray = attempts => Array.isArray(attempts);
const resolveAfterMs = (ms, clear) => new Promise((resolve, reject) => {
  if (clear.aborted) return reject();
  if (ms === undefined) return resolve();
  // eslint-disable-next-line prefer-const
  let timeout;
  const onClear = () => {
    clearTimeout(timeout);
    clear.removeEventListener('abort', onClear);
    reject();
  };
  timeout = setTimeout(() => {
    clear.removeEventListener('abort', onClear);
    resolve();
  }, ms);
  clear.addEventListener('abort', onClear);
});
const rejectAfterMs = (ms, reason, clear) => new Promise((_, reject) => {
  if (clear.aborted) return reject();
  // eslint-disable-next-line prefer-const
  let timeout;
  const onClear = () => {
    clearTimeout(timeout);
    clear.removeEventListener('abort', onClear);
    reject();
  };
  timeout = setTimeout(() => {
    clear.removeEventListener('abort', onClear);
    reject(reason);
  }, ms);
  clear.addEventListener('abort', onClear);
});
const maybeRejectAfterMs = (ms, reason, clear) => ms === undefined ? [] : [rejectAfterMs(ms, reason, clear)];
const SCHEDULE_ACTION_ABORTED_ERROR_MESSAGE = 'Aborted by signal';
class RejectWhenAbortedError extends Error {
  constructor() {
    super(SCHEDULE_ACTION_ABORTED_ERROR_MESSAGE);
  }
}
const rejectWhenAborted = (signal, clear) => new Promise((_, reject) => {
  const errorSignal = new RejectWhenAbortedError();
  if (clear.aborted) return reject(errorSignal);
  if (signal?.aborted) return reject(errorSignal);
  const onAbort = () => reject(errorSignal);
  signal?.addEventListener('abort', onAbort);
  const onClear = () => {
    signal?.removeEventListener('abort', onAbort);
    clear.removeEventListener('abort', onClear);
    reject();
  };
  clear.addEventListener('abort', onClear);
});
const resolveAction = async (action, clear) => {
  const aborter = new AbortController();
  if (clear.aborted) aborter.abort();
  const onClear = () => {
    clear.removeEventListener('abort', onClear);
    aborter.abort();
  };
  clear.addEventListener('abort', onClear);
  try {
    return await new Promise(resolve => resolve(action(aborter.signal)));
  } finally {
    if (!clear.aborted) clear.removeEventListener('abort', onClear);
  }
};
const attemptLoop = async (attempts, attempt, failure, clear) => {
  // Tries only (attempts - 1) times, because the last attempt throws its error
  for (let a = 0; a < attempts - 1; a++) {
    if (clear.aborted) break;
    const aborter = new AbortController();
    const onClear = () => aborter.abort();
    clear.addEventListener('abort', onClear);
    try {
      return await attempt(a, aborter.signal);
    } catch (error) {
      onClear();
      await failure(a, error);
    } finally {
      clear.removeEventListener('abort', onClear);
    }
  }
  return clear.aborted ? Promise.reject() : attempt(attempts - 1, clear);
};
const SCHEDULE_ACTION_TIMEOUT_ERROR_MESSAGE = 'Aborted by timeout';
class ScheduleActionTimeoutError extends Error {
  constructor() {
    super(SCHEDULE_ACTION_TIMEOUT_ERROR_MESSAGE);
  }
}
const SCHEDULE_ACTION_DEADLINE_ERROR_MESSAGE = 'Aborted by deadline';
class ScheduleActionDeadlineError extends Error {
  constructor() {
    super(SCHEDULE_ACTION_DEADLINE_ERROR_MESSAGE);
  }
}
const scheduleAction = async (action, params) => {
  const {
    signal,
    delay,
    attempts,
    timeout,
    deadline,
    gap,
    attemptFailureHandler
  } = params;
  const deadlineMs = deadline && deadline - Date.now();
  const attemptCount = isArray(attempts) ? attempts.length : attempts ?? (deadline ? Infinity : 1);
  const clearAborter = new AbortController();
  const clear = clearAborter.signal;
  const getParams = isArray(attempts) ? attempt => attempts[attempt] : () => ({
    timeout,
    gap
  });
  const errorDeadline = new ScheduleActionDeadlineError();
  const errorTimeout = new ScheduleActionTimeoutError();
  try {
    return await Promise.race([rejectWhenAborted(signal, clear), ...maybeRejectAfterMs(deadlineMs, errorDeadline, clear), resolveAfterMs(delay, clear).then(() => attemptLoop(attemptCount, (attempt, abort) => Promise.race([...maybeRejectAfterMs(getParams(attempt).timeout, errorTimeout, clear), resolveAction(action, abort)]), (attempt, error) => {
      const errorHandlerResult = attemptFailureHandler?.(error);
      return errorHandlerResult ? Promise.reject(errorHandlerResult) : resolveAfterMs(getParams(attempt).gap ?? 0, clear);
    }, clear))]);
  } finally {
    clearAborter.abort();
  }
};
;// ./src/popup/showPopupRequest.ts
// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/showPopupRequest.js

const LAYER_ID = 'TrezorConnectInteractionLayer';
const HTML = `
    <div class="trezorconnect-container" id="${LAYER_ID}">
        <div class="trezorconnect-window">
            <div class="trezorconnect-head">
                <svg class="trezorconnect-logo" x="0px" y="0px" viewBox="0 0 163.7 41.9" width="78px" height="20px" preserveAspectRatio="xMinYMin meet">
                    <polygon points="101.1,12.8 118.2,12.8 118.2,17.3 108.9,29.9 118.2,29.9 118.2,35.2 101.1,35.2 101.1,30.7 110.4,18.1 101.1,18.1"/>
                    <path d="M158.8,26.9c2.1-0.8,4.3-2.9,4.3-6.6c0-4.5-3.1-7.4-7.7-7.4h-10.5v22.3h5.8v-7.5h2.2l4.1,7.5h6.7L158.8,26.9z M154.7,22.5 h-4V18h4c1.5,0,2.5,0.9,2.5,2.2C157.2,21.6,156.2,22.5,154.7,22.5z"/>
                    <path d="M130.8,12.5c-6.8,0-11.6,4.9-11.6,11.5s4.9,11.5,11.6,11.5s11.7-4.9,11.7-11.5S137.6,12.5,130.8,12.5z M130.8,30.3 c-3.4,0-5.7-2.6-5.7-6.3c0-3.8,2.3-6.3,5.7-6.3c3.4,0,5.8,2.6,5.8,6.3C136.6,27.7,134.2,30.3,130.8,30.3z"/>
                    <polygon points="82.1,12.8 98.3,12.8 98.3,18 87.9,18 87.9,21.3 98,21.3 98,26.4 87.9,26.4 87.9,30 98.3,30 98.3,35.2 82.1,35.2 "/>
                    <path d="M24.6,9.7C24.6,4.4,20,0,14.4,0S4.2,4.4,4.2,9.7v3.1H0v22.3h0l14.4,6.7l14.4-6.7h0V12.9h-4.2V9.7z M9.4,9.7 c0-2.5,2.2-4.5,5-4.5s5,2,5,4.5v3.1H9.4V9.7z M23,31.5l-8.6,4l-8.6-4V18.1H23V31.5z"/>
                    <path d="M79.4,20.3c0-4.5-3.1-7.4-7.7-7.4H61.2v22.3H67v-7.5h2.2l4.1,7.5H80l-4.9-8.3C77.2,26.1,79.4,24,79.4,20.3z M71,22.5h-4V18 h4c1.5,0,2.5,0.9,2.5,2.2C73.5,21.6,72.5,22.5,71,22.5z"/>
                    <polygon points="40.5,12.8 58.6,12.8 58.6,18.1 52.4,18.1 52.4,35.2 46.6,35.2 46.6,18.1 40.5,18.1 "/>
                </svg>
                <div class="trezorconnect-close">
                    <svg x="0px" y="0px" viewBox="24 24 60 60" width="24px" height="24px" preserveAspectRatio="xMinYMin meet">
                        <polygon class="st0" points="40,67.9 42.1,70 55,57.1 67.9,70 70,67.9 57.1,55 70,42.1 67.9,40 55,52.9 42.1,40 40,42.1 52.9,55 "/>
                    </svg>
                </div>
            </div>
            <div class="trezorconnect-body">
                <h3>Popup was blocked</h3>
                <p>Please click to "Continue" to open popup manually</p>
                <button class="trezorconnect-open">Continue</button>
            </div>
        </div>
    </div>
`;
const showPopupRequest = (open, cancel) => {
  if (document.getElementById(LAYER_ID)) {
    return;
  }
  const div = document.createElement('div');
  div.id = LAYER_ID;
  div.className = 'trezorconnect-container';
  div.innerHTML = HTML;
  if (document.body) {
    document.body.appendChild(div);
  }
  const button = div.getElementsByClassName('trezorconnect-open')[0];
  button.onclick = () => {
    open();
    if (document.body) {
      document.body.removeChild(div);
    }
  };
  const close = div.getElementsByClassName('trezorconnect-close')[0];
  close.onclick = () => {
    cancel();
    if (document.body) {
      document.body.removeChild(div);
    }
  };
};
;// ../utils/src/typedEventEmitter.ts
/*
Usage example:
type EventMap = {
    obj: { id: string };
    primitive: boolean | number | string | symbol;
    noArgs: undefined;
    multipleArgs: (a: number, b: string, c: boolean) => void;
    [type: `dynamic/${string}`]: boolean;
};
*/


// NOTE: case 1. looks like case 4. but works differently. the order matters

// 4. default

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class TypedEmitter extends events.EventEmitter {
  // implement at least one function
  listenerCount(eventName) {
    return super.listenerCount(eventName);
  }
}
;// ../connect-common/src/storage.ts
// https://github.com/trezor/connect/blob/develop/src/js/storage/index.js


const storageVersion = 2;
const storageName = `storage_v${storageVersion}`;

/**
 * remembered:
 *  - physical device from webusb pairing dialogue
 *  - passphrase to be used
 */

// TODO: move storage somewhere else. Having it here brings couple of problems:
// - We can not import types from connect (would cause cyclic dependency)
// - it has here dependency on window object, not good

const getEmptyState = () => ({
  origin: {}
});
let memoryStorage = getEmptyState();
const getPermanentStorage = () => {
  const ls = localStorage.getItem(storageName);
  return ls ? JSON.parse(ls) : getEmptyState();
};
class Storage extends TypedEmitter {
  save(getNewState, temporary = false) {
    if (temporary || !__webpack_require__.g.window) {
      memoryStorage = getNewState(memoryStorage);
      return;
    }
    try {
      const newState = getNewState(getPermanentStorage());
      localStorage.setItem(storageName, JSON.stringify(newState));
      this.emit('changed', newState);
    } catch {
      // memory storage is fallback of the last resort
      console.warn('long term storage not available');
      memoryStorage = getNewState(memoryStorage);
    }
  }
  saveForOrigin(getNewState, origin, temporary = false) {
    this.save(state => ({
      ...state,
      origin: {
        ...state.origin,
        [origin]: getNewState(state.origin?.[origin] || {})
      }
    }), temporary);
  }
  load(temporary = false) {
    if (temporary || !__webpack_require__.g?.window?.localStorage) {
      return memoryStorage;
    }
    try {
      return getPermanentStorage();
    } catch {
      // memory storage is fallback of the last resort
      console.warn('long term storage not available');
      return memoryStorage;
    }
  }
  loadForOrigin(origin, temporary = false) {
    const state = this.load(temporary);
    return state.origin?.[origin] || {};
  }
}
const storage = new Storage();

;// ../connect-common/src/messageChannel/abstract.ts
/**
 * IMPORTS WARNING
 * this file is bundled into content script so be careful what you are importing not to bloat the bundle
 */



// TODO: so logger should be probably moved to connect common, or this file should be moved to connect
// import type { Log } from '@trezor/connect/src/utils/debug';

/**
 * concepts:
 * - it handshakes automatically with the other side of the channel
 * - it queues messages fired before handshake and sends them after handshake is done
 */
class AbstractMessageChannel extends TypedEmitter {
  messagePromises = {};
  /** queue of messages that were scheduled before handshake */
  messagesQueue = [];
  messageID = 0;
  isConnected = false;
  handshakeMaxRetries = 5;
  handshakeRetryInterval = 2000;

  /**
   * function that passes data to the other side of the channel
   */

  /**
   * channel identifiers that pairs AbstractMessageChannel instances on sending and receiving end together
   */

  constructor({
    sendFn,
    channel,
    logger,
    lazyHandshake = false,
    legacyMode = false
  }) {
    super();
    this.channel = channel;
    this.sendFn = sendFn;
    this.lazyHandshake = lazyHandshake;
    this.legacyMode = legacyMode;
    this.logger = logger;
  }

  /**
   * initiates handshake sequence with peer. resolves after communication with peer is established
   */
  init() {
    if (!this.handshakeFinished) {
      this.handshakeFinished = createDeferred();
      if (this.legacyMode) {
        // Bypass handshake for communication with legacy components
        // We add a delay for enough time for the other side to be ready
        setTimeout(() => {
          this.handshakeFinished?.resolve();
        }, 500);
      }
      if (!this.lazyHandshake) {
        // When `lazyHandshake` handshakeWithPeer will start when received channel-handshake-request.
        this.handshakeWithPeer();
      }
    }
    return this.handshakeFinished.promise;
  }

  /**
   * handshake between both parties of the channel.
   * both parties initiate handshake procedure and keep asking over time in a loop until they time out or receive confirmation from peer
   */
  handshakeWithPeer() {
    this.logger?.log(this.channel.here, 'handshake');
    return scheduleAction(async () => {
      this.postMessage({
        type: 'channel-handshake-request',
        data: {
          success: true,
          payload: undefined
        }
      }, {
        usePromise: false,
        useQueue: false
      });
      await this.handshakeFinished?.promise;
    }, {
      attempts: this.handshakeMaxRetries,
      timeout: this.handshakeRetryInterval
    }).then(() => {
      this.logger?.log(this.channel.here, 'handshake confirmed');
      this.messagesQueue.forEach(message => {
        message.channel = this.channel;
        this.sendFn(message);
      });
      this.messagesQueue = [];
    }).catch(() => {
      this.handshakeFinished?.reject(new Error('handshake failed'));
      this.handshakeFinished = undefined;
    });
  }

  /**
   * message received from communication channel in descendants of this class
   * should be handled by this common onMessage method
   */
  onMessage(_message) {
    // Older code used to send message as a data property of the message object.
    // This is a workaround to keep backward compatibility.
    let message = _message;
    if (this.legacyMode && message.type === undefined && 'data' in message && typeof message.data === 'object' && message.data !== null && 'type' in message.data && typeof message.data.type === 'string') {
      // @ts-expect-error
      message = message.data;
    }
    const {
      channel,
      id,
      type,
      ...data
    } = message;

    // Don't verify channel in legacy mode
    if (!this.legacyMode) {
      if (!channel?.peer || channel.peer !== this.channel.here) {
        // To wrong peer
        return;
      }
      if (!channel?.here || this.channel.peer !== channel.here) {
        // From wrong peer
        return;
      }
    }
    if (type === 'channel-handshake-request') {
      this.postMessage({
        type: 'channel-handshake-confirm',
        data: {
          success: true,
          payload: undefined
        }
      }, {
        usePromise: false,
        useQueue: false
      });
      if (this.lazyHandshake) {
        // When received channel-handshake-request in lazyHandshake mode we start from this side.
        this.handshakeWithPeer();
      }
      return;
    }
    if (type === 'channel-handshake-confirm') {
      this.handshakeFinished?.resolve(undefined);
      return;
    }
    if (this.messagePromises[id]) {
      this.messagePromises[id].resolve({
        id,
        ...data
      });
      delete this.messagePromises[id];
    }
    const messagePromisesLength = Object.keys(this.messagePromises).length;
    if (messagePromisesLength > 5) {
      this.logger?.warn(`too many message promises (${messagePromisesLength}). this feels unexpected!`);
    }

    // @ts-expect-error TS complains for odd reasons
    this.emit('message', message);
  }

  // todo: outgoing messages should be typed
  postMessage(message, {
    usePromise = true,
    useQueue = true
  } = {}) {
    message.channel = this.channel;
    if (!usePromise) {
      try {
        this.sendFn(message);
      } catch {
        if (useQueue) {
          this.messagesQueue.push(message);
        }
      }
      return;
    }
    this.messageID++;
    message.id = this.messageID;
    this.messagePromises[message.id] = createDeferred();
    try {
      this.sendFn(message);
    } catch {
      if (useQueue) {
        this.messagesQueue.push(message);
      }
    }
    return this.messagePromises[message.id].promise;
  }
  resolveMessagePromises(resolvePayload) {
    // This is used when we know that the connection has been interrupted but there might be something waiting for it.
    Object.keys(this.messagePromises).forEach(id => this.messagePromises[id].resolve({
      id,
      payload: resolvePayload
    }));
  }
  clear() {
    this.handshakeFinished = undefined;
  }
}
;// ../connect-common/src/index.ts



;// ./src/channels/serviceworker-window.ts


/**
 * Communication channel between:
 * - here: chrome message port (in service worker)
 * - peer: window.onMessage in trezor-content-script
 */
class ServiceWorkerWindowChannel extends AbstractMessageChannel {
  constructor({
    name,
    channel,
    logger,
    lazyHandshake,
    legacyMode,
    allowSelfOrigin = false,
    currentId
  }) {
    super({
      channel,
      sendFn: message => {
        if (!this.port) throw new Error('port not assigned');
        this.port.postMessage(message);
      },
      logger,
      lazyHandshake,
      legacyMode
    });
    this.name = name;
    this.allowSelfOrigin = allowSelfOrigin;
    this.currentId = currentId;
    this.connect();
  }
  connect() {
    chrome.runtime.onConnect.addListener(port => {
      if (port.name !== this.name) return;
      // Ignore port if name does match, but port created by different popup
      if (this.currentId?.() && this.currentId?.() !== port.sender?.tab?.id) return;
      this.port = port;
      this.port.onMessage.addListener((message, {
        sender
      }) => {
        if (!sender) {
          this.logger?.error('service-worker-window', 'no sender');
          return;
        }
        const {
          origin
        } = sender;
        const whitelist = ['https://connect.trezor.io', 'https://staging-connect.trezor.io', 'https://suite.corp.sldev.cz', 'https://dev.suite.sldev.cz', 'http://localhost:8088'];

        // If service worker is running in web extension and other env of this webextension
        // want to communicate with service worker it should be whitelisted.
        const webextensionId = chrome?.runtime?.id;
        if (webextensionId) {
          whitelist.push(`chrome-extension://${webextensionId}`);
        }
        // For Firefox the webextensionId is different from the URL
        const webextensionUrl = chrome?.runtime?.getURL('');
        if (webextensionUrl) {
          // Without trailing slash
          whitelist.push(webextensionUrl.slice(0, -1));
        }
        if (!origin) {
          this.logger?.error('connect-webextension/messageChannel/extensionPort/onMessage', 'no origin');
          return;
        }
        if (!whitelist.includes(origin)) {
          this.logger?.error('connect-webextension/messageChannel/extensionPort/onMessage', 'origin not whitelisted', origin);
          return;
        }

        // TODO: not completely sure that is necessary to prevent self origin communication sometimes.
        if (origin === self.origin && !this.allowSelfOrigin) {
          return;
        }
        this.onMessage(message);
      });
    });
    this.isConnected = true;
  }
  disconnect() {
    if (!this.isConnected) return;
    this.port?.disconnect();
    this.clear();
    this.isConnected = false;
  }
}
;// ./src/channels/window-window.ts


/**
 * Communication channel between:
 * - here: window.postMessage
 * - peer: window.onMessage
 */

class WindowWindowChannel extends AbstractMessageChannel {
  constructor({
    windowHere,
    windowPeer,
    channel,
    logger,
    origin,
    legacyMode
  }) {
    super({
      channel,
      sendFn: message => {
        windowPeer()?.postMessage(message, origin);
      },
      logger,
      legacyMode
    });
    this._listener = this.listener.bind(this);
    this._windowHere = windowHere;
    this.connect();
  }
  listener(event) {
    const message = {
      ...event.data,
      success: true,
      origin: event.origin,
      payload: event.data.payload || {},
      // This is added for compatibility when communicating with iframe/popup that doesn't have channel defined yet
      channel: event.data.channel || {
        peer: this.channel.here,
        here: this.channel.peer
      }
    };
    this.onMessage(message);
  }
  connect() {
    this._windowHere.addEventListener('message', this._listener);
    this.isConnected = true;
  }
  disconnect() {
    if (!this.isConnected) return;
    this._windowHere.removeEventListener('message', this._listener);
    this.isConnected = false;
  }
}
;// ./src/popup/index.ts
// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/PopupManager.js










// Util
const checkIfTabExists = tabId => new Promise(resolve => {
  if (!tabId) return resolve(false);
  function callback() {
    if (chrome.runtime.lastError) {
      resolve(false);
    } else {
      // Tab exists
      resolve(true);
    }
  }
  chrome.tabs.get(tabId, callback);
});

// Event `POPUP_REQUEST_TIMEOUT` is used to close Popup window when there was no handshake from iframe.
const POPUP_REQUEST_TIMEOUT = 850;
const POPUP_CLOSE_INTERVAL = 500;
const POPUP_OPEN_TIMEOUT = 5000;
class PopupManager extends (events_default()) {
  locked = false;
  extensionTabId = 0;
  constructor(settings, {
    logger
  }) {
    super();
    this.settings = settings;
    this.origin = getOrigin(settings.popupSrc);
    this.logger = logger;
    if (this.isWebExtensionWithTab()) {
      this.channel = new ServiceWorkerWindowChannel({
        name: 'trezor-connect',
        channel: {
          here: '@trezor/connect-webextension',
          peer: '@trezor/connect-content-script'
        },
        logger,
        currentId: () => {
          if (this.popupWindow?.mode === 'tab') return this.popupWindow?.tab.id;
        },
        legacyMode: !this.settings.useCoreInPopup
      });
    } else {
      this.channel = new WindowWindowChannel({
        windowHere: window,
        windowPeer: () => {
          if (this.popupWindow?.mode === 'window') return this.popupWindow?.window;
        },
        channel: {
          here: '@trezor/connect-web',
          peer: '@trezor/connect-popup'
        },
        logger,
        origin: this.origin,
        legacyMode: !this.settings.useCoreInPopup
      });
    }
    if (!this.settings.useCoreInPopup) {
      // If not in core, we need to create a channel for the iframe
      this.iframeHandshakePromise = createDeferred(IFRAME.LOADED);
      this.channelIframe = new WindowWindowChannel({
        windowHere: window,
        windowPeer: () => window,
        channel: {
          here: '@trezor/connect-web',
          peer: '@trezor/connect-iframe'
        },
        logger,
        origin: this.origin
      });
      this.channelIframe?.on('message', this.handleMessage.bind(this));
    }
    if (this.settings.useCoreInPopup) {
      // Core mode
      this.handshakePromise = createDeferred();
      this.channel.on('message', this.handleCoreMessage.bind(this));
      return;
    } else if (this.isWebExtensionWithTab()) {
      // Webextension iframe
      this.channel.on('message', this.handleExtensionMessage.bind(this));
    } else {
      // Web
      this.channel.on('message', this.handleMessage.bind(this));
    }
    this.channel.init();
  }
  async request() {
    // popup request

    // check if current popup window is still open
    if (this.settings.useCoreInPopup && this.popupWindow?.mode === 'tab') {
      const currentPopupExists = await checkIfTabExists(this.popupWindow?.tab?.id);
      if (!currentPopupExists) {
        this.clear();
      }
    }

    // bring popup window to front
    if (this.locked) {
      if (this.popupWindow?.mode === 'tab' && this.popupWindow.tab.id) {
        chrome.tabs.update(this.popupWindow.tab.id, {
          active: true
        });
      } else if (this.popupWindow?.mode === 'window') {
        this.popupWindow.window.focus();
      }
      return;
    }

    // When requesting a popup window and there is a reference to popup window and it is not locked
    // we close it so we can open a new one.
    // This is necessary when popup window is in error state and we want to open a new one.
    if (this.popupWindow && !this.locked) {
      this.close();
    }
    const openFn = this.open.bind(this);
    this.locked = true;
    const timeout = this.settings.env === 'webextension' ? 1 : POPUP_REQUEST_TIMEOUT;
    this.requestTimeout = setTimeout(() => {
      this.requestTimeout = undefined;
      openFn();
    }, timeout);
  }
  unlock() {
    this.locked = false;
  }
  open() {
    const src = this.settings.popupSrc;
    this.popupPromise = createDeferred(POPUP.LOADED);
    const url = this.buildPopupUrl(src);
    this.openWrapper(url);
    this.closeInterval = setInterval(() => {
      if (!this.popupWindow) return;
      if (this.popupWindow.mode === 'tab' && this.popupWindow.tab.id) {
        chrome.tabs.get(this.popupWindow.tab.id, tab => {
          if (!tab) {
            // If no reference to popup window, it was closed by user or by this.close() method.
            this.emitClosed();
            this.clear();
          }
        });
      } else if (this.popupWindow.mode === 'window' && this.popupWindow.window.closed) {
        this.clear();
        this.emitClosed();
      }
    }, POPUP_CLOSE_INTERVAL);
    if (this.settings.useCoreInPopup) {
      // Open timeout not used in Core mode, we can't run showPopupRequest with no DOM
      return;
    }

    // open timeout will be cancelled by POPUP.BOOTSTRAP message
    this.openTimeout = setTimeout(() => {
      this.clear();
      showPopupRequest(this.open.bind(this), () => {
        this.emitClosed();
      });
    }, POPUP_OPEN_TIMEOUT);
  }
  buildPopupUrl(src) {
    const params = new URLSearchParams();
    params.set('version', VERSION);
    params.set('env', this.settings.env);
    // Pass extension ID to popup via query string
    if (this.settings.env === 'webextension' && chrome?.runtime?.id) {
      params.set('extension-id', chrome.runtime.id);
      params.set('cs-ver', CONTENT_SCRIPT_VERSION.toString());
    }
    return src + '?' + params.toString();
  }
  openWrapper(url) {
    if (this.isWebExtensionWithTab()) {
      chrome.windows.getCurrent(currentWindow => {
        this.logger.debug('opening popup. currentWindow: ', currentWindow);
        // Request coming from extension popup,
        // create new window above instead of opening new tab
        if (currentWindow.type !== 'normal') {
          chrome.windows.create({
            url
          }, newWindow => {
            chrome.tabs.query({
              windowId: newWindow?.id,
              active: true
            }, tabs => {
              this.popupWindow = {
                mode: 'tab',
                tab: tabs[0]
              };
              this.injectContentScript(tabs[0].id);
            });
          });
        } else {
          chrome.tabs.query({
            currentWindow: true,
            active: true
          }, tabs => {
            this.extensionTabId = tabs[0].id;
            chrome.tabs.create({
              url,
              index: tabs[0].index + 1
            }, tab => {
              this.popupWindow = {
                mode: 'tab',
                tab
              };
              this.injectContentScript(tab.id);
            });
          });
        }
      });
    } else {
      const windowResult = window.open(url, 'modal');
      if (!windowResult) return;
      this.popupWindow = {
        mode: 'window',
        window: windowResult
      };
    }
    if (!this.channel.isConnected) {
      this.channel.connect();
    }
  }
  injectContentScript = tabId => {
    chrome.permissions.getAll(permissions => {
      if (permissions.permissions?.includes('scripting')) {
        // Retry due to Firefox where the content script is sometimes not injected on the first try
        scheduleAction(() => chrome.scripting.executeScript({
          target: {
            tabId
          },
          // content script is injected into body of func in build time.
          func: () => {
            // <!--content-script-->
          }
        }).then(() => {
          this.logger.debug('content script injected');
        }).catch(error => {
          this.logger.error('content script injection error', error);
          throw error;
        }), {
          attempts: new Array(3).fill({
            timeout: 100
          })
        });
      } else {
        // When permissions for `scripting` are not provided 3rd party integrations have include content-script.js manually.
      }
    });
  };
  handleCoreMessage(message) {
    if (message.type === POPUP.BOOTSTRAP) {
      this.channel.init();
    } else if (message.type === POPUP.LOADED) {
      this.handleMessage(message);
      this.channel.postMessage({
        type: POPUP.INIT,
        payload: {
          settings: this.settings,
          useCore: true
        }
      });
    } else if (message.type === POPUP.CORE_LOADED) {
      this.channel.postMessage({
        type: POPUP.HANDSHAKE,
        // in this case, settings will be validated in popup
        payload: {
          settings: this.settings
        }
      });
      this.handshakePromise?.resolve();
    } else if (message.type === POPUP.CLOSED) {
      this.emitClosed();
    } else if (message.type === POPUP.CONTENT_SCRIPT_LOADED) {
      const {
        contentScriptVersion
      } = message.payload;
      if (contentScriptVersion !== CONTENT_SCRIPT_VERSION) {
        console.warn(`Content script version mismatch. Expected ${CONTENT_SCRIPT_VERSION}, got ${contentScriptVersion}`);
      }
    } else if (message.event === DEVICE_EVENT) {
      this.emit(DEVICE_EVENT, message);
    }
  }
  handleExtensionMessage(data) {
    if (data.type === POPUP.ERROR || data.type === POPUP.LOADED || data.type === POPUP.BOOTSTRAP) {
      this.handleMessage(data);
    } else if (data.type === POPUP.EXTENSION_USB_PERMISSIONS) {
      chrome.tabs.query({
        currentWindow: true,
        active: true
      }, tabs => {
        chrome.tabs.create({
          url: 'trezor-usb-permissions.html',
          index: tabs[0].index + 1
        }, _tab => {
          // do nothing
        });
      });
    } else if (data.type === POPUP.CLOSE_WINDOW) {
      this.clear();
    }
  }
  handleMessage(data) {
    if (data.type === IFRAME.LOADED) {
      this.iframeHandshakePromise?.resolve(data.payload);
    } else if (data.type === POPUP.BOOTSTRAP) {
      // popup is opened properly, now wait for POPUP.LOADED message
      if (this.openTimeout) clearTimeout(this.openTimeout);
    } else if (data.type === POPUP.ERROR && this.popupWindow) {
      // handle popup error
      const errorMessage = data.payload && typeof data.payload.error === 'string' ? data.payload.error : null;
      this.emit(POPUP.CLOSED, errorMessage ? `Popup error: ${errorMessage}` : null);
      this.clear();
    } else if (data.type === POPUP.LOADED) {
      // in case of webextension where bootstrap message is not sent
      if (this.openTimeout) clearTimeout(this.openTimeout);
      if (this.popupPromise) {
        this.popupPromise.resolve();
        this.popupPromise = undefined;
      }
      // popup is successfully loaded
      this.iframeHandshakePromise?.promise.then(payload => {
        // send ConnectSettings to popup
        // note this settings and iframe.ConnectSettings could be different (especially: origin, popup, webusb, debug)
        // now popup is able to load assets
        this.channel.postMessage({
          type: POPUP.INIT,
          payload: {
            ...payload,
            settings: this.settings
          }
        });
      });
    } else if (data.type === POPUP.CANCEL_POPUP_REQUEST) {
      clearTimeout(this.requestTimeout);
      if (this.popupPromise) {
        this.close();
      }
      this.unlock();
    } else if (data.type === UI.CLOSE_UI_WINDOW) {
      this.clear(false);
    }
  }
  clear(focus = true) {
    this.locked = false;
    this.popupPromise = undefined;
    this.handshakePromise = createDeferred();
    if (this.channel) {
      this.channel.disconnect();
    }
    if (this.requestTimeout) {
      clearTimeout(this.requestTimeout);
      this.requestTimeout = undefined;
    }
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
      this.openTimeout = undefined;
    }
    if (this.closeInterval) {
      clearInterval(this.closeInterval);
      this.closeInterval = undefined;
    }

    // switch to previously focused tab

    if (focus && this.extensionTabId) {
      chrome.tabs.update(this.extensionTabId, {
        active: true
      });
      this.extensionTabId = 0;
    }
  }
  close() {
    if (!this.popupWindow) return;
    this.logger.debug('closing popup');
    if (this.popupWindow.mode === 'tab') {
      let _e = chrome.runtime.lastError;
      if (this.popupWindow.tab.id) {
        chrome.tabs.remove(this.popupWindow.tab.id, () => {
          _e = chrome.runtime.lastError;
          if (_e) {
            this.logger.error('closed with error', _e);
          }
        });
      }
    } else if (this.popupWindow.mode === 'window') {
      this.popupWindow.window.close();
    }
    this.popupWindow = undefined;
    if (this.settings?.useCoreInPopup) {
      this.channel.clear();
    }
  }
  async postMessage(message) {
    // NOTE: This method only seems to be used in one case to show UI.IFRAME_FAILURE
    // Maybe we could handle this in a simpler way?

    // device needs interaction but there is no popup/ui
    // maybe popup request wasn't handled
    // ignore "ui_request_window" type
    if (!this.popupWindow && message.type !== UI.REQUEST_UI_WINDOW && this.openTimeout) {
      this.clear();
      showPopupRequest(this.open.bind(this), () => {
        this.emitClosed();
      });
      return;
    }

    // post message before popup request finalized
    if (this.popupPromise) {
      await this.popupPromise.promise;
    }
    // post message to popup window
    if (this.popupWindow?.mode === 'window') {
      this.popupWindow.window.postMessage(message, this.origin);
    } else if (this.popupWindow?.mode === 'tab') {
      this.channel.postMessage(message);
    }
  }
  isWebExtensionWithTab() {
    // Check if webextension actually has access to chrome.tabs API
    // This is not the case when used in offscreen context
    return this.settings?.env === 'webextension' && typeof chrome !== 'undefined' && typeof chrome?.tabs !== 'undefined';
  }
  emitClosed() {
    if (this.settings?.useCoreInPopup) {
      // When popup is closed we should create a not-real response as if the request was interrupted.
      // Because when popup closes and TrezorConnect is living there it cannot respond, but we know
      // it was interrupted so we safely fake it.
      this.channel.resolveMessagePromises({
        code: 'Method_Interrupted',
        error: POPUP.CLOSED
      });
    }
    this.emit(POPUP.CLOSED);
  }
}
;// ./src/webusb/button.ts
// origin: https://github.com/trezor/connect/blob/develop/src/js/webusb/button.js

const render = (className = '', url) => {
  const query = className || '.trezor-webusb-button';
  const buttons = document.querySelectorAll(query);
  const src = `${url}?${Date.now()}`;
  buttons.forEach(b => {
    if (b.getElementsByTagName('iframe').length < 1) {
      const bounds = b.getBoundingClientRect();
      const btnIframe = document.createElement('iframe');
      btnIframe.frameBorder = '0';
      btnIframe.width = `${Math.round(bounds.width)}px`;
      btnIframe.height = `${Math.round(bounds.height)}px`;
      btnIframe.style.position = 'absolute';
      btnIframe.style.top = '0px';
      btnIframe.style.left = '0px';
      btnIframe.style.zIndex = '1';
      // btnIframe.style.opacity = '0'; // this makes click impossible on cross-origin
      btnIframe.setAttribute('allow', 'usb');
      btnIframe.setAttribute('scrolling', 'no');
      btnIframe.src = src;

      // inject iframe into button
      b.append(btnIframe);
    }
  });
};
/* harmony default export */ const webusb_button = (render);
;// ./src/impl/core-in-iframe.ts


// NOTE: @trezor/connect part is intentionally not imported from the index due to NormalReplacementPlugin
// in packages/suite-build/configs/web.webpack.config.ts










class CoreInIframe {
  eventEmitter = new (events_default())();
  boundHandleMessage = this.handleMessage.bind(this);
  boundDispose = this.dispose.bind(this);
  constructor() {
    this._settings = connectSettings_parseConnectSettings();
    this._log = initLog('@trezor/connect-web');
    this._messagePromises = createDeferredManager({
      initialId: 1
    });
  }
  initPopupManager() {
    const pm = new PopupManager(this._settings, {
      logger: this._log
    });
    pm.on(POPUP.CLOSED, error => {
      postMessage({
        type: POPUP.CLOSED,
        payload: error ? {
          error
        } : null
      });
    });
    return pm;
  }
  manifest(data) {
    this._settings = connectSettings_parseConnectSettings({
      ...this._settings,
      manifest: data
    });
  }
  dispose() {
    this.eventEmitter.removeAllListeners();
    dispose();
    this._settings = connectSettings_parseConnectSettings();
    if (this._popupManager) {
      this._popupManager.close();
    }
    window.removeEventListener('message', this.boundHandleMessage);
    window.removeEventListener('unload', this.boundDispose);
    return Promise.resolve(undefined);
  }
  cancel(error) {
    if (this._popupManager) {
      this._popupManager.emit(POPUP.CLOSED, error);
    }
  }

  // handle message received from iframe
  handleMessage(messageEvent) {
    // ignore messages from domain other then iframe origin
    if (messageEvent.origin !== origin) return;
    const message = parseMessage(messageEvent.data);
    this._log.log('handleMessage', message);
    switch (message.event) {
      case RESPONSE_EVENT:
        {
          const {
            id = 0,
            success,
            payload,
            device
          } = message;
          const resolved = this._messagePromises.resolve(id, {
            id,
            success,
            payload,
            device
          });
          if (!resolved) this._log.warn(`Unknown message id ${id}`);
          break;
        }
      case DEVICE_EVENT:
        // pass DEVICE event up to html
        this.eventEmitter.emit(message.event, message);
        this.eventEmitter.emit(message.type, message.payload); // DEVICE_EVENT also emit single events (connect/disconnect...)
        break;
      case TRANSPORT_EVENT:
        this.eventEmitter.emit(message.event, message);
        this.eventEmitter.emit(message.type, message.payload);
        break;
      case BLOCKCHAIN_EVENT:
        this.eventEmitter.emit(message.event, message);
        this.eventEmitter.emit(message.type, message.payload);
        break;
      case ui_request_UI_EVENT:
        if (message.type === IFRAME.BOOTSTRAP) {
          iframe_clearTimeout();
          break;
        }
        if (message.type === IFRAME.LOADED) {
          initPromise.resolve();
        }
        if (message.type === IFRAME.ERROR) {
          initPromise.reject(message.payload.error);
        }

        // pass UI event up
        this.eventEmitter.emit(message.event, message);
        this.eventEmitter.emit(message.type, message.payload);
        break;
      default:
        this._log.log('Undefined message', messageEvent.data);
    }
  }
  async init(settings) {
    if (instance) {
      throw TypedError('Init_AlreadyInitialized');
    }
    this._settings = connectSettings_parseConnectSettings({
      ...this._settings,
      ...settings
    });
    if (!this._settings.manifest) {
      throw TypedError('Init_ManifestMissing');
    }

    // defaults for connect-web
    if (!this._settings.transports?.length) {
      this._settings.transports = ['BridgeTransport', 'WebUsbTransport'];
    }
    if (!this._settings.coreMode) {
      this._settings.coreMode = 'auto';
    }
    if (this._settings.lazyLoad) {
      // reset "lazyLoad" after first use
      this._settings.lazyLoad = false;
      return;
    }
    if (!this._popupManager) {
      this._popupManager = this.initPopupManager();
    }
    this._log.enabled = !!this._settings.debug;
    window.addEventListener('message', this.boundHandleMessage);
    window.addEventListener('unload', this.boundDispose);
    await init(this._settings);
    if (this._settings.coreMode === 'auto') {
      // Checking bridge availability
      const {
        promiseId,
        promise
      } = this._messagePromises.create();
      this._log.debug('coreMode = auto, Checking bridge availability');
      postMessage({
        id: promiseId,
        type: TRANSPORT.GET_INFO
      });
      const response = await promise;
      this._log.debug('Bridge availability response', response);
      if (response.payload === undefined && navigator.usb && this._settings.transports?.includes('WebUsbTransport')) {
        throw TypedError('Transport_Missing');
      }
    }

    // sharedLogger can be disable but it is enable by default.
    if (this._settings.sharedLogger !== false) {
      // connect-web is running in third-party domain so we use iframe to pass logs to shared worker.
      initIframeLogger();
    }
  }
  setTransports() {
    // TODO: implement
    throw new Error('Unsupported right now');
  }
  async call(params) {
    if (!instance && !timeout) {
      // init popup with lazy loading before iframe initialization
      this._settings = connectSettings_parseConnectSettings(this._settings);
      if (!this._settings.manifest) {
        return createErrorMessage(TypedError('Init_ManifestMissing'));
      }
      if (!this._popupManager) {
        this._popupManager = this.initPopupManager();
      }

      // auto init with default settings
      try {
        // @ts-expect-error manifest could have been changed in the meantime, hard to check this
        await this.init(this._settings);
      } catch (error) {
        if (this._popupManager) {
          this._popupManager.clear();
        }
        return createErrorMessage(error);
      }
    }
    if (timeout) {
      // this.init was called, but iframe doesn't return handshake yet
      await initPromise.promise;
    }
    if (error) {
      // iframe was initialized with error
      return createErrorMessage(error);
    }

    // request popup window it might be used in the future
    if (this._settings.popup && this._popupManager) {
      this._popupManager.request();
    }

    // post message to iframe
    try {
      const {
        promiseId,
        promise
      } = this._messagePromises.create();
      postMessage({
        id: promiseId,
        type: IFRAME.CALL,
        payload: params
      });
      const response = await promise;
      if (response) {
        if (!response.success && response.payload.code !== 'Device_CallInProgress' && this._popupManager) {
          this._popupManager.unlock();
        }
        return response;
      }
      if (this._popupManager) {
        this._popupManager.unlock();
      }
      return createErrorMessage(TypedError('Method_NoResponse'));
    } catch (error) {
      this._log.error('__call error', error);
      if (this._popupManager) {
        this._popupManager.clear(false);
      }
      return createErrorMessage(error);
    }
  }
  uiResponse(response) {
    if (!instance) {
      throw TypedError('Init_NotInitialized');
    }
    postMessage(response);
  }
  renderWebUSBButton(className) {
    webusb_button(className, this._settings.webusbSrc);
  }
  async requestLogin(params) {
    if (typeof params.callback === 'function') {
      const {
        callback
      } = params;

      // TODO: set message listener only if iframe is loaded correctly
      const loginChallengeListener = async event => {
        const {
          data
        } = event;
        if (data && data.type === UI.LOGIN_CHALLENGE_REQUEST) {
          try {
            const payload = await callback();
            postMessage({
              type: UI.LOGIN_CHALLENGE_RESPONSE,
              payload
            });
          } catch (error) {
            postMessage({
              type: UI.LOGIN_CHALLENGE_RESPONSE,
              payload: error.message
            });
          }
        }
      };
      window.addEventListener('message', loginChallengeListener, false);
      const response = await this.call({
        method: 'requestLogin',
        ...params,
        asyncChallenge: true,
        callback: null
      });
      window.removeEventListener('message', loginChallengeListener);
      return response;
    }
    return this.call({
      method: 'requestLogin',
      ...params
    });
  }
  disableWebUSB() {
    if (!instance) {
      throw TypedError('Init_NotInitialized');
    }
    postMessage({
      type: TRANSPORT.DISABLE_WEBUSB
    });
  }

  /**
   * Initiate device pairing procedure.
   */
  async requestWebUSBDevice() {
    try {
      await window.navigator.usb.requestDevice({
        filters: config.webusb
      });
      postMessage({
        type: TRANSPORT.REQUEST_DEVICE
      });
    } catch {
      // user hits cancel gets "DOMException: No device selected."
      // no need to log this
    }
  }
}
const impl = new CoreInIframe();

// Exported to enable using directly
const TrezorConnect = factory({
  // Bind all methods due to shadowing `this`
  eventEmitter: impl.eventEmitter,
  init: impl.init.bind(impl),
  call: impl.call.bind(impl),
  setTransports: impl.setTransports.bind(impl),
  manifest: impl.manifest.bind(impl),
  requestLogin: impl.requestLogin.bind(impl),
  uiResponse: impl.uiResponse.bind(impl),
  cancel: impl.cancel.bind(impl),
  dispose: impl.dispose.bind(impl)
}, {
  renderWebUSBButton: impl.renderWebUSBButton.bind(impl),
  disableWebUSB: impl.disableWebUSB.bind(impl),
  requestWebUSBDevice: impl.requestWebUSBDevice.bind(impl)
});
;// ./src/impl/core-in-popup.ts


// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.








/**
 * Base class for CoreInPopup methods for TrezorConnect factory.
 * This implementation is directly used here in connect-web, but it is also extended in connect-webextension.
 */
class CoreInPopup {
  eventEmitter = new (events_default())();
  constructor() {
    this._settings = connectSettings_parseConnectSettings();
    this.logger = initLog('@trezor/connect-web');
    this.popupManagerLogger = initLog('@trezor/connect-web/popupManager');
  }
  logWriterFactory(popupManager) {
    return {
      add: message => {
        popupManager.channel.postMessage({
          event: ui_request_UI_EVENT,
          type: IFRAME.LOG,
          payload: message
        }, {
          usePromise: false,
          useQueue: true
        });
      }
    };
  }
  manifest(data) {
    this._settings = connectSettings_parseConnectSettings({
      ...this._settings,
      manifest: data
    });
  }
  dispose() {
    this.eventEmitter.removeAllListeners();
    this._settings = connectSettings_parseConnectSettings();
    if (this._popupManager) {
      this._popupManager.close();
    }
    return Promise.resolve(undefined);
  }
  cancel(error) {
    if (this._popupManager) {
      this._popupManager.emit(POPUP.CLOSED, error);
    }
  }
  init(settings) {
    const oldSettings = connectSettings_parseConnectSettings({
      ...this._settings
    });
    const newSettings = connectSettings_parseConnectSettings({
      ...this._settings,
      ...settings
    });

    // defaults
    if (!newSettings.transports?.length) {
      newSettings.transports = ['BridgeTransport', 'WebUsbTransport'];
    }
    newSettings.useCoreInPopup = true;
    if (typeof window !== 'undefined' && window?.location?.origin) {
      newSettings.origin = window.location.origin;
    }
    const equalSettings = JSON.stringify(oldSettings) === JSON.stringify(newSettings);
    this._settings = newSettings;
    if (!this._popupManager || !equalSettings) {
      if (this._popupManager) this._popupManager.close();
      this._popupManager = new PopupManager(this._settings, {
        logger: this.popupManagerLogger
      });
      this._popupManager.on(DEVICE_EVENT, event => {
        this.eventEmitter.emit(DEVICE_EVENT, event);
      });
      setLogWriter(() => this.logWriterFactory(this._popupManager));
    }
    this.logger.enabled = !!settings.debug;
    if (!this._settings.manifest) {
      throw TypedError('Init_ManifestMissing');
    }
    this.logger.debug('initiated');
    return Promise.resolve();
  }
  setTransports() {
    // TODO: implement
    throw new Error('Unsupported right now');
  }

  /**
   * 1. opens popup
   * 2. sends request to popup where the request is handled by core
   * 3. returns response
   */
  async call(params) {
    this.logger.debug('call', params);
    if (!this._popupManager) {
      return createErrorMessage(TypedError('Init_NotInitialized'));
    }

    // request popup window it might be used in the future
    if (this._settings.popup) {
      await this._popupManager.request();
    }

    // We need to handle the case when the popup is closed during initialization
    // In this case, we need to listen to the POPUP.CLOSED event and return an error
    const popupClosed = createDeferred();
    const popupClosedHandler = () => {
      this.logger.log('Popup closed during initialization');
      popupClosed.reject(TypedError('Method_Interrupted'));
    };
    this._popupManager.once(POPUP.CLOSED, popupClosedHandler);
    try {
      this.logger.debug('call: popup initialing');
      await Promise.race([popupClosed.promise, this.callInit()]);
      this.logger.debug('call: popup initialized');

      // post message to core in popup
      const response = await this._popupManager.channel.postMessage({
        type: IFRAME.CALL,
        payload: params
      });
      this.logger.debug('call: response: ', response);
      if (response) {
        if (this._popupManager && response.success) {
          this._popupManager.clear();
        }
        return {
          success: response.success,
          payload: response.payload,
          device: response.device
        };
      }
      throw TypedError('Method_NoResponse');
    } catch (error) {
      this.logger.error('call: error', error);
      this._popupManager.clear(false);
      return createErrorMessage(error);
    } finally {
      this._popupManager.removeListener(POPUP.CLOSED, popupClosedHandler);
    }
  }
  async callInit() {
    if (!this._popupManager) {
      throw TypedError('Init_NotInitialized');
    }
    await this._popupManager.channel.init();
    if (this._settings.env === 'webextension') {
      // In webextension we init based on the popup promise
      // In core this is handled in the popup manager
      await this._popupManager.popupPromise?.promise;
      this._popupManager.channel.postMessage({
        type: POPUP.INIT,
        payload: {
          settings: this._settings,
          useCore: true
        }
      });
    }
    await this._popupManager.handshakePromise?.promise;
  }
  uiResponse(response) {
    const {
      type,
      payload
    } = response;
    this._popupManager?.channel?.postMessage({
      event: ui_request_UI_EVENT,
      type,
      payload
    });
  }
  renderWebUSBButton() {}
  requestLogin() {
    // todo: not supported yet
    throw TypedError('Method_InvalidPackage');
  }
  disableWebUSB() {
    // todo: not supported yet, probably not needed
    throw TypedError('Method_InvalidPackage');
  }
  requestWebUSBDevice() {
    // not needed - webusb pairing happens in popup
    throw TypedError('Method_InvalidPackage');
  }
}
const core_in_popup_impl = new CoreInPopup();

// Exported to enable using directly
const core_in_popup_TrezorConnect = factory({
  // Bind all methods due to shadowing `this`
  eventEmitter: core_in_popup_impl.eventEmitter,
  init: core_in_popup_impl.init.bind(core_in_popup_impl),
  call: core_in_popup_impl.call.bind(core_in_popup_impl),
  setTransports: core_in_popup_impl.setTransports.bind(core_in_popup_impl),
  manifest: core_in_popup_impl.manifest.bind(core_in_popup_impl),
  requestLogin: core_in_popup_impl.requestLogin.bind(core_in_popup_impl),
  uiResponse: core_in_popup_impl.uiResponse.bind(core_in_popup_impl),
  cancel: core_in_popup_impl.cancel.bind(core_in_popup_impl),
  dispose: core_in_popup_impl.dispose.bind(core_in_popup_impl)
});
;// ../websocket-client/src/ws-browser.ts



/**
 * Provides `EventEmitter` interface for native browser `WebSocket`,
 * same, as `ws` package provides.
 */
class WSWrapper extends events.EventEmitter {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  constructor(url, _protocols, _websocketOptions) {
    super();
    this._ws = new WebSocket(url);
    this._ws.onclose = () => {
      this.emit('close');
    };
    this._ws.onopen = () => {
      this.emit('open');
    };

    // WebSocket error Event does not contain any useful description.
    // https://websockets.spec.whatwg.org//#dom-websocket-onerror
    // If the user agent was required to fail the WebSocket connection,
    // or if the WebSocket connection was closed after being flagged as full,
    // fire an event named error at the WebSocket object.
    // https://stackoverflow.com/a/31003057
    this._ws.onerror = _event => {
      this.emit('error', new WebsocketError(`WsWrapper error. Ready state: ${this.readyState}`));
    };
    this._ws.onmessage = message => {
      this.emit('message', message.data);
    };
  }
  close() {
    if (this.readyState === WSWrapper.OPEN) {
      this._ws.close();
    }
  }
  send(message) {
    if (this.readyState !== WSWrapper.OPEN) {
      throw new WebsocketError(`Connection is not open. state: ${this.readyState}`);
    }
    this._ws.send(message);
  }
  get readyState() {
    return this._ws.readyState;
  }
}

// eslint-disable-next-line import/no-default-export
/* harmony default export */ const ws_browser = (WSWrapper);
;// ../websocket-client/src/client.ts


const DEFAULT_TIMEOUT = 20 * 1000;
const DEFAULT_PING_TIMEOUT = 50 * 1000;
class WebsocketError extends Error {}
class WebsocketClient extends TypedEmitter {
  emitter = this;
  ping() {
    return this.sendMessage({
      type: 'ping'
    });
  }
  constructor(options) {
    super();
    this.options = options;
    this.messages = createDeferredManager({
      timeout: this.options.timeout || DEFAULT_TIMEOUT,
      onTimeout: this.onTimeout.bind(this)
    });
  }
  initWebsocket({
    url,
    timeout,
    headers,
    agent
  }) {
    // url validation
    if (typeof url !== 'string') {
      throw new WebsocketError('websocket_no_url');
    }
    if (url.startsWith('http')) {
      url = url.replace('http', 'ws');
    }
    return new ws_browser(url, {
      timeout,
      headers: {
        // for convenience auto spoof Origin header in node.js
        Origin: 'https://node.trezor.io',
        ...headers
      },
      agent
    });
  }
  setPingTimeout() {
    clearTimeout(this.pingTimeout);
    const doPing = () => {
      if (this.isConnected()) {
        return this.onPing().catch(() => {});
      }
    };
    this.pingTimeout = this.isConnected() ? setTimeout(doPing, this.options.pingTimeout || DEFAULT_PING_TIMEOUT) : undefined;
  }
  onPing() {
    return this.ping();
  }
  onTimeout() {
    const {
      ws
    } = this;
    if (!ws) return;
    this.messages.rejectAll(new WebsocketError('websocket_timeout'));
    ws.close();
  }
  onError() {
    this.onClose();
  }
  sendMessage(message, {
    timeout
  } = {}) {
    const {
      ws
    } = this;
    if (!ws || !this.isConnected()) throw new WebsocketError('websocket_not_initialized');
    const {
      promiseId,
      promise
    } = this.messages.create(timeout);
    const req = {
      id: promiseId.toString(),
      ...message
    };
    this.setPingTimeout();
    this.options.onSending?.(message);
    ws.send(JSON.stringify(req));
    return promise;
  }
  sendRawMessage(message) {
    const {
      ws
    } = this;
    if (!ws || !this.isConnected()) throw new WebsocketError('websocket_not_initialized');
    ws.send(message, {
      binary: typeof message !== 'string'
    });
    this.setPingTimeout();
  }

  // TODO: data type generic
  // `messageValidation` - additionally validates `data` in the subclass
  //  returns `payload` or throws error to automatically resolve/reject pending message
  //  returns `undefined` to resolve pending message manually in the subclass
  onMessage(message, messageValidation) {
    try {
      const data = JSON.parse(message.toString());
      const messageId = Number(data.id);
      try {
        const payload = messageValidation ? messageValidation(data) : data;
        if (payload) {
          this.messages.resolve(messageId, payload);
        }
      } catch (error) {
        this.messages.reject(messageId, error);
      }
    } catch {
      // empty
    } finally {
      this.setPingTimeout();
    }
  }
  async connect() {
    // if connecting already, just return the promise
    if (this.connectPromise) {
      return this.connectPromise;
    }
    if (this.isConnected()) return Promise.resolve();
    if (this.ws?.readyState === ws_browser.CLOSING) {
      await new Promise(resolve => this.emitter.once('disconnected', resolve));
    }

    // create deferred promise
    const dfd = createDeferred();
    this.connectPromise = dfd.promise;
    const ws = this.createWebsocket ? this.createWebsocket() : this.initWebsocket(this.options);

    // set connection timeout before WebSocket initialization
    const connectionTimeout = setTimeout(() => {
      this.onClose();
      dfd.reject(new WebsocketError('websocket_timeout'));
      try {
        ws.close();
      } catch {
        // empty
      }
    }, this.options.connectionTimeout || this.options.timeout || DEFAULT_TIMEOUT);
    ws.once('error', error => {
      clearTimeout(connectionTimeout);
      this.onClose();
      dfd.reject(new WebsocketError(error.message));
    });
    ws.on('open', () => {
      clearTimeout(connectionTimeout);
      this.init();
      dfd.resolve();
    });
    this.ws = ws;

    // wait for onopen event
    return dfd.promise.finally(() => {
      this.connectPromise = undefined;
    });
  }
  init() {
    const {
      ws
    } = this;
    if (!ws || !this.isConnected()) {
      throw Error('Websocket init cannot be called');
    }

    // remove previous listeners and add new listeners
    ws.removeAllListeners();
    ws.on('error', _error => this.onError());
    ws.on('message', message => this.onMessage(message));
    ws.on('close', () => {
      this.emitter.emit('disconnected');
      this.onClose();
    });
  }
  disconnect() {
    if (this.isConnected()) {
      const disconnectPromise = new Promise(resolve => {
        this.ws?.once('close', resolve);
      });
      this.ws?.close();
      return disconnectPromise;
    }
    return Promise.resolve();
  }
  isConnected() {
    return this.ws?.readyState === ws_browser.OPEN;
  }
  onClose() {
    clearTimeout(this.pingTimeout);
    this.ws?.removeAllListeners();
    this.ws?.on('error', () => {
      // Suppress errors after close
    });
    this.messages.rejectAll(new WebsocketError('Websocket closed unexpectedly'));
  }
  dispose() {
    this.removeAllListeners();
    this.disconnect();
    this.onClose();
  }
}
;// ./src/impl/core-in-suite-desktop.ts


// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.







/**
 * CoreInSuiteDesktop implementation for TrezorConnect factory.
 */
class CoreInSuiteDesktop {
  eventEmitter = new (events_default())();
  constructor() {
    this._settings = connectSettings_parseConnectSettings();
    this.ws = new WebsocketClient({
      url: 'ws://127.0.0.1:21335/connect-ws'
    });
  }
  manifest(data) {
    this._settings = connectSettings_parseConnectSettings({
      ...this._settings,
      manifest: data
    });
  }
  dispose() {
    this.eventEmitter.removeAllListeners();
    this._settings = connectSettings_parseConnectSettings();
    this.ws.dispose();
    return Promise.resolve(undefined);
  }
  cancel(_error) {
    this.ws.sendMessage({
      type: POPUP.CLOSED,
      payload: {
        error: _error
      }
    });
  }
  async handshake() {
    if (!this.ws) {
      throw TypedError('Desktop_ConnectionMissing', 'No websocket connection');
    }
    try {
      const response = await this.ws.sendMessage({
        type: POPUP.HANDSHAKE,
        payload: {
          settings: this._settings
        }
      }, {
        // can take a while on slower machines due to loading process info
        timeout: 3000
      });
      if (!response) {
        throw TypedError('Desktop_ConnectionMissing', 'No response');
      }
      return response;
    } catch (err) {
      throw TypedError('Desktop_ConnectionMissing', err.message);
    }
  }
  async init(settings = {}) {
    const newSettings = connectSettings_parseConnectSettings({
      ...this._settings,
      ...settings
    });

    // manifest is required in all implementations. for core-in-suite-desktop, also manifest.appName is required
    if (!newSettings.manifest || !newSettings.manifest.appName) {
      throw TypedError('Init_ManifestMissing', 'Manifest is missing or manifest.appName is not set');
    }

    // defaults
    if (!newSettings.transports?.length) {
      newSettings.transports = ['BridgeTransport', 'WebUsbTransport'];
    }
    this._settings = newSettings;
    try {
      await this.ws.connect();
    } catch (err) {
      throw err instanceof WebsocketError ? TypedError('Desktop_ConnectionMissing', err.message) : err;
    }
  }
  setTransports() {
    // not supported, transports are controlled by suite-desktop.
    throw new Error('Unsupported');
  }
  async call(params) {
    try {
      if (!this.ws.isConnected()) {
        await this.init();
      }
      await this.handshake();
      const response = await this.ws.sendMessage({
        type: IFRAME.CALL,
        payload: params
      }, {
        // base timeout in WebsocketClient is 20s, setting 0 overrides it.
        // todo: there should be no base timeout in the websocket client. it is just too opinionated
        timeout: 0
      });
      if (!response) {
        throw TypedError('Desktop_ConnectionMissing', 'No response');
      }
      return response;
    } catch (err) {
      return {
        success: false,
        payload: errors_serializeError(err instanceof WebsocketError ? TypedError('Desktop_ConnectionMissing', err.message) : err)
      };
    }
  }

  // this shouldn't be needed, ui response should be handled in suite-desktop
  uiResponse(_response) {
    throw TypedError('Method_InvalidPackage');
  }

  // todo: not supported yet
  requestLogin() {
    throw TypedError('Method_InvalidPackage');
  }

  // not needed, only because of types
  disableWebUSB() {
    throw TypedError('Method_InvalidPackage');
  }

  // not needed, only because of types
  requestWebUSBDevice() {
    throw TypedError('Method_InvalidPackage');
  }

  // not needed, only because of types
  renderWebUSBButton() {}
}
const core_in_suite_desktop_impl = new CoreInSuiteDesktop();

// Exported to enable using directly
const core_in_suite_desktop_TrezorConnect = factory({
  // Bind all methods due to shadowing `this`
  eventEmitter: core_in_suite_desktop_impl.eventEmitter,
  init: core_in_suite_desktop_impl.init.bind(core_in_suite_desktop_impl),
  call: core_in_suite_desktop_impl.call.bind(core_in_suite_desktop_impl),
  setTransports: core_in_suite_desktop_impl.setTransports.bind(core_in_suite_desktop_impl),
  manifest: core_in_suite_desktop_impl.manifest.bind(core_in_suite_desktop_impl),
  requestLogin: core_in_suite_desktop_impl.requestLogin.bind(core_in_suite_desktop_impl),
  uiResponse: core_in_suite_desktop_impl.uiResponse.bind(core_in_suite_desktop_impl),
  cancel: core_in_suite_desktop_impl.cancel.bind(core_in_suite_desktop_impl),
  dispose: core_in_suite_desktop_impl.dispose.bind(core_in_suite_desktop_impl)
});
;// ./src/index.ts






const IFRAME_ERRORS = ['Init_IframeBlocked', 'Init_IframeTimeout', 'Transport_Missing'];
const src_impl = new TrezorConnectDynamic({
  implementations: [{
    type: 'iframe',
    impl: new CoreInIframe()
  }, {
    type: 'core-in-popup',
    impl: new CoreInPopup()
  }, {
    type: 'core-in-suite-desktop',
    impl: new CoreInSuiteDesktop()
  }],
  getInitTarget: settings => {
    if (settings.coreMode === 'iframe') {
      return 'iframe';
    } else if (settings.coreMode === 'popup') {
      return 'core-in-popup';
    } else if (settings.coreMode === 'suite-desktop') {
      return 'core-in-suite-desktop';
    } else {
      if (settings.coreMode && settings.coreMode !== 'auto') {
        console.warn(`Invalid coreMode: ${settings.coreMode}`);
      }
      return 'iframe';
    }
  },
  handleBeforeCall: async () => {
    // Always try if desktop is available again
    const isCoreModeDesktop = src_impl.lastSettings?.coreMode === 'suite-desktop';
    const isCoreModeAuto = src_impl.lastSettings?.coreMode === 'auto' || src_impl.lastSettings?.coreMode === undefined;
    if (isCoreModeDesktop || isCoreModeAuto) {
      await src_impl.switchTarget('core-in-suite-desktop');
    }
  },
  handleErrorFallback: async errorCode => {
    const env = getEnv();
    const isCoreModeDisabled = src_impl.lastSettings?.popup === false || env === 'webextension';
    const isCoreModeAuto = src_impl.lastSettings?.coreMode === 'auto' || src_impl.lastSettings?.coreMode === undefined;

    // Handle desktop errors
    if (src_impl.getTargetType() === 'core-in-suite-desktop' && errorCode === 'Desktop_ConnectionMissing') {
      await src_impl.switchTarget('iframe');
      return true;
    }

    // Handle iframe errors by switching to core-in-popup
    if (!isCoreModeDisabled && isCoreModeAuto && IFRAME_ERRORS.includes(errorCode)) {
      // Check if WebUSB is available and enabled
      const webUsbUnavailableInBrowser = !navigator?.usb;
      const webUsbDisabledInSettings = src_impl.lastSettings?.transports?.includes('WebUsbTransport') === false;
      if (errorCode === 'Transport_Missing' && (webUsbUnavailableInBrowser || webUsbDisabledInSettings)) {
        // WebUSB not available, no benefit in switching to core-in-popup
        return false;
      }
      await src_impl.switchTarget('core-in-popup');
      return true;
    }
    return false;
  }
});
const src_TrezorConnect = factory({
  eventEmitter: src_impl.eventEmitter,
  init: src_impl.init.bind(src_impl),
  call: src_impl.call.bind(src_impl),
  setTransports: src_impl.setTransports.bind(src_impl),
  manifest: src_impl.manifest.bind(src_impl),
  requestLogin: src_impl.requestLogin.bind(src_impl),
  uiResponse: src_impl.uiResponse.bind(src_impl),
  cancel: src_impl.cancel.bind(src_impl),
  dispose: src_impl.dispose.bind(src_impl)
}, {
  renderWebUSBButton: src_impl.getTarget().renderWebUSBButton.bind(src_impl),
  disableWebUSB: src_impl.getTarget().disableWebUSB.bind(src_impl),
  requestWebUSBDevice: src_impl.getTarget().requestWebUSBDevice.bind(src_impl)
});
/* harmony default export */ const src = (src_TrezorConnect);

__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});