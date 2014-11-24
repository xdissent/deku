
/**
 * Module dependencies.
 */

var assign = require('sindresorhus/object-assign');
var equal = require('jkroso/equals');

/**
 * Set properties on `this.state`.
 *
 * @param {Object} state State to merge with existing state.
 */

exports.setState = function(state){
  this.changes.push(state);
};

/**
 * Default render. Renders a noscript tag by
 * default so nothing shows up in the DOM.
 *
 * @param {node} dom
 * @return {Node}
 */

exports.render = function(dom){
  return dom('noscript');
};

/**
 * Return the initial state of the component.
 * This should be overriden.
 *
 * @return {Object}
 */

exports.initialState = function(){
  return {};
};

/**
 * Before an update occurs we'll check to see if this component
 * actually needs re-render. This method can be overwritten by the
 * consumer to speed up rendering.
 *
 * @param {Object} state
 * @param {Object} props
 * @param {Object} nextState
 * @param {Object} nextProps
 *
 * @return {Boolean}
 */

exports.shouldUpdate = function(state, props, nextState, nextProps){
  if (!nextProps && !nextState) return false;
  if (equal(nextProps, this.props) && equal(nextState, this.state)) return false;
  return true;
};

/**
 * Initialize dynamics.
 */

exports.bind = function(renderer){
  this.properties = new PropertyStream(this);
  this.changes = new ChangeStream(this);
  this.patches = new PatchStream(this);
  // this.mounts = new MountStream(this);
  this.states = new StateStream(this);
  this.dirty = new DirtyStream(this);
  this.nodes = new NodeStream(this);

  this.properties.pipe(this.changes);
  this.changes.pipe(this.dirty);
  this.dirty.pipe(this.states);
  this.states.pipe(this.nodes);
  this.nodes.pipe(this.patches);
  this.patches.pipe(renderer);
};
