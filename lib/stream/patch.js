
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
 * Pipe patches to top-level renderer.
 *
 * @param {NodeStream} renderer
 */

PatchStream.prototype.pipe = function(renderer){
  var component = this.component;
  this.on('data', function(patch){
    renderer.push(patch);
  });
};
