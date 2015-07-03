/**
 * Dependencies
 */

var slice = require('sliced')
var assign = require('fast.js/object/assign')

/**
 * The npm 'defaults' module but without cloning and with
 * support for multiple sources of `defaults`.
 *
 * @param {Object} options
 * @param {Object} defaults
 *
 * @return {Object}
 */

exports.defaults = function(options, defaults) {
  if (arguments.length > 2) {
    var sources = slice(arguments, 1).reverse()
    defaults = assign.apply(null, [{}].concat(sources))
  }

  Object.keys(defaults).forEach(function(key) {
    if (typeof options[key] === 'undefined') {
      options[key] = defaults[key]
    }
  })
  return options
}

/**
 * Create a new object composed of picked `src` properties,
 * mapped to new propertie names using `map`.
 *
 * @param  {Object} map Property map
 * @param  {Object} src Source object
 * @return {Object}
 */

exports.pickMap = function(map, src) {
  var dest = {}
  for (var key in map) {
    dest[key] = src[map[key]]
  }
  return dest
}

/**
 * Determine the type of node, which may be `text`, `element`, or `component`.
 * Functions and objects with a non-string `type` property are considered
 * components, objects with a string `type` property are elements, and the rest
 * are text.
 *
 * @param {Node} node
 *
 * @return {String}
 */

exports.nodeType = function(node) {
  if (node == null || Array.isArray(node)) throw new Error('Invalid node')
  if (typeof node !== 'object' && typeof node !== 'function') return 'text'
  if (typeof node.type === 'string') return 'element'
  return 'component'
}
