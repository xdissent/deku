
/**
 * Module dependencies.
 */

var StringRenderer = require('../renderer/string');
var assign = require('sindresorhus/object-assign');
var toString = require('../renderer/string');
var Entity = require('../entity');
var Scene = require('../scene');

/**
 * Browser dependencies.
 */

if (typeof window !== 'undefined') {
  var HTMLRenderer = require('../renderer/html');
}

/**
 * Use plugin.
 *
 * @param {Function|Object} plugin Passing an object will extend the prototype.
 * @return {Component}
 * @api public
 */

exports.use = function(plugin){
  if ('function' === typeof plugin) {
    plugin(this);
  } else {
    assign(this.prototype, plugin);
  }
  return this;
};

/**
 * Mount this component to a node. Only available
 * in the browser as it requires the DOM.
 *
 * @param {HTMLElement} container
 * @param {Object} props
 */

exports.render = function(container, props){
  if (!HTMLRenderer) throw new Error('You can only render to a node in the browser. Use renderString instead.');
  var renderer = new HTMLRenderer(container);
  var entity = new Entity(this, props);
  var scene = new Scene(renderer, entity);
  return scene;
};

/**
 * Render this component to a string.
 *
 * @param {Object} props
 */

exports.renderString = function(props){
  var renderer = new StringRenderer();
  var entity = new Entity(this, props);
  return renderer.render(entity);
};
