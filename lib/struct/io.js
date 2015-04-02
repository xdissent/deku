
/**
 * Expose `IO`.
 */

module.exports = IO;

/**
 * Data flow IO.
 */

var id = 1;
function IO(name, fn) {
  if (!(this instanceof IO)) return new IO(name);
  this.property = name || 'input'; // TODO: figure out single/multiple inputs
  this.id = (++id).toString(16);
  this.fn = fn; // transducer function
}

/**
 * Send input values to this `IO` node.
 *
 * Once all inputs are satisfied, the
 * dataflow / io engine will notify the world.
 * The world will then find all the other IO nodes
 * that receive this IO node as input. It does this
 * by looking up output connections by its `id`.
 */

IO.prototype.send = function(data){
  // TODO: apply transformation somehow.
  this.emit('change', data);
};

/**
 * Pipe changes to another node.
 */

IO.prototype.pipe = function(next){
  this.on('change', function(data){
    next.send(data);
  });
};
