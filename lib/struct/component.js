
/**
 * Module dependencies.
 */

var dom = require('virtualize').node;

/**
 * Expose `Component`.
 */

module.exports = Component;

/**
 * A component is a stateful virtual dom element.
 *
 * @api public
 */

var id = 1;
function Component(opts) {
  if (!(this instanceof Component)) return new Component(opts);
  this.props = {};
  this.options = {};
  this.id = (++id).toString(16);
  if ('function' == typeof opts) {
    this.template = opts;
  } else if (opts) {
    this.template = opts.render;
    if (opts.props) this.props = opt.props;
  }
}

/**
 * Use plugin.
 *
 * @param {Function|Object} plugin Passing an object will extend the prototype.
 * @return {Component}
 * @api public
 */

Component.prototype.use = function(plugin){
  if ('function' === typeof plugin) {
    plugin(this);
  } else {
    for (var k in plugin) this[k] = plugin[k];
  }
  return this;
};

/**
 * Define a property
 *
 * @param {String} name
 * @param {Object} options
 */

Component.prototype.prop = function(name, options){
  this.props[name] = options;
  return this;
};

/**
 * Set an option
 *
 * @param {String} name
 * @param {*} value
 */

Component.prototype.set = function(name, value){
  this.options[name] = value;
  return this;
};

/**
 * Render template.
 */

Component.prototype.render = function(props){
  return this.template(props);
};
