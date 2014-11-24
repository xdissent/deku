
/**
 * Expose `PatchStream`.
 */

module.exports = PatchStream;

/**
 * Initialize a new `PatchStream`.
 *
 * This will get the computed diff of updates for a component.
 *
 * @param {Component} component
 */

function PatchStream(component) {
  this.component = component;
  this.queue = [];
}

/**
 * Push patch into queue.
 *
 * @param {Object} patch
 */

PatchStream.prototype.push = function(patch){
  this.queue.push(patch);
};

/**
 * Pipe changes to node stream.
 *
 * @param {NodeStream} nodes
 */

PatchStream.prototype.pipe = function(nodes){
  var component = this.component;
  this.on('data', function(state){
    var node = component.render(state);
    nodes.push(node);
  });
};
