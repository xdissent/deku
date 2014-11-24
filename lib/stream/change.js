
/**
 * Expose `ChangeStream`.
 */

module.exports = ChangeStream;

/**
 * Initialize a new `ChangeStream`.
 *
 * This is just a queue holding the changes for a component.
 * It gets passed into the rendering queue.
 *
 * @param {Component} component
 */

function ChangeStream(component) {
  this.component = component;
  this.queue = [];
}

/**
 * Push changes into queue.
 *
 * @param {Object} changes
 */

ChangeStream.prototype.push = function(changes){
  this.queue.push(changes);
};

/**
 * Pipe changes to top-level rendering coordinator stream.
 *
 * @param {RenderStream} renderer
 */

ChangeStream.prototype.pipe = function(renderer){
  var component = this.component;
  this.on('data', function(changes){
    renderer.push({
      component: component,
      changes: changes
    });
  });
};
