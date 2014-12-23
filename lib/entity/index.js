
/**
 * Module dependencies.
 */

var assign = require('sindresorhus/object-assign');
var Emitter = require('component/emitter');
var each = require('component/each');
var virtual = require('../virtual');
var diff = require('./diff');

/**
 * ID counter.
 */

var i = 0;

/**
 * Expose `Entity`.
 */

module.exports = Entity;

/**
 * A rendered component instance.
 *
 * This manages the lifecycle, props and state of the component.
 *
 * @param {Function} Component
 * @param {Object} props
 * @param {Scene} scene
 */

function Entity(Component, props, scene) {
  this.id = (i++).toString(32);
  this.scene = scene;
  this.events = scene.interactions;
  this.component = new Component();
  this.props = props || {};
  this.state = this.component.initialState();
  this.children = {};
  this.current = this.render();
  this.previous = null;
  this.dirty = false;
  this._pendingProps = {};
  this._pendingState = {};

  // when component state changes.
  this.component.on('change', this.setState.bind(this));

  // Create the elements
  this.el = this.toElement(this.current.root);

  // Add DOM event bindings
  this.updateEvents();

  // TODO we could potentially pass in a pre-rendered element and
  // use that instead of creating a new one.

  // TODO: This should know the current lifecycle state of the c
  // component so that we can do things like preventing updates
  // while unmounting
}

/**
 * Mixin diff.
 */

assign(Entity.prototype, diff, Emitter.prototype);

/**
 * Add this mount to the DOM.
 *
 * @param {Element} container
 */

Entity.prototype.appendTo = function(container){
  this._beforeMount();
  container.appendChild(this.el);
  this._afterMount();
};

/**
 * Get an updated version of the virtual tree.
 *
 * TODO: Throw an error if the render method doesn't return a node.
 *
 * @return {Node}
 */

Entity.prototype.render = function(){
  var node = this.component.render(virtual.node, this.state, this.props);
  if (!node) {
    throw new Error('Component#render must return a Node using the dom object');
  }
  return virtual.tree(node);
};

/**
 * Merge the props.
 *
 * @param {Object} nextProps
 * @param {Function} done
 */

Entity.prototype.setProps = function(nextProps, done){
  if (done) this.once('update', done);
  this._pendingProps = assign(this._pendingProps || {}, nextProps);
  // TODO: Add updateProps hook to the component so that state
  // can be modified when the props change
  this.invalidate();
};

/**
 * Replace all of the props on the entity
 *
 * @param {Object} nextProps
 * @param {Function} done
 */

Entity.prototype.replaceProps = function(nextProps, done){
  if (done) this.once('update', done);
  this._pendingProps = nextProps;
  // TODO: Add updateProps hook to the component so that state
  // can be modified when the props change
  this.invalidate();
};

/**
 * Set the state. This can be called multiple times
 * and the state will be MERGED.
 *
 * @param {Object} nextState
 * @param {Function} done
 */

Entity.prototype.setState = function(nextState, done){
  if (done) this.once('update', done);
  this._pendingState = assign(this._pendingState || {}, nextState);
  this.invalidate();
};

/**
 * Schedule this component to be updated on the next frame.
 *
 * @param {Function} done
 * @return {void}
 */

Entity.prototype.invalidate = function(){
  this.dirty = true;
  this.scene.dirty = true;
};

/**
 * Update the props on the component.
 *
 * @return {Node}
 */

