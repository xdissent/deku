
/**
 * Expose `DirtyStream`.
 */

module.exports = DirtyStream;

/**
 * Initialize a new `DirtyStream`.
 *
 * This is basically like a cursor (from om) or property in bacon,
 * or an input stream.
 */

function DirtyStream() {
  this.queue = [];
  this.streams = {}; // state streams?
}

/**
 * Push patch into queue.
 *
 * @param {Object} patch
 */

DirtyStream.prototype.push = function(changes){
  this.queue.push(patch);
  this.process();
};

/**
 * Pipe changes *that actually need to take effect* to state stream.
 *
 * That part, calculating what changes need to take effect, requires
 * figuring out which components in the tree are going to be re-rendered
 * in this animation frame. That way, if a child and parent both have changes,
 * we only re-render the parent (because it will re-render the child).
 *
 * @param {NodeStream} nodes
 */

DirtyStream.prototype.pipe = function(states){
  var streams = this.streams;
  streams[states.component.id] = states;

  this.on('data', function(dirty){
    var actual = [];

    dirty.forEach(function(updates){
      var component = updates.component;
      var changes = updates.changes;
      // TODO: figure out which components, like above describes.
      actual.push(updates);
    });

    actual.forEach(function(updates){
      var component = updates.component;
      var changes = updates.changes;
      var state = component.cloneStateWithChanges(changes);
      // push state into stream specific for that component,
      // similar ot how with websockets you would emit message based on
      // user id.
      var stream = streams[component.id];
      stream.push(state);
    });
  });
};

/**
 * Process everything on the next tick, which is just to clear the stack.
 */

DirtyStream.prototype.process = function(){
  if (this.timer) return;
  var self = this;
  this.timer = setTimeout(function(){
    delete this.timer;
    self.emit('data', self.queue);
  });
};
