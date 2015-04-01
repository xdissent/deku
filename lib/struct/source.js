
/**
 * Expose `Source`.
 */

module.exports = Source;

/**
 * Data flow Source.
 */

function Source(type, subscribe) {
  if (!(this instanceof Source)) return new Source(type, fn);
  this.subscribe = subscribe;
  this.inputs = {};
  this.type = type; // output property name.
}

/**
 * Potential DSL.
 */

Source.prototype.input = function(name, type){
  this.inputs[name] = true;
  return;
};

/**
 * Send input values to this `Source` node.
 *
 * Once all inputs are satisfied, the
 * dataflow / io engine will notify the world.
 * The world will then find all the other Source nodes
 * that receive this Source node as input. It does this
 * by looking up output connections by its `id`.
 */

Source.prototype.send = function(input, data){
  this.data[input] = data;
  if (all inputs met) {
    this.world.send('update io', this.id, this.data);
    this.data = {}; // reset data.
  }
};
