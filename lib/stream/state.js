
/**
 * Expose `StateStream`.
 */

module.exports = StateStream;

/**
 * Initialize a new `StateStream`.
 *
 * This is just a queue holding the new/pending state for a component.
 * It gets called by the rendering queue.
 *
 * @param {Component} component
 */

function StateStream(component) {
  this.component = component;
  this.queue = [];
}

/**
 * Push state into queue.
 *
 * @param {Object} state
 */

StateStream.prototype.push = function(state){
  this.queue.push(state);
};

/**
 * Pipe changes to node stream.
 *
 * @param {NodeStream} nodes
 */

StateStream.prototype.pipe = function(nodes){
  var component = this.component;
  this.on('data', function(state){
    var node = component.render(state); // `state` would include everything, including properties perhaps, or you could have both
    nodes.push(node);
  });
};
