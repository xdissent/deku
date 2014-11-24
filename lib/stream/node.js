
/**
 * Expose `NodeStream`.
 */

module.exports = NodeStream;

/**
 * Initialize a new `NodeStream`.
 *
 * This will get pushed the next virtual dom tree for a component,
 * which happens when a new state is pushed to the state queue.
 *
 * @param {Component} component
 */

function NodeStream(component) {
  this.component = component;
  this.queue = [];
}

/**
 * Push virtual dom tree into queue.
 *
 * @param {Object} node
 */

NodeStream.prototype.push = function(node){
  this.queue.push(node);
};

/**
 * Pipe to patch stream.
 *
 * @param {Object} patches
 */

NodeStream.prototype.pipe = function(patches){
  var component = this.component;
  this.on('data', function(next){
    var prev = component._prev; // some way of keeping track.
    var patch = diff(prev, next);
    patches.push(patch);
  });
};
