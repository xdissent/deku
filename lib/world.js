
/**
 * Module dependencies.
 */

var Emitter = require('tiny-emitter');

/**
 * Expose `World`.
 */

module.exports = World;

/**
 * Initialize a new `World`.
 */

function World() {
  if (!(this instanceof World)) return new World;
  Emitter.call(this);
  this.subscriptions = {};
  this.components = {}; // registered components
  this.sources = {}; // registered io sources
  this.network = {}; // dataflow network, a graph of IO nodes.
  this.values = {}; // values components pull from Source `sources`.
}

/**
 * Mixin `Emitter`.
 */

World.prototype = new Emitter;

/**
 * Add a plugin
 *
 * @param {Function} plugin
 */

World.prototype.use = function(plugin){
  plugin(this);
  return this;
};

/**
 * Add `Source` stream.
 *
 * @param {String} name
 * @param {Function} fn
 * @api public
 */

World.prototype.source = function(name, fn){
  this.sources[name] = fn;
  fn(this); // subscribe!
  return this;
};

/**
 * Add `Value` stream.
 */

World.prototype.value = function(value){
  this.values[value.name] = value;
  return this;
};

/**
 * Send data into dataflow pipeline.
 */

World.prototype.send = function(type, data){
  this.emit(type, data);
};

/**
 * Mount component to element in the dom.
 */

World.prototype.mount = function(component, properties, element){
  this.send('mount component', {
    properties: properties,
    component: component,
    element: element
  });
};
