/**
 * Dependencies.
 */

var slice = require('sliced')


/**
 * Render scenes to the DOM.
 */

if (typeof document !== 'undefined') {
  exports.render = require('./render')
}

/**
 * Render scenes to a string
 */

exports.renderString = require('./stringify')

/**
 * Create virtual elements.
 */

exports.element =
exports.createElement =
exports.dom = require('./virtual')

/**
 * Wrap `inspect` and `remove` renderer functions for containers.
 */

function wrapContainerFn (container, name, fn) {
  if (container && container.__deku__ && container.__deku__[name])
    fn = container.__deku__[name]
  return fn.apply(undefined, slice(arguments, 3))
}

exports.inspect = function (container) {
  return wrapContainerFn(container, 'inspect', function () {
    return {
      entities: {},
      pools: {},
      handlers: {},
      currentElement: null,
      options: null,
      container: container,
      children: {}
    }
  })
}

exports.remove = function (container) {
  return wrapContainerFn(container, 'remove', function () {})
}
