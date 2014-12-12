
/**
 * Module dependencies.
 */

var assign = require('sindresorhus/object-assign');
var Emitter = require('component/emitter');
var dom = require('../node');
var diff = require('../renderer/diff');
var Tree = require('../renderer/tree');

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
 */

function Entity(Component, props) {
  this.component = new Component();
  this.props = props || {};
  this.state = this.component.initialState();
  this.children = {};
  this.current = this.render();
  this.previous = this.current;

  // Create the elements
  this.el = this.toElement(this.current.root);

  // Run the diff so that event bindings are added
  this.diff();

  // TODO we could potentially pass in a pre-rendered element and
  // use that instead of creating a new one.

  // TODO: This should know the current lifecycle state of the c
  // component so that we can do things like preventing updates
  // while unmounting
}

/**
 * Mixins.
 */

assign(Entity.prototype, Emitter.prototype, diff);

/**
 * Add this entity to a scene
 *
 * @param {Scene} scene
 */

Entity.prototype.addTo = function(scene) {
  var self = this;
  this.scene = scene;
  scene.on('update', function(){
    if (self.shouldUpdate()) self.update();
  });
  scene.on('end', function(){
    self.remove();
  });
  this._beforeMount();
  scene.append(this.el);
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
  var node = this.component.render(dom, this.state, this.props);
  if (!node) {
    throw new Error('Component#render must return a Node using the dom object');
  }
  return new Tree(node);
};

/**
 * Should this entity be updated?
 *
 * @return {Boolean}
 */

Entity.prototype.shouldUpdate = function() {
  var nextProps = this._pendingProps;
  var nextState = this.component._pendingState;
  return this.component.shouldUpdate(this.state, this.props, nextState, nextProps);
};

/**
 * Update the DOM for this Entity
 */

Entity.prototype.update = function(){
  var self = this;
  var nextProps = this._pendingProps;
  var nextState = this.component._pendingState;

  // pre-update.
  this.component.beforeUpdate(this.state, this.props, nextState, nextProps);

  // merge in the changes.
  var previousState = this.state;
  var previousProps = this.props;
  this.state = assign({}, this.state, this.component._pendingState);
  this.props = this._pendingProps || this.props;

  // reset.
  this.component._pendingState = false;
  this._pendingProps = false;

  // render the current state.
  this.previous = this.current;
  this.current = this.render();

  // update the element to match.
  this.diff();

  // unset previous so we don't keep it in memory.
  this.previous = null;

  // post-update.
  this.component.afterUpdate(this.state, this.props, previousState, previousProps);
};

/**
 * Remove the component from the DOM.
 */

Entity.prototype.remove = function(){
  var el = this.el;
  if (!el) return;
  this.component.beforeUnmount(this.el, this.state, this.props);
  if (el.parentNode) el.parentNode.removeChild(el);
  this.each(function(child){
    child.remove();
  });
  this.component.afterUnmount(this.el, this.state, this.props);
  this.children = {};
  this.el = null;
};

/**
 * Set the next props.
 *
 * These will get merged in on the next render.
 *
 * @param {Object} nextProps
 * @param {Function} done
 */

Entity.prototype.setProps = function(nextProps){
  this._pendingProps = nextProps;
};

/**
 * Call a method on each sub-component
 *
 * @param {Function} fn
 */

Entity.prototype.each = function(fn){
  for (var path in this.children) {
    fn(this.children[path]);
  }
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
    // precompute path.
    el.__path__ = path
    var children = node.children;

    for (var name in node.attributes) {
      el.setAttribute(name, node.attributes[name]);
    }

    // add children.
    for (var i = 0, n = children.length; i < n; i++) {
      el.appendChild(this.toElement(children[i]));
    }
    return el;
  }

  // otherwise, it's a component node.
  var child = new Entity(node.component, node.props);
  child.addTo(this.scene);
  this.children[path] = child;

  // return el for components that have a root node that's another component.
  return child.el;
};

/**
 * Trigger `afterMount` event on this component and all sub-components.
 */

Entity.prototype._afterMount = function(){
  this.component.afterMount(this.el, this.state, this.props);
  this.each(function(mount){
    mount._afterMount();
  });
};

/**
 * Trigger `beforeMount` event on this component and all sub-components.
 */

Entity.prototype._beforeMount = function(){
  this.component.beforeMount(this.el, this.state, this.props);
  this.each(function(mount){
    mount._beforeMount();
  });
};

/**
 * Add event binding
 *
 * TODO: more generic.
 *
 * @param {String} path
 * @param {String} type
 * @param {Function} fn
 */

Entity.prototype.bind = function(path, type, fn){
  var self = this;
  this.scene.interactions.bind(path, type, function(e){
    fn.call(self.component, e, self.state, self.props);
  });
}

/**
 * Remove event bindings
 *
 * @param {String} path
 * @param {String} type
 */

Entity.prototype.unbind = function(path, type){
  this.scene.interactions.unbind(path, type);
}
