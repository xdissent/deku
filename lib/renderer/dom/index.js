
/**
 * Dependencies.
 */

var Interactions = require('./interactions');
var Emitter = require('component-emitter');
var virtualize = require('virtualize');
var Entity = require('../../entity');
var each = require('component-each');
var Pool = require('dom-pool');
var walk = require('dom-walk');
var patch = require('./diff');
var loop = require('raf-loop');
var isDom = require('is-dom');
var tree = virtualize.tree;
var dom = virtualize.node;

/**
 * Render a component to a DOM element
 *
 * @param {Component} Component
 * @param {HTMLElement} container
 * @param {Object} props
 *
 * @return {Scene}
 */

module.exports = function(scene, container){
  if (!isDom(container)) throw new Error(container + ' is not a valid render target.');
  return new Renderer(scene, container);
};

/**
 * Handles the rendering of a scene graph by running
 * diffs on the current virtual tree of the entities with
 * the previous version. It then applies this diff to the
 * acutal DOM tree.
 */

function Renderer(scene, container) {
  this.scene = scene;
  this.events = new Interactions(document.body);
  this.loop = loop(this.render.bind(this));
  this.entities = {};
  this.elements = {};
  this.renders = {};
  this.children = {};
  this.pools = {};
  this.dirty = false;
  container.appendChild(this.mount(scene.root));
  this.loop.start();
}

/**
 * Update an entity already on the scene.
 *
 * @param {Entity} entity
 *
 * @api private
 * @return {void}
 */

Renderer.prototype.update = function(entity) {
  var self = this;

  // Recursive update
  function next(){
    self.updateChildren(entity);
  }

  this.updateEvents(entity);
  next();
  entity.afterUpdate(previousState, previousProps);
};

/**
 * Update all the children of an entity
 *
 * @param {Entity} entity
 */

Renderer.prototype.updateChildren = function(entity) {
  var entities = this.entities;
  var children = this.children[entity.id];
  for (var path in children) {
    var childId = children[path];
    this.update(entities[childId]);
  }
};

/**
 * Clear the scene
 */

Renderer.prototype.remove = function(){
  this.unmount(this.scene.root);
  this.events.remove();
  this.loop.stop();
  this.pools = {};
};

/**
 * Remove the entity from the DOM.
 *
 * @param {Entity} entity
 */

Renderer.prototype.unmount = function(entity){
  var el = this.elements[entity.id];

  // This entity is already unmounted
  if (!el) return;

  entity.beforeUnmount(el);

  // If sub-components are on the root node, the entities will share
  // the same element. In this case, the element will only need to be
  // removed from the DOM once
  if (el.parentNode) el.parentNode.removeChild(el);
  this.unmountChildren(entity);
  this.removeEvents(entity);
  entity.afterUnmount();
  entity.release();
  delete this.elements[entity.id];
  delete this.renders[entity.id];
  delete this.entities[entity.id];
  delete this.children[entity.id];
};

/**
 * Remove all of the child entities of an entity
 *
 * @param {Entity} entity
 */

Renderer.prototype.unmountChildren = function(entity) {
  var self = this;
  var entities = this.entities;
  var children = this.children[entity.id];
  each(children, function(path, childId){
    self.unmount(entities[childId]);
  });
};

/**
 * Unbind all events from an entity
 *
 * @param {Entity} entity
 */

Renderer.prototype.removeEvents = function(entity) {
  this.events.unbind(entity.id);
};

/**
 * Get the pool for a tagName, creating it if it
 * doesn't exist.
 *
 * @param {String} tagName
 *
 * @return {Pool}
 */

