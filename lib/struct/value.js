
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

function Value(type, parent, input) {
  // it's a top-level value if..
  if (!(this instanceof Value)) return new Value(type, parent, input);
  this.parent = parent;
  this.input = input;
  this.type = type;
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
