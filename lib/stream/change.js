
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
  this.process();
};

/**
 * Pipe changes to top-level dirty coordinator stream.
 *
 * @param {DirtyStream} dirty
 */

ChangeStream.prototype.pipe = function(dirty){
  var component = this.component;
  this.on('data', function(changes){
    dirty.push({
      component: component,
      changes: changes
    });
  });
};

/**
 * Process queue.
 */

ChangeStream.prototype.process = function(){
  if (this.dirty) return;
  var self = this;
  this.dirty = raf(function(){
    delete this.dirty;
    while (queue.length) self.emit('data', queue.shift());
  });
};