Renderer.prototype.getPool = function(tagName) {
  var pool = this.pools[tagName];
  if (!pool) {
    pool = this.pools[tagName] = new Pool({ tagName: tagName });
  }
  return pool;
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
 * @param {String} path
 * @param {String} entityId
 *
 * @return {HTMLDocumentFragment}
 */

Renderer.prototype.createElement = function(entityId, path, vnode){

  if (vnode.type === 'text') {
    return document.createTextNode(vnode.data);
  }

  if (vnode.type === 'element') {
    var el = this.createDOMElement(entityId, vnode.tagName);
    var children = vnode.children;

    // TODO: These is some duplication here between the diffing.
    // This should be generalized and put into a module somewhere
    // so that it's easier to define special attributes in one spot.
    for (var name in vnode.attributes) {
      this.setAttribute(el, name, vnode.attributes[name]);
    }

    // TODO: Store nodes in a hash so we can easily find
    // elements later. This would allow us to separate out the
    // patching from the diffing will still being efficient. We could
    // also use the same object in the Interactions object to make
    // lookups cleaner instead of checking __ values.
    // this.elementsByPath[entity.id][path] = el;
    el.__path__ = path;
    el.__entity__ = entityId;

    // add children.
    for (var i = 0, n = children.length; i < n; i++) {
      var childEl = this.createElement(entityId, path + '.' + i, children[i]);
      el.appendChild(childEl);
    }

    return el;
  }

  if (vnode.type === 'component') {
    var child = new Entity(vnode.component, vnode.props);
    this.children[entityId][path] = child.id;
    return this.mount(child);
  }
};

/**
 * Removes an element from the DOM and unmounts and components
 * that are within that branch
 *
 * side effects:
 *   - removes element from the DOM
 *   - removes internal references
 *
 * @param {String} entityId
 * @param {String} path
 * @param {HTMLElement} el
 */

Renderer.prototype.removeElement = function(entityId, path, el) {
  var self = this;
  var children = this.children[entityId];
  var entities = this.entities;
  var matched = children[path];

  // This node is a component so we can just unmount it
  // and all of the child components will come with it.
  if (matched) {
    this.unmount(entities[matched]);
    delete children[path];
    return;
  }

  // Otherwise we need to find any components within this
  // branch and unmount them specifically.
  Object.keys(children).forEach(function(childPath){
    if (isWithinPath(path, childPath)) {
      self.unmount(entities[children[childPath]]);
      delete children[childPath];
    }
  });

  this.removeDOMElement(entityId, el);
};

/**
 * Replace an element in the DOM. Removing all components
 * within that element and re-rendering the new virtual node.
 *
 * @param {String} entityId
 * @param {String} path
 * @param {HTMLElement} el
 * @param {Object} vnode
 *
 * @return {void}
 */

Renderer.prototype.replaceElement = function(entityId, path, el, vnode) {
  var parent = el.parentNode;
  var index = Array.prototype.indexOf.call(parent.childNodes, el);

  // remove the previous element and all nested components. This
  // needs to happen before we create the new element so we don't
  // get clashes on the component paths.

  this.removeElement(entityId, path, el);

  // then add the new element in there

  var newEl = this.createElement(entityId, path, vnode);
  var target = parent.childNodes[index];

  if (target) {
    parent.insertBefore(newEl, target);
  } else {
    parent.appendChild(newEl);
  }

  // update the root reference.

  if (this.elements[entityId] === el) {
    this.elements[entityId] = newEl;
  }
};

/**
 * Update an entity to match the latest rendered vode. We always
 * replace the props on the component when composing them. This
 * will trigger a re-render on all children below this point.
 *
 * @param {String} entityId
 * @param {String} path
 * @param {Object} vnode
 *
 * @return {void}
 */

Renderer.prototype.updateEntity = function(entityId, path, vnode) {
  var childId = this.children[entityId][path];
  var entity = this.entities[childId];
  entity.replaceProps(vnode.props);
};

/**
 * Set the attribute of an element, performing additional transformations
 * dependning on the attribute name
 *
 * @param {HTMLElement} el
 * @param {String} name
 * @param {String} value
 */

Renderer.prototype.setAttribute = function(el, name, value) {
  if (name === "value") {
    el.value = value;
  } else if (name === "innerHTML") {
    el.innerHTML = value;
  } else {
    el.setAttribute(name, value);
  }
};

/**
 * Remove a node from the document
 *
 * @param {String} entityId
 * @param {HTMLElement} el
 */

Renderer.prototype.removeDOMElement = function(entityId, el) {
  var self = this;
  var entity = this.entities[entityId];
  el.parentNode.removeChild(el);
  if (entity.option('disablePooling') || !el.tagName) return;

  // Return all of the elements in this node tree to the pool
  // so that the elements can be re-used.
  walk(el, function(node){
    if (!node.tagName) return;
    self.getPool(node.tagName.toLowerCase()).push(node);
  });
};

/**
 * Create a new HTMLElement.
 *
 * @param {String} entityId
 * @param {String} tagName
 */

Renderer.prototype.createDOMElement = function(entityId, tagName) {
  var entity = this.entities[entityId];
  var el;

  if (entity.option('disablePooling')) {
    el = document.createElement(tagName);
  } else {
    var pool = this.getPool(tagName);
    el = pool.pop();
    removeAllChildren(el);
    removeAllAttributes(el);
  }

  return el;
};

/**
 * Render the entity and make sure it returns a node
 *
 * @param {Entity} entity
 *
 * @return {VirtualTree}
 */

function renderEntity(entity) {
  var result = entity.render();
  if (!result) {
    result = dom('noscript');
  }
  return result;
}

/**
 * Checks to see if one tree path is within
 * another tree path. Example:
 *
 * 0.1 vs 0.1.1 = true
 * 0.2 vs 0.3.5 = false
 *
 * @param {String} target
 * @param {String} path
 *
 * @return {Boolean}
 */

function isWithinPath(target, path) {
  return path.indexOf(target) === 0;
}

/**
 * Remove all the attributes from a node
 *
 * @param {HTMLElement} el
 */

function removeAllAttributes(el) {
  for (var i = el.attributes.length - 1; i >= 0; i--) {
    var name = el.attributes[i].name;
    el.removeAttribute(name);
  }
}

/**
 * Remove all the child nodes from an element
 *
 * @param {HTMLElement} el
 */

function removeAllChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
