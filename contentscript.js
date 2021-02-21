(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){
'use strict';


var path = _dereq_('path');
var pump = _dereq_('pump');
var querystring = _dereq_('querystring');
var LocalMessageDuplexStream = _dereq_('post-message-stream');
var PongStream = _dereq_('ping-pong-stream/pong');
var ObjectMultiplex = _dereq_('obj-multiplex');
var extension = _dereq_('extensionizer');
var PortStream = _dereq_('extension-port-stream');

var inpageContent = "(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c=\"function\"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error(\"Cannot find module '\"+i+\"'\");throw a.code=\"MODULE_NOT_FOUND\",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u=\"function\"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){\n(function (process,global){\n'use strict';\n\nvar _promise = _dereq_('babel-runtime/core-js/promise');\n\nvar _promise2 = _interopRequireDefault(_promise);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\n/*global Web3*/\ncleanContextForImports();\n_dereq_('web3/dist/web3.min.js');\nvar log = _dereq_('loglevel');\nvar LocalMessageDuplexStream = _dereq_('post-message-stream');\nvar setupDappAutoReload = _dereq_('./lib/auto-reload.js');\nvar MetamaskInpageProvider = _dereq_('metamask-inpage-provider');\n\nrestoreContextAfterImports();\n\nlog.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn');\n\n//\n// setup plugin communication\n//\n\n// setup background connection\nvar metamaskStream = new LocalMessageDuplexStream({\n  name: 'nifty-inpage',\n  target: 'nifty-contentscript'\n});\n\n// compose the inpage provider\nvar inpageProvider = new MetamaskInpageProvider(metamaskStream);\n// set a high max listener count to avoid unnecesary warnings\ninpageProvider.setMaxListeners(100);\n\n// Augment the provider with its enable method\ninpageProvider.enable = function () {\n  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};\n\n  return new _promise2.default(function (resolve, reject) {\n    if (options.mockRejection) {\n      reject('User rejected account access');\n    } else {\n      inpageProvider.sendAsync({ method: 'eth_accounts', params: [] }, function (error, response) {\n        if (error) {\n          reject(error);\n        } else {\n          resolve(response.result);\n        }\n      });\n    }\n  });\n};\n\n// Work around for web3@1.0 deleting the bound `sendAsync` but not the unbound\n// `sendAsync` method on the prototype, causing `this` reference issues with drizzle\nvar proxiedInpageProvider = new Proxy(inpageProvider, {\n  // straight up lie that we deleted the property so that it doesnt\n  // throw an error in strict mode\n  deleteProperty: function deleteProperty() {\n    return true;\n  }\n});\n\nwindow.ethereum = proxiedInpageProvider;\n\n//\n// setup web3\n//\n\nvar web3 = new Web3(inpageProvider);\nweb3.setProvider = function () {\n  log.debug('DefiMask - overrode web3.setProvider');\n};\nlog.debug('DefiMask - injected web3');\n\nsetupDappAutoReload(web3, inpageProvider.publicConfigStore);\n\n// export global web3, with usage-detection and deprecation warning\n\n/* TODO: Uncomment this area once auto-reload.js has been deprecated:\nlet hasBeenWarned = false\nglobal.web3 = new Proxy(web3, {\n  get: (_web3, key) => {\n    // show warning once on web3 access\n    if (!hasBeenWarned && key !== 'currentProvider') {\n      console.warn('DefiMask: web3 will be deprecated in the near future in favor of the ethereumProvider \\nhttps://github.com/MetaMask/faq/blob/master/detecting_metamask.md#web3-deprecation')\n      hasBeenWarned = true\n    }\n    // return value normally\n    return _web3[key]\n  },\n  set: (_web3, key, value) => {\n    // set value normally\n    _web3[key] = value\n  },\n})\n*/\n\n// set web3 defaultAccount\ninpageProvider.publicConfigStore.subscribe(function (state) {\n  web3.eth.defaultAccount = state.selectedAddress;\n});\n\n// need to make sure we aren't affected by overlapping namespaces\n// and that we dont affect the app with our namespace\n// mostly a fix for web3's BigNumber if AMD's \"define\" is defined...\nvar __define;\n\n/**\n * Caches reference to global define object and deletes it to\n * avoid conflicts with other global define objects, such as\n * AMD's define function\n */\nfunction cleanContextForImports() {\n  __define = global.define;\n  try {\n    global.define = undefined;\n  } catch (_) {\n    console.warn('DefiMask - global.define could not be deleted.');\n  }\n}\n\n/**\n * Restores global define object from cached reference\n */\nfunction restoreContextAfterImports() {\n  try {\n    global.define = __define;\n  } catch (_) {\n    console.warn('DefiMask - global.define could not be overwritten.');\n  }\n}\n\n\n}).call(this,_dereq_('_process'),typeof global !== \"undefined\" ? global : typeof self !== \"undefined\" ? self : typeof window !== \"undefined\" ? window : {})\n\n},{\"./lib/auto-reload.js\":2,\"_process\":23,\"babel-runtime/core-js/promise\":11,\"loglevel\":132,\"metamask-inpage-provider\":134,\"post-message-stream\":143,\"web3/dist/web3.min.js\":170}],2:[function(_dereq_,module,exports){\n(function (global){\n\"use strict\";\n\nmodule.exports = setupDappAutoReload;\n\nfunction setupDappAutoReload(web3, observable) {\n  // export web3 as a global, checking for usage\n  var reloadInProgress = false;\n  var lastTimeUsed = void 0;\n  var lastSeenNetwork = void 0;\n\n  global.web3 = new Proxy(web3, {\n    get: function get(_web3, key) {\n      // get the time of use\n      lastTimeUsed = Date.now();\n      // return value normally\n      return _web3[key];\n    },\n    set: function set(_web3, key, value) {\n      // set value normally\n      _web3[key] = value;\n    }\n  });\n\n  observable.subscribe(function (state) {\n    // if reload in progress, no need to check reload logic\n    if (reloadInProgress) return;\n\n    var currentNetwork = state.networkVersion;\n\n    // set the initial network\n    if (!lastSeenNetwork) {\n      lastSeenNetwork = currentNetwork;\n      return;\n    }\n\n    // skip reload logic if web3 not used\n    if (!lastTimeUsed) return;\n\n    // if network did not change, exit\n    if (currentNetwork === lastSeenNetwork) return;\n\n    // initiate page reload\n    reloadInProgress = true;\n    var timeSinceUse = Date.now() - lastTimeUsed;\n    // if web3 was recently used then delay the reloading of the page\n    if (timeSinceUse > 500) {\n      triggerReset();\n    } else {\n      setTimeout(triggerReset, 500);\n    }\n  });\n}\n\n// reload the page\nfunction triggerReset() {\n  global.location.reload();\n}\n\n\n}).call(this,typeof global !== \"undefined\" ? global : typeof self !== \"undefined\" ? self : typeof window !== \"undefined\" ? window : {})\n\n},{}],3:[function(_dereq_,module,exports){\n(function (process,global,setImmediate){\n(function (global, factory) {\n  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :\n  typeof define === 'function' && define.amd ? define(['exports'], factory) :\n  (factory((global.async = global.async || {})));\n}(this, (function (exports) { 'use strict';\n\nfunction slice(arrayLike, start) {\n    start = start|0;\n    var newLen = Math.max(arrayLike.length - start, 0);\n    var newArr = Array(newLen);\n    for(var idx = 0; idx < newLen; idx++)  {\n        newArr[idx] = arrayLike[start + idx];\n    }\n    return newArr;\n}\n\n/**\n * Creates a continuation function with some arguments already applied.\n *\n * Useful as a shorthand when combined with other control flow functions. Any\n * arguments passed to the returned function are added to the arguments\n * originally passed to apply.\n *\n * @name apply\n * @static\n * @memberOf module:Utils\n * @method\n * @category Util\n * @param {Function} fn - The function you want to eventually apply all\n * arguments to. Invokes with (arguments...).\n * @param {...*} arguments... - Any number of arguments to automatically apply\n * when the continuation is called.\n * @returns {Function} the partially-applied function\n * @example\n *\n * // using apply\n * async.parallel([\n *     async.apply(fs.writeFile, 'testfile1', 'test1'),\n *     async.apply(fs.writeFile, 'testfile2', 'test2')\n * ]);\n *\n *\n * // the same process without using apply\n * async.parallel([\n *     function(callback) {\n *         fs.writeFile('testfile1', 'test1', callback);\n *     },\n *     function(callback) {\n *         fs.writeFile('testfile2', 'test2', callback);\n *     }\n * ]);\n *\n * // It's possible to pass any number of additional arguments when calling the\n * // continuation:\n *\n * node> var fn = async.apply(sys.puts, 'one');\n * node> fn('two', 'three');\n * one\n * two\n * three\n */\nvar apply = function(fn/*, ...args*/) {\n    var args = slice(arguments, 1);\n    return function(/*callArgs*/) {\n        var callArgs = slice(arguments);\n        return fn.apply(null, args.concat(callArgs));\n    };\n};\n\nvar initialParams = function (fn) {\n    return function (/*...args, callback*/) {\n        var args = slice(arguments);\n        var callback = args.pop();\n        fn.call(this, args, callback);\n    };\n};\n\n/**\n * Checks if `value` is the\n * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)\n * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)\n *\n * @static\n * @memberOf _\n * @since 0.1.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is an object, else `false`.\n * @example\n *\n * _.isObject({});\n * // => true\n *\n * _.isObject([1, 2, 3]);\n * // => true\n *\n * _.isObject(_.noop);\n * // => true\n *\n * _.isObject(null);\n * // => false\n */\nfunction isObject(value) {\n  var type = typeof value;\n  return value != null && (type == 'object' || type == 'function');\n}\n\nvar hasSetImmediate = typeof setImmediate === 'function' && setImmediate;\nvar hasNextTick = typeof process === 'object' && typeof process.nextTick === 'function';\n\nfunction fallback(fn) {\n    setTimeout(fn, 0);\n}\n\nfunction wrap(defer) {\n    return function (fn/*, ...args*/) {\n        var args = slice(arguments, 1);\n        defer(function () {\n            fn.apply(null, args);\n        });\n    };\n}\n\nvar _defer;\n\nif (hasSetImmediate) {\n    _defer = setImmediate;\n} else if (hasNextTick) {\n    _defer = process.nextTick;\n} else {\n    _defer = fallback;\n}\n\nvar setImmediate$1 = wrap(_defer);\n\n/**\n * Take a sync function and make it async, passing its return value to a\n * callback. This is useful for plugging sync functions into a waterfall,\n * series, or other async functions. Any arguments passed to the generated\n * function will be passed to the wrapped function (except for the final\n * callback argument). Errors thrown will be passed to the callback.\n *\n * If the function passed to `asyncify` returns a Promise, that promises's\n * resolved/rejected state will be used to call the callback, rather than simply\n * the synchronous return value.\n *\n * This also means you can asyncify ES2017 `async` functions.\n *\n * @name asyncify\n * @static\n * @memberOf module:Utils\n * @method\n * @alias wrapSync\n * @category Util\n * @param {Function} func - The synchronous function, or Promise-returning\n * function to convert to an {@link AsyncFunction}.\n * @returns {AsyncFunction} An asynchronous wrapper of the `func`. To be\n * invoked with `(args..., callback)`.\n * @example\n *\n * // passing a regular synchronous function\n * async.waterfall([\n *     async.apply(fs.readFile, filename, \"utf8\"),\n *     async.asyncify(JSON.parse),\n *     function (data, next) {\n *         // data is the result of parsing the text.\n *         // If there was a parsing error, it would have been caught.\n *     }\n * ], callback);\n *\n * // passing a function returning a promise\n * async.waterfall([\n *     async.apply(fs.readFile, filename, \"utf8\"),\n *     async.asyncify(function (contents) {\n *         return db.model.create(contents);\n *     }),\n *     function (model, next) {\n *         // `model` is the instantiated model object.\n *         // If there was an error, this function would be skipped.\n *     }\n * ], callback);\n *\n * // es2017 example, though `asyncify` is not needed if your JS environment\n * // supports async functions out of the box\n * var q = async.queue(async.asyncify(async function(file) {\n *     var intermediateStep = await processFile(file);\n *     return await somePromise(intermediateStep)\n * }));\n *\n * q.push(files);\n */\nfunction asyncify(func) {\n    return initialParams(function (args, callback) {\n        var result;\n        try {\n            result = func.apply(this, args);\n        } catch (e) {\n            return callback(e);\n        }\n        // if result is Promise object\n        if (isObject(result) && typeof result.then === 'function') {\n            result.then(function(value) {\n                invokeCallback(callback, null, value);\n            }, function(err) {\n                invokeCallback(callback, err.message ? err : new Error(err));\n            });\n        } else {\n            callback(null, result);\n        }\n    });\n}\n\nfunction invokeCallback(callback, error, value) {\n    try {\n        callback(error, value);\n    } catch (e) {\n        setImmediate$1(rethrow, e);\n    }\n}\n\nfunction rethrow(error) {\n    throw error;\n}\n\nvar supportsSymbol = typeof Symbol === 'function';\n\nfunction isAsync(fn) {\n    return supportsSymbol && fn[Symbol.toStringTag] === 'AsyncFunction';\n}\n\nfunction wrapAsync(asyncFn) {\n    return isAsync(asyncFn) ? asyncify(asyncFn) : asyncFn;\n}\n\nfunction applyEach$1(eachfn) {\n    return function(fns/*, ...args*/) {\n        var args = slice(arguments, 1);\n        var go = initialParams(function(args, callback) {\n            var that = this;\n            return eachfn(fns, function (fn, cb) {\n                wrapAsync(fn).apply(that, args.concat(cb));\n            }, callback);\n        });\n        if (args.length) {\n            return go.apply(this, args);\n        }\n        else {\n            return go;\n        }\n    };\n}\n\n/** Detect free variable `global` from Node.js. */\nvar freeGlobal = typeof global == 'object' && global && global.Object === Object && global;\n\n/** Detect free variable `self`. */\nvar freeSelf = typeof self == 'object' && self && self.Object === Object && self;\n\n/** Used as a reference to the global object. */\nvar root = freeGlobal || freeSelf || Function('return this')();\n\n/** Built-in value references. */\nvar Symbol$1 = root.Symbol;\n\n/** Used for built-in method references. */\nvar objectProto = Object.prototype;\n\n/** Used to check objects for own properties. */\nvar hasOwnProperty = objectProto.hasOwnProperty;\n\n/**\n * Used to resolve the\n * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)\n * of values.\n */\nvar nativeObjectToString = objectProto.toString;\n\n/** Built-in value references. */\nvar symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;\n\n/**\n * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.\n *\n * @private\n * @param {*} value The value to query.\n * @returns {string} Returns the raw `toStringTag`.\n */\nfunction getRawTag(value) {\n  var isOwn = hasOwnProperty.call(value, symToStringTag$1),\n      tag = value[symToStringTag$1];\n\n  try {\n    value[symToStringTag$1] = undefined;\n    var unmasked = true;\n  } catch (e) {}\n\n  var result = nativeObjectToString.call(value);\n  if (unmasked) {\n    if (isOwn) {\n      value[symToStringTag$1] = tag;\n    } else {\n      delete value[symToStringTag$1];\n    }\n  }\n  return result;\n}\n\n/** Used for built-in method references. */\nvar objectProto$1 = Object.prototype;\n\n/**\n * Used to resolve the\n * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)\n * of values.\n */\nvar nativeObjectToString$1 = objectProto$1.toString;\n\n/**\n * Converts `value` to a string using `Object.prototype.toString`.\n *\n * @private\n * @param {*} value The value to convert.\n * @returns {string} Returns the converted string.\n */\nfunction objectToString(value) {\n  return nativeObjectToString$1.call(value);\n}\n\n/** `Object#toString` result references. */\nvar nullTag = '[object Null]';\nvar undefinedTag = '[object Undefined]';\n\n/** Built-in value references. */\nvar symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;\n\n/**\n * The base implementation of `getTag` without fallbacks for buggy environments.\n *\n * @private\n * @param {*} value The value to query.\n * @returns {string} Returns the `toStringTag`.\n */\nfunction baseGetTag(value) {\n  if (value == null) {\n    return value === undefined ? undefinedTag : nullTag;\n  }\n  return (symToStringTag && symToStringTag in Object(value))\n    ? getRawTag(value)\n    : objectToString(value);\n}\n\n/** `Object#toString` result references. */\nvar asyncTag = '[object AsyncFunction]';\nvar funcTag = '[object Function]';\nvar genTag = '[object GeneratorFunction]';\nvar proxyTag = '[object Proxy]';\n\n/**\n * Checks if `value` is classified as a `Function` object.\n *\n * @static\n * @memberOf _\n * @since 0.1.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is a function, else `false`.\n * @example\n *\n * _.isFunction(_);\n * // => true\n *\n * _.isFunction(/abc/);\n * // => false\n */\nfunction isFunction(value) {\n  if (!isObject(value)) {\n    return false;\n  }\n  // The use of `Object#toString` avoids issues with the `typeof` operator\n  // in Safari 9 which returns 'object' for typed arrays and other constructors.\n  var tag = baseGetTag(value);\n  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;\n}\n\n/** Used as references for various `Number` constants. */\nvar MAX_SAFE_INTEGER = 9007199254740991;\n\n/**\n * Checks if `value` is a valid array-like length.\n *\n * **Note:** This method is loosely based on\n * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).\n *\n * @static\n * @memberOf _\n * @since 4.0.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.\n * @example\n *\n * _.isLength(3);\n * // => true\n *\n * _.isLength(Number.MIN_VALUE);\n * // => false\n *\n * _.isLength(Infinity);\n * // => false\n *\n * _.isLength('3');\n * // => false\n */\nfunction isLength(value) {\n  return typeof value == 'number' &&\n    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;\n}\n\n/**\n * Checks if `value` is array-like. A value is considered array-like if it's\n * not a function and has a `value.length` that's an integer greater than or\n * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.\n *\n * @static\n * @memberOf _\n * @since 4.0.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is array-like, else `false`.\n * @example\n *\n * _.isArrayLike([1, 2, 3]);\n * // => true\n *\n * _.isArrayLike(document.body.children);\n * // => true\n *\n * _.isArrayLike('abc');\n * // => true\n *\n * _.isArrayLike(_.noop);\n * // => false\n */\nfunction isArrayLike(value) {\n  return value != null && isLength(value.length) && !isFunction(value);\n}\n\n// A temporary value used to identify if the loop should be broken.\n// See #1064, #1293\nvar breakLoop = {};\n\n/**\n * This method returns `undefined`.\n *\n * @static\n * @memberOf _\n * @since 2.3.0\n * @category Util\n * @example\n *\n * _.times(2, _.noop);\n * // => [undefined, undefined]\n */\nfunction noop() {\n  // No operation performed.\n}\n\nfunction once(fn) {\n    return function () {\n        if (fn === null) return;\n        var callFn = fn;\n        fn = null;\n        callFn.apply(this, arguments);\n    };\n}\n\nvar iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator;\n\nvar getIterator = function (coll) {\n    return iteratorSymbol && coll[iteratorSymbol] && coll[iteratorSymbol]();\n};\n\n/**\n * The base implementation of `_.times` without support for iteratee shorthands\n * or max array length checks.\n *\n * @private\n * @param {number} n The number of times to invoke `iteratee`.\n * @param {Function} iteratee The function invoked per iteration.\n * @returns {Array} Returns the array of results.\n */\nfunction baseTimes(n, iteratee) {\n  var index = -1,\n      result = Array(n);\n\n  while (++index < n) {\n    result[index] = iteratee(index);\n  }\n  return result;\n}\n\n/**\n * Checks if `value` is object-like. A value is object-like if it's not `null`\n * and has a `typeof` result of \"object\".\n *\n * @static\n * @memberOf _\n * @since 4.0.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is object-like, else `false`.\n * @example\n *\n * _.isObjectLike({});\n * // => true\n *\n * _.isObjectLike([1, 2, 3]);\n * // => true\n *\n * _.isObjectLike(_.noop);\n * // => false\n *\n * _.isObjectLike(null);\n * // => false\n */\nfunction isObjectLike(value) {\n  return value != null && typeof value == 'object';\n}\n\n/** `Object#toString` result references. */\nvar argsTag = '[object Arguments]';\n\n/**\n * The base implementation of `_.isArguments`.\n *\n * @private\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is an `arguments` object,\n */\nfunction baseIsArguments(value) {\n  return isObjectLike(value) && baseGetTag(value) == argsTag;\n}\n\n/** Used for built-in method references. */\nvar objectProto$3 = Object.prototype;\n\n/** Used to check objects for own properties. */\nvar hasOwnProperty$2 = objectProto$3.hasOwnProperty;\n\n/** Built-in value references. */\nvar propertyIsEnumerable = objectProto$3.propertyIsEnumerable;\n\n/**\n * Checks if `value` is likely an `arguments` object.\n *\n * @static\n * @memberOf _\n * @since 0.1.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is an `arguments` object,\n *  else `false`.\n * @example\n *\n * _.isArguments(function() { return arguments; }());\n * // => true\n *\n * _.isArguments([1, 2, 3]);\n * // => false\n */\nvar isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {\n  return isObjectLike(value) && hasOwnProperty$2.call(value, 'callee') &&\n    !propertyIsEnumerable.call(value, 'callee');\n};\n\n/**\n * Checks if `value` is classified as an `Array` object.\n *\n * @static\n * @memberOf _\n * @since 0.1.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is an array, else `false`.\n * @example\n *\n * _.isArray([1, 2, 3]);\n * // => true\n *\n * _.isArray(document.body.children);\n * // => false\n *\n * _.isArray('abc');\n * // => false\n *\n * _.isArray(_.noop);\n * // => false\n */\nvar isArray = Array.isArray;\n\n/**\n * This method returns `false`.\n *\n * @static\n * @memberOf _\n * @since 4.13.0\n * @category Util\n * @returns {boolean} Returns `false`.\n * @example\n *\n * _.times(2, _.stubFalse);\n * // => [false, false]\n */\nfunction stubFalse() {\n  return false;\n}\n\n/** Detect free variable `exports`. */\nvar freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;\n\n/** Detect free variable `module`. */\nvar freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;\n\n/** Detect the popular CommonJS extension `module.exports`. */\nvar moduleExports = freeModule && freeModule.exports === freeExports;\n\n/** Built-in value references. */\nvar Buffer = moduleExports ? root.Buffer : undefined;\n\n/* Built-in method references for those with the same name as other `lodash` methods. */\nvar nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;\n\n/**\n * Checks if `value` is a buffer.\n *\n * @static\n * @memberOf _\n * @since 4.3.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.\n * @example\n *\n * _.isBuffer(new Buffer(2));\n * // => true\n *\n * _.isBuffer(new Uint8Array(2));\n * // => false\n */\nvar isBuffer = nativeIsBuffer || stubFalse;\n\n/** Used as references for various `Number` constants. */\nvar MAX_SAFE_INTEGER$1 = 9007199254740991;\n\n/** Used to detect unsigned integer values. */\nvar reIsUint = /^(?:0|[1-9]\\d*)$/;\n\n/**\n * Checks if `value` is a valid array-like index.\n *\n * @private\n * @param {*} value The value to check.\n * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.\n * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.\n */\nfunction isIndex(value, length) {\n  length = length == null ? MAX_SAFE_INTEGER$1 : length;\n  return !!length &&\n    (typeof value == 'number' || reIsUint.test(value)) &&\n    (value > -1 && value % 1 == 0 && value < length);\n}\n\n/** `Object#toString` result references. */\nvar argsTag$1 = '[object Arguments]';\nvar arrayTag = '[object Array]';\nvar boolTag = '[object Boolean]';\nvar dateTag = '[object Date]';\nvar errorTag = '[object Error]';\nvar funcTag$1 = '[object Function]';\nvar mapTag = '[object Map]';\nvar numberTag = '[object Number]';\nvar objectTag = '[object Object]';\nvar regexpTag = '[object RegExp]';\nvar setTag = '[object Set]';\nvar stringTag = '[object String]';\nvar weakMapTag = '[object WeakMap]';\n\nvar arrayBufferTag = '[object ArrayBuffer]';\nvar dataViewTag = '[object DataView]';\nvar float32Tag = '[object Float32Array]';\nvar float64Tag = '[object Float64Array]';\nvar int8Tag = '[object Int8Array]';\nvar int16Tag = '[object Int16Array]';\nvar int32Tag = '[object Int32Array]';\nvar uint8Tag = '[object Uint8Array]';\nvar uint8ClampedTag = '[object Uint8ClampedArray]';\nvar uint16Tag = '[object Uint16Array]';\nvar uint32Tag = '[object Uint32Array]';\n\n/** Used to identify `toStringTag` values of typed arrays. */\nvar typedArrayTags = {};\ntypedArrayTags[float32Tag] = typedArrayTags[float64Tag] =\ntypedArrayTags[int8Tag] = typedArrayTags[int16Tag] =\ntypedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =\ntypedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =\ntypedArrayTags[uint32Tag] = true;\ntypedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =\ntypedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =\ntypedArrayTags[dataViewTag] = typedArrayTags[dateTag] =\ntypedArrayTags[errorTag] = typedArrayTags[funcTag$1] =\ntypedArrayTags[mapTag] = typedArrayTags[numberTag] =\ntypedArrayTags[objectTag] = typedArrayTags[regexpTag] =\ntypedArrayTags[setTag] = typedArrayTags[stringTag] =\ntypedArrayTags[weakMapTag] = false;\n\n/**\n * The base implementation of `_.isTypedArray` without Node.js optimizations.\n *\n * @private\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.\n */\nfunction baseIsTypedArray(value) {\n  return isObjectLike(value) &&\n    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];\n}\n\n/**\n * The base implementation of `_.unary` without support for storing metadata.\n *\n * @private\n * @param {Function} func The function to cap arguments for.\n * @returns {Function} Returns the new capped function.\n */\nfunction baseUnary(func) {\n  return function(value) {\n    return func(value);\n  };\n}\n\n/** Detect free variable `exports`. */\nvar freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;\n\n/** Detect free variable `module`. */\nvar freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;\n\n/** Detect the popular CommonJS extension `module.exports`. */\nvar moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;\n\n/** Detect free variable `process` from Node.js. */\nvar freeProcess = moduleExports$1 && freeGlobal.process;\n\n/** Used to access faster Node.js helpers. */\nvar nodeUtil = (function() {\n  try {\n    return freeProcess && freeProcess.binding && freeProcess.binding('util');\n  } catch (e) {}\n}());\n\n/* Node.js helper references. */\nvar nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;\n\n/**\n * Checks if `value` is classified as a typed array.\n *\n * @static\n * @memberOf _\n * @since 3.0.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.\n * @example\n *\n * _.isTypedArray(new Uint8Array);\n * // => true\n *\n * _.isTypedArray([]);\n * // => false\n */\nvar isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;\n\n/** Used for built-in method references. */\nvar objectProto$2 = Object.prototype;\n\n/** Used to check objects for own properties. */\nvar hasOwnProperty$1 = objectProto$2.hasOwnProperty;\n\n/**\n * Creates an array of the enumerable property names of the array-like `value`.\n *\n * @private\n * @param {*} value The value to query.\n * @param {boolean} inherited Specify returning inherited property names.\n * @returns {Array} Returns the array of property names.\n */\nfunction arrayLikeKeys(value, inherited) {\n  var isArr = isArray(value),\n      isArg = !isArr && isArguments(value),\n      isBuff = !isArr && !isArg && isBuffer(value),\n      isType = !isArr && !isArg && !isBuff && isTypedArray(value),\n      skipIndexes = isArr || isArg || isBuff || isType,\n      result = skipIndexes ? baseTimes(value.length, String) : [],\n      length = result.length;\n\n  for (var key in value) {\n    if ((inherited || hasOwnProperty$1.call(value, key)) &&\n        !(skipIndexes && (\n           // Safari 9 has enumerable `arguments.length` in strict mode.\n           key == 'length' ||\n           // Node.js 0.10 has enumerable non-index properties on buffers.\n           (isBuff && (key == 'offset' || key == 'parent')) ||\n           // PhantomJS 2 has enumerable non-index properties on typed arrays.\n           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||\n           // Skip index properties.\n           isIndex(key, length)\n        ))) {\n      result.push(key);\n    }\n  }\n  return result;\n}\n\n/** Used for built-in method references. */\nvar objectProto$5 = Object.prototype;\n\n/**\n * Checks if `value` is likely a prototype object.\n *\n * @private\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.\n */\nfunction isPrototype(value) {\n  var Ctor = value && value.constructor,\n      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$5;\n\n  return value === proto;\n}\n\n/**\n * Creates a unary function that invokes `func` with its argument transformed.\n *\n * @private\n * @param {Function} func The function to wrap.\n * @param {Function} transform The argument transform.\n * @returns {Function} Returns the new function.\n */\nfunction overArg(func, transform) {\n  return function(arg) {\n    return func(transform(arg));\n  };\n}\n\n/* Built-in method references for those with the same name as other `lodash` methods. */\nvar nativeKeys = overArg(Object.keys, Object);\n\n/** Used for built-in method references. */\nvar objectProto$4 = Object.prototype;\n\n/** Used to check objects for own properties. */\nvar hasOwnProperty$3 = objectProto$4.hasOwnProperty;\n\n/**\n * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.\n *\n * @private\n * @param {Object} object The object to query.\n * @returns {Array} Returns the array of property names.\n */\nfunction baseKeys(object) {\n  if (!isPrototype(object)) {\n    return nativeKeys(object);\n  }\n  var result = [];\n  for (var key in Object(object)) {\n    if (hasOwnProperty$3.call(object, key) && key != 'constructor') {\n      result.push(key);\n    }\n  }\n  return result;\n}\n\n/**\n * Creates an array of the own enumerable property names of `object`.\n *\n * **Note:** Non-object values are coerced to objects. See the\n * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)\n * for more details.\n *\n * @static\n * @since 0.1.0\n * @memberOf _\n * @category Object\n * @param {Object} object The object to query.\n * @returns {Array} Returns the array of property names.\n * @example\n *\n * function Foo() {\n *   this.a = 1;\n *   this.b = 2;\n * }\n *\n * Foo.prototype.c = 3;\n *\n * _.keys(new Foo);\n * // => ['a', 'b'] (iteration order is not guaranteed)\n *\n * _.keys('hi');\n * // => ['0', '1']\n */\nfunction keys(object) {\n  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);\n}\n\nfunction createArrayIterator(coll) {\n    var i = -1;\n    var len = coll.length;\n    return function next() {\n        return ++i < len ? {value: coll[i], key: i} : null;\n    }\n}\n\nfunction createES2015Iterator(iterator) {\n    var i = -1;\n    return function next() {\n        var item = iterator.next();\n        if (item.done)\n            return null;\n        i++;\n        return {value: item.value, key: i};\n    }\n}\n\nfunction createObjectIterator(obj) {\n    var okeys = keys(obj);\n    var i = -1;\n    var len = okeys.length;\n    return function next() {\n        var key = okeys[++i];\n        return i < len ? {value: obj[key], key: key} : null;\n    };\n}\n\nfunction iterator(coll) {\n    if (isArrayLike(coll)) {\n        return createArrayIterator(coll);\n    }\n\n    var iterator = getIterator(coll);\n    return iterator ? createES2015Iterator(iterator) : createObjectIterator(coll);\n}\n\nfunction onlyOnce(fn) {\n    return function() {\n        if (fn === null) throw new Error(\"Callback was already called.\");\n        var callFn = fn;\n        fn = null;\n        callFn.apply(this, arguments);\n    };\n}\n\nfunction _eachOfLimit(limit) {\n    return function (obj, iteratee, callback) {\n        callback = once(callback || noop);\n        if (limit <= 0 || !obj) {\n            return callback(null);\n        }\n        var nextElem = iterator(obj);\n        var done = false;\n        var running = 0;\n\n        function iterateeCallback(err, value) {\n            running -= 1;\n            if (err) {\n                done = true;\n                callback(err);\n            }\n            else if (value === breakLoop || (done && running <= 0)) {\n                done = true;\n                return callback(null);\n            }\n            else {\n                replenish();\n            }\n        }\n\n        function replenish () {\n            while (running < limit && !done) {\n                var elem = nextElem();\n                if (elem === null) {\n                    done = true;\n                    if (running <= 0) {\n                        callback(null);\n                    }\n                    return;\n                }\n                running += 1;\n                iteratee(elem.value, elem.key, onlyOnce(iterateeCallback));\n            }\n        }\n\n        replenish();\n    };\n}\n\n/**\n * The same as [`eachOf`]{@link module:Collections.eachOf} but runs a maximum of `limit` async operations at a\n * time.\n *\n * @name eachOfLimit\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.eachOf]{@link module:Collections.eachOf}\n * @alias forEachOfLimit\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {AsyncFunction} iteratee - An async function to apply to each\n * item in `coll`. The `key` is the item's key, or index in the case of an\n * array.\n * Invoked with (item, key, callback).\n * @param {Function} [callback] - A callback which is called when all\n * `iteratee` functions have finished, or an error occurs. Invoked with (err).\n */\nfunction eachOfLimit(coll, limit, iteratee, callback) {\n    _eachOfLimit(limit)(coll, wrapAsync(iteratee), callback);\n}\n\nfunction doLimit(fn, limit) {\n    return function (iterable, iteratee, callback) {\n        return fn(iterable, limit, iteratee, callback);\n    };\n}\n\n// eachOf implementation optimized for array-likes\nfunction eachOfArrayLike(coll, iteratee, callback) {\n    callback = once(callback || noop);\n    var index = 0,\n        completed = 0,\n        length = coll.length;\n    if (length === 0) {\n        callback(null);\n    }\n\n    function iteratorCallback(err, value) {\n        if (err) {\n            callback(err);\n        } else if ((++completed === length) || value === breakLoop) {\n            callback(null);\n        }\n    }\n\n    for (; index < length; index++) {\n        iteratee(coll[index], index, onlyOnce(iteratorCallback));\n    }\n}\n\n// a generic version of eachOf which can handle array, object, and iterator cases.\nvar eachOfGeneric = doLimit(eachOfLimit, Infinity);\n\n/**\n * Like [`each`]{@link module:Collections.each}, except that it passes the key (or index) as the second argument\n * to the iteratee.\n *\n * @name eachOf\n * @static\n * @memberOf module:Collections\n * @method\n * @alias forEachOf\n * @category Collection\n * @see [async.each]{@link module:Collections.each}\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - A function to apply to each\n * item in `coll`.\n * The `key` is the item's key, or index in the case of an array.\n * Invoked with (item, key, callback).\n * @param {Function} [callback] - A callback which is called when all\n * `iteratee` functions have finished, or an error occurs. Invoked with (err).\n * @example\n *\n * var obj = {dev: \"/dev.json\", test: \"/test.json\", prod: \"/prod.json\"};\n * var configs = {};\n *\n * async.forEachOf(obj, function (value, key, callback) {\n *     fs.readFile(__dirname + value, \"utf8\", function (err, data) {\n *         if (err) return callback(err);\n *         try {\n *             configs[key] = JSON.parse(data);\n *         } catch (e) {\n *             return callback(e);\n *         }\n *         callback();\n *     });\n * }, function (err) {\n *     if (err) console.error(err.message);\n *     // configs is now a map of JSON data\n *     doSomethingWith(configs);\n * });\n */\nvar eachOf = function(coll, iteratee, callback) {\n    var eachOfImplementation = isArrayLike(coll) ? eachOfArrayLike : eachOfGeneric;\n    eachOfImplementation(coll, wrapAsync(iteratee), callback);\n};\n\nfunction doParallel(fn) {\n    return function (obj, iteratee, callback) {\n        return fn(eachOf, obj, wrapAsync(iteratee), callback);\n    };\n}\n\nfunction _asyncMap(eachfn, arr, iteratee, callback) {\n    callback = callback || noop;\n    arr = arr || [];\n    var results = [];\n    var counter = 0;\n    var _iteratee = wrapAsync(iteratee);\n\n    eachfn(arr, function (value, _, callback) {\n        var index = counter++;\n        _iteratee(value, function (err, v) {\n            results[index] = v;\n            callback(err);\n        });\n    }, function (err) {\n        callback(err, results);\n    });\n}\n\n/**\n * Produces a new collection of values by mapping each value in `coll` through\n * the `iteratee` function. The `iteratee` is called with an item from `coll`\n * and a callback for when it has finished processing. Each of these callback\n * takes 2 arguments: an `error`, and the transformed item from `coll`. If\n * `iteratee` passes an error to its callback, the main `callback` (for the\n * `map` function) is immediately called with the error.\n *\n * Note, that since this function applies the `iteratee` to each item in\n * parallel, there is no guarantee that the `iteratee` functions will complete\n * in order. However, the results array will be in the same order as the\n * original `coll`.\n *\n * If `map` is passed an Object, the results will be an Array.  The results\n * will roughly be in the order of the original Objects' keys (but this can\n * vary across JavaScript engines).\n *\n * @name map\n * @static\n * @memberOf module:Collections\n * @method\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - An async function to apply to each item in\n * `coll`.\n * The iteratee should complete with the transformed item.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called when all `iteratee`\n * functions have finished, or an error occurs. Results is an Array of the\n * transformed items from the `coll`. Invoked with (err, results).\n * @example\n *\n * async.map(['file1','file2','file3'], fs.stat, function(err, results) {\n *     // results is now an array of stats for each file\n * });\n */\nvar map = doParallel(_asyncMap);\n\n/**\n * Applies the provided arguments to each function in the array, calling\n * `callback` after all functions have completed. If you only provide the first\n * argument, `fns`, then it will return a function which lets you pass in the\n * arguments as if it were a single function call. If more arguments are\n * provided, `callback` is required while `args` is still optional.\n *\n * @name applyEach\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @param {Array|Iterable|Object} fns - A collection of {@link AsyncFunction}s\n * to all call with the same arguments\n * @param {...*} [args] - any number of separate arguments to pass to the\n * function.\n * @param {Function} [callback] - the final argument should be the callback,\n * called when all functions have completed processing.\n * @returns {Function} - If only the first argument, `fns`, is provided, it will\n * return a function which lets you pass in the arguments as if it were a single\n * function call. The signature is `(..args, callback)`. If invoked with any\n * arguments, `callback` is required.\n * @example\n *\n * async.applyEach([enableSearch, updateSchema], 'bucket', callback);\n *\n * // partial application example:\n * async.each(\n *     buckets,\n *     async.applyEach([enableSearch, updateSchema]),\n *     callback\n * );\n */\nvar applyEach = applyEach$1(map);\n\nfunction doParallelLimit(fn) {\n    return function (obj, limit, iteratee, callback) {\n        return fn(_eachOfLimit(limit), obj, wrapAsync(iteratee), callback);\n    };\n}\n\n/**\n * The same as [`map`]{@link module:Collections.map} but runs a maximum of `limit` async operations at a time.\n *\n * @name mapLimit\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.map]{@link module:Collections.map}\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {AsyncFunction} iteratee - An async function to apply to each item in\n * `coll`.\n * The iteratee should complete with the transformed item.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called when all `iteratee`\n * functions have finished, or an error occurs. Results is an array of the\n * transformed items from the `coll`. Invoked with (err, results).\n */\nvar mapLimit = doParallelLimit(_asyncMap);\n\n/**\n * The same as [`map`]{@link module:Collections.map} but runs only a single async operation at a time.\n *\n * @name mapSeries\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.map]{@link module:Collections.map}\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - An async function to apply to each item in\n * `coll`.\n * The iteratee should complete with the transformed item.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called when all `iteratee`\n * functions have finished, or an error occurs. Results is an array of the\n * transformed items from the `coll`. Invoked with (err, results).\n */\nvar mapSeries = doLimit(mapLimit, 1);\n\n/**\n * The same as [`applyEach`]{@link module:ControlFlow.applyEach} but runs only a single async operation at a time.\n *\n * @name applyEachSeries\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.applyEach]{@link module:ControlFlow.applyEach}\n * @category Control Flow\n * @param {Array|Iterable|Object} fns - A collection of {@link AsyncFunction}s to all\n * call with the same arguments\n * @param {...*} [args] - any number of separate arguments to pass to the\n * function.\n * @param {Function} [callback] - the final argument should be the callback,\n * called when all functions have completed processing.\n * @returns {Function} - If only the first argument is provided, it will return\n * a function which lets you pass in the arguments as if it were a single\n * function call.\n */\nvar applyEachSeries = applyEach$1(mapSeries);\n\n/**\n * A specialized version of `_.forEach` for arrays without support for\n * iteratee shorthands.\n *\n * @private\n * @param {Array} [array] The array to iterate over.\n * @param {Function} iteratee The function invoked per iteration.\n * @returns {Array} Returns `array`.\n */\nfunction arrayEach(array, iteratee) {\n  var index = -1,\n      length = array == null ? 0 : array.length;\n\n  while (++index < length) {\n    if (iteratee(array[index], index, array) === false) {\n      break;\n    }\n  }\n  return array;\n}\n\n/**\n * Creates a base function for methods like `_.forIn` and `_.forOwn`.\n *\n * @private\n * @param {boolean} [fromRight] Specify iterating from right to left.\n * @returns {Function} Returns the new base function.\n */\nfunction createBaseFor(fromRight) {\n  return function(object, iteratee, keysFunc) {\n    var index = -1,\n        iterable = Object(object),\n        props = keysFunc(object),\n        length = props.length;\n\n    while (length--) {\n      var key = props[fromRight ? length : ++index];\n      if (iteratee(iterable[key], key, iterable) === false) {\n        break;\n      }\n    }\n    return object;\n  };\n}\n\n/**\n * The base implementation of `baseForOwn` which iterates over `object`\n * properties returned by `keysFunc` and invokes `iteratee` for each property.\n * Iteratee functions may exit iteration early by explicitly returning `false`.\n *\n * @private\n * @param {Object} object The object to iterate over.\n * @param {Function} iteratee The function invoked per iteration.\n * @param {Function} keysFunc The function to get the keys of `object`.\n * @returns {Object} Returns `object`.\n */\nvar baseFor = createBaseFor();\n\n/**\n * The base implementation of `_.forOwn` without support for iteratee shorthands.\n *\n * @private\n * @param {Object} object The object to iterate over.\n * @param {Function} iteratee The function invoked per iteration.\n * @returns {Object} Returns `object`.\n */\nfunction baseForOwn(object, iteratee) {\n  return object && baseFor(object, iteratee, keys);\n}\n\n/**\n * The base implementation of `_.findIndex` and `_.findLastIndex` without\n * support for iteratee shorthands.\n *\n * @private\n * @param {Array} array The array to inspect.\n * @param {Function} predicate The function invoked per iteration.\n * @param {number} fromIndex The index to search from.\n * @param {boolean} [fromRight] Specify iterating from right to left.\n * @returns {number} Returns the index of the matched value, else `-1`.\n */\nfunction baseFindIndex(array, predicate, fromIndex, fromRight) {\n  var length = array.length,\n      index = fromIndex + (fromRight ? 1 : -1);\n\n  while ((fromRight ? index-- : ++index < length)) {\n    if (predicate(array[index], index, array)) {\n      return index;\n    }\n  }\n  return -1;\n}\n\n/**\n * The base implementation of `_.isNaN` without support for number objects.\n *\n * @private\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.\n */\nfunction baseIsNaN(value) {\n  return value !== value;\n}\n\n/**\n * A specialized version of `_.indexOf` which performs strict equality\n * comparisons of values, i.e. `===`.\n *\n * @private\n * @param {Array} array The array to inspect.\n * @param {*} value The value to search for.\n * @param {number} fromIndex The index to search from.\n * @returns {number} Returns the index of the matched value, else `-1`.\n */\nfunction strictIndexOf(array, value, fromIndex) {\n  var index = fromIndex - 1,\n      length = array.length;\n\n  while (++index < length) {\n    if (array[index] === value) {\n      return index;\n    }\n  }\n  return -1;\n}\n\n/**\n * The base implementation of `_.indexOf` without `fromIndex` bounds checks.\n *\n * @private\n * @param {Array} array The array to inspect.\n * @param {*} value The value to search for.\n * @param {number} fromIndex The index to search from.\n * @returns {number} Returns the index of the matched value, else `-1`.\n */\nfunction baseIndexOf(array, value, fromIndex) {\n  return value === value\n    ? strictIndexOf(array, value, fromIndex)\n    : baseFindIndex(array, baseIsNaN, fromIndex);\n}\n\n/**\n * Determines the best order for running the {@link AsyncFunction}s in `tasks`, based on\n * their requirements. Each function can optionally depend on other functions\n * being completed first, and each function is run as soon as its requirements\n * are satisfied.\n *\n * If any of the {@link AsyncFunction}s pass an error to their callback, the `auto` sequence\n * will stop. Further tasks will not execute (so any other functions depending\n * on it will not run), and the main `callback` is immediately called with the\n * error.\n *\n * {@link AsyncFunction}s also receive an object containing the results of functions which\n * have completed so far as the first argument, if they have dependencies. If a\n * task function has no dependencies, it will only be passed a callback.\n *\n * @name auto\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @param {Object} tasks - An object. Each of its properties is either a\n * function or an array of requirements, with the {@link AsyncFunction} itself the last item\n * in the array. The object's key of a property serves as the name of the task\n * defined by that property, i.e. can be used when specifying requirements for\n * other tasks. The function receives one or two arguments:\n * * a `results` object, containing the results of the previously executed\n *   functions, only passed if the task has any dependencies,\n * * a `callback(err, result)` function, which must be called when finished,\n *   passing an `error` (which can be `null`) and the result of the function's\n *   execution.\n * @param {number} [concurrency=Infinity] - An optional `integer` for\n * determining the maximum number of tasks that can be run in parallel. By\n * default, as many as possible.\n * @param {Function} [callback] - An optional callback which is called when all\n * the tasks have been completed. It receives the `err` argument if any `tasks`\n * pass an error to their callback. Results are always returned; however, if an\n * error occurs, no further `tasks` will be performed, and the results object\n * will only contain partial results. Invoked with (err, results).\n * @returns undefined\n * @example\n *\n * async.auto({\n *     // this function will just be passed a callback\n *     readData: async.apply(fs.readFile, 'data.txt', 'utf-8'),\n *     showData: ['readData', function(results, cb) {\n *         // results.readData is the file's contents\n *         // ...\n *     }]\n * }, callback);\n *\n * async.auto({\n *     get_data: function(callback) {\n *         console.log('in get_data');\n *         // async code to get some data\n *         callback(null, 'data', 'converted to array');\n *     },\n *     make_folder: function(callback) {\n *         console.log('in make_folder');\n *         // async code to create a directory to store a file in\n *         // this is run at the same time as getting the data\n *         callback(null, 'folder');\n *     },\n *     write_file: ['get_data', 'make_folder', function(results, callback) {\n *         console.log('in write_file', JSON.stringify(results));\n *         // once there is some data and the directory exists,\n *         // write the data to a file in the directory\n *         callback(null, 'filename');\n *     }],\n *     email_link: ['write_file', function(results, callback) {\n *         console.log('in email_link', JSON.stringify(results));\n *         // once the file is written let's email a link to it...\n *         // results.write_file contains the filename returned by write_file.\n *         callback(null, {'file':results.write_file, 'email':'user@example.com'});\n *     }]\n * }, function(err, results) {\n *     console.log('err = ', err);\n *     console.log('results = ', results);\n * });\n */\nvar auto = function (tasks, concurrency, callback) {\n    if (typeof concurrency === 'function') {\n        // concurrency is optional, shift the args.\n        callback = concurrency;\n        concurrency = null;\n    }\n    callback = once(callback || noop);\n    var keys$$1 = keys(tasks);\n    var numTasks = keys$$1.length;\n    if (!numTasks) {\n        return callback(null);\n    }\n    if (!concurrency) {\n        concurrency = numTasks;\n    }\n\n    var results = {};\n    var runningTasks = 0;\n    var hasError = false;\n\n    var listeners = Object.create(null);\n\n    var readyTasks = [];\n\n    // for cycle detection:\n    var readyToCheck = []; // tasks that have been identified as reachable\n    // without the possibility of returning to an ancestor task\n    var uncheckedDependencies = {};\n\n    baseForOwn(tasks, function (task, key) {\n        if (!isArray(task)) {\n            // no dependencies\n            enqueueTask(key, [task]);\n            readyToCheck.push(key);\n            return;\n        }\n\n        var dependencies = task.slice(0, task.length - 1);\n        var remainingDependencies = dependencies.length;\n        if (remainingDependencies === 0) {\n            enqueueTask(key, task);\n            readyToCheck.push(key);\n            return;\n        }\n        uncheckedDependencies[key] = remainingDependencies;\n\n        arrayEach(dependencies, function (dependencyName) {\n            if (!tasks[dependencyName]) {\n                throw new Error('async.auto task `' + key +\n                    '` has a non-existent dependency `' +\n                    dependencyName + '` in ' +\n                    dependencies.join(', '));\n            }\n            addListener(dependencyName, function () {\n                remainingDependencies--;\n                if (remainingDependencies === 0) {\n                    enqueueTask(key, task);\n                }\n            });\n        });\n    });\n\n    checkForDeadlocks();\n    processQueue();\n\n    function enqueueTask(key, task) {\n        readyTasks.push(function () {\n            runTask(key, task);\n        });\n    }\n\n    function processQueue() {\n        if (readyTasks.length === 0 && runningTasks === 0) {\n            return callback(null, results);\n        }\n        while(readyTasks.length && runningTasks < concurrency) {\n            var run = readyTasks.shift();\n            run();\n        }\n\n    }\n\n    function addListener(taskName, fn) {\n        var taskListeners = listeners[taskName];\n        if (!taskListeners) {\n            taskListeners = listeners[taskName] = [];\n        }\n\n        taskListeners.push(fn);\n    }\n\n    function taskComplete(taskName) {\n        var taskListeners = listeners[taskName] || [];\n        arrayEach(taskListeners, function (fn) {\n            fn();\n        });\n        processQueue();\n    }\n\n\n    function runTask(key, task) {\n        if (hasError) return;\n\n        var taskCallback = onlyOnce(function(err, result) {\n            runningTasks--;\n            if (arguments.length > 2) {\n                result = slice(arguments, 1);\n            }\n            if (err) {\n                var safeResults = {};\n                baseForOwn(results, function(val, rkey) {\n                    safeResults[rkey] = val;\n                });\n                safeResults[key] = result;\n                hasError = true;\n                listeners = Object.create(null);\n\n                callback(err, safeResults);\n            } else {\n                results[key] = result;\n                taskComplete(key);\n            }\n        });\n\n        runningTasks++;\n        var taskFn = wrapAsync(task[task.length - 1]);\n        if (task.length > 1) {\n            taskFn(results, taskCallback);\n        } else {\n            taskFn(taskCallback);\n        }\n    }\n\n    function checkForDeadlocks() {\n        // Kahn's algorithm\n        // https://en.wikipedia.org/wiki/Topological_sorting#Kahn.27s_algorithm\n        // http://connalle.blogspot.com/2013/10/topological-sortingkahn-algorithm.html\n        var currentTask;\n        var counter = 0;\n        while (readyToCheck.length) {\n            currentTask = readyToCheck.pop();\n            counter++;\n            arrayEach(getDependents(currentTask), function (dependent) {\n                if (--uncheckedDependencies[dependent] === 0) {\n                    readyToCheck.push(dependent);\n                }\n            });\n        }\n\n        if (counter !== numTasks) {\n            throw new Error(\n                'async.auto cannot execute tasks due to a recursive dependency'\n            );\n        }\n    }\n\n    function getDependents(taskName) {\n        var result = [];\n        baseForOwn(tasks, function (task, key) {\n            if (isArray(task) && baseIndexOf(task, taskName, 0) >= 0) {\n                result.push(key);\n            }\n        });\n        return result;\n    }\n};\n\n/**\n * A specialized version of `_.map` for arrays without support for iteratee\n * shorthands.\n *\n * @private\n * @param {Array} [array] The array to iterate over.\n * @param {Function} iteratee The function invoked per iteration.\n * @returns {Array} Returns the new mapped array.\n */\nfunction arrayMap(array, iteratee) {\n  var index = -1,\n      length = array == null ? 0 : array.length,\n      result = Array(length);\n\n  while (++index < length) {\n    result[index] = iteratee(array[index], index, array);\n  }\n  return result;\n}\n\n/** `Object#toString` result references. */\nvar symbolTag = '[object Symbol]';\n\n/**\n * Checks if `value` is classified as a `Symbol` primitive or object.\n *\n * @static\n * @memberOf _\n * @since 4.0.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.\n * @example\n *\n * _.isSymbol(Symbol.iterator);\n * // => true\n *\n * _.isSymbol('abc');\n * // => false\n */\nfunction isSymbol(value) {\n  return typeof value == 'symbol' ||\n    (isObjectLike(value) && baseGetTag(value) == symbolTag);\n}\n\n/** Used as references for various `Number` constants. */\nvar INFINITY = 1 / 0;\n\n/** Used to convert symbols to primitives and strings. */\nvar symbolProto = Symbol$1 ? Symbol$1.prototype : undefined;\nvar symbolToString = symbolProto ? symbolProto.toString : undefined;\n\n/**\n * The base implementation of `_.toString` which doesn't convert nullish\n * values to empty strings.\n *\n * @private\n * @param {*} value The value to process.\n * @returns {string} Returns the string.\n */\nfunction baseToString(value) {\n  // Exit early for strings to avoid a performance hit in some environments.\n  if (typeof value == 'string') {\n    return value;\n  }\n  if (isArray(value)) {\n    // Recursively convert values (susceptible to call stack limits).\n    return arrayMap(value, baseToString) + '';\n  }\n  if (isSymbol(value)) {\n    return symbolToString ? symbolToString.call(value) : '';\n  }\n  var result = (value + '');\n  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;\n}\n\n/**\n * The base implementation of `_.slice` without an iteratee call guard.\n *\n * @private\n * @param {Array} array The array to slice.\n * @param {number} [start=0] The start position.\n * @param {number} [end=array.length] The end position.\n * @returns {Array} Returns the slice of `array`.\n */\nfunction baseSlice(array, start, end) {\n  var index = -1,\n      length = array.length;\n\n  if (start < 0) {\n    start = -start > length ? 0 : (length + start);\n  }\n  end = end > length ? length : end;\n  if (end < 0) {\n    end += length;\n  }\n  length = start > end ? 0 : ((end - start) >>> 0);\n  start >>>= 0;\n\n  var result = Array(length);\n  while (++index < length) {\n    result[index] = array[index + start];\n  }\n  return result;\n}\n\n/**\n * Casts `array` to a slice if it's needed.\n *\n * @private\n * @param {Array} array The array to inspect.\n * @param {number} start The start position.\n * @param {number} [end=array.length] The end position.\n * @returns {Array} Returns the cast slice.\n */\nfunction castSlice(array, start, end) {\n  var length = array.length;\n  end = end === undefined ? length : end;\n  return (!start && end >= length) ? array : baseSlice(array, start, end);\n}\n\n/**\n * Used by `_.trim` and `_.trimEnd` to get the index of the last string symbol\n * that is not found in the character symbols.\n *\n * @private\n * @param {Array} strSymbols The string symbols to inspect.\n * @param {Array} chrSymbols The character symbols to find.\n * @returns {number} Returns the index of the last unmatched string symbol.\n */\nfunction charsEndIndex(strSymbols, chrSymbols) {\n  var index = strSymbols.length;\n\n  while (index-- && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}\n  return index;\n}\n\n/**\n * Used by `_.trim` and `_.trimStart` to get the index of the first string symbol\n * that is not found in the character symbols.\n *\n * @private\n * @param {Array} strSymbols The string symbols to inspect.\n * @param {Array} chrSymbols The character symbols to find.\n * @returns {number} Returns the index of the first unmatched string symbol.\n */\nfunction charsStartIndex(strSymbols, chrSymbols) {\n  var index = -1,\n      length = strSymbols.length;\n\n  while (++index < length && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}\n  return index;\n}\n\n/**\n * Converts an ASCII `string` to an array.\n *\n * @private\n * @param {string} string The string to convert.\n * @returns {Array} Returns the converted array.\n */\nfunction asciiToArray(string) {\n  return string.split('');\n}\n\n/** Used to compose unicode character classes. */\nvar rsAstralRange = '\\\\ud800-\\\\udfff';\nvar rsComboMarksRange = '\\\\u0300-\\\\u036f';\nvar reComboHalfMarksRange = '\\\\ufe20-\\\\ufe2f';\nvar rsComboSymbolsRange = '\\\\u20d0-\\\\u20ff';\nvar rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange;\nvar rsVarRange = '\\\\ufe0e\\\\ufe0f';\n\n/** Used to compose unicode capture groups. */\nvar rsZWJ = '\\\\u200d';\n\n/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */\nvar reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboRange + rsVarRange + ']');\n\n/**\n * Checks if `string` contains Unicode symbols.\n *\n * @private\n * @param {string} string The string to inspect.\n * @returns {boolean} Returns `true` if a symbol is found, else `false`.\n */\nfunction hasUnicode(string) {\n  return reHasUnicode.test(string);\n}\n\n/** Used to compose unicode character classes. */\nvar rsAstralRange$1 = '\\\\ud800-\\\\udfff';\nvar rsComboMarksRange$1 = '\\\\u0300-\\\\u036f';\nvar reComboHalfMarksRange$1 = '\\\\ufe20-\\\\ufe2f';\nvar rsComboSymbolsRange$1 = '\\\\u20d0-\\\\u20ff';\nvar rsComboRange$1 = rsComboMarksRange$1 + reComboHalfMarksRange$1 + rsComboSymbolsRange$1;\nvar rsVarRange$1 = '\\\\ufe0e\\\\ufe0f';\n\n/** Used to compose unicode capture groups. */\nvar rsAstral = '[' + rsAstralRange$1 + ']';\nvar rsCombo = '[' + rsComboRange$1 + ']';\nvar rsFitz = '\\\\ud83c[\\\\udffb-\\\\udfff]';\nvar rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')';\nvar rsNonAstral = '[^' + rsAstralRange$1 + ']';\nvar rsRegional = '(?:\\\\ud83c[\\\\udde6-\\\\uddff]){2}';\nvar rsSurrPair = '[\\\\ud800-\\\\udbff][\\\\udc00-\\\\udfff]';\nvar rsZWJ$1 = '\\\\u200d';\n\n/** Used to compose unicode regexes. */\nvar reOptMod = rsModifier + '?';\nvar rsOptVar = '[' + rsVarRange$1 + ']?';\nvar rsOptJoin = '(?:' + rsZWJ$1 + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*';\nvar rsSeq = rsOptVar + reOptMod + rsOptJoin;\nvar rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';\n\n/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */\nvar reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');\n\n/**\n * Converts a Unicode `string` to an array.\n *\n * @private\n * @param {string} string The string to convert.\n * @returns {Array} Returns the converted array.\n */\nfunction unicodeToArray(string) {\n  return string.match(reUnicode) || [];\n}\n\n/**\n * Converts `string` to an array.\n *\n * @private\n * @param {string} string The string to convert.\n * @returns {Array} Returns the converted array.\n */\nfunction stringToArray(string) {\n  return hasUnicode(string)\n    ? unicodeToArray(string)\n    : asciiToArray(string);\n}\n\n/**\n * Converts `value` to a string. An empty string is returned for `null`\n * and `undefined` values. The sign of `-0` is preserved.\n *\n * @static\n * @memberOf _\n * @since 4.0.0\n * @category Lang\n * @param {*} value The value to convert.\n * @returns {string} Returns the converted string.\n * @example\n *\n * _.toString(null);\n * // => ''\n *\n * _.toString(-0);\n * // => '-0'\n *\n * _.toString([1, 2, 3]);\n * // => '1,2,3'\n */\nfunction toString(value) {\n  return value == null ? '' : baseToString(value);\n}\n\n/** Used to match leading and trailing whitespace. */\nvar reTrim = /^\\s+|\\s+$/g;\n\n/**\n * Removes leading and trailing whitespace or specified characters from `string`.\n *\n * @static\n * @memberOf _\n * @since 3.0.0\n * @category String\n * @param {string} [string=''] The string to trim.\n * @param {string} [chars=whitespace] The characters to trim.\n * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.\n * @returns {string} Returns the trimmed string.\n * @example\n *\n * _.trim('  abc  ');\n * // => 'abc'\n *\n * _.trim('-_-abc-_-', '_-');\n * // => 'abc'\n *\n * _.map(['  foo  ', '  bar  '], _.trim);\n * // => ['foo', 'bar']\n */\nfunction trim(string, chars, guard) {\n  string = toString(string);\n  if (string && (guard || chars === undefined)) {\n    return string.replace(reTrim, '');\n  }\n  if (!string || !(chars = baseToString(chars))) {\n    return string;\n  }\n  var strSymbols = stringToArray(string),\n      chrSymbols = stringToArray(chars),\n      start = charsStartIndex(strSymbols, chrSymbols),\n      end = charsEndIndex(strSymbols, chrSymbols) + 1;\n\n  return castSlice(strSymbols, start, end).join('');\n}\n\nvar FN_ARGS = /^(?:async\\s+)?(function)?\\s*[^\\(]*\\(\\s*([^\\)]*)\\)/m;\nvar FN_ARG_SPLIT = /,/;\nvar FN_ARG = /(=.+)?(\\s*)$/;\nvar STRIP_COMMENTS = /((\\/\\/.*$)|(\\/\\*[\\s\\S]*?\\*\\/))/mg;\n\nfunction parseParams(func) {\n    func = func.toString().replace(STRIP_COMMENTS, '');\n    func = func.match(FN_ARGS)[2].replace(' ', '');\n    func = func ? func.split(FN_ARG_SPLIT) : [];\n    func = func.map(function (arg){\n        return trim(arg.replace(FN_ARG, ''));\n    });\n    return func;\n}\n\n/**\n * A dependency-injected version of the [async.auto]{@link module:ControlFlow.auto} function. Dependent\n * tasks are specified as parameters to the function, after the usual callback\n * parameter, with the parameter names matching the names of the tasks it\n * depends on. This can provide even more readable task graphs which can be\n * easier to maintain.\n *\n * If a final callback is specified, the task results are similarly injected,\n * specified as named parameters after the initial error parameter.\n *\n * The autoInject function is purely syntactic sugar and its semantics are\n * otherwise equivalent to [async.auto]{@link module:ControlFlow.auto}.\n *\n * @name autoInject\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.auto]{@link module:ControlFlow.auto}\n * @category Control Flow\n * @param {Object} tasks - An object, each of whose properties is an {@link AsyncFunction} of\n * the form 'func([dependencies...], callback). The object's key of a property\n * serves as the name of the task defined by that property, i.e. can be used\n * when specifying requirements for other tasks.\n * * The `callback` parameter is a `callback(err, result)` which must be called\n *   when finished, passing an `error` (which can be `null`) and the result of\n *   the function's execution. The remaining parameters name other tasks on\n *   which the task is dependent, and the results from those tasks are the\n *   arguments of those parameters.\n * @param {Function} [callback] - An optional callback which is called when all\n * the tasks have been completed. It receives the `err` argument if any `tasks`\n * pass an error to their callback, and a `results` object with any completed\n * task results, similar to `auto`.\n * @example\n *\n * //  The example from `auto` can be rewritten as follows:\n * async.autoInject({\n *     get_data: function(callback) {\n *         // async code to get some data\n *         callback(null, 'data', 'converted to array');\n *     },\n *     make_folder: function(callback) {\n *         // async code to create a directory to store a file in\n *         // this is run at the same time as getting the data\n *         callback(null, 'folder');\n *     },\n *     write_file: function(get_data, make_folder, callback) {\n *         // once there is some data and the directory exists,\n *         // write the data to a file in the directory\n *         callback(null, 'filename');\n *     },\n *     email_link: function(write_file, callback) {\n *         // once the file is written let's email a link to it...\n *         // write_file contains the filename returned by write_file.\n *         callback(null, {'file':write_file, 'email':'user@example.com'});\n *     }\n * }, function(err, results) {\n *     console.log('err = ', err);\n *     console.log('email_link = ', results.email_link);\n * });\n *\n * // If you are using a JS minifier that mangles parameter names, `autoInject`\n * // will not work with plain functions, since the parameter names will be\n * // collapsed to a single letter identifier.  To work around this, you can\n * // explicitly specify the names of the parameters your task function needs\n * // in an array, similar to Angular.js dependency injection.\n *\n * // This still has an advantage over plain `auto`, since the results a task\n * // depends on are still spread into arguments.\n * async.autoInject({\n *     //...\n *     write_file: ['get_data', 'make_folder', function(get_data, make_folder, callback) {\n *         callback(null, 'filename');\n *     }],\n *     email_link: ['write_file', function(write_file, callback) {\n *         callback(null, {'file':write_file, 'email':'user@example.com'});\n *     }]\n *     //...\n * }, function(err, results) {\n *     console.log('err = ', err);\n *     console.log('email_link = ', results.email_link);\n * });\n */\nfunction autoInject(tasks, callback) {\n    var newTasks = {};\n\n    baseForOwn(tasks, function (taskFn, key) {\n        var params;\n        var fnIsAsync = isAsync(taskFn);\n        var hasNoDeps =\n            (!fnIsAsync && taskFn.length === 1) ||\n            (fnIsAsync && taskFn.length === 0);\n\n        if (isArray(taskFn)) {\n            params = taskFn.slice(0, -1);\n            taskFn = taskFn[taskFn.length - 1];\n\n            newTasks[key] = params.concat(params.length > 0 ? newTask : taskFn);\n        } else if (hasNoDeps) {\n            // no dependencies, use the function as-is\n            newTasks[key] = taskFn;\n        } else {\n            params = parseParams(taskFn);\n            if (taskFn.length === 0 && !fnIsAsync && params.length === 0) {\n                throw new Error(\"autoInject task functions require explicit parameters.\");\n            }\n\n            // remove callback param\n            if (!fnIsAsync) params.pop();\n\n            newTasks[key] = params.concat(newTask);\n        }\n\n        function newTask(results, taskCb) {\n            var newArgs = arrayMap(params, function (name) {\n                return results[name];\n            });\n            newArgs.push(taskCb);\n            wrapAsync(taskFn).apply(null, newArgs);\n        }\n    });\n\n    auto(newTasks, callback);\n}\n\n// Simple doubly linked list (https://en.wikipedia.org/wiki/Doubly_linked_list) implementation\n// used for queues. This implementation assumes that the node provided by the user can be modified\n// to adjust the next and last properties. We implement only the minimal functionality\n// for queue support.\nfunction DLL() {\n    this.head = this.tail = null;\n    this.length = 0;\n}\n\nfunction setInitial(dll, node) {\n    dll.length = 1;\n    dll.head = dll.tail = node;\n}\n\nDLL.prototype.removeLink = function(node) {\n    if (node.prev) node.prev.next = node.next;\n    else this.head = node.next;\n    if (node.next) node.next.prev = node.prev;\n    else this.tail = node.prev;\n\n    node.prev = node.next = null;\n    this.length -= 1;\n    return node;\n};\n\nDLL.prototype.empty = function () {\n    while(this.head) this.shift();\n    return this;\n};\n\nDLL.prototype.insertAfter = function(node, newNode) {\n    newNode.prev = node;\n    newNode.next = node.next;\n    if (node.next) node.next.prev = newNode;\n    else this.tail = newNode;\n    node.next = newNode;\n    this.length += 1;\n};\n\nDLL.prototype.insertBefore = function(node, newNode) {\n    newNode.prev = node.prev;\n    newNode.next = node;\n    if (node.prev) node.prev.next = newNode;\n    else this.head = newNode;\n    node.prev = newNode;\n    this.length += 1;\n};\n\nDLL.prototype.unshift = function(node) {\n    if (this.head) this.insertBefore(this.head, node);\n    else setInitial(this, node);\n};\n\nDLL.prototype.push = function(node) {\n    if (this.tail) this.insertAfter(this.tail, node);\n    else setInitial(this, node);\n};\n\nDLL.prototype.shift = function() {\n    return this.head && this.removeLink(this.head);\n};\n\nDLL.prototype.pop = function() {\n    return this.tail && this.removeLink(this.tail);\n};\n\nDLL.prototype.toArray = function () {\n    var arr = Array(this.length);\n    var curr = this.head;\n    for(var idx = 0; idx < this.length; idx++) {\n        arr[idx] = curr.data;\n        curr = curr.next;\n    }\n    return arr;\n};\n\nDLL.prototype.remove = function (testFn) {\n    var curr = this.head;\n    while(!!curr) {\n        var next = curr.next;\n        if (testFn(curr)) {\n            this.removeLink(curr);\n        }\n        curr = next;\n    }\n    return this;\n};\n\nfunction queue(worker, concurrency, payload) {\n    if (concurrency == null) {\n        concurrency = 1;\n    }\n    else if(concurrency === 0) {\n        throw new Error('Concurrency must not be zero');\n    }\n\n    var _worker = wrapAsync(worker);\n    var numRunning = 0;\n    var workersList = [];\n\n    var processingScheduled = false;\n    function _insert(data, insertAtFront, callback) {\n        if (callback != null && typeof callback !== 'function') {\n            throw new Error('task callback must be a function');\n        }\n        q.started = true;\n        if (!isArray(data)) {\n            data = [data];\n        }\n        if (data.length === 0 && q.idle()) {\n            // call drain immediately if there are no tasks\n            return setImmediate$1(function() {\n                q.drain();\n            });\n        }\n\n        for (var i = 0, l = data.length; i < l; i++) {\n            var item = {\n                data: data[i],\n                callback: callback || noop\n            };\n\n            if (insertAtFront) {\n                q._tasks.unshift(item);\n            } else {\n                q._tasks.push(item);\n            }\n        }\n\n        if (!processingScheduled) {\n            processingScheduled = true;\n            setImmediate$1(function() {\n                processingScheduled = false;\n                q.process();\n            });\n        }\n    }\n\n    function _next(tasks) {\n        return function(err){\n            numRunning -= 1;\n\n            for (var i = 0, l = tasks.length; i < l; i++) {\n                var task = tasks[i];\n\n                var index = baseIndexOf(workersList, task, 0);\n                if (index === 0) {\n                    workersList.shift();\n                } else if (index > 0) {\n                    workersList.splice(index, 1);\n                }\n\n                task.callback.apply(task, arguments);\n\n                if (err != null) {\n                    q.error(err, task.data);\n                }\n            }\n\n            if (numRunning <= (q.concurrency - q.buffer) ) {\n                q.unsaturated();\n            }\n\n            if (q.idle()) {\n                q.drain();\n            }\n            q.process();\n        };\n    }\n\n    var isProcessing = false;\n    var q = {\n        _tasks: new DLL(),\n        concurrency: concurrency,\n        payload: payload,\n        saturated: noop,\n        unsaturated:noop,\n        buffer: concurrency / 4,\n        empty: noop,\n        drain: noop,\n        error: noop,\n        started: false,\n        paused: false,\n        push: function (data, callback) {\n            _insert(data, false, callback);\n        },\n        kill: function () {\n            q.drain = noop;\n            q._tasks.empty();\n        },\n        unshift: function (data, callback) {\n            _insert(data, true, callback);\n        },\n        remove: function (testFn) {\n            q._tasks.remove(testFn);\n        },\n        process: function () {\n            // Avoid trying to start too many processing operations. This can occur\n            // when callbacks resolve synchronously (#1267).\n            if (isProcessing) {\n                return;\n            }\n            isProcessing = true;\n            while(!q.paused && numRunning < q.concurrency && q._tasks.length){\n                var tasks = [], data = [];\n                var l = q._tasks.length;\n                if (q.payload) l = Math.min(l, q.payload);\n                for (var i = 0; i < l; i++) {\n                    var node = q._tasks.shift();\n                    tasks.push(node);\n                    workersList.push(node);\n                    data.push(node.data);\n                }\n\n                numRunning += 1;\n\n                if (q._tasks.length === 0) {\n                    q.empty();\n                }\n\n                if (numRunning === q.concurrency) {\n                    q.saturated();\n                }\n\n                var cb = onlyOnce(_next(tasks));\n                _worker(data, cb);\n            }\n            isProcessing = false;\n        },\n        length: function () {\n            return q._tasks.length;\n        },\n        running: function () {\n            return numRunning;\n        },\n        workersList: function () {\n            return workersList;\n        },\n        idle: function() {\n            return q._tasks.length + numRunning === 0;\n        },\n        pause: function () {\n            q.paused = true;\n        },\n        resume: function () {\n            if (q.paused === false) { return; }\n            q.paused = false;\n            setImmediate$1(q.process);\n        }\n    };\n    return q;\n}\n\n/**\n * A cargo of tasks for the worker function to complete. Cargo inherits all of\n * the same methods and event callbacks as [`queue`]{@link module:ControlFlow.queue}.\n * @typedef {Object} CargoObject\n * @memberOf module:ControlFlow\n * @property {Function} length - A function returning the number of items\n * waiting to be processed. Invoke like `cargo.length()`.\n * @property {number} payload - An `integer` for determining how many tasks\n * should be process per round. This property can be changed after a `cargo` is\n * created to alter the payload on-the-fly.\n * @property {Function} push - Adds `task` to the `queue`. The callback is\n * called once the `worker` has finished processing the task. Instead of a\n * single task, an array of `tasks` can be submitted. The respective callback is\n * used for every task in the list. Invoke like `cargo.push(task, [callback])`.\n * @property {Function} saturated - A callback that is called when the\n * `queue.length()` hits the concurrency and further tasks will be queued.\n * @property {Function} empty - A callback that is called when the last item\n * from the `queue` is given to a `worker`.\n * @property {Function} drain - A callback that is called when the last item\n * from the `queue` has returned from the `worker`.\n * @property {Function} idle - a function returning false if there are items\n * waiting or being processed, or true if not. Invoke like `cargo.idle()`.\n * @property {Function} pause - a function that pauses the processing of tasks\n * until `resume()` is called. Invoke like `cargo.pause()`.\n * @property {Function} resume - a function that resumes the processing of\n * queued tasks when the queue is paused. Invoke like `cargo.resume()`.\n * @property {Function} kill - a function that removes the `drain` callback and\n * empties remaining tasks from the queue forcing it to go idle. Invoke like `cargo.kill()`.\n */\n\n/**\n * Creates a `cargo` object with the specified payload. Tasks added to the\n * cargo will be processed altogether (up to the `payload` limit). If the\n * `worker` is in progress, the task is queued until it becomes available. Once\n * the `worker` has completed some tasks, each callback of those tasks is\n * called. Check out [these](https://camo.githubusercontent.com/6bbd36f4cf5b35a0f11a96dcd2e97711ffc2fb37/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f313637363837312f36383130382f62626330636662302d356632392d313165322d393734662d3333393763363464633835382e676966) [animations](https://camo.githubusercontent.com/f4810e00e1c5f5f8addbe3e9f49064fd5d102699/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f313637363837312f36383130312f38346339323036362d356632392d313165322d383134662d3964336430323431336266642e676966)\n * for how `cargo` and `queue` work.\n *\n * While [`queue`]{@link module:ControlFlow.queue} passes only one task to one of a group of workers\n * at a time, cargo passes an array of tasks to a single worker, repeating\n * when the worker is finished.\n *\n * @name cargo\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.queue]{@link module:ControlFlow.queue}\n * @category Control Flow\n * @param {AsyncFunction} worker - An asynchronous function for processing an array\n * of queued tasks. Invoked with `(tasks, callback)`.\n * @param {number} [payload=Infinity] - An optional `integer` for determining\n * how many tasks should be processed per round; if omitted, the default is\n * unlimited.\n * @returns {module:ControlFlow.CargoObject} A cargo object to manage the tasks. Callbacks can\n * attached as certain properties to listen for specific events during the\n * lifecycle of the cargo and inner queue.\n * @example\n *\n * // create a cargo object with payload 2\n * var cargo = async.cargo(function(tasks, callback) {\n *     for (var i=0; i<tasks.length; i++) {\n *         console.log('hello ' + tasks[i].name);\n *     }\n *     callback();\n * }, 2);\n *\n * // add some items\n * cargo.push({name: 'foo'}, function(err) {\n *     console.log('finished processing foo');\n * });\n * cargo.push({name: 'bar'}, function(err) {\n *     console.log('finished processing bar');\n * });\n * cargo.push({name: 'baz'}, function(err) {\n *     console.log('finished processing baz');\n * });\n */\nfunction cargo(worker, payload) {\n    return queue(worker, 1, payload);\n}\n\n/**\n * The same as [`eachOf`]{@link module:Collections.eachOf} but runs only a single async operation at a time.\n *\n * @name eachOfSeries\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.eachOf]{@link module:Collections.eachOf}\n * @alias forEachOfSeries\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - An async function to apply to each item in\n * `coll`.\n * Invoked with (item, key, callback).\n * @param {Function} [callback] - A callback which is called when all `iteratee`\n * functions have finished, or an error occurs. Invoked with (err).\n */\nvar eachOfSeries = doLimit(eachOfLimit, 1);\n\n/**\n * Reduces `coll` into a single value using an async `iteratee` to return each\n * successive step. `memo` is the initial state of the reduction. This function\n * only operates in series.\n *\n * For performance reasons, it may make sense to split a call to this function\n * into a parallel map, and then use the normal `Array.prototype.reduce` on the\n * results. This function is for situations where each step in the reduction\n * needs to be async; if you can get the data before reducing it, then it's\n * probably a good idea to do so.\n *\n * @name reduce\n * @static\n * @memberOf module:Collections\n * @method\n * @alias inject\n * @alias foldl\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {*} memo - The initial state of the reduction.\n * @param {AsyncFunction} iteratee - A function applied to each item in the\n * array to produce the next step in the reduction.\n * The `iteratee` should complete with the next state of the reduction.\n * If the iteratee complete with an error, the reduction is stopped and the\n * main `callback` is immediately called with the error.\n * Invoked with (memo, item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Result is the reduced value. Invoked with\n * (err, result).\n * @example\n *\n * async.reduce([1,2,3], 0, function(memo, item, callback) {\n *     // pointless async:\n *     process.nextTick(function() {\n *         callback(null, memo + item)\n *     });\n * }, function(err, result) {\n *     // result is now equal to the last value of memo, which is 6\n * });\n */\nfunction reduce(coll, memo, iteratee, callback) {\n    callback = once(callback || noop);\n    var _iteratee = wrapAsync(iteratee);\n    eachOfSeries(coll, function(x, i, callback) {\n        _iteratee(memo, x, function(err, v) {\n            memo = v;\n            callback(err);\n        });\n    }, function(err) {\n        callback(err, memo);\n    });\n}\n\n/**\n * Version of the compose function that is more natural to read. Each function\n * consumes the return value of the previous function. It is the equivalent of\n * [compose]{@link module:ControlFlow.compose} with the arguments reversed.\n *\n * Each function is executed with the `this` binding of the composed function.\n *\n * @name seq\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.compose]{@link module:ControlFlow.compose}\n * @category Control Flow\n * @param {...AsyncFunction} functions - the asynchronous functions to compose\n * @returns {Function} a function that composes the `functions` in order\n * @example\n *\n * // Requires lodash (or underscore), express3 and dresende's orm2.\n * // Part of an app, that fetches cats of the logged user.\n * // This example uses `seq` function to avoid overnesting and error\n * // handling clutter.\n * app.get('/cats', function(request, response) {\n *     var User = request.models.User;\n *     async.seq(\n *         _.bind(User.get, User),  // 'User.get' has signature (id, callback(err, data))\n *         function(user, fn) {\n *             user.getCats(fn);      // 'getCats' has signature (callback(err, data))\n *         }\n *     )(req.session.user_id, function (err, cats) {\n *         if (err) {\n *             console.error(err);\n *             response.json({ status: 'error', message: err.message });\n *         } else {\n *             response.json({ status: 'ok', message: 'Cats found', data: cats });\n *         }\n *     });\n * });\n */\nfunction seq(/*...functions*/) {\n    var _functions = arrayMap(arguments, wrapAsync);\n    return function(/*...args*/) {\n        var args = slice(arguments);\n        var that = this;\n\n        var cb = args[args.length - 1];\n        if (typeof cb == 'function') {\n            args.pop();\n        } else {\n            cb = noop;\n        }\n\n        reduce(_functions, args, function(newargs, fn, cb) {\n            fn.apply(that, newargs.concat(function(err/*, ...nextargs*/) {\n                var nextargs = slice(arguments, 1);\n                cb(err, nextargs);\n            }));\n        },\n        function(err, results) {\n            cb.apply(that, [err].concat(results));\n        });\n    };\n}\n\n/**\n * Creates a function which is a composition of the passed asynchronous\n * functions. Each function consumes the return value of the function that\n * follows. Composing functions `f()`, `g()`, and `h()` would produce the result\n * of `f(g(h()))`, only this version uses callbacks to obtain the return values.\n *\n * Each function is executed with the `this` binding of the composed function.\n *\n * @name compose\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @param {...AsyncFunction} functions - the asynchronous functions to compose\n * @returns {Function} an asynchronous function that is the composed\n * asynchronous `functions`\n * @example\n *\n * function add1(n, callback) {\n *     setTimeout(function () {\n *         callback(null, n + 1);\n *     }, 10);\n * }\n *\n * function mul3(n, callback) {\n *     setTimeout(function () {\n *         callback(null, n * 3);\n *     }, 10);\n * }\n *\n * var add1mul3 = async.compose(mul3, add1);\n * add1mul3(4, function (err, result) {\n *     // result now equals 15\n * });\n */\nvar compose = function(/*...args*/) {\n    return seq.apply(null, slice(arguments).reverse());\n};\n\nvar _concat = Array.prototype.concat;\n\n/**\n * The same as [`concat`]{@link module:Collections.concat} but runs a maximum of `limit` async operations at a time.\n *\n * @name concatLimit\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.concat]{@link module:Collections.concat}\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {AsyncFunction} iteratee - A function to apply to each item in `coll`,\n * which should use an array as its result. Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished, or an error occurs. Results is an array\n * containing the concatenated results of the `iteratee` function. Invoked with\n * (err, results).\n */\nvar concatLimit = function(coll, limit, iteratee, callback) {\n    callback = callback || noop;\n    var _iteratee = wrapAsync(iteratee);\n    mapLimit(coll, limit, function(val, callback) {\n        _iteratee(val, function(err /*, ...args*/) {\n            if (err) return callback(err);\n            return callback(null, slice(arguments, 1));\n        });\n    }, function(err, mapResults) {\n        var result = [];\n        for (var i = 0; i < mapResults.length; i++) {\n            if (mapResults[i]) {\n                result = _concat.apply(result, mapResults[i]);\n            }\n        }\n\n        return callback(err, result);\n    });\n};\n\n/**\n * Applies `iteratee` to each item in `coll`, concatenating the results. Returns\n * the concatenated list. The `iteratee`s are called in parallel, and the\n * results are concatenated as they return. There is no guarantee that the\n * results array will be returned in the original order of `coll` passed to the\n * `iteratee` function.\n *\n * @name concat\n * @static\n * @memberOf module:Collections\n * @method\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - A function to apply to each item in `coll`,\n * which should use an array as its result. Invoked with (item, callback).\n * @param {Function} [callback(err)] - A callback which is called after all the\n * `iteratee` functions have finished, or an error occurs. Results is an array\n * containing the concatenated results of the `iteratee` function. Invoked with\n * (err, results).\n * @example\n *\n * async.concat(['dir1','dir2','dir3'], fs.readdir, function(err, files) {\n *     // files is now a list of filenames that exist in the 3 directories\n * });\n */\nvar concat = doLimit(concatLimit, Infinity);\n\n/**\n * The same as [`concat`]{@link module:Collections.concat} but runs only a single async operation at a time.\n *\n * @name concatSeries\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.concat]{@link module:Collections.concat}\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - A function to apply to each item in `coll`.\n * The iteratee should complete with an array an array of results.\n * Invoked with (item, callback).\n * @param {Function} [callback(err)] - A callback which is called after all the\n * `iteratee` functions have finished, or an error occurs. Results is an array\n * containing the concatenated results of the `iteratee` function. Invoked with\n * (err, results).\n */\nvar concatSeries = doLimit(concatLimit, 1);\n\n/**\n * Returns a function that when called, calls-back with the values provided.\n * Useful as the first function in a [`waterfall`]{@link module:ControlFlow.waterfall}, or for plugging values in to\n * [`auto`]{@link module:ControlFlow.auto}.\n *\n * @name constant\n * @static\n * @memberOf module:Utils\n * @method\n * @category Util\n * @param {...*} arguments... - Any number of arguments to automatically invoke\n * callback with.\n * @returns {AsyncFunction} Returns a function that when invoked, automatically\n * invokes the callback with the previous given arguments.\n * @example\n *\n * async.waterfall([\n *     async.constant(42),\n *     function (value, next) {\n *         // value === 42\n *     },\n *     //...\n * ], callback);\n *\n * async.waterfall([\n *     async.constant(filename, \"utf8\"),\n *     fs.readFile,\n *     function (fileData, next) {\n *         //...\n *     }\n *     //...\n * ], callback);\n *\n * async.auto({\n *     hostname: async.constant(\"https://server.net/\"),\n *     port: findFreePort,\n *     launchServer: [\"hostname\", \"port\", function (options, cb) {\n *         startServer(options, cb);\n *     }],\n *     //...\n * }, callback);\n */\nvar constant = function(/*...values*/) {\n    var values = slice(arguments);\n    var args = [null].concat(values);\n    return function (/*...ignoredArgs, callback*/) {\n        var callback = arguments[arguments.length - 1];\n        return callback.apply(this, args);\n    };\n};\n\n/**\n * This method returns the first argument it receives.\n *\n * @static\n * @since 0.1.0\n * @memberOf _\n * @category Util\n * @param {*} value Any value.\n * @returns {*} Returns `value`.\n * @example\n *\n * var object = { 'a': 1 };\n *\n * console.log(_.identity(object) === object);\n * // => true\n */\nfunction identity(value) {\n  return value;\n}\n\nfunction _createTester(check, getResult) {\n    return function(eachfn, arr, iteratee, cb) {\n        cb = cb || noop;\n        var testPassed = false;\n        var testResult;\n        eachfn(arr, function(value, _, callback) {\n            iteratee(value, function(err, result) {\n                if (err) {\n                    callback(err);\n                } else if (check(result) && !testResult) {\n                    testPassed = true;\n                    testResult = getResult(true, value);\n                    callback(null, breakLoop);\n                } else {\n                    callback();\n                }\n            });\n        }, function(err) {\n            if (err) {\n                cb(err);\n            } else {\n                cb(null, testPassed ? testResult : getResult(false));\n            }\n        });\n    };\n}\n\nfunction _findGetResult(v, x) {\n    return x;\n}\n\n/**\n * Returns the first value in `coll` that passes an async truth test. The\n * `iteratee` is applied in parallel, meaning the first iteratee to return\n * `true` will fire the detect `callback` with that result. That means the\n * result might not be the first item in the original `coll` (in terms of order)\n * that passes the test.\n\n * If order within the original `coll` is important, then look at\n * [`detectSeries`]{@link module:Collections.detectSeries}.\n *\n * @name detect\n * @static\n * @memberOf module:Collections\n * @method\n * @alias find\n * @category Collections\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - A truth test to apply to each item in `coll`.\n * The iteratee must complete with a boolean value as its result.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called as soon as any\n * iteratee returns `true`, or after all the `iteratee` functions have finished.\n * Result will be the first item in the array that passes the truth test\n * (iteratee) or the value `undefined` if none passed. Invoked with\n * (err, result).\n * @example\n *\n * async.detect(['file1','file2','file3'], function(filePath, callback) {\n *     fs.access(filePath, function(err) {\n *         callback(null, !err)\n *     });\n * }, function(err, result) {\n *     // result now equals the first file in the list that exists\n * });\n */\nvar detect = doParallel(_createTester(identity, _findGetResult));\n\n/**\n * The same as [`detect`]{@link module:Collections.detect} but runs a maximum of `limit` async operations at a\n * time.\n *\n * @name detectLimit\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.detect]{@link module:Collections.detect}\n * @alias findLimit\n * @category Collections\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {AsyncFunction} iteratee - A truth test to apply to each item in `coll`.\n * The iteratee must complete with a boolean value as its result.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called as soon as any\n * iteratee returns `true`, or after all the `iteratee` functions have finished.\n * Result will be the first item in the array that passes the truth test\n * (iteratee) or the value `undefined` if none passed. Invoked with\n * (err, result).\n */\nvar detectLimit = doParallelLimit(_createTester(identity, _findGetResult));\n\n/**\n * The same as [`detect`]{@link module:Collections.detect} but runs only a single async operation at a time.\n *\n * @name detectSeries\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.detect]{@link module:Collections.detect}\n * @alias findSeries\n * @category Collections\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - A truth test to apply to each item in `coll`.\n * The iteratee must complete with a boolean value as its result.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called as soon as any\n * iteratee returns `true`, or after all the `iteratee` functions have finished.\n * Result will be the first item in the array that passes the truth test\n * (iteratee) or the value `undefined` if none passed. Invoked with\n * (err, result).\n */\nvar detectSeries = doLimit(detectLimit, 1);\n\nfunction consoleFunc(name) {\n    return function (fn/*, ...args*/) {\n        var args = slice(arguments, 1);\n        args.push(function (err/*, ...args*/) {\n            var args = slice(arguments, 1);\n            if (typeof console === 'object') {\n                if (err) {\n                    if (console.error) {\n                        console.error(err);\n                    }\n                } else if (console[name]) {\n                    arrayEach(args, function (x) {\n                        console[name](x);\n                    });\n                }\n            }\n        });\n        wrapAsync(fn).apply(null, args);\n    };\n}\n\n/**\n * Logs the result of an [`async` function]{@link AsyncFunction} to the\n * `console` using `console.dir` to display the properties of the resulting object.\n * Only works in Node.js or in browsers that support `console.dir` and\n * `console.error` (such as FF and Chrome).\n * If multiple arguments are returned from the async function,\n * `console.dir` is called on each argument in order.\n *\n * @name dir\n * @static\n * @memberOf module:Utils\n * @method\n * @category Util\n * @param {AsyncFunction} function - The function you want to eventually apply\n * all arguments to.\n * @param {...*} arguments... - Any number of arguments to apply to the function.\n * @example\n *\n * // in a module\n * var hello = function(name, callback) {\n *     setTimeout(function() {\n *         callback(null, {hello: name});\n *     }, 1000);\n * };\n *\n * // in the node repl\n * node> async.dir(hello, 'world');\n * {hello: 'world'}\n */\nvar dir = consoleFunc('dir');\n\n/**\n * The post-check version of [`during`]{@link module:ControlFlow.during}. To reflect the difference in\n * the order of operations, the arguments `test` and `fn` are switched.\n *\n * Also a version of [`doWhilst`]{@link module:ControlFlow.doWhilst} with asynchronous `test` function.\n * @name doDuring\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.during]{@link module:ControlFlow.during}\n * @category Control Flow\n * @param {AsyncFunction} fn - An async function which is called each time\n * `test` passes. Invoked with (callback).\n * @param {AsyncFunction} test - asynchronous truth test to perform before each\n * execution of `fn`. Invoked with (...args, callback), where `...args` are the\n * non-error args from the previous callback of `fn`.\n * @param {Function} [callback] - A callback which is called after the test\n * function has failed and repeated execution of `fn` has stopped. `callback`\n * will be passed an error if one occurred, otherwise `null`.\n */\nfunction doDuring(fn, test, callback) {\n    callback = onlyOnce(callback || noop);\n    var _fn = wrapAsync(fn);\n    var _test = wrapAsync(test);\n\n    function next(err/*, ...args*/) {\n        if (err) return callback(err);\n        var args = slice(arguments, 1);\n        args.push(check);\n        _test.apply(this, args);\n    }\n\n    function check(err, truth) {\n        if (err) return callback(err);\n        if (!truth) return callback(null);\n        _fn(next);\n    }\n\n    check(null, true);\n\n}\n\n/**\n * The post-check version of [`whilst`]{@link module:ControlFlow.whilst}. To reflect the difference in\n * the order of operations, the arguments `test` and `iteratee` are switched.\n *\n * `doWhilst` is to `whilst` as `do while` is to `while` in plain JavaScript.\n *\n * @name doWhilst\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.whilst]{@link module:ControlFlow.whilst}\n * @category Control Flow\n * @param {AsyncFunction} iteratee - A function which is called each time `test`\n * passes. Invoked with (callback).\n * @param {Function} test - synchronous truth test to perform after each\n * execution of `iteratee`. Invoked with any non-error callback results of\n * `iteratee`.\n * @param {Function} [callback] - A callback which is called after the test\n * function has failed and repeated execution of `iteratee` has stopped.\n * `callback` will be passed an error and any arguments passed to the final\n * `iteratee`'s callback. Invoked with (err, [results]);\n */\nfunction doWhilst(iteratee, test, callback) {\n    callback = onlyOnce(callback || noop);\n    var _iteratee = wrapAsync(iteratee);\n    var next = function(err/*, ...args*/) {\n        if (err) return callback(err);\n        var args = slice(arguments, 1);\n        if (test.apply(this, args)) return _iteratee(next);\n        callback.apply(null, [null].concat(args));\n    };\n    _iteratee(next);\n}\n\n/**\n * Like ['doWhilst']{@link module:ControlFlow.doWhilst}, except the `test` is inverted. Note the\n * argument ordering differs from `until`.\n *\n * @name doUntil\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.doWhilst]{@link module:ControlFlow.doWhilst}\n * @category Control Flow\n * @param {AsyncFunction} iteratee - An async function which is called each time\n * `test` fails. Invoked with (callback).\n * @param {Function} test - synchronous truth test to perform after each\n * execution of `iteratee`. Invoked with any non-error callback results of\n * `iteratee`.\n * @param {Function} [callback] - A callback which is called after the test\n * function has passed and repeated execution of `iteratee` has stopped. `callback`\n * will be passed an error and any arguments passed to the final `iteratee`'s\n * callback. Invoked with (err, [results]);\n */\nfunction doUntil(iteratee, test, callback) {\n    doWhilst(iteratee, function() {\n        return !test.apply(this, arguments);\n    }, callback);\n}\n\n/**\n * Like [`whilst`]{@link module:ControlFlow.whilst}, except the `test` is an asynchronous function that\n * is passed a callback in the form of `function (err, truth)`. If error is\n * passed to `test` or `fn`, the main callback is immediately called with the\n * value of the error.\n *\n * @name during\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.whilst]{@link module:ControlFlow.whilst}\n * @category Control Flow\n * @param {AsyncFunction} test - asynchronous truth test to perform before each\n * execution of `fn`. Invoked with (callback).\n * @param {AsyncFunction} fn - An async function which is called each time\n * `test` passes. Invoked with (callback).\n * @param {Function} [callback] - A callback which is called after the test\n * function has failed and repeated execution of `fn` has stopped. `callback`\n * will be passed an error, if one occurred, otherwise `null`.\n * @example\n *\n * var count = 0;\n *\n * async.during(\n *     function (callback) {\n *         return callback(null, count < 5);\n *     },\n *     function (callback) {\n *         count++;\n *         setTimeout(callback, 1000);\n *     },\n *     function (err) {\n *         // 5 seconds have passed\n *     }\n * );\n */\nfunction during(test, fn, callback) {\n    callback = onlyOnce(callback || noop);\n    var _fn = wrapAsync(fn);\n    var _test = wrapAsync(test);\n\n    function next(err) {\n        if (err) return callback(err);\n        _test(check);\n    }\n\n    function check(err, truth) {\n        if (err) return callback(err);\n        if (!truth) return callback(null);\n        _fn(next);\n    }\n\n    _test(check);\n}\n\nfunction _withoutIndex(iteratee) {\n    return function (value, index, callback) {\n        return iteratee(value, callback);\n    };\n}\n\n/**\n * Applies the function `iteratee` to each item in `coll`, in parallel.\n * The `iteratee` is called with an item from the list, and a callback for when\n * it has finished. If the `iteratee` passes an error to its `callback`, the\n * main `callback` (for the `each` function) is immediately called with the\n * error.\n *\n * Note, that since this function applies `iteratee` to each item in parallel,\n * there is no guarantee that the iteratee functions will complete in order.\n *\n * @name each\n * @static\n * @memberOf module:Collections\n * @method\n * @alias forEach\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - An async function to apply to\n * each item in `coll`. Invoked with (item, callback).\n * The array index is not passed to the iteratee.\n * If you need the index, use `eachOf`.\n * @param {Function} [callback] - A callback which is called when all\n * `iteratee` functions have finished, or an error occurs. Invoked with (err).\n * @example\n *\n * // assuming openFiles is an array of file names and saveFile is a function\n * // to save the modified contents of that file:\n *\n * async.each(openFiles, saveFile, function(err){\n *   // if any of the saves produced an error, err would equal that error\n * });\n *\n * // assuming openFiles is an array of file names\n * async.each(openFiles, function(file, callback) {\n *\n *     // Perform operation on file here.\n *     console.log('Processing file ' + file);\n *\n *     if( file.length > 32 ) {\n *       console.log('This file name is too long');\n *       callback('File name too long');\n *     } else {\n *       // Do work to process file here\n *       console.log('File processed');\n *       callback();\n *     }\n * }, function(err) {\n *     // if any of the file processing produced an error, err would equal that error\n *     if( err ) {\n *       // One of the iterations produced an error.\n *       // All processing will now stop.\n *       console.log('A file failed to process');\n *     } else {\n *       console.log('All files have been processed successfully');\n *     }\n * });\n */\nfunction eachLimit(coll, iteratee, callback) {\n    eachOf(coll, _withoutIndex(wrapAsync(iteratee)), callback);\n}\n\n/**\n * The same as [`each`]{@link module:Collections.each} but runs a maximum of `limit` async operations at a time.\n *\n * @name eachLimit\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.each]{@link module:Collections.each}\n * @alias forEachLimit\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {AsyncFunction} iteratee - An async function to apply to each item in\n * `coll`.\n * The array index is not passed to the iteratee.\n * If you need the index, use `eachOfLimit`.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called when all\n * `iteratee` functions have finished, or an error occurs. Invoked with (err).\n */\nfunction eachLimit$1(coll, limit, iteratee, callback) {\n    _eachOfLimit(limit)(coll, _withoutIndex(wrapAsync(iteratee)), callback);\n}\n\n/**\n * The same as [`each`]{@link module:Collections.each} but runs only a single async operation at a time.\n *\n * @name eachSeries\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.each]{@link module:Collections.each}\n * @alias forEachSeries\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - An async function to apply to each\n * item in `coll`.\n * The array index is not passed to the iteratee.\n * If you need the index, use `eachOfSeries`.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called when all\n * `iteratee` functions have finished, or an error occurs. Invoked with (err).\n */\nvar eachSeries = doLimit(eachLimit$1, 1);\n\n/**\n * Wrap an async function and ensure it calls its callback on a later tick of\n * the event loop.  If the function already calls its callback on a next tick,\n * no extra deferral is added. This is useful for preventing stack overflows\n * (`RangeError: Maximum call stack size exceeded`) and generally keeping\n * [Zalgo](http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony)\n * contained. ES2017 `async` functions are returned as-is -- they are immune\n * to Zalgo's corrupting influences, as they always resolve on a later tick.\n *\n * @name ensureAsync\n * @static\n * @memberOf module:Utils\n * @method\n * @category Util\n * @param {AsyncFunction} fn - an async function, one that expects a node-style\n * callback as its last argument.\n * @returns {AsyncFunction} Returns a wrapped function with the exact same call\n * signature as the function passed in.\n * @example\n *\n * function sometimesAsync(arg, callback) {\n *     if (cache[arg]) {\n *         return callback(null, cache[arg]); // this would be synchronous!!\n *     } else {\n *         doSomeIO(arg, callback); // this IO would be asynchronous\n *     }\n * }\n *\n * // this has a risk of stack overflows if many results are cached in a row\n * async.mapSeries(args, sometimesAsync, done);\n *\n * // this will defer sometimesAsync's callback if necessary,\n * // preventing stack overflows\n * async.mapSeries(args, async.ensureAsync(sometimesAsync), done);\n */\nfunction ensureAsync(fn) {\n    if (isAsync(fn)) return fn;\n    return initialParams(function (args, callback) {\n        var sync = true;\n        args.push(function () {\n            var innerArgs = arguments;\n            if (sync) {\n                setImmediate$1(function () {\n                    callback.apply(null, innerArgs);\n                });\n            } else {\n                callback.apply(null, innerArgs);\n            }\n        });\n        fn.apply(this, args);\n        sync = false;\n    });\n}\n\nfunction notId(v) {\n    return !v;\n}\n\n/**\n * Returns `true` if every element in `coll` satisfies an async test. If any\n * iteratee call returns `false`, the main `callback` is immediately called.\n *\n * @name every\n * @static\n * @memberOf module:Collections\n * @method\n * @alias all\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - An async truth test to apply to each item\n * in the collection in parallel.\n * The iteratee must complete with a boolean result value.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Result will be either `true` or `false`\n * depending on the values of the async tests. Invoked with (err, result).\n * @example\n *\n * async.every(['file1','file2','file3'], function(filePath, callback) {\n *     fs.access(filePath, function(err) {\n *         callback(null, !err)\n *     });\n * }, function(err, result) {\n *     // if result is true then every file exists\n * });\n */\nvar every = doParallel(_createTester(notId, notId));\n\n/**\n * The same as [`every`]{@link module:Collections.every} but runs a maximum of `limit` async operations at a time.\n *\n * @name everyLimit\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.every]{@link module:Collections.every}\n * @alias allLimit\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {AsyncFunction} iteratee - An async truth test to apply to each item\n * in the collection in parallel.\n * The iteratee must complete with a boolean result value.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Result will be either `true` or `false`\n * depending on the values of the async tests. Invoked with (err, result).\n */\nvar everyLimit = doParallelLimit(_createTester(notId, notId));\n\n/**\n * The same as [`every`]{@link module:Collections.every} but runs only a single async operation at a time.\n *\n * @name everySeries\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.every]{@link module:Collections.every}\n * @alias allSeries\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - An async truth test to apply to each item\n * in the collection in series.\n * The iteratee must complete with a boolean result value.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Result will be either `true` or `false`\n * depending on the values of the async tests. Invoked with (err, result).\n */\nvar everySeries = doLimit(everyLimit, 1);\n\n/**\n * The base implementation of `_.property` without support for deep paths.\n *\n * @private\n * @param {string} key The key of the property to get.\n * @returns {Function} Returns the new accessor function.\n */\nfunction baseProperty(key) {\n  return function(object) {\n    return object == null ? undefined : object[key];\n  };\n}\n\nfunction filterArray(eachfn, arr, iteratee, callback) {\n    var truthValues = new Array(arr.length);\n    eachfn(arr, function (x, index, callback) {\n        iteratee(x, function (err, v) {\n            truthValues[index] = !!v;\n            callback(err);\n        });\n    }, function (err) {\n        if (err) return callback(err);\n        var results = [];\n        for (var i = 0; i < arr.length; i++) {\n            if (truthValues[i]) results.push(arr[i]);\n        }\n        callback(null, results);\n    });\n}\n\nfunction filterGeneric(eachfn, coll, iteratee, callback) {\n    var results = [];\n    eachfn(coll, function (x, index, callback) {\n        iteratee(x, function (err, v) {\n            if (err) {\n                callback(err);\n            } else {\n                if (v) {\n                    results.push({index: index, value: x});\n                }\n                callback();\n            }\n        });\n    }, function (err) {\n        if (err) {\n            callback(err);\n        } else {\n            callback(null, arrayMap(results.sort(function (a, b) {\n                return a.index - b.index;\n            }), baseProperty('value')));\n        }\n    });\n}\n\nfunction _filter(eachfn, coll, iteratee, callback) {\n    var filter = isArrayLike(coll) ? filterArray : filterGeneric;\n    filter(eachfn, coll, wrapAsync(iteratee), callback || noop);\n}\n\n/**\n * Returns a new array of all the values in `coll` which pass an async truth\n * test. This operation is performed in parallel, but the results array will be\n * in the same order as the original.\n *\n * @name filter\n * @static\n * @memberOf module:Collections\n * @method\n * @alias select\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {Function} iteratee - A truth test to apply to each item in `coll`.\n * The `iteratee` is passed a `callback(err, truthValue)`, which must be called\n * with a boolean argument once it has completed. Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Invoked with (err, results).\n * @example\n *\n * async.filter(['file1','file2','file3'], function(filePath, callback) {\n *     fs.access(filePath, function(err) {\n *         callback(null, !err)\n *     });\n * }, function(err, results) {\n *     // results now equals an array of the existing files\n * });\n */\nvar filter = doParallel(_filter);\n\n/**\n * The same as [`filter`]{@link module:Collections.filter} but runs a maximum of `limit` async operations at a\n * time.\n *\n * @name filterLimit\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.filter]{@link module:Collections.filter}\n * @alias selectLimit\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {Function} iteratee - A truth test to apply to each item in `coll`.\n * The `iteratee` is passed a `callback(err, truthValue)`, which must be called\n * with a boolean argument once it has completed. Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Invoked with (err, results).\n */\nvar filterLimit = doParallelLimit(_filter);\n\n/**\n * The same as [`filter`]{@link module:Collections.filter} but runs only a single async operation at a time.\n *\n * @name filterSeries\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.filter]{@link module:Collections.filter}\n * @alias selectSeries\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {Function} iteratee - A truth test to apply to each item in `coll`.\n * The `iteratee` is passed a `callback(err, truthValue)`, which must be called\n * with a boolean argument once it has completed. Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Invoked with (err, results)\n */\nvar filterSeries = doLimit(filterLimit, 1);\n\n/**\n * Calls the asynchronous function `fn` with a callback parameter that allows it\n * to call itself again, in series, indefinitely.\n\n * If an error is passed to the callback then `errback` is called with the\n * error, and execution stops, otherwise it will never be called.\n *\n * @name forever\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @param {AsyncFunction} fn - an async function to call repeatedly.\n * Invoked with (next).\n * @param {Function} [errback] - when `fn` passes an error to it's callback,\n * this function will be called, and execution stops. Invoked with (err).\n * @example\n *\n * async.forever(\n *     function(next) {\n *         // next is suitable for passing to things that need a callback(err [, whatever]);\n *         // it will result in this function being called again.\n *     },\n *     function(err) {\n *         // if next is called with a value in its first parameter, it will appear\n *         // in here as 'err', and execution will stop.\n *     }\n * );\n */\nfunction forever(fn, errback) {\n    var done = onlyOnce(errback || noop);\n    var task = wrapAsync(ensureAsync(fn));\n\n    function next(err) {\n        if (err) return done(err);\n        task(next);\n    }\n    next();\n}\n\n/**\n * The same as [`groupBy`]{@link module:Collections.groupBy} but runs a maximum of `limit` async operations at a time.\n *\n * @name groupByLimit\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.groupBy]{@link module:Collections.groupBy}\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {AsyncFunction} iteratee - An async function to apply to each item in\n * `coll`.\n * The iteratee should complete with a `key` to group the value under.\n * Invoked with (value, callback).\n * @param {Function} [callback] - A callback which is called when all `iteratee`\n * functions have finished, or an error occurs. Result is an `Object` whoses\n * properties are arrays of values which returned the corresponding key.\n */\nvar groupByLimit = function(coll, limit, iteratee, callback) {\n    callback = callback || noop;\n    var _iteratee = wrapAsync(iteratee);\n    mapLimit(coll, limit, function(val, callback) {\n        _iteratee(val, function(err, key) {\n            if (err) return callback(err);\n            return callback(null, {key: key, val: val});\n        });\n    }, function(err, mapResults) {\n        var result = {};\n        // from MDN, handle object having an `hasOwnProperty` prop\n        var hasOwnProperty = Object.prototype.hasOwnProperty;\n\n        for (var i = 0; i < mapResults.length; i++) {\n            if (mapResults[i]) {\n                var key = mapResults[i].key;\n                var val = mapResults[i].val;\n\n                if (hasOwnProperty.call(result, key)) {\n                    result[key].push(val);\n                } else {\n                    result[key] = [val];\n                }\n            }\n        }\n\n        return callback(err, result);\n    });\n};\n\n/**\n * Returns a new object, where each value corresponds to an array of items, from\n * `coll`, that returned the corresponding key. That is, the keys of the object\n * correspond to the values passed to the `iteratee` callback.\n *\n * Note: Since this function applies the `iteratee` to each item in parallel,\n * there is no guarantee that the `iteratee` functions will complete in order.\n * However, the values for each key in the `result` will be in the same order as\n * the original `coll`. For Objects, the values will roughly be in the order of\n * the original Objects' keys (but this can vary across JavaScript engines).\n *\n * @name groupBy\n * @static\n * @memberOf module:Collections\n * @method\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - An async function to apply to each item in\n * `coll`.\n * The iteratee should complete with a `key` to group the value under.\n * Invoked with (value, callback).\n * @param {Function} [callback] - A callback which is called when all `iteratee`\n * functions have finished, or an error occurs. Result is an `Object` whoses\n * properties are arrays of values which returned the corresponding key.\n * @example\n *\n * async.groupBy(['userId1', 'userId2', 'userId3'], function(userId, callback) {\n *     db.findById(userId, function(err, user) {\n *         if (err) return callback(err);\n *         return callback(null, user.age);\n *     });\n * }, function(err, result) {\n *     // result is object containing the userIds grouped by age\n *     // e.g. { 30: ['userId1', 'userId3'], 42: ['userId2']};\n * });\n */\nvar groupBy = doLimit(groupByLimit, Infinity);\n\n/**\n * The same as [`groupBy`]{@link module:Collections.groupBy} but runs only a single async operation at a time.\n *\n * @name groupBySeries\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.groupBy]{@link module:Collections.groupBy}\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {AsyncFunction} iteratee - An async function to apply to each item in\n * `coll`.\n * The iteratee should complete with a `key` to group the value under.\n * Invoked with (value, callback).\n * @param {Function} [callback] - A callback which is called when all `iteratee`\n * functions have finished, or an error occurs. Result is an `Object` whoses\n * properties are arrays of values which returned the corresponding key.\n */\nvar groupBySeries = doLimit(groupByLimit, 1);\n\n/**\n * Logs the result of an `async` function to the `console`. Only works in\n * Node.js or in browsers that support `console.log` and `console.error` (such\n * as FF and Chrome). If multiple arguments are returned from the async\n * function, `console.log` is called on each argument in order.\n *\n * @name log\n * @static\n * @memberOf module:Utils\n * @method\n * @category Util\n * @param {AsyncFunction} function - The function you want to eventually apply\n * all arguments to.\n * @param {...*} arguments... - Any number of arguments to apply to the function.\n * @example\n *\n * // in a module\n * var hello = function(name, callback) {\n *     setTimeout(function() {\n *         callback(null, 'hello ' + name);\n *     }, 1000);\n * };\n *\n * // in the node repl\n * node> async.log(hello, 'world');\n * 'hello world'\n */\nvar log = consoleFunc('log');\n\n/**\n * The same as [`mapValues`]{@link module:Collections.mapValues} but runs a maximum of `limit` async operations at a\n * time.\n *\n * @name mapValuesLimit\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.mapValues]{@link module:Collections.mapValues}\n * @category Collection\n * @param {Object} obj - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {AsyncFunction} iteratee - A function to apply to each value and key\n * in `coll`.\n * The iteratee should complete with the transformed value as its result.\n * Invoked with (value, key, callback).\n * @param {Function} [callback] - A callback which is called when all `iteratee`\n * functions have finished, or an error occurs. `result` is a new object consisting\n * of each key from `obj`, with each transformed value on the right-hand side.\n * Invoked with (err, result).\n */\nfunction mapValuesLimit(obj, limit, iteratee, callback) {\n    callback = once(callback || noop);\n    var newObj = {};\n    var _iteratee = wrapAsync(iteratee);\n    eachOfLimit(obj, limit, function(val, key, next) {\n        _iteratee(val, key, function (err, result) {\n            if (err) return next(err);\n            newObj[key] = result;\n            next();\n        });\n    }, function (err) {\n        callback(err, newObj);\n    });\n}\n\n/**\n * A relative of [`map`]{@link module:Collections.map}, designed for use with objects.\n *\n * Produces a new Object by mapping each value of `obj` through the `iteratee`\n * function. The `iteratee` is called each `value` and `key` from `obj` and a\n * callback for when it has finished processing. Each of these callbacks takes\n * two arguments: an `error`, and the transformed item from `obj`. If `iteratee`\n * passes an error to its callback, the main `callback` (for the `mapValues`\n * function) is immediately called with the error.\n *\n * Note, the order of the keys in the result is not guaranteed.  The keys will\n * be roughly in the order they complete, (but this is very engine-specific)\n *\n * @name mapValues\n * @static\n * @memberOf module:Collections\n * @method\n * @category Collection\n * @param {Object} obj - A collection to iterate over.\n * @param {AsyncFunction} iteratee - A function to apply to each value and key\n * in `coll`.\n * The iteratee should complete with the transformed value as its result.\n * Invoked with (value, key, callback).\n * @param {Function} [callback] - A callback which is called when all `iteratee`\n * functions have finished, or an error occurs. `result` is a new object consisting\n * of each key from `obj`, with each transformed value on the right-hand side.\n * Invoked with (err, result).\n * @example\n *\n * async.mapValues({\n *     f1: 'file1',\n *     f2: 'file2',\n *     f3: 'file3'\n * }, function (file, key, callback) {\n *   fs.stat(file, callback);\n * }, function(err, result) {\n *     // result is now a map of stats for each file, e.g.\n *     // {\n *     //     f1: [stats for file1],\n *     //     f2: [stats for file2],\n *     //     f3: [stats for file3]\n *     // }\n * });\n */\n\nvar mapValues = doLimit(mapValuesLimit, Infinity);\n\n/**\n * The same as [`mapValues`]{@link module:Collections.mapValues} but runs only a single async operation at a time.\n *\n * @name mapValuesSeries\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.mapValues]{@link module:Collections.mapValues}\n * @category Collection\n * @param {Object} obj - A collection to iterate over.\n * @param {AsyncFunction} iteratee - A function to apply to each value and key\n * in `coll`.\n * The iteratee should complete with the transformed value as its result.\n * Invoked with (value, key, callback).\n * @param {Function} [callback] - A callback which is called when all `iteratee`\n * functions have finished, or an error occurs. `result` is a new object consisting\n * of each key from `obj`, with each transformed value on the right-hand side.\n * Invoked with (err, result).\n */\nvar mapValuesSeries = doLimit(mapValuesLimit, 1);\n\nfunction has(obj, key) {\n    return key in obj;\n}\n\n/**\n * Caches the results of an async function. When creating a hash to store\n * function results against, the callback is omitted from the hash and an\n * optional hash function can be used.\n *\n * If no hash function is specified, the first argument is used as a hash key,\n * which may work reasonably if it is a string or a data type that converts to a\n * distinct string. Note that objects and arrays will not behave reasonably.\n * Neither will cases where the other arguments are significant. In such cases,\n * specify your own hash function.\n *\n * The cache of results is exposed as the `memo` property of the function\n * returned by `memoize`.\n *\n * @name memoize\n * @static\n * @memberOf module:Utils\n * @method\n * @category Util\n * @param {AsyncFunction} fn - The async function to proxy and cache results from.\n * @param {Function} hasher - An optional function for generating a custom hash\n * for storing results. It has all the arguments applied to it apart from the\n * callback, and must be synchronous.\n * @returns {AsyncFunction} a memoized version of `fn`\n * @example\n *\n * var slow_fn = function(name, callback) {\n *     // do something\n *     callback(null, result);\n * };\n * var fn = async.memoize(slow_fn);\n *\n * // fn can now be used as if it were slow_fn\n * fn('some name', function() {\n *     // callback\n * });\n */\nfunction memoize(fn, hasher) {\n    var memo = Object.create(null);\n    var queues = Object.create(null);\n    hasher = hasher || identity;\n    var _fn = wrapAsync(fn);\n    var memoized = initialParams(function memoized(args, callback) {\n        var key = hasher.apply(null, args);\n        if (has(memo, key)) {\n            setImmediate$1(function() {\n                callback.apply(null, memo[key]);\n            });\n        } else if (has(queues, key)) {\n            queues[key].push(callback);\n        } else {\n            queues[key] = [callback];\n            _fn.apply(null, args.concat(function(/*args*/) {\n                var args = slice(arguments);\n                memo[key] = args;\n                var q = queues[key];\n                delete queues[key];\n                for (var i = 0, l = q.length; i < l; i++) {\n                    q[i].apply(null, args);\n                }\n            }));\n        }\n    });\n    memoized.memo = memo;\n    memoized.unmemoized = fn;\n    return memoized;\n}\n\n/**\n * Calls `callback` on a later loop around the event loop. In Node.js this just\n * calls `process.nextTicl`.  In the browser it will use `setImmediate` if\n * available, otherwise `setTimeout(callback, 0)`, which means other higher\n * priority events may precede the execution of `callback`.\n *\n * This is used internally for browser-compatibility purposes.\n *\n * @name nextTick\n * @static\n * @memberOf module:Utils\n * @method\n * @see [async.setImmediate]{@link module:Utils.setImmediate}\n * @category Util\n * @param {Function} callback - The function to call on a later loop around\n * the event loop. Invoked with (args...).\n * @param {...*} args... - any number of additional arguments to pass to the\n * callback on the next tick.\n * @example\n *\n * var call_order = [];\n * async.nextTick(function() {\n *     call_order.push('two');\n *     // call_order now equals ['one','two']\n * });\n * call_order.push('one');\n *\n * async.setImmediate(function (a, b, c) {\n *     // a, b, and c equal 1, 2, and 3\n * }, 1, 2, 3);\n */\nvar _defer$1;\n\nif (hasNextTick) {\n    _defer$1 = process.nextTick;\n} else if (hasSetImmediate) {\n    _defer$1 = setImmediate;\n} else {\n    _defer$1 = fallback;\n}\n\nvar nextTick = wrap(_defer$1);\n\nfunction _parallel(eachfn, tasks, callback) {\n    callback = callback || noop;\n    var results = isArrayLike(tasks) ? [] : {};\n\n    eachfn(tasks, function (task, key, callback) {\n        wrapAsync(task)(function (err, result) {\n            if (arguments.length > 2) {\n                result = slice(arguments, 1);\n            }\n            results[key] = result;\n            callback(err);\n        });\n    }, function (err) {\n        callback(err, results);\n    });\n}\n\n/**\n * Run the `tasks` collection of functions in parallel, without waiting until\n * the previous function has completed. If any of the functions pass an error to\n * its callback, the main `callback` is immediately called with the value of the\n * error. Once the `tasks` have completed, the results are passed to the final\n * `callback` as an array.\n *\n * **Note:** `parallel` is about kicking-off I/O tasks in parallel, not about\n * parallel execution of code.  If your tasks do not use any timers or perform\n * any I/O, they will actually be executed in series.  Any synchronous setup\n * sections for each task will happen one after the other.  JavaScript remains\n * single-threaded.\n *\n * **Hint:** Use [`reflect`]{@link module:Utils.reflect} to continue the\n * execution of other tasks when a task fails.\n *\n * It is also possible to use an object instead of an array. Each property will\n * be run as a function and the results will be passed to the final `callback`\n * as an object instead of an array. This can be a more readable way of handling\n * results from {@link async.parallel}.\n *\n * @name parallel\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @param {Array|Iterable|Object} tasks - A collection of\n * [async functions]{@link AsyncFunction} to run.\n * Each async function can complete with any number of optional `result` values.\n * @param {Function} [callback] - An optional callback to run once all the\n * functions have completed successfully. This function gets a results array\n * (or object) containing all the result arguments passed to the task callbacks.\n * Invoked with (err, results).\n *\n * @example\n * async.parallel([\n *     function(callback) {\n *         setTimeout(function() {\n *             callback(null, 'one');\n *         }, 200);\n *     },\n *     function(callback) {\n *         setTimeout(function() {\n *             callback(null, 'two');\n *         }, 100);\n *     }\n * ],\n * // optional callback\n * function(err, results) {\n *     // the results array will equal ['one','two'] even though\n *     // the second function had a shorter timeout.\n * });\n *\n * // an example using an object instead of an array\n * async.parallel({\n *     one: function(callback) {\n *         setTimeout(function() {\n *             callback(null, 1);\n *         }, 200);\n *     },\n *     two: function(callback) {\n *         setTimeout(function() {\n *             callback(null, 2);\n *         }, 100);\n *     }\n * }, function(err, results) {\n *     // results is now equals to: {one: 1, two: 2}\n * });\n */\nfunction parallelLimit(tasks, callback) {\n    _parallel(eachOf, tasks, callback);\n}\n\n/**\n * The same as [`parallel`]{@link module:ControlFlow.parallel} but runs a maximum of `limit` async operations at a\n * time.\n *\n * @name parallelLimit\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.parallel]{@link module:ControlFlow.parallel}\n * @category Control Flow\n * @param {Array|Iterable|Object} tasks - A collection of\n * [async functions]{@link AsyncFunction} to run.\n * Each async function can complete with any number of optional `result` values.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {Function} [callback] - An optional callback to run once all the\n * functions have completed successfully. This function gets a results array\n * (or object) containing all the result arguments passed to the task callbacks.\n * Invoked with (err, results).\n */\nfunction parallelLimit$1(tasks, limit, callback) {\n    _parallel(_eachOfLimit(limit), tasks, callback);\n}\n\n/**\n * A queue of tasks for the worker function to complete.\n * @typedef {Object} QueueObject\n * @memberOf module:ControlFlow\n * @property {Function} length - a function returning the number of items\n * waiting to be processed. Invoke with `queue.length()`.\n * @property {boolean} started - a boolean indicating whether or not any\n * items have been pushed and processed by the queue.\n * @property {Function} running - a function returning the number of items\n * currently being processed. Invoke with `queue.running()`.\n * @property {Function} workersList - a function returning the array of items\n * currently being processed. Invoke with `queue.workersList()`.\n * @property {Function} idle - a function returning false if there are items\n * waiting or being processed, or true if not. Invoke with `queue.idle()`.\n * @property {number} concurrency - an integer for determining how many `worker`\n * functions should be run in parallel. This property can be changed after a\n * `queue` is created to alter the concurrency on-the-fly.\n * @property {Function} push - add a new task to the `queue`. Calls `callback`\n * once the `worker` has finished processing the task. Instead of a single task,\n * a `tasks` array can be submitted. The respective callback is used for every\n * task in the list. Invoke with `queue.push(task, [callback])`,\n * @property {Function} unshift - add a new task to the front of the `queue`.\n * Invoke with `queue.unshift(task, [callback])`.\n * @property {Function} remove - remove items from the queue that match a test\n * function.  The test function will be passed an object with a `data` property,\n * and a `priority` property, if this is a\n * [priorityQueue]{@link module:ControlFlow.priorityQueue} object.\n * Invoked with `queue.remove(testFn)`, where `testFn` is of the form\n * `function ({data, priority}) {}` and returns a Boolean.\n * @property {Function} saturated - a callback that is called when the number of\n * running workers hits the `concurrency` limit, and further tasks will be\n * queued.\n * @property {Function} unsaturated - a callback that is called when the number\n * of running workers is less than the `concurrency` & `buffer` limits, and\n * further tasks will not be queued.\n * @property {number} buffer - A minimum threshold buffer in order to say that\n * the `queue` is `unsaturated`.\n * @property {Function} empty - a callback that is called when the last item\n * from the `queue` is given to a `worker`.\n * @property {Function} drain - a callback that is called when the last item\n * from the `queue` has returned from the `worker`.\n * @property {Function} error - a callback that is called when a task errors.\n * Has the signature `function(error, task)`.\n * @property {boolean} paused - a boolean for determining whether the queue is\n * in a paused state.\n * @property {Function} pause - a function that pauses the processing of tasks\n * until `resume()` is called. Invoke with `queue.pause()`.\n * @property {Function} resume - a function that resumes the processing of\n * queued tasks when the queue is paused. Invoke with `queue.resume()`.\n * @property {Function} kill - a function that removes the `drain` callback and\n * empties remaining tasks from the queue forcing it to go idle. No more tasks\n * should be pushed to the queue after calling this function. Invoke with `queue.kill()`.\n */\n\n/**\n * Creates a `queue` object with the specified `concurrency`. Tasks added to the\n * `queue` are processed in parallel (up to the `concurrency` limit). If all\n * `worker`s are in progress, the task is queued until one becomes available.\n * Once a `worker` completes a `task`, that `task`'s callback is called.\n *\n * @name queue\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @param {AsyncFunction} worker - An async function for processing a queued task.\n * If you want to handle errors from an individual task, pass a callback to\n * `q.push()`. Invoked with (task, callback).\n * @param {number} [concurrency=1] - An `integer` for determining how many\n * `worker` functions should be run in parallel.  If omitted, the concurrency\n * defaults to `1`.  If the concurrency is `0`, an error is thrown.\n * @returns {module:ControlFlow.QueueObject} A queue object to manage the tasks. Callbacks can\n * attached as certain properties to listen for specific events during the\n * lifecycle of the queue.\n * @example\n *\n * // create a queue object with concurrency 2\n * var q = async.queue(function(task, callback) {\n *     console.log('hello ' + task.name);\n *     callback();\n * }, 2);\n *\n * // assign a callback\n * q.drain = function() {\n *     console.log('all items have been processed');\n * };\n *\n * // add some items to the queue\n * q.push({name: 'foo'}, function(err) {\n *     console.log('finished processing foo');\n * });\n * q.push({name: 'bar'}, function (err) {\n *     console.log('finished processing bar');\n * });\n *\n * // add some items to the queue (batch-wise)\n * q.push([{name: 'baz'},{name: 'bay'},{name: 'bax'}], function(err) {\n *     console.log('finished processing item');\n * });\n *\n * // add some items to the front of the queue\n * q.unshift({name: 'bar'}, function (err) {\n *     console.log('finished processing bar');\n * });\n */\nvar queue$1 = function (worker, concurrency) {\n    var _worker = wrapAsync(worker);\n    return queue(function (items, cb) {\n        _worker(items[0], cb);\n    }, concurrency, 1);\n};\n\n/**\n * The same as [async.queue]{@link module:ControlFlow.queue} only tasks are assigned a priority and\n * completed in ascending priority order.\n *\n * @name priorityQueue\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.queue]{@link module:ControlFlow.queue}\n * @category Control Flow\n * @param {AsyncFunction} worker - An async function for processing a queued task.\n * If you want to handle errors from an individual task, pass a callback to\n * `q.push()`.\n * Invoked with (task, callback).\n * @param {number} concurrency - An `integer` for determining how many `worker`\n * functions should be run in parallel.  If omitted, the concurrency defaults to\n * `1`.  If the concurrency is `0`, an error is thrown.\n * @returns {module:ControlFlow.QueueObject} A priorityQueue object to manage the tasks. There are two\n * differences between `queue` and `priorityQueue` objects:\n * * `push(task, priority, [callback])` - `priority` should be a number. If an\n *   array of `tasks` is given, all tasks will be assigned the same priority.\n * * The `unshift` method was removed.\n */\nvar priorityQueue = function(worker, concurrency) {\n    // Start with a normal queue\n    var q = queue$1(worker, concurrency);\n\n    // Override push to accept second parameter representing priority\n    q.push = function(data, priority, callback) {\n        if (callback == null) callback = noop;\n        if (typeof callback !== 'function') {\n            throw new Error('task callback must be a function');\n        }\n        q.started = true;\n        if (!isArray(data)) {\n            data = [data];\n        }\n        if (data.length === 0) {\n            // call drain immediately if there are no tasks\n            return setImmediate$1(function() {\n                q.drain();\n            });\n        }\n\n        priority = priority || 0;\n        var nextNode = q._tasks.head;\n        while (nextNode && priority >= nextNode.priority) {\n            nextNode = nextNode.next;\n        }\n\n        for (var i = 0, l = data.length; i < l; i++) {\n            var item = {\n                data: data[i],\n                priority: priority,\n                callback: callback\n            };\n\n            if (nextNode) {\n                q._tasks.insertBefore(nextNode, item);\n            } else {\n                q._tasks.push(item);\n            }\n        }\n        setImmediate$1(q.process);\n    };\n\n    // Remove unshift function\n    delete q.unshift;\n\n    return q;\n};\n\n/**\n * Runs the `tasks` array of functions in parallel, without waiting until the\n * previous function has completed. Once any of the `tasks` complete or pass an\n * error to its callback, the main `callback` is immediately called. It's\n * equivalent to `Promise.race()`.\n *\n * @name race\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @param {Array} tasks - An array containing [async functions]{@link AsyncFunction}\n * to run. Each function can complete with an optional `result` value.\n * @param {Function} callback - A callback to run once any of the functions have\n * completed. This function gets an error or result from the first function that\n * completed. Invoked with (err, result).\n * @returns undefined\n * @example\n *\n * async.race([\n *     function(callback) {\n *         setTimeout(function() {\n *             callback(null, 'one');\n *         }, 200);\n *     },\n *     function(callback) {\n *         setTimeout(function() {\n *             callback(null, 'two');\n *         }, 100);\n *     }\n * ],\n * // main callback\n * function(err, result) {\n *     // the result will be equal to 'two' as it finishes earlier\n * });\n */\nfunction race(tasks, callback) {\n    callback = once(callback || noop);\n    if (!isArray(tasks)) return callback(new TypeError('First argument to race must be an array of functions'));\n    if (!tasks.length) return callback();\n    for (var i = 0, l = tasks.length; i < l; i++) {\n        wrapAsync(tasks[i])(callback);\n    }\n}\n\n/**\n * Same as [`reduce`]{@link module:Collections.reduce}, only operates on `array` in reverse order.\n *\n * @name reduceRight\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.reduce]{@link module:Collections.reduce}\n * @alias foldr\n * @category Collection\n * @param {Array} array - A collection to iterate over.\n * @param {*} memo - The initial state of the reduction.\n * @param {AsyncFunction} iteratee - A function applied to each item in the\n * array to produce the next step in the reduction.\n * The `iteratee` should complete with the next state of the reduction.\n * If the iteratee complete with an error, the reduction is stopped and the\n * main `callback` is immediately called with the error.\n * Invoked with (memo, item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Result is the reduced value. Invoked with\n * (err, result).\n */\nfunction reduceRight (array, memo, iteratee, callback) {\n    var reversed = slice(array).reverse();\n    reduce(reversed, memo, iteratee, callback);\n}\n\n/**\n * Wraps the async function in another function that always completes with a\n * result object, even when it errors.\n *\n * The result object has either the property `error` or `value`.\n *\n * @name reflect\n * @static\n * @memberOf module:Utils\n * @method\n * @category Util\n * @param {AsyncFunction} fn - The async function you want to wrap\n * @returns {Function} - A function that always passes null to it's callback as\n * the error. The second argument to the callback will be an `object` with\n * either an `error` or a `value` property.\n * @example\n *\n * async.parallel([\n *     async.reflect(function(callback) {\n *         // do some stuff ...\n *         callback(null, 'one');\n *     }),\n *     async.reflect(function(callback) {\n *         // do some more stuff but error ...\n *         callback('bad stuff happened');\n *     }),\n *     async.reflect(function(callback) {\n *         // do some more stuff ...\n *         callback(null, 'two');\n *     })\n * ],\n * // optional callback\n * function(err, results) {\n *     // values\n *     // results[0].value = 'one'\n *     // results[1].error = 'bad stuff happened'\n *     // results[2].value = 'two'\n * });\n */\nfunction reflect(fn) {\n    var _fn = wrapAsync(fn);\n    return initialParams(function reflectOn(args, reflectCallback) {\n        args.push(function callback(error, cbArg) {\n            if (error) {\n                reflectCallback(null, { error: error });\n            } else {\n                var value;\n                if (arguments.length <= 2) {\n                    value = cbArg;\n                } else {\n                    value = slice(arguments, 1);\n                }\n                reflectCallback(null, { value: value });\n            }\n        });\n\n        return _fn.apply(this, args);\n    });\n}\n\n/**\n * A helper function that wraps an array or an object of functions with `reflect`.\n *\n * @name reflectAll\n * @static\n * @memberOf module:Utils\n * @method\n * @see [async.reflect]{@link module:Utils.reflect}\n * @category Util\n * @param {Array|Object|Iterable} tasks - The collection of\n * [async functions]{@link AsyncFunction} to wrap in `async.reflect`.\n * @returns {Array} Returns an array of async functions, each wrapped in\n * `async.reflect`\n * @example\n *\n * let tasks = [\n *     function(callback) {\n *         setTimeout(function() {\n *             callback(null, 'one');\n *         }, 200);\n *     },\n *     function(callback) {\n *         // do some more stuff but error ...\n *         callback(new Error('bad stuff happened'));\n *     },\n *     function(callback) {\n *         setTimeout(function() {\n *             callback(null, 'two');\n *         }, 100);\n *     }\n * ];\n *\n * async.parallel(async.reflectAll(tasks),\n * // optional callback\n * function(err, results) {\n *     // values\n *     // results[0].value = 'one'\n *     // results[1].error = Error('bad stuff happened')\n *     // results[2].value = 'two'\n * });\n *\n * // an example using an object instead of an array\n * let tasks = {\n *     one: function(callback) {\n *         setTimeout(function() {\n *             callback(null, 'one');\n *         }, 200);\n *     },\n *     two: function(callback) {\n *         callback('two');\n *     },\n *     three: function(callback) {\n *         setTimeout(function() {\n *             callback(null, 'three');\n *         }, 100);\n *     }\n * };\n *\n * async.parallel(async.reflectAll(tasks),\n * // optional callback\n * function(err, results) {\n *     // values\n *     // results.one.value = 'one'\n *     // results.two.error = 'two'\n *     // results.three.value = 'three'\n * });\n */\nfunction reflectAll(tasks) {\n    var results;\n    if (isArray(tasks)) {\n        results = arrayMap(tasks, reflect);\n    } else {\n        results = {};\n        baseForOwn(tasks, function(task, key) {\n            results[key] = reflect.call(this, task);\n        });\n    }\n    return results;\n}\n\nfunction reject$1(eachfn, arr, iteratee, callback) {\n    _filter(eachfn, arr, function(value, cb) {\n        iteratee(value, function(err, v) {\n            cb(err, !v);\n        });\n    }, callback);\n}\n\n/**\n * The opposite of [`filter`]{@link module:Collections.filter}. Removes values that pass an `async` truth test.\n *\n * @name reject\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.filter]{@link module:Collections.filter}\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {Function} iteratee - An async truth test to apply to each item in\n * `coll`.\n * The should complete with a boolean value as its `result`.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Invoked with (err, results).\n * @example\n *\n * async.reject(['file1','file2','file3'], function(filePath, callback) {\n *     fs.access(filePath, function(err) {\n *         callback(null, !err)\n *     });\n * }, function(err, results) {\n *     // results now equals an array of missing files\n *     createFiles(results);\n * });\n */\nvar reject = doParallel(reject$1);\n\n/**\n * The same as [`reject`]{@link module:Collections.reject} but runs a maximum of `limit` async operations at a\n * time.\n *\n * @name rejectLimit\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.reject]{@link module:Collections.reject}\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {Function} iteratee - An async truth test to apply to each item in\n * `coll`.\n * The should complete with a boolean value as its `result`.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Invoked with (err, results).\n */\nvar rejectLimit = doParallelLimit(reject$1);\n\n/**\n * The same as [`reject`]{@link module:Collections.reject} but runs only a single async operation at a time.\n *\n * @name rejectSeries\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.reject]{@link module:Collections.reject}\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {Function} iteratee - An async truth test to apply to each item in\n * `coll`.\n * The should complete with a boolean value as its `result`.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Invoked with (err, results).\n */\nvar rejectSeries = doLimit(rejectLimit, 1);\n\n/**\n * Creates a function that returns `value`.\n *\n * @static\n * @memberOf _\n * @since 2.4.0\n * @category Util\n * @param {*} value The value to return from the new function.\n * @returns {Function} Returns the new constant function.\n * @example\n *\n * var objects = _.times(2, _.constant({ 'a': 1 }));\n *\n * console.log(objects);\n * // => [{ 'a': 1 }, { 'a': 1 }]\n *\n * console.log(objects[0] === objects[1]);\n * // => true\n */\nfunction constant$1(value) {\n  return function() {\n    return value;\n  };\n}\n\n/**\n * Attempts to get a successful response from `task` no more than `times` times\n * before returning an error. If the task is successful, the `callback` will be\n * passed the result of the successful task. If all attempts fail, the callback\n * will be passed the error and result (if any) of the final attempt.\n *\n * @name retry\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @see [async.retryable]{@link module:ControlFlow.retryable}\n * @param {Object|number} [opts = {times: 5, interval: 0}| 5] - Can be either an\n * object with `times` and `interval` or a number.\n * * `times` - The number of attempts to make before giving up.  The default\n *   is `5`.\n * * `interval` - The time to wait between retries, in milliseconds.  The\n *   default is `0`. The interval may also be specified as a function of the\n *   retry count (see example).\n * * `errorFilter` - An optional synchronous function that is invoked on\n *   erroneous result. If it returns `true` the retry attempts will continue;\n *   if the function returns `false` the retry flow is aborted with the current\n *   attempt's error and result being returned to the final callback.\n *   Invoked with (err).\n * * If `opts` is a number, the number specifies the number of times to retry,\n *   with the default interval of `0`.\n * @param {AsyncFunction} task - An async function to retry.\n * Invoked with (callback).\n * @param {Function} [callback] - An optional callback which is called when the\n * task has succeeded, or after the final failed attempt. It receives the `err`\n * and `result` arguments of the last attempt at completing the `task`. Invoked\n * with (err, results).\n *\n * @example\n *\n * // The `retry` function can be used as a stand-alone control flow by passing\n * // a callback, as shown below:\n *\n * // try calling apiMethod 3 times\n * async.retry(3, apiMethod, function(err, result) {\n *     // do something with the result\n * });\n *\n * // try calling apiMethod 3 times, waiting 200 ms between each retry\n * async.retry({times: 3, interval: 200}, apiMethod, function(err, result) {\n *     // do something with the result\n * });\n *\n * // try calling apiMethod 10 times with exponential backoff\n * // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)\n * async.retry({\n *   times: 10,\n *   interval: function(retryCount) {\n *     return 50 * Math.pow(2, retryCount);\n *   }\n * }, apiMethod, function(err, result) {\n *     // do something with the result\n * });\n *\n * // try calling apiMethod the default 5 times no delay between each retry\n * async.retry(apiMethod, function(err, result) {\n *     // do something with the result\n * });\n *\n * // try calling apiMethod only when error condition satisfies, all other\n * // errors will abort the retry control flow and return to final callback\n * async.retry({\n *   errorFilter: function(err) {\n *     return err.message === 'Temporary error'; // only retry on a specific error\n *   }\n * }, apiMethod, function(err, result) {\n *     // do something with the result\n * });\n *\n * // to retry individual methods that are not as reliable within other\n * // control flow functions, use the `retryable` wrapper:\n * async.auto({\n *     users: api.getUsers.bind(api),\n *     payments: async.retryable(3, api.getPayments.bind(api))\n * }, function(err, results) {\n *     // do something with the results\n * });\n *\n */\nfunction retry(opts, task, callback) {\n    var DEFAULT_TIMES = 5;\n    var DEFAULT_INTERVAL = 0;\n\n    var options = {\n        times: DEFAULT_TIMES,\n        intervalFunc: constant$1(DEFAULT_INTERVAL)\n    };\n\n    function parseTimes(acc, t) {\n        if (typeof t === 'object') {\n            acc.times = +t.times || DEFAULT_TIMES;\n\n            acc.intervalFunc = typeof t.interval === 'function' ?\n                t.interval :\n                constant$1(+t.interval || DEFAULT_INTERVAL);\n\n            acc.errorFilter = t.errorFilter;\n        } else if (typeof t === 'number' || typeof t === 'string') {\n            acc.times = +t || DEFAULT_TIMES;\n        } else {\n            throw new Error(\"Invalid arguments for async.retry\");\n        }\n    }\n\n    if (arguments.length < 3 && typeof opts === 'function') {\n        callback = task || noop;\n        task = opts;\n    } else {\n        parseTimes(options, opts);\n        callback = callback || noop;\n    }\n\n    if (typeof task !== 'function') {\n        throw new Error(\"Invalid arguments for async.retry\");\n    }\n\n    var _task = wrapAsync(task);\n\n    var attempt = 1;\n    function retryAttempt() {\n        _task(function(err) {\n            if (err && attempt++ < options.times &&\n                (typeof options.errorFilter != 'function' ||\n                    options.errorFilter(err))) {\n                setTimeout(retryAttempt, options.intervalFunc(attempt));\n            } else {\n                callback.apply(null, arguments);\n            }\n        });\n    }\n\n    retryAttempt();\n}\n\n/**\n * A close relative of [`retry`]{@link module:ControlFlow.retry}.  This method\n * wraps a task and makes it retryable, rather than immediately calling it\n * with retries.\n *\n * @name retryable\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.retry]{@link module:ControlFlow.retry}\n * @category Control Flow\n * @param {Object|number} [opts = {times: 5, interval: 0}| 5] - optional\n * options, exactly the same as from `retry`\n * @param {AsyncFunction} task - the asynchronous function to wrap.\n * This function will be passed any arguments passed to the returned wrapper.\n * Invoked with (...args, callback).\n * @returns {AsyncFunction} The wrapped function, which when invoked, will\n * retry on an error, based on the parameters specified in `opts`.\n * This function will accept the same parameters as `task`.\n * @example\n *\n * async.auto({\n *     dep1: async.retryable(3, getFromFlakyService),\n *     process: [\"dep1\", async.retryable(3, function (results, cb) {\n *         maybeProcessData(results.dep1, cb);\n *     })]\n * }, callback);\n */\nvar retryable = function (opts, task) {\n    if (!task) {\n        task = opts;\n        opts = null;\n    }\n    var _task = wrapAsync(task);\n    return initialParams(function (args, callback) {\n        function taskFn(cb) {\n            _task.apply(null, args.concat(cb));\n        }\n\n        if (opts) retry(opts, taskFn, callback);\n        else retry(taskFn, callback);\n\n    });\n};\n\n/**\n * Run the functions in the `tasks` collection in series, each one running once\n * the previous function has completed. If any functions in the series pass an\n * error to its callback, no more functions are run, and `callback` is\n * immediately called with the value of the error. Otherwise, `callback`\n * receives an array of results when `tasks` have completed.\n *\n * It is also possible to use an object instead of an array. Each property will\n * be run as a function, and the results will be passed to the final `callback`\n * as an object instead of an array. This can be a more readable way of handling\n *  results from {@link async.series}.\n *\n * **Note** that while many implementations preserve the order of object\n * properties, the [ECMAScript Language Specification](http://www.ecma-international.org/ecma-262/5.1/#sec-8.6)\n * explicitly states that\n *\n * > The mechanics and order of enumerating the properties is not specified.\n *\n * So if you rely on the order in which your series of functions are executed,\n * and want this to work on all platforms, consider using an array.\n *\n * @name series\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @param {Array|Iterable|Object} tasks - A collection containing\n * [async functions]{@link AsyncFunction} to run in series.\n * Each function can complete with any number of optional `result` values.\n * @param {Function} [callback] - An optional callback to run once all the\n * functions have completed. This function gets a results array (or object)\n * containing all the result arguments passed to the `task` callbacks. Invoked\n * with (err, result).\n * @example\n * async.series([\n *     function(callback) {\n *         // do some stuff ...\n *         callback(null, 'one');\n *     },\n *     function(callback) {\n *         // do some more stuff ...\n *         callback(null, 'two');\n *     }\n * ],\n * // optional callback\n * function(err, results) {\n *     // results is now equal to ['one', 'two']\n * });\n *\n * async.series({\n *     one: function(callback) {\n *         setTimeout(function() {\n *             callback(null, 1);\n *         }, 200);\n *     },\n *     two: function(callback){\n *         setTimeout(function() {\n *             callback(null, 2);\n *         }, 100);\n *     }\n * }, function(err, results) {\n *     // results is now equal to: {one: 1, two: 2}\n * });\n */\nfunction series(tasks, callback) {\n    _parallel(eachOfSeries, tasks, callback);\n}\n\n/**\n * Returns `true` if at least one element in the `coll` satisfies an async test.\n * If any iteratee call returns `true`, the main `callback` is immediately\n * called.\n *\n * @name some\n * @static\n * @memberOf module:Collections\n * @method\n * @alias any\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - An async truth test to apply to each item\n * in the collections in parallel.\n * The iteratee should complete with a boolean `result` value.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called as soon as any\n * iteratee returns `true`, or after all the iteratee functions have finished.\n * Result will be either `true` or `false` depending on the values of the async\n * tests. Invoked with (err, result).\n * @example\n *\n * async.some(['file1','file2','file3'], function(filePath, callback) {\n *     fs.access(filePath, function(err) {\n *         callback(null, !err)\n *     });\n * }, function(err, result) {\n *     // if result is true then at least one of the files exists\n * });\n */\nvar some = doParallel(_createTester(Boolean, identity));\n\n/**\n * The same as [`some`]{@link module:Collections.some} but runs a maximum of `limit` async operations at a time.\n *\n * @name someLimit\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.some]{@link module:Collections.some}\n * @alias anyLimit\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {AsyncFunction} iteratee - An async truth test to apply to each item\n * in the collections in parallel.\n * The iteratee should complete with a boolean `result` value.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called as soon as any\n * iteratee returns `true`, or after all the iteratee functions have finished.\n * Result will be either `true` or `false` depending on the values of the async\n * tests. Invoked with (err, result).\n */\nvar someLimit = doParallelLimit(_createTester(Boolean, identity));\n\n/**\n * The same as [`some`]{@link module:Collections.some} but runs only a single async operation at a time.\n *\n * @name someSeries\n * @static\n * @memberOf module:Collections\n * @method\n * @see [async.some]{@link module:Collections.some}\n * @alias anySeries\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - An async truth test to apply to each item\n * in the collections in series.\n * The iteratee should complete with a boolean `result` value.\n * Invoked with (item, callback).\n * @param {Function} [callback] - A callback which is called as soon as any\n * iteratee returns `true`, or after all the iteratee functions have finished.\n * Result will be either `true` or `false` depending on the values of the async\n * tests. Invoked with (err, result).\n */\nvar someSeries = doLimit(someLimit, 1);\n\n/**\n * Sorts a list by the results of running each `coll` value through an async\n * `iteratee`.\n *\n * @name sortBy\n * @static\n * @memberOf module:Collections\n * @method\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {AsyncFunction} iteratee - An async function to apply to each item in\n * `coll`.\n * The iteratee should complete with a value to use as the sort criteria as\n * its `result`.\n * Invoked with (item, callback).\n * @param {Function} callback - A callback which is called after all the\n * `iteratee` functions have finished, or an error occurs. Results is the items\n * from the original `coll` sorted by the values returned by the `iteratee`\n * calls. Invoked with (err, results).\n * @example\n *\n * async.sortBy(['file1','file2','file3'], function(file, callback) {\n *     fs.stat(file, function(err, stats) {\n *         callback(err, stats.mtime);\n *     });\n * }, function(err, results) {\n *     // results is now the original array of files sorted by\n *     // modified date\n * });\n *\n * // By modifying the callback parameter the\n * // sorting order can be influenced:\n *\n * // ascending order\n * async.sortBy([1,9,3,5], function(x, callback) {\n *     callback(null, x);\n * }, function(err,result) {\n *     // result callback\n * });\n *\n * // descending order\n * async.sortBy([1,9,3,5], function(x, callback) {\n *     callback(null, x*-1);    //<- x*-1 instead of x, turns the order around\n * }, function(err,result) {\n *     // result callback\n * });\n */\nfunction sortBy (coll, iteratee, callback) {\n    var _iteratee = wrapAsync(iteratee);\n    map(coll, function (x, callback) {\n        _iteratee(x, function (err, criteria) {\n            if (err) return callback(err);\n            callback(null, {value: x, criteria: criteria});\n        });\n    }, function (err, results) {\n        if (err) return callback(err);\n        callback(null, arrayMap(results.sort(comparator), baseProperty('value')));\n    });\n\n    function comparator(left, right) {\n        var a = left.criteria, b = right.criteria;\n        return a < b ? -1 : a > b ? 1 : 0;\n    }\n}\n\n/**\n * Sets a time limit on an asynchronous function. If the function does not call\n * its callback within the specified milliseconds, it will be called with a\n * timeout error. The code property for the error object will be `'ETIMEDOUT'`.\n *\n * @name timeout\n * @static\n * @memberOf module:Utils\n * @method\n * @category Util\n * @param {AsyncFunction} asyncFn - The async function to limit in time.\n * @param {number} milliseconds - The specified time limit.\n * @param {*} [info] - Any variable you want attached (`string`, `object`, etc)\n * to timeout Error for more information..\n * @returns {AsyncFunction} Returns a wrapped function that can be used with any\n * of the control flow functions.\n * Invoke this function with the same parameters as you would `asyncFunc`.\n * @example\n *\n * function myFunction(foo, callback) {\n *     doAsyncTask(foo, function(err, data) {\n *         // handle errors\n *         if (err) return callback(err);\n *\n *         // do some stuff ...\n *\n *         // return processed data\n *         return callback(null, data);\n *     });\n * }\n *\n * var wrapped = async.timeout(myFunction, 1000);\n *\n * // call `wrapped` as you would `myFunction`\n * wrapped({ bar: 'bar' }, function(err, data) {\n *     // if `myFunction` takes < 1000 ms to execute, `err`\n *     // and `data` will have their expected values\n *\n *     // else `err` will be an Error with the code 'ETIMEDOUT'\n * });\n */\nfunction timeout(asyncFn, milliseconds, info) {\n    var fn = wrapAsync(asyncFn);\n\n    return initialParams(function (args, callback) {\n        var timedOut = false;\n        var timer;\n\n        function timeoutCallback() {\n            var name = asyncFn.name || 'anonymous';\n            var error  = new Error('Callback function \"' + name + '\" timed out.');\n            error.code = 'ETIMEDOUT';\n            if (info) {\n                error.info = info;\n            }\n            timedOut = true;\n            callback(error);\n        }\n\n        args.push(function () {\n            if (!timedOut) {\n                callback.apply(null, arguments);\n                clearTimeout(timer);\n            }\n        });\n\n        // setup timer and call original function\n        timer = setTimeout(timeoutCallback, milliseconds);\n        fn.apply(null, args);\n    });\n}\n\n/* Built-in method references for those with the same name as other `lodash` methods. */\nvar nativeCeil = Math.ceil;\nvar nativeMax = Math.max;\n\n/**\n * The base implementation of `_.range` and `_.rangeRight` which doesn't\n * coerce arguments.\n *\n * @private\n * @param {number} start The start of the range.\n * @param {number} end The end of the range.\n * @param {number} step The value to increment or decrement by.\n * @param {boolean} [fromRight] Specify iterating from right to left.\n * @returns {Array} Returns the range of numbers.\n */\nfunction baseRange(start, end, step, fromRight) {\n  var index = -1,\n      length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),\n      result = Array(length);\n\n  while (length--) {\n    result[fromRight ? length : ++index] = start;\n    start += step;\n  }\n  return result;\n}\n\n/**\n * The same as [times]{@link module:ControlFlow.times} but runs a maximum of `limit` async operations at a\n * time.\n *\n * @name timesLimit\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.times]{@link module:ControlFlow.times}\n * @category Control Flow\n * @param {number} count - The number of times to run the function.\n * @param {number} limit - The maximum number of async operations at a time.\n * @param {AsyncFunction} iteratee - The async function to call `n` times.\n * Invoked with the iteration index and a callback: (n, next).\n * @param {Function} callback - see [async.map]{@link module:Collections.map}.\n */\nfunction timeLimit(count, limit, iteratee, callback) {\n    var _iteratee = wrapAsync(iteratee);\n    mapLimit(baseRange(0, count, 1), limit, _iteratee, callback);\n}\n\n/**\n * Calls the `iteratee` function `n` times, and accumulates results in the same\n * manner you would use with [map]{@link module:Collections.map}.\n *\n * @name times\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.map]{@link module:Collections.map}\n * @category Control Flow\n * @param {number} n - The number of times to run the function.\n * @param {AsyncFunction} iteratee - The async function to call `n` times.\n * Invoked with the iteration index and a callback: (n, next).\n * @param {Function} callback - see {@link module:Collections.map}.\n * @example\n *\n * // Pretend this is some complicated async factory\n * var createUser = function(id, callback) {\n *     callback(null, {\n *         id: 'user' + id\n *     });\n * };\n *\n * // generate 5 users\n * async.times(5, function(n, next) {\n *     createUser(n, function(err, user) {\n *         next(err, user);\n *     });\n * }, function(err, users) {\n *     // we should now have 5 users\n * });\n */\nvar times = doLimit(timeLimit, Infinity);\n\n/**\n * The same as [times]{@link module:ControlFlow.times} but runs only a single async operation at a time.\n *\n * @name timesSeries\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.times]{@link module:ControlFlow.times}\n * @category Control Flow\n * @param {number} n - The number of times to run the function.\n * @param {AsyncFunction} iteratee - The async function to call `n` times.\n * Invoked with the iteration index and a callback: (n, next).\n * @param {Function} callback - see {@link module:Collections.map}.\n */\nvar timesSeries = doLimit(timeLimit, 1);\n\n/**\n * A relative of `reduce`.  Takes an Object or Array, and iterates over each\n * element in series, each step potentially mutating an `accumulator` value.\n * The type of the accumulator defaults to the type of collection passed in.\n *\n * @name transform\n * @static\n * @memberOf module:Collections\n * @method\n * @category Collection\n * @param {Array|Iterable|Object} coll - A collection to iterate over.\n * @param {*} [accumulator] - The initial state of the transform.  If omitted,\n * it will default to an empty Object or Array, depending on the type of `coll`\n * @param {AsyncFunction} iteratee - A function applied to each item in the\n * collection that potentially modifies the accumulator.\n * Invoked with (accumulator, item, key, callback).\n * @param {Function} [callback] - A callback which is called after all the\n * `iteratee` functions have finished. Result is the transformed accumulator.\n * Invoked with (err, result).\n * @example\n *\n * async.transform([1,2,3], function(acc, item, index, callback) {\n *     // pointless async:\n *     process.nextTick(function() {\n *         acc.push(item * 2)\n *         callback(null)\n *     });\n * }, function(err, result) {\n *     // result is now equal to [2, 4, 6]\n * });\n *\n * @example\n *\n * async.transform({a: 1, b: 2, c: 3}, function (obj, val, key, callback) {\n *     setImmediate(function () {\n *         obj[key] = val * 2;\n *         callback();\n *     })\n * }, function (err, result) {\n *     // result is equal to {a: 2, b: 4, c: 6}\n * })\n */\nfunction transform (coll, accumulator, iteratee, callback) {\n    if (arguments.length <= 3) {\n        callback = iteratee;\n        iteratee = accumulator;\n        accumulator = isArray(coll) ? [] : {};\n    }\n    callback = once(callback || noop);\n    var _iteratee = wrapAsync(iteratee);\n\n    eachOf(coll, function(v, k, cb) {\n        _iteratee(accumulator, v, k, cb);\n    }, function(err) {\n        callback(err, accumulator);\n    });\n}\n\n/**\n * It runs each task in series but stops whenever any of the functions were\n * successful. If one of the tasks were successful, the `callback` will be\n * passed the result of the successful task. If all tasks fail, the callback\n * will be passed the error and result (if any) of the final attempt.\n *\n * @name tryEach\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @param {Array|Iterable|Object} tasks - A collection containing functions to\n * run, each function is passed a `callback(err, result)` it must call on\n * completion with an error `err` (which can be `null`) and an optional `result`\n * value.\n * @param {Function} [callback] - An optional callback which is called when one\n * of the tasks has succeeded, or all have failed. It receives the `err` and\n * `result` arguments of the last attempt at completing the `task`. Invoked with\n * (err, results).\n * @example\n * async.tryEach([\n *     function getDataFromFirstWebsite(callback) {\n *         // Try getting the data from the first website\n *         callback(err, data);\n *     },\n *     function getDataFromSecondWebsite(callback) {\n *         // First website failed,\n *         // Try getting the data from the backup website\n *         callback(err, data);\n *     }\n * ],\n * // optional callback\n * function(err, results) {\n *     Now do something with the data.\n * });\n *\n */\nfunction tryEach(tasks, callback) {\n    var error = null;\n    var result;\n    callback = callback || noop;\n    eachSeries(tasks, function(task, callback) {\n        wrapAsync(task)(function (err, res/*, ...args*/) {\n            if (arguments.length > 2) {\n                result = slice(arguments, 1);\n            } else {\n                result = res;\n            }\n            error = err;\n            callback(!err);\n        });\n    }, function () {\n        callback(error, result);\n    });\n}\n\n/**\n * Undoes a [memoize]{@link module:Utils.memoize}d function, reverting it to the original,\n * unmemoized form. Handy for testing.\n *\n * @name unmemoize\n * @static\n * @memberOf module:Utils\n * @method\n * @see [async.memoize]{@link module:Utils.memoize}\n * @category Util\n * @param {AsyncFunction} fn - the memoized function\n * @returns {AsyncFunction} a function that calls the original unmemoized function\n */\nfunction unmemoize(fn) {\n    return function () {\n        return (fn.unmemoized || fn).apply(null, arguments);\n    };\n}\n\n/**\n * Repeatedly call `iteratee`, while `test` returns `true`. Calls `callback` when\n * stopped, or an error occurs.\n *\n * @name whilst\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @param {Function} test - synchronous truth test to perform before each\n * execution of `iteratee`. Invoked with ().\n * @param {AsyncFunction} iteratee - An async function which is called each time\n * `test` passes. Invoked with (callback).\n * @param {Function} [callback] - A callback which is called after the test\n * function has failed and repeated execution of `iteratee` has stopped. `callback`\n * will be passed an error and any arguments passed to the final `iteratee`'s\n * callback. Invoked with (err, [results]);\n * @returns undefined\n * @example\n *\n * var count = 0;\n * async.whilst(\n *     function() { return count < 5; },\n *     function(callback) {\n *         count++;\n *         setTimeout(function() {\n *             callback(null, count);\n *         }, 1000);\n *     },\n *     function (err, n) {\n *         // 5 seconds have passed, n = 5\n *     }\n * );\n */\nfunction whilst(test, iteratee, callback) {\n    callback = onlyOnce(callback || noop);\n    var _iteratee = wrapAsync(iteratee);\n    if (!test()) return callback(null);\n    var next = function(err/*, ...args*/) {\n        if (err) return callback(err);\n        if (test()) return _iteratee(next);\n        var args = slice(arguments, 1);\n        callback.apply(null, [null].concat(args));\n    };\n    _iteratee(next);\n}\n\n/**\n * Repeatedly call `iteratee` until `test` returns `true`. Calls `callback` when\n * stopped, or an error occurs. `callback` will be passed an error and any\n * arguments passed to the final `iteratee`'s callback.\n *\n * The inverse of [whilst]{@link module:ControlFlow.whilst}.\n *\n * @name until\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @see [async.whilst]{@link module:ControlFlow.whilst}\n * @category Control Flow\n * @param {Function} test - synchronous truth test to perform before each\n * execution of `iteratee`. Invoked with ().\n * @param {AsyncFunction} iteratee - An async function which is called each time\n * `test` fails. Invoked with (callback).\n * @param {Function} [callback] - A callback which is called after the test\n * function has passed and repeated execution of `iteratee` has stopped. `callback`\n * will be passed an error and any arguments passed to the final `iteratee`'s\n * callback. Invoked with (err, [results]);\n */\nfunction until(test, iteratee, callback) {\n    whilst(function() {\n        return !test.apply(this, arguments);\n    }, iteratee, callback);\n}\n\n/**\n * Runs the `tasks` array of functions in series, each passing their results to\n * the next in the array. However, if any of the `tasks` pass an error to their\n * own callback, the next function is not executed, and the main `callback` is\n * immediately called with the error.\n *\n * @name waterfall\n * @static\n * @memberOf module:ControlFlow\n * @method\n * @category Control Flow\n * @param {Array} tasks - An array of [async functions]{@link AsyncFunction}\n * to run.\n * Each function should complete with any number of `result` values.\n * The `result` values will be passed as arguments, in order, to the next task.\n * @param {Function} [callback] - An optional callback to run once all the\n * functions have completed. This will be passed the results of the last task's\n * callback. Invoked with (err, [results]).\n * @returns undefined\n * @example\n *\n * async.waterfall([\n *     function(callback) {\n *         callback(null, 'one', 'two');\n *     },\n *     function(arg1, arg2, callback) {\n *         // arg1 now equals 'one' and arg2 now equals 'two'\n *         callback(null, 'three');\n *     },\n *     function(arg1, callback) {\n *         // arg1 now equals 'three'\n *         callback(null, 'done');\n *     }\n * ], function (err, result) {\n *     // result now equals 'done'\n * });\n *\n * // Or, with named functions:\n * async.waterfall([\n *     myFirstFunction,\n *     mySecondFunction,\n *     myLastFunction,\n * ], function (err, result) {\n *     // result now equals 'done'\n * });\n * function myFirstFunction(callback) {\n *     callback(null, 'one', 'two');\n * }\n * function mySecondFunction(arg1, arg2, callback) {\n *     // arg1 now equals 'one' and arg2 now equals 'two'\n *     callback(null, 'three');\n * }\n * function myLastFunction(arg1, callback) {\n *     // arg1 now equals 'three'\n *     callback(null, 'done');\n * }\n */\nvar waterfall = function(tasks, callback) {\n    callback = once(callback || noop);\n    if (!isArray(tasks)) return callback(new Error('First argument to waterfall must be an array of functions'));\n    if (!tasks.length) return callback();\n    var taskIndex = 0;\n\n    function nextTask(args) {\n        var task = wrapAsync(tasks[taskIndex++]);\n        args.push(onlyOnce(next));\n        task.apply(null, args);\n    }\n\n    function next(err/*, ...args*/) {\n        if (err || taskIndex === tasks.length) {\n            return callback.apply(null, arguments);\n        }\n        nextTask(slice(arguments, 1));\n    }\n\n    nextTask([]);\n};\n\n/**\n * An \"async function\" in the context of Async is an asynchronous function with\n * a variable number of parameters, with the final parameter being a callback.\n * (`function (arg1, arg2, ..., callback) {}`)\n * The final callback is of the form `callback(err, results...)`, which must be\n * called once the function is completed.  The callback should be called with a\n * Error as its first argument to signal that an error occurred.\n * Otherwise, if no error occurred, it should be called with `null` as the first\n * argument, and any additional `result` arguments that may apply, to signal\n * successful completion.\n * The callback must be called exactly once, ideally on a later tick of the\n * JavaScript event loop.\n *\n * This type of function is also referred to as a \"Node-style async function\",\n * or a \"continuation passing-style function\" (CPS). Most of the methods of this\n * library are themselves CPS/Node-style async functions, or functions that\n * return CPS/Node-style async functions.\n *\n * Wherever we accept a Node-style async function, we also directly accept an\n * [ES2017 `async` function]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function}.\n * In this case, the `async` function will not be passed a final callback\n * argument, and any thrown error will be used as the `err` argument of the\n * implicit callback, and the return value will be used as the `result` value.\n * (i.e. a `rejected` of the returned Promise becomes the `err` callback\n * argument, and a `resolved` value becomes the `result`.)\n *\n * Note, due to JavaScript limitations, we can only detect native `async`\n * functions and not transpilied implementations.\n * Your environment must have `async`/`await` support for this to work.\n * (e.g. Node > v7.6, or a recent version of a modern browser).\n * If you are using `async` functions through a transpiler (e.g. Babel), you\n * must still wrap the function with [asyncify]{@link module:Utils.asyncify},\n * because the `async function` will be compiled to an ordinary function that\n * returns a promise.\n *\n * @typedef {Function} AsyncFunction\n * @static\n */\n\n/**\n * Async is a utility module which provides straight-forward, powerful functions\n * for working with asynchronous JavaScript. Although originally designed for\n * use with [Node.js](http://nodejs.org) and installable via\n * `npm install --save async`, it can also be used directly in the browser.\n * @module async\n * @see AsyncFunction\n */\n\n\n/**\n * A collection of `async` functions for manipulating collections, such as\n * arrays and objects.\n * @module Collections\n */\n\n/**\n * A collection of `async` functions for controlling the flow through a script.\n * @module ControlFlow\n */\n\n/**\n * A collection of `async` utility functions.\n * @module Utils\n */\n\nvar index = {\n    apply: apply,\n    applyEach: applyEach,\n    applyEachSeries: applyEachSeries,\n    asyncify: asyncify,\n    auto: auto,\n    autoInject: autoInject,\n    cargo: cargo,\n    compose: compose,\n    concat: concat,\n    concatLimit: concatLimit,\n    concatSeries: concatSeries,\n    constant: constant,\n    detect: detect,\n    detectLimit: detectLimit,\n    detectSeries: detectSeries,\n    dir: dir,\n    doDuring: doDuring,\n    doUntil: doUntil,\n    doWhilst: doWhilst,\n    during: during,\n    each: eachLimit,\n    eachLimit: eachLimit$1,\n    eachOf: eachOf,\n    eachOfLimit: eachOfLimit,\n    eachOfSeries: eachOfSeries,\n    eachSeries: eachSeries,\n    ensureAsync: ensureAsync,\n    every: every,\n    everyLimit: everyLimit,\n    everySeries: everySeries,\n    filter: filter,\n    filterLimit: filterLimit,\n    filterSeries: filterSeries,\n    forever: forever,\n    groupBy: groupBy,\n    groupByLimit: groupByLimit,\n    groupBySeries: groupBySeries,\n    log: log,\n    map: map,\n    mapLimit: mapLimit,\n    mapSeries: mapSeries,\n    mapValues: mapValues,\n    mapValuesLimit: mapValuesLimit,\n    mapValuesSeries: mapValuesSeries,\n    memoize: memoize,\n    nextTick: nextTick,\n    parallel: parallelLimit,\n    parallelLimit: parallelLimit$1,\n    priorityQueue: priorityQueue,\n    queue: queue$1,\n    race: race,\n    reduce: reduce,\n    reduceRight: reduceRight,\n    reflect: reflect,\n    reflectAll: reflectAll,\n    reject: reject,\n    rejectLimit: rejectLimit,\n    rejectSeries: rejectSeries,\n    retry: retry,\n    retryable: retryable,\n    seq: seq,\n    series: series,\n    setImmediate: setImmediate$1,\n    some: some,\n    someLimit: someLimit,\n    someSeries: someSeries,\n    sortBy: sortBy,\n    timeout: timeout,\n    times: times,\n    timesLimit: timeLimit,\n    timesSeries: timesSeries,\n    transform: transform,\n    tryEach: tryEach,\n    unmemoize: unmemoize,\n    until: until,\n    waterfall: waterfall,\n    whilst: whilst,\n\n    // aliases\n    all: every,\n    allLimit: everyLimit,\n    allSeries: everySeries,\n    any: some,\n    anyLimit: someLimit,\n    anySeries: someSeries,\n    find: detect,\n    findLimit: detectLimit,\n    findSeries: detectSeries,\n    forEach: eachLimit,\n    forEachSeries: eachSeries,\n    forEachLimit: eachLimit$1,\n    forEachOf: eachOf,\n    forEachOfSeries: eachOfSeries,\n    forEachOfLimit: eachOfLimit,\n    inject: reduce,\n    foldl: reduce,\n    foldr: reduceRight,\n    select: filter,\n    selectLimit: filterLimit,\n    selectSeries: filterSeries,\n    wrapSync: asyncify\n};\n\nexports['default'] = index;\nexports.apply = apply;\nexports.applyEach = applyEach;\nexports.applyEachSeries = applyEachSeries;\nexports.asyncify = asyncify;\nexports.auto = auto;\nexports.autoInject = autoInject;\nexports.cargo = cargo;\nexports.compose = compose;\nexports.concat = concat;\nexports.concatLimit = concatLimit;\nexports.concatSeries = concatSeries;\nexports.constant = constant;\nexports.detect = detect;\nexports.detectLimit = detectLimit;\nexports.detectSeries = detectSeries;\nexports.dir = dir;\nexports.doDuring = doDuring;\nexports.doUntil = doUntil;\nexports.doWhilst = doWhilst;\nexports.during = during;\nexports.each = eachLimit;\nexports.eachLimit = eachLimit$1;\nexports.eachOf = eachOf;\nexports.eachOfLimit = eachOfLimit;\nexports.eachOfSeries = eachOfSeries;\nexports.eachSeries = eachSeries;\nexports.ensureAsync = ensureAsync;\nexports.every = every;\nexports.everyLimit = everyLimit;\nexports.everySeries = everySeries;\nexports.filter = filter;\nexports.filterLimit = filterLimit;\nexports.filterSeries = filterSeries;\nexports.forever = forever;\nexports.groupBy = groupBy;\nexports.groupByLimit = groupByLimit;\nexports.groupBySeries = groupBySeries;\nexports.log = log;\nexports.map = map;\nexports.mapLimit = mapLimit;\nexports.mapSeries = mapSeries;\nexports.mapValues = mapValues;\nexports.mapValuesLimit = mapValuesLimit;\nexports.mapValuesSeries = mapValuesSeries;\nexports.memoize = memoize;\nexports.nextTick = nextTick;\nexports.parallel = parallelLimit;\nexports.parallelLimit = parallelLimit$1;\nexports.priorityQueue = priorityQueue;\nexports.queue = queue$1;\nexports.race = race;\nexports.reduce = reduce;\nexports.reduceRight = reduceRight;\nexports.reflect = reflect;\nexports.reflectAll = reflectAll;\nexports.reject = reject;\nexports.rejectLimit = rejectLimit;\nexports.rejectSeries = rejectSeries;\nexports.retry = retry;\nexports.retryable = retryable;\nexports.seq = seq;\nexports.series = series;\nexports.setImmediate = setImmediate$1;\nexports.some = some;\nexports.someLimit = someLimit;\nexports.someSeries = someSeries;\nexports.sortBy = sortBy;\nexports.timeout = timeout;\nexports.times = times;\nexports.timesLimit = timeLimit;\nexports.timesSeries = timesSeries;\nexports.transform = transform;\nexports.tryEach = tryEach;\nexports.unmemoize = unmemoize;\nexports.until = until;\nexports.waterfall = waterfall;\nexports.whilst = whilst;\nexports.all = every;\nexports.allLimit = everyLimit;\nexports.allSeries = everySeries;\nexports.any = some;\nexports.anyLimit = someLimit;\nexports.anySeries = someSeries;\nexports.find = detect;\nexports.findLimit = detectLimit;\nexports.findSeries = detectSeries;\nexports.forEach = eachLimit;\nexports.forEachSeries = eachSeries;\nexports.forEachLimit = eachLimit$1;\nexports.forEachOf = eachOf;\nexports.forEachOfSeries = eachOfSeries;\nexports.forEachOfLimit = eachOfLimit;\nexports.inject = reduce;\nexports.foldl = reduce;\nexports.foldr = reduceRight;\nexports.select = filter;\nexports.selectLimit = filterLimit;\nexports.selectSeries = filterSeries;\nexports.wrapSync = asyncify;\n\nObject.defineProperty(exports, '__esModule', { value: true });\n\n})));\n\n}).call(this,_dereq_('_process'),typeof global !== \"undefined\" ? global : typeof self !== \"undefined\" ? self : typeof window !== \"undefined\" ? window : {},_dereq_(\"timers\").setImmediate)\n\n},{\"_process\":23,\"timers\":164}],4:[function(_dereq_,module,exports){\nmodule.exports = { \"default\": _dereq_(\"core-js/library/fn/json/stringify\"), __esModule: true };\n},{\"core-js/library/fn/json/stringify\":25}],5:[function(_dereq_,module,exports){\nmodule.exports = { \"default\": _dereq_(\"core-js/library/fn/object/assign\"), __esModule: true };\n},{\"core-js/library/fn/object/assign\":26}],6:[function(_dereq_,module,exports){\nmodule.exports = { \"default\": _dereq_(\"core-js/library/fn/object/create\"), __esModule: true };\n},{\"core-js/library/fn/object/create\":27}],7:[function(_dereq_,module,exports){\nmodule.exports = { \"default\": _dereq_(\"core-js/library/fn/object/define-property\"), __esModule: true };\n},{\"core-js/library/fn/object/define-property\":28}],8:[function(_dereq_,module,exports){\nmodule.exports = { \"default\": _dereq_(\"core-js/library/fn/object/get-own-property-descriptor\"), __esModule: true };\n},{\"core-js/library/fn/object/get-own-property-descriptor\":29}],9:[function(_dereq_,module,exports){\nmodule.exports = { \"default\": _dereq_(\"core-js/library/fn/object/get-prototype-of\"), __esModule: true };\n},{\"core-js/library/fn/object/get-prototype-of\":30}],10:[function(_dereq_,module,exports){\nmodule.exports = { \"default\": _dereq_(\"core-js/library/fn/object/set-prototype-of\"), __esModule: true };\n},{\"core-js/library/fn/object/set-prototype-of\":31}],11:[function(_dereq_,module,exports){\nmodule.exports = { \"default\": _dereq_(\"core-js/library/fn/promise\"), __esModule: true };\n},{\"core-js/library/fn/promise\":32}],12:[function(_dereq_,module,exports){\nmodule.exports = { \"default\": _dereq_(\"core-js/library/fn/symbol\"), __esModule: true };\n},{\"core-js/library/fn/symbol\":33}],13:[function(_dereq_,module,exports){\nmodule.exports = { \"default\": _dereq_(\"core-js/library/fn/symbol/iterator\"), __esModule: true };\n},{\"core-js/library/fn/symbol/iterator\":34}],14:[function(_dereq_,module,exports){\n\"use strict\";\n\nexports.__esModule = true;\n\nexports.default = function (instance, Constructor) {\n  if (!(instance instanceof Constructor)) {\n    throw new TypeError(\"Cannot call a class as a function\");\n  }\n};\n},{}],15:[function(_dereq_,module,exports){\n\"use strict\";\n\nexports.__esModule = true;\n\nvar _defineProperty = _dereq_(\"../core-js/object/define-property\");\n\nvar _defineProperty2 = _interopRequireDefault(_defineProperty);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nexports.default = function () {\n  function defineProperties(target, props) {\n    for (var i = 0; i < props.length; i++) {\n      var descriptor = props[i];\n      descriptor.enumerable = descriptor.enumerable || false;\n      descriptor.configurable = true;\n      if (\"value\" in descriptor) descriptor.writable = true;\n      (0, _defineProperty2.default)(target, descriptor.key, descriptor);\n    }\n  }\n\n  return function (Constructor, protoProps, staticProps) {\n    if (protoProps) defineProperties(Constructor.prototype, protoProps);\n    if (staticProps) defineProperties(Constructor, staticProps);\n    return Constructor;\n  };\n}();\n},{\"../core-js/object/define-property\":7}],16:[function(_dereq_,module,exports){\n\"use strict\";\n\nexports.__esModule = true;\n\nvar _getPrototypeOf = _dereq_(\"../core-js/object/get-prototype-of\");\n\nvar _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);\n\nvar _getOwnPropertyDescriptor = _dereq_(\"../core-js/object/get-own-property-descriptor\");\n\nvar _getOwnPropertyDescriptor2 = _interopRequireDefault(_getOwnPropertyDescriptor);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nexports.default = function get(object, property, receiver) {\n  if (object === null) object = Function.prototype;\n  var desc = (0, _getOwnPropertyDescriptor2.default)(object, property);\n\n  if (desc === undefined) {\n    var parent = (0, _getPrototypeOf2.default)(object);\n\n    if (parent === null) {\n      return undefined;\n    } else {\n      return get(parent, property, receiver);\n    }\n  } else if (\"value\" in desc) {\n    return desc.value;\n  } else {\n    var getter = desc.get;\n\n    if (getter === undefined) {\n      return undefined;\n    }\n\n    return getter.call(receiver);\n  }\n};\n},{\"../core-js/object/get-own-property-descriptor\":8,\"../core-js/object/get-prototype-of\":9}],17:[function(_dereq_,module,exports){\n\"use strict\";\n\nexports.__esModule = true;\n\nvar _setPrototypeOf = _dereq_(\"../core-js/object/set-prototype-of\");\n\nvar _setPrototypeOf2 = _interopRequireDefault(_setPrototypeOf);\n\nvar _create = _dereq_(\"../core-js/object/create\");\n\nvar _create2 = _interopRequireDefault(_create);\n\nvar _typeof2 = _dereq_(\"../helpers/typeof\");\n\nvar _typeof3 = _interopRequireDefault(_typeof2);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nexports.default = function (subClass, superClass) {\n  if (typeof superClass !== \"function\" && superClass !== null) {\n    throw new TypeError(\"Super expression must either be null or a function, not \" + (typeof superClass === \"undefined\" ? \"undefined\" : (0, _typeof3.default)(superClass)));\n  }\n\n  subClass.prototype = (0, _create2.default)(superClass && superClass.prototype, {\n    constructor: {\n      value: subClass,\n      enumerable: false,\n      writable: true,\n      configurable: true\n    }\n  });\n  if (superClass) _setPrototypeOf2.default ? (0, _setPrototypeOf2.default)(subClass, superClass) : subClass.__proto__ = superClass;\n};\n},{\"../core-js/object/create\":6,\"../core-js/object/set-prototype-of\":10,\"../helpers/typeof\":19}],18:[function(_dereq_,module,exports){\n\"use strict\";\n\nexports.__esModule = true;\n\nvar _typeof2 = _dereq_(\"../helpers/typeof\");\n\nvar _typeof3 = _interopRequireDefault(_typeof2);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nexports.default = function (self, call) {\n  if (!self) {\n    throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\");\n  }\n\n  return call && ((typeof call === \"undefined\" ? \"undefined\" : (0, _typeof3.default)(call)) === \"object\" || typeof call === \"function\") ? call : self;\n};\n},{\"../helpers/typeof\":19}],19:[function(_dereq_,module,exports){\n\"use strict\";\n\nexports.__esModule = true;\n\nvar _iterator = _dereq_(\"../core-js/symbol/iterator\");\n\nvar _iterator2 = _interopRequireDefault(_iterator);\n\nvar _symbol = _dereq_(\"../core-js/symbol\");\n\nvar _symbol2 = _interopRequireDefault(_symbol);\n\nvar _typeof = typeof _symbol2.default === \"function\" && typeof _iterator2.default === \"symbol\" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === \"function\" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? \"symbol\" : typeof obj; };\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nexports.default = typeof _symbol2.default === \"function\" && _typeof(_iterator2.default) === \"symbol\" ? function (obj) {\n  return typeof obj === \"undefined\" ? \"undefined\" : _typeof(obj);\n} : function (obj) {\n  return obj && typeof _symbol2.default === \"function\" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? \"symbol\" : typeof obj === \"undefined\" ? \"undefined\" : _typeof(obj);\n};\n},{\"../core-js/symbol\":12,\"../core-js/symbol/iterator\":13}],20:[function(_dereq_,module,exports){\n'use strict'\n\nexports.byteLength = byteLength\nexports.toByteArray = toByteArray\nexports.fromByteArray = fromByteArray\n\nvar lookup = []\nvar revLookup = []\nvar Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array\n\nvar code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\nfor (var i = 0, len = code.length; i < len; ++i) {\n  lookup[i] = code[i]\n  revLookup[code.charCodeAt(i)] = i\n}\n\nrevLookup['-'.charCodeAt(0)] = 62\nrevLookup['_'.charCodeAt(0)] = 63\n\nfunction placeHoldersCount (b64) {\n  var len = b64.length\n  if (len % 4 > 0) {\n    throw new Error('Invalid string. Length must be a multiple of 4')\n  }\n\n  // the number of equal signs (place holders)\n  // if there are two placeholders, than the two characters before it\n  // represent one byte\n  // if there is only one, then the three characters before it represent 2 bytes\n  // this is just a cheap hack to not do indexOf twice\n  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0\n}\n\nfunction byteLength (b64) {\n  // base64 is 4/3 + up to two characters of the original data\n  return (b64.length * 3 / 4) - placeHoldersCount(b64)\n}\n\nfunction toByteArray (b64) {\n  var i, l, tmp, placeHolders, arr\n  var len = b64.length\n  placeHolders = placeHoldersCount(b64)\n\n  arr = new Arr((len * 3 / 4) - placeHolders)\n\n  // if there are placeholders, only get up to the last complete 4 chars\n  l = placeHolders > 0 ? len - 4 : len\n\n  var L = 0\n\n  for (i = 0; i < l; i += 4) {\n    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]\n    arr[L++] = (tmp >> 16) & 0xFF\n    arr[L++] = (tmp >> 8) & 0xFF\n    arr[L++] = tmp & 0xFF\n  }\n\n  if (placeHolders === 2) {\n    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)\n    arr[L++] = tmp & 0xFF\n  } else if (placeHolders === 1) {\n    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)\n    arr[L++] = (tmp >> 8) & 0xFF\n    arr[L++] = tmp & 0xFF\n  }\n\n  return arr\n}\n\nfunction tripletToBase64 (num) {\n  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]\n}\n\nfunction encodeChunk (uint8, start, end) {\n  var tmp\n  var output = []\n  for (var i = start; i < end; i += 3) {\n    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])\n    output.push(tripletToBase64(tmp))\n  }\n  return output.join('')\n}\n\nfunction fromByteArray (uint8) {\n  var tmp\n  var len = uint8.length\n  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes\n  var output = ''\n  var parts = []\n  var maxChunkLength = 16383 // must be multiple of 3\n\n  // go through the array every three bytes, we'll deal with trailing stuff later\n  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {\n    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))\n  }\n\n  // pad the end with zeros, but make sure to not forget the extra bytes\n  if (extraBytes === 1) {\n    tmp = uint8[len - 1]\n    output += lookup[tmp >> 2]\n    output += lookup[(tmp << 4) & 0x3F]\n    output += '=='\n  } else if (extraBytes === 2) {\n    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])\n    output += lookup[tmp >> 10]\n    output += lookup[(tmp >> 4) & 0x3F]\n    output += lookup[(tmp << 2) & 0x3F]\n    output += '='\n  }\n\n  parts.push(output)\n\n  return parts.join('')\n}\n\n},{}],21:[function(_dereq_,module,exports){\n\n},{}],22:[function(_dereq_,module,exports){\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\nvar objectCreate = Object.create || objectCreatePolyfill\nvar objectKeys = Object.keys || objectKeysPolyfill\nvar bind = Function.prototype.bind || functionBindPolyfill\n\nfunction EventEmitter() {\n  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {\n    this._events = objectCreate(null);\n    this._eventsCount = 0;\n  }\n\n  this._maxListeners = this._maxListeners || undefined;\n}\nmodule.exports = EventEmitter;\n\n// Backwards-compat with node 0.10.x\nEventEmitter.EventEmitter = EventEmitter;\n\nEventEmitter.prototype._events = undefined;\nEventEmitter.prototype._maxListeners = undefined;\n\n// By default EventEmitters will print a warning if more than 10 listeners are\n// added to it. This is a useful default which helps finding memory leaks.\nvar defaultMaxListeners = 10;\n\nvar hasDefineProperty;\ntry {\n  var o = {};\n  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });\n  hasDefineProperty = o.x === 0;\n} catch (err) { hasDefineProperty = false }\nif (hasDefineProperty) {\n  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {\n    enumerable: true,\n    get: function() {\n      return defaultMaxListeners;\n    },\n    set: function(arg) {\n      // check whether the input is a positive number (whose value is zero or\n      // greater and not a NaN).\n      if (typeof arg !== 'number' || arg < 0 || arg !== arg)\n        throw new TypeError('\"defaultMaxListeners\" must be a positive number');\n      defaultMaxListeners = arg;\n    }\n  });\n} else {\n  EventEmitter.defaultMaxListeners = defaultMaxListeners;\n}\n\n// Obviously not all Emitters should be limited to 10. This function allows\n// that to be increased. Set to zero for unlimited.\nEventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {\n  if (typeof n !== 'number' || n < 0 || isNaN(n))\n    throw new TypeError('\"n\" argument must be a positive number');\n  this._maxListeners = n;\n  return this;\n};\n\nfunction $getMaxListeners(that) {\n  if (that._maxListeners === undefined)\n    return EventEmitter.defaultMaxListeners;\n  return that._maxListeners;\n}\n\nEventEmitter.prototype.getMaxListeners = function getMaxListeners() {\n  return $getMaxListeners(this);\n};\n\n// These standalone emit* functions are used to optimize calling of event\n// handlers for fast cases because emit() itself often has a variable number of\n// arguments and can be deoptimized because of that. These functions always have\n// the same number of arguments and thus do not get deoptimized, so the code\n// inside them can execute faster.\nfunction emitNone(handler, isFn, self) {\n  if (isFn)\n    handler.call(self);\n  else {\n    var len = handler.length;\n    var listeners = arrayClone(handler, len);\n    for (var i = 0; i < len; ++i)\n      listeners[i].call(self);\n  }\n}\nfunction emitOne(handler, isFn, self, arg1) {\n  if (isFn)\n    handler.call(self, arg1);\n  else {\n    var len = handler.length;\n    var listeners = arrayClone(handler, len);\n    for (var i = 0; i < len; ++i)\n      listeners[i].call(self, arg1);\n  }\n}\nfunction emitTwo(handler, isFn, self, arg1, arg2) {\n  if (isFn)\n    handler.call(self, arg1, arg2);\n  else {\n    var len = handler.length;\n    var listeners = arrayClone(handler, len);\n    for (var i = 0; i < len; ++i)\n      listeners[i].call(self, arg1, arg2);\n  }\n}\nfunction emitThree(handler, isFn, self, arg1, arg2, arg3) {\n  if (isFn)\n    handler.call(self, arg1, arg2, arg3);\n  else {\n    var len = handler.length;\n    var listeners = arrayClone(handler, len);\n    for (var i = 0; i < len; ++i)\n      listeners[i].call(self, arg1, arg2, arg3);\n  }\n}\n\nfunction emitMany(handler, isFn, self, args) {\n  if (isFn)\n    handler.apply(self, args);\n  else {\n    var len = handler.length;\n    var listeners = arrayClone(handler, len);\n    for (var i = 0; i < len; ++i)\n      listeners[i].apply(self, args);\n  }\n}\n\nEventEmitter.prototype.emit = function emit(type) {\n  var er, handler, len, args, i, events;\n  var doError = (type === 'error');\n\n  events = this._events;\n  if (events)\n    doError = (doError && events.error == null);\n  else if (!doError)\n    return false;\n\n  // If there is no 'error' event listener then throw.\n  if (doError) {\n    if (arguments.length > 1)\n      er = arguments[1];\n    if (er instanceof Error) {\n      throw er; // Unhandled 'error' event\n    } else {\n      // At least give some kind of context to the user\n      var err = new Error('Unhandled \"error\" event. (' + er + ')');\n      err.context = er;\n      throw err;\n    }\n    return false;\n  }\n\n  handler = events[type];\n\n  if (!handler)\n    return false;\n\n  var isFn = typeof handler === 'function';\n  len = arguments.length;\n  switch (len) {\n      // fast cases\n    case 1:\n      emitNone(handler, isFn, this);\n      break;\n    case 2:\n      emitOne(handler, isFn, this, arguments[1]);\n      break;\n    case 3:\n      emitTwo(handler, isFn, this, arguments[1], arguments[2]);\n      break;\n    case 4:\n      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);\n      break;\n      // slower\n    default:\n      args = new Array(len - 1);\n      for (i = 1; i < len; i++)\n        args[i - 1] = arguments[i];\n      emitMany(handler, isFn, this, args);\n  }\n\n  return true;\n};\n\nfunction _addListener(target, type, listener, prepend) {\n  var m;\n  var events;\n  var existing;\n\n  if (typeof listener !== 'function')\n    throw new TypeError('\"listener\" argument must be a function');\n\n  events = target._events;\n  if (!events) {\n    events = target._events = objectCreate(null);\n    target._eventsCount = 0;\n  } else {\n    // To avoid recursion in the case that type === \"newListener\"! Before\n    // adding it to the listeners, first emit \"newListener\".\n    if (events.newListener) {\n      target.emit('newListener', type,\n          listener.listener ? listener.listener : listener);\n\n      // Re-assign `events` because a newListener handler could have caused the\n      // this._events to be assigned to a new object\n      events = target._events;\n    }\n    existing = events[type];\n  }\n\n  if (!existing) {\n    // Optimize the case of one listener. Don't need the extra array object.\n    existing = events[type] = listener;\n    ++target._eventsCount;\n  } else {\n    if (typeof existing === 'function') {\n      // Adding the second element, need to change to array.\n      existing = events[type] =\n          prepend ? [listener, existing] : [existing, listener];\n    } else {\n      // If we've already got an array, just append.\n      if (prepend) {\n        existing.unshift(listener);\n      } else {\n        existing.push(listener);\n      }\n    }\n\n    // Check for listener leak\n    if (!existing.warned) {\n      m = $getMaxListeners(target);\n      if (m && m > 0 && existing.length > m) {\n        existing.warned = true;\n        var w = new Error('Possible EventEmitter memory leak detected. ' +\n            existing.length + ' \"' + String(type) + '\" listeners ' +\n            'added. Use emitter.setMaxListeners() to ' +\n            'increase limit.');\n        w.name = 'MaxListenersExceededWarning';\n        w.emitter = target;\n        w.type = type;\n        w.count = existing.length;\n        if (typeof console === 'object' && console.warn) {\n          console.warn('%s: %s', w.name, w.message);\n        }\n      }\n    }\n  }\n\n  return target;\n}\n\nEventEmitter.prototype.addListener = function addListener(type, listener) {\n  return _addListener(this, type, listener, false);\n};\n\nEventEmitter.prototype.on = EventEmitter.prototype.addListener;\n\nEventEmitter.prototype.prependListener =\n    function prependListener(type, listener) {\n      return _addListener(this, type, listener, true);\n    };\n\nfunction onceWrapper() {\n  if (!this.fired) {\n    this.target.removeListener(this.type, this.wrapFn);\n    this.fired = true;\n    switch (arguments.length) {\n      case 0:\n        return this.listener.call(this.target);\n      case 1:\n        return this.listener.call(this.target, arguments[0]);\n      case 2:\n        return this.listener.call(this.target, arguments[0], arguments[1]);\n      case 3:\n        return this.listener.call(this.target, arguments[0], arguments[1],\n            arguments[2]);\n      default:\n        var args = new Array(arguments.length);\n        for (var i = 0; i < args.length; ++i)\n          args[i] = arguments[i];\n        this.listener.apply(this.target, args);\n    }\n  }\n}\n\nfunction _onceWrap(target, type, listener) {\n  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };\n  var wrapped = bind.call(onceWrapper, state);\n  wrapped.listener = listener;\n  state.wrapFn = wrapped;\n  return wrapped;\n}\n\nEventEmitter.prototype.once = function once(type, listener) {\n  if (typeof listener !== 'function')\n    throw new TypeError('\"listener\" argument must be a function');\n  this.on(type, _onceWrap(this, type, listener));\n  return this;\n};\n\nEventEmitter.prototype.prependOnceListener =\n    function prependOnceListener(type, listener) {\n      if (typeof listener !== 'function')\n        throw new TypeError('\"listener\" argument must be a function');\n      this.prependListener(type, _onceWrap(this, type, listener));\n      return this;\n    };\n\n// Emits a 'removeListener' event if and only if the listener was removed.\nEventEmitter.prototype.removeListener =\n    function removeListener(type, listener) {\n      var list, events, position, i, originalListener;\n\n      if (typeof listener !== 'function')\n        throw new TypeError('\"listener\" argument must be a function');\n\n      events = this._events;\n      if (!events)\n        return this;\n\n      list = events[type];\n      if (!list)\n        return this;\n\n      if (list === listener || list.listener === listener) {\n        if (--this._eventsCount === 0)\n          this._events = objectCreate(null);\n        else {\n          delete events[type];\n          if (events.removeListener)\n            this.emit('removeListener', type, list.listener || listener);\n        }\n      } else if (typeof list !== 'function') {\n        position = -1;\n\n        for (i = list.length - 1; i >= 0; i--) {\n          if (list[i] === listener || list[i].listener === listener) {\n            originalListener = list[i].listener;\n            position = i;\n            break;\n          }\n        }\n\n        if (position < 0)\n          return this;\n\n        if (position === 0)\n          list.shift();\n        else\n          spliceOne(list, position);\n\n        if (list.length === 1)\n          events[type] = list[0];\n\n        if (events.removeListener)\n          this.emit('removeListener', type, originalListener || listener);\n      }\n\n      return this;\n    };\n\nEventEmitter.prototype.removeAllListeners =\n    function removeAllListeners(type) {\n      var listeners, events, i;\n\n      events = this._events;\n      if (!events)\n        return this;\n\n      // not listening for removeListener, no need to emit\n      if (!events.removeListener) {\n        if (arguments.length === 0) {\n          this._events = objectCreate(null);\n          this._eventsCount = 0;\n        } else if (events[type]) {\n          if (--this._eventsCount === 0)\n            this._events = objectCreate(null);\n          else\n            delete events[type];\n        }\n        return this;\n      }\n\n      // emit removeListener for all listeners on all events\n      if (arguments.length === 0) {\n        var keys = objectKeys(events);\n        var key;\n        for (i = 0; i < keys.length; ++i) {\n          key = keys[i];\n          if (key === 'removeListener') continue;\n          this.removeAllListeners(key);\n        }\n        this.removeAllListeners('removeListener');\n        this._events = objectCreate(null);\n        this._eventsCount = 0;\n        return this;\n      }\n\n      listeners = events[type];\n\n      if (typeof listeners === 'function') {\n        this.removeListener(type, listeners);\n      } else if (listeners) {\n        // LIFO order\n        for (i = listeners.length - 1; i >= 0; i--) {\n          this.removeListener(type, listeners[i]);\n        }\n      }\n\n      return this;\n    };\n\nfunction _listeners(target, type, unwrap) {\n  var events = target._events;\n\n  if (!events)\n    return [];\n\n  var evlistener = events[type];\n  if (!evlistener)\n    return [];\n\n  if (typeof evlistener === 'function')\n    return unwrap ? [evlistener.listener || evlistener] : [evlistener];\n\n  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);\n}\n\nEventEmitter.prototype.listeners = function listeners(type) {\n  return _listeners(this, type, true);\n};\n\nEventEmitter.prototype.rawListeners = function rawListeners(type) {\n  return _listeners(this, type, false);\n};\n\nEventEmitter.listenerCount = function(emitter, type) {\n  if (typeof emitter.listenerCount === 'function') {\n    return emitter.listenerCount(type);\n  } else {\n    return listenerCount.call(emitter, type);\n  }\n};\n\nEventEmitter.prototype.listenerCount = listenerCount;\nfunction listenerCount(type) {\n  var events = this._events;\n\n  if (events) {\n    var evlistener = events[type];\n\n    if (typeof evlistener === 'function') {\n      return 1;\n    } else if (evlistener) {\n      return evlistener.length;\n    }\n  }\n\n  return 0;\n}\n\nEventEmitter.prototype.eventNames = function eventNames() {\n  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];\n};\n\n// About 1.5x faster than the two-arg version of Array#splice().\nfunction spliceOne(list, index) {\n  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)\n    list[i] = list[k];\n  list.pop();\n}\n\nfunction arrayClone(arr, n) {\n  var copy = new Array(n);\n  for (var i = 0; i < n; ++i)\n    copy[i] = arr[i];\n  return copy;\n}\n\nfunction unwrapListeners(arr) {\n  var ret = new Array(arr.length);\n  for (var i = 0; i < ret.length; ++i) {\n    ret[i] = arr[i].listener || arr[i];\n  }\n  return ret;\n}\n\nfunction objectCreatePolyfill(proto) {\n  var F = function() {};\n  F.prototype = proto;\n  return new F;\n}\nfunction objectKeysPolyfill(obj) {\n  var keys = [];\n  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {\n    keys.push(k);\n  }\n  return k;\n}\nfunction functionBindPolyfill(context) {\n  var fn = this;\n  return function () {\n    return fn.apply(context, arguments);\n  };\n}\n\n},{}],23:[function(_dereq_,module,exports){\n// shim for using process in browser\nvar process = module.exports = {};\n\n// cached from whatever global is present so that test runners that stub it\n// don't break things.  But we need to wrap it in a try catch in case it is\n// wrapped in strict mode code which doesn't define any globals.  It's inside a\n// function because try/catches deoptimize in certain engines.\n\nvar cachedSetTimeout;\nvar cachedClearTimeout;\n\nfunction defaultSetTimout() {\n    throw new Error('setTimeout has not been defined');\n}\nfunction defaultClearTimeout () {\n    throw new Error('clearTimeout has not been defined');\n}\n(function () {\n    try {\n        if (typeof setTimeout === 'function') {\n            cachedSetTimeout = setTimeout;\n        } else {\n            cachedSetTimeout = defaultSetTimout;\n        }\n    } catch (e) {\n        cachedSetTimeout = defaultSetTimout;\n    }\n    try {\n        if (typeof clearTimeout === 'function') {\n            cachedClearTimeout = clearTimeout;\n        } else {\n            cachedClearTimeout = defaultClearTimeout;\n        }\n    } catch (e) {\n        cachedClearTimeout = defaultClearTimeout;\n    }\n} ())\nfunction runTimeout(fun) {\n    if (cachedSetTimeout === setTimeout) {\n        //normal enviroments in sane situations\n        return setTimeout(fun, 0);\n    }\n    // if setTimeout wasn't available but was latter defined\n    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {\n        cachedSetTimeout = setTimeout;\n        return setTimeout(fun, 0);\n    }\n    try {\n        // when when somebody has screwed with setTimeout but no I.E. maddness\n        return cachedSetTimeout(fun, 0);\n    } catch(e){\n        try {\n            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally\n            return cachedSetTimeout.call(null, fun, 0);\n        } catch(e){\n            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error\n            return cachedSetTimeout.call(this, fun, 0);\n        }\n    }\n\n\n}\nfunction runClearTimeout(marker) {\n    if (cachedClearTimeout === clearTimeout) {\n        //normal enviroments in sane situations\n        return clearTimeout(marker);\n    }\n    // if clearTimeout wasn't available but was latter defined\n    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {\n        cachedClearTimeout = clearTimeout;\n        return clearTimeout(marker);\n    }\n    try {\n        // when when somebody has screwed with setTimeout but no I.E. maddness\n        return cachedClearTimeout(marker);\n    } catch (e){\n        try {\n            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally\n            return cachedClearTimeout.call(null, marker);\n        } catch (e){\n            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.\n            // Some versions of I.E. have different rules for clearTimeout vs setTimeout\n            return cachedClearTimeout.call(this, marker);\n        }\n    }\n\n\n\n}\nvar queue = [];\nvar draining = false;\nvar currentQueue;\nvar queueIndex = -1;\n\nfunction cleanUpNextTick() {\n    if (!draining || !currentQueue) {\n        return;\n    }\n    draining = false;\n    if (currentQueue.length) {\n        queue = currentQueue.concat(queue);\n    } else {\n        queueIndex = -1;\n    }\n    if (queue.length) {\n        drainQueue();\n    }\n}\n\nfunction drainQueue() {\n    if (draining) {\n        return;\n    }\n    var timeout = runTimeout(cleanUpNextTick);\n    draining = true;\n\n    var len = queue.length;\n    while(len) {\n        currentQueue = queue;\n        queue = [];\n        while (++queueIndex < len) {\n            if (currentQueue) {\n                currentQueue[queueIndex].run();\n            }\n        }\n        queueIndex = -1;\n        len = queue.length;\n    }\n    currentQueue = null;\n    draining = false;\n    runClearTimeout(timeout);\n}\n\nprocess.nextTick = function (fun) {\n    var args = new Array(arguments.length - 1);\n    if (arguments.length > 1) {\n        for (var i = 1; i < arguments.length; i++) {\n            args[i - 1] = arguments[i];\n        }\n    }\n    queue.push(new Item(fun, args));\n    if (queue.length === 1 && !draining) {\n        runTimeout(drainQueue);\n    }\n};\n\n// v8 likes predictible objects\nfunction Item(fun, array) {\n    this.fun = fun;\n    this.array = array;\n}\nItem.prototype.run = function () {\n    this.fun.apply(null, this.array);\n};\nprocess.title = 'browser';\nprocess.browser = true;\nprocess.env = {};\nprocess.argv = [];\nprocess.version = ''; // empty string to avoid regexp issues\nprocess.versions = {};\n\nfunction noop() {}\n\nprocess.on = noop;\nprocess.addListener = noop;\nprocess.once = noop;\nprocess.off = noop;\nprocess.removeListener = noop;\nprocess.removeAllListeners = noop;\nprocess.emit = noop;\nprocess.prependListener = noop;\nprocess.prependOnceListener = noop;\n\nprocess.listeners = function (name) { return [] }\n\nprocess.binding = function (name) {\n    throw new Error('process.binding is not supported');\n};\n\nprocess.cwd = function () { return '/' };\nprocess.chdir = function (dir) {\n    throw new Error('process.chdir is not supported');\n};\nprocess.umask = function() { return 0; };\n\n},{}],24:[function(_dereq_,module,exports){\n/*!\n * The buffer module from node.js, for the browser.\n *\n * @author   Feross Aboukhadijeh <https://feross.org>\n * @license  MIT\n */\n/* eslint-disable no-proto */\n\n'use strict'\n\nvar base64 = _dereq_('base64-js')\nvar ieee754 = _dereq_('ieee754')\n\nexports.Buffer = Buffer\nexports.SlowBuffer = SlowBuffer\nexports.INSPECT_MAX_BYTES = 50\n\nvar K_MAX_LENGTH = 0x7fffffff\nexports.kMaxLength = K_MAX_LENGTH\n\n/**\n * If `Buffer.TYPED_ARRAY_SUPPORT`:\n *   === true    Use Uint8Array implementation (fastest)\n *   === false   Print warning and recommend using `buffer` v4.x which has an Object\n *               implementation (most compatible, even IE6)\n *\n * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,\n * Opera 11.6+, iOS 4.2+.\n *\n * We report that the browser does not support typed arrays if the are not subclassable\n * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`\n * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support\n * for __proto__ and has a buggy typed array implementation.\n */\nBuffer.TYPED_ARRAY_SUPPORT = typedArraySupport()\n\nif (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&\n    typeof console.error === 'function') {\n  console.error(\n    'This browser lacks typed array (Uint8Array) support which is required by ' +\n    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'\n  )\n}\n\nfunction typedArraySupport () {\n  // Can typed array instances can be augmented?\n  try {\n    var arr = new Uint8Array(1)\n    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}\n    return arr.foo() === 42\n  } catch (e) {\n    return false\n  }\n}\n\nObject.defineProperty(Buffer.prototype, 'parent', {\n  get: function () {\n    if (!(this instanceof Buffer)) {\n      return undefined\n    }\n    return this.buffer\n  }\n})\n\nObject.defineProperty(Buffer.prototype, 'offset', {\n  get: function () {\n    if (!(this instanceof Buffer)) {\n      return undefined\n    }\n    return this.byteOffset\n  }\n})\n\nfunction createBuffer (length) {\n  if (length > K_MAX_LENGTH) {\n    throw new RangeError('Invalid typed array length')\n  }\n  // Return an augmented `Uint8Array` instance\n  var buf = new Uint8Array(length)\n  buf.__proto__ = Buffer.prototype\n  return buf\n}\n\n/**\n * The Buffer constructor returns instances of `Uint8Array` that have their\n * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of\n * `Uint8Array`, so the returned instances will have all the node `Buffer` methods\n * and the `Uint8Array` methods. Square bracket notation works as expected -- it\n * returns a single octet.\n *\n * The `Uint8Array` prototype remains unmodified.\n */\n\nfunction Buffer (arg, encodingOrOffset, length) {\n  // Common case.\n  if (typeof arg === 'number') {\n    if (typeof encodingOrOffset === 'string') {\n      throw new Error(\n        'If encoding is specified then the first argument must be a string'\n      )\n    }\n    return allocUnsafe(arg)\n  }\n  return from(arg, encodingOrOffset, length)\n}\n\n// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97\nif (typeof Symbol !== 'undefined' && Symbol.species &&\n    Buffer[Symbol.species] === Buffer) {\n  Object.defineProperty(Buffer, Symbol.species, {\n    value: null,\n    configurable: true,\n    enumerable: false,\n    writable: false\n  })\n}\n\nBuffer.poolSize = 8192 // not used by this implementation\n\nfunction from (value, encodingOrOffset, length) {\n  if (typeof value === 'number') {\n    throw new TypeError('\"value\" argument must not be a number')\n  }\n\n  if (isArrayBuffer(value) || (value && isArrayBuffer(value.buffer))) {\n    return fromArrayBuffer(value, encodingOrOffset, length)\n  }\n\n  if (typeof value === 'string') {\n    return fromString(value, encodingOrOffset)\n  }\n\n  return fromObject(value)\n}\n\n/**\n * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError\n * if value is a number.\n * Buffer.from(str[, encoding])\n * Buffer.from(array)\n * Buffer.from(buffer)\n * Buffer.from(arrayBuffer[, byteOffset[, length]])\n **/\nBuffer.from = function (value, encodingOrOffset, length) {\n  return from(value, encodingOrOffset, length)\n}\n\n// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:\n// https://github.com/feross/buffer/pull/148\nBuffer.prototype.__proto__ = Uint8Array.prototype\nBuffer.__proto__ = Uint8Array\n\nfunction assertSize (size) {\n  if (typeof size !== 'number') {\n    throw new TypeError('\"size\" argument must be of type number')\n  } else if (size < 0) {\n    throw new RangeError('\"size\" argument must not be negative')\n  }\n}\n\nfunction alloc (size, fill, encoding) {\n  assertSize(size)\n  if (size <= 0) {\n    return createBuffer(size)\n  }\n  if (fill !== undefined) {\n    // Only pay attention to encoding if it's a string. This\n    // prevents accidentally sending in a number that would\n    // be interpretted as a start offset.\n    return typeof encoding === 'string'\n      ? createBuffer(size).fill(fill, encoding)\n      : createBuffer(size).fill(fill)\n  }\n  return createBuffer(size)\n}\n\n/**\n * Creates a new filled Buffer instance.\n * alloc(size[, fill[, encoding]])\n **/\nBuffer.alloc = function (size, fill, encoding) {\n  return alloc(size, fill, encoding)\n}\n\nfunction allocUnsafe (size) {\n  assertSize(size)\n  return createBuffer(size < 0 ? 0 : checked(size) | 0)\n}\n\n/**\n * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.\n * */\nBuffer.allocUnsafe = function (size) {\n  return allocUnsafe(size)\n}\n/**\n * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.\n */\nBuffer.allocUnsafeSlow = function (size) {\n  return allocUnsafe(size)\n}\n\nfunction fromString (string, encoding) {\n  if (typeof encoding !== 'string' || encoding === '') {\n    encoding = 'utf8'\n  }\n\n  if (!Buffer.isEncoding(encoding)) {\n    throw new TypeError('Unknown encoding: ' + encoding)\n  }\n\n  var length = byteLength(string, encoding) | 0\n  var buf = createBuffer(length)\n\n  var actual = buf.write(string, encoding)\n\n  if (actual !== length) {\n    // Writing a hex string, for example, that contains invalid characters will\n    // cause everything after the first invalid character to be ignored. (e.g.\n    // 'abxxcd' will be treated as 'ab')\n    buf = buf.slice(0, actual)\n  }\n\n  return buf\n}\n\nfunction fromArrayLike (array) {\n  var length = array.length < 0 ? 0 : checked(array.length) | 0\n  var buf = createBuffer(length)\n  for (var i = 0; i < length; i += 1) {\n    buf[i] = array[i] & 255\n  }\n  return buf\n}\n\nfunction fromArrayBuffer (array, byteOffset, length) {\n  if (byteOffset < 0 || array.byteLength < byteOffset) {\n    throw new RangeError('\"offset\" is outside of buffer bounds')\n  }\n\n  if (array.byteLength < byteOffset + (length || 0)) {\n    throw new RangeError('\"length\" is outside of buffer bounds')\n  }\n\n  var buf\n  if (byteOffset === undefined && length === undefined) {\n    buf = new Uint8Array(array)\n  } else if (length === undefined) {\n    buf = new Uint8Array(array, byteOffset)\n  } else {\n    buf = new Uint8Array(array, byteOffset, length)\n  }\n\n  // Return an augmented `Uint8Array` instance\n  buf.__proto__ = Buffer.prototype\n  return buf\n}\n\nfunction fromObject (obj) {\n  if (Buffer.isBuffer(obj)) {\n    var len = checked(obj.length) | 0\n    var buf = createBuffer(len)\n\n    if (buf.length === 0) {\n      return buf\n    }\n\n    obj.copy(buf, 0, 0, len)\n    return buf\n  }\n\n  if (obj) {\n    if (ArrayBuffer.isView(obj) || 'length' in obj) {\n      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {\n        return createBuffer(0)\n      }\n      return fromArrayLike(obj)\n    }\n\n    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {\n      return fromArrayLike(obj.data)\n    }\n  }\n\n  throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.')\n}\n\nfunction checked (length) {\n  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when\n  // length is NaN (which is otherwise coerced to zero.)\n  if (length >= K_MAX_LENGTH) {\n    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +\n                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')\n  }\n  return length | 0\n}\n\nfunction SlowBuffer (length) {\n  if (+length != length) { // eslint-disable-line eqeqeq\n    length = 0\n  }\n  return Buffer.alloc(+length)\n}\n\nBuffer.isBuffer = function isBuffer (b) {\n  return b != null && b._isBuffer === true\n}\n\nBuffer.compare = function compare (a, b) {\n  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {\n    throw new TypeError('Arguments must be Buffers')\n  }\n\n  if (a === b) return 0\n\n  var x = a.length\n  var y = b.length\n\n  for (var i = 0, len = Math.min(x, y); i < len; ++i) {\n    if (a[i] !== b[i]) {\n      x = a[i]\n      y = b[i]\n      break\n    }\n  }\n\n  if (x < y) return -1\n  if (y < x) return 1\n  return 0\n}\n\nBuffer.isEncoding = function isEncoding (encoding) {\n  switch (String(encoding).toLowerCase()) {\n    case 'hex':\n    case 'utf8':\n    case 'utf-8':\n    case 'ascii':\n    case 'latin1':\n    case 'binary':\n    case 'base64':\n    case 'ucs2':\n    case 'ucs-2':\n    case 'utf16le':\n    case 'utf-16le':\n      return true\n    default:\n      return false\n  }\n}\n\nBuffer.concat = function concat (list, length) {\n  if (!Array.isArray(list)) {\n    throw new TypeError('\"list\" argument must be an Array of Buffers')\n  }\n\n  if (list.length === 0) {\n    return Buffer.alloc(0)\n  }\n\n  var i\n  if (length === undefined) {\n    length = 0\n    for (i = 0; i < list.length; ++i) {\n      length += list[i].length\n    }\n  }\n\n  var buffer = Buffer.allocUnsafe(length)\n  var pos = 0\n  for (i = 0; i < list.length; ++i) {\n    var buf = list[i]\n    if (ArrayBuffer.isView(buf)) {\n      buf = Buffer.from(buf)\n    }\n    if (!Buffer.isBuffer(buf)) {\n      throw new TypeError('\"list\" argument must be an Array of Buffers')\n    }\n    buf.copy(buffer, pos)\n    pos += buf.length\n  }\n  return buffer\n}\n\nfunction byteLength (string, encoding) {\n  if (Buffer.isBuffer(string)) {\n    return string.length\n  }\n  if (ArrayBuffer.isView(string) || isArrayBuffer(string)) {\n    return string.byteLength\n  }\n  if (typeof string !== 'string') {\n    string = '' + string\n  }\n\n  var len = string.length\n  if (len === 0) return 0\n\n  // Use a for loop to avoid recursion\n  var loweredCase = false\n  for (;;) {\n    switch (encoding) {\n      case 'ascii':\n      case 'latin1':\n      case 'binary':\n        return len\n      case 'utf8':\n      case 'utf-8':\n      case undefined:\n        return utf8ToBytes(string).length\n      case 'ucs2':\n      case 'ucs-2':\n      case 'utf16le':\n      case 'utf-16le':\n        return len * 2\n      case 'hex':\n        return len >>> 1\n      case 'base64':\n        return base64ToBytes(string).length\n      default:\n        if (loweredCase) return utf8ToBytes(string).length // assume utf8\n        encoding = ('' + encoding).toLowerCase()\n        loweredCase = true\n    }\n  }\n}\nBuffer.byteLength = byteLength\n\nfunction slowToString (encoding, start, end) {\n  var loweredCase = false\n\n  // No need to verify that \"this.length <= MAX_UINT32\" since it's a read-only\n  // property of a typed array.\n\n  // This behaves neither like String nor Uint8Array in that we set start/end\n  // to their upper/lower bounds if the value passed is out of range.\n  // undefined is handled specially as per ECMA-262 6th Edition,\n  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.\n  if (start === undefined || start < 0) {\n    start = 0\n  }\n  // Return early if start > this.length. Done here to prevent potential uint32\n  // coercion fail below.\n  if (start > this.length) {\n    return ''\n  }\n\n  if (end === undefined || end > this.length) {\n    end = this.length\n  }\n\n  if (end <= 0) {\n    return ''\n  }\n\n  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.\n  end >>>= 0\n  start >>>= 0\n\n  if (end <= start) {\n    return ''\n  }\n\n  if (!encoding) encoding = 'utf8'\n\n  while (true) {\n    switch (encoding) {\n      case 'hex':\n        return hexSlice(this, start, end)\n\n      case 'utf8':\n      case 'utf-8':\n        return utf8Slice(this, start, end)\n\n      case 'ascii':\n        return asciiSlice(this, start, end)\n\n      case 'latin1':\n      case 'binary':\n        return latin1Slice(this, start, end)\n\n      case 'base64':\n        return base64Slice(this, start, end)\n\n      case 'ucs2':\n      case 'ucs-2':\n      case 'utf16le':\n      case 'utf-16le':\n        return utf16leSlice(this, start, end)\n\n      default:\n        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)\n        encoding = (encoding + '').toLowerCase()\n        loweredCase = true\n    }\n  }\n}\n\n// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)\n// to detect a Buffer instance. It's not possible to use `instanceof Buffer`\n// reliably in a browserify context because there could be multiple different\n// copies of the 'buffer' package in use. This method works even for Buffer\n// instances that were created from another copy of the `buffer` package.\n// See: https://github.com/feross/buffer/issues/154\nBuffer.prototype._isBuffer = true\n\nfunction swap (b, n, m) {\n  var i = b[n]\n  b[n] = b[m]\n  b[m] = i\n}\n\nBuffer.prototype.swap16 = function swap16 () {\n  var len = this.length\n  if (len % 2 !== 0) {\n    throw new RangeError('Buffer size must be a multiple of 16-bits')\n  }\n  for (var i = 0; i < len; i += 2) {\n    swap(this, i, i + 1)\n  }\n  return this\n}\n\nBuffer.prototype.swap32 = function swap32 () {\n  var len = this.length\n  if (len % 4 !== 0) {\n    throw new RangeError('Buffer size must be a multiple of 32-bits')\n  }\n  for (var i = 0; i < len; i += 4) {\n    swap(this, i, i + 3)\n    swap(this, i + 1, i + 2)\n  }\n  return this\n}\n\nBuffer.prototype.swap64 = function swap64 () {\n  var len = this.length\n  if (len % 8 !== 0) {\n    throw new RangeError('Buffer size must be a multiple of 64-bits')\n  }\n  for (var i = 0; i < len; i += 8) {\n    swap(this, i, i + 7)\n    swap(this, i + 1, i + 6)\n    swap(this, i + 2, i + 5)\n    swap(this, i + 3, i + 4)\n  }\n  return this\n}\n\nBuffer.prototype.toString = function toString () {\n  var length = this.length\n  if (length === 0) return ''\n  if (arguments.length === 0) return utf8Slice(this, 0, length)\n  return slowToString.apply(this, arguments)\n}\n\nBuffer.prototype.toLocaleString = Buffer.prototype.toString\n\nBuffer.prototype.equals = function equals (b) {\n  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')\n  if (this === b) return true\n  return Buffer.compare(this, b) === 0\n}\n\nBuffer.prototype.inspect = function inspect () {\n  var str = ''\n  var max = exports.INSPECT_MAX_BYTES\n  if (this.length > 0) {\n    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')\n    if (this.length > max) str += ' ... '\n  }\n  return '<Buffer ' + str + '>'\n}\n\nBuffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {\n  if (!Buffer.isBuffer(target)) {\n    throw new TypeError('Argument must be a Buffer')\n  }\n\n  if (start === undefined) {\n    start = 0\n  }\n  if (end === undefined) {\n    end = target ? target.length : 0\n  }\n  if (thisStart === undefined) {\n    thisStart = 0\n  }\n  if (thisEnd === undefined) {\n    thisEnd = this.length\n  }\n\n  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {\n    throw new RangeError('out of range index')\n  }\n\n  if (thisStart >= thisEnd && start >= end) {\n    return 0\n  }\n  if (thisStart >= thisEnd) {\n    return -1\n  }\n  if (start >= end) {\n    return 1\n  }\n\n  start >>>= 0\n  end >>>= 0\n  thisStart >>>= 0\n  thisEnd >>>= 0\n\n  if (this === target) return 0\n\n  var x = thisEnd - thisStart\n  var y = end - start\n  var len = Math.min(x, y)\n\n  var thisCopy = this.slice(thisStart, thisEnd)\n  var targetCopy = target.slice(start, end)\n\n  for (var i = 0; i < len; ++i) {\n    if (thisCopy[i] !== targetCopy[i]) {\n      x = thisCopy[i]\n      y = targetCopy[i]\n      break\n    }\n  }\n\n  if (x < y) return -1\n  if (y < x) return 1\n  return 0\n}\n\n// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,\n// OR the last index of `val` in `buffer` at offset <= `byteOffset`.\n//\n// Arguments:\n// - buffer - a Buffer to search\n// - val - a string, Buffer, or number\n// - byteOffset - an index into `buffer`; will be clamped to an int32\n// - encoding - an optional encoding, relevant is val is a string\n// - dir - true for indexOf, false for lastIndexOf\nfunction bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {\n  // Empty buffer means no match\n  if (buffer.length === 0) return -1\n\n  // Normalize byteOffset\n  if (typeof byteOffset === 'string') {\n    encoding = byteOffset\n    byteOffset = 0\n  } else if (byteOffset > 0x7fffffff) {\n    byteOffset = 0x7fffffff\n  } else if (byteOffset < -0x80000000) {\n    byteOffset = -0x80000000\n  }\n  byteOffset = +byteOffset  // Coerce to Number.\n  if (numberIsNaN(byteOffset)) {\n    // byteOffset: it it's undefined, null, NaN, \"foo\", etc, search whole buffer\n    byteOffset = dir ? 0 : (buffer.length - 1)\n  }\n\n  // Normalize byteOffset: negative offsets start from the end of the buffer\n  if (byteOffset < 0) byteOffset = buffer.length + byteOffset\n  if (byteOffset >= buffer.length) {\n    if (dir) return -1\n    else byteOffset = buffer.length - 1\n  } else if (byteOffset < 0) {\n    if (dir) byteOffset = 0\n    else return -1\n  }\n\n  // Normalize val\n  if (typeof val === 'string') {\n    val = Buffer.from(val, encoding)\n  }\n\n  // Finally, search either indexOf (if dir is true) or lastIndexOf\n  if (Buffer.isBuffer(val)) {\n    // Special case: looking for empty string/buffer always fails\n    if (val.length === 0) {\n      return -1\n    }\n    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)\n  } else if (typeof val === 'number') {\n    val = val & 0xFF // Search for a byte value [0-255]\n    if (typeof Uint8Array.prototype.indexOf === 'function') {\n      if (dir) {\n        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)\n      } else {\n        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)\n      }\n    }\n    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)\n  }\n\n  throw new TypeError('val must be string, number or Buffer')\n}\n\nfunction arrayIndexOf (arr, val, byteOffset, encoding, dir) {\n  var indexSize = 1\n  var arrLength = arr.length\n  var valLength = val.length\n\n  if (encoding !== undefined) {\n    encoding = String(encoding).toLowerCase()\n    if (encoding === 'ucs2' || encoding === 'ucs-2' ||\n        encoding === 'utf16le' || encoding === 'utf-16le') {\n      if (arr.length < 2 || val.length < 2) {\n        return -1\n      }\n      indexSize = 2\n      arrLength /= 2\n      valLength /= 2\n      byteOffset /= 2\n    }\n  }\n\n  function read (buf, i) {\n    if (indexSize === 1) {\n      return buf[i]\n    } else {\n      return buf.readUInt16BE(i * indexSize)\n    }\n  }\n\n  var i\n  if (dir) {\n    var foundIndex = -1\n    for (i = byteOffset; i < arrLength; i++) {\n      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {\n        if (foundIndex === -1) foundIndex = i\n        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize\n      } else {\n        if (foundIndex !== -1) i -= i - foundIndex\n        foundIndex = -1\n      }\n    }\n  } else {\n    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength\n    for (i = byteOffset; i >= 0; i--) {\n      var found = true\n      for (var j = 0; j < valLength; j++) {\n        if (read(arr, i + j) !== read(val, j)) {\n          found = false\n          break\n        }\n      }\n      if (found) return i\n    }\n  }\n\n  return -1\n}\n\nBuffer.prototype.includes = function includes (val, byteOffset, encoding) {\n  return this.indexOf(val, byteOffset, encoding) !== -1\n}\n\nBuffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {\n  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)\n}\n\nBuffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {\n  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)\n}\n\nfunction hexWrite (buf, string, offset, length) {\n  offset = Number(offset) || 0\n  var remaining = buf.length - offset\n  if (!length) {\n    length = remaining\n  } else {\n    length = Number(length)\n    if (length > remaining) {\n      length = remaining\n    }\n  }\n\n  var strLen = string.length\n\n  if (length > strLen / 2) {\n    length = strLen / 2\n  }\n  for (var i = 0; i < length; ++i) {\n    var parsed = parseInt(string.substr(i * 2, 2), 16)\n    if (numberIsNaN(parsed)) return i\n    buf[offset + i] = parsed\n  }\n  return i\n}\n\nfunction utf8Write (buf, string, offset, length) {\n  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)\n}\n\nfunction asciiWrite (buf, string, offset, length) {\n  return blitBuffer(asciiToBytes(string), buf, offset, length)\n}\n\nfunction latin1Write (buf, string, offset, length) {\n  return asciiWrite(buf, string, offset, length)\n}\n\nfunction base64Write (buf, string, offset, length) {\n  return blitBuffer(base64ToBytes(string), buf, offset, length)\n}\n\nfunction ucs2Write (buf, string, offset, length) {\n  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)\n}\n\nBuffer.prototype.write = function write (string, offset, length, encoding) {\n  // Buffer#write(string)\n  if (offset === undefined) {\n    encoding = 'utf8'\n    length = this.length\n    offset = 0\n  // Buffer#write(string, encoding)\n  } else if (length === undefined && typeof offset === 'string') {\n    encoding = offset\n    length = this.length\n    offset = 0\n  // Buffer#write(string, offset[, length][, encoding])\n  } else if (isFinite(offset)) {\n    offset = offset >>> 0\n    if (isFinite(length)) {\n      length = length >>> 0\n      if (encoding === undefined) encoding = 'utf8'\n    } else {\n      encoding = length\n      length = undefined\n    }\n  } else {\n    throw new Error(\n      'Buffer.write(string, encoding, offset[, length]) is no longer supported'\n    )\n  }\n\n  var remaining = this.length - offset\n  if (length === undefined || length > remaining) length = remaining\n\n  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {\n    throw new RangeError('Attempt to write outside buffer bounds')\n  }\n\n  if (!encoding) encoding = 'utf8'\n\n  var loweredCase = false\n  for (;;) {\n    switch (encoding) {\n      case 'hex':\n        return hexWrite(this, string, offset, length)\n\n      case 'utf8':\n      case 'utf-8':\n        return utf8Write(this, string, offset, length)\n\n      case 'ascii':\n        return asciiWrite(this, string, offset, length)\n\n      case 'latin1':\n      case 'binary':\n        return latin1Write(this, string, offset, length)\n\n      case 'base64':\n        // Warning: maxLength not taken into account in base64Write\n        return base64Write(this, string, offset, length)\n\n      case 'ucs2':\n      case 'ucs-2':\n      case 'utf16le':\n      case 'utf-16le':\n        return ucs2Write(this, string, offset, length)\n\n      default:\n        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)\n        encoding = ('' + encoding).toLowerCase()\n        loweredCase = true\n    }\n  }\n}\n\nBuffer.prototype.toJSON = function toJSON () {\n  return {\n    type: 'Buffer',\n    data: Array.prototype.slice.call(this._arr || this, 0)\n  }\n}\n\nfunction base64Slice (buf, start, end) {\n  if (start === 0 && end === buf.length) {\n    return base64.fromByteArray(buf)\n  } else {\n    return base64.fromByteArray(buf.slice(start, end))\n  }\n}\n\nfunction utf8Slice (buf, start, end) {\n  end = Math.min(buf.length, end)\n  var res = []\n\n  var i = start\n  while (i < end) {\n    var firstByte = buf[i]\n    var codePoint = null\n    var bytesPerSequence = (firstByte > 0xEF) ? 4\n      : (firstByte > 0xDF) ? 3\n      : (firstByte > 0xBF) ? 2\n      : 1\n\n    if (i + bytesPerSequence <= end) {\n      var secondByte, thirdByte, fourthByte, tempCodePoint\n\n      switch (bytesPerSequence) {\n        case 1:\n          if (firstByte < 0x80) {\n            codePoint = firstByte\n          }\n          break\n        case 2:\n          secondByte = buf[i + 1]\n          if ((secondByte & 0xC0) === 0x80) {\n            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)\n            if (tempCodePoint > 0x7F) {\n              codePoint = tempCodePoint\n            }\n          }\n          break\n        case 3:\n          secondByte = buf[i + 1]\n          thirdByte = buf[i + 2]\n          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {\n            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)\n            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {\n              codePoint = tempCodePoint\n            }\n          }\n          break\n        case 4:\n          secondByte = buf[i + 1]\n          thirdByte = buf[i + 2]\n          fourthByte = buf[i + 3]\n          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {\n            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)\n            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {\n              codePoint = tempCodePoint\n            }\n          }\n      }\n    }\n\n    if (codePoint === null) {\n      // we did not generate a valid codePoint so insert a\n      // replacement char (U+FFFD) and advance only 1 byte\n      codePoint = 0xFFFD\n      bytesPerSequence = 1\n    } else if (codePoint > 0xFFFF) {\n      // encode to utf16 (surrogate pair dance)\n      codePoint -= 0x10000\n      res.push(codePoint >>> 10 & 0x3FF | 0xD800)\n      codePoint = 0xDC00 | codePoint & 0x3FF\n    }\n\n    res.push(codePoint)\n    i += bytesPerSequence\n  }\n\n  return decodeCodePointsArray(res)\n}\n\n// Based on http://stackoverflow.com/a/22747272/680742, the browser with\n// the lowest limit is Chrome, with 0x10000 args.\n// We go 1 magnitude less, for safety\nvar MAX_ARGUMENTS_LENGTH = 0x1000\n\nfunction decodeCodePointsArray (codePoints) {\n  var len = codePoints.length\n  if (len <= MAX_ARGUMENTS_LENGTH) {\n    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()\n  }\n\n  // Decode in chunks to avoid \"call stack size exceeded\".\n  var res = ''\n  var i = 0\n  while (i < len) {\n    res += String.fromCharCode.apply(\n      String,\n      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)\n    )\n  }\n  return res\n}\n\nfunction asciiSlice (buf, start, end) {\n  var ret = ''\n  end = Math.min(buf.length, end)\n\n  for (var i = start; i < end; ++i) {\n    ret += String.fromCharCode(buf[i] & 0x7F)\n  }\n  return ret\n}\n\nfunction latin1Slice (buf, start, end) {\n  var ret = ''\n  end = Math.min(buf.length, end)\n\n  for (var i = start; i < end; ++i) {\n    ret += String.fromCharCode(buf[i])\n  }\n  return ret\n}\n\nfunction hexSlice (buf, start, end) {\n  var len = buf.length\n\n  if (!start || start < 0) start = 0\n  if (!end || end < 0 || end > len) end = len\n\n  var out = ''\n  for (var i = start; i < end; ++i) {\n    out += toHex(buf[i])\n  }\n  return out\n}\n\nfunction utf16leSlice (buf, start, end) {\n  var bytes = buf.slice(start, end)\n  var res = ''\n  for (var i = 0; i < bytes.length; i += 2) {\n    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))\n  }\n  return res\n}\n\nBuffer.prototype.slice = function slice (start, end) {\n  var len = this.length\n  start = ~~start\n  end = end === undefined ? len : ~~end\n\n  if (start < 0) {\n    start += len\n    if (start < 0) start = 0\n  } else if (start > len) {\n    start = len\n  }\n\n  if (end < 0) {\n    end += len\n    if (end < 0) end = 0\n  } else if (end > len) {\n    end = len\n  }\n\n  if (end < start) end = start\n\n  var newBuf = this.subarray(start, end)\n  // Return an augmented `Uint8Array` instance\n  newBuf.__proto__ = Buffer.prototype\n  return newBuf\n}\n\n/*\n * Need to make sure that buffer isn't trying to write out of bounds.\n */\nfunction checkOffset (offset, ext, length) {\n  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')\n  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')\n}\n\nBuffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {\n  offset = offset >>> 0\n  byteLength = byteLength >>> 0\n  if (!noAssert) checkOffset(offset, byteLength, this.length)\n\n  var val = this[offset]\n  var mul = 1\n  var i = 0\n  while (++i < byteLength && (mul *= 0x100)) {\n    val += this[offset + i] * mul\n  }\n\n  return val\n}\n\nBuffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {\n  offset = offset >>> 0\n  byteLength = byteLength >>> 0\n  if (!noAssert) {\n    checkOffset(offset, byteLength, this.length)\n  }\n\n  var val = this[offset + --byteLength]\n  var mul = 1\n  while (byteLength > 0 && (mul *= 0x100)) {\n    val += this[offset + --byteLength] * mul\n  }\n\n  return val\n}\n\nBuffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 1, this.length)\n  return this[offset]\n}\n\nBuffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 2, this.length)\n  return this[offset] | (this[offset + 1] << 8)\n}\n\nBuffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 2, this.length)\n  return (this[offset] << 8) | this[offset + 1]\n}\n\nBuffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 4, this.length)\n\n  return ((this[offset]) |\n      (this[offset + 1] << 8) |\n      (this[offset + 2] << 16)) +\n      (this[offset + 3] * 0x1000000)\n}\n\nBuffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 4, this.length)\n\n  return (this[offset] * 0x1000000) +\n    ((this[offset + 1] << 16) |\n    (this[offset + 2] << 8) |\n    this[offset + 3])\n}\n\nBuffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {\n  offset = offset >>> 0\n  byteLength = byteLength >>> 0\n  if (!noAssert) checkOffset(offset, byteLength, this.length)\n\n  var val = this[offset]\n  var mul = 1\n  var i = 0\n  while (++i < byteLength && (mul *= 0x100)) {\n    val += this[offset + i] * mul\n  }\n  mul *= 0x80\n\n  if (val >= mul) val -= Math.pow(2, 8 * byteLength)\n\n  return val\n}\n\nBuffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {\n  offset = offset >>> 0\n  byteLength = byteLength >>> 0\n  if (!noAssert) checkOffset(offset, byteLength, this.length)\n\n  var i = byteLength\n  var mul = 1\n  var val = this[offset + --i]\n  while (i > 0 && (mul *= 0x100)) {\n    val += this[offset + --i] * mul\n  }\n  mul *= 0x80\n\n  if (val >= mul) val -= Math.pow(2, 8 * byteLength)\n\n  return val\n}\n\nBuffer.prototype.readInt8 = function readInt8 (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 1, this.length)\n  if (!(this[offset] & 0x80)) return (this[offset])\n  return ((0xff - this[offset] + 1) * -1)\n}\n\nBuffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 2, this.length)\n  var val = this[offset] | (this[offset + 1] << 8)\n  return (val & 0x8000) ? val | 0xFFFF0000 : val\n}\n\nBuffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 2, this.length)\n  var val = this[offset + 1] | (this[offset] << 8)\n  return (val & 0x8000) ? val | 0xFFFF0000 : val\n}\n\nBuffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 4, this.length)\n\n  return (this[offset]) |\n    (this[offset + 1] << 8) |\n    (this[offset + 2] << 16) |\n    (this[offset + 3] << 24)\n}\n\nBuffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 4, this.length)\n\n  return (this[offset] << 24) |\n    (this[offset + 1] << 16) |\n    (this[offset + 2] << 8) |\n    (this[offset + 3])\n}\n\nBuffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 4, this.length)\n  return ieee754.read(this, offset, true, 23, 4)\n}\n\nBuffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 4, this.length)\n  return ieee754.read(this, offset, false, 23, 4)\n}\n\nBuffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 8, this.length)\n  return ieee754.read(this, offset, true, 52, 8)\n}\n\nBuffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {\n  offset = offset >>> 0\n  if (!noAssert) checkOffset(offset, 8, this.length)\n  return ieee754.read(this, offset, false, 52, 8)\n}\n\nfunction checkInt (buf, value, offset, ext, max, min) {\n  if (!Buffer.isBuffer(buf)) throw new TypeError('\"buffer\" argument must be a Buffer instance')\n  if (value > max || value < min) throw new RangeError('\"value\" argument is out of bounds')\n  if (offset + ext > buf.length) throw new RangeError('Index out of range')\n}\n\nBuffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  byteLength = byteLength >>> 0\n  if (!noAssert) {\n    var maxBytes = Math.pow(2, 8 * byteLength) - 1\n    checkInt(this, value, offset, byteLength, maxBytes, 0)\n  }\n\n  var mul = 1\n  var i = 0\n  this[offset] = value & 0xFF\n  while (++i < byteLength && (mul *= 0x100)) {\n    this[offset + i] = (value / mul) & 0xFF\n  }\n\n  return offset + byteLength\n}\n\nBuffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  byteLength = byteLength >>> 0\n  if (!noAssert) {\n    var maxBytes = Math.pow(2, 8 * byteLength) - 1\n    checkInt(this, value, offset, byteLength, maxBytes, 0)\n  }\n\n  var i = byteLength - 1\n  var mul = 1\n  this[offset + i] = value & 0xFF\n  while (--i >= 0 && (mul *= 0x100)) {\n    this[offset + i] = (value / mul) & 0xFF\n  }\n\n  return offset + byteLength\n}\n\nBuffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)\n  this[offset] = (value & 0xff)\n  return offset + 1\n}\n\nBuffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)\n  this[offset] = (value & 0xff)\n  this[offset + 1] = (value >>> 8)\n  return offset + 2\n}\n\nBuffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)\n  this[offset] = (value >>> 8)\n  this[offset + 1] = (value & 0xff)\n  return offset + 2\n}\n\nBuffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)\n  this[offset + 3] = (value >>> 24)\n  this[offset + 2] = (value >>> 16)\n  this[offset + 1] = (value >>> 8)\n  this[offset] = (value & 0xff)\n  return offset + 4\n}\n\nBuffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)\n  this[offset] = (value >>> 24)\n  this[offset + 1] = (value >>> 16)\n  this[offset + 2] = (value >>> 8)\n  this[offset + 3] = (value & 0xff)\n  return offset + 4\n}\n\nBuffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) {\n    var limit = Math.pow(2, (8 * byteLength) - 1)\n\n    checkInt(this, value, offset, byteLength, limit - 1, -limit)\n  }\n\n  var i = 0\n  var mul = 1\n  var sub = 0\n  this[offset] = value & 0xFF\n  while (++i < byteLength && (mul *= 0x100)) {\n    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {\n      sub = 1\n    }\n    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF\n  }\n\n  return offset + byteLength\n}\n\nBuffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) {\n    var limit = Math.pow(2, (8 * byteLength) - 1)\n\n    checkInt(this, value, offset, byteLength, limit - 1, -limit)\n  }\n\n  var i = byteLength - 1\n  var mul = 1\n  var sub = 0\n  this[offset + i] = value & 0xFF\n  while (--i >= 0 && (mul *= 0x100)) {\n    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {\n      sub = 1\n    }\n    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF\n  }\n\n  return offset + byteLength\n}\n\nBuffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)\n  if (value < 0) value = 0xff + value + 1\n  this[offset] = (value & 0xff)\n  return offset + 1\n}\n\nBuffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)\n  this[offset] = (value & 0xff)\n  this[offset + 1] = (value >>> 8)\n  return offset + 2\n}\n\nBuffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)\n  this[offset] = (value >>> 8)\n  this[offset + 1] = (value & 0xff)\n  return offset + 2\n}\n\nBuffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)\n  this[offset] = (value & 0xff)\n  this[offset + 1] = (value >>> 8)\n  this[offset + 2] = (value >>> 16)\n  this[offset + 3] = (value >>> 24)\n  return offset + 4\n}\n\nBuffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)\n  if (value < 0) value = 0xffffffff + value + 1\n  this[offset] = (value >>> 24)\n  this[offset + 1] = (value >>> 16)\n  this[offset + 2] = (value >>> 8)\n  this[offset + 3] = (value & 0xff)\n  return offset + 4\n}\n\nfunction checkIEEE754 (buf, value, offset, ext, max, min) {\n  if (offset + ext > buf.length) throw new RangeError('Index out of range')\n  if (offset < 0) throw new RangeError('Index out of range')\n}\n\nfunction writeFloat (buf, value, offset, littleEndian, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) {\n    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)\n  }\n  ieee754.write(buf, value, offset, littleEndian, 23, 4)\n  return offset + 4\n}\n\nBuffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {\n  return writeFloat(this, value, offset, true, noAssert)\n}\n\nBuffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {\n  return writeFloat(this, value, offset, false, noAssert)\n}\n\nfunction writeDouble (buf, value, offset, littleEndian, noAssert) {\n  value = +value\n  offset = offset >>> 0\n  if (!noAssert) {\n    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)\n  }\n  ieee754.write(buf, value, offset, littleEndian, 52, 8)\n  return offset + 8\n}\n\nBuffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {\n  return writeDouble(this, value, offset, true, noAssert)\n}\n\nBuffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {\n  return writeDouble(this, value, offset, false, noAssert)\n}\n\n// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)\nBuffer.prototype.copy = function copy (target, targetStart, start, end) {\n  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')\n  if (!start) start = 0\n  if (!end && end !== 0) end = this.length\n  if (targetStart >= target.length) targetStart = target.length\n  if (!targetStart) targetStart = 0\n  if (end > 0 && end < start) end = start\n\n  // Copy 0 bytes; we're done\n  if (end === start) return 0\n  if (target.length === 0 || this.length === 0) return 0\n\n  // Fatal error conditions\n  if (targetStart < 0) {\n    throw new RangeError('targetStart out of bounds')\n  }\n  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')\n  if (end < 0) throw new RangeError('sourceEnd out of bounds')\n\n  // Are we oob?\n  if (end > this.length) end = this.length\n  if (target.length - targetStart < end - start) {\n    end = target.length - targetStart + start\n  }\n\n  var len = end - start\n\n  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {\n    // Use built-in when available, missing from IE11\n    this.copyWithin(targetStart, start, end)\n  } else if (this === target && start < targetStart && targetStart < end) {\n    // descending copy from end\n    for (var i = len - 1; i >= 0; --i) {\n      target[i + targetStart] = this[i + start]\n    }\n  } else {\n    Uint8Array.prototype.set.call(\n      target,\n      this.subarray(start, end),\n      targetStart\n    )\n  }\n\n  return len\n}\n\n// Usage:\n//    buffer.fill(number[, offset[, end]])\n//    buffer.fill(buffer[, offset[, end]])\n//    buffer.fill(string[, offset[, end]][, encoding])\nBuffer.prototype.fill = function fill (val, start, end, encoding) {\n  // Handle string cases:\n  if (typeof val === 'string') {\n    if (typeof start === 'string') {\n      encoding = start\n      start = 0\n      end = this.length\n    } else if (typeof end === 'string') {\n      encoding = end\n      end = this.length\n    }\n    if (encoding !== undefined && typeof encoding !== 'string') {\n      throw new TypeError('encoding must be a string')\n    }\n    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {\n      throw new TypeError('Unknown encoding: ' + encoding)\n    }\n    if (val.length === 1) {\n      var code = val.charCodeAt(0)\n      if ((encoding === 'utf8' && code < 128) ||\n          encoding === 'latin1') {\n        // Fast path: If `val` fits into a single byte, use that numeric value.\n        val = code\n      }\n    }\n  } else if (typeof val === 'number') {\n    val = val & 255\n  }\n\n  // Invalid ranges are not set to a default, so can range check early.\n  if (start < 0 || this.length < start || this.length < end) {\n    throw new RangeError('Out of range index')\n  }\n\n  if (end <= start) {\n    return this\n  }\n\n  start = start >>> 0\n  end = end === undefined ? this.length : end >>> 0\n\n  if (!val) val = 0\n\n  var i\n  if (typeof val === 'number') {\n    for (i = start; i < end; ++i) {\n      this[i] = val\n    }\n  } else {\n    var bytes = Buffer.isBuffer(val)\n      ? val\n      : new Buffer(val, encoding)\n    var len = bytes.length\n    if (len === 0) {\n      throw new TypeError('The value \"' + val +\n        '\" is invalid for argument \"value\"')\n    }\n    for (i = 0; i < end - start; ++i) {\n      this[i + start] = bytes[i % len]\n    }\n  }\n\n  return this\n}\n\n// HELPER FUNCTIONS\n// ================\n\nvar INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g\n\nfunction base64clean (str) {\n  // Node takes equal signs as end of the Base64 encoding\n  str = str.split('=')[0]\n  // Node strips out invalid characters like \\n and \\t from the string, base64-js does not\n  str = str.trim().replace(INVALID_BASE64_RE, '')\n  // Node converts strings with length < 2 to ''\n  if (str.length < 2) return ''\n  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not\n  while (str.length % 4 !== 0) {\n    str = str + '='\n  }\n  return str\n}\n\nfunction toHex (n) {\n  if (n < 16) return '0' + n.toString(16)\n  return n.toString(16)\n}\n\nfunction utf8ToBytes (string, units) {\n  units = units || Infinity\n  var codePoint\n  var length = string.length\n  var leadSurrogate = null\n  var bytes = []\n\n  for (var i = 0; i < length; ++i) {\n    codePoint = string.charCodeAt(i)\n\n    // is surrogate component\n    if (codePoint > 0xD7FF && codePoint < 0xE000) {\n      // last char was a lead\n      if (!leadSurrogate) {\n        // no lead yet\n        if (codePoint > 0xDBFF) {\n          // unexpected trail\n          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)\n          continue\n        } else if (i + 1 === length) {\n          // unpaired lead\n          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)\n          continue\n        }\n\n        // valid lead\n        leadSurrogate = codePoint\n\n        continue\n      }\n\n      // 2 leads in a row\n      if (codePoint < 0xDC00) {\n        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)\n        leadSurrogate = codePoint\n        continue\n      }\n\n      // valid surrogate pair\n      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000\n    } else if (leadSurrogate) {\n      // valid bmp char, but last char was a lead\n      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)\n    }\n\n    leadSurrogate = null\n\n    // encode utf8\n    if (codePoint < 0x80) {\n      if ((units -= 1) < 0) break\n      bytes.push(codePoint)\n    } else if (codePoint < 0x800) {\n      if ((units -= 2) < 0) break\n      bytes.push(\n        codePoint >> 0x6 | 0xC0,\n        codePoint & 0x3F | 0x80\n      )\n    } else if (codePoint < 0x10000) {\n      if ((units -= 3) < 0) break\n      bytes.push(\n        codePoint >> 0xC | 0xE0,\n        codePoint >> 0x6 & 0x3F | 0x80,\n        codePoint & 0x3F | 0x80\n      )\n    } else if (codePoint < 0x110000) {\n      if ((units -= 4) < 0) break\n      bytes.push(\n        codePoint >> 0x12 | 0xF0,\n        codePoint >> 0xC & 0x3F | 0x80,\n        codePoint >> 0x6 & 0x3F | 0x80,\n        codePoint & 0x3F | 0x80\n      )\n    } else {\n      throw new Error('Invalid code point')\n    }\n  }\n\n  return bytes\n}\n\nfunction asciiToBytes (str) {\n  var byteArray = []\n  for (var i = 0; i < str.length; ++i) {\n    // Node's code seems to be doing this and not & 0x7F..\n    byteArray.push(str.charCodeAt(i) & 0xFF)\n  }\n  return byteArray\n}\n\nfunction utf16leToBytes (str, units) {\n  var c, hi, lo\n  var byteArray = []\n  for (var i = 0; i < str.length; ++i) {\n    if ((units -= 2) < 0) break\n\n    c = str.charCodeAt(i)\n    hi = c >> 8\n    lo = c % 256\n    byteArray.push(lo)\n    byteArray.push(hi)\n  }\n\n  return byteArray\n}\n\nfunction base64ToBytes (str) {\n  return base64.toByteArray(base64clean(str))\n}\n\nfunction blitBuffer (src, dst, offset, length) {\n  for (var i = 0; i < length; ++i) {\n    if ((i + offset >= dst.length) || (i >= src.length)) break\n    dst[i + offset] = src[i]\n  }\n  return i\n}\n\n// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check\n// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166\nfunction isArrayBuffer (obj) {\n  return obj instanceof ArrayBuffer ||\n    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&\n      typeof obj.byteLength === 'number')\n}\n\nfunction numberIsNaN (obj) {\n  return obj !== obj // eslint-disable-line no-self-compare\n}\n\n},{\"base64-js\":20,\"ieee754\":127}],25:[function(_dereq_,module,exports){\nvar core = _dereq_('../../modules/_core');\nvar $JSON = core.JSON || (core.JSON = { stringify: JSON.stringify });\nmodule.exports = function stringify(it) { // eslint-disable-line no-unused-vars\n  return $JSON.stringify.apply($JSON, arguments);\n};\n\n},{\"../../modules/_core\":42}],26:[function(_dereq_,module,exports){\n_dereq_('../../modules/es6.object.assign');\nmodule.exports = _dereq_('../../modules/_core').Object.assign;\n\n},{\"../../modules/_core\":42,\"../../modules/es6.object.assign\":110}],27:[function(_dereq_,module,exports){\n_dereq_('../../modules/es6.object.create');\nvar $Object = _dereq_('../../modules/_core').Object;\nmodule.exports = function create(P, D) {\n  return $Object.create(P, D);\n};\n\n},{\"../../modules/_core\":42,\"../../modules/es6.object.create\":111}],28:[function(_dereq_,module,exports){\n_dereq_('../../modules/es6.object.define-property');\nvar $Object = _dereq_('../../modules/_core').Object;\nmodule.exports = function defineProperty(it, key, desc) {\n  return $Object.defineProperty(it, key, desc);\n};\n\n},{\"../../modules/_core\":42,\"../../modules/es6.object.define-property\":112}],29:[function(_dereq_,module,exports){\n_dereq_('../../modules/es6.object.get-own-property-descriptor');\nvar $Object = _dereq_('../../modules/_core').Object;\nmodule.exports = function getOwnPropertyDescriptor(it, key) {\n  return $Object.getOwnPropertyDescriptor(it, key);\n};\n\n},{\"../../modules/_core\":42,\"../../modules/es6.object.get-own-property-descriptor\":113}],30:[function(_dereq_,module,exports){\n_dereq_('../../modules/es6.object.get-prototype-of');\nmodule.exports = _dereq_('../../modules/_core').Object.getPrototypeOf;\n\n},{\"../../modules/_core\":42,\"../../modules/es6.object.get-prototype-of\":114}],31:[function(_dereq_,module,exports){\n_dereq_('../../modules/es6.object.set-prototype-of');\nmodule.exports = _dereq_('../../modules/_core').Object.setPrototypeOf;\n\n},{\"../../modules/_core\":42,\"../../modules/es6.object.set-prototype-of\":115}],32:[function(_dereq_,module,exports){\n_dereq_('../modules/es6.object.to-string');\n_dereq_('../modules/es6.string.iterator');\n_dereq_('../modules/web.dom.iterable');\n_dereq_('../modules/es6.promise');\n_dereq_('../modules/es7.promise.finally');\n_dereq_('../modules/es7.promise.try');\nmodule.exports = _dereq_('../modules/_core').Promise;\n\n},{\"../modules/_core\":42,\"../modules/es6.object.to-string\":116,\"../modules/es6.promise\":117,\"../modules/es6.string.iterator\":118,\"../modules/es7.promise.finally\":120,\"../modules/es7.promise.try\":121,\"../modules/web.dom.iterable\":124}],33:[function(_dereq_,module,exports){\n_dereq_('../../modules/es6.symbol');\n_dereq_('../../modules/es6.object.to-string');\n_dereq_('../../modules/es7.symbol.async-iterator');\n_dereq_('../../modules/es7.symbol.observable');\nmodule.exports = _dereq_('../../modules/_core').Symbol;\n\n},{\"../../modules/_core\":42,\"../../modules/es6.object.to-string\":116,\"../../modules/es6.symbol\":119,\"../../modules/es7.symbol.async-iterator\":122,\"../../modules/es7.symbol.observable\":123}],34:[function(_dereq_,module,exports){\n_dereq_('../../modules/es6.string.iterator');\n_dereq_('../../modules/web.dom.iterable');\nmodule.exports = _dereq_('../../modules/_wks-ext').f('iterator');\n\n},{\"../../modules/_wks-ext\":106,\"../../modules/es6.string.iterator\":118,\"../../modules/web.dom.iterable\":124}],35:[function(_dereq_,module,exports){\nmodule.exports = function (it) {\n  if (typeof it != 'function') throw TypeError(it + ' is not a function!');\n  return it;\n};\n\n},{}],36:[function(_dereq_,module,exports){\nmodule.exports = function () { /* empty */ };\n\n},{}],37:[function(_dereq_,module,exports){\nmodule.exports = function (it, Constructor, name, forbiddenField) {\n  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {\n    throw TypeError(name + ': incorrect invocation!');\n  } return it;\n};\n\n},{}],38:[function(_dereq_,module,exports){\nvar isObject = _dereq_('./_is-object');\nmodule.exports = function (it) {\n  if (!isObject(it)) throw TypeError(it + ' is not an object!');\n  return it;\n};\n\n},{\"./_is-object\":61}],39:[function(_dereq_,module,exports){\n// false -> Array#indexOf\n// true  -> Array#includes\nvar toIObject = _dereq_('./_to-iobject');\nvar toLength = _dereq_('./_to-length');\nvar toAbsoluteIndex = _dereq_('./_to-absolute-index');\nmodule.exports = function (IS_INCLUDES) {\n  return function ($this, el, fromIndex) {\n    var O = toIObject($this);\n    var length = toLength(O.length);\n    var index = toAbsoluteIndex(fromIndex, length);\n    var value;\n    // Array#includes uses SameValueZero equality algorithm\n    // eslint-disable-next-line no-self-compare\n    if (IS_INCLUDES && el != el) while (length > index) {\n      value = O[index++];\n      // eslint-disable-next-line no-self-compare\n      if (value != value) return true;\n    // Array#indexOf ignores holes, Array#includes - not\n    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {\n      if (O[index] === el) return IS_INCLUDES || index || 0;\n    } return !IS_INCLUDES && -1;\n  };\n};\n\n},{\"./_to-absolute-index\":98,\"./_to-iobject\":100,\"./_to-length\":101}],40:[function(_dereq_,module,exports){\n// getting tag from 19.1.3.6 Object.prototype.toString()\nvar cof = _dereq_('./_cof');\nvar TAG = _dereq_('./_wks')('toStringTag');\n// ES3 wrong here\nvar ARG = cof(function () { return arguments; }()) == 'Arguments';\n\n// fallback for IE11 Script Access Denied error\nvar tryGet = function (it, key) {\n  try {\n    return it[key];\n  } catch (e) { /* empty */ }\n};\n\nmodule.exports = function (it) {\n  var O, T, B;\n  return it === undefined ? 'Undefined' : it === null ? 'Null'\n    // @@toStringTag case\n    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T\n    // builtinTag case\n    : ARG ? cof(O)\n    // ES3 arguments fallback\n    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;\n};\n\n},{\"./_cof\":41,\"./_wks\":107}],41:[function(_dereq_,module,exports){\nvar toString = {}.toString;\n\nmodule.exports = function (it) {\n  return toString.call(it).slice(8, -1);\n};\n\n},{}],42:[function(_dereq_,module,exports){\nvar core = module.exports = { version: '2.5.3' };\nif (typeof __e == 'number') __e = core; // eslint-disable-line no-undef\n\n},{}],43:[function(_dereq_,module,exports){\n// optional / simple context binding\nvar aFunction = _dereq_('./_a-function');\nmodule.exports = function (fn, that, length) {\n  aFunction(fn);\n  if (that === undefined) return fn;\n  switch (length) {\n    case 1: return function (a) {\n      return fn.call(that, a);\n    };\n    case 2: return function (a, b) {\n      return fn.call(that, a, b);\n    };\n    case 3: return function (a, b, c) {\n      return fn.call(that, a, b, c);\n    };\n  }\n  return function (/* ...args */) {\n    return fn.apply(that, arguments);\n  };\n};\n\n},{\"./_a-function\":35}],44:[function(_dereq_,module,exports){\n// 7.2.1 RequireObjectCoercible(argument)\nmodule.exports = function (it) {\n  if (it == undefined) throw TypeError(\"Can't call method on  \" + it);\n  return it;\n};\n\n},{}],45:[function(_dereq_,module,exports){\n// Thank's IE8 for his funny defineProperty\nmodule.exports = !_dereq_('./_fails')(function () {\n  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;\n});\n\n},{\"./_fails\":50}],46:[function(_dereq_,module,exports){\nvar isObject = _dereq_('./_is-object');\nvar document = _dereq_('./_global').document;\n// typeof document.createElement is 'object' in old IE\nvar is = isObject(document) && isObject(document.createElement);\nmodule.exports = function (it) {\n  return is ? document.createElement(it) : {};\n};\n\n},{\"./_global\":52,\"./_is-object\":61}],47:[function(_dereq_,module,exports){\n// IE 8- don't enum bug keys\nmodule.exports = (\n  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'\n).split(',');\n\n},{}],48:[function(_dereq_,module,exports){\n// all enumerable object keys, includes symbols\nvar getKeys = _dereq_('./_object-keys');\nvar gOPS = _dereq_('./_object-gops');\nvar pIE = _dereq_('./_object-pie');\nmodule.exports = function (it) {\n  var result = getKeys(it);\n  var getSymbols = gOPS.f;\n  if (getSymbols) {\n    var symbols = getSymbols(it);\n    var isEnum = pIE.f;\n    var i = 0;\n    var key;\n    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);\n  } return result;\n};\n\n},{\"./_object-gops\":79,\"./_object-keys\":82,\"./_object-pie\":83}],49:[function(_dereq_,module,exports){\nvar global = _dereq_('./_global');\nvar core = _dereq_('./_core');\nvar ctx = _dereq_('./_ctx');\nvar hide = _dereq_('./_hide');\nvar PROTOTYPE = 'prototype';\n\nvar $export = function (type, name, source) {\n  var IS_FORCED = type & $export.F;\n  var IS_GLOBAL = type & $export.G;\n  var IS_STATIC = type & $export.S;\n  var IS_PROTO = type & $export.P;\n  var IS_BIND = type & $export.B;\n  var IS_WRAP = type & $export.W;\n  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});\n  var expProto = exports[PROTOTYPE];\n  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE];\n  var key, own, out;\n  if (IS_GLOBAL) source = name;\n  for (key in source) {\n    // contains in native\n    own = !IS_FORCED && target && target[key] !== undefined;\n    if (own && key in exports) continue;\n    // export native or passed\n    out = own ? target[key] : source[key];\n    // prevent global pollution for namespaces\n    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]\n    // bind timers to global for call from export context\n    : IS_BIND && own ? ctx(out, global)\n    // wrap global constructors for prevent change them in library\n    : IS_WRAP && target[key] == out ? (function (C) {\n      var F = function (a, b, c) {\n        if (this instanceof C) {\n          switch (arguments.length) {\n            case 0: return new C();\n            case 1: return new C(a);\n            case 2: return new C(a, b);\n          } return new C(a, b, c);\n        } return C.apply(this, arguments);\n      };\n      F[PROTOTYPE] = C[PROTOTYPE];\n      return F;\n    // make static versions for prototype methods\n    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;\n    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%\n    if (IS_PROTO) {\n      (exports.virtual || (exports.virtual = {}))[key] = out;\n      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%\n      if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);\n    }\n  }\n};\n// type bitmap\n$export.F = 1;   // forced\n$export.G = 2;   // global\n$export.S = 4;   // static\n$export.P = 8;   // proto\n$export.B = 16;  // bind\n$export.W = 32;  // wrap\n$export.U = 64;  // safe\n$export.R = 128; // real proto method for `library`\nmodule.exports = $export;\n\n},{\"./_core\":42,\"./_ctx\":43,\"./_global\":52,\"./_hide\":54}],50:[function(_dereq_,module,exports){\nmodule.exports = function (exec) {\n  try {\n    return !!exec();\n  } catch (e) {\n    return true;\n  }\n};\n\n},{}],51:[function(_dereq_,module,exports){\nvar ctx = _dereq_('./_ctx');\nvar call = _dereq_('./_iter-call');\nvar isArrayIter = _dereq_('./_is-array-iter');\nvar anObject = _dereq_('./_an-object');\nvar toLength = _dereq_('./_to-length');\nvar getIterFn = _dereq_('./core.get-iterator-method');\nvar BREAK = {};\nvar RETURN = {};\nvar exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {\n  var iterFn = ITERATOR ? function () { return iterable; } : getIterFn(iterable);\n  var f = ctx(fn, that, entries ? 2 : 1);\n  var index = 0;\n  var length, step, iterator, result;\n  if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');\n  // fast case for arrays with default iterator\n  if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {\n    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);\n    if (result === BREAK || result === RETURN) return result;\n  } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {\n    result = call(iterator, f, step.value, entries);\n    if (result === BREAK || result === RETURN) return result;\n  }\n};\nexports.BREAK = BREAK;\nexports.RETURN = RETURN;\n\n},{\"./_an-object\":38,\"./_ctx\":43,\"./_is-array-iter\":59,\"./_iter-call\":62,\"./_to-length\":101,\"./core.get-iterator-method\":108}],52:[function(_dereq_,module,exports){\n// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028\nvar global = module.exports = typeof window != 'undefined' && window.Math == Math\n  ? window : typeof self != 'undefined' && self.Math == Math ? self\n  // eslint-disable-next-line no-new-func\n  : Function('return this')();\nif (typeof __g == 'number') __g = global; // eslint-disable-line no-undef\n\n},{}],53:[function(_dereq_,module,exports){\nvar hasOwnProperty = {}.hasOwnProperty;\nmodule.exports = function (it, key) {\n  return hasOwnProperty.call(it, key);\n};\n\n},{}],54:[function(_dereq_,module,exports){\nvar dP = _dereq_('./_object-dp');\nvar createDesc = _dereq_('./_property-desc');\nmodule.exports = _dereq_('./_descriptors') ? function (object, key, value) {\n  return dP.f(object, key, createDesc(1, value));\n} : function (object, key, value) {\n  object[key] = value;\n  return object;\n};\n\n},{\"./_descriptors\":45,\"./_object-dp\":74,\"./_property-desc\":87}],55:[function(_dereq_,module,exports){\nvar document = _dereq_('./_global').document;\nmodule.exports = document && document.documentElement;\n\n},{\"./_global\":52}],56:[function(_dereq_,module,exports){\nmodule.exports = !_dereq_('./_descriptors') && !_dereq_('./_fails')(function () {\n  return Object.defineProperty(_dereq_('./_dom-create')('div'), 'a', { get: function () { return 7; } }).a != 7;\n});\n\n},{\"./_descriptors\":45,\"./_dom-create\":46,\"./_fails\":50}],57:[function(_dereq_,module,exports){\n// fast apply, http://jsperf.lnkit.com/fast-apply/5\nmodule.exports = function (fn, args, that) {\n  var un = that === undefined;\n  switch (args.length) {\n    case 0: return un ? fn()\n                      : fn.call(that);\n    case 1: return un ? fn(args[0])\n                      : fn.call(that, args[0]);\n    case 2: return un ? fn(args[0], args[1])\n                      : fn.call(that, args[0], args[1]);\n    case 3: return un ? fn(args[0], args[1], args[2])\n                      : fn.call(that, args[0], args[1], args[2]);\n    case 4: return un ? fn(args[0], args[1], args[2], args[3])\n                      : fn.call(that, args[0], args[1], args[2], args[3]);\n  } return fn.apply(that, args);\n};\n\n},{}],58:[function(_dereq_,module,exports){\n// fallback for non-array-like ES3 and non-enumerable old V8 strings\nvar cof = _dereq_('./_cof');\n// eslint-disable-next-line no-prototype-builtins\nmodule.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {\n  return cof(it) == 'String' ? it.split('') : Object(it);\n};\n\n},{\"./_cof\":41}],59:[function(_dereq_,module,exports){\n// check on default Array iterator\nvar Iterators = _dereq_('./_iterators');\nvar ITERATOR = _dereq_('./_wks')('iterator');\nvar ArrayProto = Array.prototype;\n\nmodule.exports = function (it) {\n  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);\n};\n\n},{\"./_iterators\":67,\"./_wks\":107}],60:[function(_dereq_,module,exports){\n// 7.2.2 IsArray(argument)\nvar cof = _dereq_('./_cof');\nmodule.exports = Array.isArray || function isArray(arg) {\n  return cof(arg) == 'Array';\n};\n\n},{\"./_cof\":41}],61:[function(_dereq_,module,exports){\nmodule.exports = function (it) {\n  return typeof it === 'object' ? it !== null : typeof it === 'function';\n};\n\n},{}],62:[function(_dereq_,module,exports){\n// call something on iterator step with safe closing on error\nvar anObject = _dereq_('./_an-object');\nmodule.exports = function (iterator, fn, value, entries) {\n  try {\n    return entries ? fn(anObject(value)[0], value[1]) : fn(value);\n  // 7.4.6 IteratorClose(iterator, completion)\n  } catch (e) {\n    var ret = iterator['return'];\n    if (ret !== undefined) anObject(ret.call(iterator));\n    throw e;\n  }\n};\n\n},{\"./_an-object\":38}],63:[function(_dereq_,module,exports){\n'use strict';\nvar create = _dereq_('./_object-create');\nvar descriptor = _dereq_('./_property-desc');\nvar setToStringTag = _dereq_('./_set-to-string-tag');\nvar IteratorPrototype = {};\n\n// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()\n_dereq_('./_hide')(IteratorPrototype, _dereq_('./_wks')('iterator'), function () { return this; });\n\nmodule.exports = function (Constructor, NAME, next) {\n  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });\n  setToStringTag(Constructor, NAME + ' Iterator');\n};\n\n},{\"./_hide\":54,\"./_object-create\":73,\"./_property-desc\":87,\"./_set-to-string-tag\":92,\"./_wks\":107}],64:[function(_dereq_,module,exports){\n'use strict';\nvar LIBRARY = _dereq_('./_library');\nvar $export = _dereq_('./_export');\nvar redefine = _dereq_('./_redefine');\nvar hide = _dereq_('./_hide');\nvar has = _dereq_('./_has');\nvar Iterators = _dereq_('./_iterators');\nvar $iterCreate = _dereq_('./_iter-create');\nvar setToStringTag = _dereq_('./_set-to-string-tag');\nvar getPrototypeOf = _dereq_('./_object-gpo');\nvar ITERATOR = _dereq_('./_wks')('iterator');\nvar BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`\nvar FF_ITERATOR = '@@iterator';\nvar KEYS = 'keys';\nvar VALUES = 'values';\n\nvar returnThis = function () { return this; };\n\nmodule.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {\n  $iterCreate(Constructor, NAME, next);\n  var getMethod = function (kind) {\n    if (!BUGGY && kind in proto) return proto[kind];\n    switch (kind) {\n      case KEYS: return function keys() { return new Constructor(this, kind); };\n      case VALUES: return function values() { return new Constructor(this, kind); };\n    } return function entries() { return new Constructor(this, kind); };\n  };\n  var TAG = NAME + ' Iterator';\n  var DEF_VALUES = DEFAULT == VALUES;\n  var VALUES_BUG = false;\n  var proto = Base.prototype;\n  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];\n  var $default = (!BUGGY && $native) || getMethod(DEFAULT);\n  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;\n  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;\n  var methods, key, IteratorPrototype;\n  // Fix native\n  if ($anyNative) {\n    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));\n    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {\n      // Set @@toStringTag to native iterators\n      setToStringTag(IteratorPrototype, TAG, true);\n      // fix for some old engines\n      if (!LIBRARY && !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);\n    }\n  }\n  // fix Array#{values, @@iterator}.name in V8 / FF\n  if (DEF_VALUES && $native && $native.name !== VALUES) {\n    VALUES_BUG = true;\n    $default = function values() { return $native.call(this); };\n  }\n  // Define iterator\n  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {\n    hide(proto, ITERATOR, $default);\n  }\n  // Plug for library\n  Iterators[NAME] = $default;\n  Iterators[TAG] = returnThis;\n  if (DEFAULT) {\n    methods = {\n      values: DEF_VALUES ? $default : getMethod(VALUES),\n      keys: IS_SET ? $default : getMethod(KEYS),\n      entries: $entries\n    };\n    if (FORCED) for (key in methods) {\n      if (!(key in proto)) redefine(proto, key, methods[key]);\n    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);\n  }\n  return methods;\n};\n\n},{\"./_export\":49,\"./_has\":53,\"./_hide\":54,\"./_iter-create\":63,\"./_iterators\":67,\"./_library\":68,\"./_object-gpo\":80,\"./_redefine\":89,\"./_set-to-string-tag\":92,\"./_wks\":107}],65:[function(_dereq_,module,exports){\nvar ITERATOR = _dereq_('./_wks')('iterator');\nvar SAFE_CLOSING = false;\n\ntry {\n  var riter = [7][ITERATOR]();\n  riter['return'] = function () { SAFE_CLOSING = true; };\n  // eslint-disable-next-line no-throw-literal\n  Array.from(riter, function () { throw 2; });\n} catch (e) { /* empty */ }\n\nmodule.exports = function (exec, skipClosing) {\n  if (!skipClosing && !SAFE_CLOSING) return false;\n  var safe = false;\n  try {\n    var arr = [7];\n    var iter = arr[ITERATOR]();\n    iter.next = function () { return { done: safe = true }; };\n    arr[ITERATOR] = function () { return iter; };\n    exec(arr);\n  } catch (e) { /* empty */ }\n  return safe;\n};\n\n},{\"./_wks\":107}],66:[function(_dereq_,module,exports){\nmodule.exports = function (done, value) {\n  return { value: value, done: !!done };\n};\n\n},{}],67:[function(_dereq_,module,exports){\nmodule.exports = {};\n\n},{}],68:[function(_dereq_,module,exports){\nmodule.exports = true;\n\n},{}],69:[function(_dereq_,module,exports){\nvar META = _dereq_('./_uid')('meta');\nvar isObject = _dereq_('./_is-object');\nvar has = _dereq_('./_has');\nvar setDesc = _dereq_('./_object-dp').f;\nvar id = 0;\nvar isExtensible = Object.isExtensible || function () {\n  return true;\n};\nvar FREEZE = !_dereq_('./_fails')(function () {\n  return isExtensible(Object.preventExtensions({}));\n});\nvar setMeta = function (it) {\n  setDesc(it, META, { value: {\n    i: 'O' + ++id, // object ID\n    w: {}          // weak collections IDs\n  } });\n};\nvar fastKey = function (it, create) {\n  // return primitive with prefix\n  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;\n  if (!has(it, META)) {\n    // can't set metadata to uncaught frozen object\n    if (!isExtensible(it)) return 'F';\n    // not necessary to add metadata\n    if (!create) return 'E';\n    // add missing metadata\n    setMeta(it);\n  // return object ID\n  } return it[META].i;\n};\nvar getWeak = function (it, create) {\n  if (!has(it, META)) {\n    // can't set metadata to uncaught frozen object\n    if (!isExtensible(it)) return true;\n    // not necessary to add metadata\n    if (!create) return false;\n    // add missing metadata\n    setMeta(it);\n  // return hash weak collections IDs\n  } return it[META].w;\n};\n// add metadata on freeze-family methods calling\nvar onFreeze = function (it) {\n  if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);\n  return it;\n};\nvar meta = module.exports = {\n  KEY: META,\n  NEED: false,\n  fastKey: fastKey,\n  getWeak: getWeak,\n  onFreeze: onFreeze\n};\n\n},{\"./_fails\":50,\"./_has\":53,\"./_is-object\":61,\"./_object-dp\":74,\"./_uid\":104}],70:[function(_dereq_,module,exports){\nvar global = _dereq_('./_global');\nvar macrotask = _dereq_('./_task').set;\nvar Observer = global.MutationObserver || global.WebKitMutationObserver;\nvar process = global.process;\nvar Promise = global.Promise;\nvar isNode = _dereq_('./_cof')(process) == 'process';\n\nmodule.exports = function () {\n  var head, last, notify;\n\n  var flush = function () {\n    var parent, fn;\n    if (isNode && (parent = process.domain)) parent.exit();\n    while (head) {\n      fn = head.fn;\n      head = head.next;\n      try {\n        fn();\n      } catch (e) {\n        if (head) notify();\n        else last = undefined;\n        throw e;\n      }\n    } last = undefined;\n    if (parent) parent.enter();\n  };\n\n  // Node.js\n  if (isNode) {\n    notify = function () {\n      process.nextTick(flush);\n    };\n  // browsers with MutationObserver, except iOS Safari - https://github.com/zloirock/core-js/issues/339\n  } else if (Observer && !(global.navigator && global.navigator.standalone)) {\n    var toggle = true;\n    var node = document.createTextNode('');\n    new Observer(flush).observe(node, { characterData: true }); // eslint-disable-line no-new\n    notify = function () {\n      node.data = toggle = !toggle;\n    };\n  // environments with maybe non-completely correct, but existent Promise\n  } else if (Promise && Promise.resolve) {\n    var promise = Promise.resolve();\n    notify = function () {\n      promise.then(flush);\n    };\n  // for other environments - macrotask based on:\n  // - setImmediate\n  // - MessageChannel\n  // - window.postMessag\n  // - onreadystatechange\n  // - setTimeout\n  } else {\n    notify = function () {\n      // strange IE + webpack dev server bug - use .call(global)\n      macrotask.call(global, flush);\n    };\n  }\n\n  return function (fn) {\n    var task = { fn: fn, next: undefined };\n    if (last) last.next = task;\n    if (!head) {\n      head = task;\n      notify();\n    } last = task;\n  };\n};\n\n},{\"./_cof\":41,\"./_global\":52,\"./_task\":97}],71:[function(_dereq_,module,exports){\n'use strict';\n// 25.4.1.5 NewPromiseCapability(C)\nvar aFunction = _dereq_('./_a-function');\n\nfunction PromiseCapability(C) {\n  var resolve, reject;\n  this.promise = new C(function ($$resolve, $$reject) {\n    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');\n    resolve = $$resolve;\n    reject = $$reject;\n  });\n  this.resolve = aFunction(resolve);\n  this.reject = aFunction(reject);\n}\n\nmodule.exports.f = function (C) {\n  return new PromiseCapability(C);\n};\n\n},{\"./_a-function\":35}],72:[function(_dereq_,module,exports){\n'use strict';\n// 19.1.2.1 Object.assign(target, source, ...)\nvar getKeys = _dereq_('./_object-keys');\nvar gOPS = _dereq_('./_object-gops');\nvar pIE = _dereq_('./_object-pie');\nvar toObject = _dereq_('./_to-object');\nvar IObject = _dereq_('./_iobject');\nvar $assign = Object.assign;\n\n// should work with symbols and should have deterministic property order (V8 bug)\nmodule.exports = !$assign || _dereq_('./_fails')(function () {\n  var A = {};\n  var B = {};\n  // eslint-disable-next-line no-undef\n  var S = Symbol();\n  var K = 'abcdefghijklmnopqrst';\n  A[S] = 7;\n  K.split('').forEach(function (k) { B[k] = k; });\n  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;\n}) ? function assign(target, source) { // eslint-disable-line no-unused-vars\n  var T = toObject(target);\n  var aLen = arguments.length;\n  var index = 1;\n  var getSymbols = gOPS.f;\n  var isEnum = pIE.f;\n  while (aLen > index) {\n    var S = IObject(arguments[index++]);\n    var keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S);\n    var length = keys.length;\n    var j = 0;\n    var key;\n    while (length > j) if (isEnum.call(S, key = keys[j++])) T[key] = S[key];\n  } return T;\n} : $assign;\n\n},{\"./_fails\":50,\"./_iobject\":58,\"./_object-gops\":79,\"./_object-keys\":82,\"./_object-pie\":83,\"./_to-object\":102}],73:[function(_dereq_,module,exports){\n// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])\nvar anObject = _dereq_('./_an-object');\nvar dPs = _dereq_('./_object-dps');\nvar enumBugKeys = _dereq_('./_enum-bug-keys');\nvar IE_PROTO = _dereq_('./_shared-key')('IE_PROTO');\nvar Empty = function () { /* empty */ };\nvar PROTOTYPE = 'prototype';\n\n// Create object with fake `null` prototype: use iframe Object with cleared prototype\nvar createDict = function () {\n  // Thrash, waste and sodomy: IE GC bug\n  var iframe = _dereq_('./_dom-create')('iframe');\n  var i = enumBugKeys.length;\n  var lt = '<';\n  var gt = '>';\n  var iframeDocument;\n  iframe.style.display = 'none';\n  _dereq_('./_html').appendChild(iframe);\n  iframe.src = 'javascript:'; // eslint-disable-line no-script-url\n  // createDict = iframe.contentWindow.Object;\n  // html.removeChild(iframe);\n  iframeDocument = iframe.contentWindow.document;\n  iframeDocument.open();\n  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);\n  iframeDocument.close();\n  createDict = iframeDocument.F;\n  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];\n  return createDict();\n};\n\nmodule.exports = Object.create || function create(O, Properties) {\n  var result;\n  if (O !== null) {\n    Empty[PROTOTYPE] = anObject(O);\n    result = new Empty();\n    Empty[PROTOTYPE] = null;\n    // add \"__proto__\" for Object.getPrototypeOf polyfill\n    result[IE_PROTO] = O;\n  } else result = createDict();\n  return Properties === undefined ? result : dPs(result, Properties);\n};\n\n},{\"./_an-object\":38,\"./_dom-create\":46,\"./_enum-bug-keys\":47,\"./_html\":55,\"./_object-dps\":75,\"./_shared-key\":93}],74:[function(_dereq_,module,exports){\nvar anObject = _dereq_('./_an-object');\nvar IE8_DOM_DEFINE = _dereq_('./_ie8-dom-define');\nvar toPrimitive = _dereq_('./_to-primitive');\nvar dP = Object.defineProperty;\n\nexports.f = _dereq_('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {\n  anObject(O);\n  P = toPrimitive(P, true);\n  anObject(Attributes);\n  if (IE8_DOM_DEFINE) try {\n    return dP(O, P, Attributes);\n  } catch (e) { /* empty */ }\n  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');\n  if ('value' in Attributes) O[P] = Attributes.value;\n  return O;\n};\n\n},{\"./_an-object\":38,\"./_descriptors\":45,\"./_ie8-dom-define\":56,\"./_to-primitive\":103}],75:[function(_dereq_,module,exports){\nvar dP = _dereq_('./_object-dp');\nvar anObject = _dereq_('./_an-object');\nvar getKeys = _dereq_('./_object-keys');\n\nmodule.exports = _dereq_('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties) {\n  anObject(O);\n  var keys = getKeys(Properties);\n  var length = keys.length;\n  var i = 0;\n  var P;\n  while (length > i) dP.f(O, P = keys[i++], Properties[P]);\n  return O;\n};\n\n},{\"./_an-object\":38,\"./_descriptors\":45,\"./_object-dp\":74,\"./_object-keys\":82}],76:[function(_dereq_,module,exports){\nvar pIE = _dereq_('./_object-pie');\nvar createDesc = _dereq_('./_property-desc');\nvar toIObject = _dereq_('./_to-iobject');\nvar toPrimitive = _dereq_('./_to-primitive');\nvar has = _dereq_('./_has');\nvar IE8_DOM_DEFINE = _dereq_('./_ie8-dom-define');\nvar gOPD = Object.getOwnPropertyDescriptor;\n\nexports.f = _dereq_('./_descriptors') ? gOPD : function getOwnPropertyDescriptor(O, P) {\n  O = toIObject(O);\n  P = toPrimitive(P, true);\n  if (IE8_DOM_DEFINE) try {\n    return gOPD(O, P);\n  } catch (e) { /* empty */ }\n  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);\n};\n\n},{\"./_descriptors\":45,\"./_has\":53,\"./_ie8-dom-define\":56,\"./_object-pie\":83,\"./_property-desc\":87,\"./_to-iobject\":100,\"./_to-primitive\":103}],77:[function(_dereq_,module,exports){\n// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window\nvar toIObject = _dereq_('./_to-iobject');\nvar gOPN = _dereq_('./_object-gopn').f;\nvar toString = {}.toString;\n\nvar windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames\n  ? Object.getOwnPropertyNames(window) : [];\n\nvar getWindowNames = function (it) {\n  try {\n    return gOPN(it);\n  } catch (e) {\n    return windowNames.slice();\n  }\n};\n\nmodule.exports.f = function getOwnPropertyNames(it) {\n  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));\n};\n\n},{\"./_object-gopn\":78,\"./_to-iobject\":100}],78:[function(_dereq_,module,exports){\n// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)\nvar $keys = _dereq_('./_object-keys-internal');\nvar hiddenKeys = _dereq_('./_enum-bug-keys').concat('length', 'prototype');\n\nexports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {\n  return $keys(O, hiddenKeys);\n};\n\n},{\"./_enum-bug-keys\":47,\"./_object-keys-internal\":81}],79:[function(_dereq_,module,exports){\nexports.f = Object.getOwnPropertySymbols;\n\n},{}],80:[function(_dereq_,module,exports){\n// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)\nvar has = _dereq_('./_has');\nvar toObject = _dereq_('./_to-object');\nvar IE_PROTO = _dereq_('./_shared-key')('IE_PROTO');\nvar ObjectProto = Object.prototype;\n\nmodule.exports = Object.getPrototypeOf || function (O) {\n  O = toObject(O);\n  if (has(O, IE_PROTO)) return O[IE_PROTO];\n  if (typeof O.constructor == 'function' && O instanceof O.constructor) {\n    return O.constructor.prototype;\n  } return O instanceof Object ? ObjectProto : null;\n};\n\n},{\"./_has\":53,\"./_shared-key\":93,\"./_to-object\":102}],81:[function(_dereq_,module,exports){\nvar has = _dereq_('./_has');\nvar toIObject = _dereq_('./_to-iobject');\nvar arrayIndexOf = _dereq_('./_array-includes')(false);\nvar IE_PROTO = _dereq_('./_shared-key')('IE_PROTO');\n\nmodule.exports = function (object, names) {\n  var O = toIObject(object);\n  var i = 0;\n  var result = [];\n  var key;\n  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);\n  // Don't enum bug & hidden keys\n  while (names.length > i) if (has(O, key = names[i++])) {\n    ~arrayIndexOf(result, key) || result.push(key);\n  }\n  return result;\n};\n\n},{\"./_array-includes\":39,\"./_has\":53,\"./_shared-key\":93,\"./_to-iobject\":100}],82:[function(_dereq_,module,exports){\n// 19.1.2.14 / 15.2.3.14 Object.keys(O)\nvar $keys = _dereq_('./_object-keys-internal');\nvar enumBugKeys = _dereq_('./_enum-bug-keys');\n\nmodule.exports = Object.keys || function keys(O) {\n  return $keys(O, enumBugKeys);\n};\n\n},{\"./_enum-bug-keys\":47,\"./_object-keys-internal\":81}],83:[function(_dereq_,module,exports){\nexports.f = {}.propertyIsEnumerable;\n\n},{}],84:[function(_dereq_,module,exports){\n// most Object methods by ES6 should accept primitives\nvar $export = _dereq_('./_export');\nvar core = _dereq_('./_core');\nvar fails = _dereq_('./_fails');\nmodule.exports = function (KEY, exec) {\n  var fn = (core.Object || {})[KEY] || Object[KEY];\n  var exp = {};\n  exp[KEY] = exec(fn);\n  $export($export.S + $export.F * fails(function () { fn(1); }), 'Object', exp);\n};\n\n},{\"./_core\":42,\"./_export\":49,\"./_fails\":50}],85:[function(_dereq_,module,exports){\nmodule.exports = function (exec) {\n  try {\n    return { e: false, v: exec() };\n  } catch (e) {\n    return { e: true, v: e };\n  }\n};\n\n},{}],86:[function(_dereq_,module,exports){\nvar anObject = _dereq_('./_an-object');\nvar isObject = _dereq_('./_is-object');\nvar newPromiseCapability = _dereq_('./_new-promise-capability');\n\nmodule.exports = function (C, x) {\n  anObject(C);\n  if (isObject(x) && x.constructor === C) return x;\n  var promiseCapability = newPromiseCapability.f(C);\n  var resolve = promiseCapability.resolve;\n  resolve(x);\n  return promiseCapability.promise;\n};\n\n},{\"./_an-object\":38,\"./_is-object\":61,\"./_new-promise-capability\":71}],87:[function(_dereq_,module,exports){\nmodule.exports = function (bitmap, value) {\n  return {\n    enumerable: !(bitmap & 1),\n    configurable: !(bitmap & 2),\n    writable: !(bitmap & 4),\n    value: value\n  };\n};\n\n},{}],88:[function(_dereq_,module,exports){\nvar hide = _dereq_('./_hide');\nmodule.exports = function (target, src, safe) {\n  for (var key in src) {\n    if (safe && target[key]) target[key] = src[key];\n    else hide(target, key, src[key]);\n  } return target;\n};\n\n},{\"./_hide\":54}],89:[function(_dereq_,module,exports){\nmodule.exports = _dereq_('./_hide');\n\n},{\"./_hide\":54}],90:[function(_dereq_,module,exports){\n// Works with __proto__ only. Old v8 can't work with null proto objects.\n/* eslint-disable no-proto */\nvar isObject = _dereq_('./_is-object');\nvar anObject = _dereq_('./_an-object');\nvar check = function (O, proto) {\n  anObject(O);\n  if (!isObject(proto) && proto !== null) throw TypeError(proto + \": can't set as prototype!\");\n};\nmodule.exports = {\n  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line\n    function (test, buggy, set) {\n      try {\n        set = _dereq_('./_ctx')(Function.call, _dereq_('./_object-gopd').f(Object.prototype, '__proto__').set, 2);\n        set(test, []);\n        buggy = !(test instanceof Array);\n      } catch (e) { buggy = true; }\n      return function setPrototypeOf(O, proto) {\n        check(O, proto);\n        if (buggy) O.__proto__ = proto;\n        else set(O, proto);\n        return O;\n      };\n    }({}, false) : undefined),\n  check: check\n};\n\n},{\"./_an-object\":38,\"./_ctx\":43,\"./_is-object\":61,\"./_object-gopd\":76}],91:[function(_dereq_,module,exports){\n'use strict';\nvar global = _dereq_('./_global');\nvar core = _dereq_('./_core');\nvar dP = _dereq_('./_object-dp');\nvar DESCRIPTORS = _dereq_('./_descriptors');\nvar SPECIES = _dereq_('./_wks')('species');\n\nmodule.exports = function (KEY) {\n  var C = typeof core[KEY] == 'function' ? core[KEY] : global[KEY];\n  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {\n    configurable: true,\n    get: function () { return this; }\n  });\n};\n\n},{\"./_core\":42,\"./_descriptors\":45,\"./_global\":52,\"./_object-dp\":74,\"./_wks\":107}],92:[function(_dereq_,module,exports){\nvar def = _dereq_('./_object-dp').f;\nvar has = _dereq_('./_has');\nvar TAG = _dereq_('./_wks')('toStringTag');\n\nmodule.exports = function (it, tag, stat) {\n  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });\n};\n\n},{\"./_has\":53,\"./_object-dp\":74,\"./_wks\":107}],93:[function(_dereq_,module,exports){\nvar shared = _dereq_('./_shared')('keys');\nvar uid = _dereq_('./_uid');\nmodule.exports = function (key) {\n  return shared[key] || (shared[key] = uid(key));\n};\n\n},{\"./_shared\":94,\"./_uid\":104}],94:[function(_dereq_,module,exports){\nvar global = _dereq_('./_global');\nvar SHARED = '__core-js_shared__';\nvar store = global[SHARED] || (global[SHARED] = {});\nmodule.exports = function (key) {\n  return store[key] || (store[key] = {});\n};\n\n},{\"./_global\":52}],95:[function(_dereq_,module,exports){\n// 7.3.20 SpeciesConstructor(O, defaultConstructor)\nvar anObject = _dereq_('./_an-object');\nvar aFunction = _dereq_('./_a-function');\nvar SPECIES = _dereq_('./_wks')('species');\nmodule.exports = function (O, D) {\n  var C = anObject(O).constructor;\n  var S;\n  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);\n};\n\n},{\"./_a-function\":35,\"./_an-object\":38,\"./_wks\":107}],96:[function(_dereq_,module,exports){\nvar toInteger = _dereq_('./_to-integer');\nvar defined = _dereq_('./_defined');\n// true  -> String#at\n// false -> String#codePointAt\nmodule.exports = function (TO_STRING) {\n  return function (that, pos) {\n    var s = String(defined(that));\n    var i = toInteger(pos);\n    var l = s.length;\n    var a, b;\n    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;\n    a = s.charCodeAt(i);\n    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff\n      ? TO_STRING ? s.charAt(i) : a\n      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;\n  };\n};\n\n},{\"./_defined\":44,\"./_to-integer\":99}],97:[function(_dereq_,module,exports){\nvar ctx = _dereq_('./_ctx');\nvar invoke = _dereq_('./_invoke');\nvar html = _dereq_('./_html');\nvar cel = _dereq_('./_dom-create');\nvar global = _dereq_('./_global');\nvar process = global.process;\nvar setTask = global.setImmediate;\nvar clearTask = global.clearImmediate;\nvar MessageChannel = global.MessageChannel;\nvar Dispatch = global.Dispatch;\nvar counter = 0;\nvar queue = {};\nvar ONREADYSTATECHANGE = 'onreadystatechange';\nvar defer, channel, port;\nvar run = function () {\n  var id = +this;\n  // eslint-disable-next-line no-prototype-builtins\n  if (queue.hasOwnProperty(id)) {\n    var fn = queue[id];\n    delete queue[id];\n    fn();\n  }\n};\nvar listener = function (event) {\n  run.call(event.data);\n};\n// Node.js 0.9+ & IE10+ has setImmediate, otherwise:\nif (!setTask || !clearTask) {\n  setTask = function setImmediate(fn) {\n    var args = [];\n    var i = 1;\n    while (arguments.length > i) args.push(arguments[i++]);\n    queue[++counter] = function () {\n      // eslint-disable-next-line no-new-func\n      invoke(typeof fn == 'function' ? fn : Function(fn), args);\n    };\n    defer(counter);\n    return counter;\n  };\n  clearTask = function clearImmediate(id) {\n    delete queue[id];\n  };\n  // Node.js 0.8-\n  if (_dereq_('./_cof')(process) == 'process') {\n    defer = function (id) {\n      process.nextTick(ctx(run, id, 1));\n    };\n  // Sphere (JS game engine) Dispatch API\n  } else if (Dispatch && Dispatch.now) {\n    defer = function (id) {\n      Dispatch.now(ctx(run, id, 1));\n    };\n  // Browsers with MessageChannel, includes WebWorkers\n  } else if (MessageChannel) {\n    channel = new MessageChannel();\n    port = channel.port2;\n    channel.port1.onmessage = listener;\n    defer = ctx(port.postMessage, port, 1);\n  // Browsers with postMessage, skip WebWorkers\n  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'\n  } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts) {\n    defer = function (id) {\n      global.postMessage(id + '', '*');\n    };\n    global.addEventListener('message', listener, false);\n  // IE8-\n  } else if (ONREADYSTATECHANGE in cel('script')) {\n    defer = function (id) {\n      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function () {\n        html.removeChild(this);\n        run.call(id);\n      };\n    };\n  // Rest old browsers\n  } else {\n    defer = function (id) {\n      setTimeout(ctx(run, id, 1), 0);\n    };\n  }\n}\nmodule.exports = {\n  set: setTask,\n  clear: clearTask\n};\n\n},{\"./_cof\":41,\"./_ctx\":43,\"./_dom-create\":46,\"./_global\":52,\"./_html\":55,\"./_invoke\":57}],98:[function(_dereq_,module,exports){\nvar toInteger = _dereq_('./_to-integer');\nvar max = Math.max;\nvar min = Math.min;\nmodule.exports = function (index, length) {\n  index = toInteger(index);\n  return index < 0 ? max(index + length, 0) : min(index, length);\n};\n\n},{\"./_to-integer\":99}],99:[function(_dereq_,module,exports){\n// 7.1.4 ToInteger\nvar ceil = Math.ceil;\nvar floor = Math.floor;\nmodule.exports = function (it) {\n  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);\n};\n\n},{}],100:[function(_dereq_,module,exports){\n// to indexed object, toObject with fallback for non-array-like ES3 strings\nvar IObject = _dereq_('./_iobject');\nvar defined = _dereq_('./_defined');\nmodule.exports = function (it) {\n  return IObject(defined(it));\n};\n\n},{\"./_defined\":44,\"./_iobject\":58}],101:[function(_dereq_,module,exports){\n// 7.1.15 ToLength\nvar toInteger = _dereq_('./_to-integer');\nvar min = Math.min;\nmodule.exports = function (it) {\n  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991\n};\n\n},{\"./_to-integer\":99}],102:[function(_dereq_,module,exports){\n// 7.1.13 ToObject(argument)\nvar defined = _dereq_('./_defined');\nmodule.exports = function (it) {\n  return Object(defined(it));\n};\n\n},{\"./_defined\":44}],103:[function(_dereq_,module,exports){\n// 7.1.1 ToPrimitive(input [, PreferredType])\nvar isObject = _dereq_('./_is-object');\n// instead of the ES6 spec version, we didn't implement @@toPrimitive case\n// and the second argument - flag - preferred type is a string\nmodule.exports = function (it, S) {\n  if (!isObject(it)) return it;\n  var fn, val;\n  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;\n  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;\n  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;\n  throw TypeError(\"Can't convert object to primitive value\");\n};\n\n},{\"./_is-object\":61}],104:[function(_dereq_,module,exports){\nvar id = 0;\nvar px = Math.random();\nmodule.exports = function (key) {\n  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));\n};\n\n},{}],105:[function(_dereq_,module,exports){\nvar global = _dereq_('./_global');\nvar core = _dereq_('./_core');\nvar LIBRARY = _dereq_('./_library');\nvar wksExt = _dereq_('./_wks-ext');\nvar defineProperty = _dereq_('./_object-dp').f;\nmodule.exports = function (name) {\n  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});\n  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: wksExt.f(name) });\n};\n\n},{\"./_core\":42,\"./_global\":52,\"./_library\":68,\"./_object-dp\":74,\"./_wks-ext\":106}],106:[function(_dereq_,module,exports){\nexports.f = _dereq_('./_wks');\n\n},{\"./_wks\":107}],107:[function(_dereq_,module,exports){\nvar store = _dereq_('./_shared')('wks');\nvar uid = _dereq_('./_uid');\nvar Symbol = _dereq_('./_global').Symbol;\nvar USE_SYMBOL = typeof Symbol == 'function';\n\nvar $exports = module.exports = function (name) {\n  return store[name] || (store[name] =\n    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));\n};\n\n$exports.store = store;\n\n},{\"./_global\":52,\"./_shared\":94,\"./_uid\":104}],108:[function(_dereq_,module,exports){\nvar classof = _dereq_('./_classof');\nvar ITERATOR = _dereq_('./_wks')('iterator');\nvar Iterators = _dereq_('./_iterators');\nmodule.exports = _dereq_('./_core').getIteratorMethod = function (it) {\n  if (it != undefined) return it[ITERATOR]\n    || it['@@iterator']\n    || Iterators[classof(it)];\n};\n\n},{\"./_classof\":40,\"./_core\":42,\"./_iterators\":67,\"./_wks\":107}],109:[function(_dereq_,module,exports){\n'use strict';\nvar addToUnscopables = _dereq_('./_add-to-unscopables');\nvar step = _dereq_('./_iter-step');\nvar Iterators = _dereq_('./_iterators');\nvar toIObject = _dereq_('./_to-iobject');\n\n// 22.1.3.4 Array.prototype.entries()\n// 22.1.3.13 Array.prototype.keys()\n// 22.1.3.29 Array.prototype.values()\n// 22.1.3.30 Array.prototype[@@iterator]()\nmodule.exports = _dereq_('./_iter-define')(Array, 'Array', function (iterated, kind) {\n  this._t = toIObject(iterated); // target\n  this._i = 0;                   // next index\n  this._k = kind;                // kind\n// 22.1.5.2.1 %ArrayIteratorPrototype%.next()\n}, function () {\n  var O = this._t;\n  var kind = this._k;\n  var index = this._i++;\n  if (!O || index >= O.length) {\n    this._t = undefined;\n    return step(1);\n  }\n  if (kind == 'keys') return step(0, index);\n  if (kind == 'values') return step(0, O[index]);\n  return step(0, [index, O[index]]);\n}, 'values');\n\n// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)\nIterators.Arguments = Iterators.Array;\n\naddToUnscopables('keys');\naddToUnscopables('values');\naddToUnscopables('entries');\n\n},{\"./_add-to-unscopables\":36,\"./_iter-define\":64,\"./_iter-step\":66,\"./_iterators\":67,\"./_to-iobject\":100}],110:[function(_dereq_,module,exports){\n// 19.1.3.1 Object.assign(target, source)\nvar $export = _dereq_('./_export');\n\n$export($export.S + $export.F, 'Object', { assign: _dereq_('./_object-assign') });\n\n},{\"./_export\":49,\"./_object-assign\":72}],111:[function(_dereq_,module,exports){\nvar $export = _dereq_('./_export');\n// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])\n$export($export.S, 'Object', { create: _dereq_('./_object-create') });\n\n},{\"./_export\":49,\"./_object-create\":73}],112:[function(_dereq_,module,exports){\nvar $export = _dereq_('./_export');\n// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)\n$export($export.S + $export.F * !_dereq_('./_descriptors'), 'Object', { defineProperty: _dereq_('./_object-dp').f });\n\n},{\"./_descriptors\":45,\"./_export\":49,\"./_object-dp\":74}],113:[function(_dereq_,module,exports){\n// 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)\nvar toIObject = _dereq_('./_to-iobject');\nvar $getOwnPropertyDescriptor = _dereq_('./_object-gopd').f;\n\n_dereq_('./_object-sap')('getOwnPropertyDescriptor', function () {\n  return function getOwnPropertyDescriptor(it, key) {\n    return $getOwnPropertyDescriptor(toIObject(it), key);\n  };\n});\n\n},{\"./_object-gopd\":76,\"./_object-sap\":84,\"./_to-iobject\":100}],114:[function(_dereq_,module,exports){\n// 19.1.2.9 Object.getPrototypeOf(O)\nvar toObject = _dereq_('./_to-object');\nvar $getPrototypeOf = _dereq_('./_object-gpo');\n\n_dereq_('./_object-sap')('getPrototypeOf', function () {\n  return function getPrototypeOf(it) {\n    return $getPrototypeOf(toObject(it));\n  };\n});\n\n},{\"./_object-gpo\":80,\"./_object-sap\":84,\"./_to-object\":102}],115:[function(_dereq_,module,exports){\n// 19.1.3.19 Object.setPrototypeOf(O, proto)\nvar $export = _dereq_('./_export');\n$export($export.S, 'Object', { setPrototypeOf: _dereq_('./_set-proto').set });\n\n},{\"./_export\":49,\"./_set-proto\":90}],116:[function(_dereq_,module,exports){\narguments[4][21][0].apply(exports,arguments)\n},{\"dup\":21}],117:[function(_dereq_,module,exports){\n'use strict';\nvar LIBRARY = _dereq_('./_library');\nvar global = _dereq_('./_global');\nvar ctx = _dereq_('./_ctx');\nvar classof = _dereq_('./_classof');\nvar $export = _dereq_('./_export');\nvar isObject = _dereq_('./_is-object');\nvar aFunction = _dereq_('./_a-function');\nvar anInstance = _dereq_('./_an-instance');\nvar forOf = _dereq_('./_for-of');\nvar speciesConstructor = _dereq_('./_species-constructor');\nvar task = _dereq_('./_task').set;\nvar microtask = _dereq_('./_microtask')();\nvar newPromiseCapabilityModule = _dereq_('./_new-promise-capability');\nvar perform = _dereq_('./_perform');\nvar promiseResolve = _dereq_('./_promise-resolve');\nvar PROMISE = 'Promise';\nvar TypeError = global.TypeError;\nvar process = global.process;\nvar $Promise = global[PROMISE];\nvar isNode = classof(process) == 'process';\nvar empty = function () { /* empty */ };\nvar Internal, newGenericPromiseCapability, OwnPromiseCapability, Wrapper;\nvar newPromiseCapability = newGenericPromiseCapability = newPromiseCapabilityModule.f;\n\nvar USE_NATIVE = !!function () {\n  try {\n    // correct subclassing with @@species support\n    var promise = $Promise.resolve(1);\n    var FakePromise = (promise.constructor = {})[_dereq_('./_wks')('species')] = function (exec) {\n      exec(empty, empty);\n    };\n    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test\n    return (isNode || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;\n  } catch (e) { /* empty */ }\n}();\n\n// helpers\nvar isThenable = function (it) {\n  var then;\n  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;\n};\nvar notify = function (promise, isReject) {\n  if (promise._n) return;\n  promise._n = true;\n  var chain = promise._c;\n  microtask(function () {\n    var value = promise._v;\n    var ok = promise._s == 1;\n    var i = 0;\n    var run = function (reaction) {\n      var handler = ok ? reaction.ok : reaction.fail;\n      var resolve = reaction.resolve;\n      var reject = reaction.reject;\n      var domain = reaction.domain;\n      var result, then;\n      try {\n        if (handler) {\n          if (!ok) {\n            if (promise._h == 2) onHandleUnhandled(promise);\n            promise._h = 1;\n          }\n          if (handler === true) result = value;\n          else {\n            if (domain) domain.enter();\n            result = handler(value);\n            if (domain) domain.exit();\n          }\n          if (result === reaction.promise) {\n            reject(TypeError('Promise-chain cycle'));\n          } else if (then = isThenable(result)) {\n            then.call(result, resolve, reject);\n          } else resolve(result);\n        } else reject(value);\n      } catch (e) {\n        reject(e);\n      }\n    };\n    while (chain.length > i) run(chain[i++]); // variable length - can't use forEach\n    promise._c = [];\n    promise._n = false;\n    if (isReject && !promise._h) onUnhandled(promise);\n  });\n};\nvar onUnhandled = function (promise) {\n  task.call(global, function () {\n    var value = promise._v;\n    var unhandled = isUnhandled(promise);\n    var result, handler, console;\n    if (unhandled) {\n      result = perform(function () {\n        if (isNode) {\n          process.emit('unhandledRejection', value, promise);\n        } else if (handler = global.onunhandledrejection) {\n          handler({ promise: promise, reason: value });\n        } else if ((console = global.console) && console.error) {\n          console.error('Unhandled promise rejection', value);\n        }\n      });\n      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should\n      promise._h = isNode || isUnhandled(promise) ? 2 : 1;\n    } promise._a = undefined;\n    if (unhandled && result.e) throw result.v;\n  });\n};\nvar isUnhandled = function (promise) {\n  return promise._h !== 1 && (promise._a || promise._c).length === 0;\n};\nvar onHandleUnhandled = function (promise) {\n  task.call(global, function () {\n    var handler;\n    if (isNode) {\n      process.emit('rejectionHandled', promise);\n    } else if (handler = global.onrejectionhandled) {\n      handler({ promise: promise, reason: promise._v });\n    }\n  });\n};\nvar $reject = function (value) {\n  var promise = this;\n  if (promise._d) return;\n  promise._d = true;\n  promise = promise._w || promise; // unwrap\n  promise._v = value;\n  promise._s = 2;\n  if (!promise._a) promise._a = promise._c.slice();\n  notify(promise, true);\n};\nvar $resolve = function (value) {\n  var promise = this;\n  var then;\n  if (promise._d) return;\n  promise._d = true;\n  promise = promise._w || promise; // unwrap\n  try {\n    if (promise === value) throw TypeError(\"Promise can't be resolved itself\");\n    if (then = isThenable(value)) {\n      microtask(function () {\n        var wrapper = { _w: promise, _d: false }; // wrap\n        try {\n          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));\n        } catch (e) {\n          $reject.call(wrapper, e);\n        }\n      });\n    } else {\n      promise._v = value;\n      promise._s = 1;\n      notify(promise, false);\n    }\n  } catch (e) {\n    $reject.call({ _w: promise, _d: false }, e); // wrap\n  }\n};\n\n// constructor polyfill\nif (!USE_NATIVE) {\n  // 25.4.3.1 Promise(executor)\n  $Promise = function Promise(executor) {\n    anInstance(this, $Promise, PROMISE, '_h');\n    aFunction(executor);\n    Internal.call(this);\n    try {\n      executor(ctx($resolve, this, 1), ctx($reject, this, 1));\n    } catch (err) {\n      $reject.call(this, err);\n    }\n  };\n  // eslint-disable-next-line no-unused-vars\n  Internal = function Promise(executor) {\n    this._c = [];             // <- awaiting reactions\n    this._a = undefined;      // <- checked in isUnhandled reactions\n    this._s = 0;              // <- state\n    this._d = false;          // <- done\n    this._v = undefined;      // <- value\n    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled\n    this._n = false;          // <- notify\n  };\n  Internal.prototype = _dereq_('./_redefine-all')($Promise.prototype, {\n    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)\n    then: function then(onFulfilled, onRejected) {\n      var reaction = newPromiseCapability(speciesConstructor(this, $Promise));\n      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;\n      reaction.fail = typeof onRejected == 'function' && onRejected;\n      reaction.domain = isNode ? process.domain : undefined;\n      this._c.push(reaction);\n      if (this._a) this._a.push(reaction);\n      if (this._s) notify(this, false);\n      return reaction.promise;\n    },\n    // 25.4.5.1 Promise.prototype.catch(onRejected)\n    'catch': function (onRejected) {\n      return this.then(undefined, onRejected);\n    }\n  });\n  OwnPromiseCapability = function () {\n    var promise = new Internal();\n    this.promise = promise;\n    this.resolve = ctx($resolve, promise, 1);\n    this.reject = ctx($reject, promise, 1);\n  };\n  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {\n    return C === $Promise || C === Wrapper\n      ? new OwnPromiseCapability(C)\n      : newGenericPromiseCapability(C);\n  };\n}\n\n$export($export.G + $export.W + $export.F * !USE_NATIVE, { Promise: $Promise });\n_dereq_('./_set-to-string-tag')($Promise, PROMISE);\n_dereq_('./_set-species')(PROMISE);\nWrapper = _dereq_('./_core')[PROMISE];\n\n// statics\n$export($export.S + $export.F * !USE_NATIVE, PROMISE, {\n  // 25.4.4.5 Promise.reject(r)\n  reject: function reject(r) {\n    var capability = newPromiseCapability(this);\n    var $$reject = capability.reject;\n    $$reject(r);\n    return capability.promise;\n  }\n});\n$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {\n  // 25.4.4.6 Promise.resolve(x)\n  resolve: function resolve(x) {\n    return promiseResolve(LIBRARY && this === Wrapper ? $Promise : this, x);\n  }\n});\n$export($export.S + $export.F * !(USE_NATIVE && _dereq_('./_iter-detect')(function (iter) {\n  $Promise.all(iter)['catch'](empty);\n})), PROMISE, {\n  // 25.4.4.1 Promise.all(iterable)\n  all: function all(iterable) {\n    var C = this;\n    var capability = newPromiseCapability(C);\n    var resolve = capability.resolve;\n    var reject = capability.reject;\n    var result = perform(function () {\n      var values = [];\n      var index = 0;\n      var remaining = 1;\n      forOf(iterable, false, function (promise) {\n        var $index = index++;\n        var alreadyCalled = false;\n        values.push(undefined);\n        remaining++;\n        C.resolve(promise).then(function (value) {\n          if (alreadyCalled) return;\n          alreadyCalled = true;\n          values[$index] = value;\n          --remaining || resolve(values);\n        }, reject);\n      });\n      --remaining || resolve(values);\n    });\n    if (result.e) reject(result.v);\n    return capability.promise;\n  },\n  // 25.4.4.4 Promise.race(iterable)\n  race: function race(iterable) {\n    var C = this;\n    var capability = newPromiseCapability(C);\n    var reject = capability.reject;\n    var result = perform(function () {\n      forOf(iterable, false, function (promise) {\n        C.resolve(promise).then(capability.resolve, reject);\n      });\n    });\n    if (result.e) reject(result.v);\n    return capability.promise;\n  }\n});\n\n},{\"./_a-function\":35,\"./_an-instance\":37,\"./_classof\":40,\"./_core\":42,\"./_ctx\":43,\"./_export\":49,\"./_for-of\":51,\"./_global\":52,\"./_is-object\":61,\"./_iter-detect\":65,\"./_library\":68,\"./_microtask\":70,\"./_new-promise-capability\":71,\"./_perform\":85,\"./_promise-resolve\":86,\"./_redefine-all\":88,\"./_set-species\":91,\"./_set-to-string-tag\":92,\"./_species-constructor\":95,\"./_task\":97,\"./_wks\":107}],118:[function(_dereq_,module,exports){\n'use strict';\nvar $at = _dereq_('./_string-at')(true);\n\n// 21.1.3.27 String.prototype[@@iterator]()\n_dereq_('./_iter-define')(String, 'String', function (iterated) {\n  this._t = String(iterated); // target\n  this._i = 0;                // next index\n// 21.1.5.2.1 %StringIteratorPrototype%.next()\n}, function () {\n  var O = this._t;\n  var index = this._i;\n  var point;\n  if (index >= O.length) return { value: undefined, done: true };\n  point = $at(O, index);\n  this._i += point.length;\n  return { value: point, done: false };\n});\n\n},{\"./_iter-define\":64,\"./_string-at\":96}],119:[function(_dereq_,module,exports){\n'use strict';\n// ECMAScript 6 symbols shim\nvar global = _dereq_('./_global');\nvar has = _dereq_('./_has');\nvar DESCRIPTORS = _dereq_('./_descriptors');\nvar $export = _dereq_('./_export');\nvar redefine = _dereq_('./_redefine');\nvar META = _dereq_('./_meta').KEY;\nvar $fails = _dereq_('./_fails');\nvar shared = _dereq_('./_shared');\nvar setToStringTag = _dereq_('./_set-to-string-tag');\nvar uid = _dereq_('./_uid');\nvar wks = _dereq_('./_wks');\nvar wksExt = _dereq_('./_wks-ext');\nvar wksDefine = _dereq_('./_wks-define');\nvar enumKeys = _dereq_('./_enum-keys');\nvar isArray = _dereq_('./_is-array');\nvar anObject = _dereq_('./_an-object');\nvar isObject = _dereq_('./_is-object');\nvar toIObject = _dereq_('./_to-iobject');\nvar toPrimitive = _dereq_('./_to-primitive');\nvar createDesc = _dereq_('./_property-desc');\nvar _create = _dereq_('./_object-create');\nvar gOPNExt = _dereq_('./_object-gopn-ext');\nvar $GOPD = _dereq_('./_object-gopd');\nvar $DP = _dereq_('./_object-dp');\nvar $keys = _dereq_('./_object-keys');\nvar gOPD = $GOPD.f;\nvar dP = $DP.f;\nvar gOPN = gOPNExt.f;\nvar $Symbol = global.Symbol;\nvar $JSON = global.JSON;\nvar _stringify = $JSON && $JSON.stringify;\nvar PROTOTYPE = 'prototype';\nvar HIDDEN = wks('_hidden');\nvar TO_PRIMITIVE = wks('toPrimitive');\nvar isEnum = {}.propertyIsEnumerable;\nvar SymbolRegistry = shared('symbol-registry');\nvar AllSymbols = shared('symbols');\nvar OPSymbols = shared('op-symbols');\nvar ObjectProto = Object[PROTOTYPE];\nvar USE_NATIVE = typeof $Symbol == 'function';\nvar QObject = global.QObject;\n// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173\nvar setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;\n\n// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687\nvar setSymbolDesc = DESCRIPTORS && $fails(function () {\n  return _create(dP({}, 'a', {\n    get: function () { return dP(this, 'a', { value: 7 }).a; }\n  })).a != 7;\n}) ? function (it, key, D) {\n  var protoDesc = gOPD(ObjectProto, key);\n  if (protoDesc) delete ObjectProto[key];\n  dP(it, key, D);\n  if (protoDesc && it !== ObjectProto) dP(ObjectProto, key, protoDesc);\n} : dP;\n\nvar wrap = function (tag) {\n  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);\n  sym._k = tag;\n  return sym;\n};\n\nvar isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function (it) {\n  return typeof it == 'symbol';\n} : function (it) {\n  return it instanceof $Symbol;\n};\n\nvar $defineProperty = function defineProperty(it, key, D) {\n  if (it === ObjectProto) $defineProperty(OPSymbols, key, D);\n  anObject(it);\n  key = toPrimitive(key, true);\n  anObject(D);\n  if (has(AllSymbols, key)) {\n    if (!D.enumerable) {\n      if (!has(it, HIDDEN)) dP(it, HIDDEN, createDesc(1, {}));\n      it[HIDDEN][key] = true;\n    } else {\n      if (has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;\n      D = _create(D, { enumerable: createDesc(0, false) });\n    } return setSymbolDesc(it, key, D);\n  } return dP(it, key, D);\n};\nvar $defineProperties = function defineProperties(it, P) {\n  anObject(it);\n  var keys = enumKeys(P = toIObject(P));\n  var i = 0;\n  var l = keys.length;\n  var key;\n  while (l > i) $defineProperty(it, key = keys[i++], P[key]);\n  return it;\n};\nvar $create = function create(it, P) {\n  return P === undefined ? _create(it) : $defineProperties(_create(it), P);\n};\nvar $propertyIsEnumerable = function propertyIsEnumerable(key) {\n  var E = isEnum.call(this, key = toPrimitive(key, true));\n  if (this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return false;\n  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;\n};\nvar $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {\n  it = toIObject(it);\n  key = toPrimitive(key, true);\n  if (it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return;\n  var D = gOPD(it, key);\n  if (D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;\n  return D;\n};\nvar $getOwnPropertyNames = function getOwnPropertyNames(it) {\n  var names = gOPN(toIObject(it));\n  var result = [];\n  var i = 0;\n  var key;\n  while (names.length > i) {\n    if (!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);\n  } return result;\n};\nvar $getOwnPropertySymbols = function getOwnPropertySymbols(it) {\n  var IS_OP = it === ObjectProto;\n  var names = gOPN(IS_OP ? OPSymbols : toIObject(it));\n  var result = [];\n  var i = 0;\n  var key;\n  while (names.length > i) {\n    if (has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true)) result.push(AllSymbols[key]);\n  } return result;\n};\n\n// 19.4.1.1 Symbol([description])\nif (!USE_NATIVE) {\n  $Symbol = function Symbol() {\n    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');\n    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);\n    var $set = function (value) {\n      if (this === ObjectProto) $set.call(OPSymbols, value);\n      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;\n      setSymbolDesc(this, tag, createDesc(1, value));\n    };\n    if (DESCRIPTORS && setter) setSymbolDesc(ObjectProto, tag, { configurable: true, set: $set });\n    return wrap(tag);\n  };\n  redefine($Symbol[PROTOTYPE], 'toString', function toString() {\n    return this._k;\n  });\n\n  $GOPD.f = $getOwnPropertyDescriptor;\n  $DP.f = $defineProperty;\n  _dereq_('./_object-gopn').f = gOPNExt.f = $getOwnPropertyNames;\n  _dereq_('./_object-pie').f = $propertyIsEnumerable;\n  _dereq_('./_object-gops').f = $getOwnPropertySymbols;\n\n  if (DESCRIPTORS && !_dereq_('./_library')) {\n    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);\n  }\n\n  wksExt.f = function (name) {\n    return wrap(wks(name));\n  };\n}\n\n$export($export.G + $export.W + $export.F * !USE_NATIVE, { Symbol: $Symbol });\n\nfor (var es6Symbols = (\n  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14\n  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'\n).split(','), j = 0; es6Symbols.length > j;)wks(es6Symbols[j++]);\n\nfor (var wellKnownSymbols = $keys(wks.store), k = 0; wellKnownSymbols.length > k;) wksDefine(wellKnownSymbols[k++]);\n\n$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {\n  // 19.4.2.1 Symbol.for(key)\n  'for': function (key) {\n    return has(SymbolRegistry, key += '')\n      ? SymbolRegistry[key]\n      : SymbolRegistry[key] = $Symbol(key);\n  },\n  // 19.4.2.5 Symbol.keyFor(sym)\n  keyFor: function keyFor(sym) {\n    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');\n    for (var key in SymbolRegistry) if (SymbolRegistry[key] === sym) return key;\n  },\n  useSetter: function () { setter = true; },\n  useSimple: function () { setter = false; }\n});\n\n$export($export.S + $export.F * !USE_NATIVE, 'Object', {\n  // 19.1.2.2 Object.create(O [, Properties])\n  create: $create,\n  // 19.1.2.4 Object.defineProperty(O, P, Attributes)\n  defineProperty: $defineProperty,\n  // 19.1.2.3 Object.defineProperties(O, Properties)\n  defineProperties: $defineProperties,\n  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)\n  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,\n  // 19.1.2.7 Object.getOwnPropertyNames(O)\n  getOwnPropertyNames: $getOwnPropertyNames,\n  // 19.1.2.8 Object.getOwnPropertySymbols(O)\n  getOwnPropertySymbols: $getOwnPropertySymbols\n});\n\n// 24.3.2 JSON.stringify(value [, replacer [, space]])\n$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function () {\n  var S = $Symbol();\n  // MS Edge converts symbol values to JSON as {}\n  // WebKit converts symbol values to JSON as null\n  // V8 throws on boxed symbols\n  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';\n})), 'JSON', {\n  stringify: function stringify(it) {\n    var args = [it];\n    var i = 1;\n    var replacer, $replacer;\n    while (arguments.length > i) args.push(arguments[i++]);\n    $replacer = replacer = args[1];\n    if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined\n    if (!isArray(replacer)) replacer = function (key, value) {\n      if (typeof $replacer == 'function') value = $replacer.call(this, key, value);\n      if (!isSymbol(value)) return value;\n    };\n    args[1] = replacer;\n    return _stringify.apply($JSON, args);\n  }\n});\n\n// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)\n$Symbol[PROTOTYPE][TO_PRIMITIVE] || _dereq_('./_hide')($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);\n// 19.4.3.5 Symbol.prototype[@@toStringTag]\nsetToStringTag($Symbol, 'Symbol');\n// 20.2.1.9 Math[@@toStringTag]\nsetToStringTag(Math, 'Math', true);\n// 24.3.3 JSON[@@toStringTag]\nsetToStringTag(global.JSON, 'JSON', true);\n\n},{\"./_an-object\":38,\"./_descriptors\":45,\"./_enum-keys\":48,\"./_export\":49,\"./_fails\":50,\"./_global\":52,\"./_has\":53,\"./_hide\":54,\"./_is-array\":60,\"./_is-object\":61,\"./_library\":68,\"./_meta\":69,\"./_object-create\":73,\"./_object-dp\":74,\"./_object-gopd\":76,\"./_object-gopn\":78,\"./_object-gopn-ext\":77,\"./_object-gops\":79,\"./_object-keys\":82,\"./_object-pie\":83,\"./_property-desc\":87,\"./_redefine\":89,\"./_set-to-string-tag\":92,\"./_shared\":94,\"./_to-iobject\":100,\"./_to-primitive\":103,\"./_uid\":104,\"./_wks\":107,\"./_wks-define\":105,\"./_wks-ext\":106}],120:[function(_dereq_,module,exports){\n// https://github.com/tc39/proposal-promise-finally\n'use strict';\nvar $export = _dereq_('./_export');\nvar core = _dereq_('./_core');\nvar global = _dereq_('./_global');\nvar speciesConstructor = _dereq_('./_species-constructor');\nvar promiseResolve = _dereq_('./_promise-resolve');\n\n$export($export.P + $export.R, 'Promise', { 'finally': function (onFinally) {\n  var C = speciesConstructor(this, core.Promise || global.Promise);\n  var isFunction = typeof onFinally == 'function';\n  return this.then(\n    isFunction ? function (x) {\n      return promiseResolve(C, onFinally()).then(function () { return x; });\n    } : onFinally,\n    isFunction ? function (e) {\n      return promiseResolve(C, onFinally()).then(function () { throw e; });\n    } : onFinally\n  );\n} });\n\n},{\"./_core\":42,\"./_export\":49,\"./_global\":52,\"./_promise-resolve\":86,\"./_species-constructor\":95}],121:[function(_dereq_,module,exports){\n'use strict';\n// https://github.com/tc39/proposal-promise-try\nvar $export = _dereq_('./_export');\nvar newPromiseCapability = _dereq_('./_new-promise-capability');\nvar perform = _dereq_('./_perform');\n\n$export($export.S, 'Promise', { 'try': function (callbackfn) {\n  var promiseCapability = newPromiseCapability.f(this);\n  var result = perform(callbackfn);\n  (result.e ? promiseCapability.reject : promiseCapability.resolve)(result.v);\n  return promiseCapability.promise;\n} });\n\n},{\"./_export\":49,\"./_new-promise-capability\":71,\"./_perform\":85}],122:[function(_dereq_,module,exports){\n_dereq_('./_wks-define')('asyncIterator');\n\n},{\"./_wks-define\":105}],123:[function(_dereq_,module,exports){\n_dereq_('./_wks-define')('observable');\n\n},{\"./_wks-define\":105}],124:[function(_dereq_,module,exports){\n_dereq_('./es6.array.iterator');\nvar global = _dereq_('./_global');\nvar hide = _dereq_('./_hide');\nvar Iterators = _dereq_('./_iterators');\nvar TO_STRING_TAG = _dereq_('./_wks')('toStringTag');\n\nvar DOMIterables = ('CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,' +\n  'DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,' +\n  'MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,' +\n  'SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,' +\n  'TextTrackList,TouchList').split(',');\n\nfor (var i = 0; i < DOMIterables.length; i++) {\n  var NAME = DOMIterables[i];\n  var Collection = global[NAME];\n  var proto = Collection && Collection.prototype;\n  if (proto && !proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);\n  Iterators[NAME] = Iterators.Array;\n}\n\n},{\"./_global\":52,\"./_hide\":54,\"./_iterators\":67,\"./_wks\":107,\"./es6.array.iterator\":109}],125:[function(_dereq_,module,exports){\n(function (Buffer){\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n// NOTE: These type checking functions intentionally don't use `instanceof`\n// because it is fragile and can be easily faked with `Object.create()`.\n\nfunction isArray(arg) {\n  if (Array.isArray) {\n    return Array.isArray(arg);\n  }\n  return objectToString(arg) === '[object Array]';\n}\nexports.isArray = isArray;\n\nfunction isBoolean(arg) {\n  return typeof arg === 'boolean';\n}\nexports.isBoolean = isBoolean;\n\nfunction isNull(arg) {\n  return arg === null;\n}\nexports.isNull = isNull;\n\nfunction isNullOrUndefined(arg) {\n  return arg == null;\n}\nexports.isNullOrUndefined = isNullOrUndefined;\n\nfunction isNumber(arg) {\n  return typeof arg === 'number';\n}\nexports.isNumber = isNumber;\n\nfunction isString(arg) {\n  return typeof arg === 'string';\n}\nexports.isString = isString;\n\nfunction isSymbol(arg) {\n  return typeof arg === 'symbol';\n}\nexports.isSymbol = isSymbol;\n\nfunction isUndefined(arg) {\n  return arg === void 0;\n}\nexports.isUndefined = isUndefined;\n\nfunction isRegExp(re) {\n  return objectToString(re) === '[object RegExp]';\n}\nexports.isRegExp = isRegExp;\n\nfunction isObject(arg) {\n  return typeof arg === 'object' && arg !== null;\n}\nexports.isObject = isObject;\n\nfunction isDate(d) {\n  return objectToString(d) === '[object Date]';\n}\nexports.isDate = isDate;\n\nfunction isError(e) {\n  return (objectToString(e) === '[object Error]' || e instanceof Error);\n}\nexports.isError = isError;\n\nfunction isFunction(arg) {\n  return typeof arg === 'function';\n}\nexports.isFunction = isFunction;\n\nfunction isPrimitive(arg) {\n  return arg === null ||\n         typeof arg === 'boolean' ||\n         typeof arg === 'number' ||\n         typeof arg === 'string' ||\n         typeof arg === 'symbol' ||  // ES6 symbol\n         typeof arg === 'undefined';\n}\nexports.isPrimitive = isPrimitive;\n\nexports.isBuffer = Buffer.isBuffer;\n\nfunction objectToString(o) {\n  return Object.prototype.toString.call(o);\n}\n\n}).call(this,{\"isBuffer\":_dereq_(\"../../is-buffer/index.js\")})\n\n},{\"../../is-buffer/index.js\":129}],126:[function(_dereq_,module,exports){\nvar once = _dereq_('once');\n\nvar noop = function() {};\n\nvar isRequest = function(stream) {\n\treturn stream.setHeader && typeof stream.abort === 'function';\n};\n\nvar isChildProcess = function(stream) {\n\treturn stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3\n};\n\nvar eos = function(stream, opts, callback) {\n\tif (typeof opts === 'function') return eos(stream, null, opts);\n\tif (!opts) opts = {};\n\n\tcallback = once(callback || noop);\n\n\tvar ws = stream._writableState;\n\tvar rs = stream._readableState;\n\tvar readable = opts.readable || (opts.readable !== false && stream.readable);\n\tvar writable = opts.writable || (opts.writable !== false && stream.writable);\n\n\tvar onlegacyfinish = function() {\n\t\tif (!stream.writable) onfinish();\n\t};\n\n\tvar onfinish = function() {\n\t\twritable = false;\n\t\tif (!readable) callback.call(stream);\n\t};\n\n\tvar onend = function() {\n\t\treadable = false;\n\t\tif (!writable) callback.call(stream);\n\t};\n\n\tvar onexit = function(exitCode) {\n\t\tcallback.call(stream, exitCode ? new Error('exited with error code: ' + exitCode) : null);\n\t};\n\n\tvar onclose = function() {\n\t\tif (readable && !(rs && rs.ended)) return callback.call(stream, new Error('premature close'));\n\t\tif (writable && !(ws && ws.ended)) return callback.call(stream, new Error('premature close'));\n\t};\n\n\tvar onrequest = function() {\n\t\tstream.req.on('finish', onfinish);\n\t};\n\n\tif (isRequest(stream)) {\n\t\tstream.on('complete', onfinish);\n\t\tstream.on('abort', onclose);\n\t\tif (stream.req) onrequest();\n\t\telse stream.on('request', onrequest);\n\t} else if (writable && !ws) { // legacy streams\n\t\tstream.on('end', onlegacyfinish);\n\t\tstream.on('close', onlegacyfinish);\n\t}\n\n\tif (isChildProcess(stream)) stream.on('exit', onexit);\n\n\tstream.on('end', onend);\n\tstream.on('finish', onfinish);\n\tif (opts.error !== false) stream.on('error', callback);\n\tstream.on('close', onclose);\n\n\treturn function() {\n\t\tstream.removeListener('complete', onfinish);\n\t\tstream.removeListener('abort', onclose);\n\t\tstream.removeListener('request', onrequest);\n\t\tif (stream.req) stream.req.removeListener('finish', onfinish);\n\t\tstream.removeListener('end', onlegacyfinish);\n\t\tstream.removeListener('close', onlegacyfinish);\n\t\tstream.removeListener('finish', onfinish);\n\t\tstream.removeListener('exit', onexit);\n\t\tstream.removeListener('end', onend);\n\t\tstream.removeListener('error', callback);\n\t\tstream.removeListener('close', onclose);\n\t};\n};\n\nmodule.exports = eos;\n\n},{\"once\":142}],127:[function(_dereq_,module,exports){\nexports.read = function (buffer, offset, isLE, mLen, nBytes) {\n  var e, m\n  var eLen = nBytes * 8 - mLen - 1\n  var eMax = (1 << eLen) - 1\n  var eBias = eMax >> 1\n  var nBits = -7\n  var i = isLE ? (nBytes - 1) : 0\n  var d = isLE ? -1 : 1\n  var s = buffer[offset + i]\n\n  i += d\n\n  e = s & ((1 << (-nBits)) - 1)\n  s >>= (-nBits)\n  nBits += eLen\n  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}\n\n  m = e & ((1 << (-nBits)) - 1)\n  e >>= (-nBits)\n  nBits += mLen\n  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}\n\n  if (e === 0) {\n    e = 1 - eBias\n  } else if (e === eMax) {\n    return m ? NaN : ((s ? -1 : 1) * Infinity)\n  } else {\n    m = m + Math.pow(2, mLen)\n    e = e - eBias\n  }\n  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)\n}\n\nexports.write = function (buffer, value, offset, isLE, mLen, nBytes) {\n  var e, m, c\n  var eLen = nBytes * 8 - mLen - 1\n  var eMax = (1 << eLen) - 1\n  var eBias = eMax >> 1\n  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)\n  var i = isLE ? 0 : (nBytes - 1)\n  var d = isLE ? 1 : -1\n  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0\n\n  value = Math.abs(value)\n\n  if (isNaN(value) || value === Infinity) {\n    m = isNaN(value) ? 1 : 0\n    e = eMax\n  } else {\n    e = Math.floor(Math.log(value) / Math.LN2)\n    if (value * (c = Math.pow(2, -e)) < 1) {\n      e--\n      c *= 2\n    }\n    if (e + eBias >= 1) {\n      value += rt / c\n    } else {\n      value += rt * Math.pow(2, 1 - eBias)\n    }\n    if (value * c >= 2) {\n      e++\n      c /= 2\n    }\n\n    if (e + eBias >= eMax) {\n      m = 0\n      e = eMax\n    } else if (e + eBias >= 1) {\n      m = (value * c - 1) * Math.pow(2, mLen)\n      e = e + eBias\n    } else {\n      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)\n      e = 0\n    }\n  }\n\n  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}\n\n  e = (e << mLen) | m\n  eLen += mLen\n  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}\n\n  buffer[offset + i - d] |= s * 128\n}\n\n},{}],128:[function(_dereq_,module,exports){\nif (typeof Object.create === 'function') {\n  // implementation from standard node.js 'util' module\n  module.exports = function inherits(ctor, superCtor) {\n    ctor.super_ = superCtor\n    ctor.prototype = Object.create(superCtor.prototype, {\n      constructor: {\n        value: ctor,\n        enumerable: false,\n        writable: true,\n        configurable: true\n      }\n    });\n  };\n} else {\n  // old school shim for old browsers\n  module.exports = function inherits(ctor, superCtor) {\n    ctor.super_ = superCtor\n    var TempCtor = function () {}\n    TempCtor.prototype = superCtor.prototype\n    ctor.prototype = new TempCtor()\n    ctor.prototype.constructor = ctor\n  }\n}\n\n},{}],129:[function(_dereq_,module,exports){\n/*!\n * Determine if an object is a Buffer\n *\n * @author   Feross Aboukhadijeh <https://feross.org>\n * @license  MIT\n */\n\n// The _isBuffer check is for Safari 5-7 support, because it's missing\n// Object.prototype.constructor. Remove this eventually\nmodule.exports = function (obj) {\n  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)\n}\n\nfunction isBuffer (obj) {\n  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)\n}\n\n// For Node v0.10 support. Remove this eventually.\nfunction isSlowBuffer (obj) {\n  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))\n}\n\n},{}],130:[function(_dereq_,module,exports){\nvar toString = {}.toString;\n\nmodule.exports = Array.isArray || function (arr) {\n  return toString.call(arr) == '[object Array]';\n};\n\n},{}],131:[function(_dereq_,module,exports){\nconst SafeEventEmitter = _dereq_('safe-event-emitter')\nconst DuplexStream = _dereq_('readable-stream').Duplex\n\nmodule.exports = createStreamMiddleware\n\nfunction createStreamMiddleware() {\n  const idMap = {}\n  const stream = new DuplexStream({\n    objectMode: true,\n    read: readNoop,\n    write: processMessage,\n  })\n\n  const events = new SafeEventEmitter()\n\n  const middleware = (req, res, next, end) => {\n    // write req to stream\n    stream.push(req)\n    // register request on id map\n    idMap[req.id] = { req, res, next, end }\n  }\n\n  return { events, middleware, stream }\n\n  function readNoop () {\n    return false\n  }\n\n  function processMessage (res, encoding, cb) {\n    let err\n    try {\n      const isNotification = !res.id\n      if (isNotification) {\n        processNotification(res)\n      } else {\n        processResponse(res)\n      }\n    } catch (_err) {\n      err = _err\n    }\n    // continue processing stream\n    cb(err)\n  }\n\n  function processResponse(res) {\n    const context = idMap[res.id]\n    if (!context) throw new Error(`StreamMiddleware - Unknown response id ${res.id}`)\n    delete idMap[res.id]\n    // copy whole res onto original res\n    Object.assign(context.res, res)\n    // run callback on empty stack,\n    // prevent internal stream-handler from catching errors\n    setTimeout(context.end)\n  }\n\n  function processNotification(res) {\n    events.emit('notification', res)\n  }\n\n}\n\n},{\"readable-stream\":156,\"safe-event-emitter\":160}],132:[function(_dereq_,module,exports){\n/*\n* loglevel - https://github.com/pimterry/loglevel\n*\n* Copyright (c) 2013 Tim Perry\n* Licensed under the MIT license.\n*/\n(function (root, definition) {\n    \"use strict\";\n    if (typeof define === 'function' && define.amd) {\n        define(definition);\n    } else if (typeof module === 'object' && module.exports) {\n        module.exports = definition();\n    } else {\n        root.log = definition();\n    }\n}(this, function () {\n    \"use strict\";\n\n    // Slightly dubious tricks to cut down minimized file size\n    var noop = function() {};\n    var undefinedType = \"undefined\";\n\n    var logMethods = [\n        \"trace\",\n        \"debug\",\n        \"info\",\n        \"warn\",\n        \"error\"\n    ];\n\n    // Cross-browser bind equivalent that works at least back to IE6\n    function bindMethod(obj, methodName) {\n        var method = obj[methodName];\n        if (typeof method.bind === 'function') {\n            return method.bind(obj);\n        } else {\n            try {\n                return Function.prototype.bind.call(method, obj);\n            } catch (e) {\n                // Missing bind shim or IE8 + Modernizr, fallback to wrapping\n                return function() {\n                    return Function.prototype.apply.apply(method, [obj, arguments]);\n                };\n            }\n        }\n    }\n\n    // Build the best logging method possible for this env\n    // Wherever possible we want to bind, not wrap, to preserve stack traces\n    function realMethod(methodName) {\n        if (methodName === 'debug') {\n            methodName = 'log';\n        }\n\n        if (typeof console === undefinedType) {\n            return false; // No method possible, for now - fixed later by enableLoggingWhenConsoleArrives\n        } else if (console[methodName] !== undefined) {\n            return bindMethod(console, methodName);\n        } else if (console.log !== undefined) {\n            return bindMethod(console, 'log');\n        } else {\n            return noop;\n        }\n    }\n\n    // These private functions always need `this` to be set properly\n\n    function replaceLoggingMethods(level, loggerName) {\n        /*jshint validthis:true */\n        for (var i = 0; i < logMethods.length; i++) {\n            var methodName = logMethods[i];\n            this[methodName] = (i < level) ?\n                noop :\n                this.methodFactory(methodName, level, loggerName);\n        }\n\n        // Define log.log as an alias for log.debug\n        this.log = this.debug;\n    }\n\n    // In old IE versions, the console isn't present until you first open it.\n    // We build realMethod() replacements here that regenerate logging methods\n    function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {\n        return function () {\n            if (typeof console !== undefinedType) {\n                replaceLoggingMethods.call(this, level, loggerName);\n                this[methodName].apply(this, arguments);\n            }\n        };\n    }\n\n    // By default, we use closely bound real methods wherever possible, and\n    // otherwise we wait for a console to appear, and then try again.\n    function defaultMethodFactory(methodName, level, loggerName) {\n        /*jshint validthis:true */\n        return realMethod(methodName) ||\n               enableLoggingWhenConsoleArrives.apply(this, arguments);\n    }\n\n    function Logger(name, defaultLevel, factory) {\n      var self = this;\n      var currentLevel;\n      var storageKey = \"loglevel\";\n      if (name) {\n        storageKey += \":\" + name;\n      }\n\n      function persistLevelIfPossible(levelNum) {\n          var levelName = (logMethods[levelNum] || 'silent').toUpperCase();\n\n          if (typeof window === undefinedType) return;\n\n          // Use localStorage if available\n          try {\n              window.localStorage[storageKey] = levelName;\n              return;\n          } catch (ignore) {}\n\n          // Use session cookie as fallback\n          try {\n              window.document.cookie =\n                encodeURIComponent(storageKey) + \"=\" + levelName + \";\";\n          } catch (ignore) {}\n      }\n\n      function getPersistedLevel() {\n          var storedLevel;\n\n          if (typeof window === undefinedType) return;\n\n          try {\n              storedLevel = window.localStorage[storageKey];\n          } catch (ignore) {}\n\n          // Fallback to cookies if local storage gives us nothing\n          if (typeof storedLevel === undefinedType) {\n              try {\n                  var cookie = window.document.cookie;\n                  var location = cookie.indexOf(\n                      encodeURIComponent(storageKey) + \"=\");\n                  if (location !== -1) {\n                      storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];\n                  }\n              } catch (ignore) {}\n          }\n\n          // If the stored level is not valid, treat it as if nothing was stored.\n          if (self.levels[storedLevel] === undefined) {\n              storedLevel = undefined;\n          }\n\n          return storedLevel;\n      }\n\n      /*\n       *\n       * Public logger API - see https://github.com/pimterry/loglevel for details\n       *\n       */\n\n      self.name = name;\n\n      self.levels = { \"TRACE\": 0, \"DEBUG\": 1, \"INFO\": 2, \"WARN\": 3,\n          \"ERROR\": 4, \"SILENT\": 5};\n\n      self.methodFactory = factory || defaultMethodFactory;\n\n      self.getLevel = function () {\n          return currentLevel;\n      };\n\n      self.setLevel = function (level, persist) {\n          if (typeof level === \"string\" && self.levels[level.toUpperCase()] !== undefined) {\n              level = self.levels[level.toUpperCase()];\n          }\n          if (typeof level === \"number\" && level >= 0 && level <= self.levels.SILENT) {\n              currentLevel = level;\n              if (persist !== false) {  // defaults to true\n                  persistLevelIfPossible(level);\n              }\n              replaceLoggingMethods.call(self, level, name);\n              if (typeof console === undefinedType && level < self.levels.SILENT) {\n                  return \"No console available for logging\";\n              }\n          } else {\n              throw \"log.setLevel() called with invalid level: \" + level;\n          }\n      };\n\n      self.setDefaultLevel = function (level) {\n          if (!getPersistedLevel()) {\n              self.setLevel(level, false);\n          }\n      };\n\n      self.enableAll = function(persist) {\n          self.setLevel(self.levels.TRACE, persist);\n      };\n\n      self.disableAll = function(persist) {\n          self.setLevel(self.levels.SILENT, persist);\n      };\n\n      // Initialize with the right level\n      var initialLevel = getPersistedLevel();\n      if (initialLevel == null) {\n          initialLevel = defaultLevel == null ? \"WARN\" : defaultLevel;\n      }\n      self.setLevel(initialLevel, false);\n    }\n\n    /*\n     *\n     * Top-level API\n     *\n     */\n\n    var defaultLogger = new Logger();\n\n    var _loggersByName = {};\n    defaultLogger.getLogger = function getLogger(name) {\n        if (typeof name !== \"string\" || name === \"\") {\n          throw new TypeError(\"You must supply a name when creating a logger.\");\n        }\n\n        var logger = _loggersByName[name];\n        if (!logger) {\n          logger = _loggersByName[name] = new Logger(\n            name, defaultLogger.getLevel(), defaultLogger.methodFactory);\n        }\n        return logger;\n    };\n\n    // Grab the current global log variable in case of overwrite\n    var _log = (typeof window !== undefinedType) ? window.log : undefined;\n    defaultLogger.noConflict = function() {\n        if (typeof window !== undefinedType &&\n               window.log === defaultLogger) {\n            window.log = _log;\n        }\n\n        return defaultLogger;\n    };\n\n    defaultLogger.getLoggers = function getLoggers() {\n        return _loggersByName;\n    };\n\n    return defaultLogger;\n}));\n\n},{}],133:[function(_dereq_,module,exports){\nconst log = _dereq_('loglevel')\n\n/**\n * JSON-RPC error object\n *\n * @typedef {Object} RpcError\n * @property {number} code - Indicates the error type that occurred\n * @property {Object} [data] - Contains additional information about the error\n * @property {string} [message] - Short description of the error\n */\n\n/**\n * Middleware configuration object\n *\n * @typedef {Object} MiddlewareConfig\n * @property {boolean} [override] - Use RPC_ERRORS message in place of provider message\n */\n\n/**\n * Map of standard and non-standard RPC error codes to messages\n */\nconst RPC_ERRORS = {\n  1: 'An unauthorized action was attempted.',\n  2: 'A disallowed action was attempted.',\n  3: 'An execution error occurred.',\n  [-32600]: 'The JSON sent is not a valid Request object.',\n  [-32601]: 'The method does not exist / is not available.',\n  [-32602]: 'Invalid method parameter(s).',\n  [-32603]: 'Internal JSON-RPC error.',\n  [-32700]: 'Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text.',\n  internal: 'Internal server error.',\n  unknown: 'Unknown JSON-RPC error.',\n}\n\n/**\n * Modifies a JSON-RPC error object in-place to add a human-readable message,\n * optionally overriding any provider-supplied message\n *\n * @param {RpcError} error - JSON-RPC error object\n * @param {boolean} override - Use RPC_ERRORS message in place of provider message\n */\nfunction sanitizeRPCError (error, override) {\n  if (error.message && !override) { return error }\n  const message = error.code > -31099 && error.code < -32100 ? RPC_ERRORS.internal : RPC_ERRORS[error.code]\n  error.message = message || RPC_ERRORS.unknown\n}\n\n/**\n * json-rpc-engine middleware that both logs standard and non-standard error\n * messages and ends middleware stack traversal if an error is encountered\n *\n * @param {MiddlewareConfig} [config={override:true}] - Middleware configuration\n * @returns {Function} json-rpc-engine middleware function\n */\nfunction createErrorMiddleware ({ override = true } = {}) {\n  return (req, res, next) => {\n    next(done => {\n      const { error } = res\n      if (!error) { return done() }\n      sanitizeRPCError(error)\n      log.error(`MetaMask - RPC Error: ${error.message}`, error)\n      done()\n    })\n  }\n}\n\nmodule.exports = createErrorMiddleware\n\n},{\"loglevel\":138}],134:[function(_dereq_,module,exports){\nconst pump = _dereq_('pump')\nconst RpcEngine = _dereq_('json-rpc-engine')\nconst createErrorMiddleware = _dereq_('./createErrorMiddleware')\nconst createIdRemapMiddleware = _dereq_('json-rpc-engine/src/idRemapMiddleware')\nconst createJsonRpcStream = _dereq_('json-rpc-middleware-stream')\nconst LocalStorageStore = _dereq_('obs-store')\nconst asStream = _dereq_('obs-store/lib/asStream')\nconst ObjectMultiplex = _dereq_('obj-multiplex')\nconst util = _dereq_('util')\nconst SafeEventEmitter = _dereq_('safe-event-emitter')\n\nmodule.exports = MetamaskInpageProvider\n\nutil.inherits(MetamaskInpageProvider, SafeEventEmitter)\n\nfunction MetamaskInpageProvider (connectionStream) {\n  const self = this\n\n  // super constructor\n  SafeEventEmitter.call(self)\n\n  // setup connectionStream multiplexing\n  const mux = self.mux = new ObjectMultiplex()\n  pump(\n    connectionStream,\n    mux,\n    connectionStream,\n    logStreamDisconnectWarning.bind(this, 'MetaMask')\n  )\n\n  // subscribe to metamask public config (one-way)\n  self.publicConfigStore = new LocalStorageStore({ storageKey: 'MetaMask-Config' })\n\n  pump(\n    mux.createStream('publicConfig'),\n    asStream(self.publicConfigStore),\n    logStreamDisconnectWarning.bind(this, 'MetaMask PublicConfigStore')\n  )\n\n  // ignore phishing warning message (handled elsewhere)\n  mux.ignoreStream('phishing')\n\n  // connect to async provider\n  const jsonRpcConnection = createJsonRpcStream()\n  pump(\n    jsonRpcConnection.stream,\n    mux.createStream('provider'),\n    jsonRpcConnection.stream,\n    logStreamDisconnectWarning.bind(this, 'MetaMask RpcProvider')\n  )\n\n  // handle sendAsync requests via dapp-side rpc engine\n  const rpcEngine = new RpcEngine()\n  rpcEngine.push(createIdRemapMiddleware())\n  rpcEngine.push(createErrorMiddleware())\n  rpcEngine.push(jsonRpcConnection.middleware)\n  self.rpcEngine = rpcEngine\n\n  // forward json rpc notifications\n  jsonRpcConnection.events.on('notification', function(payload) {\n    self.emit('data', null, payload)\n  })\n\n  // Work around for https://github.com/metamask/metamask-extension/issues/5459\n  // drizzle accidently breaking the `this` reference\n  self.send = self.send.bind(self)\n  self.sendAsync = self.sendAsync.bind(self)\n}\n\n// Web3 1.0 provider uses `send` with a callback for async queries\nMetamaskInpageProvider.prototype.send = function (payload, callback) {\n  const self = this\n\n  if (callback) {\n    self.sendAsync(payload, callback)\n  } else {\n    return self._sendSync(payload)\n  }\n}\n\n// handle sendAsync requests via asyncProvider\n// also remap ids inbound and outbound\nMetamaskInpageProvider.prototype.sendAsync = function (payload, cb) {\n  const self = this\n\n  if (payload.method === 'eth_signTypedData') {\n    console.warn('MetaMask: This experimental version of eth_signTypedData will be deprecated in the next release in favor of the standard as defined in EIP-712. See https://git.io/fNzPl for more information on the new standard.')\n  }\n\n  self.rpcEngine.handle(payload, cb)\n}\n\nMetamaskInpageProvider.prototype._sendSync = function (payload) {\n  const self = this\n\n  let selectedAddress\n  let result = null\n  switch (payload.method) {\n\n    case 'eth_accounts':\n      // read from localStorage\n      selectedAddress = self.publicConfigStore.getState().selectedAddress\n      result = selectedAddress ? [selectedAddress] : []\n      break\n\n    case 'eth_coinbase':\n      // read from localStorage\n      selectedAddress = self.publicConfigStore.getState().selectedAddress\n      result = selectedAddress || null\n      break\n\n    case 'eth_uninstallFilter':\n      self.sendAsync(payload, noop)\n      result = true\n      break\n\n    case 'net_version':\n      const networkVersion = self.publicConfigStore.getState().networkVersion\n      result = networkVersion || null\n      break\n\n    // throw not-supported Error\n    default:\n      var link = 'https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#dizzy-all-async---think-of-metamask-as-a-light-client'\n      var message = `The MetaMask Web3 object does not support synchronous methods like ${payload.method} without a callback parameter. See ${link} for details.`\n      throw new Error(message)\n\n  }\n\n  // return the result\n  return {\n    id: payload.id,\n    jsonrpc: payload.jsonrpc,\n    result: result,\n  }\n}\n\nMetamaskInpageProvider.prototype.isConnected = function () {\n  return true\n}\n\nMetamaskInpageProvider.prototype.isMetaMask = true\n\n// util\n\nfunction logStreamDisconnectWarning (remoteLabel, err) {\n  let warningMsg = `MetamaskInpageProvider - lost connection to ${remoteLabel}`\n  if (err) warningMsg += '\\n' + err.stack\n  console.warn(warningMsg)\n  const listeners = this.listenerCount('error')\n  if (listeners > 0) {\n    this.emit('error', warningMsg)\n  }\n}\n\nfunction noop () {}\n\n},{\"./createErrorMiddleware\":133,\"json-rpc-engine\":137,\"json-rpc-engine/src/idRemapMiddleware\":136,\"json-rpc-middleware-stream\":131,\"obj-multiplex\":139,\"obs-store\":140,\"obs-store/lib/asStream\":141,\"pump\":145,\"safe-event-emitter\":160,\"util\":169}],135:[function(_dereq_,module,exports){\n\"use strict\";\n\n// uint32 (two's complement) max\n// more conservative than Number.MAX_SAFE_INTEGER\nvar MAX = 4294967295;\nvar idCounter = Math.floor(Math.random() * MAX);\n\nmodule.exports = getUniqueId;\n\nfunction getUniqueId() {\n  idCounter = (idCounter + 1) % MAX;\n  return idCounter;\n}\n\n},{}],136:[function(_dereq_,module,exports){\n'use strict';\n\nvar getUniqueId = _dereq_('./getUniqueId');\n\nmodule.exports = createIdRemapMiddleware;\n\nfunction createIdRemapMiddleware() {\n  return function (req, res, next, end) {\n    var originalId = req.id;\n    var newId = getUniqueId();\n    req.id = newId;\n    res.id = newId;\n    next(function (done) {\n      req.id = originalId;\n      res.id = originalId;\n      done();\n    });\n  };\n}\n\n},{\"./getUniqueId\":135}],137:[function(_dereq_,module,exports){\n'use strict';\n\nvar _stringify = _dereq_('babel-runtime/core-js/json/stringify');\n\nvar _stringify2 = _interopRequireDefault(_stringify);\n\nvar _assign = _dereq_('babel-runtime/core-js/object/assign');\n\nvar _assign2 = _interopRequireDefault(_assign);\n\nvar _getPrototypeOf = _dereq_('babel-runtime/core-js/object/get-prototype-of');\n\nvar _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);\n\nvar _classCallCheck2 = _dereq_('babel-runtime/helpers/classCallCheck');\n\nvar _classCallCheck3 = _interopRequireDefault(_classCallCheck2);\n\nvar _createClass2 = _dereq_('babel-runtime/helpers/createClass');\n\nvar _createClass3 = _interopRequireDefault(_createClass2);\n\nvar _possibleConstructorReturn2 = _dereq_('babel-runtime/helpers/possibleConstructorReturn');\n\nvar _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);\n\nvar _inherits2 = _dereq_('babel-runtime/helpers/inherits');\n\nvar _inherits3 = _interopRequireDefault(_inherits2);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nvar async = _dereq_('async');\nvar SafeEventEmitter = _dereq_('safe-event-emitter');\n\nvar RpcEngine = function (_SafeEventEmitter) {\n  (0, _inherits3.default)(RpcEngine, _SafeEventEmitter);\n\n  function RpcEngine() {\n    (0, _classCallCheck3.default)(this, RpcEngine);\n\n    var _this = (0, _possibleConstructorReturn3.default)(this, (RpcEngine.__proto__ || (0, _getPrototypeOf2.default)(RpcEngine)).call(this));\n\n    _this._middleware = [];\n    return _this;\n  }\n\n  //\n  // Public\n  //\n\n  (0, _createClass3.default)(RpcEngine, [{\n    key: 'push',\n    value: function push(middleware) {\n      this._middleware.push(middleware);\n    }\n  }, {\n    key: 'handle',\n    value: function handle(req, cb) {\n      // batch request support\n      if (Array.isArray(req)) {\n        async.map(req, this._handle.bind(this), cb);\n      } else {\n        this._handle(req, cb);\n      }\n    }\n\n    //\n    // Private\n    //\n\n  }, {\n    key: '_handle',\n    value: function _handle(_req, cb) {\n      // shallow clone request object\n      var req = (0, _assign2.default)({}, _req);\n      // create response obj\n      var res = {\n        id: req.id,\n        jsonrpc: req.jsonrpc\n        // process all middleware\n      };this._runMiddleware(req, res, function (err) {\n        // return response\n        cb(err, res);\n      });\n    }\n  }, {\n    key: '_runMiddleware',\n    value: function _runMiddleware(req, res, onDone) {\n      var _this2 = this;\n\n      // flow\n      async.waterfall([function (cb) {\n        return _this2._runMiddlewareDown(req, res, cb);\n      }, checkForCompletion, function (returnHandlers, cb) {\n        return _this2._runReturnHandlersUp(returnHandlers, cb);\n      }], onDone);\n\n      function checkForCompletion(_ref, cb) {\n        var isComplete = _ref.isComplete,\n            returnHandlers = _ref.returnHandlers;\n\n        // fail if not completed\n        if (!('result' in res) && !('error' in res)) {\n          var requestBody = (0, _stringify2.default)(req, null, 2);\n          var message = 'JsonRpcEngine - response has no error or result for request:\\n' + requestBody;\n          return cb(new Error(message));\n        }\n        if (!isComplete) {\n          var _requestBody = (0, _stringify2.default)(req, null, 2);\n          var _message = 'JsonRpcEngine - nothing ended request:\\n' + _requestBody;\n          return cb(new Error(_message));\n        }\n        // continue\n        return cb(null, returnHandlers);\n      }\n\n      function runReturnHandlers(returnHandlers, cb) {\n        async.eachSeries(returnHandlers, function (handler, next) {\n          return handler(next);\n        }, onDone);\n      }\n    }\n\n    // walks down stack of middleware\n\n  }, {\n    key: '_runMiddlewareDown',\n    value: function _runMiddlewareDown(req, res, onDone) {\n      // for climbing back up the stack\n      var allReturnHandlers = [];\n      // flag for stack return\n      var isComplete = false;\n\n      // down stack of middleware, call and collect optional allReturnHandlers\n      async.mapSeries(this._middleware, eachMiddleware, completeRequest);\n\n      // runs an individual middleware\n      function eachMiddleware(middleware, cb) {\n        // skip middleware if completed\n        if (isComplete) return cb();\n        // run individual middleware\n        middleware(req, res, next, end);\n\n        function next(returnHandler) {\n          // add return handler\n          allReturnHandlers.push(returnHandler);\n          cb();\n        }\n        function end(err) {\n          if (err) return cb(err);\n          // mark as completed\n          isComplete = true;\n          cb();\n        }\n      }\n\n      // returns, indicating whether or not it ended\n      function completeRequest(err) {\n        if (err) {\n          // prepare error message\n          res.error = {\n            code: err.code || -32603,\n            message: err.stack\n            // return error-first and res with err\n          };return onDone(err, res);\n        }\n        var returnHandlers = allReturnHandlers.filter(Boolean).reverse();\n        onDone(null, { isComplete: isComplete, returnHandlers: returnHandlers });\n      }\n    }\n\n    // climbs the stack calling return handlers\n\n  }, {\n    key: '_runReturnHandlersUp',\n    value: function _runReturnHandlersUp(returnHandlers, cb) {\n      async.eachSeries(returnHandlers, function (handler, next) {\n        return handler(next);\n      }, cb);\n    }\n  }]);\n  return RpcEngine;\n}(SafeEventEmitter);\n\nmodule.exports = RpcEngine;\n\n},{\"async\":3,\"babel-runtime/core-js/json/stringify\":4,\"babel-runtime/core-js/object/assign\":5,\"babel-runtime/core-js/object/get-prototype-of\":9,\"babel-runtime/helpers/classCallCheck\":14,\"babel-runtime/helpers/createClass\":15,\"babel-runtime/helpers/inherits\":17,\"babel-runtime/helpers/possibleConstructorReturn\":18,\"safe-event-emitter\":160}],138:[function(_dereq_,module,exports){\narguments[4][132][0].apply(exports,arguments)\n},{\"dup\":132}],139:[function(_dereq_,module,exports){\nconst { Duplex } = _dereq_('readable-stream')\nconst endOfStream = _dereq_('end-of-stream')\nconst once = _dereq_('once')\nconst noop = () => {}\n\nconst IGNORE_SUBSTREAM = {}\n\n\nclass ObjectMultiplex extends Duplex {\n\n  constructor(_opts = {}) {\n    const opts = Object.assign({}, _opts, {\n      objectMode: true,\n    })\n    super(opts)\n\n    this._substreams = {}\n  }\n\n  createStream (name) {\n    // validate name\n    if (!name) throw new Error('ObjectMultiplex - name must not be empty')\n    if (this._substreams[name]) throw new Error('ObjectMultiplex - Substream for name \"${name}\" already exists')\n\n    // create substream\n    const substream = new Substream({ parent: this, name: name })\n    this._substreams[name] = substream\n\n    // listen for parent stream to end\n    anyStreamEnd(this, (err) => {\n      substream.destroy(err)\n    })\n\n    return substream\n  }\n\n  // ignore streams (dont display orphaned data warning)\n  ignoreStream (name) {\n    // validate name\n    if (!name) throw new Error('ObjectMultiplex - name must not be empty')\n    if (this._substreams[name]) throw new Error('ObjectMultiplex - Substream for name \"${name}\" already exists')\n    // set\n    this._substreams[name] = IGNORE_SUBSTREAM\n  }\n\n  // stream plumbing\n\n  _read () {}\n\n  _write(chunk, encoding, callback) {\n    // parse message\n    const name = chunk.name\n    const data = chunk.data\n    if (!name) {\n      console.warn(`ObjectMultiplex - malformed chunk without name \"${chunk}\"`)\n      return callback()\n    }\n\n    // get corresponding substream\n    const substream = this._substreams[name]\n    if (!substream) {\n      console.warn(`ObjectMultiplex - orphaned data for stream \"${name}\"`)\n      return callback()\n    }\n\n    // push data into substream\n    if (substream !== IGNORE_SUBSTREAM) {\n      substream.push(data)\n    }\n\n    callback()\n  }\n\n}\n\n\nclass Substream extends Duplex {\n\n  constructor ({ parent, name }) {\n    super({\n      objectMode: true,\n    })\n\n    this._parent = parent\n    this._name = name\n  }\n\n  _read () {}\n\n  _write (chunk, enc, callback) {\n    this._parent.push({\n      name: this._name,\n      data: chunk,\n    })\n    callback()\n  }\n\n}\n\nmodule.exports = ObjectMultiplex\n\n// util\n\nfunction anyStreamEnd(stream, _cb) {\n  const cb = once(_cb)\n  endOfStream(stream, { readable: false }, cb)\n  endOfStream(stream, { writable: false }, cb)\n}\n},{\"end-of-stream\":126,\"once\":142,\"readable-stream\":156}],140:[function(_dereq_,module,exports){\n'use strict';\n\nvar _assign = _dereq_('babel-runtime/core-js/object/assign');\n\nvar _assign2 = _interopRequireDefault(_assign);\n\nvar _typeof2 = _dereq_('babel-runtime/helpers/typeof');\n\nvar _typeof3 = _interopRequireDefault(_typeof2);\n\nvar _getPrototypeOf = _dereq_('babel-runtime/core-js/object/get-prototype-of');\n\nvar _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);\n\nvar _classCallCheck2 = _dereq_('babel-runtime/helpers/classCallCheck');\n\nvar _classCallCheck3 = _interopRequireDefault(_classCallCheck2);\n\nvar _createClass2 = _dereq_('babel-runtime/helpers/createClass');\n\nvar _createClass3 = _interopRequireDefault(_createClass2);\n\nvar _possibleConstructorReturn2 = _dereq_('babel-runtime/helpers/possibleConstructorReturn');\n\nvar _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);\n\nvar _inherits2 = _dereq_('babel-runtime/helpers/inherits');\n\nvar _inherits3 = _interopRequireDefault(_inherits2);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nvar extend = _dereq_('xtend');\nvar EventEmitter = _dereq_('events');\n\nvar ObservableStore = function (_EventEmitter) {\n  (0, _inherits3.default)(ObservableStore, _EventEmitter);\n\n  function ObservableStore() {\n    var initState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};\n    (0, _classCallCheck3.default)(this, ObservableStore);\n\n    // set init state\n    var _this = (0, _possibleConstructorReturn3.default)(this, (ObservableStore.__proto__ || (0, _getPrototypeOf2.default)(ObservableStore)).call(this));\n\n    _this._state = initState;\n    return _this;\n  }\n\n  // wrapper around internal getState\n\n\n  (0, _createClass3.default)(ObservableStore, [{\n    key: 'getState',\n    value: function getState() {\n      return this._getState();\n    }\n\n    // wrapper around internal putState\n\n  }, {\n    key: 'putState',\n    value: function putState(newState) {\n      this._putState(newState);\n      this.emit('update', newState);\n    }\n  }, {\n    key: 'updateState',\n    value: function updateState(partialState) {\n      // if non-null object, merge\n      if (partialState && (typeof partialState === 'undefined' ? 'undefined' : (0, _typeof3.default)(partialState)) === 'object') {\n        var state = this.getState();\n        var newState = (0, _assign2.default)({}, state, partialState);\n        this.putState(newState);\n        // if not object, use new value\n      } else {\n        this.putState(partialState);\n      }\n    }\n\n    // subscribe to changes\n\n  }, {\n    key: 'subscribe',\n    value: function subscribe(handler) {\n      this.on('update', handler);\n    }\n\n    // unsubscribe to changes\n\n  }, {\n    key: 'unsubscribe',\n    value: function unsubscribe(handler) {\n      this.removeListener('update', handler);\n    }\n\n    //\n    // private\n    //\n\n    // read from persistence\n\n  }, {\n    key: '_getState',\n    value: function _getState() {\n      return this._state;\n    }\n\n    // write to persistence\n\n  }, {\n    key: '_putState',\n    value: function _putState(newState) {\n      this._state = newState;\n    }\n  }]);\n  return ObservableStore;\n}(EventEmitter);\n\nmodule.exports = ObservableStore;\n\n},{\"babel-runtime/core-js/object/assign\":5,\"babel-runtime/core-js/object/get-prototype-of\":9,\"babel-runtime/helpers/classCallCheck\":14,\"babel-runtime/helpers/createClass\":15,\"babel-runtime/helpers/inherits\":17,\"babel-runtime/helpers/possibleConstructorReturn\":18,\"babel-runtime/helpers/typeof\":19,\"events\":22,\"xtend\":172}],141:[function(_dereq_,module,exports){\n'use strict';\n\nvar _getPrototypeOf = _dereq_('babel-runtime/core-js/object/get-prototype-of');\n\nvar _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);\n\nvar _classCallCheck2 = _dereq_('babel-runtime/helpers/classCallCheck');\n\nvar _classCallCheck3 = _interopRequireDefault(_classCallCheck2);\n\nvar _createClass2 = _dereq_('babel-runtime/helpers/createClass');\n\nvar _createClass3 = _interopRequireDefault(_createClass2);\n\nvar _possibleConstructorReturn2 = _dereq_('babel-runtime/helpers/possibleConstructorReturn');\n\nvar _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);\n\nvar _get2 = _dereq_('babel-runtime/helpers/get');\n\nvar _get3 = _interopRequireDefault(_get2);\n\nvar _inherits2 = _dereq_('babel-runtime/helpers/inherits');\n\nvar _inherits3 = _interopRequireDefault(_inherits2);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nvar DuplexStream = _dereq_('stream').Duplex;\n\nmodule.exports = asStream;\n\nfunction asStream(obsStore) {\n  return new ObsStoreStream(obsStore);\n}\n\n//\n//\n//\n//\n\nvar ObsStoreStream = function (_DuplexStream) {\n  (0, _inherits3.default)(ObsStoreStream, _DuplexStream);\n\n  function ObsStoreStream(obsStore) {\n    (0, _classCallCheck3.default)(this, ObsStoreStream);\n\n    // dont buffer outgoing updates\n    var _this = (0, _possibleConstructorReturn3.default)(this, (ObsStoreStream.__proto__ || (0, _getPrototypeOf2.default)(ObsStoreStream)).call(this, {\n      // pass values, not serializations\n      objectMode: true\n    }));\n\n    _this.resume();\n    // save handler so we can unsubscribe later\n    _this.handler = function (state) {\n      return _this.push(state);\n    };\n    // subscribe to obsStore changes\n    _this.obsStore = obsStore;\n    _this.obsStore.subscribe(_this.handler);\n    return _this;\n  }\n\n  // emit current state on new destination\n\n\n  (0, _createClass3.default)(ObsStoreStream, [{\n    key: 'pipe',\n    value: function pipe(dest, options) {\n      var result = DuplexStream.prototype.pipe.call(this, dest, options);\n      dest.write(this.obsStore.getState());\n      return result;\n    }\n\n    // write from incomming stream to state\n\n  }, {\n    key: '_write',\n    value: function _write(chunk, encoding, callback) {\n      this.obsStore.putState(chunk);\n      callback();\n    }\n\n    // noop - outgoing stream is asking us if we have data we arent giving it\n\n  }, {\n    key: '_read',\n    value: function _read(size) {}\n\n    // unsubscribe from event emitter\n\n  }, {\n    key: '_destroy',\n    value: function _destroy(err, callback) {\n      this.obsStore.unsubscribe(this.handler);\n      (0, _get3.default)(ObsStoreStream.prototype.__proto__ || (0, _getPrototypeOf2.default)(ObsStoreStream.prototype), '_destroy', this).call(this, err, callback);\n    }\n  }]);\n  return ObsStoreStream;\n}(DuplexStream);\n\n},{\"babel-runtime/core-js/object/get-prototype-of\":9,\"babel-runtime/helpers/classCallCheck\":14,\"babel-runtime/helpers/createClass\":15,\"babel-runtime/helpers/get\":16,\"babel-runtime/helpers/inherits\":17,\"babel-runtime/helpers/possibleConstructorReturn\":18,\"stream\":162}],142:[function(_dereq_,module,exports){\nvar wrappy = _dereq_('wrappy')\nmodule.exports = wrappy(once)\nmodule.exports.strict = wrappy(onceStrict)\n\nonce.proto = once(function () {\n  Object.defineProperty(Function.prototype, 'once', {\n    value: function () {\n      return once(this)\n    },\n    configurable: true\n  })\n\n  Object.defineProperty(Function.prototype, 'onceStrict', {\n    value: function () {\n      return onceStrict(this)\n    },\n    configurable: true\n  })\n})\n\nfunction once (fn) {\n  var f = function () {\n    if (f.called) return f.value\n    f.called = true\n    return f.value = fn.apply(this, arguments)\n  }\n  f.called = false\n  return f\n}\n\nfunction onceStrict (fn) {\n  var f = function () {\n    if (f.called)\n      throw new Error(f.onceError)\n    f.called = true\n    return f.value = fn.apply(this, arguments)\n  }\n  var name = fn.name || 'Function wrapped with `once`'\n  f.onceError = name + \" shouldn't be called more than once\"\n  f.called = false\n  return f\n}\n\n},{\"wrappy\":171}],143:[function(_dereq_,module,exports){\nconst DuplexStream = _dereq_('readable-stream').Duplex\nconst inherits = _dereq_('util').inherits\n\nmodule.exports = PostMessageStream\n\ninherits(PostMessageStream, DuplexStream)\n\nfunction PostMessageStream (opts) {\n  DuplexStream.call(this, {\n    objectMode: true,\n  })\n\n  this._name = opts.name\n  this._target = opts.target\n  this._targetWindow = opts.targetWindow || window\n  this._origin = (opts.targetWindow ? '*' : location.origin)\n\n  // initialization flags\n  this._init = false\n  this._haveSyn = false\n\n  window.addEventListener('message', this._onMessage.bind(this), false)\n  // send syncorization message\n  this._write('SYN', null, noop)\n  this.cork()\n}\n\n// private\nPostMessageStream.prototype._onMessage = function (event) {\n  var msg = event.data\n\n  // validate message\n  if (this._origin !== '*' && event.origin !== this._origin) return\n  if (event.source !== this._targetWindow) return\n  if (typeof msg !== 'object') return\n  if (msg.target !== this._name) return\n  if (!msg.data) return\n\n  if (!this._init) {\n    if (msg.data === 'SYN') {\n      this._haveSyn = true\n      this._write('ACK', null, noop)\n    } else if (msg.data === 'ACK') {\n      this._init = true\n      if (!this._haveSyn) {\n        this._write('ACK', null, noop)\n      }\n      this.uncork()\n    }\n  } else {\n    // forward message\n    try {\n      this.push(msg.data)\n    } catch (err) {\n      this.emit('error', err)\n    }\n  }\n}\n\n// stream plumbing\nPostMessageStream.prototype._read = noop\n\nPostMessageStream.prototype._write = function (data, encoding, cb) {\n  var message = {\n    target: this._target,\n    data: data,\n  }\n  this._targetWindow.postMessage(message, this._origin)\n  cb()\n}\n\n// util\n\nfunction noop () {}\n\n},{\"readable-stream\":156,\"util\":169}],144:[function(_dereq_,module,exports){\n(function (process){\n'use strict';\n\nif (!process.version ||\n    process.version.indexOf('v0.') === 0 ||\n    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {\n  module.exports = nextTick;\n} else {\n  module.exports = process.nextTick;\n}\n\nfunction nextTick(fn, arg1, arg2, arg3) {\n  if (typeof fn !== 'function') {\n    throw new TypeError('\"callback\" argument must be a function');\n  }\n  var len = arguments.length;\n  var args, i;\n  switch (len) {\n  case 0:\n  case 1:\n    return process.nextTick(fn);\n  case 2:\n    return process.nextTick(function afterTickOne() {\n      fn.call(null, arg1);\n    });\n  case 3:\n    return process.nextTick(function afterTickTwo() {\n      fn.call(null, arg1, arg2);\n    });\n  case 4:\n    return process.nextTick(function afterTickThree() {\n      fn.call(null, arg1, arg2, arg3);\n    });\n  default:\n    args = new Array(len - 1);\n    i = 0;\n    while (i < args.length) {\n      args[i++] = arguments[i];\n    }\n    return process.nextTick(function afterTick() {\n      fn.apply(null, args);\n    });\n  }\n}\n\n}).call(this,_dereq_('_process'))\n\n},{\"_process\":23}],145:[function(_dereq_,module,exports){\n(function (process){\nvar once = _dereq_('once')\nvar eos = _dereq_('end-of-stream')\nvar fs = _dereq_('fs') // we only need fs to get the ReadStream and WriteStream prototypes\n\nvar noop = function () {}\nvar ancient = /^v?\\.0/.test(process.version)\n\nvar isFn = function (fn) {\n  return typeof fn === 'function'\n}\n\nvar isFS = function (stream) {\n  if (!ancient) return false // newer node version do not need to care about fs is a special way\n  if (!fs) return false // browser\n  return (stream instanceof (fs.ReadStream || noop) || stream instanceof (fs.WriteStream || noop)) && isFn(stream.close)\n}\n\nvar isRequest = function (stream) {\n  return stream.setHeader && isFn(stream.abort)\n}\n\nvar destroyer = function (stream, reading, writing, callback) {\n  callback = once(callback)\n\n  var closed = false\n  stream.on('close', function () {\n    closed = true\n  })\n\n  eos(stream, {readable: reading, writable: writing}, function (err) {\n    if (err) return callback(err)\n    closed = true\n    callback()\n  })\n\n  var destroyed = false\n  return function (err) {\n    if (closed) return\n    if (destroyed) return\n    destroyed = true\n\n    if (isFS(stream)) return stream.close(noop) // use close for fs streams to avoid fd leaks\n    if (isRequest(stream)) return stream.abort() // request.destroy just do .end - .abort is what we want\n\n    if (isFn(stream.destroy)) return stream.destroy()\n\n    callback(err || new Error('stream was destroyed'))\n  }\n}\n\nvar call = function (fn) {\n  fn()\n}\n\nvar pipe = function (from, to) {\n  return from.pipe(to)\n}\n\nvar pump = function () {\n  var streams = Array.prototype.slice.call(arguments)\n  var callback = isFn(streams[streams.length - 1] || noop) && streams.pop() || noop\n\n  if (Array.isArray(streams[0])) streams = streams[0]\n  if (streams.length < 2) throw new Error('pump requires two streams per minimum')\n\n  var error\n  var destroys = streams.map(function (stream, i) {\n    var reading = i < streams.length - 1\n    var writing = i > 0\n    return destroyer(stream, reading, writing, function (err) {\n      if (!error) error = err\n      if (err) destroys.forEach(call)\n      if (reading) return\n      destroys.forEach(call)\n      callback(error)\n    })\n  })\n\n  return streams.reduce(pipe)\n}\n\nmodule.exports = pump\n\n}).call(this,_dereq_('_process'))\n\n},{\"_process\":23,\"end-of-stream\":126,\"fs\":21,\"once\":142}],146:[function(_dereq_,module,exports){\nmodule.exports = _dereq_('./lib/_stream_duplex.js');\n\n},{\"./lib/_stream_duplex.js\":147}],147:[function(_dereq_,module,exports){\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n// a duplex stream is just a stream that is both readable and writable.\n// Since JS doesn't have multiple prototypal inheritance, this class\n// prototypally inherits from Readable, and then parasitically from\n// Writable.\n\n'use strict';\n\n/*<replacement>*/\n\nvar processNextTick = _dereq_('process-nextick-args');\n/*</replacement>*/\n\n/*<replacement>*/\nvar objectKeys = Object.keys || function (obj) {\n  var keys = [];\n  for (var key in obj) {\n    keys.push(key);\n  }return keys;\n};\n/*</replacement>*/\n\nmodule.exports = Duplex;\n\n/*<replacement>*/\nvar util = _dereq_('core-util-is');\nutil.inherits = _dereq_('inherits');\n/*</replacement>*/\n\nvar Readable = _dereq_('./_stream_readable');\nvar Writable = _dereq_('./_stream_writable');\n\nutil.inherits(Duplex, Readable);\n\nvar keys = objectKeys(Writable.prototype);\nfor (var v = 0; v < keys.length; v++) {\n  var method = keys[v];\n  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];\n}\n\nfunction Duplex(options) {\n  if (!(this instanceof Duplex)) return new Duplex(options);\n\n  Readable.call(this, options);\n  Writable.call(this, options);\n\n  if (options && options.readable === false) this.readable = false;\n\n  if (options && options.writable === false) this.writable = false;\n\n  this.allowHalfOpen = true;\n  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;\n\n  this.once('end', onend);\n}\n\n// the no-half-open enforcer\nfunction onend() {\n  // if we allow half-open state, or if the writable side ended,\n  // then we're ok.\n  if (this.allowHalfOpen || this._writableState.ended) return;\n\n  // no more data can be written.\n  // But allow more writes to happen in this tick.\n  processNextTick(onEndNT, this);\n}\n\nfunction onEndNT(self) {\n  self.end();\n}\n\nObject.defineProperty(Duplex.prototype, 'destroyed', {\n  get: function () {\n    if (this._readableState === undefined || this._writableState === undefined) {\n      return false;\n    }\n    return this._readableState.destroyed && this._writableState.destroyed;\n  },\n  set: function (value) {\n    // we ignore the value if the stream\n    // has not been initialized yet\n    if (this._readableState === undefined || this._writableState === undefined) {\n      return;\n    }\n\n    // backward compatibility, the user is explicitly\n    // managing destroyed\n    this._readableState.destroyed = value;\n    this._writableState.destroyed = value;\n  }\n});\n\nDuplex.prototype._destroy = function (err, cb) {\n  this.push(null);\n  this.end();\n\n  processNextTick(cb, err);\n};\n\nfunction forEach(xs, f) {\n  for (var i = 0, l = xs.length; i < l; i++) {\n    f(xs[i], i);\n  }\n}\n},{\"./_stream_readable\":149,\"./_stream_writable\":151,\"core-util-is\":125,\"inherits\":128,\"process-nextick-args\":144}],148:[function(_dereq_,module,exports){\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n// a passthrough stream.\n// basically just the most minimal sort of Transform stream.\n// Every written chunk gets output as-is.\n\n'use strict';\n\nmodule.exports = PassThrough;\n\nvar Transform = _dereq_('./_stream_transform');\n\n/*<replacement>*/\nvar util = _dereq_('core-util-is');\nutil.inherits = _dereq_('inherits');\n/*</replacement>*/\n\nutil.inherits(PassThrough, Transform);\n\nfunction PassThrough(options) {\n  if (!(this instanceof PassThrough)) return new PassThrough(options);\n\n  Transform.call(this, options);\n}\n\nPassThrough.prototype._transform = function (chunk, encoding, cb) {\n  cb(null, chunk);\n};\n},{\"./_stream_transform\":150,\"core-util-is\":125,\"inherits\":128}],149:[function(_dereq_,module,exports){\n(function (process,global){\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n'use strict';\n\n/*<replacement>*/\n\nvar processNextTick = _dereq_('process-nextick-args');\n/*</replacement>*/\n\nmodule.exports = Readable;\n\n/*<replacement>*/\nvar isArray = _dereq_('isarray');\n/*</replacement>*/\n\n/*<replacement>*/\nvar Duplex;\n/*</replacement>*/\n\nReadable.ReadableState = ReadableState;\n\n/*<replacement>*/\nvar EE = _dereq_('events').EventEmitter;\n\nvar EElistenerCount = function (emitter, type) {\n  return emitter.listeners(type).length;\n};\n/*</replacement>*/\n\n/*<replacement>*/\nvar Stream = _dereq_('./internal/streams/stream');\n/*</replacement>*/\n\n// TODO(bmeurer): Change this back to const once hole checks are\n// properly optimized away early in Ignition+TurboFan.\n/*<replacement>*/\nvar Buffer = _dereq_('safe-buffer').Buffer;\nvar OurUint8Array = global.Uint8Array || function () {};\nfunction _uint8ArrayToBuffer(chunk) {\n  return Buffer.from(chunk);\n}\nfunction _isUint8Array(obj) {\n  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;\n}\n/*</replacement>*/\n\n/*<replacement>*/\nvar util = _dereq_('core-util-is');\nutil.inherits = _dereq_('inherits');\n/*</replacement>*/\n\n/*<replacement>*/\nvar debugUtil = _dereq_('util');\nvar debug = void 0;\nif (debugUtil && debugUtil.debuglog) {\n  debug = debugUtil.debuglog('stream');\n} else {\n  debug = function () {};\n}\n/*</replacement>*/\n\nvar BufferList = _dereq_('./internal/streams/BufferList');\nvar destroyImpl = _dereq_('./internal/streams/destroy');\nvar StringDecoder;\n\nutil.inherits(Readable, Stream);\n\nvar kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];\n\nfunction prependListener(emitter, event, fn) {\n  // Sadly this is not cacheable as some libraries bundle their own\n  // event emitter implementation with them.\n  if (typeof emitter.prependListener === 'function') {\n    return emitter.prependListener(event, fn);\n  } else {\n    // This is a hack to make sure that our error handler is attached before any\n    // userland ones.  NEVER DO THIS. This is here only because this code needs\n    // to continue to work with older versions of Node.js that do not include\n    // the prependListener() method. The goal is to eventually remove this hack.\n    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];\n  }\n}\n\nfunction ReadableState(options, stream) {\n  Duplex = Duplex || _dereq_('./_stream_duplex');\n\n  options = options || {};\n\n  // object stream flag. Used to make read(n) ignore n and to\n  // make all the buffer merging and length checks go away\n  this.objectMode = !!options.objectMode;\n\n  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;\n\n  // the point at which it stops calling _read() to fill the buffer\n  // Note: 0 is a valid value, means \"don't call _read preemptively ever\"\n  var hwm = options.highWaterMark;\n  var defaultHwm = this.objectMode ? 16 : 16 * 1024;\n  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;\n\n  // cast to ints.\n  this.highWaterMark = Math.floor(this.highWaterMark);\n\n  // A linked list is used to store data chunks instead of an array because the\n  // linked list can remove elements from the beginning faster than\n  // array.shift()\n  this.buffer = new BufferList();\n  this.length = 0;\n  this.pipes = null;\n  this.pipesCount = 0;\n  this.flowing = null;\n  this.ended = false;\n  this.endEmitted = false;\n  this.reading = false;\n\n  // a flag to be able to tell if the event 'readable'/'data' is emitted\n  // immediately, or on a later tick.  We set this to true at first, because\n  // any actions that shouldn't happen until \"later\" should generally also\n  // not happen before the first read call.\n  this.sync = true;\n\n  // whenever we return null, then we set a flag to say\n  // that we're awaiting a 'readable' event emission.\n  this.needReadable = false;\n  this.emittedReadable = false;\n  this.readableListening = false;\n  this.resumeScheduled = false;\n\n  // has it been destroyed\n  this.destroyed = false;\n\n  // Crypto is kind of old and crusty.  Historically, its default string\n  // encoding is 'binary' so we have to make this configurable.\n  // Everything else in the universe uses 'utf8', though.\n  this.defaultEncoding = options.defaultEncoding || 'utf8';\n\n  // the number of writers that are awaiting a drain event in .pipe()s\n  this.awaitDrain = 0;\n\n  // if true, a maybeReadMore has been scheduled\n  this.readingMore = false;\n\n  this.decoder = null;\n  this.encoding = null;\n  if (options.encoding) {\n    if (!StringDecoder) StringDecoder = _dereq_('string_decoder/').StringDecoder;\n    this.decoder = new StringDecoder(options.encoding);\n    this.encoding = options.encoding;\n  }\n}\n\nfunction Readable(options) {\n  Duplex = Duplex || _dereq_('./_stream_duplex');\n\n  if (!(this instanceof Readable)) return new Readable(options);\n\n  this._readableState = new ReadableState(options, this);\n\n  // legacy\n  this.readable = true;\n\n  if (options) {\n    if (typeof options.read === 'function') this._read = options.read;\n\n    if (typeof options.destroy === 'function') this._destroy = options.destroy;\n  }\n\n  Stream.call(this);\n}\n\nObject.defineProperty(Readable.prototype, 'destroyed', {\n  get: function () {\n    if (this._readableState === undefined) {\n      return false;\n    }\n    return this._readableState.destroyed;\n  },\n  set: function (value) {\n    // we ignore the value if the stream\n    // has not been initialized yet\n    if (!this._readableState) {\n      return;\n    }\n\n    // backward compatibility, the user is explicitly\n    // managing destroyed\n    this._readableState.destroyed = value;\n  }\n});\n\nReadable.prototype.destroy = destroyImpl.destroy;\nReadable.prototype._undestroy = destroyImpl.undestroy;\nReadable.prototype._destroy = function (err, cb) {\n  this.push(null);\n  cb(err);\n};\n\n// Manually shove something into the read() buffer.\n// This returns true if the highWaterMark has not been hit yet,\n// similar to how Writable.write() returns true if you should\n// write() some more.\nReadable.prototype.push = function (chunk, encoding) {\n  var state = this._readableState;\n  var skipChunkCheck;\n\n  if (!state.objectMode) {\n    if (typeof chunk === 'string') {\n      encoding = encoding || state.defaultEncoding;\n      if (encoding !== state.encoding) {\n        chunk = Buffer.from(chunk, encoding);\n        encoding = '';\n      }\n      skipChunkCheck = true;\n    }\n  } else {\n    skipChunkCheck = true;\n  }\n\n  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);\n};\n\n// Unshift should *always* be something directly out of read()\nReadable.prototype.unshift = function (chunk) {\n  return readableAddChunk(this, chunk, null, true, false);\n};\n\nfunction readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {\n  var state = stream._readableState;\n  if (chunk === null) {\n    state.reading = false;\n    onEofChunk(stream, state);\n  } else {\n    var er;\n    if (!skipChunkCheck) er = chunkInvalid(state, chunk);\n    if (er) {\n      stream.emit('error', er);\n    } else if (state.objectMode || chunk && chunk.length > 0) {\n      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {\n        chunk = _uint8ArrayToBuffer(chunk);\n      }\n\n      if (addToFront) {\n        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);\n      } else if (state.ended) {\n        stream.emit('error', new Error('stream.push() after EOF'));\n      } else {\n        state.reading = false;\n        if (state.decoder && !encoding) {\n          chunk = state.decoder.write(chunk);\n          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);\n        } else {\n          addChunk(stream, state, chunk, false);\n        }\n      }\n    } else if (!addToFront) {\n      state.reading = false;\n    }\n  }\n\n  return needMoreData(state);\n}\n\nfunction addChunk(stream, state, chunk, addToFront) {\n  if (state.flowing && state.length === 0 && !state.sync) {\n    stream.emit('data', chunk);\n    stream.read(0);\n  } else {\n    // update the buffer info.\n    state.length += state.objectMode ? 1 : chunk.length;\n    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);\n\n    if (state.needReadable) emitReadable(stream);\n  }\n  maybeReadMore(stream, state);\n}\n\nfunction chunkInvalid(state, chunk) {\n  var er;\n  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {\n    er = new TypeError('Invalid non-string/buffer chunk');\n  }\n  return er;\n}\n\n// if it's past the high water mark, we can push in some more.\n// Also, if we have no data yet, we can stand some\n// more bytes.  This is to work around cases where hwm=0,\n// such as the repl.  Also, if the push() triggered a\n// readable event, and the user called read(largeNumber) such that\n// needReadable was set, then we ought to push more, so that another\n// 'readable' event will be triggered.\nfunction needMoreData(state) {\n  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);\n}\n\nReadable.prototype.isPaused = function () {\n  return this._readableState.flowing === false;\n};\n\n// backwards compatibility.\nReadable.prototype.setEncoding = function (enc) {\n  if (!StringDecoder) StringDecoder = _dereq_('string_decoder/').StringDecoder;\n  this._readableState.decoder = new StringDecoder(enc);\n  this._readableState.encoding = enc;\n  return this;\n};\n\n// Don't raise the hwm > 8MB\nvar MAX_HWM = 0x800000;\nfunction computeNewHighWaterMark(n) {\n  if (n >= MAX_HWM) {\n    n = MAX_HWM;\n  } else {\n    // Get the next highest power of 2 to prevent increasing hwm excessively in\n    // tiny amounts\n    n--;\n    n |= n >>> 1;\n    n |= n >>> 2;\n    n |= n >>> 4;\n    n |= n >>> 8;\n    n |= n >>> 16;\n    n++;\n  }\n  return n;\n}\n\n// This function is designed to be inlinable, so please take care when making\n// changes to the function body.\nfunction howMuchToRead(n, state) {\n  if (n <= 0 || state.length === 0 && state.ended) return 0;\n  if (state.objectMode) return 1;\n  if (n !== n) {\n    // Only flow one buffer at a time\n    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;\n  }\n  // If we're asking for more than the current hwm, then raise the hwm.\n  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);\n  if (n <= state.length) return n;\n  // Don't have enough\n  if (!state.ended) {\n    state.needReadable = true;\n    return 0;\n  }\n  return state.length;\n}\n\n// you can override either this method, or the async _read(n) below.\nReadable.prototype.read = function (n) {\n  debug('read', n);\n  n = parseInt(n, 10);\n  var state = this._readableState;\n  var nOrig = n;\n\n  if (n !== 0) state.emittedReadable = false;\n\n  // if we're doing read(0) to trigger a readable event, but we\n  // already have a bunch of data in the buffer, then just trigger\n  // the 'readable' event and move on.\n  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {\n    debug('read: emitReadable', state.length, state.ended);\n    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);\n    return null;\n  }\n\n  n = howMuchToRead(n, state);\n\n  // if we've ended, and we're now clear, then finish it up.\n  if (n === 0 && state.ended) {\n    if (state.length === 0) endReadable(this);\n    return null;\n  }\n\n  // All the actual chunk generation logic needs to be\n  // *below* the call to _read.  The reason is that in certain\n  // synthetic stream cases, such as passthrough streams, _read\n  // may be a completely synchronous operation which may change\n  // the state of the read buffer, providing enough data when\n  // before there was *not* enough.\n  //\n  // So, the steps are:\n  // 1. Figure out what the state of things will be after we do\n  // a read from the buffer.\n  //\n  // 2. If that resulting state will trigger a _read, then call _read.\n  // Note that this may be asynchronous, or synchronous.  Yes, it is\n  // deeply ugly to write APIs this way, but that still doesn't mean\n  // that the Readable class should behave improperly, as streams are\n  // designed to be sync/async agnostic.\n  // Take note if the _read call is sync or async (ie, if the read call\n  // has returned yet), so that we know whether or not it's safe to emit\n  // 'readable' etc.\n  //\n  // 3. Actually pull the requested chunks out of the buffer and return.\n\n  // if we need a readable event, then we need to do some reading.\n  var doRead = state.needReadable;\n  debug('need readable', doRead);\n\n  // if we currently have less than the highWaterMark, then also read some\n  if (state.length === 0 || state.length - n < state.highWaterMark) {\n    doRead = true;\n    debug('length less than watermark', doRead);\n  }\n\n  // however, if we've ended, then there's no point, and if we're already\n  // reading, then it's unnecessary.\n  if (state.ended || state.reading) {\n    doRead = false;\n    debug('reading or ended', doRead);\n  } else if (doRead) {\n    debug('do read');\n    state.reading = true;\n    state.sync = true;\n    // if the length is currently zero, then we *need* a readable event.\n    if (state.length === 0) state.needReadable = true;\n    // call internal read method\n    this._read(state.highWaterMark);\n    state.sync = false;\n    // If _read pushed data synchronously, then `reading` will be false,\n    // and we need to re-evaluate how much data we can return to the user.\n    if (!state.reading) n = howMuchToRead(nOrig, state);\n  }\n\n  var ret;\n  if (n > 0) ret = fromList(n, state);else ret = null;\n\n  if (ret === null) {\n    state.needReadable = true;\n    n = 0;\n  } else {\n    state.length -= n;\n  }\n\n  if (state.length === 0) {\n    // If we have nothing in the buffer, then we want to know\n    // as soon as we *do* get something into the buffer.\n    if (!state.ended) state.needReadable = true;\n\n    // If we tried to read() past the EOF, then emit end on the next tick.\n    if (nOrig !== n && state.ended) endReadable(this);\n  }\n\n  if (ret !== null) this.emit('data', ret);\n\n  return ret;\n};\n\nfunction onEofChunk(stream, state) {\n  if (state.ended) return;\n  if (state.decoder) {\n    var chunk = state.decoder.end();\n    if (chunk && chunk.length) {\n      state.buffer.push(chunk);\n      state.length += state.objectMode ? 1 : chunk.length;\n    }\n  }\n  state.ended = true;\n\n  // emit 'readable' now to make sure it gets picked up.\n  emitReadable(stream);\n}\n\n// Don't emit readable right away in sync mode, because this can trigger\n// another read() call => stack overflow.  This way, it might trigger\n// a nextTick recursion warning, but that's not so bad.\nfunction emitReadable(stream) {\n  var state = stream._readableState;\n  state.needReadable = false;\n  if (!state.emittedReadable) {\n    debug('emitReadable', state.flowing);\n    state.emittedReadable = true;\n    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);\n  }\n}\n\nfunction emitReadable_(stream) {\n  debug('emit readable');\n  stream.emit('readable');\n  flow(stream);\n}\n\n// at this point, the user has presumably seen the 'readable' event,\n// and called read() to consume some data.  that may have triggered\n// in turn another _read(n) call, in which case reading = true if\n// it's in progress.\n// However, if we're not ended, or reading, and the length < hwm,\n// then go ahead and try to read some more preemptively.\nfunction maybeReadMore(stream, state) {\n  if (!state.readingMore) {\n    state.readingMore = true;\n    processNextTick(maybeReadMore_, stream, state);\n  }\n}\n\nfunction maybeReadMore_(stream, state) {\n  var len = state.length;\n  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {\n    debug('maybeReadMore read 0');\n    stream.read(0);\n    if (len === state.length)\n      // didn't get any data, stop spinning.\n      break;else len = state.length;\n  }\n  state.readingMore = false;\n}\n\n// abstract method.  to be overridden in specific implementation classes.\n// call cb(er, data) where data is <= n in length.\n// for virtual (non-string, non-buffer) streams, \"length\" is somewhat\n// arbitrary, and perhaps not very meaningful.\nReadable.prototype._read = function (n) {\n  this.emit('error', new Error('_read() is not implemented'));\n};\n\nReadable.prototype.pipe = function (dest, pipeOpts) {\n  var src = this;\n  var state = this._readableState;\n\n  switch (state.pipesCount) {\n    case 0:\n      state.pipes = dest;\n      break;\n    case 1:\n      state.pipes = [state.pipes, dest];\n      break;\n    default:\n      state.pipes.push(dest);\n      break;\n  }\n  state.pipesCount += 1;\n  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);\n\n  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;\n\n  var endFn = doEnd ? onend : unpipe;\n  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);\n\n  dest.on('unpipe', onunpipe);\n  function onunpipe(readable, unpipeInfo) {\n    debug('onunpipe');\n    if (readable === src) {\n      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {\n        unpipeInfo.hasUnpiped = true;\n        cleanup();\n      }\n    }\n  }\n\n  function onend() {\n    debug('onend');\n    dest.end();\n  }\n\n  // when the dest drains, it reduces the awaitDrain counter\n  // on the source.  This would be more elegant with a .once()\n  // handler in flow(), but adding and removing repeatedly is\n  // too slow.\n  var ondrain = pipeOnDrain(src);\n  dest.on('drain', ondrain);\n\n  var cleanedUp = false;\n  function cleanup() {\n    debug('cleanup');\n    // cleanup event handlers once the pipe is broken\n    dest.removeListener('close', onclose);\n    dest.removeListener('finish', onfinish);\n    dest.removeListener('drain', ondrain);\n    dest.removeListener('error', onerror);\n    dest.removeListener('unpipe', onunpipe);\n    src.removeListener('end', onend);\n    src.removeListener('end', unpipe);\n    src.removeListener('data', ondata);\n\n    cleanedUp = true;\n\n    // if the reader is waiting for a drain event from this\n    // specific writer, then it would cause it to never start\n    // flowing again.\n    // So, if this is awaiting a drain, then we just call it now.\n    // If we don't know, then assume that we are waiting for one.\n    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();\n  }\n\n  // If the user pushes more data while we're writing to dest then we'll end up\n  // in ondata again. However, we only want to increase awaitDrain once because\n  // dest will only emit one 'drain' event for the multiple writes.\n  // => Introduce a guard on increasing awaitDrain.\n  var increasedAwaitDrain = false;\n  src.on('data', ondata);\n  function ondata(chunk) {\n    debug('ondata');\n    increasedAwaitDrain = false;\n    var ret = dest.write(chunk);\n    if (false === ret && !increasedAwaitDrain) {\n      // If the user unpiped during `dest.write()`, it is possible\n      // to get stuck in a permanently paused state if that write\n      // also returned false.\n      // => Check whether `dest` is still a piping destination.\n      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {\n        debug('false write response, pause', src._readableState.awaitDrain);\n        src._readableState.awaitDrain++;\n        increasedAwaitDrain = true;\n      }\n      src.pause();\n    }\n  }\n\n  // if the dest has an error, then stop piping into it.\n  // however, don't suppress the throwing behavior for this.\n  function onerror(er) {\n    debug('onerror', er);\n    unpipe();\n    dest.removeListener('error', onerror);\n    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);\n  }\n\n  // Make sure our error handler is attached before userland ones.\n  prependListener(dest, 'error', onerror);\n\n  // Both close and finish should trigger unpipe, but only once.\n  function onclose() {\n    dest.removeListener('finish', onfinish);\n    unpipe();\n  }\n  dest.once('close', onclose);\n  function onfinish() {\n    debug('onfinish');\n    dest.removeListener('close', onclose);\n    unpipe();\n  }\n  dest.once('finish', onfinish);\n\n  function unpipe() {\n    debug('unpipe');\n    src.unpipe(dest);\n  }\n\n  // tell the dest that it's being piped to\n  dest.emit('pipe', src);\n\n  // start the flow if it hasn't been started already.\n  if (!state.flowing) {\n    debug('pipe resume');\n    src.resume();\n  }\n\n  return dest;\n};\n\nfunction pipeOnDrain(src) {\n  return function () {\n    var state = src._readableState;\n    debug('pipeOnDrain', state.awaitDrain);\n    if (state.awaitDrain) state.awaitDrain--;\n    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {\n      state.flowing = true;\n      flow(src);\n    }\n  };\n}\n\nReadable.prototype.unpipe = function (dest) {\n  var state = this._readableState;\n  var unpipeInfo = { hasUnpiped: false };\n\n  // if we're not piping anywhere, then do nothing.\n  if (state.pipesCount === 0) return this;\n\n  // just one destination.  most common case.\n  if (state.pipesCount === 1) {\n    // passed in one, but it's not the right one.\n    if (dest && dest !== state.pipes) return this;\n\n    if (!dest) dest = state.pipes;\n\n    // got a match.\n    state.pipes = null;\n    state.pipesCount = 0;\n    state.flowing = false;\n    if (dest) dest.emit('unpipe', this, unpipeInfo);\n    return this;\n  }\n\n  // slow case. multiple pipe destinations.\n\n  if (!dest) {\n    // remove all.\n    var dests = state.pipes;\n    var len = state.pipesCount;\n    state.pipes = null;\n    state.pipesCount = 0;\n    state.flowing = false;\n\n    for (var i = 0; i < len; i++) {\n      dests[i].emit('unpipe', this, unpipeInfo);\n    }return this;\n  }\n\n  // try to find the right one.\n  var index = indexOf(state.pipes, dest);\n  if (index === -1) return this;\n\n  state.pipes.splice(index, 1);\n  state.pipesCount -= 1;\n  if (state.pipesCount === 1) state.pipes = state.pipes[0];\n\n  dest.emit('unpipe', this, unpipeInfo);\n\n  return this;\n};\n\n// set up data events if they are asked for\n// Ensure readable listeners eventually get something\nReadable.prototype.on = function (ev, fn) {\n  var res = Stream.prototype.on.call(this, ev, fn);\n\n  if (ev === 'data') {\n    // Start flowing on next tick if stream isn't explicitly paused\n    if (this._readableState.flowing !== false) this.resume();\n  } else if (ev === 'readable') {\n    var state = this._readableState;\n    if (!state.endEmitted && !state.readableListening) {\n      state.readableListening = state.needReadable = true;\n      state.emittedReadable = false;\n      if (!state.reading) {\n        processNextTick(nReadingNextTick, this);\n      } else if (state.length) {\n        emitReadable(this);\n      }\n    }\n  }\n\n  return res;\n};\nReadable.prototype.addListener = Readable.prototype.on;\n\nfunction nReadingNextTick(self) {\n  debug('readable nexttick read 0');\n  self.read(0);\n}\n\n// pause() and resume() are remnants of the legacy readable stream API\n// If the user uses them, then switch into old mode.\nReadable.prototype.resume = function () {\n  var state = this._readableState;\n  if (!state.flowing) {\n    debug('resume');\n    state.flowing = true;\n    resume(this, state);\n  }\n  return this;\n};\n\nfunction resume(stream, state) {\n  if (!state.resumeScheduled) {\n    state.resumeScheduled = true;\n    processNextTick(resume_, stream, state);\n  }\n}\n\nfunction resume_(stream, state) {\n  if (!state.reading) {\n    debug('resume read 0');\n    stream.read(0);\n  }\n\n  state.resumeScheduled = false;\n  state.awaitDrain = 0;\n  stream.emit('resume');\n  flow(stream);\n  if (state.flowing && !state.reading) stream.read(0);\n}\n\nReadable.prototype.pause = function () {\n  debug('call pause flowing=%j', this._readableState.flowing);\n  if (false !== this._readableState.flowing) {\n    debug('pause');\n    this._readableState.flowing = false;\n    this.emit('pause');\n  }\n  return this;\n};\n\nfunction flow(stream) {\n  var state = stream._readableState;\n  debug('flow', state.flowing);\n  while (state.flowing && stream.read() !== null) {}\n}\n\n// wrap an old-style stream as the async data source.\n// This is *not* part of the readable stream interface.\n// It is an ugly unfortunate mess of history.\nReadable.prototype.wrap = function (stream) {\n  var state = this._readableState;\n  var paused = false;\n\n  var self = this;\n  stream.on('end', function () {\n    debug('wrapped end');\n    if (state.decoder && !state.ended) {\n      var chunk = state.decoder.end();\n      if (chunk && chunk.length) self.push(chunk);\n    }\n\n    self.push(null);\n  });\n\n  stream.on('data', function (chunk) {\n    debug('wrapped data');\n    if (state.decoder) chunk = state.decoder.write(chunk);\n\n    // don't skip over falsy values in objectMode\n    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;\n\n    var ret = self.push(chunk);\n    if (!ret) {\n      paused = true;\n      stream.pause();\n    }\n  });\n\n  // proxy all the other methods.\n  // important when wrapping filters and duplexes.\n  for (var i in stream) {\n    if (this[i] === undefined && typeof stream[i] === 'function') {\n      this[i] = function (method) {\n        return function () {\n          return stream[method].apply(stream, arguments);\n        };\n      }(i);\n    }\n  }\n\n  // proxy certain important events.\n  for (var n = 0; n < kProxyEvents.length; n++) {\n    stream.on(kProxyEvents[n], self.emit.bind(self, kProxyEvents[n]));\n  }\n\n  // when we try to consume some more bytes, simply unpause the\n  // underlying stream.\n  self._read = function (n) {\n    debug('wrapped _read', n);\n    if (paused) {\n      paused = false;\n      stream.resume();\n    }\n  };\n\n  return self;\n};\n\n// exposed for testing purposes only.\nReadable._fromList = fromList;\n\n// Pluck off n bytes from an array of buffers.\n// Length is the combined lengths of all the buffers in the list.\n// This function is designed to be inlinable, so please take care when making\n// changes to the function body.\nfunction fromList(n, state) {\n  // nothing buffered\n  if (state.length === 0) return null;\n\n  var ret;\n  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {\n    // read it all, truncate the list\n    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);\n    state.buffer.clear();\n  } else {\n    // read part of list\n    ret = fromListPartial(n, state.buffer, state.decoder);\n  }\n\n  return ret;\n}\n\n// Extracts only enough buffered data to satisfy the amount requested.\n// This function is designed to be inlinable, so please take care when making\n// changes to the function body.\nfunction fromListPartial(n, list, hasStrings) {\n  var ret;\n  if (n < list.head.data.length) {\n    // slice is the same for buffers and strings\n    ret = list.head.data.slice(0, n);\n    list.head.data = list.head.data.slice(n);\n  } else if (n === list.head.data.length) {\n    // first chunk is a perfect match\n    ret = list.shift();\n  } else {\n    // result spans more than one buffer\n    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);\n  }\n  return ret;\n}\n\n// Copies a specified amount of characters from the list of buffered data\n// chunks.\n// This function is designed to be inlinable, so please take care when making\n// changes to the function body.\nfunction copyFromBufferString(n, list) {\n  var p = list.head;\n  var c = 1;\n  var ret = p.data;\n  n -= ret.length;\n  while (p = p.next) {\n    var str = p.data;\n    var nb = n > str.length ? str.length : n;\n    if (nb === str.length) ret += str;else ret += str.slice(0, n);\n    n -= nb;\n    if (n === 0) {\n      if (nb === str.length) {\n        ++c;\n        if (p.next) list.head = p.next;else list.head = list.tail = null;\n      } else {\n        list.head = p;\n        p.data = str.slice(nb);\n      }\n      break;\n    }\n    ++c;\n  }\n  list.length -= c;\n  return ret;\n}\n\n// Copies a specified amount of bytes from the list of buffered data chunks.\n// This function is designed to be inlinable, so please take care when making\n// changes to the function body.\nfunction copyFromBuffer(n, list) {\n  var ret = Buffer.allocUnsafe(n);\n  var p = list.head;\n  var c = 1;\n  p.data.copy(ret);\n  n -= p.data.length;\n  while (p = p.next) {\n    var buf = p.data;\n    var nb = n > buf.length ? buf.length : n;\n    buf.copy(ret, ret.length - n, 0, nb);\n    n -= nb;\n    if (n === 0) {\n      if (nb === buf.length) {\n        ++c;\n        if (p.next) list.head = p.next;else list.head = list.tail = null;\n      } else {\n        list.head = p;\n        p.data = buf.slice(nb);\n      }\n      break;\n    }\n    ++c;\n  }\n  list.length -= c;\n  return ret;\n}\n\nfunction endReadable(stream) {\n  var state = stream._readableState;\n\n  // If we get here before consuming all the bytes, then that is a\n  // bug in node.  Should never happen.\n  if (state.length > 0) throw new Error('\"endReadable()\" called on non-empty stream');\n\n  if (!state.endEmitted) {\n    state.ended = true;\n    processNextTick(endReadableNT, state, stream);\n  }\n}\n\nfunction endReadableNT(state, stream) {\n  // Check that we didn't get one last unshift.\n  if (!state.endEmitted && state.length === 0) {\n    state.endEmitted = true;\n    stream.readable = false;\n    stream.emit('end');\n  }\n}\n\nfunction forEach(xs, f) {\n  for (var i = 0, l = xs.length; i < l; i++) {\n    f(xs[i], i);\n  }\n}\n\nfunction indexOf(xs, x) {\n  for (var i = 0, l = xs.length; i < l; i++) {\n    if (xs[i] === x) return i;\n  }\n  return -1;\n}\n}).call(this,_dereq_('_process'),typeof global !== \"undefined\" ? global : typeof self !== \"undefined\" ? self : typeof window !== \"undefined\" ? window : {})\n\n},{\"./_stream_duplex\":147,\"./internal/streams/BufferList\":152,\"./internal/streams/destroy\":153,\"./internal/streams/stream\":154,\"_process\":23,\"core-util-is\":125,\"events\":22,\"inherits\":128,\"isarray\":130,\"process-nextick-args\":144,\"safe-buffer\":159,\"string_decoder/\":163,\"util\":21}],150:[function(_dereq_,module,exports){\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n// a transform stream is a readable/writable stream where you do\n// something with the data.  Sometimes it's called a \"filter\",\n// but that's not a great name for it, since that implies a thing where\n// some bits pass through, and others are simply ignored.  (That would\n// be a valid example of a transform, of course.)\n//\n// While the output is causally related to the input, it's not a\n// necessarily symmetric or synchronous transformation.  For example,\n// a zlib stream might take multiple plain-text writes(), and then\n// emit a single compressed chunk some time in the future.\n//\n// Here's how this works:\n//\n// The Transform stream has all the aspects of the readable and writable\n// stream classes.  When you write(chunk), that calls _write(chunk,cb)\n// internally, and returns false if there's a lot of pending writes\n// buffered up.  When you call read(), that calls _read(n) until\n// there's enough pending readable data buffered up.\n//\n// In a transform stream, the written data is placed in a buffer.  When\n// _read(n) is called, it transforms the queued up data, calling the\n// buffered _write cb's as it consumes chunks.  If consuming a single\n// written chunk would result in multiple output chunks, then the first\n// outputted bit calls the readcb, and subsequent chunks just go into\n// the read buffer, and will cause it to emit 'readable' if necessary.\n//\n// This way, back-pressure is actually determined by the reading side,\n// since _read has to be called to start processing a new chunk.  However,\n// a pathological inflate type of transform can cause excessive buffering\n// here.  For example, imagine a stream where every byte of input is\n// interpreted as an integer from 0-255, and then results in that many\n// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in\n// 1kb of data being output.  In this case, you could write a very small\n// amount of input, and end up with a very large amount of output.  In\n// such a pathological inflating mechanism, there'd be no way to tell\n// the system to stop doing the transform.  A single 4MB write could\n// cause the system to run out of memory.\n//\n// However, even in such a pathological case, only a single written chunk\n// would be consumed, and then the rest would wait (un-transformed) until\n// the results of the previous transformed chunk were consumed.\n\n'use strict';\n\nmodule.exports = Transform;\n\nvar Duplex = _dereq_('./_stream_duplex');\n\n/*<replacement>*/\nvar util = _dereq_('core-util-is');\nutil.inherits = _dereq_('inherits');\n/*</replacement>*/\n\nutil.inherits(Transform, Duplex);\n\nfunction TransformState(stream) {\n  this.afterTransform = function (er, data) {\n    return afterTransform(stream, er, data);\n  };\n\n  this.needTransform = false;\n  this.transforming = false;\n  this.writecb = null;\n  this.writechunk = null;\n  this.writeencoding = null;\n}\n\nfunction afterTransform(stream, er, data) {\n  var ts = stream._transformState;\n  ts.transforming = false;\n\n  var cb = ts.writecb;\n\n  if (!cb) {\n    return stream.emit('error', new Error('write callback called multiple times'));\n  }\n\n  ts.writechunk = null;\n  ts.writecb = null;\n\n  if (data !== null && data !== undefined) stream.push(data);\n\n  cb(er);\n\n  var rs = stream._readableState;\n  rs.reading = false;\n  if (rs.needReadable || rs.length < rs.highWaterMark) {\n    stream._read(rs.highWaterMark);\n  }\n}\n\nfunction Transform(options) {\n  if (!(this instanceof Transform)) return new Transform(options);\n\n  Duplex.call(this, options);\n\n  this._transformState = new TransformState(this);\n\n  var stream = this;\n\n  // start out asking for a readable event once data is transformed.\n  this._readableState.needReadable = true;\n\n  // we have implemented the _read method, and done the other things\n  // that Readable wants before the first _read call, so unset the\n  // sync guard flag.\n  this._readableState.sync = false;\n\n  if (options) {\n    if (typeof options.transform === 'function') this._transform = options.transform;\n\n    if (typeof options.flush === 'function') this._flush = options.flush;\n  }\n\n  // When the writable side finishes, then flush out anything remaining.\n  this.once('prefinish', function () {\n    if (typeof this._flush === 'function') this._flush(function (er, data) {\n      done(stream, er, data);\n    });else done(stream);\n  });\n}\n\nTransform.prototype.push = function (chunk, encoding) {\n  this._transformState.needTransform = false;\n  return Duplex.prototype.push.call(this, chunk, encoding);\n};\n\n// This is the part where you do stuff!\n// override this function in implementation classes.\n// 'chunk' is an input chunk.\n//\n// Call `push(newChunk)` to pass along transformed output\n// to the readable side.  You may call 'push' zero or more times.\n//\n// Call `cb(err)` when you are done with this chunk.  If you pass\n// an error, then that'll put the hurt on the whole operation.  If you\n// never call cb(), then you'll never get another chunk.\nTransform.prototype._transform = function (chunk, encoding, cb) {\n  throw new Error('_transform() is not implemented');\n};\n\nTransform.prototype._write = function (chunk, encoding, cb) {\n  var ts = this._transformState;\n  ts.writecb = cb;\n  ts.writechunk = chunk;\n  ts.writeencoding = encoding;\n  if (!ts.transforming) {\n    var rs = this._readableState;\n    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);\n  }\n};\n\n// Doesn't matter what the args are here.\n// _transform does all the work.\n// That we got here means that the readable side wants more data.\nTransform.prototype._read = function (n) {\n  var ts = this._transformState;\n\n  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {\n    ts.transforming = true;\n    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);\n  } else {\n    // mark that we need a transform, so that any data that comes in\n    // will get processed, now that we've asked for it.\n    ts.needTransform = true;\n  }\n};\n\nTransform.prototype._destroy = function (err, cb) {\n  var _this = this;\n\n  Duplex.prototype._destroy.call(this, err, function (err2) {\n    cb(err2);\n    _this.emit('close');\n  });\n};\n\nfunction done(stream, er, data) {\n  if (er) return stream.emit('error', er);\n\n  if (data !== null && data !== undefined) stream.push(data);\n\n  // if there's nothing in the write buffer, then that means\n  // that nothing more will ever be provided\n  var ws = stream._writableState;\n  var ts = stream._transformState;\n\n  if (ws.length) throw new Error('Calling transform done when ws.length != 0');\n\n  if (ts.transforming) throw new Error('Calling transform done when still transforming');\n\n  return stream.push(null);\n}\n},{\"./_stream_duplex\":147,\"core-util-is\":125,\"inherits\":128}],151:[function(_dereq_,module,exports){\n(function (process,global,setImmediate){\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n// A bit simpler than readable streams.\n// Implement an async ._write(chunk, encoding, cb), and it'll handle all\n// the drain event emission and buffering.\n\n'use strict';\n\n/*<replacement>*/\n\nvar processNextTick = _dereq_('process-nextick-args');\n/*</replacement>*/\n\nmodule.exports = Writable;\n\n/* <replacement> */\nfunction WriteReq(chunk, encoding, cb) {\n  this.chunk = chunk;\n  this.encoding = encoding;\n  this.callback = cb;\n  this.next = null;\n}\n\n// It seems a linked list but it is not\n// there will be only 2 of these for each stream\nfunction CorkedRequest(state) {\n  var _this = this;\n\n  this.next = null;\n  this.entry = null;\n  this.finish = function () {\n    onCorkedFinish(_this, state);\n  };\n}\n/* </replacement> */\n\n/*<replacement>*/\nvar asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;\n/*</replacement>*/\n\n/*<replacement>*/\nvar Duplex;\n/*</replacement>*/\n\nWritable.WritableState = WritableState;\n\n/*<replacement>*/\nvar util = _dereq_('core-util-is');\nutil.inherits = _dereq_('inherits');\n/*</replacement>*/\n\n/*<replacement>*/\nvar internalUtil = {\n  deprecate: _dereq_('util-deprecate')\n};\n/*</replacement>*/\n\n/*<replacement>*/\nvar Stream = _dereq_('./internal/streams/stream');\n/*</replacement>*/\n\n/*<replacement>*/\nvar Buffer = _dereq_('safe-buffer').Buffer;\nvar OurUint8Array = global.Uint8Array || function () {};\nfunction _uint8ArrayToBuffer(chunk) {\n  return Buffer.from(chunk);\n}\nfunction _isUint8Array(obj) {\n  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;\n}\n/*</replacement>*/\n\nvar destroyImpl = _dereq_('./internal/streams/destroy');\n\nutil.inherits(Writable, Stream);\n\nfunction nop() {}\n\nfunction WritableState(options, stream) {\n  Duplex = Duplex || _dereq_('./_stream_duplex');\n\n  options = options || {};\n\n  // object stream flag to indicate whether or not this stream\n  // contains buffers or objects.\n  this.objectMode = !!options.objectMode;\n\n  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;\n\n  // the point at which write() starts returning false\n  // Note: 0 is a valid value, means that we always return false if\n  // the entire buffer is not flushed immediately on write()\n  var hwm = options.highWaterMark;\n  var defaultHwm = this.objectMode ? 16 : 16 * 1024;\n  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;\n\n  // cast to ints.\n  this.highWaterMark = Math.floor(this.highWaterMark);\n\n  // if _final has been called\n  this.finalCalled = false;\n\n  // drain event flag.\n  this.needDrain = false;\n  // at the start of calling end()\n  this.ending = false;\n  // when end() has been called, and returned\n  this.ended = false;\n  // when 'finish' is emitted\n  this.finished = false;\n\n  // has it been destroyed\n  this.destroyed = false;\n\n  // should we decode strings into buffers before passing to _write?\n  // this is here so that some node-core streams can optimize string\n  // handling at a lower level.\n  var noDecode = options.decodeStrings === false;\n  this.decodeStrings = !noDecode;\n\n  // Crypto is kind of old and crusty.  Historically, its default string\n  // encoding is 'binary' so we have to make this configurable.\n  // Everything else in the universe uses 'utf8', though.\n  this.defaultEncoding = options.defaultEncoding || 'utf8';\n\n  // not an actual buffer we keep track of, but a measurement\n  // of how much we're waiting to get pushed to some underlying\n  // socket or file.\n  this.length = 0;\n\n  // a flag to see when we're in the middle of a write.\n  this.writing = false;\n\n  // when true all writes will be buffered until .uncork() call\n  this.corked = 0;\n\n  // a flag to be able to tell if the onwrite cb is called immediately,\n  // or on a later tick.  We set this to true at first, because any\n  // actions that shouldn't happen until \"later\" should generally also\n  // not happen before the first write call.\n  this.sync = true;\n\n  // a flag to know if we're processing previously buffered items, which\n  // may call the _write() callback in the same tick, so that we don't\n  // end up in an overlapped onwrite situation.\n  this.bufferProcessing = false;\n\n  // the callback that's passed to _write(chunk,cb)\n  this.onwrite = function (er) {\n    onwrite(stream, er);\n  };\n\n  // the callback that the user supplies to write(chunk,encoding,cb)\n  this.writecb = null;\n\n  // the amount that is being written when _write is called.\n  this.writelen = 0;\n\n  this.bufferedRequest = null;\n  this.lastBufferedRequest = null;\n\n  // number of pending user-supplied write callbacks\n  // this must be 0 before 'finish' can be emitted\n  this.pendingcb = 0;\n\n  // emit prefinish if the only thing we're waiting for is _write cbs\n  // This is relevant for synchronous Transform streams\n  this.prefinished = false;\n\n  // True if the error was already emitted and should not be thrown again\n  this.errorEmitted = false;\n\n  // count buffered requests\n  this.bufferedRequestCount = 0;\n\n  // allocate the first CorkedRequest, there is always\n  // one allocated and free to use, and we maintain at most two\n  this.corkedRequestsFree = new CorkedRequest(this);\n}\n\nWritableState.prototype.getBuffer = function getBuffer() {\n  var current = this.bufferedRequest;\n  var out = [];\n  while (current) {\n    out.push(current);\n    current = current.next;\n  }\n  return out;\n};\n\n(function () {\n  try {\n    Object.defineProperty(WritableState.prototype, 'buffer', {\n      get: internalUtil.deprecate(function () {\n        return this.getBuffer();\n      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')\n    });\n  } catch (_) {}\n})();\n\n// Test _writableState for inheritance to account for Duplex streams,\n// whose prototype chain only points to Readable.\nvar realHasInstance;\nif (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {\n  realHasInstance = Function.prototype[Symbol.hasInstance];\n  Object.defineProperty(Writable, Symbol.hasInstance, {\n    value: function (object) {\n      if (realHasInstance.call(this, object)) return true;\n\n      return object && object._writableState instanceof WritableState;\n    }\n  });\n} else {\n  realHasInstance = function (object) {\n    return object instanceof this;\n  };\n}\n\nfunction Writable(options) {\n  Duplex = Duplex || _dereq_('./_stream_duplex');\n\n  // Writable ctor is applied to Duplexes, too.\n  // `realHasInstance` is necessary because using plain `instanceof`\n  // would return false, as no `_writableState` property is attached.\n\n  // Trying to use the custom `instanceof` for Writable here will also break the\n  // Node.js LazyTransform implementation, which has a non-trivial getter for\n  // `_writableState` that would lead to infinite recursion.\n  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {\n    return new Writable(options);\n  }\n\n  this._writableState = new WritableState(options, this);\n\n  // legacy.\n  this.writable = true;\n\n  if (options) {\n    if (typeof options.write === 'function') this._write = options.write;\n\n    if (typeof options.writev === 'function') this._writev = options.writev;\n\n    if (typeof options.destroy === 'function') this._destroy = options.destroy;\n\n    if (typeof options.final === 'function') this._final = options.final;\n  }\n\n  Stream.call(this);\n}\n\n// Otherwise people can pipe Writable streams, which is just wrong.\nWritable.prototype.pipe = function () {\n  this.emit('error', new Error('Cannot pipe, not readable'));\n};\n\nfunction writeAfterEnd(stream, cb) {\n  var er = new Error('write after end');\n  // TODO: defer error events consistently everywhere, not just the cb\n  stream.emit('error', er);\n  processNextTick(cb, er);\n}\n\n// Checks that a user-supplied chunk is valid, especially for the particular\n// mode the stream is in. Currently this means that `null` is never accepted\n// and undefined/non-string values are only allowed in object mode.\nfunction validChunk(stream, state, chunk, cb) {\n  var valid = true;\n  var er = false;\n\n  if (chunk === null) {\n    er = new TypeError('May not write null values to stream');\n  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {\n    er = new TypeError('Invalid non-string/buffer chunk');\n  }\n  if (er) {\n    stream.emit('error', er);\n    processNextTick(cb, er);\n    valid = false;\n  }\n  return valid;\n}\n\nWritable.prototype.write = function (chunk, encoding, cb) {\n  var state = this._writableState;\n  var ret = false;\n  var isBuf = _isUint8Array(chunk) && !state.objectMode;\n\n  if (isBuf && !Buffer.isBuffer(chunk)) {\n    chunk = _uint8ArrayToBuffer(chunk);\n  }\n\n  if (typeof encoding === 'function') {\n    cb = encoding;\n    encoding = null;\n  }\n\n  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;\n\n  if (typeof cb !== 'function') cb = nop;\n\n  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {\n    state.pendingcb++;\n    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);\n  }\n\n  return ret;\n};\n\nWritable.prototype.cork = function () {\n  var state = this._writableState;\n\n  state.corked++;\n};\n\nWritable.prototype.uncork = function () {\n  var state = this._writableState;\n\n  if (state.corked) {\n    state.corked--;\n\n    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);\n  }\n};\n\nWritable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {\n  // node::ParseEncoding() requires lower case.\n  if (typeof encoding === 'string') encoding = encoding.toLowerCase();\n  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);\n  this._writableState.defaultEncoding = encoding;\n  return this;\n};\n\nfunction decodeChunk(state, chunk, encoding) {\n  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {\n    chunk = Buffer.from(chunk, encoding);\n  }\n  return chunk;\n}\n\n// if we're already writing something, then just put this\n// in the queue, and wait our turn.  Otherwise, call _write\n// If we return false, then we need a drain event, so set that flag.\nfunction writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {\n  if (!isBuf) {\n    var newChunk = decodeChunk(state, chunk, encoding);\n    if (chunk !== newChunk) {\n      isBuf = true;\n      encoding = 'buffer';\n      chunk = newChunk;\n    }\n  }\n  var len = state.objectMode ? 1 : chunk.length;\n\n  state.length += len;\n\n  var ret = state.length < state.highWaterMark;\n  // we must ensure that previous needDrain will not be reset to false.\n  if (!ret) state.needDrain = true;\n\n  if (state.writing || state.corked) {\n    var last = state.lastBufferedRequest;\n    state.lastBufferedRequest = {\n      chunk: chunk,\n      encoding: encoding,\n      isBuf: isBuf,\n      callback: cb,\n      next: null\n    };\n    if (last) {\n      last.next = state.lastBufferedRequest;\n    } else {\n      state.bufferedRequest = state.lastBufferedRequest;\n    }\n    state.bufferedRequestCount += 1;\n  } else {\n    doWrite(stream, state, false, len, chunk, encoding, cb);\n  }\n\n  return ret;\n}\n\nfunction doWrite(stream, state, writev, len, chunk, encoding, cb) {\n  state.writelen = len;\n  state.writecb = cb;\n  state.writing = true;\n  state.sync = true;\n  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);\n  state.sync = false;\n}\n\nfunction onwriteError(stream, state, sync, er, cb) {\n  --state.pendingcb;\n\n  if (sync) {\n    // defer the callback if we are being called synchronously\n    // to avoid piling up things on the stack\n    processNextTick(cb, er);\n    // this can emit finish, and it will always happen\n    // after error\n    processNextTick(finishMaybe, stream, state);\n    stream._writableState.errorEmitted = true;\n    stream.emit('error', er);\n  } else {\n    // the caller expect this to happen before if\n    // it is async\n    cb(er);\n    stream._writableState.errorEmitted = true;\n    stream.emit('error', er);\n    // this can emit finish, but finish must\n    // always follow error\n    finishMaybe(stream, state);\n  }\n}\n\nfunction onwriteStateUpdate(state) {\n  state.writing = false;\n  state.writecb = null;\n  state.length -= state.writelen;\n  state.writelen = 0;\n}\n\nfunction onwrite(stream, er) {\n  var state = stream._writableState;\n  var sync = state.sync;\n  var cb = state.writecb;\n\n  onwriteStateUpdate(state);\n\n  if (er) onwriteError(stream, state, sync, er, cb);else {\n    // Check if we're actually ready to finish, but don't emit yet\n    var finished = needFinish(state);\n\n    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {\n      clearBuffer(stream, state);\n    }\n\n    if (sync) {\n      /*<replacement>*/\n      asyncWrite(afterWrite, stream, state, finished, cb);\n      /*</replacement>*/\n    } else {\n      afterWrite(stream, state, finished, cb);\n    }\n  }\n}\n\nfunction afterWrite(stream, state, finished, cb) {\n  if (!finished) onwriteDrain(stream, state);\n  state.pendingcb--;\n  cb();\n  finishMaybe(stream, state);\n}\n\n// Must force callback to be called on nextTick, so that we don't\n// emit 'drain' before the write() consumer gets the 'false' return\n// value, and has a chance to attach a 'drain' listener.\nfunction onwriteDrain(stream, state) {\n  if (state.length === 0 && state.needDrain) {\n    state.needDrain = false;\n    stream.emit('drain');\n  }\n}\n\n// if there's something in the buffer waiting, then process it\nfunction clearBuffer(stream, state) {\n  state.bufferProcessing = true;\n  var entry = state.bufferedRequest;\n\n  if (stream._writev && entry && entry.next) {\n    // Fast case, write everything using _writev()\n    var l = state.bufferedRequestCount;\n    var buffer = new Array(l);\n    var holder = state.corkedRequestsFree;\n    holder.entry = entry;\n\n    var count = 0;\n    var allBuffers = true;\n    while (entry) {\n      buffer[count] = entry;\n      if (!entry.isBuf) allBuffers = false;\n      entry = entry.next;\n      count += 1;\n    }\n    buffer.allBuffers = allBuffers;\n\n    doWrite(stream, state, true, state.length, buffer, '', holder.finish);\n\n    // doWrite is almost always async, defer these to save a bit of time\n    // as the hot path ends with doWrite\n    state.pendingcb++;\n    state.lastBufferedRequest = null;\n    if (holder.next) {\n      state.corkedRequestsFree = holder.next;\n      holder.next = null;\n    } else {\n      state.corkedRequestsFree = new CorkedRequest(state);\n    }\n  } else {\n    // Slow case, write chunks one-by-one\n    while (entry) {\n      var chunk = entry.chunk;\n      var encoding = entry.encoding;\n      var cb = entry.callback;\n      var len = state.objectMode ? 1 : chunk.length;\n\n      doWrite(stream, state, false, len, chunk, encoding, cb);\n      entry = entry.next;\n      // if we didn't call the onwrite immediately, then\n      // it means that we need to wait until it does.\n      // also, that means that the chunk and cb are currently\n      // being processed, so move the buffer counter past them.\n      if (state.writing) {\n        break;\n      }\n    }\n\n    if (entry === null) state.lastBufferedRequest = null;\n  }\n\n  state.bufferedRequestCount = 0;\n  state.bufferedRequest = entry;\n  state.bufferProcessing = false;\n}\n\nWritable.prototype._write = function (chunk, encoding, cb) {\n  cb(new Error('_write() is not implemented'));\n};\n\nWritable.prototype._writev = null;\n\nWritable.prototype.end = function (chunk, encoding, cb) {\n  var state = this._writableState;\n\n  if (typeof chunk === 'function') {\n    cb = chunk;\n    chunk = null;\n    encoding = null;\n  } else if (typeof encoding === 'function') {\n    cb = encoding;\n    encoding = null;\n  }\n\n  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);\n\n  // .end() fully uncorks\n  if (state.corked) {\n    state.corked = 1;\n    this.uncork();\n  }\n\n  // ignore unnecessary end() calls.\n  if (!state.ending && !state.finished) endWritable(this, state, cb);\n};\n\nfunction needFinish(state) {\n  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;\n}\nfunction callFinal(stream, state) {\n  stream._final(function (err) {\n    state.pendingcb--;\n    if (err) {\n      stream.emit('error', err);\n    }\n    state.prefinished = true;\n    stream.emit('prefinish');\n    finishMaybe(stream, state);\n  });\n}\nfunction prefinish(stream, state) {\n  if (!state.prefinished && !state.finalCalled) {\n    if (typeof stream._final === 'function') {\n      state.pendingcb++;\n      state.finalCalled = true;\n      processNextTick(callFinal, stream, state);\n    } else {\n      state.prefinished = true;\n      stream.emit('prefinish');\n    }\n  }\n}\n\nfunction finishMaybe(stream, state) {\n  var need = needFinish(state);\n  if (need) {\n    prefinish(stream, state);\n    if (state.pendingcb === 0) {\n      state.finished = true;\n      stream.emit('finish');\n    }\n  }\n  return need;\n}\n\nfunction endWritable(stream, state, cb) {\n  state.ending = true;\n  finishMaybe(stream, state);\n  if (cb) {\n    if (state.finished) processNextTick(cb);else stream.once('finish', cb);\n  }\n  state.ended = true;\n  stream.writable = false;\n}\n\nfunction onCorkedFinish(corkReq, state, err) {\n  var entry = corkReq.entry;\n  corkReq.entry = null;\n  while (entry) {\n    var cb = entry.callback;\n    state.pendingcb--;\n    cb(err);\n    entry = entry.next;\n  }\n  if (state.corkedRequestsFree) {\n    state.corkedRequestsFree.next = corkReq;\n  } else {\n    state.corkedRequestsFree = corkReq;\n  }\n}\n\nObject.defineProperty(Writable.prototype, 'destroyed', {\n  get: function () {\n    if (this._writableState === undefined) {\n      return false;\n    }\n    return this._writableState.destroyed;\n  },\n  set: function (value) {\n    // we ignore the value if the stream\n    // has not been initialized yet\n    if (!this._writableState) {\n      return;\n    }\n\n    // backward compatibility, the user is explicitly\n    // managing destroyed\n    this._writableState.destroyed = value;\n  }\n});\n\nWritable.prototype.destroy = destroyImpl.destroy;\nWritable.prototype._undestroy = destroyImpl.undestroy;\nWritable.prototype._destroy = function (err, cb) {\n  this.end();\n  cb(err);\n};\n}).call(this,_dereq_('_process'),typeof global !== \"undefined\" ? global : typeof self !== \"undefined\" ? self : typeof window !== \"undefined\" ? window : {},_dereq_(\"timers\").setImmediate)\n\n},{\"./_stream_duplex\":147,\"./internal/streams/destroy\":153,\"./internal/streams/stream\":154,\"_process\":23,\"core-util-is\":125,\"inherits\":128,\"process-nextick-args\":144,\"safe-buffer\":159,\"timers\":164,\"util-deprecate\":166}],152:[function(_dereq_,module,exports){\n'use strict';\n\n/*<replacement>*/\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nvar Buffer = _dereq_('safe-buffer').Buffer;\n/*</replacement>*/\n\nfunction copyBuffer(src, target, offset) {\n  src.copy(target, offset);\n}\n\nmodule.exports = function () {\n  function BufferList() {\n    _classCallCheck(this, BufferList);\n\n    this.head = null;\n    this.tail = null;\n    this.length = 0;\n  }\n\n  BufferList.prototype.push = function push(v) {\n    var entry = { data: v, next: null };\n    if (this.length > 0) this.tail.next = entry;else this.head = entry;\n    this.tail = entry;\n    ++this.length;\n  };\n\n  BufferList.prototype.unshift = function unshift(v) {\n    var entry = { data: v, next: this.head };\n    if (this.length === 0) this.tail = entry;\n    this.head = entry;\n    ++this.length;\n  };\n\n  BufferList.prototype.shift = function shift() {\n    if (this.length === 0) return;\n    var ret = this.head.data;\n    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;\n    --this.length;\n    return ret;\n  };\n\n  BufferList.prototype.clear = function clear() {\n    this.head = this.tail = null;\n    this.length = 0;\n  };\n\n  BufferList.prototype.join = function join(s) {\n    if (this.length === 0) return '';\n    var p = this.head;\n    var ret = '' + p.data;\n    while (p = p.next) {\n      ret += s + p.data;\n    }return ret;\n  };\n\n  BufferList.prototype.concat = function concat(n) {\n    if (this.length === 0) return Buffer.alloc(0);\n    if (this.length === 1) return this.head.data;\n    var ret = Buffer.allocUnsafe(n >>> 0);\n    var p = this.head;\n    var i = 0;\n    while (p) {\n      copyBuffer(p.data, ret, i);\n      i += p.data.length;\n      p = p.next;\n    }\n    return ret;\n  };\n\n  return BufferList;\n}();\n},{\"safe-buffer\":159}],153:[function(_dereq_,module,exports){\n'use strict';\n\n/*<replacement>*/\n\nvar processNextTick = _dereq_('process-nextick-args');\n/*</replacement>*/\n\n// undocumented cb() API, needed for core, not for public API\nfunction destroy(err, cb) {\n  var _this = this;\n\n  var readableDestroyed = this._readableState && this._readableState.destroyed;\n  var writableDestroyed = this._writableState && this._writableState.destroyed;\n\n  if (readableDestroyed || writableDestroyed) {\n    if (cb) {\n      cb(err);\n    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {\n      processNextTick(emitErrorNT, this, err);\n    }\n    return;\n  }\n\n  // we set destroyed to true before firing error callbacks in order\n  // to make it re-entrance safe in case destroy() is called within callbacks\n\n  if (this._readableState) {\n    this._readableState.destroyed = true;\n  }\n\n  // if this is a duplex stream mark the writable part as destroyed as well\n  if (this._writableState) {\n    this._writableState.destroyed = true;\n  }\n\n  this._destroy(err || null, function (err) {\n    if (!cb && err) {\n      processNextTick(emitErrorNT, _this, err);\n      if (_this._writableState) {\n        _this._writableState.errorEmitted = true;\n      }\n    } else if (cb) {\n      cb(err);\n    }\n  });\n}\n\nfunction undestroy() {\n  if (this._readableState) {\n    this._readableState.destroyed = false;\n    this._readableState.reading = false;\n    this._readableState.ended = false;\n    this._readableState.endEmitted = false;\n  }\n\n  if (this._writableState) {\n    this._writableState.destroyed = false;\n    this._writableState.ended = false;\n    this._writableState.ending = false;\n    this._writableState.finished = false;\n    this._writableState.errorEmitted = false;\n  }\n}\n\nfunction emitErrorNT(self, err) {\n  self.emit('error', err);\n}\n\nmodule.exports = {\n  destroy: destroy,\n  undestroy: undestroy\n};\n},{\"process-nextick-args\":144}],154:[function(_dereq_,module,exports){\nmodule.exports = _dereq_('events').EventEmitter;\n\n},{\"events\":22}],155:[function(_dereq_,module,exports){\nmodule.exports = _dereq_('./readable').PassThrough\n\n},{\"./readable\":156}],156:[function(_dereq_,module,exports){\nexports = module.exports = _dereq_('./lib/_stream_readable.js');\nexports.Stream = exports;\nexports.Readable = exports;\nexports.Writable = _dereq_('./lib/_stream_writable.js');\nexports.Duplex = _dereq_('./lib/_stream_duplex.js');\nexports.Transform = _dereq_('./lib/_stream_transform.js');\nexports.PassThrough = _dereq_('./lib/_stream_passthrough.js');\n\n},{\"./lib/_stream_duplex.js\":147,\"./lib/_stream_passthrough.js\":148,\"./lib/_stream_readable.js\":149,\"./lib/_stream_transform.js\":150,\"./lib/_stream_writable.js\":151}],157:[function(_dereq_,module,exports){\nmodule.exports = _dereq_('./readable').Transform\n\n},{\"./readable\":156}],158:[function(_dereq_,module,exports){\nmodule.exports = _dereq_('./lib/_stream_writable.js');\n\n},{\"./lib/_stream_writable.js\":151}],159:[function(_dereq_,module,exports){\n/* eslint-disable node/no-deprecated-api */\nvar buffer = _dereq_('buffer')\nvar Buffer = buffer.Buffer\n\n// alternative to using Object.keys for old browsers\nfunction copyProps (src, dst) {\n  for (var key in src) {\n    dst[key] = src[key]\n  }\n}\nif (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {\n  module.exports = buffer\n} else {\n  // Copy properties from require('buffer')\n  copyProps(buffer, exports)\n  exports.Buffer = SafeBuffer\n}\n\nfunction SafeBuffer (arg, encodingOrOffset, length) {\n  return Buffer(arg, encodingOrOffset, length)\n}\n\n// Copy static methods from Buffer\ncopyProps(Buffer, SafeBuffer)\n\nSafeBuffer.from = function (arg, encodingOrOffset, length) {\n  if (typeof arg === 'number') {\n    throw new TypeError('Argument must not be a number')\n  }\n  return Buffer(arg, encodingOrOffset, length)\n}\n\nSafeBuffer.alloc = function (size, fill, encoding) {\n  if (typeof size !== 'number') {\n    throw new TypeError('Argument must be a number')\n  }\n  var buf = Buffer(size)\n  if (fill !== undefined) {\n    if (typeof encoding === 'string') {\n      buf.fill(fill, encoding)\n    } else {\n      buf.fill(fill)\n    }\n  } else {\n    buf.fill(0)\n  }\n  return buf\n}\n\nSafeBuffer.allocUnsafe = function (size) {\n  if (typeof size !== 'number') {\n    throw new TypeError('Argument must be a number')\n  }\n  return Buffer(size)\n}\n\nSafeBuffer.allocUnsafeSlow = function (size) {\n  if (typeof size !== 'number') {\n    throw new TypeError('Argument must be a number')\n  }\n  return buffer.SlowBuffer(size)\n}\n\n},{\"buffer\":24}],160:[function(_dereq_,module,exports){\nconst util = _dereq_('util')\nconst EventEmitter = _dereq_('events/')\n\nvar R = typeof Reflect === 'object' ? Reflect : null\nvar ReflectApply = R && typeof R.apply === 'function'\n  ? R.apply\n  : function ReflectApply(target, receiver, args) {\n    return Function.prototype.apply.call(target, receiver, args);\n}\n\nmodule.exports = SafeEventEmitter\n\n\nfunction SafeEventEmitter() {\n  EventEmitter.call(this)\n}\n\nutil.inherits(SafeEventEmitter, EventEmitter)\n\nSafeEventEmitter.prototype.emit = function (type) {\n  // copied from https://github.com/Gozala/events/blob/master/events.js\n  // modified lines are commented with \"edited:\"\n  var args = [];\n  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);\n  var doError = (type === 'error');\n\n  var events = this._events;\n  if (events !== undefined)\n    doError = (doError && events.error === undefined);\n  else if (!doError)\n    return false;\n\n  // If there is no 'error' event listener then throw.\n  if (doError) {\n    var er;\n    if (args.length > 0)\n      er = args[0];\n    if (er instanceof Error) {\n      // Note: The comments on the `throw` lines are intentional, they show\n      // up in Node's output if this results in an unhandled exception.\n      throw er; // Unhandled 'error' event\n    }\n    // At least give some kind of context to the user\n    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));\n    err.context = er;\n    throw err; // Unhandled 'error' event\n  }\n\n  var handler = events[type];\n\n  if (handler === undefined)\n    return false;\n\n  if (typeof handler === 'function') {\n    // edited: using safeApply\n    safeApply(handler, this, args);\n  } else {\n    var len = handler.length;\n    var listeners = arrayClone(handler, len);\n    for (var i = 0; i < len; ++i)\n      // edited: using safeApply\n      safeApply(listeners[i], this, args);\n  }\n\n  return true;\n}\n\nfunction safeApply(handler, context, args) {\n  try {\n    ReflectApply(handler, context, args)\n  } catch (err) {\n    // throw error after timeout so as not to interupt the stack\n    setTimeout(() => {\n      throw err\n    })\n  }\n}\n\nfunction arrayClone(arr, n) {\n  var copy = new Array(n);\n  for (var i = 0; i < n; ++i)\n    copy[i] = arr[i];\n  return copy;\n}\n\n},{\"events/\":161,\"util\":169}],161:[function(_dereq_,module,exports){\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n'use strict';\n\nvar R = typeof Reflect === 'object' ? Reflect : null\nvar ReflectApply = R && typeof R.apply === 'function'\n  ? R.apply\n  : function ReflectApply(target, receiver, args) {\n    return Function.prototype.apply.call(target, receiver, args);\n  }\n\nvar ReflectOwnKeys\nif (R && typeof R.ownKeys === 'function') {\n  ReflectOwnKeys = R.ownKeys\n} else if (Object.getOwnPropertySymbols) {\n  ReflectOwnKeys = function ReflectOwnKeys(target) {\n    return Object.getOwnPropertyNames(target)\n      .concat(Object.getOwnPropertySymbols(target));\n  };\n} else {\n  ReflectOwnKeys = function ReflectOwnKeys(target) {\n    return Object.getOwnPropertyNames(target);\n  };\n}\n\nfunction ProcessEmitWarning(warning) {\n  if (console && console.warn) console.warn(warning);\n}\n\nvar NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {\n  return value !== value;\n}\n\nfunction EventEmitter() {\n  EventEmitter.init.call(this);\n}\nmodule.exports = EventEmitter;\n\n// Backwards-compat with node 0.10.x\nEventEmitter.EventEmitter = EventEmitter;\n\nEventEmitter.prototype._events = undefined;\nEventEmitter.prototype._eventsCount = 0;\nEventEmitter.prototype._maxListeners = undefined;\n\n// By default EventEmitters will print a warning if more than 10 listeners are\n// added to it. This is a useful default which helps finding memory leaks.\nvar defaultMaxListeners = 10;\n\nObject.defineProperty(EventEmitter, 'defaultMaxListeners', {\n  enumerable: true,\n  get: function() {\n    return defaultMaxListeners;\n  },\n  set: function(arg) {\n    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {\n      throw new RangeError('The value of \"defaultMaxListeners\" is out of range. It must be a non-negative number. Received ' + arg + '.');\n    }\n    defaultMaxListeners = arg;\n  }\n});\n\nEventEmitter.init = function() {\n\n  if (this._events === undefined ||\n      this._events === Object.getPrototypeOf(this)._events) {\n    this._events = Object.create(null);\n    this._eventsCount = 0;\n  }\n\n  this._maxListeners = this._maxListeners || undefined;\n};\n\n// Obviously not all Emitters should be limited to 10. This function allows\n// that to be increased. Set to zero for unlimited.\nEventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {\n  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {\n    throw new RangeError('The value of \"n\" is out of range. It must be a non-negative number. Received ' + n + '.');\n  }\n  this._maxListeners = n;\n  return this;\n};\n\nfunction $getMaxListeners(that) {\n  if (that._maxListeners === undefined)\n    return EventEmitter.defaultMaxListeners;\n  return that._maxListeners;\n}\n\nEventEmitter.prototype.getMaxListeners = function getMaxListeners() {\n  return $getMaxListeners(this);\n};\n\nEventEmitter.prototype.emit = function emit(type) {\n  var args = [];\n  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);\n  var doError = (type === 'error');\n\n  var events = this._events;\n  if (events !== undefined)\n    doError = (doError && events.error === undefined);\n  else if (!doError)\n    return false;\n\n  // If there is no 'error' event listener then throw.\n  if (doError) {\n    var er;\n    if (args.length > 0)\n      er = args[0];\n    if (er instanceof Error) {\n      // Note: The comments on the `throw` lines are intentional, they show\n      // up in Node's output if this results in an unhandled exception.\n      throw er; // Unhandled 'error' event\n    }\n    // At least give some kind of context to the user\n    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));\n    err.context = er;\n    throw err; // Unhandled 'error' event\n  }\n\n  var handler = events[type];\n\n  if (handler === undefined)\n    return false;\n\n  if (typeof handler === 'function') {\n    ReflectApply(handler, this, args);\n  } else {\n    var len = handler.length;\n    var listeners = arrayClone(handler, len);\n    for (var i = 0; i < len; ++i)\n      ReflectApply(listeners[i], this, args);\n  }\n\n  return true;\n};\n\nfunction _addListener(target, type, listener, prepend) {\n  var m;\n  var events;\n  var existing;\n\n  if (typeof listener !== 'function') {\n    throw new TypeError('The \"listener\" argument must be of type Function. Received type ' + typeof listener);\n  }\n\n  events = target._events;\n  if (events === undefined) {\n    events = target._events = Object.create(null);\n    target._eventsCount = 0;\n  } else {\n    // To avoid recursion in the case that type === \"newListener\"! Before\n    // adding it to the listeners, first emit \"newListener\".\n    if (events.newListener !== undefined) {\n      target.emit('newListener', type,\n                  listener.listener ? listener.listener : listener);\n\n      // Re-assign `events` because a newListener handler could have caused the\n      // this._events to be assigned to a new object\n      events = target._events;\n    }\n    existing = events[type];\n  }\n\n  if (existing === undefined) {\n    // Optimize the case of one listener. Don't need the extra array object.\n    existing = events[type] = listener;\n    ++target._eventsCount;\n  } else {\n    if (typeof existing === 'function') {\n      // Adding the second element, need to change to array.\n      existing = events[type] =\n        prepend ? [listener, existing] : [existing, listener];\n      // If we've already got an array, just append.\n    } else if (prepend) {\n      existing.unshift(listener);\n    } else {\n      existing.push(listener);\n    }\n\n    // Check for listener leak\n    m = $getMaxListeners(target);\n    if (m > 0 && existing.length > m && !existing.warned) {\n      existing.warned = true;\n      // No error code for this since it is a Warning\n      // eslint-disable-next-line no-restricted-syntax\n      var w = new Error('Possible EventEmitter memory leak detected. ' +\n                          existing.length + ' ' + String(type) + ' listeners ' +\n                          'added. Use emitter.setMaxListeners() to ' +\n                          'increase limit');\n      w.name = 'MaxListenersExceededWarning';\n      w.emitter = target;\n      w.type = type;\n      w.count = existing.length;\n      ProcessEmitWarning(w);\n    }\n  }\n\n  return target;\n}\n\nEventEmitter.prototype.addListener = function addListener(type, listener) {\n  return _addListener(this, type, listener, false);\n};\n\nEventEmitter.prototype.on = EventEmitter.prototype.addListener;\n\nEventEmitter.prototype.prependListener =\n    function prependListener(type, listener) {\n      return _addListener(this, type, listener, true);\n    };\n\nfunction onceWrapper() {\n  var args = [];\n  for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);\n  if (!this.fired) {\n    this.target.removeListener(this.type, this.wrapFn);\n    this.fired = true;\n    ReflectApply(this.listener, this.target, args);\n  }\n}\n\nfunction _onceWrap(target, type, listener) {\n  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };\n  var wrapped = onceWrapper.bind(state);\n  wrapped.listener = listener;\n  state.wrapFn = wrapped;\n  return wrapped;\n}\n\nEventEmitter.prototype.once = function once(type, listener) {\n  if (typeof listener !== 'function') {\n    throw new TypeError('The \"listener\" argument must be of type Function. Received type ' + typeof listener);\n  }\n  this.on(type, _onceWrap(this, type, listener));\n  return this;\n};\n\nEventEmitter.prototype.prependOnceListener =\n    function prependOnceListener(type, listener) {\n      if (typeof listener !== 'function') {\n        throw new TypeError('The \"listener\" argument must be of type Function. Received type ' + typeof listener);\n      }\n      this.prependListener(type, _onceWrap(this, type, listener));\n      return this;\n    };\n\n// Emits a 'removeListener' event if and only if the listener was removed.\nEventEmitter.prototype.removeListener =\n    function removeListener(type, listener) {\n      var list, events, position, i, originalListener;\n\n      if (typeof listener !== 'function') {\n        throw new TypeError('The \"listener\" argument must be of type Function. Received type ' + typeof listener);\n      }\n\n      events = this._events;\n      if (events === undefined)\n        return this;\n\n      list = events[type];\n      if (list === undefined)\n        return this;\n\n      if (list === listener || list.listener === listener) {\n        if (--this._eventsCount === 0)\n          this._events = Object.create(null);\n        else {\n          delete events[type];\n          if (events.removeListener)\n            this.emit('removeListener', type, list.listener || listener);\n        }\n      } else if (typeof list !== 'function') {\n        position = -1;\n\n        for (i = list.length - 1; i >= 0; i--) {\n          if (list[i] === listener || list[i].listener === listener) {\n            originalListener = list[i].listener;\n            position = i;\n            break;\n          }\n        }\n\n        if (position < 0)\n          return this;\n\n        if (position === 0)\n          list.shift();\n        else {\n          spliceOne(list, position);\n        }\n\n        if (list.length === 1)\n          events[type] = list[0];\n\n        if (events.removeListener !== undefined)\n          this.emit('removeListener', type, originalListener || listener);\n      }\n\n      return this;\n    };\n\nEventEmitter.prototype.off = EventEmitter.prototype.removeListener;\n\nEventEmitter.prototype.removeAllListeners =\n    function removeAllListeners(type) {\n      var listeners, events, i;\n\n      events = this._events;\n      if (events === undefined)\n        return this;\n\n      // not listening for removeListener, no need to emit\n      if (events.removeListener === undefined) {\n        if (arguments.length === 0) {\n          this._events = Object.create(null);\n          this._eventsCount = 0;\n        } else if (events[type] !== undefined) {\n          if (--this._eventsCount === 0)\n            this._events = Object.create(null);\n          else\n            delete events[type];\n        }\n        return this;\n      }\n\n      // emit removeListener for all listeners on all events\n      if (arguments.length === 0) {\n        var keys = Object.keys(events);\n        var key;\n        for (i = 0; i < keys.length; ++i) {\n          key = keys[i];\n          if (key === 'removeListener') continue;\n          this.removeAllListeners(key);\n        }\n        this.removeAllListeners('removeListener');\n        this._events = Object.create(null);\n        this._eventsCount = 0;\n        return this;\n      }\n\n      listeners = events[type];\n\n      if (typeof listeners === 'function') {\n        this.removeListener(type, listeners);\n      } else if (listeners !== undefined) {\n        // LIFO order\n        for (i = listeners.length - 1; i >= 0; i--) {\n          this.removeListener(type, listeners[i]);\n        }\n      }\n\n      return this;\n    };\n\nfunction _listeners(target, type, unwrap) {\n  var events = target._events;\n\n  if (events === undefined)\n    return [];\n\n  var evlistener = events[type];\n  if (evlistener === undefined)\n    return [];\n\n  if (typeof evlistener === 'function')\n    return unwrap ? [evlistener.listener || evlistener] : [evlistener];\n\n  return unwrap ?\n    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);\n}\n\nEventEmitter.prototype.listeners = function listeners(type) {\n  return _listeners(this, type, true);\n};\n\nEventEmitter.prototype.rawListeners = function rawListeners(type) {\n  return _listeners(this, type, false);\n};\n\nEventEmitter.listenerCount = function(emitter, type) {\n  if (typeof emitter.listenerCount === 'function') {\n    return emitter.listenerCount(type);\n  } else {\n    return listenerCount.call(emitter, type);\n  }\n};\n\nEventEmitter.prototype.listenerCount = listenerCount;\nfunction listenerCount(type) {\n  var events = this._events;\n\n  if (events !== undefined) {\n    var evlistener = events[type];\n\n    if (typeof evlistener === 'function') {\n      return 1;\n    } else if (evlistener !== undefined) {\n      return evlistener.length;\n    }\n  }\n\n  return 0;\n}\n\nEventEmitter.prototype.eventNames = function eventNames() {\n  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];\n};\n\nfunction arrayClone(arr, n) {\n  var copy = new Array(n);\n  for (var i = 0; i < n; ++i)\n    copy[i] = arr[i];\n  return copy;\n}\n\nfunction spliceOne(list, index) {\n  for (; index + 1 < list.length; index++)\n    list[index] = list[index + 1];\n  list.pop();\n}\n\nfunction unwrapListeners(arr) {\n  var ret = new Array(arr.length);\n  for (var i = 0; i < ret.length; ++i) {\n    ret[i] = arr[i].listener || arr[i];\n  }\n  return ret;\n}\n\n},{}],162:[function(_dereq_,module,exports){\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\nmodule.exports = Stream;\n\nvar EE = _dereq_('events').EventEmitter;\nvar inherits = _dereq_('inherits');\n\ninherits(Stream, EE);\nStream.Readable = _dereq_('readable-stream/readable.js');\nStream.Writable = _dereq_('readable-stream/writable.js');\nStream.Duplex = _dereq_('readable-stream/duplex.js');\nStream.Transform = _dereq_('readable-stream/transform.js');\nStream.PassThrough = _dereq_('readable-stream/passthrough.js');\n\n// Backwards-compat with node 0.4.x\nStream.Stream = Stream;\n\n\n\n// old-style streams.  Note that the pipe method (the only relevant\n// part of this class) is overridden in the Readable class.\n\nfunction Stream() {\n  EE.call(this);\n}\n\nStream.prototype.pipe = function(dest, options) {\n  var source = this;\n\n  function ondata(chunk) {\n    if (dest.writable) {\n      if (false === dest.write(chunk) && source.pause) {\n        source.pause();\n      }\n    }\n  }\n\n  source.on('data', ondata);\n\n  function ondrain() {\n    if (source.readable && source.resume) {\n      source.resume();\n    }\n  }\n\n  dest.on('drain', ondrain);\n\n  // If the 'end' option is not supplied, dest.end() will be called when\n  // source gets the 'end' or 'close' events.  Only dest.end() once.\n  if (!dest._isStdio && (!options || options.end !== false)) {\n    source.on('end', onend);\n    source.on('close', onclose);\n  }\n\n  var didOnEnd = false;\n  function onend() {\n    if (didOnEnd) return;\n    didOnEnd = true;\n\n    dest.end();\n  }\n\n\n  function onclose() {\n    if (didOnEnd) return;\n    didOnEnd = true;\n\n    if (typeof dest.destroy === 'function') dest.destroy();\n  }\n\n  // don't leave dangling pipes when there are errors.\n  function onerror(er) {\n    cleanup();\n    if (EE.listenerCount(this, 'error') === 0) {\n      throw er; // Unhandled stream error in pipe.\n    }\n  }\n\n  source.on('error', onerror);\n  dest.on('error', onerror);\n\n  // remove all the event listeners that were added.\n  function cleanup() {\n    source.removeListener('data', ondata);\n    dest.removeListener('drain', ondrain);\n\n    source.removeListener('end', onend);\n    source.removeListener('close', onclose);\n\n    source.removeListener('error', onerror);\n    dest.removeListener('error', onerror);\n\n    source.removeListener('end', cleanup);\n    source.removeListener('close', cleanup);\n\n    dest.removeListener('close', cleanup);\n  }\n\n  source.on('end', cleanup);\n  source.on('close', cleanup);\n\n  dest.on('close', cleanup);\n\n  dest.emit('pipe', source);\n\n  // Allow for unix-like usage: A.pipe(B).pipe(C)\n  return dest;\n};\n\n},{\"events\":22,\"inherits\":128,\"readable-stream/duplex.js\":146,\"readable-stream/passthrough.js\":155,\"readable-stream/readable.js\":156,\"readable-stream/transform.js\":157,\"readable-stream/writable.js\":158}],163:[function(_dereq_,module,exports){\n'use strict';\n\nvar Buffer = _dereq_('safe-buffer').Buffer;\n\nvar isEncoding = Buffer.isEncoding || function (encoding) {\n  encoding = '' + encoding;\n  switch (encoding && encoding.toLowerCase()) {\n    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':\n      return true;\n    default:\n      return false;\n  }\n};\n\nfunction _normalizeEncoding(enc) {\n  if (!enc) return 'utf8';\n  var retried;\n  while (true) {\n    switch (enc) {\n      case 'utf8':\n      case 'utf-8':\n        return 'utf8';\n      case 'ucs2':\n      case 'ucs-2':\n      case 'utf16le':\n      case 'utf-16le':\n        return 'utf16le';\n      case 'latin1':\n      case 'binary':\n        return 'latin1';\n      case 'base64':\n      case 'ascii':\n      case 'hex':\n        return enc;\n      default:\n        if (retried) return; // undefined\n        enc = ('' + enc).toLowerCase();\n        retried = true;\n    }\n  }\n};\n\n// Do not cache `Buffer.isEncoding` when checking encoding names as some\n// modules monkey-patch it to support additional encodings\nfunction normalizeEncoding(enc) {\n  var nenc = _normalizeEncoding(enc);\n  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);\n  return nenc || enc;\n}\n\n// StringDecoder provides an interface for efficiently splitting a series of\n// buffers into a series of JS strings without breaking apart multi-byte\n// characters.\nexports.StringDecoder = StringDecoder;\nfunction StringDecoder(encoding) {\n  this.encoding = normalizeEncoding(encoding);\n  var nb;\n  switch (this.encoding) {\n    case 'utf16le':\n      this.text = utf16Text;\n      this.end = utf16End;\n      nb = 4;\n      break;\n    case 'utf8':\n      this.fillLast = utf8FillLast;\n      nb = 4;\n      break;\n    case 'base64':\n      this.text = base64Text;\n      this.end = base64End;\n      nb = 3;\n      break;\n    default:\n      this.write = simpleWrite;\n      this.end = simpleEnd;\n      return;\n  }\n  this.lastNeed = 0;\n  this.lastTotal = 0;\n  this.lastChar = Buffer.allocUnsafe(nb);\n}\n\nStringDecoder.prototype.write = function (buf) {\n  if (buf.length === 0) return '';\n  var r;\n  var i;\n  if (this.lastNeed) {\n    r = this.fillLast(buf);\n    if (r === undefined) return '';\n    i = this.lastNeed;\n    this.lastNeed = 0;\n  } else {\n    i = 0;\n  }\n  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);\n  return r || '';\n};\n\nStringDecoder.prototype.end = utf8End;\n\n// Returns only complete characters in a Buffer\nStringDecoder.prototype.text = utf8Text;\n\n// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer\nStringDecoder.prototype.fillLast = function (buf) {\n  if (this.lastNeed <= buf.length) {\n    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);\n    return this.lastChar.toString(this.encoding, 0, this.lastTotal);\n  }\n  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);\n  this.lastNeed -= buf.length;\n};\n\n// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a\n// continuation byte.\nfunction utf8CheckByte(byte) {\n  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;\n  return -1;\n}\n\n// Checks at most 3 bytes at the end of a Buffer in order to detect an\n// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)\n// needed to complete the UTF-8 character (if applicable) are returned.\nfunction utf8CheckIncomplete(self, buf, i) {\n  var j = buf.length - 1;\n  if (j < i) return 0;\n  var nb = utf8CheckByte(buf[j]);\n  if (nb >= 0) {\n    if (nb > 0) self.lastNeed = nb - 1;\n    return nb;\n  }\n  if (--j < i) return 0;\n  nb = utf8CheckByte(buf[j]);\n  if (nb >= 0) {\n    if (nb > 0) self.lastNeed = nb - 2;\n    return nb;\n  }\n  if (--j < i) return 0;\n  nb = utf8CheckByte(buf[j]);\n  if (nb >= 0) {\n    if (nb > 0) {\n      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;\n    }\n    return nb;\n  }\n  return 0;\n}\n\n// Validates as many continuation bytes for a multi-byte UTF-8 character as\n// needed or are available. If we see a non-continuation byte where we expect\n// one, we \"replace\" the validated continuation bytes we've seen so far with\n// UTF-8 replacement characters ('\\ufffd'), to match v8's UTF-8 decoding\n// behavior. The continuation byte check is included three times in the case\n// where all of the continuation bytes for a character exist in the same buffer.\n// It is also done this way as a slight performance increase instead of using a\n// loop.\nfunction utf8CheckExtraBytes(self, buf, p) {\n  if ((buf[0] & 0xC0) !== 0x80) {\n    self.lastNeed = 0;\n    return '\\ufffd'.repeat(p);\n  }\n  if (self.lastNeed > 1 && buf.length > 1) {\n    if ((buf[1] & 0xC0) !== 0x80) {\n      self.lastNeed = 1;\n      return '\\ufffd'.repeat(p + 1);\n    }\n    if (self.lastNeed > 2 && buf.length > 2) {\n      if ((buf[2] & 0xC0) !== 0x80) {\n        self.lastNeed = 2;\n        return '\\ufffd'.repeat(p + 2);\n      }\n    }\n  }\n}\n\n// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.\nfunction utf8FillLast(buf) {\n  var p = this.lastTotal - this.lastNeed;\n  var r = utf8CheckExtraBytes(this, buf, p);\n  if (r !== undefined) return r;\n  if (this.lastNeed <= buf.length) {\n    buf.copy(this.lastChar, p, 0, this.lastNeed);\n    return this.lastChar.toString(this.encoding, 0, this.lastTotal);\n  }\n  buf.copy(this.lastChar, p, 0, buf.length);\n  this.lastNeed -= buf.length;\n}\n\n// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a\n// partial character, the character's bytes are buffered until the required\n// number of bytes are available.\nfunction utf8Text(buf, i) {\n  var total = utf8CheckIncomplete(this, buf, i);\n  if (!this.lastNeed) return buf.toString('utf8', i);\n  this.lastTotal = total;\n  var end = buf.length - (total - this.lastNeed);\n  buf.copy(this.lastChar, 0, end);\n  return buf.toString('utf8', i, end);\n}\n\n// For UTF-8, a replacement character for each buffered byte of a (partial)\n// character needs to be added to the output.\nfunction utf8End(buf) {\n  var r = buf && buf.length ? this.write(buf) : '';\n  if (this.lastNeed) return r + '\\ufffd'.repeat(this.lastTotal - this.lastNeed);\n  return r;\n}\n\n// UTF-16LE typically needs two bytes per character, but even if we have an even\n// number of bytes available, we need to check if we end on a leading/high\n// surrogate. In that case, we need to wait for the next two bytes in order to\n// decode the last character properly.\nfunction utf16Text(buf, i) {\n  if ((buf.length - i) % 2 === 0) {\n    var r = buf.toString('utf16le', i);\n    if (r) {\n      var c = r.charCodeAt(r.length - 1);\n      if (c >= 0xD800 && c <= 0xDBFF) {\n        this.lastNeed = 2;\n        this.lastTotal = 4;\n        this.lastChar[0] = buf[buf.length - 2];\n        this.lastChar[1] = buf[buf.length - 1];\n        return r.slice(0, -1);\n      }\n    }\n    return r;\n  }\n  this.lastNeed = 1;\n  this.lastTotal = 2;\n  this.lastChar[0] = buf[buf.length - 1];\n  return buf.toString('utf16le', i, buf.length - 1);\n}\n\n// For UTF-16LE we do not explicitly append special replacement characters if we\n// end on a partial character, we simply let v8 handle that.\nfunction utf16End(buf) {\n  var r = buf && buf.length ? this.write(buf) : '';\n  if (this.lastNeed) {\n    var end = this.lastTotal - this.lastNeed;\n    return r + this.lastChar.toString('utf16le', 0, end);\n  }\n  return r;\n}\n\nfunction base64Text(buf, i) {\n  var n = (buf.length - i) % 3;\n  if (n === 0) return buf.toString('base64', i);\n  this.lastNeed = 3 - n;\n  this.lastTotal = 3;\n  if (n === 1) {\n    this.lastChar[0] = buf[buf.length - 1];\n  } else {\n    this.lastChar[0] = buf[buf.length - 2];\n    this.lastChar[1] = buf[buf.length - 1];\n  }\n  return buf.toString('base64', i, buf.length - n);\n}\n\nfunction base64End(buf) {\n  var r = buf && buf.length ? this.write(buf) : '';\n  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);\n  return r;\n}\n\n// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)\nfunction simpleWrite(buf) {\n  return buf.toString(this.encoding);\n}\n\nfunction simpleEnd(buf) {\n  return buf && buf.length ? this.write(buf) : '';\n}\n},{\"safe-buffer\":159}],164:[function(_dereq_,module,exports){\n(function (setImmediate,clearImmediate){\nvar nextTick = _dereq_('process/browser.js').nextTick;\nvar apply = Function.prototype.apply;\nvar slice = Array.prototype.slice;\nvar immediateIds = {};\nvar nextImmediateId = 0;\n\n// DOM APIs, for completeness\n\nexports.setTimeout = function() {\n  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);\n};\nexports.setInterval = function() {\n  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);\n};\nexports.clearTimeout =\nexports.clearInterval = function(timeout) { timeout.close(); };\n\nfunction Timeout(id, clearFn) {\n  this._id = id;\n  this._clearFn = clearFn;\n}\nTimeout.prototype.unref = Timeout.prototype.ref = function() {};\nTimeout.prototype.close = function() {\n  this._clearFn.call(window, this._id);\n};\n\n// Does not start the time, just sets up the members needed.\nexports.enroll = function(item, msecs) {\n  clearTimeout(item._idleTimeoutId);\n  item._idleTimeout = msecs;\n};\n\nexports.unenroll = function(item) {\n  clearTimeout(item._idleTimeoutId);\n  item._idleTimeout = -1;\n};\n\nexports._unrefActive = exports.active = function(item) {\n  clearTimeout(item._idleTimeoutId);\n\n  var msecs = item._idleTimeout;\n  if (msecs >= 0) {\n    item._idleTimeoutId = setTimeout(function onTimeout() {\n      if (item._onTimeout)\n        item._onTimeout();\n    }, msecs);\n  }\n};\n\n// That's not how node.js implements it but the exposed api is the same.\nexports.setImmediate = typeof setImmediate === \"function\" ? setImmediate : function(fn) {\n  var id = nextImmediateId++;\n  var args = arguments.length < 2 ? false : slice.call(arguments, 1);\n\n  immediateIds[id] = true;\n\n  nextTick(function onNextTick() {\n    if (immediateIds[id]) {\n      // fn.call() is faster so we optimize for the common use-case\n      // @see http://jsperf.com/call-apply-segu\n      if (args) {\n        fn.apply(null, args);\n      } else {\n        fn.call(null);\n      }\n      // Prevent ids from leaking\n      exports.clearImmediate(id);\n    }\n  });\n\n  return id;\n};\n\nexports.clearImmediate = typeof clearImmediate === \"function\" ? clearImmediate : function(id) {\n  delete immediateIds[id];\n};\n}).call(this,_dereq_(\"timers\").setImmediate,_dereq_(\"timers\").clearImmediate)\n\n},{\"process/browser.js\":165,\"timers\":164}],165:[function(_dereq_,module,exports){\narguments[4][23][0].apply(exports,arguments)\n},{\"dup\":23}],166:[function(_dereq_,module,exports){\n(function (global){\n\n/**\n * Module exports.\n */\n\nmodule.exports = deprecate;\n\n/**\n * Mark that a method should not be used.\n * Returns a modified function which warns once by default.\n *\n * If `localStorage.noDeprecation = true` is set, then it is a no-op.\n *\n * If `localStorage.throwDeprecation = true` is set, then deprecated functions\n * will throw an Error when invoked.\n *\n * If `localStorage.traceDeprecation = true` is set, then deprecated functions\n * will invoke `console.trace()` instead of `console.error()`.\n *\n * @param {Function} fn - the function to deprecate\n * @param {String} msg - the string to print to the console when `fn` is invoked\n * @returns {Function} a new \"deprecated\" version of `fn`\n * @api public\n */\n\nfunction deprecate (fn, msg) {\n  if (config('noDeprecation')) {\n    return fn;\n  }\n\n  var warned = false;\n  function deprecated() {\n    if (!warned) {\n      if (config('throwDeprecation')) {\n        throw new Error(msg);\n      } else if (config('traceDeprecation')) {\n        console.trace(msg);\n      } else {\n        console.warn(msg);\n      }\n      warned = true;\n    }\n    return fn.apply(this, arguments);\n  }\n\n  return deprecated;\n}\n\n/**\n * Checks `localStorage` for boolean values for the given `name`.\n *\n * @param {String} name\n * @returns {Boolean}\n * @api private\n */\n\nfunction config (name) {\n  // accessing global.localStorage can trigger a DOMException in sandboxed iframes\n  try {\n    if (!global.localStorage) return false;\n  } catch (_) {\n    return false;\n  }\n  var val = global.localStorage[name];\n  if (null == val) return false;\n  return String(val).toLowerCase() === 'true';\n}\n\n}).call(this,typeof global !== \"undefined\" ? global : typeof self !== \"undefined\" ? self : typeof window !== \"undefined\" ? window : {})\n\n},{}],167:[function(_dereq_,module,exports){\narguments[4][128][0].apply(exports,arguments)\n},{\"dup\":128}],168:[function(_dereq_,module,exports){\nmodule.exports = function isBuffer(arg) {\n  return arg && typeof arg === 'object'\n    && typeof arg.copy === 'function'\n    && typeof arg.fill === 'function'\n    && typeof arg.readUInt8 === 'function';\n}\n},{}],169:[function(_dereq_,module,exports){\n(function (process,global){\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\nvar formatRegExp = /%[sdj%]/g;\nexports.format = function(f) {\n  if (!isString(f)) {\n    var objects = [];\n    for (var i = 0; i < arguments.length; i++) {\n      objects.push(inspect(arguments[i]));\n    }\n    return objects.join(' ');\n  }\n\n  var i = 1;\n  var args = arguments;\n  var len = args.length;\n  var str = String(f).replace(formatRegExp, function(x) {\n    if (x === '%%') return '%';\n    if (i >= len) return x;\n    switch (x) {\n      case '%s': return String(args[i++]);\n      case '%d': return Number(args[i++]);\n      case '%j':\n        try {\n          return JSON.stringify(args[i++]);\n        } catch (_) {\n          return '[Circular]';\n        }\n      default:\n        return x;\n    }\n  });\n  for (var x = args[i]; i < len; x = args[++i]) {\n    if (isNull(x) || !isObject(x)) {\n      str += ' ' + x;\n    } else {\n      str += ' ' + inspect(x);\n    }\n  }\n  return str;\n};\n\n\n// Mark that a method should not be used.\n// Returns a modified function which warns once by default.\n// If --no-deprecation is set, then it is a no-op.\nexports.deprecate = function(fn, msg) {\n  // Allow for deprecating things in the process of starting up.\n  if (isUndefined(global.process)) {\n    return function() {\n      return exports.deprecate(fn, msg).apply(this, arguments);\n    };\n  }\n\n  if (process.noDeprecation === true) {\n    return fn;\n  }\n\n  var warned = false;\n  function deprecated() {\n    if (!warned) {\n      if (process.throwDeprecation) {\n        throw new Error(msg);\n      } else if (process.traceDeprecation) {\n        console.trace(msg);\n      } else {\n        console.error(msg);\n      }\n      warned = true;\n    }\n    return fn.apply(this, arguments);\n  }\n\n  return deprecated;\n};\n\n\nvar debugs = {};\nvar debugEnviron;\nexports.debuglog = function(set) {\n  if (isUndefined(debugEnviron))\n    debugEnviron = process.env.NODE_DEBUG || '';\n  set = set.toUpperCase();\n  if (!debugs[set]) {\n    if (new RegExp('\\\\b' + set + '\\\\b', 'i').test(debugEnviron)) {\n      var pid = process.pid;\n      debugs[set] = function() {\n        var msg = exports.format.apply(exports, arguments);\n        console.error('%s %d: %s', set, pid, msg);\n      };\n    } else {\n      debugs[set] = function() {};\n    }\n  }\n  return debugs[set];\n};\n\n\n/**\n * Echos the value of a value. Trys to print the value out\n * in the best way possible given the different types.\n *\n * @param {Object} obj The object to print out.\n * @param {Object} opts Optional options object that alters the output.\n */\n/* legacy: obj, showHidden, depth, colors*/\nfunction inspect(obj, opts) {\n  // default options\n  var ctx = {\n    seen: [],\n    stylize: stylizeNoColor\n  };\n  // legacy...\n  if (arguments.length >= 3) ctx.depth = arguments[2];\n  if (arguments.length >= 4) ctx.colors = arguments[3];\n  if (isBoolean(opts)) {\n    // legacy...\n    ctx.showHidden = opts;\n  } else if (opts) {\n    // got an \"options\" object\n    exports._extend(ctx, opts);\n  }\n  // set default options\n  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;\n  if (isUndefined(ctx.depth)) ctx.depth = 2;\n  if (isUndefined(ctx.colors)) ctx.colors = false;\n  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;\n  if (ctx.colors) ctx.stylize = stylizeWithColor;\n  return formatValue(ctx, obj, ctx.depth);\n}\nexports.inspect = inspect;\n\n\n// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics\ninspect.colors = {\n  'bold' : [1, 22],\n  'italic' : [3, 23],\n  'underline' : [4, 24],\n  'inverse' : [7, 27],\n  'white' : [37, 39],\n  'grey' : [90, 39],\n  'black' : [30, 39],\n  'blue' : [34, 39],\n  'cyan' : [36, 39],\n  'green' : [32, 39],\n  'magenta' : [35, 39],\n  'red' : [31, 39],\n  'yellow' : [33, 39]\n};\n\n// Don't use 'blue' not visible on cmd.exe\ninspect.styles = {\n  'special': 'cyan',\n  'number': 'yellow',\n  'boolean': 'yellow',\n  'undefined': 'grey',\n  'null': 'bold',\n  'string': 'green',\n  'date': 'magenta',\n  // \"name\": intentionally not styling\n  'regexp': 'red'\n};\n\n\nfunction stylizeWithColor(str, styleType) {\n  var style = inspect.styles[styleType];\n\n  if (style) {\n    return '\\u001b[' + inspect.colors[style][0] + 'm' + str +\n           '\\u001b[' + inspect.colors[style][1] + 'm';\n  } else {\n    return str;\n  }\n}\n\n\nfunction stylizeNoColor(str, styleType) {\n  return str;\n}\n\n\nfunction arrayToHash(array) {\n  var hash = {};\n\n  array.forEach(function(val, idx) {\n    hash[val] = true;\n  });\n\n  return hash;\n}\n\n\nfunction formatValue(ctx, value, recurseTimes) {\n  // Provide a hook for user-specified inspect functions.\n  // Check that value is an object with an inspect function on it\n  if (ctx.customInspect &&\n      value &&\n      isFunction(value.inspect) &&\n      // Filter out the util module, it's inspect function is special\n      value.inspect !== exports.inspect &&\n      // Also filter out any prototype objects using the circular check.\n      !(value.constructor && value.constructor.prototype === value)) {\n    var ret = value.inspect(recurseTimes, ctx);\n    if (!isString(ret)) {\n      ret = formatValue(ctx, ret, recurseTimes);\n    }\n    return ret;\n  }\n\n  // Primitive types cannot have properties\n  var primitive = formatPrimitive(ctx, value);\n  if (primitive) {\n    return primitive;\n  }\n\n  // Look up the keys of the object.\n  var keys = Object.keys(value);\n  var visibleKeys = arrayToHash(keys);\n\n  if (ctx.showHidden) {\n    keys = Object.getOwnPropertyNames(value);\n  }\n\n  // IE doesn't make error fields non-enumerable\n  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx\n  if (isError(value)\n      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {\n    return formatError(value);\n  }\n\n  // Some type of object without properties can be shortcutted.\n  if (keys.length === 0) {\n    if (isFunction(value)) {\n      var name = value.name ? ': ' + value.name : '';\n      return ctx.stylize('[Function' + name + ']', 'special');\n    }\n    if (isRegExp(value)) {\n      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');\n    }\n    if (isDate(value)) {\n      return ctx.stylize(Date.prototype.toString.call(value), 'date');\n    }\n    if (isError(value)) {\n      return formatError(value);\n    }\n  }\n\n  var base = '', array = false, braces = ['{', '}'];\n\n  // Make Array say that they are Array\n  if (isArray(value)) {\n    array = true;\n    braces = ['[', ']'];\n  }\n\n  // Make functions say that they are functions\n  if (isFunction(value)) {\n    var n = value.name ? ': ' + value.name : '';\n    base = ' [Function' + n + ']';\n  }\n\n  // Make RegExps say that they are RegExps\n  if (isRegExp(value)) {\n    base = ' ' + RegExp.prototype.toString.call(value);\n  }\n\n  // Make dates with properties first say the date\n  if (isDate(value)) {\n    base = ' ' + Date.prototype.toUTCString.call(value);\n  }\n\n  // Make error with message first say the error\n  if (isError(value)) {\n    base = ' ' + formatError(value);\n  }\n\n  if (keys.length === 0 && (!array || value.length == 0)) {\n    return braces[0] + base + braces[1];\n  }\n\n  if (recurseTimes < 0) {\n    if (isRegExp(value)) {\n      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');\n    } else {\n      return ctx.stylize('[Object]', 'special');\n    }\n  }\n\n  ctx.seen.push(value);\n\n  var output;\n  if (array) {\n    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);\n  } else {\n    output = keys.map(function(key) {\n      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);\n    });\n  }\n\n  ctx.seen.pop();\n\n  return reduceToSingleString(output, base, braces);\n}\n\n\nfunction formatPrimitive(ctx, value) {\n  if (isUndefined(value))\n    return ctx.stylize('undefined', 'undefined');\n  if (isString(value)) {\n    var simple = '\\'' + JSON.stringify(value).replace(/^\"|\"$/g, '')\n                                             .replace(/'/g, \"\\\\'\")\n                                             .replace(/\\\\\"/g, '\"') + '\\'';\n    return ctx.stylize(simple, 'string');\n  }\n  if (isNumber(value))\n    return ctx.stylize('' + value, 'number');\n  if (isBoolean(value))\n    return ctx.stylize('' + value, 'boolean');\n  // For some reason typeof null is \"object\", so special case here.\n  if (isNull(value))\n    return ctx.stylize('null', 'null');\n}\n\n\nfunction formatError(value) {\n  return '[' + Error.prototype.toString.call(value) + ']';\n}\n\n\nfunction formatArray(ctx, value, recurseTimes, visibleKeys, keys) {\n  var output = [];\n  for (var i = 0, l = value.length; i < l; ++i) {\n    if (hasOwnProperty(value, String(i))) {\n      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,\n          String(i), true));\n    } else {\n      output.push('');\n    }\n  }\n  keys.forEach(function(key) {\n    if (!key.match(/^\\d+$/)) {\n      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,\n          key, true));\n    }\n  });\n  return output;\n}\n\n\nfunction formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {\n  var name, str, desc;\n  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };\n  if (desc.get) {\n    if (desc.set) {\n      str = ctx.stylize('[Getter/Setter]', 'special');\n    } else {\n      str = ctx.stylize('[Getter]', 'special');\n    }\n  } else {\n    if (desc.set) {\n      str = ctx.stylize('[Setter]', 'special');\n    }\n  }\n  if (!hasOwnProperty(visibleKeys, key)) {\n    name = '[' + key + ']';\n  }\n  if (!str) {\n    if (ctx.seen.indexOf(desc.value) < 0) {\n      if (isNull(recurseTimes)) {\n        str = formatValue(ctx, desc.value, null);\n      } else {\n        str = formatValue(ctx, desc.value, recurseTimes - 1);\n      }\n      if (str.indexOf('\\n') > -1) {\n        if (array) {\n          str = str.split('\\n').map(function(line) {\n            return '  ' + line;\n          }).join('\\n').substr(2);\n        } else {\n          str = '\\n' + str.split('\\n').map(function(line) {\n            return '   ' + line;\n          }).join('\\n');\n        }\n      }\n    } else {\n      str = ctx.stylize('[Circular]', 'special');\n    }\n  }\n  if (isUndefined(name)) {\n    if (array && key.match(/^\\d+$/)) {\n      return str;\n    }\n    name = JSON.stringify('' + key);\n    if (name.match(/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)) {\n      name = name.substr(1, name.length - 2);\n      name = ctx.stylize(name, 'name');\n    } else {\n      name = name.replace(/'/g, \"\\\\'\")\n                 .replace(/\\\\\"/g, '\"')\n                 .replace(/(^\"|\"$)/g, \"'\");\n      name = ctx.stylize(name, 'string');\n    }\n  }\n\n  return name + ': ' + str;\n}\n\n\nfunction reduceToSingleString(output, base, braces) {\n  var numLinesEst = 0;\n  var length = output.reduce(function(prev, cur) {\n    numLinesEst++;\n    if (cur.indexOf('\\n') >= 0) numLinesEst++;\n    return prev + cur.replace(/\\u001b\\[\\d\\d?m/g, '').length + 1;\n  }, 0);\n\n  if (length > 60) {\n    return braces[0] +\n           (base === '' ? '' : base + '\\n ') +\n           ' ' +\n           output.join(',\\n  ') +\n           ' ' +\n           braces[1];\n  }\n\n  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];\n}\n\n\n// NOTE: These type checking functions intentionally don't use `instanceof`\n// because it is fragile and can be easily faked with `Object.create()`.\nfunction isArray(ar) {\n  return Array.isArray(ar);\n}\nexports.isArray = isArray;\n\nfunction isBoolean(arg) {\n  return typeof arg === 'boolean';\n}\nexports.isBoolean = isBoolean;\n\nfunction isNull(arg) {\n  return arg === null;\n}\nexports.isNull = isNull;\n\nfunction isNullOrUndefined(arg) {\n  return arg == null;\n}\nexports.isNullOrUndefined = isNullOrUndefined;\n\nfunction isNumber(arg) {\n  return typeof arg === 'number';\n}\nexports.isNumber = isNumber;\n\nfunction isString(arg) {\n  return typeof arg === 'string';\n}\nexports.isString = isString;\n\nfunction isSymbol(arg) {\n  return typeof arg === 'symbol';\n}\nexports.isSymbol = isSymbol;\n\nfunction isUndefined(arg) {\n  return arg === void 0;\n}\nexports.isUndefined = isUndefined;\n\nfunction isRegExp(re) {\n  return isObject(re) && objectToString(re) === '[object RegExp]';\n}\nexports.isRegExp = isRegExp;\n\nfunction isObject(arg) {\n  return typeof arg === 'object' && arg !== null;\n}\nexports.isObject = isObject;\n\nfunction isDate(d) {\n  return isObject(d) && objectToString(d) === '[object Date]';\n}\nexports.isDate = isDate;\n\nfunction isError(e) {\n  return isObject(e) &&\n      (objectToString(e) === '[object Error]' || e instanceof Error);\n}\nexports.isError = isError;\n\nfunction isFunction(arg) {\n  return typeof arg === 'function';\n}\nexports.isFunction = isFunction;\n\nfunction isPrimitive(arg) {\n  return arg === null ||\n         typeof arg === 'boolean' ||\n         typeof arg === 'number' ||\n         typeof arg === 'string' ||\n         typeof arg === 'symbol' ||  // ES6 symbol\n         typeof arg === 'undefined';\n}\nexports.isPrimitive = isPrimitive;\n\nexports.isBuffer = _dereq_('./support/isBuffer');\n\nfunction objectToString(o) {\n  return Object.prototype.toString.call(o);\n}\n\n\nfunction pad(n) {\n  return n < 10 ? '0' + n.toString(10) : n.toString(10);\n}\n\n\nvar months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',\n              'Oct', 'Nov', 'Dec'];\n\n// 26 Feb 16:19:34\nfunction timestamp() {\n  var d = new Date();\n  var time = [pad(d.getHours()),\n              pad(d.getMinutes()),\n              pad(d.getSeconds())].join(':');\n  return [d.getDate(), months[d.getMonth()], time].join(' ');\n}\n\n\n// log is just a thin wrapper to console.log that prepends a timestamp\nexports.log = function() {\n  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));\n};\n\n\n/**\n * Inherit the prototype methods from one constructor into another.\n *\n * The Function.prototype.inherits from lang.js rewritten as a standalone\n * function (not on Function.prototype). NOTE: If this file is to be loaded\n * during bootstrapping this function needs to be rewritten using some native\n * functions as prototype setup using normal JavaScript does not work as\n * expected during bootstrapping (see mirror.js in r114903).\n *\n * @param {function} ctor Constructor function which needs to inherit the\n *     prototype.\n * @param {function} superCtor Constructor function to inherit prototype from.\n */\nexports.inherits = _dereq_('inherits');\n\nexports._extend = function(origin, add) {\n  // Don't do anything if add isn't an object\n  if (!add || !isObject(add)) return origin;\n\n  var keys = Object.keys(add);\n  var i = keys.length;\n  while (i--) {\n    origin[keys[i]] = add[keys[i]];\n  }\n  return origin;\n};\n\nfunction hasOwnProperty(obj, prop) {\n  return Object.prototype.hasOwnProperty.call(obj, prop);\n}\n\n}).call(this,_dereq_('_process'),typeof global !== \"undefined\" ? global : typeof self !== \"undefined\" ? self : typeof window !== \"undefined\" ? window : {})\n\n},{\"./support/isBuffer\":168,\"_process\":23,\"inherits\":167}],170:[function(_dereq_,module,exports){\n(function (global,Buffer){\n_dereq_=function t(e,n,r){function o(a,s){if(!n[a]){if(!e[a]){var c=\"function\"==typeof _dereq_&&_dereq_;if(!s&&c)return c(a,!0);if(i)return i(a,!0);var u=new Error(\"Cannot find module '\"+a+\"'\");throw u.code=\"MODULE_NOT_FOUND\",u}var f=n[a]={exports:{}};e[a][0].call(f.exports,function(t){var n=e[a][1][t];return o(n||t)},f,f.exports,t,e,n,r)}return n[a].exports}for(var i=\"function\"==typeof _dereq_&&_dereq_,a=0;a<r.length;a++)o(r[a]);return o}({1:[function(t,e,n){e.exports=[{constant:!0,inputs:[{name:\"_owner\",type:\"address\"}],name:\"name\",outputs:[{name:\"o_name\",type:\"bytes32\"}],type:\"function\"},{constant:!0,inputs:[{name:\"_name\",type:\"bytes32\"}],name:\"owner\",outputs:[{name:\"\",type:\"address\"}],type:\"function\"},{constant:!0,inputs:[{name:\"_name\",type:\"bytes32\"}],name:\"content\",outputs:[{name:\"\",type:\"bytes32\"}],type:\"function\"},{constant:!0,inputs:[{name:\"_name\",type:\"bytes32\"}],name:\"addr\",outputs:[{name:\"\",type:\"address\"}],type:\"function\"},{constant:!1,inputs:[{name:\"_name\",type:\"bytes32\"}],name:\"reserve\",outputs:[],type:\"function\"},{constant:!0,inputs:[{name:\"_name\",type:\"bytes32\"}],name:\"subRegistrar\",outputs:[{name:\"\",type:\"address\"}],type:\"function\"},{constant:!1,inputs:[{name:\"_name\",type:\"bytes32\"},{name:\"_newOwner\",type:\"address\"}],name:\"transfer\",outputs:[],type:\"function\"},{constant:!1,inputs:[{name:\"_name\",type:\"bytes32\"},{name:\"_registrar\",type:\"address\"}],name:\"setSubRegistrar\",outputs:[],type:\"function\"},{constant:!1,inputs:[],name:\"Registrar\",outputs:[],type:\"function\"},{constant:!1,inputs:[{name:\"_name\",type:\"bytes32\"},{name:\"_a\",type:\"address\"},{name:\"_primary\",type:\"bool\"}],name:\"setAddress\",outputs:[],type:\"function\"},{constant:!1,inputs:[{name:\"_name\",type:\"bytes32\"},{name:\"_content\",type:\"bytes32\"}],name:\"setContent\",outputs:[],type:\"function\"},{constant:!1,inputs:[{name:\"_name\",type:\"bytes32\"}],name:\"disown\",outputs:[],type:\"function\"},{anonymous:!1,inputs:[{indexed:!0,name:\"_name\",type:\"bytes32\"},{indexed:!1,name:\"_winner\",type:\"address\"}],name:\"AuctionEnded\",type:\"event\"},{anonymous:!1,inputs:[{indexed:!0,name:\"_name\",type:\"bytes32\"},{indexed:!1,name:\"_bidder\",type:\"address\"},{indexed:!1,name:\"_value\",type:\"uint256\"}],name:\"NewBid\",type:\"event\"},{anonymous:!1,inputs:[{indexed:!0,name:\"name\",type:\"bytes32\"}],name:\"Changed\",type:\"event\"},{anonymous:!1,inputs:[{indexed:!0,name:\"name\",type:\"bytes32\"},{indexed:!0,name:\"addr\",type:\"address\"}],name:\"PrimaryChanged\",type:\"event\"}]},{}],2:[function(t,e,n){e.exports=[{constant:!0,inputs:[{name:\"_name\",type:\"bytes32\"}],name:\"owner\",outputs:[{name:\"\",type:\"address\"}],type:\"function\"},{constant:!1,inputs:[{name:\"_name\",type:\"bytes32\"},{name:\"_refund\",type:\"address\"}],name:\"disown\",outputs:[],type:\"function\"},{constant:!0,inputs:[{name:\"_name\",type:\"bytes32\"}],name:\"addr\",outputs:[{name:\"\",type:\"address\"}],type:\"function\"},{constant:!1,inputs:[{name:\"_name\",type:\"bytes32\"}],name:\"reserve\",outputs:[],type:\"function\"},{constant:!1,inputs:[{name:\"_name\",type:\"bytes32\"},{name:\"_newOwner\",type:\"address\"}],name:\"transfer\",outputs:[],type:\"function\"},{constant:!1,inputs:[{name:\"_name\",type:\"bytes32\"},{name:\"_a\",type:\"address\"}],name:\"setAddr\",outputs:[],type:\"function\"},{anonymous:!1,inputs:[{indexed:!0,name:\"name\",type:\"bytes32\"}],name:\"Changed\",type:\"event\"}]},{}],3:[function(t,e,n){e.exports=[{constant:!1,inputs:[{name:\"from\",type:\"bytes32\"},{name:\"to\",type:\"address\"},{name:\"value\",type:\"uint256\"}],name:\"transfer\",outputs:[],type:\"function\"},{constant:!1,inputs:[{name:\"from\",type:\"bytes32\"},{name:\"to\",type:\"address\"},{name:\"indirectId\",type:\"bytes32\"},{name:\"value\",type:\"uint256\"}],name:\"icapTransfer\",outputs:[],type:\"function\"},{constant:!1,inputs:[{name:\"to\",type:\"bytes32\"}],name:\"deposit\",outputs:[],payable:!0,type:\"function\"},{anonymous:!1,inputs:[{indexed:!0,name:\"from\",type:\"address\"},{indexed:!1,name:\"value\",type:\"uint256\"}],name:\"AnonymousDeposit\",type:\"event\"},{anonymous:!1,inputs:[{indexed:!0,name:\"from\",type:\"address\"},{indexed:!0,name:\"to\",type:\"bytes32\"},{indexed:!1,name:\"value\",type:\"uint256\"}],name:\"Deposit\",type:\"event\"},{anonymous:!1,inputs:[{indexed:!0,name:\"from\",type:\"bytes32\"},{indexed:!0,name:\"to\",type:\"address\"},{indexed:!1,name:\"value\",type:\"uint256\"}],name:\"Transfer\",type:\"event\"},{anonymous:!1,inputs:[{indexed:!0,name:\"from\",type:\"bytes32\"},{indexed:!0,name:\"to\",type:\"address\"},{indexed:!1,name:\"indirectId\",type:\"bytes32\"},{indexed:!1,name:\"value\",type:\"uint256\"}],name:\"IcapTransfer\",type:\"event\"}]},{}],4:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./type\"),i=function(){this._inputFormatter=r.formatInputInt,this._outputFormatter=r.formatOutputAddress};(i.prototype=new o({})).constructor=i,i.prototype.isType=function(t){return!!t.match(/address(\\[([0-9]*)\\])?/)},e.exports=i},{\"./formatters\":9,\"./type\":14}],5:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./type\"),i=function(){this._inputFormatter=r.formatInputBool,this._outputFormatter=r.formatOutputBool};(i.prototype=new o({})).constructor=i,i.prototype.isType=function(t){return!!t.match(/^bool(\\[([0-9]*)\\])*$/)},e.exports=i},{\"./formatters\":9,\"./type\":14}],6:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./type\"),i=function(){this._inputFormatter=r.formatInputBytes,this._outputFormatter=r.formatOutputBytes};(i.prototype=new o({})).constructor=i,i.prototype.isType=function(t){return!!t.match(/^bytes([0-9]{1,})(\\[([0-9]*)\\])*$/)},e.exports=i},{\"./formatters\":9,\"./type\":14}],7:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./address\"),i=t(\"./bool\"),a=t(\"./int\"),s=t(\"./uint\"),c=t(\"./dynamicbytes\"),u=t(\"./string\"),f=t(\"./real\"),l=t(\"./ureal\"),p=t(\"./bytes\"),h=function(t,e){return t.isDynamicType(e)||t.isDynamicArray(e)},d=function(t){this._types=t};d.prototype._requireType=function(t){var e=this._types.filter(function(e){return e.isType(t)})[0];if(!e)throw Error(\"invalid solidity type!: \"+t);return e},d.prototype.encodeParam=function(t,e){return this.encodeParams([t],[e])},d.prototype.encodeParams=function(t,e){var n=this.getSolidityTypes(t),r=n.map(function(n,r){return n.encode(e[r],t[r])}),o=n.reduce(function(e,r,o){var i=r.staticPartLength(t[o]),a=32*Math.floor((i+31)/32);return e+(h(n[o],t[o])?32:a)},0);return this.encodeMultiWithOffset(t,n,r,o)},d.prototype.encodeMultiWithOffset=function(t,e,n,o){var i=\"\",a=this;return t.forEach(function(s,c){if(h(e[c],t[c])){i+=r.formatInputInt(o).encode();var u=a.encodeWithOffset(t[c],e[c],n[c],o);o+=u.length/2}else i+=a.encodeWithOffset(t[c],e[c],n[c],o)}),t.forEach(function(r,s){if(h(e[s],t[s])){var c=a.encodeWithOffset(t[s],e[s],n[s],o);o+=c.length/2,i+=c}}),i},d.prototype.encodeWithOffset=function(t,e,n,o){var i=1,a=2,s=3,c=e.isDynamicArray(t)?i:e.isStaticArray(t)?a:s;if(c!==s){var u=e.nestedName(t),f=e.staticPartLength(u),l=c===i?n[0]:\"\";if(e.isDynamicArray(u))for(var p=c===i?2:0,h=0;h<n.length;h++)c===i?p+=+n[h-1][0]||0:c===a&&(p+=+(n[h-1]||[])[0]||0),l+=r.formatInputInt(o+h*f+32*p).encode();for(var d=c===i?n.length-1:n.length,m=0;m<d;m++){var y=l/2;c===i?l+=this.encodeWithOffset(u,e,n[m+1],o+y):c===a&&(l+=this.encodeWithOffset(u,e,n[m],o+y))}return l}return n},d.prototype.decodeParam=function(t,e){return this.decodeParams([t],e)[0]},d.prototype.decodeParams=function(t,e){var n=this.getSolidityTypes(t),r=this.getOffsets(t,n);return n.map(function(n,o){return n.decode(e,r[o],t[o],o)})},d.prototype.getOffsets=function(t,e){for(var n=e.map(function(e,n){return e.staticPartLength(t[n])}),r=1;r<n.length;r++)n[r]+=n[r-1];return n.map(function(n,r){return n-e[r].staticPartLength(t[r])})},d.prototype.getSolidityTypes=function(t){var e=this;return t.map(function(t){return e._requireType(t)})};var m=new d([new o,new i,new a,new s,new c,new p,new u,new f,new l]);e.exports=m},{\"./address\":4,\"./bool\":5,\"./bytes\":6,\"./dynamicbytes\":8,\"./formatters\":9,\"./int\":10,\"./real\":12,\"./string\":13,\"./uint\":15,\"./ureal\":16}],8:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./type\"),i=function(){this._inputFormatter=r.formatInputDynamicBytes,this._outputFormatter=r.formatOutputDynamicBytes};(i.prototype=new o({})).constructor=i,i.prototype.isType=function(t){return!!t.match(/^bytes(\\[([0-9]*)\\])*$/)},i.prototype.isDynamicType=function(){return!0},e.exports=i},{\"./formatters\":9,\"./type\":14}],9:[function(t,e,n){var r=t(\"bignumber.js\"),o=t(\"../utils/utils\"),i=t(\"../utils/config\"),a=t(\"./param\"),s=function(t){r.config(i.ETH_BIGNUMBER_ROUNDING_MODE);var e=o.padLeft(o.toTwosComplement(t).toString(16),64);return new a(e)},c=function(t){var e=t.staticPart()||\"0\";return function(t){return\"1\"===new r(t.substr(0,1),16).toString(2).substr(0,1)}(e)?new r(e,16).minus(new r(\"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff\",16)).minus(1):new r(e,16)},u=function(t){var e=t.staticPart()||\"0\";return new r(e,16)};e.exports={formatInputInt:s,formatInputBytes:function(t){var e=o.toHex(t).substr(2),n=Math.floor((e.length+63)/64);return e=o.padRight(e,64*n),new a(e)},formatInputDynamicBytes:function(t){var e=o.toHex(t).substr(2),n=e.length/2,r=Math.floor((e.length+63)/64);return e=o.padRight(e,64*r),new a(s(n).value+e)},formatInputString:function(t){var e=o.fromUtf8(t).substr(2),n=e.length/2,r=Math.floor((e.length+63)/64);return e=o.padRight(e,64*r),new a(s(n).value+e)},formatInputBool:function(t){return new a(\"000000000000000000000000000000000000000000000000000000000000000\"+(t?\"1\":\"0\"))},formatInputReal:function(t){return s(new r(t).times(new r(2).pow(128)))},formatOutputInt:c,formatOutputUInt:u,formatOutputReal:function(t){return c(t).dividedBy(new r(2).pow(128))},formatOutputUReal:function(t){return u(t).dividedBy(new r(2).pow(128))},formatOutputBool:function(t){return\"0000000000000000000000000000000000000000000000000000000000000001\"===t.staticPart()},formatOutputBytes:function(t,e){var n=e.match(/^bytes([0-9]*)/),r=parseInt(n[1]);return\"0x\"+t.staticPart().slice(0,2*r)},formatOutputDynamicBytes:function(t){var e=2*new r(t.dynamicPart().slice(0,64),16).toNumber();return\"0x\"+t.dynamicPart().substr(64,e)},formatOutputString:function(t){var e=2*new r(t.dynamicPart().slice(0,64),16).toNumber();return o.toUtf8(t.dynamicPart().substr(64,e))},formatOutputAddress:function(t){var e=t.staticPart();return\"0x\"+e.slice(e.length-40,e.length)}}},{\"../utils/config\":18,\"../utils/utils\":20,\"./param\":11,\"bignumber.js\":\"bignumber.js\"}],10:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./type\"),i=function(){this._inputFormatter=r.formatInputInt,this._outputFormatter=r.formatOutputInt};(i.prototype=new o({})).constructor=i,i.prototype.isType=function(t){return!!t.match(/^int([0-9]*)?(\\[([0-9]*)\\])*$/)},e.exports=i},{\"./formatters\":9,\"./type\":14}],11:[function(t,e,n){var r=t(\"../utils/utils\"),o=function(t,e){this.value=t||\"\",this.offset=e};o.prototype.dynamicPartLength=function(){return this.dynamicPart().length/2},o.prototype.withOffset=function(t){return new o(this.value,t)},o.prototype.combine=function(t){return new o(this.value+t.value)},o.prototype.isDynamic=function(){return void 0!==this.offset},o.prototype.offsetAsBytes=function(){return this.isDynamic()?r.padLeft(r.toTwosComplement(this.offset).toString(16),64):\"\"},o.prototype.staticPart=function(){return this.isDynamic()?this.offsetAsBytes():this.value},o.prototype.dynamicPart=function(){return this.isDynamic()?this.value:\"\"},o.prototype.encode=function(){return this.staticPart()+this.dynamicPart()},o.encodeList=function(t){var e=32*t.length,n=t.map(function(t){if(!t.isDynamic())return t;var n=e;return e+=t.dynamicPartLength(),t.withOffset(n)});return n.reduce(function(t,e){return t+e.dynamicPart()},n.reduce(function(t,e){return t+e.staticPart()},\"\"))},e.exports=o},{\"../utils/utils\":20}],12:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./type\"),i=function(){this._inputFormatter=r.formatInputReal,this._outputFormatter=r.formatOutputReal};(i.prototype=new o({})).constructor=i,i.prototype.isType=function(t){return!!t.match(/real([0-9]*)?(\\[([0-9]*)\\])?/)},e.exports=i},{\"./formatters\":9,\"./type\":14}],13:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./type\"),i=function(){this._inputFormatter=r.formatInputString,this._outputFormatter=r.formatOutputString};(i.prototype=new o({})).constructor=i,i.prototype.isType=function(t){return!!t.match(/^string(\\[([0-9]*)\\])*$/)},i.prototype.isDynamicType=function(){return!0},e.exports=i},{\"./formatters\":9,\"./type\":14}],14:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./param\"),i=function(t){this._inputFormatter=t.inputFormatter,this._outputFormatter=t.outputFormatter};i.prototype.isType=function(t){throw\"this method should be overrwritten for type \"+t},i.prototype.staticPartLength=function(t){return(this.nestedTypes(t)||[\"[1]\"]).map(function(t){return parseInt(t.slice(1,-1),10)||1}).reduce(function(t,e){return t*e},32)},i.prototype.isDynamicArray=function(t){var e=this.nestedTypes(t);return!!e&&!e[e.length-1].match(/[0-9]{1,}/g)},i.prototype.isStaticArray=function(t){var e=this.nestedTypes(t);return!!e&&!!e[e.length-1].match(/[0-9]{1,}/g)},i.prototype.staticArrayLength=function(t){var e=this.nestedTypes(t);return e?parseInt(e[e.length-1].match(/[0-9]{1,}/g)||1):1},i.prototype.nestedName=function(t){var e=this.nestedTypes(t);return e?t.substr(0,t.length-e[e.length-1].length):t},i.prototype.isDynamicType=function(){return!1},i.prototype.nestedTypes=function(t){return t.match(/(\\[[0-9]*\\])/g)},i.prototype.encode=function(t,e){var n=this;return this.isDynamicArray(e)?function(){var o=t.length,i=n.nestedName(e),a=[];return a.push(r.formatInputInt(o).encode()),t.forEach(function(t){a.push(n.encode(t,i))}),a}():this.isStaticArray(e)?function(){for(var r=n.staticArrayLength(e),o=n.nestedName(e),i=[],a=0;a<r;a++)i.push(n.encode(t[a],o));return i}():this._inputFormatter(t,e).encode()},i.prototype.decode=function(t,e,n){var r=this;if(this.isDynamicArray(n))return function(){for(var o=parseInt(\"0x\"+t.substr(2*e,64)),i=parseInt(\"0x\"+t.substr(2*o,64)),a=o+32,s=r.nestedName(n),c=r.staticPartLength(s),u=32*Math.floor((c+31)/32),f=[],l=0;l<i*u;l+=u)f.push(r.decode(t,a+l,s));return f}();if(this.isStaticArray(n))return function(){for(var o=r.staticArrayLength(n),i=e,a=r.nestedName(n),s=r.staticPartLength(a),c=32*Math.floor((s+31)/32),u=[],f=0;f<o*c;f+=c)u.push(r.decode(t,i+f,a));return u}();if(this.isDynamicType(n))return function(){var i=parseInt(\"0x\"+t.substr(2*e,64)),a=parseInt(\"0x\"+t.substr(2*i,64)),s=Math.floor((a+31)/32),c=new o(t.substr(2*i,64*(1+s)),0);return r._outputFormatter(c,n)}();var i=this.staticPartLength(n),a=new o(t.substr(2*e,2*i));return this._outputFormatter(a,n)},e.exports=i},{\"./formatters\":9,\"./param\":11}],15:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./type\"),i=function(){this._inputFormatter=r.formatInputInt,this._outputFormatter=r.formatOutputUInt};(i.prototype=new o({})).constructor=i,i.prototype.isType=function(t){return!!t.match(/^uint([0-9]*)?(\\[([0-9]*)\\])*$/)},e.exports=i},{\"./formatters\":9,\"./type\":14}],16:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./type\"),i=function(){this._inputFormatter=r.formatInputReal,this._outputFormatter=r.formatOutputUReal};(i.prototype=new o({})).constructor=i,i.prototype.isType=function(t){return!!t.match(/^ureal([0-9]*)?(\\[([0-9]*)\\])*$/)},e.exports=i},{\"./formatters\":9,\"./type\":14}],17:[function(t,e,n){\"use strict\";\"undefined\"==typeof XMLHttpRequest?n.XMLHttpRequest={}:n.XMLHttpRequest=XMLHttpRequest},{}],18:[function(t,e,n){var r=t(\"bignumber.js\");e.exports={ETH_PADDING:32,ETH_SIGNATURE_LENGTH:4,ETH_UNITS:[\"wei\",\"kwei\",\"Mwei\",\"Gwei\",\"szabo\",\"finney\",\"femtoether\",\"picoether\",\"nanoether\",\"microether\",\"milliether\",\"nano\",\"micro\",\"milli\",\"ether\",\"grand\",\"Mether\",\"Gether\",\"Tether\",\"Pether\",\"Eether\",\"Zether\",\"Yether\",\"Nether\",\"Dether\",\"Vether\",\"Uether\"],ETH_BIGNUMBER_ROUNDING_MODE:{ROUNDING_MODE:r.ROUND_DOWN},ETH_POLLING_TIMEOUT:500,defaultBlock:\"latest\",defaultAccount:void 0}},{\"bignumber.js\":\"bignumber.js\"}],19:[function(t,e,n){var r=t(\"crypto-js\"),o=t(\"crypto-js/sha3\");e.exports=function(t,e){return e&&\"hex\"===e.encoding&&(t.length>2&&\"0x\"===t.substr(0,2)&&(t=t.substr(2)),t=r.enc.Hex.parse(t)),o(t,{outputLength:256}).toString()}},{\"crypto-js\":59,\"crypto-js/sha3\":80}],20:[function(t,e,n){var r=t(\"bignumber.js\"),o=t(\"./sha3.js\"),i=t(\"utf8\"),a={noether:\"0\",wei:\"1\",kwei:\"1000\",Kwei:\"1000\",babbage:\"1000\",femtoether:\"1000\",mwei:\"1000000\",Mwei:\"1000000\",lovelace:\"1000000\",picoether:\"1000000\",gwei:\"1000000000\",Gwei:\"1000000000\",shannon:\"1000000000\",nanoether:\"1000000000\",nano:\"1000000000\",szabo:\"1000000000000\",microether:\"1000000000000\",micro:\"1000000000000\",finney:\"1000000000000000\",milliether:\"1000000000000000\",milli:\"1000000000000000\",ether:\"1000000000000000000\",kether:\"1000000000000000000000\",grand:\"1000000000000000000000\",mether:\"1000000000000000000000000\",gether:\"1000000000000000000000000000\",tether:\"1000000000000000000000000000000\"},s=function(t,e,n){return new Array(e-t.length+1).join(n||\"0\")+t},c=function(t){t=i.encode(t);for(var e=\"\",n=0;n<t.length;n++){var r=t.charCodeAt(n);if(0===r)break;var o=r.toString(16);e+=o.length<2?\"0\"+o:o}return\"0x\"+e},u=function(t){for(var e=\"\",n=0;n<t.length;n++){var r=t.charCodeAt(n).toString(16);e+=r.length<2?\"0\"+r:r}return\"0x\"+e},f=function(t){var e=h(t),n=e.toString(16);return e.lessThan(0)?\"-0x\"+n.substr(1):\"0x\"+n},l=function(t){if(v(t))return f(+t);if(y(t))return f(t);if(\"object\"==typeof t)return c(JSON.stringify(t));if(g(t)){if(0===t.indexOf(\"-0x\"))return f(t);if(0===t.indexOf(\"0x\"))return t;if(!isFinite(t))return u(t)}return f(t)},p=function(t){t=t?t.toLowerCase():\"ether\";var e=a[t];if(void 0===e)throw new Error(\"This unit doesn't exists, please use the one of the following units\"+JSON.stringify(a,null,2));return new r(e,10)},h=function(t){return t=t||0,y(t)?t:!g(t)||0!==t.indexOf(\"0x\")&&0!==t.indexOf(\"-0x\")?new r(t.toString(10),10):new r(t.replace(\"0x\",\"\"),16)},d=function(t){return/^0x[0-9a-f]{40}$/i.test(t)},m=function(t){t=t.replace(\"0x\",\"\");for(var e=o(t.toLowerCase()),n=0;n<40;n++)if(parseInt(e[n],16)>7&&t[n].toUpperCase()!==t[n]||parseInt(e[n],16)<=7&&t[n].toLowerCase()!==t[n])return!1;return!0},y=function(t){return t instanceof r||t&&t.constructor&&\"BigNumber\"===t.constructor.name},g=function(t){return\"string\"==typeof t||t&&t.constructor&&\"String\"===t.constructor.name},v=function(t){return\"boolean\"==typeof t};e.exports={padLeft:s,padRight:function(t,e,n){return t+new Array(e-t.length+1).join(n||\"0\")},toHex:l,toDecimal:function(t){return h(t).toNumber()},fromDecimal:f,toUtf8:function(t){var e=\"\",n=0,r=t.length;for(\"0x\"===t.substring(0,2)&&(n=2);n<r;n+=2){var o=parseInt(t.substr(n,2),16);if(0===o)break;e+=String.fromCharCode(o)}return i.decode(e)},toAscii:function(t){var e=\"\",n=0,r=t.length;for(\"0x\"===t.substring(0,2)&&(n=2);n<r;n+=2){var o=parseInt(t.substr(n,2),16);e+=String.fromCharCode(o)}return e},fromUtf8:c,fromAscii:u,transformToFullName:function(t){if(-1!==t.name.indexOf(\"(\"))return t.name;var e=t.inputs.map(function(t){return t.type}).join();return t.name+\"(\"+e+\")\"},extractDisplayName:function(t){var e=t.indexOf(\"(\");return-1!==e?t.substr(0,e):t},extractTypeName:function(t){var e=t.indexOf(\"(\");return-1!==e?t.substr(e+1,t.length-1-(e+1)).replace(\" \",\"\"):\"\"},toWei:function(t,e){var n=h(t).times(p(e));return y(t)?n:n.toString(10)},fromWei:function(t,e){var n=h(t).dividedBy(p(e));return y(t)?n:n.toString(10)},toBigNumber:h,toTwosComplement:function(t){var e=h(t).round();return e.lessThan(0)?new r(\"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff\",16).plus(e).plus(1):e},toAddress:function(t){return d(t)?t:/^[0-9a-f]{40}$/.test(t)?\"0x\"+t:\"0x\"+s(l(t).substr(2),40)},isBigNumber:y,isStrictAddress:d,isAddress:function(t){return!!/^(0x)?[0-9a-f]{40}$/i.test(t)&&(!(!/^(0x)?[0-9a-f]{40}$/.test(t)&&!/^(0x)?[0-9A-F]{40}$/.test(t))||m(t))},isChecksumAddress:m,toChecksumAddress:function(t){if(void 0===t)return\"\";t=t.toLowerCase().replace(\"0x\",\"\");for(var e=o(t),n=\"0x\",r=0;r<t.length;r++)parseInt(e[r],16)>7?n+=t[r].toUpperCase():n+=t[r];return n},isFunction:function(t){return\"function\"==typeof t},isString:g,isObject:function(t){return null!==t&&!Array.isArray(t)&&\"object\"==typeof t},isBoolean:v,isArray:function(t){return Array.isArray(t)},isJson:function(t){try{return!!JSON.parse(t)}catch(t){return!1}},isBloom:function(t){return!(!/^(0x)?[0-9a-f]{512}$/i.test(t)||!/^(0x)?[0-9a-f]{512}$/.test(t)&&!/^(0x)?[0-9A-F]{512}$/.test(t))},isTopic:function(t){return!(!/^(0x)?[0-9a-f]{64}$/i.test(t)||!/^(0x)?[0-9a-f]{64}$/.test(t)&&!/^(0x)?[0-9A-F]{64}$/.test(t))}}},{\"./sha3.js\":19,\"bignumber.js\":\"bignumber.js\",utf8:85}],21:[function(t,e,n){e.exports={version:\"0.20.3\"}},{}],22:[function(t,e,n){function r(t){this._requestManager=new o(t),this.currentProvider=t,this.eth=new a(this),this.db=new s(this),this.shh=new c(this),this.net=new u(this),this.personal=new f(this),this.bzz=new l(this),this.settings=new p,this.version={api:h.version},this.providers={HttpProvider:b,IpcProvider:_},this._extend=y(this),this._extend({properties:x()})}var o=t(\"./web3/requestmanager\"),i=t(\"./web3/iban\"),a=t(\"./web3/methods/eth\"),s=t(\"./web3/methods/db\"),c=t(\"./web3/methods/shh\"),u=t(\"./web3/methods/net\"),f=t(\"./web3/methods/personal\"),l=t(\"./web3/methods/swarm\"),p=t(\"./web3/settings\"),h=t(\"./version.json\"),d=t(\"./utils/utils\"),m=t(\"./utils/sha3\"),y=t(\"./web3/extend\"),g=t(\"./web3/batch\"),v=t(\"./web3/property\"),b=t(\"./web3/httpprovider\"),_=t(\"./web3/ipcprovider\"),w=t(\"bignumber.js\");r.providers={HttpProvider:b,IpcProvider:_},r.prototype.setProvider=function(t){this._requestManager.setProvider(t),this.currentProvider=t},r.prototype.reset=function(t){this._requestManager.reset(t),this.settings=new p},r.prototype.BigNumber=w,r.prototype.toHex=d.toHex,r.prototype.toAscii=d.toAscii,r.prototype.toUtf8=d.toUtf8,r.prototype.fromAscii=d.fromAscii,r.prototype.fromUtf8=d.fromUtf8,r.prototype.toDecimal=d.toDecimal,r.prototype.fromDecimal=d.fromDecimal,r.prototype.toBigNumber=d.toBigNumber,r.prototype.toWei=d.toWei,r.prototype.fromWei=d.fromWei,r.prototype.isAddress=d.isAddress,r.prototype.isChecksumAddress=d.isChecksumAddress,r.prototype.toChecksumAddress=d.toChecksumAddress,r.prototype.isIBAN=d.isIBAN,r.prototype.padLeft=d.padLeft,r.prototype.padRight=d.padRight,r.prototype.sha3=function(t,e){return\"0x\"+m(t,e)},r.prototype.fromICAP=function(t){return new i(t).address()};var x=function(){return[new v({name:\"version.node\",getter:\"web3_clientVersion\"}),new v({name:\"version.network\",getter:\"net_version\",inputFormatter:d.toDecimal}),new v({name:\"version.ethereum\",getter:\"eth_protocolVersion\",inputFormatter:d.toDecimal}),new v({name:\"version.whisper\",getter:\"shh_version\",inputFormatter:d.toDecimal})]};r.prototype.isConnected=function(){return this.currentProvider&&this.currentProvider.isConnected()},r.prototype.createBatch=function(){return new g(this)},e.exports=r},{\"./utils/sha3\":19,\"./utils/utils\":20,\"./version.json\":21,\"./web3/batch\":24,\"./web3/extend\":28,\"./web3/httpprovider\":32,\"./web3/iban\":33,\"./web3/ipcprovider\":34,\"./web3/methods/db\":37,\"./web3/methods/eth\":38,\"./web3/methods/net\":39,\"./web3/methods/personal\":40,\"./web3/methods/shh\":41,\"./web3/methods/swarm\":42,\"./web3/property\":45,\"./web3/requestmanager\":46,\"./web3/settings\":47,\"bignumber.js\":\"bignumber.js\"}],23:[function(t,e,n){var r=t(\"../utils/sha3\"),o=t(\"./event\"),i=t(\"./formatters\"),a=t(\"../utils/utils\"),s=t(\"./filter\"),c=t(\"./methods/watches\"),u=function(t,e,n){this._requestManager=t,this._json=e,this._address=n};u.prototype.encode=function(t){t=t||{};var e={};return[\"fromBlock\",\"toBlock\"].filter(function(e){return void 0!==t[e]}).forEach(function(n){e[n]=i.inputBlockNumberFormatter(t[n])}),e.address=this._address,e},u.prototype.decode=function(t){t.data=t.data||\"\",t.topics=t.topics||[];var e=t.topics[0].slice(2),n=this._json.filter(function(t){return e===r(a.transformToFullName(t))})[0];if(!n)return console.warn(\"cannot find event for log\"),t;return new o(this._requestManager,n,this._address).decode(t)},u.prototype.execute=function(t,e){a.isFunction(arguments[arguments.length-1])&&(e=arguments[arguments.length-1],1===arguments.length&&(t=null));var n=this.encode(t),r=this.decode.bind(this);return new s(n,\"eth\",this._requestManager,c.eth(),r,e)},u.prototype.attachToContract=function(t){var e=this.execute.bind(this);t.allEvents=e},e.exports=u},{\"../utils/sha3\":19,\"../utils/utils\":20,\"./event\":27,\"./filter\":29,\"./formatters\":30,\"./methods/watches\":43}],24:[function(t,e,n){var r=t(\"./jsonrpc\"),o=t(\"./errors\"),i=function(t){this.requestManager=t._requestManager,this.requests=[]};i.prototype.add=function(t){this.requests.push(t)},i.prototype.execute=function(){var t=this.requests;this.requestManager.sendBatch(t,function(e,n){n=n||[],t.map(function(t,e){return n[e]||{}}).forEach(function(e,n){if(t[n].callback){if(!r.isValidResponse(e))return t[n].callback(o.InvalidResponse(e));t[n].callback(null,t[n].format?t[n].format(e.result):e.result)}})})},e.exports=i},{\"./errors\":26,\"./jsonrpc\":35}],25:[function(t,e,n){var r=t(\"../utils/utils\"),o=t(\"../solidity/coder\"),i=t(\"./event\"),a=t(\"./function\"),s=t(\"./allevents\"),c=function(t,e){return t.filter(function(t){return\"constructor\"===t.type&&t.inputs.length===e.length}).map(function(t){return t.inputs.map(function(t){return t.type})}).map(function(t){return o.encodeParams(t,e)})[0]||\"\"},u=function(t){t.abi.filter(function(t){return\"function\"===t.type}).map(function(e){return new a(t._eth,e,t.address)}).forEach(function(e){e.attachToContract(t)})},f=function(t){var e=t.abi.filter(function(t){return\"event\"===t.type});new s(t._eth._requestManager,e,t.address).attachToContract(t),e.map(function(e){return new i(t._eth._requestManager,e,t.address)}).forEach(function(e){e.attachToContract(t)})},l=function(t,e){var n=0,r=!1,o=t._eth.filter(\"latest\",function(i){if(!i&&!r)if(++n>50){if(o.stopWatching(function(){}),r=!0,!e)throw new Error(\"Contract transaction couldn't be found after 50 blocks\");e(new Error(\"Contract transaction couldn't be found after 50 blocks\"))}else t._eth.getTransactionReceipt(t.transactionHash,function(n,i){i&&!r&&t._eth.getCode(i.contractAddress,function(n,a){if(!r&&a)if(o.stopWatching(function(){}),r=!0,a.length>3)t.address=i.contractAddress,u(t),f(t),e&&e(null,t);else{if(!e)throw new Error(\"The contract code couldn't be stored, please check your gas amount.\");e(new Error(\"The contract code couldn't be stored, please check your gas amount.\"))}})})})},p=function(t,e){this.eth=t,this.abi=e,this.new=function(){var t,n=new h(this.eth,this.abi),o={},i=Array.prototype.slice.call(arguments);r.isFunction(i[i.length-1])&&(t=i.pop());var a=i[i.length-1];if(r.isObject(a)&&!r.isArray(a)&&(o=i.pop()),o.value>0){if(!(e.filter(function(t){return\"constructor\"===t.type&&t.inputs.length===i.length})[0]||{}).payable)throw new Error(\"Cannot send value to non-payable constructor\")}var s=c(this.abi,i);if(o.data+=s,t)this.eth.sendTransaction(o,function(e,r){e?t(e):(n.transactionHash=r,t(null,n),l(n,t))});else{var u=this.eth.sendTransaction(o);n.transactionHash=u,l(n)}return n},this.new.getData=this.getData.bind(this)};p.prototype.at=function(t,e){var n=new h(this.eth,this.abi,t);return u(n),f(n),e&&e(null,n),n},p.prototype.getData=function(){var t={},e=Array.prototype.slice.call(arguments),n=e[e.length-1];r.isObject(n)&&!r.isArray(n)&&(t=e.pop());var o=c(this.abi,e);return t.data+=o,t.data};var h=function(t,e,n){this._eth=t,this.transactionHash=null,this.address=n,this.abi=e};e.exports=p},{\"../solidity/coder\":7,\"../utils/utils\":20,\"./allevents\":23,\"./event\":27,\"./function\":31}],26:[function(t,e,n){e.exports={InvalidNumberOfSolidityArgs:function(){return new Error(\"Invalid number of arguments to Solidity function\")},InvalidNumberOfRPCParams:function(){return new Error(\"Invalid number of input parameters to RPC method\")},InvalidConnection:function(t){return new Error(\"CONNECTION ERROR: Couldn't connect to node \"+t+\".\")},InvalidProvider:function(){return new Error(\"Provider not set or invalid\")},InvalidResponse:function(t){var e=t&&t.error&&t.error.message?t.error.message:\"Invalid JSON RPC response: \"+JSON.stringify(t);return new Error(e)},ConnectionTimeout:function(t){return new Error(\"CONNECTION TIMEOUT: timeout of \"+t+\" ms achived\")}}},{}],27:[function(t,e,n){var r=t(\"../utils/utils\"),o=t(\"../solidity/coder\"),i=t(\"./formatters\"),a=t(\"../utils/sha3\"),s=t(\"./filter\"),c=t(\"./methods/watches\"),u=function(t,e,n){this._requestManager=t,this._params=e.inputs,this._name=r.transformToFullName(e),this._address=n,this._anonymous=e.anonymous};u.prototype.types=function(t){return this._params.filter(function(e){return e.indexed===t}).map(function(t){return t.type})},u.prototype.displayName=function(){return r.extractDisplayName(this._name)},u.prototype.typeName=function(){return r.extractTypeName(this._name)},u.prototype.signature=function(){return a(this._name)},u.prototype.encode=function(t,e){t=t||{},e=e||{};var n={};[\"fromBlock\",\"toBlock\"].filter(function(t){return void 0!==e[t]}).forEach(function(t){n[t]=i.inputBlockNumberFormatter(e[t])}),n.topics=[],n.address=this._address,this._anonymous||n.topics.push(\"0x\"+this.signature());var a=this._params.filter(function(t){return!0===t.indexed}).map(function(e){var n=t[e.name];return void 0===n||null===n?null:r.isArray(n)?n.map(function(t){return\"0x\"+o.encodeParam(e.type,t)}):\"0x\"+o.encodeParam(e.type,n)});return n.topics=n.topics.concat(a),n},u.prototype.decode=function(t){t.data=t.data||\"\",t.topics=t.topics||[];var e=(this._anonymous?t.topics:t.topics.slice(1)).map(function(t){return t.slice(2)}).join(\"\"),n=o.decodeParams(this.types(!0),e),r=t.data.slice(2),a=o.decodeParams(this.types(!1),r),s=i.outputLogFormatter(t);return s.event=this.displayName(),s.address=t.address,s.args=this._params.reduce(function(t,e){return t[e.name]=e.indexed?n.shift():a.shift(),t},{}),delete s.data,delete s.topics,s},u.prototype.execute=function(t,e,n){r.isFunction(arguments[arguments.length-1])&&(n=arguments[arguments.length-1],2===arguments.length&&(e=null),1===arguments.length&&(e=null,t={}));var o=this.encode(t,e),i=this.decode.bind(this);return new s(o,\"eth\",this._requestManager,c.eth(),i,n)},u.prototype.attachToContract=function(t){var e=this.execute.bind(this),n=this.displayName();t[n]||(t[n]=e),t[n][this.typeName()]=this.execute.bind(this,t)},e.exports=u},{\"../solidity/coder\":7,\"../utils/sha3\":19,\"../utils/utils\":20,\"./filter\":29,\"./formatters\":30,\"./methods/watches\":43}],28:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"./../utils/utils\"),i=t(\"./method\"),a=t(\"./property\");e.exports=function(t){var e=function(e){var n;e.property?(t[e.property]||(t[e.property]={}),n=t[e.property]):n=t,e.methods&&e.methods.forEach(function(e){e.attachToObject(n),e.setRequestManager(t._requestManager)}),e.properties&&e.properties.forEach(function(e){e.attachToObject(n),e.setRequestManager(t._requestManager)})};return e.formatters=r,e.utils=o,e.Method=i,e.Property=a,e}},{\"./../utils/utils\":20,\"./formatters\":30,\"./method\":36,\"./property\":45}],29:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"../utils/utils\"),i=function(t){return null===t||void 0===t?null:0===(t=String(t)).indexOf(\"0x\")?t:o.fromUtf8(t)},a=function(t,e){o.isString(t.options)||t.get(function(t,n){t&&e(t),o.isArray(n)&&n.forEach(function(t){e(null,t)})})},s=function(t){t.requestManager.startPolling({method:t.implementation.poll.call,params:[t.filterId]},t.filterId,function(e,n){if(e)return t.callbacks.forEach(function(t){t(e)});o.isArray(n)&&n.forEach(function(e){e=t.formatter?t.formatter(e):e,t.callbacks.forEach(function(t){t(null,e)})})},t.stopWatching.bind(t))},c=function(t,e,n,c,u,f,l){var p=this,h={};return c.forEach(function(t){t.setRequestManager(n),t.attachToObject(h)}),this.requestManager=n,this.options=function(t,e){if(o.isString(t))return t;switch(t=t||{},e){case\"eth\":return t.topics=t.topics||[],t.topics=t.topics.map(function(t){return o.isArray(t)?t.map(i):i(t)}),{topics:t.topics,from:t.from,to:t.to,address:t.address,fromBlock:r.inputBlockNumberFormatter(t.fromBlock),toBlock:r.inputBlockNumberFormatter(t.toBlock)};case\"shh\":return t}}(t,e),this.implementation=h,this.filterId=null,this.callbacks=[],this.getLogsCallbacks=[],this.pollFilters=[],this.formatter=u,this.implementation.newFilter(this.options,function(t,e){if(t)p.callbacks.forEach(function(e){e(t)}),\"function\"==typeof l&&l(t);else if(p.filterId=e,p.getLogsCallbacks.forEach(function(t){p.get(t)}),p.getLogsCallbacks=[],p.callbacks.forEach(function(t){a(p,t)}),p.callbacks.length>0&&s(p),\"function\"==typeof f)return p.watch(f)}),this};c.prototype.watch=function(t){return this.callbacks.push(t),this.filterId&&(a(this,t),s(this)),this},c.prototype.stopWatching=function(t){if(this.requestManager.stopPolling(this.filterId),this.callbacks=[],!t)return this.implementation.uninstallFilter(this.filterId);this.implementation.uninstallFilter(this.filterId,t)},c.prototype.get=function(t){var e=this;if(!o.isFunction(t)){if(null===this.filterId)throw new Error(\"Filter ID Error: filter().get() can't be chained synchronous, please provide a callback for the get() method.\");return this.implementation.getLogs(this.filterId).map(function(t){return e.formatter?e.formatter(t):t})}return null===this.filterId?this.getLogsCallbacks.push(t):this.implementation.getLogs(this.filterId,function(n,r){n?t(n):t(null,r.map(function(t){return e.formatter?e.formatter(t):t}))}),this},e.exports=c},{\"../utils/utils\":20,\"./formatters\":30}],30:[function(t,e,n){\"use strict\";var r=t(\"../utils/utils\"),o=t(\"../utils/config\"),i=t(\"./iban\"),a=function(t){if(void 0!==t)return function(t){return\"latest\"===t||\"pending\"===t||\"earliest\"===t}(t)?t:r.toHex(t)},s=function(t){return null!==t.blockNumber&&(t.blockNumber=r.toDecimal(t.blockNumber)),null!==t.transactionIndex&&(t.transactionIndex=r.toDecimal(t.transactionIndex)),t.nonce=r.toDecimal(t.nonce),t.gas=r.toDecimal(t.gas),t.gasPrice=r.toBigNumber(t.gasPrice),t.value=r.toBigNumber(t.value),t},c=function(t){return t.blockNumber&&(t.blockNumber=r.toDecimal(t.blockNumber)),t.transactionIndex&&(t.transactionIndex=r.toDecimal(t.transactionIndex)),t.logIndex&&(t.logIndex=r.toDecimal(t.logIndex)),t},u=function(t){var e=new i(t);if(e.isValid()&&e.isDirect())return\"0x\"+e.address();if(r.isStrictAddress(t))return t;if(r.isAddress(t))return\"0x\"+t;throw new Error(\"invalid address\")};e.exports={inputDefaultBlockNumberFormatter:function(t){return void 0===t?o.defaultBlock:a(t)},inputBlockNumberFormatter:a,inputCallFormatter:function(t){return t.from=t.from||o.defaultAccount,t.from&&(t.from=u(t.from)),t.to&&(t.to=u(t.to)),[\"gasPrice\",\"gas\",\"value\",\"nonce\"].filter(function(e){return void 0!==t[e]}).forEach(function(e){t[e]=r.fromDecimal(t[e])}),t},inputTransactionFormatter:function(t){return t.from=t.from||o.defaultAccount,t.from=u(t.from),t.to&&(t.to=u(t.to)),[\"gasPrice\",\"gas\",\"value\",\"nonce\"].filter(function(e){return void 0!==t[e]}).forEach(function(e){t[e]=r.fromDecimal(t[e])}),t},inputAddressFormatter:u,inputPostFormatter:function(t){return t.ttl=r.fromDecimal(t.ttl),t.workToProve=r.fromDecimal(t.workToProve),t.priority=r.fromDecimal(t.priority),r.isArray(t.topics)||(t.topics=t.topics?[t.topics]:[]),t.topics=t.topics.map(function(t){return 0===t.indexOf(\"0x\")?t:r.fromUtf8(t)}),t},outputBigNumberFormatter:function(t){return r.toBigNumber(t)},outputTransactionFormatter:s,outputTransactionReceiptFormatter:function(t){return null!==t.blockNumber&&(t.blockNumber=r.toDecimal(t.blockNumber)),null!==t.transactionIndex&&(t.transactionIndex=r.toDecimal(t.transactionIndex)),t.cumulativeGasUsed=r.toDecimal(t.cumulativeGasUsed),t.gasUsed=r.toDecimal(t.gasUsed),r.isArray(t.logs)&&(t.logs=t.logs.map(function(t){return c(t)})),t},outputBlockFormatter:function(t){return t.gasLimit=r.toDecimal(t.gasLimit),t.gasUsed=r.toDecimal(t.gasUsed),t.size=r.toDecimal(t.size),t.timestamp=r.toDecimal(t.timestamp),null!==t.number&&(t.number=r.toDecimal(t.number)),t.difficulty=r.toBigNumber(t.difficulty),t.totalDifficulty=r.toBigNumber(t.totalDifficulty),r.isArray(t.transactions)&&t.transactions.forEach(function(t){if(!r.isString(t))return s(t)}),t},outputLogFormatter:c,outputPostFormatter:function(t){return t.expiry=r.toDecimal(t.expiry),t.sent=r.toDecimal(t.sent),t.ttl=r.toDecimal(t.ttl),t.workProved=r.toDecimal(t.workProved),t.topics||(t.topics=[]),t.topics=t.topics.map(function(t){return r.toAscii(t)}),t},outputSyncingFormatter:function(t){return t?(t.startingBlock=r.toDecimal(t.startingBlock),t.currentBlock=r.toDecimal(t.currentBlock),t.highestBlock=r.toDecimal(t.highestBlock),t.knownStates&&(t.knownStates=r.toDecimal(t.knownStates),t.pulledStates=r.toDecimal(t.pulledStates)),t):t}}},{\"../utils/config\":18,\"../utils/utils\":20,\"./iban\":33}],31:[function(t,e,n){var r=t(\"../solidity/coder\"),o=t(\"../utils/utils\"),i=t(\"./errors\"),a=t(\"./formatters\"),s=t(\"../utils/sha3\"),c=function(t,e,n){this._eth=t,this._inputTypes=e.inputs.map(function(t){return t.type}),this._outputTypes=e.outputs.map(function(t){return t.type}),this._constant=e.constant,this._payable=e.payable,this._name=o.transformToFullName(e),this._address=n};c.prototype.extractCallback=function(t){if(o.isFunction(t[t.length-1]))return t.pop()},c.prototype.extractDefaultBlock=function(t){if(t.length>this._inputTypes.length&&!o.isObject(t[t.length-1]))return a.inputDefaultBlockNumberFormatter(t.pop())},c.prototype.validateArgs=function(t){if(t.filter(function(t){return!(!0===o.isObject(t)&&!1===o.isArray(t)&&!1===o.isBigNumber(t))}).length!==this._inputTypes.length)throw i.InvalidNumberOfSolidityArgs()},c.prototype.toPayload=function(t){var e={};return t.length>this._inputTypes.length&&o.isObject(t[t.length-1])&&(e=t[t.length-1]),this.validateArgs(t),e.to=this._address,e.data=\"0x\"+this.signature()+r.encodeParams(this._inputTypes,t),e},c.prototype.signature=function(){return s(this._name).slice(0,8)},c.prototype.unpackOutput=function(t){if(t){t=t.length>=2?t.slice(2):t;var e=r.decodeParams(this._outputTypes,t);return 1===e.length?e[0]:e}},c.prototype.call=function(){var t=Array.prototype.slice.call(arguments).filter(function(t){return void 0!==t}),e=this.extractCallback(t),n=this.extractDefaultBlock(t),r=this.toPayload(t);if(!e){var o=this._eth.call(r,n);return this.unpackOutput(o)}var i=this;this._eth.call(r,n,function(t,n){if(t)return e(t,null);var r=null;try{r=i.unpackOutput(n)}catch(e){t=e}e(t,r)})},c.prototype.sendTransaction=function(){var t=Array.prototype.slice.call(arguments).filter(function(t){return void 0!==t}),e=this.extractCallback(t),n=this.toPayload(t);if(n.value>0&&!this._payable)throw new Error(\"Cannot send value to non-payable function\");if(!e)return this._eth.sendTransaction(n);this._eth.sendTransaction(n,e)},c.prototype.estimateGas=function(){var t=Array.prototype.slice.call(arguments),e=this.extractCallback(t),n=this.toPayload(t);if(!e)return this._eth.estimateGas(n);this._eth.estimateGas(n,e)},c.prototype.getData=function(){var t=Array.prototype.slice.call(arguments);return this.toPayload(t).data},c.prototype.displayName=function(){return o.extractDisplayName(this._name)},c.prototype.typeName=function(){return o.extractTypeName(this._name)},c.prototype.request=function(){var t=Array.prototype.slice.call(arguments),e=this.extractCallback(t),n=this.toPayload(t),r=this.unpackOutput.bind(this);return{method:this._constant?\"eth_call\":\"eth_sendTransaction\",callback:e,params:[n],format:r}},c.prototype.execute=function(){return!this._constant?this.sendTransaction.apply(this,Array.prototype.slice.call(arguments)):this.call.apply(this,Array.prototype.slice.call(arguments))},c.prototype.attachToContract=function(t){var e=this.execute.bind(this);e.request=this.request.bind(this),e.call=this.call.bind(this),e.sendTransaction=this.sendTransaction.bind(this),e.estimateGas=this.estimateGas.bind(this),e.getData=this.getData.bind(this);var n=this.displayName();t[n]||(t[n]=e),t[n][this.typeName()]=e},e.exports=c},{\"../solidity/coder\":7,\"../utils/sha3\":19,\"../utils/utils\":20,\"./errors\":26,\"./formatters\":30}],32:[function(t,e,n){var r=t(\"./errors\");\"undefined\"!=typeof window&&window.XMLHttpRequest?XMLHttpRequest=window.XMLHttpRequest:XMLHttpRequest=t(\"xmlhttprequest\").XMLHttpRequest;var o=t(\"xhr2\"),i=function(t,e,n,r,o){this.host=t||\"http://localhost:8545\",this.timeout=e||0,this.user=n,this.password=r,this.headers=o};i.prototype.prepareRequest=function(t){var e;if(t?(e=new o).timeout=this.timeout:e=new XMLHttpRequest,e.open(\"POST\",this.host,t),this.user&&this.password){var n=\"Basic \"+new Buffer(this.user+\":\"+this.password).toString(\"base64\");e.setRequestHeader(\"Authorization\",n)}return e.setRequestHeader(\"Content-Type\",\"application/json\"),this.headers&&this.headers.forEach(function(t){e.setRequestHeader(t.name,t.value)}),e},i.prototype.send=function(t){var e=this.prepareRequest(!1);try{e.send(JSON.stringify(t))}catch(t){throw r.InvalidConnection(this.host)}var n=e.responseText;try{n=JSON.parse(n)}catch(t){throw r.InvalidResponse(e.responseText)}return n},i.prototype.sendAsync=function(t,e){var n=this.prepareRequest(!0);n.onreadystatechange=function(){if(4===n.readyState&&1!==n.timeout){var t=n.responseText,o=null;try{t=JSON.parse(t)}catch(t){o=r.InvalidResponse(n.responseText)}e(o,t)}},n.ontimeout=function(){e(r.ConnectionTimeout(this.timeout))};try{n.send(JSON.stringify(t))}catch(t){e(r.InvalidConnection(this.host))}},i.prototype.isConnected=function(){try{return this.send({id:9999999999,jsonrpc:\"2.0\",method:\"net_listening\",params:[]}),!0}catch(t){return!1}},e.exports=i},{\"./errors\":26,xhr2:86,xmlhttprequest:17}],33:[function(t,e,n){var r=t(\"bignumber.js\"),o=function(t,e){for(var n=t;n.length<2*e;)n=\"0\"+n;return n},i=function(t){var e=\"A\".charCodeAt(0),n=\"Z\".charCodeAt(0);return t=t.toUpperCase(),(t=t.substr(4)+t.substr(0,4)).split(\"\").map(function(t){var r=t.charCodeAt(0);return r>=e&&r<=n?r-e+10:t}).join(\"\")},a=function(t){for(var e,n=t;n.length>2;)e=n.slice(0,9),n=parseInt(e,10)%97+n.slice(e.length);return parseInt(n,10)%97},s=function(t){this._iban=t};s.fromAddress=function(t){var e=new r(t,16).toString(36),n=o(e,15);return s.fromBban(n.toUpperCase())},s.fromBban=function(t){var e=(\"0\"+(98-a(i(\"XE00\"+t)))).slice(-2);return new s(\"XE\"+e+t)},s.createIndirect=function(t){return s.fromBban(\"ETH\"+t.institution+t.identifier)},s.isValid=function(t){return new s(t).isValid()},s.prototype.isValid=function(){return/^XE[0-9]{2}(ETH[0-9A-Z]{13}|[0-9A-Z]{30,31})$/.test(this._iban)&&1===a(i(this._iban))},s.prototype.isDirect=function(){return 34===this._iban.length||35===this._iban.length},s.prototype.isIndirect=function(){return 20===this._iban.length},s.prototype.checksum=function(){return this._iban.substr(2,2)},s.prototype.institution=function(){return this.isIndirect()?this._iban.substr(7,4):\"\"},s.prototype.client=function(){return this.isIndirect()?this._iban.substr(11):\"\"},s.prototype.address=function(){if(this.isDirect()){var t=this._iban.substr(4),e=new r(t,36);return o(e.toString(16),20)}return\"\"},s.prototype.toString=function(){return this._iban},e.exports=s},{\"bignumber.js\":\"bignumber.js\"}],34:[function(t,e,n){\"use strict\";var r=t(\"../utils/utils\"),o=t(\"./errors\"),i=function(t,e){var n=this;this.responseCallbacks={},this.path=t,this.connection=e.connect({path:this.path}),this.connection.on(\"error\",function(t){console.error(\"IPC Connection Error\",t),n._timeout()}),this.connection.on(\"end\",function(){n._timeout()}),this.connection.on(\"data\",function(t){n._parseResponse(t.toString()).forEach(function(t){var e=null;r.isArray(t)?t.forEach(function(t){n.responseCallbacks[t.id]&&(e=t.id)}):e=t.id,n.responseCallbacks[e]&&(n.responseCallbacks[e](null,t),delete n.responseCallbacks[e])})})};i.prototype._parseResponse=function(t){var e=this,n=[];return t.replace(/\\}[\\n\\r]?\\{/g,\"}|--|{\").replace(/\\}\\][\\n\\r]?\\[\\{/g,\"}]|--|[{\").replace(/\\}[\\n\\r]?\\[\\{/g,\"}|--|[{\").replace(/\\}\\][\\n\\r]?\\{/g,\"}]|--|{\").split(\"|--|\").forEach(function(t){e.lastChunk&&(t=e.lastChunk+t);var r=null;try{r=JSON.parse(t)}catch(n){return e.lastChunk=t,clearTimeout(e.lastChunkTimeout),void(e.lastChunkTimeout=setTimeout(function(){throw e._timeout(),o.InvalidResponse(t)},15e3))}clearTimeout(e.lastChunkTimeout),e.lastChunk=null,r&&n.push(r)}),n},i.prototype._addResponseCallback=function(t,e){var n=t.id||t[0].id,r=t.method||t[0].method;this.responseCallbacks[n]=e,this.responseCallbacks[n].method=r},i.prototype._timeout=function(){for(var t in this.responseCallbacks)this.responseCallbacks.hasOwnProperty(t)&&(this.responseCallbacks[t](o.InvalidConnection(\"on IPC\")),delete this.responseCallbacks[t])},i.prototype.isConnected=function(){return this.connection.writable||this.connection.connect({path:this.path}),!!this.connection.writable},i.prototype.send=function(t){if(this.connection.writeSync){var e;this.connection.writable||this.connection.connect({path:this.path});var n=this.connection.writeSync(JSON.stringify(t));try{e=JSON.parse(n)}catch(t){throw o.InvalidResponse(n)}return e}throw new Error('You tried to send \"'+t.method+'\" synchronously. Synchronous requests are not supported by the IPC provider.')},i.prototype.sendAsync=function(t,e){this.connection.writable||this.connection.connect({path:this.path}),this.connection.write(JSON.stringify(t)),this._addResponseCallback(t,e)},e.exports=i},{\"../utils/utils\":20,\"./errors\":26}],35:[function(t,e,n){var r={messageId:0};r.toPayload=function(t,e){return t||console.error(\"jsonrpc method should be specified!\"),r.messageId++,{jsonrpc:\"2.0\",id:r.messageId,method:t,params:e||[]}},r.isValidResponse=function(t){function e(t){return!!t&&!t.error&&\"2.0\"===t.jsonrpc&&\"number\"==typeof t.id&&void 0!==t.result}return Array.isArray(t)?t.every(e):e(t)},r.toBatchPayload=function(t){return t.map(function(t){return r.toPayload(t.method,t.params)})},e.exports=r},{}],36:[function(t,e,n){var r=t(\"../utils/utils\"),o=t(\"./errors\"),i=function(t){this.name=t.name,this.call=t.call,this.params=t.params||0,this.inputFormatter=t.inputFormatter,this.outputFormatter=t.outputFormatter,this.requestManager=null};i.prototype.setRequestManager=function(t){this.requestManager=t},i.prototype.getCall=function(t){return r.isFunction(this.call)?this.call(t):this.call},i.prototype.extractCallback=function(t){if(r.isFunction(t[t.length-1]))return t.pop()},i.prototype.validateArgs=function(t){if(t.length!==this.params)throw o.InvalidNumberOfRPCParams()},i.prototype.formatInput=function(t){return this.inputFormatter?this.inputFormatter.map(function(e,n){return e?e(t[n]):t[n]}):t},i.prototype.formatOutput=function(t){return this.outputFormatter&&t?this.outputFormatter(t):t},i.prototype.toPayload=function(t){var e=this.getCall(t),n=this.extractCallback(t),r=this.formatInput(t);return this.validateArgs(r),{method:e,params:r,callback:n}},i.prototype.attachToObject=function(t){var e=this.buildCall();e.call=this.call;var n=this.name.split(\".\");n.length>1?(t[n[0]]=t[n[0]]||{},t[n[0]][n[1]]=e):t[n[0]]=e},i.prototype.buildCall=function(){var t=this,e=function(){var e=t.toPayload(Array.prototype.slice.call(arguments));return e.callback?t.requestManager.sendAsync(e,function(n,r){e.callback(n,t.formatOutput(r))}):t.formatOutput(t.requestManager.send(e))};return e.request=this.request.bind(this),e},i.prototype.request=function(){var t=this.toPayload(Array.prototype.slice.call(arguments));return t.format=this.formatOutput.bind(this),t},e.exports=i},{\"../utils/utils\":20,\"./errors\":26}],37:[function(t,e,n){var r=t(\"../method\"),o=function(){return[new r({name:\"putString\",call:\"db_putString\",params:3}),new r({name:\"getString\",call:\"db_getString\",params:2}),new r({name:\"putHex\",call:\"db_putHex\",params:3}),new r({name:\"getHex\",call:\"db_getHex\",params:2})]};e.exports=function(t){this._requestManager=t._requestManager;var e=this;o().forEach(function(n){n.attachToObject(e),n.setRequestManager(t._requestManager)})}},{\"../method\":36}],38:[function(t,e,n){\"use strict\";function r(t){this._requestManager=t._requestManager;var e=this;w().forEach(function(t){t.attachToObject(e),t.setRequestManager(e._requestManager)}),x().forEach(function(t){t.attachToObject(e),t.setRequestManager(e._requestManager)}),this.iban=d,this.sendIBANTransaction=m.bind(null,this)}var o=t(\"../formatters\"),i=t(\"../../utils/utils\"),a=t(\"../method\"),s=t(\"../property\"),c=t(\"../../utils/config\"),u=t(\"../contract\"),f=t(\"./watches\"),l=t(\"../filter\"),p=t(\"../syncing\"),h=t(\"../namereg\"),d=t(\"../iban\"),m=t(\"../transfer\"),y=function(t){return i.isString(t[0])&&0===t[0].indexOf(\"0x\")?\"eth_getBlockByHash\":\"eth_getBlockByNumber\"},g=function(t){return i.isString(t[0])&&0===t[0].indexOf(\"0x\")?\"eth_getTransactionByBlockHashAndIndex\":\"eth_getTransactionByBlockNumberAndIndex\"},v=function(t){return i.isString(t[0])&&0===t[0].indexOf(\"0x\")?\"eth_getUncleByBlockHashAndIndex\":\"eth_getUncleByBlockNumberAndIndex\"},b=function(t){return i.isString(t[0])&&0===t[0].indexOf(\"0x\")?\"eth_getBlockTransactionCountByHash\":\"eth_getBlockTransactionCountByNumber\"},_=function(t){return i.isString(t[0])&&0===t[0].indexOf(\"0x\")?\"eth_getUncleCountByBlockHash\":\"eth_getUncleCountByBlockNumber\"};Object.defineProperty(r.prototype,\"defaultBlock\",{get:function(){return c.defaultBlock},set:function(t){return c.defaultBlock=t,t}}),Object.defineProperty(r.prototype,\"defaultAccount\",{get:function(){return c.defaultAccount},set:function(t){return c.defaultAccount=t,t}});var w=function(){var t=new a({name:\"getBalance\",call:\"eth_getBalance\",params:2,inputFormatter:[o.inputAddressFormatter,o.inputDefaultBlockNumberFormatter],outputFormatter:o.outputBigNumberFormatter}),e=new a({name:\"getStorageAt\",call:\"eth_getStorageAt\",params:3,inputFormatter:[null,i.toHex,o.inputDefaultBlockNumberFormatter]}),n=new a({name:\"getCode\",call:\"eth_getCode\",params:2,inputFormatter:[o.inputAddressFormatter,o.inputDefaultBlockNumberFormatter]}),r=new a({name:\"getBlock\",call:y,params:2,inputFormatter:[o.inputBlockNumberFormatter,function(t){return!!t}],outputFormatter:o.outputBlockFormatter}),s=new a({name:\"getUncle\",call:v,params:2,inputFormatter:[o.inputBlockNumberFormatter,i.toHex],outputFormatter:o.outputBlockFormatter}),c=new a({name:\"getCompilers\",call:\"eth_getCompilers\",params:0}),u=new a({name:\"getBlockTransactionCount\",call:b,params:1,inputFormatter:[o.inputBlockNumberFormatter],outputFormatter:i.toDecimal}),f=new a({name:\"getBlockUncleCount\",call:_,params:1,inputFormatter:[o.inputBlockNumberFormatter],outputFormatter:i.toDecimal}),l=new a({name:\"getTransaction\",call:\"eth_getTransactionByHash\",params:1,outputFormatter:o.outputTransactionFormatter}),p=new a({name:\"getTransactionFromBlock\",call:g,params:2,inputFormatter:[o.inputBlockNumberFormatter,i.toHex],outputFormatter:o.outputTransactionFormatter}),h=new a({name:\"getTransactionReceipt\",call:\"eth_getTransactionReceipt\",params:1,outputFormatter:o.outputTransactionReceiptFormatter}),d=new a({name:\"getTransactionCount\",call:\"eth_getTransactionCount\",params:2,inputFormatter:[null,o.inputDefaultBlockNumberFormatter],outputFormatter:i.toDecimal}),m=new a({name:\"sendRawTransaction\",call:\"eth_sendRawTransaction\",params:1,inputFormatter:[null]}),w=new a({name:\"sendTransaction\",call:\"eth_sendTransaction\",params:1,inputFormatter:[o.inputTransactionFormatter]}),x=new a({name:\"signTransaction\",call:\"eth_signTransaction\",params:1,inputFormatter:[o.inputTransactionFormatter]}),k=new a({name:\"sign\",call:\"eth_sign\",params:2,inputFormatter:[o.inputAddressFormatter,null]});return[t,e,n,r,s,c,u,f,l,p,h,d,new a({name:\"call\",call:\"eth_call\",params:2,inputFormatter:[o.inputCallFormatter,o.inputDefaultBlockNumberFormatter]}),new a({name:\"estimateGas\",call:\"eth_estimateGas\",params:1,inputFormatter:[o.inputCallFormatter],outputFormatter:i.toDecimal}),m,x,w,k,new a({name:\"compile.solidity\",call:\"eth_compileSolidity\",params:1}),new a({name:\"compile.lll\",call:\"eth_compileLLL\",params:1}),new a({name:\"compile.serpent\",call:\"eth_compileSerpent\",params:1}),new a({name:\"submitWork\",call:\"eth_submitWork\",params:3}),new a({name:\"getWork\",call:\"eth_getWork\",params:0})]},x=function(){return[new s({name:\"coinbase\",getter:\"eth_coinbase\"}),new s({name:\"mining\",getter:\"eth_mining\"}),new s({name:\"hashrate\",getter:\"eth_hashrate\",outputFormatter:i.toDecimal}),new s({name:\"syncing\",getter:\"eth_syncing\",outputFormatter:o.outputSyncingFormatter}),new s({name:\"gasPrice\",getter:\"eth_gasPrice\",outputFormatter:o.outputBigNumberFormatter}),new s({name:\"accounts\",getter:\"eth_accounts\"}),new s({name:\"blockNumber\",getter:\"eth_blockNumber\",outputFormatter:i.toDecimal}),new s({name:\"protocolVersion\",getter:\"eth_protocolVersion\"})]};r.prototype.contract=function(t){return new u(this,t)},r.prototype.filter=function(t,e,n){return new l(t,\"eth\",this._requestManager,f.eth(),o.outputLogFormatter,e,n)},r.prototype.namereg=function(){return this.contract(h.global.abi).at(h.global.address)},r.prototype.icapNamereg=function(){return this.contract(h.icap.abi).at(h.icap.address)},r.prototype.isSyncing=function(t){return new p(this._requestManager,t)},e.exports=r},{\"../../utils/config\":18,\"../../utils/utils\":20,\"../contract\":25,\"../filter\":29,\"../formatters\":30,\"../iban\":33,\"../method\":36,\"../namereg\":44,\"../property\":45,\"../syncing\":48,\"../transfer\":49,\"./watches\":43}],39:[function(t,e,n){var r=t(\"../../utils/utils\"),o=t(\"../property\"),i=function(){return[new o({name:\"listening\",getter:\"net_listening\"}),new o({name:\"peerCount\",getter:\"net_peerCount\",outputFormatter:r.toDecimal})]};e.exports=function(t){this._requestManager=t._requestManager;var e=this;i().forEach(function(n){n.attachToObject(e),n.setRequestManager(t._requestManager)})}},{\"../../utils/utils\":20,\"../property\":45}],40:[function(t,e,n){\"use strict\";var r=t(\"../method\"),o=t(\"../property\"),i=t(\"../formatters\"),a=function(){var t=new r({name:\"newAccount\",call:\"personal_newAccount\",params:1,inputFormatter:[null]}),e=new r({name:\"importRawKey\",call:\"personal_importRawKey\",params:2}),n=new r({name:\"sign\",call:\"personal_sign\",params:3,inputFormatter:[null,i.inputAddressFormatter,null]}),o=new r({name:\"ecRecover\",call:\"personal_ecRecover\",params:2});return[t,e,new r({name:\"unlockAccount\",call:\"personal_unlockAccount\",params:3,inputFormatter:[i.inputAddressFormatter,null,null]}),o,n,new r({name:\"sendTransaction\",call:\"personal_sendTransaction\",params:2,inputFormatter:[i.inputTransactionFormatter,null]}),new r({name:\"lockAccount\",call:\"personal_lockAccount\",params:1,inputFormatter:[i.inputAddressFormatter]})]},s=function(){return[new o({name:\"listAccounts\",getter:\"personal_listAccounts\"})]};e.exports=function(t){this._requestManager=t._requestManager;var e=this;a().forEach(function(t){t.attachToObject(e),t.setRequestManager(e._requestManager)}),s().forEach(function(t){t.attachToObject(e),t.setRequestManager(e._requestManager)})}},{\"../formatters\":30,\"../method\":36,\"../property\":45}],41:[function(t,e,n){var r=t(\"../method\"),o=t(\"../filter\"),i=t(\"./watches\"),a=function(t){this._requestManager=t._requestManager;var e=this;s().forEach(function(t){t.attachToObject(e),t.setRequestManager(e._requestManager)})};a.prototype.newMessageFilter=function(t,e,n){return new o(t,\"shh\",this._requestManager,i.shh(),null,e,n)};var s=function(){return[new r({name:\"version\",call:\"shh_version\",params:0}),new r({name:\"info\",call:\"shh_info\",params:0}),new r({name:\"setMaxMessageSize\",call:\"shh_setMaxMessageSize\",params:1}),new r({name:\"setMinPoW\",call:\"shh_setMinPoW\",params:1}),new r({name:\"markTrustedPeer\",call:\"shh_markTrustedPeer\",params:1}),new r({name:\"newKeyPair\",call:\"shh_newKeyPair\",params:0}),new r({name:\"addPrivateKey\",call:\"shh_addPrivateKey\",params:1}),new r({name:\"deleteKeyPair\",call:\"shh_deleteKeyPair\",params:1}),new r({name:\"hasKeyPair\",call:\"shh_hasKeyPair\",params:1}),new r({name:\"getPublicKey\",call:\"shh_getPublicKey\",params:1}),new r({name:\"getPrivateKey\",call:\"shh_getPrivateKey\",params:1}),new r({name:\"newSymKey\",call:\"shh_newSymKey\",params:0}),new r({name:\"addSymKey\",call:\"shh_addSymKey\",params:1}),new r({name:\"generateSymKeyFromPassword\",call:\"shh_generateSymKeyFromPassword\",params:1}),new r({name:\"hasSymKey\",call:\"shh_hasSymKey\",params:1}),new r({name:\"getSymKey\",call:\"shh_getSymKey\",params:1}),new r({name:\"deleteSymKey\",call:\"shh_deleteSymKey\",params:1}),new r({name:\"post\",call:\"shh_post\",params:1,inputFormatter:[null]})]};e.exports=a},{\"../filter\":29,\"../method\":36,\"./watches\":43}],42:[function(t,e,n){\"use strict\";var r=t(\"../method\"),o=t(\"../property\"),i=function(){return[new r({name:\"blockNetworkRead\",call:\"bzz_blockNetworkRead\",params:1,inputFormatter:[null]}),new r({name:\"syncEnabled\",call:\"bzz_syncEnabled\",params:1,inputFormatter:[null]}),new r({name:\"swapEnabled\",call:\"bzz_swapEnabled\",params:1,inputFormatter:[null]}),new r({name:\"download\",call:\"bzz_download\",params:2,inputFormatter:[null,null]}),new r({name:\"upload\",call:\"bzz_upload\",params:2,inputFormatter:[null,null]}),new r({name:\"retrieve\",call:\"bzz_retrieve\",params:1,inputFormatter:[null]}),new r({name:\"store\",call:\"bzz_store\",params:2,inputFormatter:[null,null]}),new r({name:\"get\",call:\"bzz_get\",params:1,inputFormatter:[null]}),new r({name:\"put\",call:\"bzz_put\",params:2,inputFormatter:[null,null]}),new r({name:\"modify\",call:\"bzz_modify\",params:4,inputFormatter:[null,null,null,null]})]},a=function(){return[new o({name:\"hive\",getter:\"bzz_hive\"}),new o({name:\"info\",getter:\"bzz_info\"})]};e.exports=function(t){this._requestManager=t._requestManager;var e=this;i().forEach(function(t){t.attachToObject(e),t.setRequestManager(e._requestManager)}),a().forEach(function(t){t.attachToObject(e),t.setRequestManager(e._requestManager)})}},{\"../method\":36,\"../property\":45}],43:[function(t,e,n){var r=t(\"../method\");e.exports={eth:function(){return[new r({name:\"newFilter\",call:function(t){switch(t[0]){case\"latest\":return t.shift(),this.params=0,\"eth_newBlockFilter\";case\"pending\":return t.shift(),this.params=0,\"eth_newPendingTransactionFilter\";default:return\"eth_newFilter\"}},params:1}),new r({name:\"uninstallFilter\",call:\"eth_uninstallFilter\",params:1}),new r({name:\"getLogs\",call:\"eth_getFilterLogs\",params:1}),new r({name:\"poll\",call:\"eth_getFilterChanges\",params:1})]},shh:function(){return[new r({name:\"newFilter\",call:\"shh_newMessageFilter\",params:1}),new r({name:\"uninstallFilter\",call:\"shh_deleteMessageFilter\",params:1}),new r({name:\"getLogs\",call:\"shh_getFilterMessages\",params:1}),new r({name:\"poll\",call:\"shh_getFilterMessages\",params:1})]}}},{\"../method\":36}],44:[function(t,e,n){var r=t(\"../contracts/GlobalRegistrar.json\"),o=t(\"../contracts/ICAPRegistrar.json\");e.exports={global:{abi:r,address:\"0xc6d9d2cd449a754c494264e1809c50e34d64562b\"},icap:{abi:o,address:\"0xa1a111bc074c9cfa781f0c38e63bd51c91b8af00\"}}},{\"../contracts/GlobalRegistrar.json\":1,\"../contracts/ICAPRegistrar.json\":2}],45:[function(t,e,n){var r=t(\"../utils/utils\"),o=function(t){this.name=t.name,this.getter=t.getter,this.setter=t.setter,this.outputFormatter=t.outputFormatter,this.inputFormatter=t.inputFormatter,this.requestManager=null};o.prototype.setRequestManager=function(t){this.requestManager=t},o.prototype.formatInput=function(t){return this.inputFormatter?this.inputFormatter(t):t},o.prototype.formatOutput=function(t){return this.outputFormatter&&null!==t&&void 0!==t?this.outputFormatter(t):t},o.prototype.extractCallback=function(t){if(r.isFunction(t[t.length-1]))return t.pop()},o.prototype.attachToObject=function(t){var e={get:this.buildGet(),enumerable:!0},n=this.name.split(\".\"),r=n[0];n.length>1&&(t[n[0]]=t[n[0]]||{},t=t[n[0]],r=n[1]),Object.defineProperty(t,r,e),t[i(r)]=this.buildAsyncGet()};var i=function(t){return\"get\"+t.charAt(0).toUpperCase()+t.slice(1)};o.prototype.buildGet=function(){var t=this;return function(){return t.formatOutput(t.requestManager.send({method:t.getter}))}},o.prototype.buildAsyncGet=function(){var t=this,e=function(e){t.requestManager.sendAsync({method:t.getter},function(n,r){e(n,t.formatOutput(r))})};return e.request=this.request.bind(this),e},o.prototype.request=function(){var t={method:this.getter,params:[],callback:this.extractCallback(Array.prototype.slice.call(arguments))};return t.format=this.formatOutput.bind(this),t},e.exports=o},{\"../utils/utils\":20}],46:[function(t,e,n){var r=t(\"./jsonrpc\"),o=t(\"../utils/utils\"),i=t(\"../utils/config\"),a=t(\"./errors\"),s=function(t){this.provider=t,this.polls={},this.timeout=null};s.prototype.send=function(t){if(!this.provider)return console.error(a.InvalidProvider()),null;var e=r.toPayload(t.method,t.params),n=this.provider.send(e);if(!r.isValidResponse(n))throw a.InvalidResponse(n);return n.result},s.prototype.sendAsync=function(t,e){if(!this.provider)return e(a.InvalidProvider());var n=r.toPayload(t.method,t.params);this.provider.sendAsync(n,function(t,n){return t?e(t):r.isValidResponse(n)?void e(null,n.result):e(a.InvalidResponse(n))})},s.prototype.sendBatch=function(t,e){if(!this.provider)return e(a.InvalidProvider());var n=r.toBatchPayload(t);this.provider.sendAsync(n,function(t,n){return t?e(t):o.isArray(n)?void e(t,n):e(a.InvalidResponse(n))})},s.prototype.setProvider=function(t){this.provider=t},s.prototype.startPolling=function(t,e,n,r){this.polls[e]={data:t,id:e,callback:n,uninstall:r},this.timeout||this.poll()},s.prototype.stopPolling=function(t){delete this.polls[t],0===Object.keys(this.polls).length&&this.timeout&&(clearTimeout(this.timeout),this.timeout=null)},s.prototype.reset=function(t){for(var e in this.polls)t&&-1!==e.indexOf(\"syncPoll_\")||(this.polls[e].uninstall(),delete this.polls[e]);0===Object.keys(this.polls).length&&this.timeout&&(clearTimeout(this.timeout),this.timeout=null)},s.prototype.poll=function(){if(this.timeout=setTimeout(this.poll.bind(this),i.ETH_POLLING_TIMEOUT),0!==Object.keys(this.polls).length)if(this.provider){var t=[],e=[];for(var n in this.polls)t.push(this.polls[n].data),e.push(n);if(0!==t.length){var s=r.toBatchPayload(t),c={};s.forEach(function(t,n){c[t.id]=e[n]});var u=this;this.provider.sendAsync(s,function(t,e){if(!t){if(!o.isArray(e))throw a.InvalidResponse(e);e.map(function(t){var e=c[t.id];return!!u.polls[e]&&(t.callback=u.polls[e].callback,t)}).filter(function(t){return!!t}).filter(function(t){var e=r.isValidResponse(t);return e||t.callback(a.InvalidResponse(t)),e}).forEach(function(t){t.callback(null,t.result)})}})}}else console.error(a.InvalidProvider())},e.exports=s},{\"../utils/config\":18,\"../utils/utils\":20,\"./errors\":26,\"./jsonrpc\":35}],47:[function(t,e,n){e.exports=function(){this.defaultBlock=\"latest\",this.defaultAccount=void 0}},{}],48:[function(t,e,n){var r=t(\"./formatters\"),o=t(\"../utils/utils\"),i=1,a=function(t,e){return this.requestManager=t,this.pollId=\"syncPoll_\"+i++,this.callbacks=[],this.addCallback(e),this.lastSyncState=!1,function(t){t.requestManager.startPolling({method:\"eth_syncing\",params:[]},t.pollId,function(e,n){if(e)return t.callbacks.forEach(function(t){t(e)});o.isObject(n)&&n.startingBlock&&(n=r.outputSyncingFormatter(n)),t.callbacks.forEach(function(e){t.lastSyncState!==n&&(!t.lastSyncState&&o.isObject(n)&&e(null,!0),setTimeout(function(){e(null,n)},0),t.lastSyncState=n)})},t.stopWatching.bind(t))}(this),this};a.prototype.addCallback=function(t){return t&&this.callbacks.push(t),this},a.prototype.stopWatching=function(){this.requestManager.stopPolling(this.pollId),this.callbacks=[]},e.exports=a},{\"../utils/utils\":20,\"./formatters\":30}],49:[function(t,e,n){var r=t(\"./iban\"),o=t(\"../contracts/SmartExchange.json\"),i=function(t,e,n,r,o){return t.sendTransaction({address:n,from:e,value:r},o)},a=function(t,e,n,r,i,a){var s=o;return t.contract(s).at(n).deposit(i,{from:e,value:r},a)};e.exports=function(t,e,n,o,s){var c=new r(n);if(!c.isValid())throw new Error(\"invalid iban address\");if(c.isDirect())return i(t,e,c.address(),o,s);if(!s){var u=t.icapNamereg().addr(c.institution());return a(t,e,u,o,c.client())}t.icapNamereg().addr(c.institution(),function(n,r){return a(t,e,r,o,c.client(),s)})}},{\"../contracts/SmartExchange.json\":3,\"./iban\":33}],50:[function(t,e,n){},{}],51:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./enc-base64\"),t(\"./md5\"),t(\"./evpkdf\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./enc-base64\",\"./md5\",\"./evpkdf\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return function(){var e=t,n=e.lib.BlockCipher,r=e.algo,o=[],i=[],a=[],s=[],c=[],u=[],f=[],l=[],p=[],h=[];!function(){for(var t=[],e=0;e<256;e++)t[e]=e<128?e<<1:e<<1^283;var n=0,r=0;for(e=0;e<256;e++){var d=r^r<<1^r<<2^r<<3^r<<4;d=d>>>8^255&d^99,o[n]=d,i[d]=n;var m=t[n],y=t[m],g=t[y],v=257*t[d]^16843008*d;a[n]=v<<24|v>>>8,s[n]=v<<16|v>>>16,c[n]=v<<8|v>>>24,u[n]=v;v=16843009*g^65537*y^257*m^16843008*n;f[d]=v<<24|v>>>8,l[d]=v<<16|v>>>16,p[d]=v<<8|v>>>24,h[d]=v,n?(n=m^t[t[t[g^m]]],r^=t[t[r]]):n=r=1}}();var d=[0,1,2,4,8,16,32,64,128,27,54],m=r.AES=n.extend({_doReset:function(){if(!this._nRounds||this._keyPriorReset!==this._key){for(var t=this._keyPriorReset=this._key,e=t.words,n=t.sigBytes/4,r=4*((this._nRounds=n+6)+1),i=this._keySchedule=[],a=0;a<r;a++)if(a<n)i[a]=e[a];else{var s=i[a-1];a%n?n>6&&a%n==4&&(s=o[s>>>24]<<24|o[s>>>16&255]<<16|o[s>>>8&255]<<8|o[255&s]):(s=o[(s=s<<8|s>>>24)>>>24]<<24|o[s>>>16&255]<<16|o[s>>>8&255]<<8|o[255&s],s^=d[a/n|0]<<24),i[a]=i[a-n]^s}for(var c=this._invKeySchedule=[],u=0;u<r;u++){a=r-u;if(u%4)s=i[a];else s=i[a-4];c[u]=u<4||a<=4?s:f[o[s>>>24]]^l[o[s>>>16&255]]^p[o[s>>>8&255]]^h[o[255&s]]}}},encryptBlock:function(t,e){this._doCryptBlock(t,e,this._keySchedule,a,s,c,u,o)},decryptBlock:function(t,e){var n=t[e+1];t[e+1]=t[e+3],t[e+3]=n,this._doCryptBlock(t,e,this._invKeySchedule,f,l,p,h,i);n=t[e+1];t[e+1]=t[e+3],t[e+3]=n},_doCryptBlock:function(t,e,n,r,o,i,a,s){for(var c=this._nRounds,u=t[e]^n[0],f=t[e+1]^n[1],l=t[e+2]^n[2],p=t[e+3]^n[3],h=4,d=1;d<c;d++){var m=r[u>>>24]^o[f>>>16&255]^i[l>>>8&255]^a[255&p]^n[h++],y=r[f>>>24]^o[l>>>16&255]^i[p>>>8&255]^a[255&u]^n[h++],g=r[l>>>24]^o[p>>>16&255]^i[u>>>8&255]^a[255&f]^n[h++],v=r[p>>>24]^o[u>>>16&255]^i[f>>>8&255]^a[255&l]^n[h++];u=m,f=y,l=g,p=v}m=(s[u>>>24]<<24|s[f>>>16&255]<<16|s[l>>>8&255]<<8|s[255&p])^n[h++],y=(s[f>>>24]<<24|s[l>>>16&255]<<16|s[p>>>8&255]<<8|s[255&u])^n[h++],g=(s[l>>>24]<<24|s[p>>>16&255]<<16|s[u>>>8&255]<<8|s[255&f])^n[h++],v=(s[p>>>24]<<24|s[u>>>16&255]<<16|s[f>>>8&255]<<8|s[255&l])^n[h++];t[e]=m,t[e+1]=y,t[e+2]=g,t[e+3]=v},keySize:8});e.AES=n._createHelper(m)}(),t.AES})},{\"./cipher-core\":52,\"./core\":53,\"./enc-base64\":54,\"./evpkdf\":56,\"./md5\":61}],52:[function(t,e,n){!function(r,o){\"object\"==typeof n?e.exports=n=o(t(\"./core\")):\"function\"==typeof define&&define.amd?define([\"./core\"],o):o(r.CryptoJS)}(this,function(t){t.lib.Cipher||function(e){var n=t,r=n.lib,o=r.Base,i=r.WordArray,a=r.BufferedBlockAlgorithm,s=n.enc,c=(s.Utf8,s.Base64),u=n.algo.EvpKDF,f=r.Cipher=a.extend({cfg:o.extend(),createEncryptor:function(t,e){return this.create(this._ENC_XFORM_MODE,t,e)},createDecryptor:function(t,e){return this.create(this._DEC_XFORM_MODE,t,e)},init:function(t,e,n){this.cfg=this.cfg.extend(n),this._xformMode=t,this._key=e,this.reset()},reset:function(){a.reset.call(this),this._doReset()},process:function(t){return this._append(t),this._process()},finalize:function(t){t&&this._append(t);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(){function t(t){return\"string\"==typeof t?b:g}return function(e){return{encrypt:function(n,r,o){return t(r).encrypt(e,n,r,o)},decrypt:function(n,r,o){return t(r).decrypt(e,n,r,o)}}}}()}),l=(r.StreamCipher=f.extend({_doFinalize:function(){return this._process(!0)},blockSize:1}),n.mode={}),p=r.BlockCipherMode=o.extend({createEncryptor:function(t,e){return this.Encryptor.create(t,e)},createDecryptor:function(t,e){return this.Decryptor.create(t,e)},init:function(t,e){this._cipher=t,this._iv=e}}),h=l.CBC=function(){function t(t,n,r){var o=this._iv;if(o){var i=o;this._iv=e}else i=this._prevBlock;for(var a=0;a<r;a++)t[n+a]^=i[a]}var n=p.extend();return n.Encryptor=n.extend({processBlock:function(e,n){var r=this._cipher,o=r.blockSize;t.call(this,e,n,o),r.encryptBlock(e,n),this._prevBlock=e.slice(n,n+o)}}),n.Decryptor=n.extend({processBlock:function(e,n){var r=this._cipher,o=r.blockSize,i=e.slice(n,n+o);r.decryptBlock(e,n),t.call(this,e,n,o),this._prevBlock=i}}),n}(),d=(n.pad={}).Pkcs7={pad:function(t,e){for(var n=4*e,r=n-t.sigBytes%n,o=r<<24|r<<16|r<<8|r,a=[],s=0;s<r;s+=4)a.push(o);var c=i.create(a,r);t.concat(c)},unpad:function(t){var e=255&t.words[t.sigBytes-1>>>2];t.sigBytes-=e}},m=(r.BlockCipher=f.extend({cfg:f.cfg.extend({mode:h,padding:d}),reset:function(){f.reset.call(this);var t=this.cfg,e=t.iv,n=t.mode;if(this._xformMode==this._ENC_XFORM_MODE)var r=n.createEncryptor;else{r=n.createDecryptor;this._minBufferSize=1}this._mode=r.call(n,this,e&&e.words)},_doProcessBlock:function(t,e){this._mode.processBlock(t,e)},_doFinalize:function(){var t=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){t.pad(this._data,this.blockSize);var e=this._process(!0)}else{e=this._process(!0);t.unpad(e)}return e},blockSize:4}),r.CipherParams=o.extend({init:function(t){this.mixIn(t)},toString:function(t){return(t||this.formatter).stringify(this)}})),y=(n.format={}).OpenSSL={stringify:function(t){var e=t.ciphertext,n=t.salt;if(n)var r=i.create([1398893684,1701076831]).concat(n).concat(e);else r=e;return r.toString(c)},parse:function(t){var e=c.parse(t),n=e.words;if(1398893684==n[0]&&1701076831==n[1]){var r=i.create(n.slice(2,4));n.splice(0,4),e.sigBytes-=16}return m.create({ciphertext:e,salt:r})}},g=r.SerializableCipher=o.extend({cfg:o.extend({format:y}),encrypt:function(t,e,n,r){r=this.cfg.extend(r);var o=t.createEncryptor(n,r),i=o.finalize(e),a=o.cfg;return m.create({ciphertext:i,key:n,iv:a.iv,algorithm:t,mode:a.mode,padding:a.padding,blockSize:t.blockSize,formatter:r.format})},decrypt:function(t,e,n,r){r=this.cfg.extend(r),e=this._parse(e,r.format);return t.createDecryptor(n,r).finalize(e.ciphertext)},_parse:function(t,e){return\"string\"==typeof t?e.parse(t,this):t}}),v=(n.kdf={}).OpenSSL={execute:function(t,e,n,r){r||(r=i.random(8));var o=u.create({keySize:e+n}).compute(t,r),a=i.create(o.words.slice(e),4*n);return o.sigBytes=4*e,m.create({key:o,iv:a,salt:r})}},b=r.PasswordBasedCipher=g.extend({cfg:g.cfg.extend({kdf:v}),encrypt:function(t,e,n,r){var o=(r=this.cfg.extend(r)).kdf.execute(n,t.keySize,t.ivSize);r.iv=o.iv;var i=g.encrypt.call(this,t,e,o.key,r);return i.mixIn(o),i},decrypt:function(t,e,n,r){r=this.cfg.extend(r),e=this._parse(e,r.format);var o=r.kdf.execute(n,t.keySize,t.ivSize,e.salt);r.iv=o.iv;return g.decrypt.call(this,t,e,o.key,r)}})}()})},{\"./core\":53}],53:[function(t,e,n){!function(t,r){\"object\"==typeof n?e.exports=n=r():\"function\"==typeof define&&define.amd?define([],r):t.CryptoJS=r()}(this,function(){var t=t||function(t,e){var n=Object.create||function(){function t(){}return function(e){var n;return t.prototype=e,n=new t,t.prototype=null,n}}(),r={},o=r.lib={},i=o.Base={extend:function(t){var e=n(this);return t&&e.mixIn(t),e.hasOwnProperty(\"init\")&&this.init!==e.init||(e.init=function(){e.$super.init.apply(this,arguments)}),e.init.prototype=e,e.$super=this,e},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var e in t)t.hasOwnProperty(e)&&(this[e]=t[e]);t.hasOwnProperty(\"toString\")&&(this.toString=t.toString)},clone:function(){return this.init.prototype.extend(this)}},a=o.WordArray=i.extend({init:function(t,e){t=this.words=t||[],this.sigBytes=void 0!=e?e:4*t.length},toString:function(t){return(t||c).stringify(this)},concat:function(t){var e=this.words,n=t.words,r=this.sigBytes,o=t.sigBytes;if(this.clamp(),r%4)for(var i=0;i<o;i++){var a=n[i>>>2]>>>24-i%4*8&255;e[r+i>>>2]|=a<<24-(r+i)%4*8}else for(i=0;i<o;i+=4)e[r+i>>>2]=n[i>>>2];return this.sigBytes+=o,this},clamp:function(){var e=this.words,n=this.sigBytes;e[n>>>2]&=4294967295<<32-n%4*8,e.length=t.ceil(n/4)},clone:function(){var t=i.clone.call(this);return t.words=this.words.slice(0),t},random:function(e){for(var n,r=[],o=function(e){e=e;var n=987654321;return function(){var r=((n=36969*(65535&n)+(n>>16)&4294967295)<<16)+(e=18e3*(65535&e)+(e>>16)&4294967295)&4294967295;return r/=4294967296,(r+=.5)*(t.random()>.5?1:-1)}},i=0;i<e;i+=4){var s=o(4294967296*(n||t.random()));n=987654071*s(),r.push(4294967296*s()|0)}return new a.init(r,e)}}),s=r.enc={},c=s.Hex={stringify:function(t){for(var e=t.words,n=t.sigBytes,r=[],o=0;o<n;o++){var i=e[o>>>2]>>>24-o%4*8&255;r.push((i>>>4).toString(16)),r.push((15&i).toString(16))}return r.join(\"\")},parse:function(t){for(var e=t.length,n=[],r=0;r<e;r+=2)n[r>>>3]|=parseInt(t.substr(r,2),16)<<24-r%8*4;return new a.init(n,e/2)}},u=s.Latin1={stringify:function(t){for(var e=t.words,n=t.sigBytes,r=[],o=0;o<n;o++){var i=e[o>>>2]>>>24-o%4*8&255;r.push(String.fromCharCode(i))}return r.join(\"\")},parse:function(t){for(var e=t.length,n=[],r=0;r<e;r++)n[r>>>2]|=(255&t.charCodeAt(r))<<24-r%4*8;return new a.init(n,e)}},f=s.Utf8={stringify:function(t){try{return decodeURIComponent(escape(u.stringify(t)))}catch(t){throw new Error(\"Malformed UTF-8 data\")}},parse:function(t){return u.parse(unescape(encodeURIComponent(t)))}},l=o.BufferedBlockAlgorithm=i.extend({reset:function(){this._data=new a.init,this._nDataBytes=0},_append:function(t){\"string\"==typeof t&&(t=f.parse(t)),this._data.concat(t),this._nDataBytes+=t.sigBytes},_process:function(e){var n=this._data,r=n.words,o=n.sigBytes,i=this.blockSize,s=o/(4*i),c=(s=e?t.ceil(s):t.max((0|s)-this._minBufferSize,0))*i,u=t.min(4*c,o);if(c){for(var f=0;f<c;f+=i)this._doProcessBlock(r,f);var l=r.splice(0,c);n.sigBytes-=u}return new a.init(l,u)},clone:function(){var t=i.clone.call(this);return t._data=this._data.clone(),t},_minBufferSize:0}),p=(o.Hasher=l.extend({cfg:i.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset()},reset:function(){l.reset.call(this),this._doReset()},update:function(t){return this._append(t),this._process(),this},finalize:function(t){t&&this._append(t);return this._doFinalize()},blockSize:16,_createHelper:function(t){return function(e,n){return new t.init(n).finalize(e)}},_createHmacHelper:function(t){return function(e,n){return new p.HMAC.init(t,n).finalize(e)}}}),r.algo={});return r}(Math);return t})},{}],54:[function(t,e,n){!function(r,o){\"object\"==typeof n?e.exports=n=o(t(\"./core\")):\"function\"==typeof define&&define.amd?define([\"./core\"],o):o(r.CryptoJS)}(this,function(t){return function(){var e=t,n=e.lib.WordArray;e.enc.Base64={stringify:function(t){var e=t.words,n=t.sigBytes,r=this._map;t.clamp();for(var o=[],i=0;i<n;i+=3)for(var a=(e[i>>>2]>>>24-i%4*8&255)<<16|(e[i+1>>>2]>>>24-(i+1)%4*8&255)<<8|e[i+2>>>2]>>>24-(i+2)%4*8&255,s=0;s<4&&i+.75*s<n;s++)o.push(r.charAt(a>>>6*(3-s)&63));var c=r.charAt(64);if(c)for(;o.length%4;)o.push(c);return o.join(\"\")},parse:function(t){var e=t.length,r=this._map,o=this._reverseMap;if(!o){o=this._reverseMap=[];for(var i=0;i<r.length;i++)o[r.charCodeAt(i)]=i}var a=r.charAt(64);if(a){var s=t.indexOf(a);-1!==s&&(e=s)}return function(t,e,r){for(var o=[],i=0,a=0;a<e;a++)if(a%4){var s=r[t.charCodeAt(a-1)]<<a%4*2,c=r[t.charCodeAt(a)]>>>6-a%4*2;o[i>>>2]|=(s|c)<<24-i%4*8,i++}return n.create(o,i)}(t,e,o)},_map:\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\"}}(),t.enc.Base64})},{\"./core\":53}],55:[function(t,e,n){!function(r,o){\"object\"==typeof n?e.exports=n=o(t(\"./core\")):\"function\"==typeof define&&define.amd?define([\"./core\"],o):o(r.CryptoJS)}(this,function(t){return function(){function e(t){return t<<8&4278255360|t>>>8&16711935}var n=t,r=n.lib.WordArray,o=n.enc;o.Utf16=o.Utf16BE={stringify:function(t){for(var e=t.words,n=t.sigBytes,r=[],o=0;o<n;o+=2){var i=e[o>>>2]>>>16-o%4*8&65535;r.push(String.fromCharCode(i))}return r.join(\"\")},parse:function(t){for(var e=t.length,n=[],o=0;o<e;o++)n[o>>>1]|=t.charCodeAt(o)<<16-o%2*16;return r.create(n,2*e)}};o.Utf16LE={stringify:function(t){for(var n=t.words,r=t.sigBytes,o=[],i=0;i<r;i+=2){var a=e(n[i>>>2]>>>16-i%4*8&65535);o.push(String.fromCharCode(a))}return o.join(\"\")},parse:function(t){for(var n=t.length,o=[],i=0;i<n;i++)o[i>>>1]|=e(t.charCodeAt(i)<<16-i%2*16);return r.create(o,2*n)}}}(),t.enc.Utf16})},{\"./core\":53}],56:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./sha1\"),t(\"./hmac\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./sha1\",\"./hmac\"],o):o(r.CryptoJS)}(this,function(t){return function(){var e=t,n=e.lib,r=n.Base,o=n.WordArray,i=e.algo,a=i.MD5,s=i.EvpKDF=r.extend({cfg:r.extend({keySize:4,hasher:a,iterations:1}),init:function(t){this.cfg=this.cfg.extend(t)},compute:function(t,e){for(var n=this.cfg,r=n.hasher.create(),i=o.create(),a=i.words,s=n.keySize,c=n.iterations;a.length<s;){u&&r.update(u);var u=r.update(t).finalize(e);r.reset();for(var f=1;f<c;f++)u=r.finalize(u),r.reset();i.concat(u)}return i.sigBytes=4*s,i}});e.EvpKDF=function(t,e,n){return s.create(n).compute(t,e)}}(),t.EvpKDF})},{\"./core\":53,\"./hmac\":58,\"./sha1\":77}],57:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return function(e){var n=t,r=n.lib.CipherParams,o=n.enc.Hex;n.format.Hex={stringify:function(t){return t.ciphertext.toString(o)},parse:function(t){var e=o.parse(t);return r.create({ciphertext:e})}}}(),t.format.Hex})},{\"./cipher-core\":52,\"./core\":53}],58:[function(t,e,n){!function(r,o){\"object\"==typeof n?e.exports=n=o(t(\"./core\")):\"function\"==typeof define&&define.amd?define([\"./core\"],o):o(r.CryptoJS)}(this,function(t){!function(){var e=t,n=e.lib.Base,r=e.enc.Utf8;e.algo.HMAC=n.extend({init:function(t,e){t=this._hasher=new t.init,\"string\"==typeof e&&(e=r.parse(e));var n=t.blockSize,o=4*n;e.sigBytes>o&&(e=t.finalize(e)),e.clamp();for(var i=this._oKey=e.clone(),a=this._iKey=e.clone(),s=i.words,c=a.words,u=0;u<n;u++)s[u]^=1549556828,c[u]^=909522486;i.sigBytes=a.sigBytes=o,this.reset()},reset:function(){var t=this._hasher;t.reset(),t.update(this._iKey)},update:function(t){return this._hasher.update(t),this},finalize:function(t){var e=this._hasher,n=e.finalize(t);e.reset();return e.finalize(this._oKey.clone().concat(n))}})}()})},{\"./core\":53}],59:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./x64-core\"),t(\"./lib-typedarrays\"),t(\"./enc-utf16\"),t(\"./enc-base64\"),t(\"./md5\"),t(\"./sha1\"),t(\"./sha256\"),t(\"./sha224\"),t(\"./sha512\"),t(\"./sha384\"),t(\"./sha3\"),t(\"./ripemd160\"),t(\"./hmac\"),t(\"./pbkdf2\"),t(\"./evpkdf\"),t(\"./cipher-core\"),t(\"./mode-cfb\"),t(\"./mode-ctr\"),t(\"./mode-ctr-gladman\"),t(\"./mode-ofb\"),t(\"./mode-ecb\"),t(\"./pad-ansix923\"),t(\"./pad-iso10126\"),t(\"./pad-iso97971\"),t(\"./pad-zeropadding\"),t(\"./pad-nopadding\"),t(\"./format-hex\"),t(\"./aes\"),t(\"./tripledes\"),t(\"./rc4\"),t(\"./rabbit\"),t(\"./rabbit-legacy\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./x64-core\",\"./lib-typedarrays\",\"./enc-utf16\",\"./enc-base64\",\"./md5\",\"./sha1\",\"./sha256\",\"./sha224\",\"./sha512\",\"./sha384\",\"./sha3\",\"./ripemd160\",\"./hmac\",\"./pbkdf2\",\"./evpkdf\",\"./cipher-core\",\"./mode-cfb\",\"./mode-ctr\",\"./mode-ctr-gladman\",\"./mode-ofb\",\"./mode-ecb\",\"./pad-ansix923\",\"./pad-iso10126\",\"./pad-iso97971\",\"./pad-zeropadding\",\"./pad-nopadding\",\"./format-hex\",\"./aes\",\"./tripledes\",\"./rc4\",\"./rabbit\",\"./rabbit-legacy\"],o):r.CryptoJS=o(r.CryptoJS)}(this,function(t){return t})},{\"./aes\":51,\"./cipher-core\":52,\"./core\":53,\"./enc-base64\":54,\"./enc-utf16\":55,\"./evpkdf\":56,\"./format-hex\":57,\"./hmac\":58,\"./lib-typedarrays\":60,\"./md5\":61,\"./mode-cfb\":62,\"./mode-ctr\":64,\"./mode-ctr-gladman\":63,\"./mode-ecb\":65,\"./mode-ofb\":66,\"./pad-ansix923\":67,\"./pad-iso10126\":68,\"./pad-iso97971\":69,\"./pad-nopadding\":70,\"./pad-zeropadding\":71,\"./pbkdf2\":72,\"./rabbit\":74,\"./rabbit-legacy\":73,\"./rc4\":75,\"./ripemd160\":76,\"./sha1\":77,\"./sha224\":78,\"./sha256\":79,\"./sha3\":80,\"./sha384\":81,\"./sha512\":82,\"./tripledes\":83,\"./x64-core\":84}],60:[function(t,e,n){!function(r,o){\"object\"==typeof n?e.exports=n=o(t(\"./core\")):\"function\"==typeof define&&define.amd?define([\"./core\"],o):o(r.CryptoJS)}(this,function(t){return function(){if(\"function\"==typeof ArrayBuffer){var e=t.lib.WordArray,n=e.init;(e.init=function(t){if(t instanceof ArrayBuffer&&(t=new Uint8Array(t)),(t instanceof Int8Array||\"undefined\"!=typeof Uint8ClampedArray&&t instanceof Uint8ClampedArray||t instanceof Int16Array||t instanceof Uint16Array||t instanceof Int32Array||t instanceof Uint32Array||t instanceof Float32Array||t instanceof Float64Array)&&(t=new Uint8Array(t.buffer,t.byteOffset,t.byteLength)),t instanceof Uint8Array){for(var e=t.byteLength,r=[],o=0;o<e;o++)r[o>>>2]|=t[o]<<24-o%4*8;n.call(this,r,e)}else n.apply(this,arguments)}).prototype=e}}(),t.lib.WordArray})},{\"./core\":53}],61:[function(t,e,n){!function(r,o){\"object\"==typeof n?e.exports=n=o(t(\"./core\")):\"function\"==typeof define&&define.amd?define([\"./core\"],o):o(r.CryptoJS)}(this,function(t){return function(e){function n(t,e,n,r,o,i,a){var s=t+(e&n|~e&r)+o+a;return(s<<i|s>>>32-i)+e}function r(t,e,n,r,o,i,a){var s=t+(e&r|n&~r)+o+a;return(s<<i|s>>>32-i)+e}function o(t,e,n,r,o,i,a){var s=t+(e^n^r)+o+a;return(s<<i|s>>>32-i)+e}function i(t,e,n,r,o,i,a){var s=t+(n^(e|~r))+o+a;return(s<<i|s>>>32-i)+e}var a=t,s=a.lib,c=s.WordArray,u=s.Hasher,f=a.algo,l=[];!function(){for(var t=0;t<64;t++)l[t]=4294967296*e.abs(e.sin(t+1))|0}();var p=f.MD5=u.extend({_doReset:function(){this._hash=new c.init([1732584193,4023233417,2562383102,271733878])},_doProcessBlock:function(t,e){for(var a=0;a<16;a++){var s=e+a,c=t[s];t[s]=16711935&(c<<8|c>>>24)|4278255360&(c<<24|c>>>8)}var u=this._hash.words,f=t[e+0],p=t[e+1],h=t[e+2],d=t[e+3],m=t[e+4],y=t[e+5],g=t[e+6],v=t[e+7],b=t[e+8],_=t[e+9],w=t[e+10],x=t[e+11],k=t[e+12],B=t[e+13],S=t[e+14],A=t[e+15],C=u[0],F=u[1],O=u[2],N=u[3];F=i(F=i(F=i(F=i(F=o(F=o(F=o(F=o(F=r(F=r(F=r(F=r(F=n(F=n(F=n(F=n(F,O=n(O,N=n(N,C=n(C,F,O,N,f,7,l[0]),F,O,p,12,l[1]),C,F,h,17,l[2]),N,C,d,22,l[3]),O=n(O,N=n(N,C=n(C,F,O,N,m,7,l[4]),F,O,y,12,l[5]),C,F,g,17,l[6]),N,C,v,22,l[7]),O=n(O,N=n(N,C=n(C,F,O,N,b,7,l[8]),F,O,_,12,l[9]),C,F,w,17,l[10]),N,C,x,22,l[11]),O=n(O,N=n(N,C=n(C,F,O,N,k,7,l[12]),F,O,B,12,l[13]),C,F,S,17,l[14]),N,C,A,22,l[15]),O=r(O,N=r(N,C=r(C,F,O,N,p,5,l[16]),F,O,g,9,l[17]),C,F,x,14,l[18]),N,C,f,20,l[19]),O=r(O,N=r(N,C=r(C,F,O,N,y,5,l[20]),F,O,w,9,l[21]),C,F,A,14,l[22]),N,C,m,20,l[23]),O=r(O,N=r(N,C=r(C,F,O,N,_,5,l[24]),F,O,S,9,l[25]),C,F,d,14,l[26]),N,C,b,20,l[27]),O=r(O,N=r(N,C=r(C,F,O,N,B,5,l[28]),F,O,h,9,l[29]),C,F,v,14,l[30]),N,C,k,20,l[31]),O=o(O,N=o(N,C=o(C,F,O,N,y,4,l[32]),F,O,b,11,l[33]),C,F,x,16,l[34]),N,C,S,23,l[35]),O=o(O,N=o(N,C=o(C,F,O,N,p,4,l[36]),F,O,m,11,l[37]),C,F,v,16,l[38]),N,C,w,23,l[39]),O=o(O,N=o(N,C=o(C,F,O,N,B,4,l[40]),F,O,f,11,l[41]),C,F,d,16,l[42]),N,C,g,23,l[43]),O=o(O,N=o(N,C=o(C,F,O,N,_,4,l[44]),F,O,k,11,l[45]),C,F,A,16,l[46]),N,C,h,23,l[47]),O=i(O,N=i(N,C=i(C,F,O,N,f,6,l[48]),F,O,v,10,l[49]),C,F,S,15,l[50]),N,C,y,21,l[51]),O=i(O,N=i(N,C=i(C,F,O,N,k,6,l[52]),F,O,d,10,l[53]),C,F,w,15,l[54]),N,C,p,21,l[55]),O=i(O,N=i(N,C=i(C,F,O,N,b,6,l[56]),F,O,A,10,l[57]),C,F,g,15,l[58]),N,C,B,21,l[59]),O=i(O,N=i(N,C=i(C,F,O,N,m,6,l[60]),F,O,x,10,l[61]),C,F,h,15,l[62]),N,C,_,21,l[63]),u[0]=u[0]+C|0,u[1]=u[1]+F|0,u[2]=u[2]+O|0,u[3]=u[3]+N|0},_doFinalize:function(){var t=this._data,n=t.words,r=8*this._nDataBytes,o=8*t.sigBytes;n[o>>>5]|=128<<24-o%32;var i=e.floor(r/4294967296),a=r;n[15+(o+64>>>9<<4)]=16711935&(i<<8|i>>>24)|4278255360&(i<<24|i>>>8),n[14+(o+64>>>9<<4)]=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8),t.sigBytes=4*(n.length+1),this._process();for(var s=this._hash,c=s.words,u=0;u<4;u++){var f=c[u];c[u]=16711935&(f<<8|f>>>24)|4278255360&(f<<24|f>>>8)}return s},clone:function(){var t=u.clone.call(this);return t._hash=this._hash.clone(),t}});a.MD5=u._createHelper(p),a.HmacMD5=u._createHmacHelper(p)}(Math),t.MD5})},{\"./core\":53}],62:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return t.mode.CFB=function(){function e(t,e,n,r){var o=this._iv;if(o){var i=o.slice(0);this._iv=void 0}else i=this._prevBlock;r.encryptBlock(i,0);for(var a=0;a<n;a++)t[e+a]^=i[a]}var n=t.lib.BlockCipherMode.extend();return n.Encryptor=n.extend({processBlock:function(t,n){var r=this._cipher,o=r.blockSize;e.call(this,t,n,o,r),this._prevBlock=t.slice(n,n+o)}}),n.Decryptor=n.extend({processBlock:function(t,n){var r=this._cipher,o=r.blockSize,i=t.slice(n,n+o);e.call(this,t,n,o,r),this._prevBlock=i}}),n}(),t.mode.CFB})},{\"./cipher-core\":52,\"./core\":53}],63:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return t.mode.CTRGladman=function(){function e(t){if(255==(t>>24&255)){var e=t>>16&255,n=t>>8&255,r=255&t;255===e?(e=0,255===n?(n=0,255===r?r=0:++r):++n):++e,t=0,t+=e<<16,t+=n<<8,t+=r}else t+=1<<24;return t}var n=t.lib.BlockCipherMode.extend(),r=n.Encryptor=n.extend({processBlock:function(t,n){var r=this._cipher,o=r.blockSize,i=this._iv,a=this._counter;i&&(a=this._counter=i.slice(0),this._iv=void 0),function(t){0===(t[0]=e(t[0]))&&(t[1]=e(t[1]))}(a);var s=a.slice(0);r.encryptBlock(s,0);for(var c=0;c<o;c++)t[n+c]^=s[c]}});return n.Decryptor=r,n}(),t.mode.CTRGladman})},{\"./cipher-core\":52,\"./core\":53}],64:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return t.mode.CTR=function(){var e=t.lib.BlockCipherMode.extend(),n=e.Encryptor=e.extend({processBlock:function(t,e){var n=this._cipher,r=n.blockSize,o=this._iv,i=this._counter;o&&(i=this._counter=o.slice(0),this._iv=void 0);var a=i.slice(0);n.encryptBlock(a,0),i[r-1]=i[r-1]+1|0;for(var s=0;s<r;s++)t[e+s]^=a[s]}});return e.Decryptor=n,e}(),t.mode.CTR})},{\"./cipher-core\":52,\"./core\":53}],65:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return t.mode.ECB=function(){var e=t.lib.BlockCipherMode.extend();return e.Encryptor=e.extend({processBlock:function(t,e){this._cipher.encryptBlock(t,e)}}),e.Decryptor=e.extend({processBlock:function(t,e){this._cipher.decryptBlock(t,e)}}),e}(),t.mode.ECB})},{\"./cipher-core\":52,\"./core\":53}],66:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return t.mode.OFB=function(){var e=t.lib.BlockCipherMode.extend(),n=e.Encryptor=e.extend({processBlock:function(t,e){var n=this._cipher,r=n.blockSize,o=this._iv,i=this._keystream;o&&(i=this._keystream=o.slice(0),this._iv=void 0),n.encryptBlock(i,0);for(var a=0;a<r;a++)t[e+a]^=i[a]}});return e.Decryptor=n,e}(),t.mode.OFB})},{\"./cipher-core\":52,\"./core\":53}],67:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return t.pad.AnsiX923={pad:function(t,e){var n=t.sigBytes,r=4*e,o=r-n%r,i=n+o-1;t.clamp(),t.words[i>>>2]|=o<<24-i%4*8,t.sigBytes+=o},unpad:function(t){var e=255&t.words[t.sigBytes-1>>>2];t.sigBytes-=e}},t.pad.Ansix923})},{\"./cipher-core\":52,\"./core\":53}],68:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return t.pad.Iso10126={pad:function(e,n){var r=4*n,o=r-e.sigBytes%r;e.concat(t.lib.WordArray.random(o-1)).concat(t.lib.WordArray.create([o<<24],1))},unpad:function(t){var e=255&t.words[t.sigBytes-1>>>2];t.sigBytes-=e}},t.pad.Iso10126})},{\"./cipher-core\":52,\"./core\":53}],69:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return t.pad.Iso97971={pad:function(e,n){e.concat(t.lib.WordArray.create([2147483648],1)),t.pad.ZeroPadding.pad(e,n)},unpad:function(e){t.pad.ZeroPadding.unpad(e),e.sigBytes--}},t.pad.Iso97971})},{\"./cipher-core\":52,\"./core\":53}],70:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return t.pad.NoPadding={pad:function(){},unpad:function(){}},t.pad.NoPadding})},{\"./cipher-core\":52,\"./core\":53}],71:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return t.pad.ZeroPadding={pad:function(t,e){var n=4*e;t.clamp(),t.sigBytes+=n-(t.sigBytes%n||n)},unpad:function(t){for(var e=t.words,n=t.sigBytes-1;!(e[n>>>2]>>>24-n%4*8&255);)n--;t.sigBytes=n+1}},t.pad.ZeroPadding})},{\"./cipher-core\":52,\"./core\":53}],72:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./sha1\"),t(\"./hmac\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./sha1\",\"./hmac\"],o):o(r.CryptoJS)}(this,function(t){return function(){var e=t,n=e.lib,r=n.Base,o=n.WordArray,i=e.algo,a=i.SHA1,s=i.HMAC,c=i.PBKDF2=r.extend({cfg:r.extend({keySize:4,hasher:a,iterations:1}),init:function(t){this.cfg=this.cfg.extend(t)},compute:function(t,e){for(var n=this.cfg,r=s.create(n.hasher,t),i=o.create(),a=o.create([1]),c=i.words,u=a.words,f=n.keySize,l=n.iterations;c.length<f;){var p=r.update(e).finalize(a);r.reset();for(var h=p.words,d=h.length,m=p,y=1;y<l;y++){m=r.finalize(m),r.reset();for(var g=m.words,v=0;v<d;v++)h[v]^=g[v]}i.concat(p),u[0]++}return i.sigBytes=4*f,i}});e.PBKDF2=function(t,e,n){return c.create(n).compute(t,e)}}(),t.PBKDF2})},{\"./core\":53,\"./hmac\":58,\"./sha1\":77}],73:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./enc-base64\"),t(\"./md5\"),t(\"./evpkdf\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./enc-base64\",\"./md5\",\"./evpkdf\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return function(){function e(){for(var t=this._X,e=this._C,n=0;n<8;n++)i[n]=e[n];e[0]=e[0]+1295307597+this._b|0,e[1]=e[1]+3545052371+(e[0]>>>0<i[0]>>>0?1:0)|0,e[2]=e[2]+886263092+(e[1]>>>0<i[1]>>>0?1:0)|0,e[3]=e[3]+1295307597+(e[2]>>>0<i[2]>>>0?1:0)|0,e[4]=e[4]+3545052371+(e[3]>>>0<i[3]>>>0?1:0)|0,e[5]=e[5]+886263092+(e[4]>>>0<i[4]>>>0?1:0)|0,e[6]=e[6]+1295307597+(e[5]>>>0<i[5]>>>0?1:0)|0,e[7]=e[7]+3545052371+(e[6]>>>0<i[6]>>>0?1:0)|0,this._b=e[7]>>>0<i[7]>>>0?1:0;for(n=0;n<8;n++){var r=t[n]+e[n],o=65535&r,s=r>>>16,c=((o*o>>>17)+o*s>>>15)+s*s,u=((4294901760&r)*r|0)+((65535&r)*r|0);a[n]=c^u}t[0]=a[0]+(a[7]<<16|a[7]>>>16)+(a[6]<<16|a[6]>>>16)|0,t[1]=a[1]+(a[0]<<8|a[0]>>>24)+a[7]|0,t[2]=a[2]+(a[1]<<16|a[1]>>>16)+(a[0]<<16|a[0]>>>16)|0,t[3]=a[3]+(a[2]<<8|a[2]>>>24)+a[1]|0,t[4]=a[4]+(a[3]<<16|a[3]>>>16)+(a[2]<<16|a[2]>>>16)|0,t[5]=a[5]+(a[4]<<8|a[4]>>>24)+a[3]|0,t[6]=a[6]+(a[5]<<16|a[5]>>>16)+(a[4]<<16|a[4]>>>16)|0,t[7]=a[7]+(a[6]<<8|a[6]>>>24)+a[5]|0}var n=t,r=n.lib.StreamCipher,o=[],i=[],a=[],s=n.algo.RabbitLegacy=r.extend({_doReset:function(){var t=this._key.words,n=this.cfg.iv,r=this._X=[t[0],t[3]<<16|t[2]>>>16,t[1],t[0]<<16|t[3]>>>16,t[2],t[1]<<16|t[0]>>>16,t[3],t[2]<<16|t[1]>>>16],o=this._C=[t[2]<<16|t[2]>>>16,4294901760&t[0]|65535&t[1],t[3]<<16|t[3]>>>16,4294901760&t[1]|65535&t[2],t[0]<<16|t[0]>>>16,4294901760&t[2]|65535&t[3],t[1]<<16|t[1]>>>16,4294901760&t[3]|65535&t[0]];this._b=0;for(var i=0;i<4;i++)e.call(this);for(i=0;i<8;i++)o[i]^=r[i+4&7];if(n){var a=n.words,s=a[0],c=a[1],u=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8),f=16711935&(c<<8|c>>>24)|4278255360&(c<<24|c>>>8),l=u>>>16|4294901760&f,p=f<<16|65535&u;o[0]^=u,o[1]^=l,o[2]^=f,o[3]^=p,o[4]^=u,o[5]^=l,o[6]^=f,o[7]^=p;for(i=0;i<4;i++)e.call(this)}},_doProcessBlock:function(t,n){var r=this._X;e.call(this),o[0]=r[0]^r[5]>>>16^r[3]<<16,o[1]=r[2]^r[7]>>>16^r[5]<<16,o[2]=r[4]^r[1]>>>16^r[7]<<16,o[3]=r[6]^r[3]>>>16^r[1]<<16;for(var i=0;i<4;i++)o[i]=16711935&(o[i]<<8|o[i]>>>24)|4278255360&(o[i]<<24|o[i]>>>8),t[n+i]^=o[i]},blockSize:4,ivSize:2});n.RabbitLegacy=r._createHelper(s)}(),t.RabbitLegacy})},{\"./cipher-core\":52,\"./core\":53,\"./enc-base64\":54,\"./evpkdf\":56,\"./md5\":61}],74:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./enc-base64\"),t(\"./md5\"),t(\"./evpkdf\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./enc-base64\",\"./md5\",\"./evpkdf\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return function(){function e(){for(var t=this._X,e=this._C,n=0;n<8;n++)i[n]=e[n];e[0]=e[0]+1295307597+this._b|0,e[1]=e[1]+3545052371+(e[0]>>>0<i[0]>>>0?1:0)|0,e[2]=e[2]+886263092+(e[1]>>>0<i[1]>>>0?1:0)|0,e[3]=e[3]+1295307597+(e[2]>>>0<i[2]>>>0?1:0)|0,e[4]=e[4]+3545052371+(e[3]>>>0<i[3]>>>0?1:0)|0,e[5]=e[5]+886263092+(e[4]>>>0<i[4]>>>0?1:0)|0,e[6]=e[6]+1295307597+(e[5]>>>0<i[5]>>>0?1:0)|0,e[7]=e[7]+3545052371+(e[6]>>>0<i[6]>>>0?1:0)|0,this._b=e[7]>>>0<i[7]>>>0?1:0;for(n=0;n<8;n++){var r=t[n]+e[n],o=65535&r,s=r>>>16,c=((o*o>>>17)+o*s>>>15)+s*s,u=((4294901760&r)*r|0)+((65535&r)*r|0);a[n]=c^u}t[0]=a[0]+(a[7]<<16|a[7]>>>16)+(a[6]<<16|a[6]>>>16)|0,t[1]=a[1]+(a[0]<<8|a[0]>>>24)+a[7]|0,t[2]=a[2]+(a[1]<<16|a[1]>>>16)+(a[0]<<16|a[0]>>>16)|0,t[3]=a[3]+(a[2]<<8|a[2]>>>24)+a[1]|0,t[4]=a[4]+(a[3]<<16|a[3]>>>16)+(a[2]<<16|a[2]>>>16)|0,t[5]=a[5]+(a[4]<<8|a[4]>>>24)+a[3]|0,t[6]=a[6]+(a[5]<<16|a[5]>>>16)+(a[4]<<16|a[4]>>>16)|0,t[7]=a[7]+(a[6]<<8|a[6]>>>24)+a[5]|0}var n=t,r=n.lib.StreamCipher,o=[],i=[],a=[],s=n.algo.Rabbit=r.extend({_doReset:function(){for(var t=this._key.words,n=this.cfg.iv,r=0;r<4;r++)t[r]=16711935&(t[r]<<8|t[r]>>>24)|4278255360&(t[r]<<24|t[r]>>>8);var o=this._X=[t[0],t[3]<<16|t[2]>>>16,t[1],t[0]<<16|t[3]>>>16,t[2],t[1]<<16|t[0]>>>16,t[3],t[2]<<16|t[1]>>>16],i=this._C=[t[2]<<16|t[2]>>>16,4294901760&t[0]|65535&t[1],t[3]<<16|t[3]>>>16,4294901760&t[1]|65535&t[2],t[0]<<16|t[0]>>>16,4294901760&t[2]|65535&t[3],t[1]<<16|t[1]>>>16,4294901760&t[3]|65535&t[0]];this._b=0;for(r=0;r<4;r++)e.call(this);for(r=0;r<8;r++)i[r]^=o[r+4&7];if(n){var a=n.words,s=a[0],c=a[1],u=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8),f=16711935&(c<<8|c>>>24)|4278255360&(c<<24|c>>>8),l=u>>>16|4294901760&f,p=f<<16|65535&u;i[0]^=u,i[1]^=l,i[2]^=f,i[3]^=p,i[4]^=u,i[5]^=l,i[6]^=f,i[7]^=p;for(r=0;r<4;r++)e.call(this)}},_doProcessBlock:function(t,n){var r=this._X;e.call(this),o[0]=r[0]^r[5]>>>16^r[3]<<16,o[1]=r[2]^r[7]>>>16^r[5]<<16,o[2]=r[4]^r[1]>>>16^r[7]<<16,o[3]=r[6]^r[3]>>>16^r[1]<<16;for(var i=0;i<4;i++)o[i]=16711935&(o[i]<<8|o[i]>>>24)|4278255360&(o[i]<<24|o[i]>>>8),t[n+i]^=o[i]},blockSize:4,ivSize:2});n.Rabbit=r._createHelper(s)}(),t.Rabbit})},{\"./cipher-core\":52,\"./core\":53,\"./enc-base64\":54,\"./evpkdf\":56,\"./md5\":61}],75:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./enc-base64\"),t(\"./md5\"),t(\"./evpkdf\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./enc-base64\",\"./md5\",\"./evpkdf\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return function(){function e(){for(var t=this._S,e=this._i,n=this._j,r=0,o=0;o<4;o++){n=(n+t[e=(e+1)%256])%256;var i=t[e];t[e]=t[n],t[n]=i,r|=t[(t[e]+t[n])%256]<<24-8*o}return this._i=e,this._j=n,r}var n=t,r=n.lib.StreamCipher,o=n.algo,i=o.RC4=r.extend({_doReset:function(){for(var t=this._key,e=t.words,n=t.sigBytes,r=this._S=[],o=0;o<256;o++)r[o]=o;o=0;for(var i=0;o<256;o++){var a=o%n,s=e[a>>>2]>>>24-a%4*8&255;i=(i+r[o]+s)%256;var c=r[o];r[o]=r[i],r[i]=c}this._i=this._j=0},_doProcessBlock:function(t,n){t[n]^=e.call(this)},keySize:8,ivSize:0});n.RC4=r._createHelper(i);var a=o.RC4Drop=i.extend({cfg:i.cfg.extend({drop:192}),_doReset:function(){i._doReset.call(this);for(var t=this.cfg.drop;t>0;t--)e.call(this)}});n.RC4Drop=r._createHelper(a)}(),t.RC4})},{\"./cipher-core\":52,\"./core\":53,\"./enc-base64\":54,\"./evpkdf\":56,\"./md5\":61}],76:[function(t,e,n){!function(r,o){\"object\"==typeof n?e.exports=n=o(t(\"./core\")):\"function\"==typeof define&&define.amd?define([\"./core\"],o):o(r.CryptoJS)}(this,function(t){return function(e){function n(t,e,n){return t^e^n}function r(t,e,n){return t&e|~t&n}function o(t,e,n){return(t|~e)^n}function i(t,e,n){return t&n|e&~n}function a(t,e,n){return t^(e|~n)}function s(t,e){return t<<e|t>>>32-e}var c=t,u=c.lib,f=u.WordArray,l=u.Hasher,p=c.algo,h=f.create([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]),d=f.create([5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]),m=f.create([11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]),y=f.create([8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]),g=f.create([0,1518500249,1859775393,2400959708,2840853838]),v=f.create([1352829926,1548603684,1836072691,2053994217,0]),b=p.RIPEMD160=l.extend({_doReset:function(){this._hash=f.create([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(t,e){for(var c=0;c<16;c++){var u=e+c,f=t[u];t[u]=16711935&(f<<8|f>>>24)|4278255360&(f<<24|f>>>8)}var l,p,b,_,w,x,k,B,S,A,C=this._hash.words,F=g.words,O=v.words,N=h.words,T=d.words,I=m.words,P=y.words;x=l=C[0],k=p=C[1],B=b=C[2],S=_=C[3],A=w=C[4];var D;for(c=0;c<80;c+=1)D=l+t[e+N[c]]|0,D+=c<16?n(p,b,_)+F[0]:c<32?r(p,b,_)+F[1]:c<48?o(p,b,_)+F[2]:c<64?i(p,b,_)+F[3]:a(p,b,_)+F[4],D=(D=s(D|=0,I[c]))+w|0,l=w,w=_,_=s(b,10),b=p,p=D,D=x+t[e+T[c]]|0,D+=c<16?a(k,B,S)+O[0]:c<32?i(k,B,S)+O[1]:c<48?o(k,B,S)+O[2]:c<64?r(k,B,S)+O[3]:n(k,B,S)+O[4],D=(D=s(D|=0,P[c]))+A|0,x=A,A=S,S=s(B,10),B=k,k=D;D=C[1]+b+S|0,C[1]=C[2]+_+A|0,C[2]=C[3]+w+x|0,C[3]=C[4]+l+k|0,C[4]=C[0]+p+B|0,C[0]=D},_doFinalize:function(){var t=this._data,e=t.words,n=8*this._nDataBytes,r=8*t.sigBytes;e[r>>>5]|=128<<24-r%32,e[14+(r+64>>>9<<4)]=16711935&(n<<8|n>>>24)|4278255360&(n<<24|n>>>8),t.sigBytes=4*(e.length+1),this._process();for(var o=this._hash,i=o.words,a=0;a<5;a++){var s=i[a];i[a]=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8)}return o},clone:function(){var t=l.clone.call(this);return t._hash=this._hash.clone(),t}});c.RIPEMD160=l._createHelper(b),c.HmacRIPEMD160=l._createHmacHelper(b)}(Math),t.RIPEMD160})},{\"./core\":53}],77:[function(t,e,n){!function(r,o){\"object\"==typeof n?e.exports=n=o(t(\"./core\")):\"function\"==typeof define&&define.amd?define([\"./core\"],o):o(r.CryptoJS)}(this,function(t){return function(){var e=t,n=e.lib,r=n.WordArray,o=n.Hasher,i=[],a=e.algo.SHA1=o.extend({_doReset:function(){this._hash=new r.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(t,e){for(var n=this._hash.words,r=n[0],o=n[1],a=n[2],s=n[3],c=n[4],u=0;u<80;u++){if(u<16)i[u]=0|t[e+u];else{var f=i[u-3]^i[u-8]^i[u-14]^i[u-16];i[u]=f<<1|f>>>31}var l=(r<<5|r>>>27)+c+i[u];l+=u<20?1518500249+(o&a|~o&s):u<40?1859775393+(o^a^s):u<60?(o&a|o&s|a&s)-1894007588:(o^a^s)-899497514,c=s,s=a,a=o<<30|o>>>2,o=r,r=l}n[0]=n[0]+r|0,n[1]=n[1]+o|0,n[2]=n[2]+a|0,n[3]=n[3]+s|0,n[4]=n[4]+c|0},_doFinalize:function(){var t=this._data,e=t.words,n=8*this._nDataBytes,r=8*t.sigBytes;return e[r>>>5]|=128<<24-r%32,e[14+(r+64>>>9<<4)]=Math.floor(n/4294967296),e[15+(r+64>>>9<<4)]=n,t.sigBytes=4*e.length,this._process(),this._hash},clone:function(){var t=o.clone.call(this);return t._hash=this._hash.clone(),t}});e.SHA1=o._createHelper(a),e.HmacSHA1=o._createHmacHelper(a)}(),t.SHA1})},{\"./core\":53}],78:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./sha256\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./sha256\"],o):o(r.CryptoJS)}(this,function(t){return function(){var e=t,n=e.lib.WordArray,r=e.algo,o=r.SHA256,i=r.SHA224=o.extend({_doReset:function(){this._hash=new n.init([3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428])},_doFinalize:function(){var t=o._doFinalize.call(this);return t.sigBytes-=4,t}});e.SHA224=o._createHelper(i),e.HmacSHA224=o._createHmacHelper(i)}(),t.SHA224})},{\"./core\":53,\"./sha256\":79}],79:[function(t,e,n){!function(r,o){\"object\"==typeof n?e.exports=n=o(t(\"./core\")):\"function\"==typeof define&&define.amd?define([\"./core\"],o):o(r.CryptoJS)}(this,function(t){return function(e){var n=t,r=n.lib,o=r.WordArray,i=r.Hasher,a=n.algo,s=[],c=[];!function(){function t(t){for(var n=e.sqrt(t),r=2;r<=n;r++)if(!(t%r))return!1;return!0}function n(t){return 4294967296*(t-(0|t))|0}for(var r=2,o=0;o<64;)t(r)&&(o<8&&(s[o]=n(e.pow(r,.5))),c[o]=n(e.pow(r,1/3)),o++),r++}();var u=[],f=a.SHA256=i.extend({_doReset:function(){this._hash=new o.init(s.slice(0))},_doProcessBlock:function(t,e){for(var n=this._hash.words,r=n[0],o=n[1],i=n[2],a=n[3],s=n[4],f=n[5],l=n[6],p=n[7],h=0;h<64;h++){if(h<16)u[h]=0|t[e+h];else{var d=u[h-15],m=(d<<25|d>>>7)^(d<<14|d>>>18)^d>>>3,y=u[h-2],g=(y<<15|y>>>17)^(y<<13|y>>>19)^y>>>10;u[h]=m+u[h-7]+g+u[h-16]}var v=r&o^r&i^o&i,b=(r<<30|r>>>2)^(r<<19|r>>>13)^(r<<10|r>>>22),_=p+((s<<26|s>>>6)^(s<<21|s>>>11)^(s<<7|s>>>25))+(s&f^~s&l)+c[h]+u[h];p=l,l=f,f=s,s=a+_|0,a=i,i=o,o=r,r=_+(b+v)|0}n[0]=n[0]+r|0,n[1]=n[1]+o|0,n[2]=n[2]+i|0,n[3]=n[3]+a|0,n[4]=n[4]+s|0,n[5]=n[5]+f|0,n[6]=n[6]+l|0,n[7]=n[7]+p|0},_doFinalize:function(){var t=this._data,n=t.words,r=8*this._nDataBytes,o=8*t.sigBytes;return n[o>>>5]|=128<<24-o%32,n[14+(o+64>>>9<<4)]=e.floor(r/4294967296),n[15+(o+64>>>9<<4)]=r,t.sigBytes=4*n.length,this._process(),this._hash},clone:function(){var t=i.clone.call(this);return t._hash=this._hash.clone(),t}});n.SHA256=i._createHelper(f),n.HmacSHA256=i._createHmacHelper(f)}(Math),t.SHA256})},{\"./core\":53}],80:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./x64-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./x64-core\"],o):o(r.CryptoJS)}(this,function(t){return function(e){var n=t,r=n.lib,o=r.WordArray,i=r.Hasher,a=n.x64.Word,s=n.algo,c=[],u=[],f=[];!function(){for(var t=1,e=0,n=0;n<24;n++){c[t+5*e]=(n+1)*(n+2)/2%64;var r=(2*t+3*e)%5;t=e%5,e=r}for(t=0;t<5;t++)for(e=0;e<5;e++)u[t+5*e]=e+(2*t+3*e)%5*5;for(var o=1,i=0;i<24;i++){for(var s=0,l=0,p=0;p<7;p++){if(1&o){var h=(1<<p)-1;h<32?l^=1<<h:s^=1<<h-32}128&o?o=o<<1^113:o<<=1}f[i]=a.create(s,l)}}();var l=[];!function(){for(var t=0;t<25;t++)l[t]=a.create()}();var p=s.SHA3=i.extend({cfg:i.cfg.extend({outputLength:512}),_doReset:function(){for(var t=this._state=[],e=0;e<25;e++)t[e]=new a.init;this.blockSize=(1600-2*this.cfg.outputLength)/32},_doProcessBlock:function(t,e){for(var n=this._state,r=this.blockSize/2,o=0;o<r;o++){var i=t[e+2*o],a=t[e+2*o+1];i=16711935&(i<<8|i>>>24)|4278255360&(i<<24|i>>>8),a=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8);(F=n[o]).high^=a,F.low^=i}for(var s=0;s<24;s++){for(var p=0;p<5;p++){for(var h=0,d=0,m=0;m<5;m++){h^=(F=n[p+5*m]).high,d^=F.low}var y=l[p];y.high=h,y.low=d}for(p=0;p<5;p++){var g=l[(p+4)%5],v=l[(p+1)%5],b=v.high,_=v.low;for(h=g.high^(b<<1|_>>>31),d=g.low^(_<<1|b>>>31),m=0;m<5;m++){(F=n[p+5*m]).high^=h,F.low^=d}}for(var w=1;w<25;w++){var x=(F=n[w]).high,k=F.low,B=c[w];if(B<32)h=x<<B|k>>>32-B,d=k<<B|x>>>32-B;else h=k<<B-32|x>>>64-B,d=x<<B-32|k>>>64-B;var S=l[u[w]];S.high=h,S.low=d}var A=l[0],C=n[0];A.high=C.high,A.low=C.low;for(p=0;p<5;p++)for(m=0;m<5;m++){var F=n[w=p+5*m],O=l[w],N=l[(p+1)%5+5*m],T=l[(p+2)%5+5*m];F.high=O.high^~N.high&T.high,F.low=O.low^~N.low&T.low}F=n[0];var I=f[s];F.high^=I.high,F.low^=I.low}},_doFinalize:function(){var t=this._data,n=t.words,r=(this._nDataBytes,8*t.sigBytes),i=32*this.blockSize;n[r>>>5]|=1<<24-r%32,n[(e.ceil((r+1)/i)*i>>>5)-1]|=128,t.sigBytes=4*n.length,this._process();for(var a=this._state,s=this.cfg.outputLength/8,c=s/8,u=[],f=0;f<c;f++){var l=a[f],p=l.high,h=l.low;p=16711935&(p<<8|p>>>24)|4278255360&(p<<24|p>>>8),h=16711935&(h<<8|h>>>24)|4278255360&(h<<24|h>>>8),u.push(h),u.push(p)}return new o.init(u,s)},clone:function(){for(var t=i.clone.call(this),e=t._state=this._state.slice(0),n=0;n<25;n++)e[n]=e[n].clone();return t}});n.SHA3=i._createHelper(p),n.HmacSHA3=i._createHmacHelper(p)}(Math),t.SHA3})},{\"./core\":53,\"./x64-core\":84}],81:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./x64-core\"),t(\"./sha512\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./x64-core\",\"./sha512\"],o):o(r.CryptoJS)}(this,function(t){return function(){var e=t,n=e.x64,r=n.Word,o=n.WordArray,i=e.algo,a=i.SHA512,s=i.SHA384=a.extend({_doReset:function(){this._hash=new o.init([new r.init(3418070365,3238371032),new r.init(1654270250,914150663),new r.init(2438529370,812702999),new r.init(355462360,4144912697),new r.init(1731405415,4290775857),new r.init(2394180231,1750603025),new r.init(3675008525,1694076839),new r.init(1203062813,3204075428)])},_doFinalize:function(){var t=a._doFinalize.call(this);return t.sigBytes-=16,t}});e.SHA384=a._createHelper(s),e.HmacSHA384=a._createHmacHelper(s)}(),t.SHA384})},{\"./core\":53,\"./sha512\":82,\"./x64-core\":84}],82:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./x64-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./x64-core\"],o):o(r.CryptoJS)}(this,function(t){return function(){function e(){return i.create.apply(i,arguments)}var n=t,r=n.lib.Hasher,o=n.x64,i=o.Word,a=o.WordArray,s=n.algo,c=[e(1116352408,3609767458),e(1899447441,602891725),e(3049323471,3964484399),e(3921009573,2173295548),e(961987163,4081628472),e(1508970993,3053834265),e(2453635748,2937671579),e(2870763221,3664609560),e(3624381080,2734883394),e(310598401,1164996542),e(607225278,1323610764),e(1426881987,3590304994),e(1925078388,4068182383),e(2162078206,991336113),e(2614888103,633803317),e(3248222580,3479774868),e(3835390401,2666613458),e(4022224774,944711139),e(264347078,2341262773),e(604807628,2007800933),e(770255983,1495990901),e(1249150122,1856431235),e(1555081692,3175218132),e(1996064986,2198950837),e(2554220882,3999719339),e(2821834349,766784016),e(2952996808,2566594879),e(3210313671,3203337956),e(3336571891,1034457026),e(3584528711,2466948901),e(113926993,3758326383),e(338241895,168717936),e(666307205,1188179964),e(773529912,1546045734),e(1294757372,1522805485),e(1396182291,2643833823),e(1695183700,2343527390),e(1986661051,1014477480),e(2177026350,1206759142),e(2456956037,344077627),e(2730485921,1290863460),e(2820302411,3158454273),e(3259730800,3505952657),e(3345764771,106217008),e(3516065817,3606008344),e(3600352804,1432725776),e(4094571909,1467031594),e(275423344,851169720),e(430227734,3100823752),e(506948616,1363258195),e(659060556,3750685593),e(883997877,3785050280),e(958139571,3318307427),e(1322822218,3812723403),e(1537002063,2003034995),e(1747873779,3602036899),e(1955562222,1575990012),e(2024104815,1125592928),e(2227730452,2716904306),e(2361852424,442776044),e(2428436474,593698344),e(2756734187,3733110249),e(3204031479,2999351573),e(3329325298,3815920427),e(3391569614,3928383900),e(3515267271,566280711),e(3940187606,3454069534),e(4118630271,4000239992),e(116418474,1914138554),e(174292421,2731055270),e(289380356,3203993006),e(460393269,320620315),e(685471733,587496836),e(852142971,1086792851),e(1017036298,365543100),e(1126000580,2618297676),e(1288033470,3409855158),e(1501505948,4234509866),e(1607167915,987167468),e(1816402316,1246189591)],u=[];!function(){for(var t=0;t<80;t++)u[t]=e()}();var f=s.SHA512=r.extend({_doReset:function(){this._hash=new a.init([new i.init(1779033703,4089235720),new i.init(3144134277,2227873595),new i.init(1013904242,4271175723),new i.init(2773480762,1595750129),new i.init(1359893119,2917565137),new i.init(2600822924,725511199),new i.init(528734635,4215389547),new i.init(1541459225,327033209)])},_doProcessBlock:function(t,e){for(var n=this._hash.words,r=n[0],o=n[1],i=n[2],a=n[3],s=n[4],f=n[5],l=n[6],p=n[7],h=r.high,d=r.low,m=o.high,y=o.low,g=i.high,v=i.low,b=a.high,_=a.low,w=s.high,x=s.low,k=f.high,B=f.low,S=l.high,A=l.low,C=p.high,F=p.low,O=h,N=d,T=m,I=y,P=g,D=v,R=b,E=_,M=w,H=x,j=k,q=B,z=S,L=A,U=C,W=F,J=0;J<80;J++){var K=u[J];if(J<16)var G=K.high=0|t[e+2*J],X=K.low=0|t[e+2*J+1];else{var $=u[J-15],V=$.high,Z=$.low,Y=(V>>>1|Z<<31)^(V>>>8|Z<<24)^V>>>7,Q=(Z>>>1|V<<31)^(Z>>>8|V<<24)^(Z>>>7|V<<25),tt=u[J-2],et=tt.high,nt=tt.low,rt=(et>>>19|nt<<13)^(et<<3|nt>>>29)^et>>>6,ot=(nt>>>19|et<<13)^(nt<<3|et>>>29)^(nt>>>6|et<<26),it=u[J-7],at=it.high,st=it.low,ct=u[J-16],ut=ct.high,ft=ct.low;G=(G=(G=Y+at+((X=Q+st)>>>0<Q>>>0?1:0))+rt+((X=X+ot)>>>0<ot>>>0?1:0))+ut+((X=X+ft)>>>0<ft>>>0?1:0);K.high=G,K.low=X}var lt,pt=M&j^~M&z,ht=H&q^~H&L,dt=O&T^O&P^T&P,mt=N&I^N&D^I&D,yt=(O>>>28|N<<4)^(O<<30|N>>>2)^(O<<25|N>>>7),gt=(N>>>28|O<<4)^(N<<30|O>>>2)^(N<<25|O>>>7),vt=(M>>>14|H<<18)^(M>>>18|H<<14)^(M<<23|H>>>9),bt=(H>>>14|M<<18)^(H>>>18|M<<14)^(H<<23|M>>>9),_t=c[J],wt=_t.high,xt=_t.low,kt=U+vt+((lt=W+bt)>>>0<W>>>0?1:0),Bt=gt+mt;U=z,W=L,z=j,L=q,j=M,q=H,M=R+(kt=(kt=(kt=kt+pt+((lt=lt+ht)>>>0<ht>>>0?1:0))+wt+((lt=lt+xt)>>>0<xt>>>0?1:0))+G+((lt=lt+X)>>>0<X>>>0?1:0))+((H=E+lt|0)>>>0<E>>>0?1:0)|0,R=P,E=D,P=T,D=I,T=O,I=N,O=kt+(yt+dt+(Bt>>>0<gt>>>0?1:0))+((N=lt+Bt|0)>>>0<lt>>>0?1:0)|0}d=r.low=d+N,r.high=h+O+(d>>>0<N>>>0?1:0),y=o.low=y+I,o.high=m+T+(y>>>0<I>>>0?1:0),v=i.low=v+D,i.high=g+P+(v>>>0<D>>>0?1:0),_=a.low=_+E,a.high=b+R+(_>>>0<E>>>0?1:0),x=s.low=x+H,s.high=w+M+(x>>>0<H>>>0?1:0),B=f.low=B+q,f.high=k+j+(B>>>0<q>>>0?1:0),A=l.low=A+L,l.high=S+z+(A>>>0<L>>>0?1:0),F=p.low=F+W,p.high=C+U+(F>>>0<W>>>0?1:0)},_doFinalize:function(){var t=this._data,e=t.words,n=8*this._nDataBytes,r=8*t.sigBytes;e[r>>>5]|=128<<24-r%32,e[30+(r+128>>>10<<5)]=Math.floor(n/4294967296),e[31+(r+128>>>10<<5)]=n,t.sigBytes=4*e.length,this._process();return this._hash.toX32()},clone:function(){var t=r.clone.call(this);return t._hash=this._hash.clone(),t},blockSize:32});n.SHA512=r._createHelper(f),n.HmacSHA512=r._createHmacHelper(f)}(),t.SHA512})},{\"./core\":53,\"./x64-core\":84}],83:[function(t,e,n){!function(r,o,i){\"object\"==typeof n?e.exports=n=o(t(\"./core\"),t(\"./enc-base64\"),t(\"./md5\"),t(\"./evpkdf\"),t(\"./cipher-core\")):\"function\"==typeof define&&define.amd?define([\"./core\",\"./enc-base64\",\"./md5\",\"./evpkdf\",\"./cipher-core\"],o):o(r.CryptoJS)}(this,function(t){return function(){function e(t,e){var n=(this._lBlock>>>t^this._rBlock)&e;this._rBlock^=n,this._lBlock^=n<<t}function n(t,e){var n=(this._rBlock>>>t^this._lBlock)&e;this._lBlock^=n,this._rBlock^=n<<t}var r=t,o=r.lib,i=o.WordArray,a=o.BlockCipher,s=r.algo,c=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4],u=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32],f=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28],l=[{0:8421888,268435456:32768,536870912:8421378,805306368:2,1073741824:512,1342177280:8421890,1610612736:8389122,1879048192:8388608,2147483648:514,2415919104:8389120,2684354560:33280,2952790016:8421376,3221225472:32770,3489660928:8388610,3758096384:0,4026531840:33282,134217728:0,402653184:8421890,671088640:33282,939524096:32768,1207959552:8421888,1476395008:512,1744830464:8421378,2013265920:2,2281701376:8389120,2550136832:33280,2818572288:8421376,3087007744:8389122,3355443200:8388610,3623878656:32770,3892314112:514,4160749568:8388608,1:32768,268435457:2,536870913:8421888,805306369:8388608,1073741825:8421378,1342177281:33280,1610612737:512,1879048193:8389122,2147483649:8421890,2415919105:8421376,2684354561:8388610,2952790017:33282,3221225473:514,3489660929:8389120,3758096385:32770,4026531841:0,134217729:8421890,402653185:8421376,671088641:8388608,939524097:512,1207959553:32768,1476395009:8388610,1744830465:2,2013265921:33282,2281701377:32770,2550136833:8389122,2818572289:514,3087007745:8421888,3355443201:8389120,3623878657:0,3892314113:33280,4160749569:8421378},{0:1074282512,16777216:16384,33554432:524288,50331648:1074266128,67108864:1073741840,83886080:1074282496,100663296:1073758208,117440512:16,134217728:540672,150994944:1073758224,167772160:1073741824,184549376:540688,201326592:524304,218103808:0,234881024:16400,251658240:1074266112,8388608:1073758208,25165824:540688,41943040:16,58720256:1073758224,75497472:1074282512,92274688:1073741824,109051904:524288,125829120:1074266128,142606336:524304,159383552:0,176160768:16384,192937984:1074266112,209715200:1073741840,226492416:540672,243269632:1074282496,260046848:16400,268435456:0,285212672:1074266128,301989888:1073758224,318767104:1074282496,335544320:1074266112,352321536:16,369098752:540688,385875968:16384,402653184:16400,419430400:524288,436207616:524304,452984832:1073741840,469762048:540672,486539264:1073758208,503316480:1073741824,520093696:1074282512,276824064:540688,293601280:524288,310378496:1074266112,327155712:16384,343932928:1073758208,360710144:1074282512,377487360:16,394264576:1073741824,411041792:1074282496,427819008:1073741840,444596224:1073758224,461373440:524304,478150656:0,494927872:16400,511705088:1074266128,528482304:540672},{0:260,1048576:0,2097152:67109120,3145728:65796,4194304:65540,5242880:67108868,6291456:67174660,7340032:67174400,8388608:67108864,9437184:67174656,10485760:65792,11534336:67174404,12582912:67109124,13631488:65536,14680064:4,15728640:256,524288:67174656,1572864:67174404,2621440:0,3670016:67109120,4718592:67108868,5767168:65536,6815744:65540,7864320:260,8912896:4,9961472:256,11010048:67174400,12058624:65796,13107200:65792,14155776:67109124,15204352:67174660,16252928:67108864,16777216:67174656,17825792:65540,18874368:65536,19922944:67109120,20971520:256,22020096:67174660,23068672:67108868,24117248:0,25165824:67109124,26214400:67108864,27262976:4,28311552:65792,29360128:67174400,30408704:260,31457280:65796,32505856:67174404,17301504:67108864,18350080:260,19398656:67174656,20447232:0,21495808:65540,22544384:67109120,23592960:256,24641536:67174404,25690112:65536,26738688:67174660,27787264:65796,28835840:67108868,29884416:67109124,30932992:67174400,31981568:4,33030144:65792},{0:2151682048,65536:2147487808,131072:4198464,196608:2151677952,262144:0,327680:4198400,393216:2147483712,458752:4194368,524288:2147483648,589824:4194304,655360:64,720896:2147487744,786432:2151678016,851968:4160,917504:4096,983040:2151682112,32768:2147487808,98304:64,163840:2151678016,229376:2147487744,294912:4198400,360448:2151682112,425984:0,491520:2151677952,557056:4096,622592:2151682048,688128:4194304,753664:4160,819200:2147483648,884736:4194368,950272:4198464,1015808:2147483712,1048576:4194368,1114112:4198400,1179648:2147483712,1245184:0,1310720:4160,1376256:2151678016,1441792:2151682048,1507328:2147487808,1572864:2151682112,1638400:2147483648,1703936:2151677952,1769472:4198464,1835008:2147487744,1900544:4194304,1966080:64,2031616:4096,1081344:2151677952,1146880:2151682112,1212416:0,1277952:4198400,1343488:4194368,1409024:2147483648,1474560:2147487808,1540096:64,1605632:2147483712,1671168:4096,1736704:2147487744,1802240:2151678016,1867776:4160,1933312:2151682048,1998848:4194304,2064384:4198464},{0:128,4096:17039360,8192:262144,12288:536870912,16384:537133184,20480:16777344,24576:553648256,28672:262272,32768:16777216,36864:537133056,40960:536871040,45056:553910400,49152:553910272,53248:0,57344:17039488,61440:553648128,2048:17039488,6144:553648256,10240:128,14336:17039360,18432:262144,22528:537133184,26624:553910272,30720:536870912,34816:537133056,38912:0,43008:553910400,47104:16777344,51200:536871040,55296:553648128,59392:16777216,63488:262272,65536:262144,69632:128,73728:536870912,77824:553648256,81920:16777344,86016:553910272,90112:537133184,94208:16777216,98304:553910400,102400:553648128,106496:17039360,110592:537133056,114688:262272,118784:536871040,122880:0,126976:17039488,67584:553648256,71680:16777216,75776:17039360,79872:537133184,83968:536870912,88064:17039488,92160:128,96256:553910272,100352:262272,104448:553910400,108544:0,112640:553648128,116736:16777344,120832:262144,124928:537133056,129024:536871040},{0:268435464,256:8192,512:270532608,768:270540808,1024:268443648,1280:2097152,1536:2097160,1792:268435456,2048:0,2304:268443656,2560:2105344,2816:8,3072:270532616,3328:2105352,3584:8200,3840:270540800,128:270532608,384:270540808,640:8,896:2097152,1152:2105352,1408:268435464,1664:268443648,1920:8200,2176:2097160,2432:8192,2688:268443656,2944:270532616,3200:0,3456:270540800,3712:2105344,3968:268435456,4096:268443648,4352:270532616,4608:270540808,4864:8200,5120:2097152,5376:268435456,5632:268435464,5888:2105344,6144:2105352,6400:0,6656:8,6912:270532608,7168:8192,7424:268443656,7680:270540800,7936:2097160,4224:8,4480:2105344,4736:2097152,4992:268435464,5248:268443648,5504:8200,5760:270540808,6016:270532608,6272:270540800,6528:270532616,6784:8192,7040:2105352,7296:2097160,7552:0,7808:268435456,8064:268443656},{0:1048576,16:33555457,32:1024,48:1049601,64:34604033,80:0,96:1,112:34603009,128:33555456,144:1048577,160:33554433,176:34604032,192:34603008,208:1025,224:1049600,240:33554432,8:34603009,24:0,40:33555457,56:34604032,72:1048576,88:33554433,104:33554432,120:1025,136:1049601,152:33555456,168:34603008,184:1048577,200:1024,216:34604033,232:1,248:1049600,256:33554432,272:1048576,288:33555457,304:34603009,320:1048577,336:33555456,352:34604032,368:1049601,384:1025,400:34604033,416:1049600,432:1,448:0,464:34603008,480:33554433,496:1024,264:1049600,280:33555457,296:34603009,312:1,328:33554432,344:1048576,360:1025,376:34604032,392:33554433,408:34603008,424:0,440:34604033,456:1049601,472:1024,488:33555456,504:1048577},{0:134219808,1:131072,2:134217728,3:32,4:131104,5:134350880,6:134350848,7:2048,8:134348800,9:134219776,10:133120,11:134348832,12:2080,13:0,14:134217760,15:133152,2147483648:2048,2147483649:134350880,2147483650:134219808,2147483651:134217728,2147483652:134348800,2147483653:133120,2147483654:133152,2147483655:32,2147483656:134217760,2147483657:2080,2147483658:131104,2147483659:134350848,2147483660:0,2147483661:134348832,2147483662:134219776,2147483663:131072,16:133152,17:134350848,18:32,19:2048,20:134219776,21:134217760,22:134348832,23:131072,24:0,25:131104,26:134348800,27:134219808,28:134350880,29:133120,30:2080,31:134217728,2147483664:131072,2147483665:2048,2147483666:134348832,2147483667:133152,2147483668:32,2147483669:134348800,2147483670:134217728,2147483671:134219808,2147483672:134350880,2147483673:134217760,2147483674:134219776,2147483675:0,2147483676:133120,2147483677:2080,2147483678:131104,2147483679:134350848}],p=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679],h=s.DES=a.extend({_doReset:function(){for(var t=this._key.words,e=[],n=0;n<56;n++){var r=c[n]-1;e[n]=t[r>>>5]>>>31-r%32&1}for(var o=this._subKeys=[],i=0;i<16;i++){var a=o[i]=[],s=f[i];for(n=0;n<24;n++)a[n/6|0]|=e[(u[n]-1+s)%28]<<31-n%6,a[4+(n/6|0)]|=e[28+(u[n+24]-1+s)%28]<<31-n%6;a[0]=a[0]<<1|a[0]>>>31;for(n=1;n<7;n++)a[n]=a[n]>>>4*(n-1)+3;a[7]=a[7]<<5|a[7]>>>27}var l=this._invSubKeys=[];for(n=0;n<16;n++)l[n]=o[15-n]},encryptBlock:function(t,e){this._doCryptBlock(t,e,this._subKeys)},decryptBlock:function(t,e){this._doCryptBlock(t,e,this._invSubKeys)},_doCryptBlock:function(t,r,o){this._lBlock=t[r],this._rBlock=t[r+1],e.call(this,4,252645135),e.call(this,16,65535),n.call(this,2,858993459),n.call(this,8,16711935),e.call(this,1,1431655765);for(var i=0;i<16;i++){for(var a=o[i],s=this._lBlock,c=this._rBlock,u=0,f=0;f<8;f++)u|=l[f][((c^a[f])&p[f])>>>0];this._lBlock=c,this._rBlock=s^u}var h=this._lBlock;this._lBlock=this._rBlock,this._rBlock=h,e.call(this,1,1431655765),n.call(this,8,16711935),n.call(this,2,858993459),e.call(this,16,65535),e.call(this,4,252645135),t[r]=this._lBlock,t[r+1]=this._rBlock},keySize:2,ivSize:2,blockSize:2});r.DES=a._createHelper(h);var d=s.TripleDES=a.extend({_doReset:function(){var t=this._key.words;this._des1=h.createEncryptor(i.create(t.slice(0,2))),this._des2=h.createEncryptor(i.create(t.slice(2,4))),this._des3=h.createEncryptor(i.create(t.slice(4,6)))},encryptBlock:function(t,e){this._des1.encryptBlock(t,e),this._des2.decryptBlock(t,e),this._des3.encryptBlock(t,e)},decryptBlock:function(t,e){this._des3.decryptBlock(t,e),this._des2.encryptBlock(t,e),this._des1.decryptBlock(t,e)},keySize:6,ivSize:2,blockSize:2});r.TripleDES=a._createHelper(d)}(),t.TripleDES})},{\"./cipher-core\":52,\"./core\":53,\"./enc-base64\":54,\"./evpkdf\":56,\"./md5\":61}],84:[function(t,e,n){!function(r,o){\"object\"==typeof n?e.exports=n=o(t(\"./core\")):\"function\"==typeof define&&define.amd?define([\"./core\"],o):o(r.CryptoJS)}(this,function(t){return function(e){var n=t,r=n.lib,o=r.Base,i=r.WordArray,a=n.x64={};a.Word=o.extend({init:function(t,e){this.high=t,this.low=e}}),a.WordArray=o.extend({init:function(t,e){t=this.words=t||[],this.sigBytes=void 0!=e?e:8*t.length},toX32:function(){for(var t=this.words,e=t.length,n=[],r=0;r<e;r++){var o=t[r];n.push(o.high),n.push(o.low)}return i.create(n,this.sigBytes)},clone:function(){for(var t=o.clone.call(this),e=t.words=this.words.slice(0),n=e.length,r=0;r<n;r++)e[r]=e[r].clone();return t}})}(),t})},{\"./core\":53}],85:[function(t,e,n){!function(t){function r(t){for(var e,n,r=[],o=0,i=t.length;o<i;)(e=t.charCodeAt(o++))>=55296&&e<=56319&&o<i?56320==(64512&(n=t.charCodeAt(o++)))?r.push(((1023&e)<<10)+(1023&n)+65536):(r.push(e),o--):r.push(e);return r}function o(t){if(t>=55296&&t<=57343)throw Error(\"Lone surrogate U+\"+t.toString(16).toUpperCase()+\" is not a scalar value\")}function i(t,e){return m(t>>e&63|128)}function a(t){if(0==(4294967168&t))return m(t);var e=\"\";return 0==(4294965248&t)?e=m(t>>6&31|192):0==(4294901760&t)?(o(t),e=m(t>>12&15|224),e+=i(t,6)):0==(4292870144&t)&&(e=m(t>>18&7|240),e+=i(t,12),e+=i(t,6)),e+=m(63&t|128)}function s(){if(d>=h)throw Error(\"Invalid byte index\");var t=255&p[d];if(d++,128==(192&t))return 63&t;throw Error(\"Invalid continuation byte\")}function c(){var t,e,n,r,i;if(d>h)throw Error(\"Invalid byte index\");if(d==h)return!1;if(t=255&p[d],d++,0==(128&t))return t;if(192==(224&t)){if(e=s(),(i=(31&t)<<6|e)>=128)return i;throw Error(\"Invalid continuation byte\")}if(224==(240&t)){if(e=s(),n=s(),(i=(15&t)<<12|e<<6|n)>=2048)return o(i),i;throw Error(\"Invalid continuation byte\")}if(240==(248&t)&&(e=s(),n=s(),r=s(),(i=(7&t)<<18|e<<12|n<<6|r)>=65536&&i<=1114111))return i;throw Error(\"Invalid UTF-8 detected\")}var u=\"object\"==typeof n&&n,f=\"object\"==typeof e&&e&&e.exports==u&&e,l=\"object\"==typeof global&&global;l.global!==l&&l.window!==l||(t=l);var p,h,d,m=String.fromCharCode,y={version:\"2.1.2\",encode:function(t){for(var e=r(t),n=e.length,o=-1,i=\"\";++o<n;)i+=a(e[o]);return i},decode:function(t){p=r(t),h=p.length,d=0;for(var e,n=[];!1!==(e=c());)n.push(e);return function(t){for(var e,n=t.length,r=-1,o=\"\";++r<n;)(e=t[r])>65535&&(o+=m((e-=65536)>>>10&1023|55296),e=56320|1023&e),o+=m(e);return o}(n)}};if(\"function\"==typeof define&&\"object\"==typeof define.amd&&define.amd)define(function(){return y});else if(u&&!u.nodeType)if(f)f.exports=y;else{var g={}.hasOwnProperty;for(var v in y)g.call(y,v)&&(u[v]=y[v])}else t.utf8=y}(this)},{}],86:[function(t,e,n){e.exports=XMLHttpRequest},{}],\"bignumber.js\":[function(t,e,n){!function(n){\"use strict\";function r(t){function e(t,r){var o,i,a,s,c,u,f=this;if(!(f instanceof e))return W&&I(26,\"constructor call without new\",t),new e(t,r);if(null!=r&&J(r,2,64,R,\"base\")){if(r|=0,u=t+\"\",10==r)return f=new e(t instanceof e?t:u),P(f,H+f.e+1,j);if((s=\"number\"==typeof t)&&0*t!=0||!new RegExp(\"^-?\"+(o=\"[\"+x.slice(0,r)+\"]+\")+\"(?:\\\\.\"+o+\")?$\",r<37?\"i\":\"\").test(u))return m(f,u,s,r);s?(f.s=1/t<0?(u=u.slice(1),-1):1,W&&u.replace(/^0\\.0*|\\./,\"\").length>15&&I(R,w,t),s=!1):f.s=45===u.charCodeAt(0)?(u=u.slice(1),-1):1,u=n(u,10,r,f.s)}else{if(t instanceof e)return f.s=t.s,f.e=t.e,f.c=(t=t.c)?t.slice():t,void(R=0);if((s=\"number\"==typeof t)&&0*t==0){if(f.s=1/t<0?(t=-t,-1):1,t===~~t){for(i=0,a=t;a>=10;a/=10,i++);return f.e=i,f.c=[t],void(R=0)}u=t+\"\"}else{if(!y.test(u=t+\"\"))return m(f,u,s);f.s=45===u.charCodeAt(0)?(u=u.slice(1),-1):1}}for((i=u.indexOf(\".\"))>-1&&(u=u.replace(\".\",\"\")),(a=u.search(/e/i))>0?(i<0&&(i=a),i+=+u.slice(a+1),u=u.substring(0,a)):i<0&&(i=u.length),a=0;48===u.charCodeAt(a);a++);for(c=u.length;48===u.charCodeAt(--c););if(u=u.slice(a,c+1))if(c=u.length,s&&W&&c>15&&I(R,w,f.s*t),(i=i-a-1)>U)f.c=f.e=null;else if(i<L)f.c=[f.e=0];else{if(f.e=i,f.c=[],a=(i+1)%B,i<0&&(a+=B),a<c){for(a&&f.c.push(+u.slice(0,a)),c-=B;a<c;)f.c.push(+u.slice(a,a+=B));u=u.slice(a),a=B-u.length}else a-=c;for(;a--;u+=\"0\");f.c.push(+u)}else f.c=[f.e=0];R=0}function n(t,n,r,o){var a,s,c,f,p,h,d,m=t.indexOf(\".\"),y=H,g=j;for(r<37&&(t=t.toLowerCase()),m>=0&&(c=X,X=0,t=t.replace(\".\",\"\"),p=(d=new e(r)).pow(t.length-m),X=c,d.c=u(l(i(p.c),p.e),10,n),d.e=d.c.length),s=c=(h=u(t,r,n)).length;0==h[--c];h.pop());if(!h[0])return\"0\";if(m<0?--s:(p.c=h,p.e=s,p.s=o,h=(p=D(p,d,y,g,n)).c,f=p.r,s=p.e),a=s+y+1,m=h[a],c=n/2,f=f||a<0||null!=h[a+1],f=g<4?(null!=m||f)&&(0==g||g==(p.s<0?3:2)):m>c||m==c&&(4==g||f||6==g&&1&h[a-1]||g==(p.s<0?8:7)),a<1||!h[0])t=f?l(\"1\",-y):\"0\";else{if(h.length=a,f)for(--n;++h[--a]>n;)h[a]=0,a||(++s,h.unshift(1));for(c=h.length;!h[--c];);for(m=0,t=\"\";m<=c;t+=x.charAt(h[m++]));t=l(t,s)}return t}function h(t,n,r,o){var a,s,c,u,p;if(r=null!=r&&J(r,0,8,o,_)?0|r:j,!t.c)return t.toString();if(a=t.c[0],c=t.e,null==n)p=i(t.c),p=19==o||24==o&&c<=q?f(p,c):l(p,c);else if(t=P(new e(t),n,r),s=t.e,p=i(t.c),u=p.length,19==o||24==o&&(n<=s||s<=q)){for(;u<n;p+=\"0\",u++);p=f(p,s)}else if(n-=c,p=l(p,s),s+1>u){if(--n>0)for(p+=\".\";n--;p+=\"0\");}else if((n+=s-u)>0)for(s+1==u&&(p+=\".\");n--;p+=\"0\");return t.s<0&&a?\"-\"+p:p}function O(t,n){var r,o,i=0;for(c(t[0])&&(t=t[0]),r=new e(t[0]);++i<t.length;){if(!(o=new e(t[i])).s){r=o;break}n.call(r,o)&&(r=o)}return r}function N(t,e,n,r,o){return(t<e||t>n||t!=p(t))&&I(r,(o||\"decimal places\")+(t<e||t>n?\" out of range\":\" not an integer\"),t),!0}function T(t,e,n){for(var r=1,o=e.length;!e[--o];e.pop());for(o=e[0];o>=10;o/=10,r++);return(n=r+n*B-1)>U?t.c=t.e=null:n<L?t.c=[t.e=0]:(t.e=n,t.c=e),t}function I(t,e,n){var r=new Error([\"new BigNumber\",\"cmp\",\"config\",\"div\",\"divToInt\",\"eq\",\"gt\",\"gte\",\"lt\",\"lte\",\"minus\",\"mod\",\"plus\",\"precision\",\"random\",\"round\",\"shift\",\"times\",\"toDigits\",\"toExponential\",\"toFixed\",\"toFormat\",\"toFraction\",\"pow\",\"toPrecision\",\"toString\",\"BigNumber\"][t]+\"() \"+e+\": \"+n);throw r.name=\"BigNumber Error\",R=0,r}function P(t,e,n,r){var o,i,a,s,c,u,f,l=t.c,p=A;if(l){t:{for(o=1,s=l[0];s>=10;s/=10,o++);if((i=e-o)<0)i+=B,a=e,f=(c=l[u=0])/p[o-a-1]%10|0;else if((u=g((i+1)/B))>=l.length){if(!r)break t;for(;l.length<=u;l.push(0));c=f=0,o=1,a=(i%=B)-B+1}else{for(c=s=l[u],o=1;s>=10;s/=10,o++);f=(a=(i%=B)-B+o)<0?0:c/p[o-a-1]%10|0}if(r=r||e<0||null!=l[u+1]||(a<0?c:c%p[o-a-1]),r=n<4?(f||r)&&(0==n||n==(t.s<0?3:2)):f>5||5==f&&(4==n||r||6==n&&(i>0?a>0?c/p[o-a]:0:l[u-1])%10&1||n==(t.s<0?8:7)),e<1||!l[0])return l.length=0,r?(e-=t.e+1,l[0]=p[e%B],t.e=-e||0):l[0]=t.e=0,t;if(0==i?(l.length=u,s=1,u--):(l.length=u+1,s=p[B-i],l[u]=a>0?v(c/p[o-a]%p[a])*s:0),r)for(;;){if(0==u){for(i=1,a=l[0];a>=10;a/=10,i++);for(a=l[0]+=s,s=1;a>=10;a/=10,s++);i!=s&&(t.e++,l[0]==k&&(l[0]=1));break}if(l[u]+=s,l[u]!=k)break;l[u--]=0,s=1}for(i=l.length;0===l[--i];l.pop());}t.e>U?t.c=t.e=null:t.e<L&&(t.c=[t.e=0])}return t}var D,R=0,E=e.prototype,M=new e(1),H=20,j=4,q=-7,z=21,L=-1e7,U=1e7,W=!0,J=N,K=!1,G=1,X=100,$={decimalSeparator:\".\",groupSeparator:\",\",groupSize:3,secondaryGroupSize:0,fractionGroupSeparator:\" \",fractionGroupSize:0};return e.another=r,e.ROUND_UP=0,e.ROUND_DOWN=1,e.ROUND_CEIL=2,e.ROUND_FLOOR=3,e.ROUND_HALF_UP=4,e.ROUND_HALF_DOWN=5,e.ROUND_HALF_EVEN=6,e.ROUND_HALF_CEIL=7,e.ROUND_HALF_FLOOR=8,e.EUCLID=9,e.config=function(){var t,e,n=0,r={},o=arguments,i=o[0],a=i&&\"object\"==typeof i?function(){if(i.hasOwnProperty(e))return null!=(t=i[e])}:function(){if(o.length>n)return null!=(t=o[n++])};return a(e=\"DECIMAL_PLACES\")&&J(t,0,F,2,e)&&(H=0|t),r[e]=H,a(e=\"ROUNDING_MODE\")&&J(t,0,8,2,e)&&(j=0|t),r[e]=j,a(e=\"EXPONENTIAL_AT\")&&(c(t)?J(t[0],-F,0,2,e)&&J(t[1],0,F,2,e)&&(q=0|t[0],z=0|t[1]):J(t,-F,F,2,e)&&(q=-(z=0|(t<0?-t:t)))),r[e]=[q,z],a(e=\"RANGE\")&&(c(t)?J(t[0],-F,-1,2,e)&&J(t[1],1,F,2,e)&&(L=0|t[0],U=0|t[1]):J(t,-F,F,2,e)&&(0|t?L=-(U=0|(t<0?-t:t)):W&&I(2,e+\" cannot be zero\",t))),r[e]=[L,U],a(e=\"ERRORS\")&&(t===!!t||1===t||0===t?(R=0,J=(W=!!t)?N:s):W&&I(2,e+b,t)),r[e]=W,a(e=\"CRYPTO\")&&(t===!!t||1===t||0===t?(K=!(!t||!d||\"object\"!=typeof d),t&&!K&&W&&I(2,\"crypto unavailable\",d)):W&&I(2,e+b,t)),r[e]=K,a(e=\"MODULO_MODE\")&&J(t,0,9,2,e)&&(G=0|t),r[e]=G,a(e=\"POW_PRECISION\")&&J(t,0,F,2,e)&&(X=0|t),r[e]=X,a(e=\"FORMAT\")&&(\"object\"==typeof t?$=t:W&&I(2,e+\" not an object\",t)),r[e]=$,r},e.max=function(){return O(arguments,E.lt)},e.min=function(){return O(arguments,E.gt)},e.random=function(){var t=9007199254740992*Math.random()&2097151?function(){return v(9007199254740992*Math.random())}:function(){return 8388608*(1073741824*Math.random()|0)+(8388608*Math.random()|0)};return function(n){var r,o,i,a,s,c=0,u=[],f=new e(M);if(n=null!=n&&J(n,0,F,14)?0|n:H,a=g(n/B),K)if(d&&d.getRandomValues){for(r=d.getRandomValues(new Uint32Array(a*=2));c<a;)(s=131072*r[c]+(r[c+1]>>>11))>=9e15?(o=d.getRandomValues(new Uint32Array(2)),r[c]=o[0],r[c+1]=o[1]):(u.push(s%1e14),c+=2);c=a/2}else if(d&&d.randomBytes){for(r=d.randomBytes(a*=7);c<a;)(s=281474976710656*(31&r[c])+1099511627776*r[c+1]+4294967296*r[c+2]+16777216*r[c+3]+(r[c+4]<<16)+(r[c+5]<<8)+r[c+6])>=9e15?d.randomBytes(7).copy(r,c):(u.push(s%1e14),c+=7);c=a/7}else W&&I(14,\"crypto unavailable\",d);if(!c)for(;c<a;)(s=t())<9e15&&(u[c++]=s%1e14);for(a=u[--c],n%=B,a&&n&&(s=A[B-n],u[c]=v(a/s)*s);0===u[c];u.pop(),c--);if(c<0)u=[i=0];else{for(i=-1;0===u[0];u.shift(),i-=B);for(c=1,s=u[0];s>=10;s/=10,c++);c<B&&(i-=B-c)}return f.e=i,f.c=u,f}}(),D=function(){function t(t,e,n){var r,o,i,a,s=0,c=t.length,u=e%C,f=e/C|0;for(t=t.slice();c--;)s=((o=u*(i=t[c]%C)+(r=f*i+(a=t[c]/C|0)*u)%C*C+s)/n|0)+(r/C|0)+f*a,t[c]=o%n;return s&&t.unshift(s),t}function n(t,e,n,r){var o,i;if(n!=r)i=n>r?1:-1;else for(o=i=0;o<n;o++)if(t[o]!=e[o]){i=t[o]>e[o]?1:-1;break}return i}function r(t,e,n,r){for(var o=0;n--;)t[n]-=o,o=t[n]<e[n]?1:0,t[n]=o*r+t[n]-e[n];for(;!t[0]&&t.length>1;t.shift());}return function(i,a,s,c,u){var f,l,p,h,d,m,y,g,b,_,w,x,S,A,C,F,O,N=i.s==a.s?1:-1,T=i.c,I=a.c;if(!(T&&T[0]&&I&&I[0]))return new e(i.s&&a.s&&(T?!I||T[0]!=I[0]:I)?T&&0==T[0]||!I?0*N:N/0:NaN);for(b=(g=new e(N)).c=[],N=s+(l=i.e-a.e)+1,u||(u=k,l=o(i.e/B)-o(a.e/B),N=N/B|0),p=0;I[p]==(T[p]||0);p++);if(I[p]>(T[p]||0)&&l--,N<0)b.push(1),h=!0;else{for(A=T.length,F=I.length,p=0,N+=2,(d=v(u/(I[0]+1)))>1&&(I=t(I,d,u),T=t(T,d,u),F=I.length,A=T.length),S=F,w=(_=T.slice(0,F)).length;w<F;_[w++]=0);(O=I.slice()).unshift(0),C=I[0],I[1]>=u/2&&C++;do{if(d=0,(f=n(I,_,F,w))<0){if(x=_[0],F!=w&&(x=x*u+(_[1]||0)),(d=v(x/C))>1)for(d>=u&&(d=u-1),y=(m=t(I,d,u)).length,w=_.length;1==n(m,_,y,w);)d--,r(m,F<y?O:I,y,u),y=m.length,f=1;else 0==d&&(f=d=1),y=(m=I.slice()).length;if(y<w&&m.unshift(0),r(_,m,w,u),w=_.length,-1==f)for(;n(I,_,F,w)<1;)d++,r(_,F<w?O:I,w,u),w=_.length}else 0===f&&(d++,_=[0]);b[p++]=d,_[0]?_[w++]=T[S]||0:(_=[T[S]],w=1)}while((S++<A||null!=_[0])&&N--);h=null!=_[0],b[0]||b.shift()}if(u==k){for(p=1,N=b[0];N>=10;N/=10,p++);P(g,s+(g.e=p+l*B-1)+1,c,h)}else g.e=l,g.r=+h;return g}}(),m=function(){var t=/^(-?)0([xbo])/i,n=/^([^.]+)\\.$/,r=/^\\.([^.]+)$/,o=/^-?(Infinity|NaN)$/,i=/^\\s*\\+|^\\s+|\\s+$/g;return function(a,s,c,u){var f,l=c?s:s.replace(i,\"\");if(o.test(l))a.s=isNaN(l)?null:l<0?-1:1;else{if(!c&&(l=l.replace(t,function(t,e,n){return f=\"x\"==(n=n.toLowerCase())?16:\"b\"==n?2:8,u&&u!=f?t:e}),u&&(f=u,l=l.replace(n,\"$1\").replace(r,\"0.$1\")),s!=l))return new e(l,f);W&&I(R,\"not a\"+(u?\" base \"+u:\"\")+\" number\",s),a.s=null}a.c=a.e=null,R=0}}(),E.absoluteValue=E.abs=function(){var t=new e(this);return t.s<0&&(t.s=1),t},E.ceil=function(){return P(new e(this),this.e+1,2)},E.comparedTo=E.cmp=function(t,n){return R=1,a(this,new e(t,n))},E.decimalPlaces=E.dp=function(){var t,e,n=this.c;if(!n)return null;if(t=((e=n.length-1)-o(this.e/B))*B,e=n[e])for(;e%10==0;e/=10,t--);return t<0&&(t=0),t},E.dividedBy=E.div=function(t,n){return R=3,D(this,new e(t,n),H,j)},E.dividedToIntegerBy=E.divToInt=function(t,n){return R=4,D(this,new e(t,n),0,1)},E.equals=E.eq=function(t,n){return R=5,0===a(this,new e(t,n))},E.floor=function(){return P(new e(this),this.e+1,3)},E.greaterThan=E.gt=function(t,n){return R=6,a(this,new e(t,n))>0},E.greaterThanOrEqualTo=E.gte=function(t,n){return R=7,1===(n=a(this,new e(t,n)))||0===n},E.isFinite=function(){return!!this.c},E.isInteger=E.isInt=function(){return!!this.c&&o(this.e/B)>this.c.length-2},E.isNaN=function(){return!this.s},E.isNegative=E.isNeg=function(){return this.s<0},E.isZero=function(){return!!this.c&&0==this.c[0]},E.lessThan=E.lt=function(t,n){return R=8,a(this,new e(t,n))<0},E.lessThanOrEqualTo=E.lte=function(t,n){return R=9,-1===(n=a(this,new e(t,n)))||0===n},E.minus=E.sub=function(t,n){var r,i,a,s,c=this.s;if(R=10,t=new e(t,n),n=t.s,!c||!n)return new e(NaN);if(c!=n)return t.s=-n,this.plus(t);var u=this.e/B,f=t.e/B,l=this.c,p=t.c;if(!u||!f){if(!l||!p)return l?(t.s=-n,t):new e(p?this:NaN);if(!l[0]||!p[0])return p[0]?(t.s=-n,t):new e(l[0]?this:3==j?-0:0)}if(u=o(u),f=o(f),l=l.slice(),c=u-f){for((s=c<0)?(c=-c,a=l):(f=u,a=p),a.reverse(),n=c;n--;a.push(0));a.reverse()}else for(i=(s=(c=l.length)<(n=p.length))?c:n,c=n=0;n<i;n++)if(l[n]!=p[n]){s=l[n]<p[n];break}if(s&&(a=l,l=p,p=a,t.s=-t.s),(n=(i=p.length)-(r=l.length))>0)for(;n--;l[r++]=0);for(n=k-1;i>c;){if(l[--i]<p[i]){for(r=i;r&&!l[--r];l[r]=n);--l[r],l[i]+=k}l[i]-=p[i]}for(;0==l[0];l.shift(),--f);return l[0]?T(t,l,f):(t.s=3==j?-1:1,t.c=[t.e=0],t)},E.modulo=E.mod=function(t,n){var r,o;return R=11,t=new e(t,n),!this.c||!t.s||t.c&&!t.c[0]?new e(NaN):!t.c||this.c&&!this.c[0]?new e(this):(9==G?(o=t.s,t.s=1,r=D(this,t,0,3),t.s=o,r.s*=o):r=D(this,t,0,G),this.minus(r.times(t)))},E.negated=E.neg=function(){var t=new e(this);return t.s=-t.s||null,t},E.plus=E.add=function(t,n){var r,i=this.s;if(R=12,t=new e(t,n),n=t.s,!i||!n)return new e(NaN);if(i!=n)return t.s=-n,this.minus(t);var a=this.e/B,s=t.e/B,c=this.c,u=t.c;if(!a||!s){if(!c||!u)return new e(i/0);if(!c[0]||!u[0])return u[0]?t:new e(c[0]?this:0*i)}if(a=o(a),s=o(s),c=c.slice(),i=a-s){for(i>0?(s=a,r=u):(i=-i,r=c),r.reverse();i--;r.push(0));r.reverse()}for((i=c.length)-(n=u.length)<0&&(r=u,u=c,c=r,n=i),i=0;n;)i=(c[--n]=c[n]+u[n]+i)/k|0,c[n]%=k;return i&&(c.unshift(i),++s),T(t,c,s)},E.precision=E.sd=function(t){var e,n,r=this.c;if(null!=t&&t!==!!t&&1!==t&&0!==t&&(W&&I(13,\"argument\"+b,t),t!=!!t&&(t=null)),!r)return null;if(n=r.length-1,e=n*B+1,n=r[n]){for(;n%10==0;n/=10,e--);for(n=r[0];n>=10;n/=10,e++);}return t&&this.e+1>e&&(e=this.e+1),e},E.round=function(t,n){var r=new e(this);return(null==t||J(t,0,F,15))&&P(r,~~t+this.e+1,null!=n&&J(n,0,8,15,_)?0|n:j),r},E.shift=function(t){return J(t,-S,S,16,\"argument\")?this.times(\"1e\"+p(t)):new e(this.c&&this.c[0]&&(t<-S||t>S)?this.s*(t<0?0:1/0):this)},E.squareRoot=E.sqrt=function(){var t,n,r,a,s,c=this.c,u=this.s,f=this.e,l=H+4,p=new e(\"0.5\");if(1!==u||!c||!c[0])return new e(!u||u<0&&(!c||c[0])?NaN:c?this:1/0);if(0==(u=Math.sqrt(+this))||u==1/0?(((n=i(c)).length+f)%2==0&&(n+=\"0\"),u=Math.sqrt(n),f=o((f+1)/2)-(f<0||f%2),r=new e(n=u==1/0?\"1e\"+f:(n=u.toExponential()).slice(0,n.indexOf(\"e\")+1)+f)):r=new e(u+\"\"),r.c[0])for((u=(f=r.e)+l)<3&&(u=0);;)if(s=r,r=p.times(s.plus(D(this,s,l,1))),i(s.c).slice(0,u)===(n=i(r.c)).slice(0,u)){if(r.e<f&&--u,\"9999\"!=(n=n.slice(u-3,u+1))&&(a||\"4999\"!=n)){+n&&(+n.slice(1)||\"5\"!=n.charAt(0))||(P(r,r.e+H+2,1),t=!r.times(r).eq(this));break}if(!a&&(P(s,s.e+H+2,0),s.times(s).eq(this))){r=s;break}l+=4,u+=4,a=1}return P(r,r.e+H+1,j,t)},E.times=E.mul=function(t,n){var r,i,a,s,c,u,f,l,p,h,d,m,y,g,v,b=this.c,_=(R=17,t=new e(t,n)).c;if(!(b&&_&&b[0]&&_[0]))return!this.s||!t.s||b&&!b[0]&&!_||_&&!_[0]&&!b?t.c=t.e=t.s=null:(t.s*=this.s,b&&_?(t.c=[0],t.e=0):t.c=t.e=null),t;for(i=o(this.e/B)+o(t.e/B),t.s*=this.s,(f=b.length)<(h=_.length)&&(y=b,b=_,_=y,a=f,f=h,h=a),a=f+h,y=[];a--;y.push(0));for(g=k,v=C,a=h;--a>=0;){for(r=0,d=_[a]%v,m=_[a]/v|0,s=a+(c=f);s>a;)r=((l=d*(l=b[--c]%v)+(u=m*l+(p=b[c]/v|0)*d)%v*v+y[s]+r)/g|0)+(u/v|0)+m*p,y[s--]=l%g;y[s]=r}return r?++i:y.shift(),T(t,y,i)},E.toDigits=function(t,n){var r=new e(this);return t=null!=t&&J(t,1,F,18,\"precision\")?0|t:null,n=null!=n&&J(n,0,8,18,_)?0|n:j,t?P(r,t,n):r},E.toExponential=function(t,e){return h(this,null!=t&&J(t,0,F,19)?1+~~t:null,e,19)},E.toFixed=function(t,e){return h(this,null!=t&&J(t,0,F,20)?~~t+this.e+1:null,e,20)},E.toFormat=function(t,e){var n=h(this,null!=t&&J(t,0,F,21)?~~t+this.e+1:null,e,21);if(this.c){var r,o=n.split(\".\"),i=+$.groupSize,a=+$.secondaryGroupSize,s=$.groupSeparator,c=o[0],u=o[1],f=this.s<0,l=f?c.slice(1):c,p=l.length;if(a&&(r=i,i=a,a=r,p-=r),i>0&&p>0){for(r=p%i||i,c=l.substr(0,r);r<p;r+=i)c+=s+l.substr(r,i);a>0&&(c+=s+l.slice(r)),f&&(c=\"-\"+c)}n=u?c+$.decimalSeparator+((a=+$.fractionGroupSize)?u.replace(new RegExp(\"\\\\d{\"+a+\"}\\\\B\",\"g\"),\"$&\"+$.fractionGroupSeparator):u):c}return n},E.toFraction=function(t){var n,r,o,a,s,c,u,f,l,p=W,h=this.c,d=new e(M),m=r=new e(M),y=u=new e(M);if(null!=t&&(W=!1,c=new e(t),W=p,(p=c.isInt())&&!c.lt(M)||(W&&I(22,\"max denominator \"+(p?\"out of range\":\"not an integer\"),t),t=!p&&c.c&&P(c,c.e+1,1).gte(M)?c:null)),!h)return this.toString();for(l=i(h),a=d.e=l.length-this.e-1,d.c[0]=A[(s=a%B)<0?B+s:s],t=!t||c.cmp(d)>0?a>0?d:m:c,s=U,U=1/0,c=new e(l),u.c[0]=0;f=D(c,d,0,1),1!=(o=r.plus(f.times(y))).cmp(t);)r=y,y=o,m=u.plus(f.times(o=m)),u=o,d=c.minus(f.times(o=d)),c=o;return o=D(t.minus(r),y,0,1),u=u.plus(o.times(m)),r=r.plus(o.times(y)),u.s=m.s=this.s,a*=2,n=D(m,y,a,j).minus(this).abs().cmp(D(u,r,a,j).minus(this).abs())<1?[m.toString(),y.toString()]:[u.toString(),r.toString()],U=s,n},E.toNumber=function(){return+this||(this.s?0*this.s:NaN)},E.toPower=E.pow=function(t){var n,r,o=v(t<0?-t:+t),i=this;if(!J(t,-S,S,23,\"exponent\")&&(!isFinite(t)||o>S&&(t/=0)||parseFloat(t)!=t&&!(t=NaN)))return new e(Math.pow(+i,t));for(n=X?g(X/B+2):0,r=new e(M);;){if(o%2){if(!(r=r.times(i)).c)break;n&&r.c.length>n&&(r.c.length=n)}if(!(o=v(o/2)))break;i=i.times(i),n&&i.c&&i.c.length>n&&(i.c.length=n)}return t<0&&(r=M.div(r)),n?P(r,X,j):r},E.toPrecision=function(t,e){return h(this,null!=t&&J(t,1,F,24,\"precision\")?0|t:null,e,24)},E.toString=function(t){var e,r=this.s,o=this.e;return null===o?r?(e=\"Infinity\",r<0&&(e=\"-\"+e)):e=\"NaN\":(e=i(this.c),e=null!=t&&J(t,2,64,25,\"base\")?n(l(e,o),0|t,10,r):o<=q||o>=z?f(e,o):l(e,o),r<0&&this.c[0]&&(e=\"-\"+e)),e},E.truncated=E.trunc=function(){return P(new e(this),this.e+1,1)},E.valueOf=E.toJSON=function(){return this.toString()},null!=t&&e.config(t),e}function o(t){var e=0|t;return t>0||t===e?e:e-1}function i(t){for(var e,n,r=1,o=t.length,i=t[0]+\"\";r<o;){for(e=t[r++]+\"\",n=B-e.length;n--;e=\"0\"+e);i+=e}for(o=i.length;48===i.charCodeAt(--o););return i.slice(0,o+1||1)}function a(t,e){var n,r,o=t.c,i=e.c,a=t.s,s=e.s,c=t.e,u=e.e;if(!a||!s)return null;if(n=o&&!o[0],r=i&&!i[0],n||r)return n?r?0:-s:a;if(a!=s)return a;if(n=a<0,r=c==u,!o||!i)return r?0:!o^n?1:-1;if(!r)return c>u^n?1:-1;for(s=(c=o.length)<(u=i.length)?c:u,a=0;a<s;a++)if(o[a]!=i[a])return o[a]>i[a]^n?1:-1;return c==u?0:c>u^n?1:-1}function s(t,e,n){return(t=p(t))>=e&&t<=n}function c(t){return\"[object Array]\"==Object.prototype.toString.call(t)}function u(t,e,n){for(var r,o,i=[0],a=0,s=t.length;a<s;){for(o=i.length;o--;i[o]*=e);for(i[r=0]+=x.indexOf(t.charAt(a++));r<i.length;r++)i[r]>n-1&&(null==i[r+1]&&(i[r+1]=0),i[r+1]+=i[r]/n|0,i[r]%=n)}return i.reverse()}function f(t,e){return(t.length>1?t.charAt(0)+\".\"+t.slice(1):t)+(e<0?\"e\":\"e+\")+e}function l(t,e){var n,r;if(e<0){for(r=\"0.\";++e;r+=\"0\");t=r+t}else if(n=t.length,++e>n){for(r=\"0\",e-=n;--e;r+=\"0\");t+=r}else e<n&&(t=t.slice(0,e)+\".\"+t.slice(e));return t}function p(t){return(t=parseFloat(t))<0?g(t):v(t)}var h,d,m,y=/^-?(\\d+(\\.\\d*)?|\\.\\d+)(e[+-]?\\d+)?$/i,g=Math.ceil,v=Math.floor,b=\" not a boolean or binary digit\",_=\"rounding mode\",w=\"number type has more than 15 significant digits\",x=\"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_\",k=1e14,B=14,S=9007199254740991,A=[1,10,100,1e3,1e4,1e5,1e6,1e7,1e8,1e9,1e10,1e11,1e12,1e13],C=1e7,F=1e9;if(h=r(),\"function\"==typeof define&&define.amd)define(function(){return h});else if(void 0!==e&&e.exports){if(e.exports=h,!d)try{d=t(\"crypto\")}catch(t){}}else n.BigNumber=h}(this)},{crypto:50}],web3:[function(t,e,n){var r=t(\"./lib/web3\");\"undefined\"!=typeof window&&void 0===window.Web3&&(window.Web3=r),e.exports=r},{\"./lib/web3\":22}]},{},[\"web3\"]);\n}).call(this,typeof global !== \"undefined\" ? global : typeof self !== \"undefined\" ? self : typeof window !== \"undefined\" ? window : {},_dereq_(\"buffer\").Buffer)\n\n},{\"buffer\":24}],171:[function(_dereq_,module,exports){\n// Returns a wrapper function that returns a wrapped callback\n// The wrapper function should do some stuff, and return a\n// presumably different callback function.\n// This makes sure that own properties are retained, so that\n// decorations and such are not lost along the way.\nmodule.exports = wrappy\nfunction wrappy (fn, cb) {\n  if (fn && cb) return wrappy(fn)(cb)\n\n  if (typeof fn !== 'function')\n    throw new TypeError('need wrapper function')\n\n  Object.keys(fn).forEach(function (k) {\n    wrapper[k] = fn[k]\n  })\n\n  return wrapper\n\n  function wrapper() {\n    var args = new Array(arguments.length)\n    for (var i = 0; i < args.length; i++) {\n      args[i] = arguments[i]\n    }\n    var ret = fn.apply(this, args)\n    var cb = args[args.length-1]\n    if (typeof ret === 'function' && ret !== cb) {\n      Object.keys(cb).forEach(function (k) {\n        ret[k] = cb[k]\n      })\n    }\n    return ret\n  }\n}\n\n},{}],172:[function(_dereq_,module,exports){\nmodule.exports = extend\n\nvar hasOwnProperty = Object.prototype.hasOwnProperty;\n\nfunction extend() {\n    var target = {}\n\n    for (var i = 0; i < arguments.length; i++) {\n        var source = arguments[i]\n\n        for (var key in source) {\n            if (hasOwnProperty.call(source, key)) {\n                target[key] = source[key]\n            }\n        }\n    }\n\n    return target\n}\n\n},{}]},{},[1])\n\n//# sourceMappingURL=../sourcemaps/inpage.js.map\n".toString();
var inpageSuffix = '//# sourceURL=' + extension.extension.getURL('inpage.js') + '\n';
var inpageBundle = inpageContent + inpageSuffix;

// Eventually this streaming injection could be replaced with:
// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Language_Bindings/Components.utils.exportFunction
//
// But for now that is only Firefox
// If we create a FireFox-only code path using that API,
// MetaMask will be much faster loading and performant on Firefox.

if (shouldInjectWeb3()) {
  setupInjection();
  setupStreams();
}

/**
 * Creates a script tag that injects inpage.js
 */
function setupInjection() {
  try {
    // inject in-page script
    var scriptTag = document.createElement('script');
    scriptTag.textContent = inpageBundle;
    scriptTag.onload = function () {
      this.parentNode.removeChild(this);
    };
    var container = document.head || document.documentElement;
    // append as first child
    container.insertBefore(scriptTag, container.children[0]);
  } catch (e) {
    console.error('DefiMask injection failed.', e);
  }
}

/**
 * Sets up two-way communication streams between the
 * browser extension and local per-page browser context
 */
function setupStreams() {
  // setup communication to page and plugin
  var pageStream = new LocalMessageDuplexStream({
    name: 'nifty-contentscript',
    target: 'nifty-inpage'
  });
  var pluginPort = extension.runtime.connect({ name: 'contentscript' });
  var pluginStream = new PortStream(pluginPort);

  // forward communication plugin->inpage
  pump(pageStream, pluginStream, pageStream, function (err) {
    return logStreamDisconnectWarning('DefiMask Contentscript Forwarding', err);
  });

  // setup local multistream channels
  var mux = new ObjectMultiplex();
  mux.setMaxListeners(25);

  pump(mux, pageStream, mux, function (err) {
    return logStreamDisconnectWarning('DefiMask Inpage', err);
  });
  pump(mux, pluginStream, mux, function (err) {
    return logStreamDisconnectWarning('DefiMask Background', err);
  });

  // connect ping stream
  var pongStream = new PongStream({ objectMode: true });
  pump(mux, pongStream, mux, function (err) {
    return logStreamDisconnectWarning('DefiMask PingPongStream', err);
  });

  // connect phishing warning stream
  var phishingStream = mux.createStream('phishing');
  phishingStream.once('data', redirectToPhishingWarning);

  // ignore unused channels (handled by background, inpage)
  mux.ignoreStream('provider');
  mux.ignoreStream('publicConfig');
}

/**
 * Error handler for page to plugin stream disconnections
 *
 * @param {string} remoteLabel Remote stream name
 * @param {Error} err Stream connection error
 */
function logStreamDisconnectWarning(remoteLabel, err) {
  var warningMsg = 'MetamaskContentscript - lost connection to ' + remoteLabel;
  if (err) warningMsg += '\n' + err.stack;
  console.warn(warningMsg);
}

/**
 * Determines if Web3 should be injected
 *
 * @returns {boolean} {@code true} if Web3 should be injected
 */
function shouldInjectWeb3() {
  return doctypeCheck() && suffixCheck() && documentElementCheck() && !blacklistedDomainCheck();
}

/**
 * Checks the doctype of the current document if it exists
 *
 * @returns {boolean} {@code true} if the doctype is html or if none exists
 */
function doctypeCheck() {
  var doctype = window.document.doctype;
  if (doctype) {
    return doctype.name === 'html';
  } else {
    return true;
  }
}

/**
 * Returns whether or not the extension (suffix) of the current document is prohibited
 *
 * This checks {@code window.location.pathname} against a set of file extensions
 * that should not have web3 injected into them. This check is indifferent of query parameters
 * in the location.
 *
 * @returns {boolean} whether or not the extension of the current document is prohibited
 */
function suffixCheck() {
  var prohibitedTypes = [/\.xml$/, /\.pdf$/];
  var currentUrl = window.location.pathname;
  for (var i = 0; i < prohibitedTypes.length; i++) {
    if (prohibitedTypes[i].test(currentUrl)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks the documentElement of the current document
 *
 * @returns {boolean} {@code true} if the documentElement is an html node or if none exists
 */
function documentElementCheck() {
  var documentElement = document.documentElement.nodeName;
  if (documentElement) {
    return documentElement.toLowerCase() === 'html';
  }
  return true;
}

/**
 * Checks if the current domain is blacklisted
 *
 * @returns {boolean} {@code true} if the current domain is blacklisted
 */
function blacklistedDomainCheck() {
  var blacklistedDomains = ['uscourts.gov', 'dropbox.com', 'webbyawards.com', 'cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html', 'adyen.com', 'gravityforms.com', 'harbourair.com', 'ani.gamer.com.tw', 'blueskybooking.com'];
  var currentUrl = window.location.href;
  var currentRegex;
  for (var i = 0; i < blacklistedDomains.length; i++) {
    var blacklistedDomain = blacklistedDomains[i].replace('.', '\\.');
    currentRegex = new RegExp('(?:https?:\\/\\/)(?:(?!' + blacklistedDomain + ').)*$');
    if (!currentRegex.test(currentUrl)) {
      return true;
    }
  }
  return false;
}

/**
 * Redirects the current page to a phishing information page
 */
function redirectToPhishingWarning() {
  console.log('DefiMask - routing to Phishing Warning component');
  var extensionURL = extension.runtime.getURL('phishing.html');
  window.location.href = extensionURL + '#' + querystring.stringify({
    hostname: window.location.hostname,
    href: window.location.href
  });
}


},{"extension-port-stream":9,"extensionizer":22,"obj-multiplex":27,"path":29,"ping-pong-stream/pong":30,"post-message-stream":31,"pump":33,"querystring":36}],2:[function(_dereq_,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],3:[function(_dereq_,module,exports){

},{}],4:[function(_dereq_,module,exports){
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

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
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
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
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
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
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

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],5:[function(_dereq_,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],6:[function(_dereq_,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = _dereq_('base64-js')
var ieee754 = _dereq_('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  get: function () {
    if (!(this instanceof Buffer)) {
      return undefined
    }
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  get: function () {
    if (!(this instanceof Buffer)) {
      return undefined
    }
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value) || (value && isArrayBuffer(value.buffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (ArrayBuffer.isView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (ArrayBuffer.isView(buf)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isArrayBuffer(string)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
function isArrayBuffer (obj) {
  return obj instanceof ArrayBuffer ||
    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
      typeof obj.byteLength === 'number')
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":2,"ieee754":23}],7:[function(_dereq_,module,exports){
(function (Buffer){
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

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":_dereq_("../../is-buffer/index.js")})

},{"../../is-buffer/index.js":25}],8:[function(_dereq_,module,exports){
var once = _dereq_('once');

var noop = function() {};

var isRequest = function(stream) {
	return stream.setHeader && typeof stream.abort === 'function';
};

var isChildProcess = function(stream) {
	return stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3
};

var eos = function(stream, opts, callback) {
	if (typeof opts === 'function') return eos(stream, null, opts);
	if (!opts) opts = {};

	callback = once(callback || noop);

	var ws = stream._writableState;
	var rs = stream._readableState;
	var readable = opts.readable || (opts.readable !== false && stream.readable);
	var writable = opts.writable || (opts.writable !== false && stream.writable);

	var onlegacyfinish = function() {
		if (!stream.writable) onfinish();
	};

	var onfinish = function() {
		writable = false;
		if (!readable) callback.call(stream);
	};

	var onend = function() {
		readable = false;
		if (!writable) callback.call(stream);
	};

	var onexit = function(exitCode) {
		callback.call(stream, exitCode ? new Error('exited with error code: ' + exitCode) : null);
	};

	var onclose = function() {
		if (readable && !(rs && rs.ended)) return callback.call(stream, new Error('premature close'));
		if (writable && !(ws && ws.ended)) return callback.call(stream, new Error('premature close'));
	};

	var onrequest = function() {
		stream.req.on('finish', onfinish);
	};

	if (isRequest(stream)) {
		stream.on('complete', onfinish);
		stream.on('abort', onclose);
		if (stream.req) onrequest();
		else stream.on('request', onrequest);
	} else if (writable && !ws) { // legacy streams
		stream.on('end', onlegacyfinish);
		stream.on('close', onlegacyfinish);
	}

	if (isChildProcess(stream)) stream.on('exit', onexit);

	stream.on('end', onend);
	stream.on('finish', onfinish);
	if (opts.error !== false) stream.on('error', callback);
	stream.on('close', onclose);

	return function() {
		stream.removeListener('complete', onfinish);
		stream.removeListener('abort', onclose);
		stream.removeListener('request', onrequest);
		if (stream.req) stream.req.removeListener('finish', onfinish);
		stream.removeListener('end', onlegacyfinish);
		stream.removeListener('close', onlegacyfinish);
		stream.removeListener('finish', onfinish);
		stream.removeListener('exit', onexit);
		stream.removeListener('end', onend);
		stream.removeListener('error', callback);
		stream.removeListener('close', onclose);
	};
};

module.exports = eos;

},{"once":28}],9:[function(_dereq_,module,exports){
(function (Buffer){
const Duplex = _dereq_('readable-stream').Duplex
const inherits = _dereq_('util').inherits
const noop = function () {}

module.exports = PortDuplexStream

inherits(PortDuplexStream, Duplex)

/**
 * Creates a stream that's both readable and writable.
 * The stream supports arbitrary objects.
 *
 * @class
 * @param {Object} port Remote Port object
 */
function PortDuplexStream (port) {
  Duplex.call(this, {
    objectMode: true,
  })
  this._port = port
  port.onMessage.addListener(this._onMessage.bind(this))
  port.onDisconnect.addListener(this._onDisconnect.bind(this))
}

/**
 * Callback triggered when a message is received from
 * the remote Port associated with this Stream.
 *
 * @private
 * @param {Object} msg - Payload from the onMessage listener of Port
 */
PortDuplexStream.prototype._onMessage = function (msg) {
  if (Buffer.isBuffer(msg)) {
    delete msg._isBuffer
    var data = new Buffer(msg)
    this.push(data)
  } else {
    this.push(msg)
  }
}

/**
 * Callback triggered when the remote Port
 * associated with this Stream disconnects.
 *
 * @private
 */
PortDuplexStream.prototype._onDisconnect = function () {
  this.destroy()
}

/**
 * Explicitly sets read operations to a no-op
 */
PortDuplexStream.prototype._read = noop


/**
 * Called internally when data should be written to
 * this writable stream.
 *
 * @private
 * @param {*} msg Arbitrary object to write
 * @param {string} encoding Encoding to use when writing payload
 * @param {Function} cb Called when writing is complete or an error occurs
 */
PortDuplexStream.prototype._write = function (msg, encoding, cb) {
  try {
    if (Buffer.isBuffer(msg)) {
      var data = msg.toJSON()
      data._isBuffer = true
      this._port.postMessage(data)
    } else {
      this._port.postMessage(msg)
    }
  } catch (err) {
    return cb(new Error('PortDuplexStream - disconnected'))
  }
  cb()
}
}).call(this,_dereq_("buffer").Buffer)

},{"buffer":6,"readable-stream":19,"util":53}],10:[function(_dereq_,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,_dereq_('_process'))

},{"_process":5}],11:[function(_dereq_,module,exports){
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

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

var Readable = _dereq_('./_stream_readable');
var Writable = _dereq_('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"./_stream_readable":13,"./_stream_writable":15,"core-util-is":7,"inherits":24,"process-nextick-args":10}],12:[function(_dereq_,module,exports){
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

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = _dereq_('./_stream_transform');

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":14,"core-util-is":7,"inherits":24}],13:[function(_dereq_,module,exports){
(function (process,global){
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

'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = _dereq_('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = _dereq_('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = _dereq_('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = _dereq_('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = _dereq_('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = _dereq_('./internal/streams/BufferList');
var destroyImpl = _dereq_('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = _dereq_('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = _dereq_('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./_stream_duplex":11,"./internal/streams/BufferList":16,"./internal/streams/destroy":17,"./internal/streams/stream":18,"_process":5,"core-util-is":7,"events":4,"inherits":24,"isarray":26,"process-nextick-args":10,"safe-buffer":46,"string_decoder/":20,"util":3}],14:[function(_dereq_,module,exports){
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

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = _dereq_('./_stream_duplex');

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":11,"core-util-is":7,"inherits":24}],15:[function(_dereq_,module,exports){
(function (process,global,setImmediate){
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

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: _dereq_('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = _dereq_('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = _dereq_('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = _dereq_('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("timers").setImmediate)

},{"./_stream_duplex":11,"./internal/streams/destroy":17,"./internal/streams/stream":18,"_process":5,"core-util-is":7,"inherits":24,"process-nextick-args":10,"safe-buffer":46,"timers":48,"util-deprecate":50}],16:[function(_dereq_,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = _dereq_('safe-buffer').Buffer;
var util = _dereq_('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":46,"util":3}],17:[function(_dereq_,module,exports){
'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":10}],18:[function(_dereq_,module,exports){
module.exports = _dereq_('events').EventEmitter;

},{"events":4}],19:[function(_dereq_,module,exports){
exports = module.exports = _dereq_('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = _dereq_('./lib/_stream_writable.js');
exports.Duplex = _dereq_('./lib/_stream_duplex.js');
exports.Transform = _dereq_('./lib/_stream_transform.js');
exports.PassThrough = _dereq_('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":11,"./lib/_stream_passthrough.js":12,"./lib/_stream_readable.js":13,"./lib/_stream_transform.js":14,"./lib/_stream_writable.js":15}],20:[function(_dereq_,module,exports){
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

'use strict';

/*<replacement>*/

var Buffer = _dereq_('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":46}],21:[function(_dereq_,module,exports){
const apis = [
  'alarms',
  'bookmarks',
  'browserAction',
  'commands',
  'contextMenus',
  'cookies',
  'downloads',
  'events',
  'extension',
  'extensionTypes',
  'history',
  'i18n',
  'idle',
  'notifications',
  'pageAction',
  'runtime',
  'storage',
  'tabs',
  'webNavigation',
  'webRequest',
  'windows',
]

const hasChrome = typeof chrome !== 'undefined'
const hasWindow = typeof window !== 'undefined'
const hasBrowser = typeof browser !== 'undefined'

function Extension () {
  const _this = this

  apis.forEach(function (api) {

    _this[api] = null

    if (hasChrome) {
      try {
        if (chrome[api]) {
          _this[api] = chrome[api]
        }
      } catch (e) {
      }
    }

    if (hasWindow) {
      try {
        if (window[api]) {
          _this[api] = window[api]
        }
      } catch (e) {
      }
    }

    if (hasBrowser) {
      try {
        if (browser[api]) {
          _this[api] = browser[api]
        }
      } catch (e) {
      }
      try {
        _this.api = browser.extension[api]
      } catch (e) {
      }
    }
  })

  if (hasBrowser) {
    try {
      if (browser && browser.runtime) {
        this.runtime = browser.runtime
      }
    } catch (e) {
    }

    try {
      if (browser && browser.browserAction) {
        this.browserAction = browser.browserAction
      }
    } catch (e) {
    }
  }

}

module.exports = Extension

},{}],22:[function(_dereq_,module,exports){
/* Extension.js
 *
 * A module for unifying browser differences in the WebExtension API.
 *
 * Initially implemented because Chrome hides all of their WebExtension API
 * behind a global `chrome` variable, but we'd like to start grooming
 * the code-base for cross-browser extension support.
 *
 * You can read more about the WebExtension API here:
 * https://developer.mozilla.org/en-US/Add-ons/WebExtensions
 */

const Extension = _dereq_('./extension-instance')
module.exports = new Extension()

},{"./extension-instance":21}],23:[function(_dereq_,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],24:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],25:[function(_dereq_,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],26:[function(_dereq_,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],27:[function(_dereq_,module,exports){
const { Duplex } = _dereq_('readable-stream')
const endOfStream = _dereq_('end-of-stream')
const once = _dereq_('once')
const noop = () => {}

const IGNORE_SUBSTREAM = {}


class ObjectMultiplex extends Duplex {

  constructor(_opts = {}) {
    const opts = Object.assign({}, _opts, {
      objectMode: true,
    })
    super(opts)

    this._substreams = {}
  }

  createStream (name) {
    // validate name
    if (!name) throw new Error('ObjectMultiplex - name must not be empty')
    if (this._substreams[name]) throw new Error('ObjectMultiplex - Substream for name "${name}" already exists')

    // create substream
    const substream = new Substream({ parent: this, name: name })
    this._substreams[name] = substream

    // listen for parent stream to end
    anyStreamEnd(this, (err) => {
      substream.destroy(err)
    })

    return substream
  }

  // ignore streams (dont display orphaned data warning)
  ignoreStream (name) {
    // validate name
    if (!name) throw new Error('ObjectMultiplex - name must not be empty')
    if (this._substreams[name]) throw new Error('ObjectMultiplex - Substream for name "${name}" already exists')
    // set
    this._substreams[name] = IGNORE_SUBSTREAM
  }

  // stream plumbing

  _read () {}

  _write(chunk, encoding, callback) {
    // parse message
    const name = chunk.name
    const data = chunk.data
    if (!name) {
      console.warn(`ObjectMultiplex - malformed chunk without name "${chunk}"`)
      return callback()
    }

    // get corresponding substream
    const substream = this._substreams[name]
    if (!substream) {
      console.warn(`ObjectMultiplex - orphaned data for stream "${name}"`)
      return callback()
    }

    // push data into substream
    if (substream !== IGNORE_SUBSTREAM) {
      substream.push(data)
    }

    callback()
  }

}


class Substream extends Duplex {

  constructor ({ parent, name }) {
    super({
      objectMode: true,
    })

    this._parent = parent
    this._name = name
  }

  _read () {}

  _write (chunk, enc, callback) {
    this._parent.push({
      name: this._name,
      data: chunk,
    })
    callback()
  }

}

module.exports = ObjectMultiplex

// util

function anyStreamEnd(stream, _cb) {
  const cb = once(_cb)
  endOfStream(stream, { readable: false }, cb)
  endOfStream(stream, { writable: false }, cb)
}
},{"end-of-stream":8,"once":28,"readable-stream":45}],28:[function(_dereq_,module,exports){
var wrappy = _dereq_('wrappy')
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}

},{"wrappy":54}],29:[function(_dereq_,module,exports){
(function (process){
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

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,_dereq_('_process'))

},{"_process":5}],30:[function(_dereq_,module,exports){
const Duplex = _dereq_('readable-stream').Duplex
const inherits = _dereq_('util').inherits

module.exports = PongStream

inherits(PongStream, Duplex)

function PongStream (opts) {
  const self = this
  opts = opts || {}
  Duplex.call(this, opts)
  self._heartbeatRequest = opts.heartbeatRequest || 'ping'
  self._heartbeatResponse = opts.heartbeatResponse || 'pong'
}

// private

PongStream.prototype._sendResponse = function (msg) {
  const self = this
  self.push(self._heartbeatResponse)
}

// stream plumbing

PongStream.prototype._read = noop

PongStream.prototype._write = function (msg, encoding, cb) {
  const self = this
  if (msg.toString() === self._heartbeatRequest.toString()) {
    // heartbeat heard
    self._sendResponse()
    cb()
  } else {
    // unknown message
    cb(new Error('PongStream - unknown request'))
  }
  
}

// util

function noop() {}
},{"readable-stream":45,"util":53}],31:[function(_dereq_,module,exports){
const DuplexStream = _dereq_('readable-stream').Duplex
const inherits = _dereq_('util').inherits

module.exports = PostMessageStream

inherits(PostMessageStream, DuplexStream)

function PostMessageStream (opts) {
  DuplexStream.call(this, {
    objectMode: true,
  })

  this._name = opts.name
  this._target = opts.target
  this._targetWindow = opts.targetWindow || window
  this._origin = (opts.targetWindow ? '*' : location.origin)

  // initialization flags
  this._init = false
  this._haveSyn = false

  window.addEventListener('message', this._onMessage.bind(this), false)
  // send syncorization message
  this._write('SYN', null, noop)
  this.cork()
}

// private
PostMessageStream.prototype._onMessage = function (event) {
  var msg = event.data

  // validate message
  if (this._origin !== '*' && event.origin !== this._origin) return
  if (event.source !== this._targetWindow) return
  if (typeof msg !== 'object') return
  if (msg.target !== this._name) return
  if (!msg.data) return

  if (!this._init) {
    if (msg.data === 'SYN') {
      this._haveSyn = true
      this._write('ACK', null, noop)
    } else if (msg.data === 'ACK') {
      this._init = true
      if (!this._haveSyn) {
        this._write('ACK', null, noop)
      }
      this.uncork()
    }
  } else {
    // forward message
    try {
      this.push(msg.data)
    } catch (err) {
      this.emit('error', err)
    }
  }
}

// stream plumbing
PostMessageStream.prototype._read = noop

PostMessageStream.prototype._write = function (data, encoding, cb) {
  var message = {
    target: this._target,
    data: data,
  }
  this._targetWindow.postMessage(message, this._origin)
  cb()
}

// util

function noop () {}

},{"readable-stream":45,"util":53}],32:[function(_dereq_,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}

}).call(this,_dereq_('_process'))

},{"_process":5}],33:[function(_dereq_,module,exports){
(function (process){
var once = _dereq_('once')
var eos = _dereq_('end-of-stream')
var fs = _dereq_('fs') // we only need fs to get the ReadStream and WriteStream prototypes

var noop = function () {}
var ancient = /^v?\.0/.test(process.version)

var isFn = function (fn) {
  return typeof fn === 'function'
}

var isFS = function (stream) {
  if (!ancient) return false // newer node version do not need to care about fs is a special way
  if (!fs) return false // browser
  return (stream instanceof (fs.ReadStream || noop) || stream instanceof (fs.WriteStream || noop)) && isFn(stream.close)
}

var isRequest = function (stream) {
  return stream.setHeader && isFn(stream.abort)
}

var destroyer = function (stream, reading, writing, callback) {
  callback = once(callback)

  var closed = false
  stream.on('close', function () {
    closed = true
  })

  eos(stream, {readable: reading, writable: writing}, function (err) {
    if (err) return callback(err)
    closed = true
    callback()
  })

  var destroyed = false
  return function (err) {
    if (closed) return
    if (destroyed) return
    destroyed = true

    if (isFS(stream)) return stream.close(noop) // use close for fs streams to avoid fd leaks
    if (isRequest(stream)) return stream.abort() // request.destroy just do .end - .abort is what we want

    if (isFn(stream.destroy)) return stream.destroy()

    callback(err || new Error('stream was destroyed'))
  }
}

var call = function (fn) {
  fn()
}

var pipe = function (from, to) {
  return from.pipe(to)
}

var pump = function () {
  var streams = Array.prototype.slice.call(arguments)
  var callback = isFn(streams[streams.length - 1] || noop) && streams.pop() || noop

  if (Array.isArray(streams[0])) streams = streams[0]
  if (streams.length < 2) throw new Error('pump requires two streams per minimum')

  var error
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1
    var writing = i > 0
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err
      if (err) destroys.forEach(call)
      if (reading) return
      destroys.forEach(call)
      callback(error)
    })
  })

  return streams.reduce(pipe)
}

module.exports = pump

}).call(this,_dereq_('_process'))

},{"_process":5,"end-of-stream":8,"fs":3,"once":28}],34:[function(_dereq_,module,exports){
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

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],35:[function(_dereq_,module,exports){
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

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],36:[function(_dereq_,module,exports){
'use strict';

exports.decode = exports.parse = _dereq_('./decode');
exports.encode = exports.stringify = _dereq_('./encode');

},{"./decode":34,"./encode":35}],37:[function(_dereq_,module,exports){
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

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var processNextTick = _dereq_('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

var Readable = _dereq_('./_stream_readable');
var Writable = _dereq_('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  processNextTick(cb, err);
};

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}
},{"./_stream_readable":39,"./_stream_writable":41,"core-util-is":7,"inherits":24,"process-nextick-args":32}],38:[function(_dereq_,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"./_stream_transform":40,"core-util-is":7,"dup":12,"inherits":24}],39:[function(_dereq_,module,exports){
(function (process,global){
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

'use strict';

/*<replacement>*/

var processNextTick = _dereq_('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = _dereq_('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = _dereq_('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = _dereq_('./internal/streams/stream');
/*</replacement>*/

// TODO(bmeurer): Change this back to const once hole checks are
// properly optimized away early in Ignition+TurboFan.
/*<replacement>*/
var Buffer = _dereq_('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
/*</replacement>*/

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = _dereq_('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = _dereq_('./internal/streams/BufferList');
var destroyImpl = _dereq_('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') {
    return emitter.prependListener(event, fn);
  } else {
    // This is a hack to make sure that our error handler is attached before any
    // userland ones.  NEVER DO THIS. This is here only because this code needs
    // to continue to work with older versions of Node.js that do not include
    // the prependListener() method. The goal is to eventually remove this hack.
    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
  }
}

function ReadableState(options, stream) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = _dereq_('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = _dereq_('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], self.emit.bind(self, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./_stream_duplex":37,"./internal/streams/BufferList":42,"./internal/streams/destroy":43,"./internal/streams/stream":44,"_process":5,"core-util-is":7,"events":4,"inherits":24,"isarray":26,"process-nextick-args":32,"safe-buffer":46,"string_decoder/":47,"util":3}],40:[function(_dereq_,module,exports){
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

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = _dereq_('./_stream_duplex');

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function TransformState(stream) {
  this.afterTransform = function (er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
  this.writeencoding = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return stream.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined) stream.push(data);

  cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er, data) {
      done(stream, er, data);
    });else done(stream);
  });
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data !== null && data !== undefined) stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('Calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":37,"core-util-is":7,"inherits":24}],41:[function(_dereq_,module,exports){
(function (process,global,setImmediate){
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

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var processNextTick = _dereq_('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: _dereq_('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = _dereq_('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/
var Buffer = _dereq_('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
/*</replacement>*/

var destroyImpl = _dereq_('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = _isUint8Array(chunk) && !state.objectMode;

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    processNextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    processNextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequestCount = 0;
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      processNextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("timers").setImmediate)

},{"./_stream_duplex":37,"./internal/streams/destroy":43,"./internal/streams/stream":44,"_process":5,"core-util-is":7,"inherits":24,"process-nextick-args":32,"safe-buffer":46,"timers":48,"util-deprecate":50}],42:[function(_dereq_,module,exports){
'use strict';

/*<replacement>*/

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = _dereq_('safe-buffer').Buffer;
/*</replacement>*/

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();
},{"safe-buffer":46}],43:[function(_dereq_,module,exports){
'use strict';

/*<replacement>*/

var processNextTick = _dereq_('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      processNextTick(emitErrorNT, this, err);
    }
    return;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      processNextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":32}],44:[function(_dereq_,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"events":4}],45:[function(_dereq_,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./lib/_stream_duplex.js":37,"./lib/_stream_passthrough.js":38,"./lib/_stream_readable.js":39,"./lib/_stream_transform.js":40,"./lib/_stream_writable.js":41,"dup":19}],46:[function(_dereq_,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = _dereq_('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":6}],47:[function(_dereq_,module,exports){
'use strict';

var Buffer = _dereq_('safe-buffer').Buffer;

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return -1;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// UTF-8 replacement characters ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd'.repeat(p);
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd'.repeat(p + 1);
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd'.repeat(p + 2);
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character for each buffered byte of a (partial)
// character needs to be added to the output.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd'.repeat(this.lastTotal - this.lastNeed);
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":46}],48:[function(_dereq_,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = _dereq_('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,_dereq_("timers").setImmediate,_dereq_("timers").clearImmediate)

},{"process/browser.js":49,"timers":48}],49:[function(_dereq_,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],50:[function(_dereq_,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],51:[function(_dereq_,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24}],52:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],53:[function(_dereq_,module,exports){
(function (process,global){
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

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":52,"_process":5,"inherits":51}],54:[function(_dereq_,module,exports){
// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}

},{}]},{},[1])

//# sourceMappingURL=../sourcemaps/contentscript.js.map