Entity.prototype.update = function(){
  var self = this;
  var nextProps = assign({}, this.props, this._pendingProps);
  var nextState = assign({}, this.state, this._pendingState);

  // Compare the state and props to see if we really need to render
  var shouldUpdate = this.component.shouldUpdate(this.state, this.props, nextState, nextProps);

  // We try to call update on all of the children. Even if this
  // entity doesn't need to be updated, maybe one of the child
  // entities deeper in the tree has changed ands needs an update.
  function next() {
    for (var key in self.children) {
      self.children[key].update();
    }
  }

  // check the component.
  if (!shouldUpdate) return next();

  // pre-update. This callback could mutate the
  // state or props just before the render occurs
  this.component.beforeUpdate(this.state, this.props, nextState, nextProps);

  // TODO: Disallow using setState in render by using a
  // lifecycle flag here

  // merge in the changes.
  var previousState = this.state;
  var previousProps = this.props;
  this.state = nextState;
  this.props = nextProps;

  // reset.
  this._pendingState = {};
  this._pendingProps = {};

  // render the current state.
  this.previous = this.current;
  this.current = this.render();

  // update the element to match.
  this.updateStructure();
  this.updateEvents();

  // unset previous so we don't keep it in memory.
  this.previous = null;

  // post-update.
  this.component.afterUpdate(this.state, this.props, previousState, previousProps);
  this.emit('update');
  this.dirty = false;

  // recursive
  next();
};

/**
 * Update the structure of the DOM element
 */

Entity.prototype.updateStructure = function(){
  this.diff();
};

/**
 * Remove the component from the DOM.
 */

Entity.prototype.remove = function(){
  var el = this.el;
  if (!el) return;
  // TODO: add support for animation transitions (async behavior).
  this.component.beforeUnmount(this.el, this.state, this.props);
  if (el.parentNode) el.parentNode.removeChild(el);
  each(this.children, function(path, child){
    child.remove();
  });
  this.component.afterUnmount(this.el, this.state, this.props);
  this.events.unbind(this.id);
  this.off();
  this.children = {};
  this.el = null;
};

/**
 * Convert this node and all it's children into
 * real DOM elements and return it.
 *
 * Passing in a node allows us to render just a small
 * part of the tree instead of the whole thing, like when
 * a new branch is added during a diff.
 *
 * @param {Node} node
 * @return {Element}
 */

Entity.prototype.toElement = function(node){
  var path = this.current.getPath(node);

  // we can only render nodes that exist within the tree.
  if (!path) throw new Error('Node does not exist in the current tree');

  if (node.type === 'text') {
    return document.createTextNode(node.data);
  }

  if (node.type === 'element') {
    var el = document.createElement(node.tagName);
    var children = node.children;

    for (var name in node.attributes) {
      el.setAttribute(name, node.attributes[name]);
    }

    // store the path for delegation.
    el.__path__ = path;
    el.__entity__ = this.id;

    // add children.
    for (var i = 0, n = children.length; i < n; i++) {
      el.appendChild(this.toElement(children[i]));
    }
    return el;
  }

  // otherwise, it's a component node.
  var child = new Entity(node.component, node.props, this.scene);
  this.children[path] = child;

  // return el for components that have a root node that's another component.
  return child.el;
};

/**
 * Trigger `afterMount` event on this component and all sub-components.
 */

Entity.prototype._afterMount = function(){
  this.component.afterMount(this.el, this.state, this.props);
  each(this.children, function(path, entity){
    entity._afterMount();
  });
};

/**
 * Trigger `beforeMount` event on this component and all sub-components.
 */

Entity.prototype._beforeMount = function(){
  this.component.beforeMount(this.el, this.state, this.props);
  each(this.children, function(path, entity){
    entity._beforeMount();
  });
};

/**
 * Updates all the DOM event bindings in this component.
 * It removes all event bindings on the scene for this component
 * first and just reapplies them using the current tree.
 *
 * @return {void}
 */

Entity.prototype.updateEvents = function() {
  var self = this;
  var nodes = this.current.nodes;
  // Remove all events
  this.events.unbind(this.id);
  // Reapply them
  each(nodes, function(path, node){
    if (node.type !== 'element') return;
    each(node.events, function(eventType, fn){
      self.events.bind(self.id, path, eventType, function(e){
        fn.call(self.component, e, self.state, self.props);
      });
    });
  });
};