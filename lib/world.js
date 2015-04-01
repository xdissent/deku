
/**
 * Module dependencies.
 */

var Emitter = require('component/emitter');
var IO = require('./struct/io');

/**
 * Expose `World`.
 */

module.exports = World;

/**
 * Initialize a new `World`.
 */

function World() {
  if (!(this instanceof World)) return new World;
  this.components = {}; // registered components
  this.sources = {}; // registered io sources
  this.values = {}; // values components pull from IO `sources`.
}

/**
 * Mixin `Emitter`.
 */

Emitter(World.prototype);

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
 * Add `IO` stream.
 *
 * @param {String} name
 * @param {Function} fn
 * @api public
 */

World.prototype.io = function(name, fn){
  this.sources[name] = IO(name, fn);
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

/**
 * Stringify world.
 *
 * Render to string.
 */

World.prototype.stringify = function(){
  var promise = new Promise;
  this.send('stringify', {}, promise);
  return promise.value();
};
