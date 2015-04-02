
/**
 * Expose `Value`.
 */

module.exports = Value;

/**
 * Initialize a new `Value`.
 *
 * Really this is the last object of a stream,
 * or the computed subset of objects.
 *
 * It's a functional-esque value. You shouldn't have
 * to think about it ever in userland.
 *
 * This object may turn out to be the same thing as the `IO` object.
 *
 * Essentially this is all optimization.
 * We're building a data structure to use to both
 * act as a dsl for definiting "immutable" transducers,
 * and also be used as a "description" for the IO network.
 */

var id = 1;
function Value(type, parent, input) {
  // it's a top-level value if..
  if (!(this instanceof Value)) return new Value(type, parent, input);
  this.parent = parent;
  this.input = input;
  this.type = type;
  this.id = (++id).toString(16);
}

Value.prototype.map = function(fn){
  return new Value('map', this, fn);
};

Value.prototype.filter = function(fn){
  return new Value('filter', this, fn);
};

Value.prototype.interval = function(ms){
  // TODO: this is really sort of a composition of two or maybe more values.
  return new Value('interval', this, ms);
};

Value.prototype.defaultTo = function(value){
  return Value('default', this, defaultTo(value));
};

Value.prototype.equal = function(key, val){
  return new Value('equal', this, equal(key, val));
};

function equal(key, val) {
  var getter = key;
  if ('function' != typeof getter) {
    getter = function(data){
      return data[key];
    };
  }
  return function(data){
    return val === getter(data);
  };
}

function defaultTo(value) {
  return function(data, key) {
    if (null == data[key]) return value;
    return data[key];
  };
}
