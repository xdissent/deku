
/**
 * Expose `IO`.
 */

module.exports = IO;

/**
 * Data flow IO.
 */

function IO(type, subscribe) {
  if (!(this instanceof IO)) return new IO(type, fn);
  this.subscribe = subscribe;
  this.inputs = {};
  this.type = type; // output property name.
}

/**
 * Potential DSL.
 */

IO.prototype.input = function(name, type){
  this.inputs[name] = true;
  return;
};

/**
 * Send input values to this `IO` node.
 *
 * Once all inputs are satisfied, the
 * dataflow / io engine will notify the world.
 * The world will then find all the other IO nodes
 * that receive this IO node as input. It does this
 * by looking up output connections by its `id`.
 */

IO.prototype.send = function(input, data){
  this.data[input] = data;
  if (all inputs met) {
    this.world.send('update io', this.id, this.data);
    this.data = {}; // reset data.
  }
};
