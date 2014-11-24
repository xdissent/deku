
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

function diff(component, prev, next) {
  var self = this;

  // changes have already been rendered. if they haven't
  // we'll make sure we cancel any frames currently queue
  // to prevent multiple renders.
  if (!this.dirty) return;
  raf.cancel(this.dirty);
  this.dirty = false;

  // when we're done updating.
  function done() {
    self.emit('flush');
  }

  var nextProps = this._pendingProps;
  var nextState = this.instance._pendingState;
  var shouldUpdate = this.instance.shouldUpdate(this.state, this.props, nextState, nextProps);

  // check the component.
  if (!force && !shouldUpdate) return done();

  // pre-update.
  this.trigger('beforeUpdate', [
    this.state,
    this.props,
    nextState,
    nextProps
  ]);

  // merge in the changes.
  var previousState = this.state;
  var previousProps = this.props;
  this.state = assign({}, this.state, this.instance._pendingState);
  this.props = this._pendingProps || this.props;

  // reset.
  this.instance._pendingState = false;
  this._pendingProps = false;

  // render the current state.
  this.previous = this.current;
  this.current = this.render();

  // update the element to match.
  this.diff();

  // unset previous so we don't keep it in memory.
  this.previous = null;

  // post-update.
  this.trigger('afterUpdate', [
    this.state,
    this.props,
    previousState,
    previousProps
  ]);

  // trigger all callbacks
  done();
}
