
/**
 * Expose `IO`.
 */

module.exports = IO;

/**
 * Data flow IO.
 */

var id = 1;
function IO(name) {
  if (!(this instanceof IO)) return new IO(name);
  this.property = name;
  this.inputs = {};
  this.id = (++id).toString(16);
}

/**
 * Potential DSL.
 */

IO.prototype.input = function(name, type){
  // TODO: use `Value` chain to build a function for collecting input
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

IO.prototype.send = function(name, data){
  var id = this.id;
  this.values[name] = data;
  // TODO: check if all inputs are met, handle multiple inputs before outputting.
  this.world.send('update value', {
    data: data
    id: id
  });
  this.values = {}; // reset data.
  // }
};
