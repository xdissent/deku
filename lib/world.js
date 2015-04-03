
/**
 * Module dependencies.
 */

var Emitter = require('tiny-emitter');
var io = require('./io');

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
  this.network = {}; // dataflow network, a graph of IO nodes.
  this.options = {};
  this.sources = {}; // registered io sources
  this.values = {}; // values components pull from Source `sources`.
  this.rootIndex = 0;
  this.use(io);
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
 * TODO: This is temporary until get the tests all passing.
 *
 * @param {String|Integer} path Defaults to 0 for api sugar.
 */

World.prototype.update = function(path, data){
  if (1 == arguments.length) {
    this.emit('update component', 0, path);
  } else {
    this.emit('update component', path, data);
  }
};

/**
 * Set global world options.
 */

World.prototype.set = function(key, val){
  this.options[key] = val;
  return this;
};

/**
 * Mount component to element in the dom.
 */

World.prototype.mount = function(element, component, properties){
  var path = this.rootIndex.toString(16);
  this.rootIndex++;
  this.send('mount component', {
    properties: properties || {},
    component: component,
    element: element,
    path: path
  });
};
