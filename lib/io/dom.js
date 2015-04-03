
/**
 * Module dependencies.
 */

var virtualize = require('virtualize');
var Value = require('../struct/value');
var zip = require('array-zip');
var merge = require('merge');

/**
 * Expose `dom`.
 */

module.exports = dom;

/**
 * Define IO source for the dom.
 *
 * @param {World} world
 * @return {Function} teardown Unsubscribe from this datasource.
 */

function dom(world) {
  setup();

  /**
   * Setup.
   */

  function setup() {
    world.componentToValuesMap = {};
    world.componentToPathsMap = {};
    world.pathToPropertiesMap = {}; // component properties
    world.pathToComponentMap = {};
    world.pathToValuesMap = {}; // values for component "instance"
    world.virtualElements = {};
    world.nativeElements = {};
    world.handlers = {};
    world.changes = {};
    world.pools = {}; // different object pools we use throughout.
    world.on('unmount component', unmount);
    world.on('update component', update);
    world.on('mount component', mount);
  }

  /**
   * Teardown.
   */

  function teardown() {
    world.componentToValuesMap = {};
    world.componentToPathsMap = {};
    world.pathToPropertiesMap = {};
    world.pathToComponentMap = {};
    world.pathToValuesMap = {};
    world.virtualElements = {};
    world.nativeElements = {};
    world.changes = {};
    world.pools = {};
    world.off('unmount component', unmount);
    world.off('update component', update);
    world.off('mount component', mount);
  }

  /**
   * Create and mount a component to a native element.
   *
   * @param {Object} data
   *   @property {HTMLElement} element
   *   @property {Component} component
   *   @property {Object} properties
   *   @property {String} path
   */

  function mount(data) {
    var properties = data.properties;
    var component = data.component;
    var root = data.element;
    var path = data.path;
    var element = create(path, component, properties);
    root.appendChild(element);
  }

  /**
   * Unmount a component.
   *
   * @param {String} path
   */

  function unmount(path) {
    remove(path);
  }

  /**
   * Create component.
   *
   * @param {String} path
   * @param {Component} component
   * @param {Object} properties
   */

  function create(path, component, properties) {
    var values = register(path, component);
    // TODO: set default values
    // var defaults = getDefaultValues(component);
    // merge(defaults, properties);
    var virtualElement = render(path, component, properties);
    var nativeElement = toNative(path, virtualElement);
    // basically like storing a db, optimized.
    world.pathToPropertiesMap[path] = properties;
    world.virtualElements[path] = virtualElement;
    world.nativeElements[path] = nativeElement;
    return nativeElement;
  }

  /**
   * Construct a new virtual element for a component.
   *
   * During creation, this will get converted to a native element.
   * During update, it will get diff'd with the previous virtual
   * element, and then the differences will be applied to the native element.
   *
   * @param {String} path
   * @param {Component} component
   * @param {Object} properties
   */

  function render(path, component, properties) {
    var virtualElement = component.render(properties, send);
    if (!virtualElement) virtualElement = virtualize.node('noscript');
    return virtualElement;

    /**
     * Simplify the common-case of updating a component's "state".
     *
     * @param {String} name
     * @param {Object} data
     */

    function send(name, data) {
      if (1 == arguments.length) {
        data = name;
        update(path, data);
      } else {
        world.send(name, data);
      }
    }
  }

  /**
   * Update component.
   *
   * This essentially queues changes, which get
   * applied on the next frame.
   *
   * @param {String} path
   * @param {Object} changes New properties/state for the component.
   */

  function update(path, changes) {
    if (world.changes[path]) {
      merge(world.changes[path], changes);
    } else {
      world.changes[path] = changes;
    }
    invalidate();
  }

  /**
   * Remove component.
   */

  function remove(path) {

  }

  /**
   * Queue up re-rendering on the next frame.
   */

  function invalidate() {
    if (world.dirty) return;
    world.dirty = true;
    if (world.options.renderImmediate) {
      updateFrame();
    } else {
      requestAnimationFrame(updateFrame);
    }
  }

  /**
   * Rerender the next frame.
   */

  function updateFrame() {
    var changes = world.changes;
    world.dirty = false;
    world.changes = {}; // reset for next frame.

    Object.keys(changes).forEach(function(path){
      var previousVirtualElement = world.virtualElements[path];
      var previousProperties = world.pathToPropertiesMap[path];
      var component = world.pathToComponentMap[path];
      var el = world.nativeElements[path];
      var nextProperties = changes[path];
      var properties = merge(merge({}, previousProperties), nextProperties);
      var nextVirtualElement = render(path, component, properties);
      diffNode(path, previousVirtualElement, nextVirtualElement, el);
      world.pathToPropertiesMap[path] = nextProperties;
      world.virtualElements[path] = nextVirtualElement;
    });
  }

  /**
   * Calculate diff between two virtual elements,
   * and apply difference to corresponding native element.
   *
   * @param {String} path
   * @param {VirtualNode} prev
   * @param {VirtualNode} next
   * @param {HTMLElement} el
   */

  function diffNode(path, prev, next, el) {
    // Type changed. This could be from element->text, text->ComponentA,
    // ComponentA->ComponentB etc. But NOT div->span. These are the same type
    // (ElementNode) but different tag name.
    if (prev.type !== next.type) return replaceNativeElement(path, next, el);

    switch (next.type) {
      case 'text': return diffText(prev, next, el);
      case 'element': return diffElement(path, prev, next, el);
      case 'component': return diffComponent(path, prev, next, el);
    }
  }

  /**
   * Update native text element with new text content if necessary.
   *
   * @param {VirtualNode} prev
   * @param {VirtualNode} next
   * @param {HTMLElement} el
   */

  function diffText(prev, next, el) {
    if (next.data !== prev.data) el.data = next.data;
  }

  /**
   * Calculate difference between to sets of virtual elements,
   * and intelligently apply the difference to the native element.
   *
   * @param {String} path
   * @param {VirtualNode} prev
   * @param {VirtualNode} next
   * @param {HTMLElement} el
   */

  function diffChildren(path, prev, next, el) {
    var children = zip(prev.children, next.children);

    // TODO:
    // Order the children using the key attribute in
    // both arrays of children and compare them first, then
    // the other nodes that have been added or removed, then
    // render them in the correct order

    var j = -1;
    for (var i = 0; i < children.length; i++) {
      j += 1;
      var item = children[i];
      var left = item[0];
      var right = item[1];
      var childPath = path + '.' + j;

      // this is a new node.
      if (left == null) {
        var childEl = toNative(childPath, right);
        el.appendChild(childEl);
        continue;
      }

      // the node has been removed.
      if (right == null) {
        removeNativeElement(childPath, el.childNodes[j]);
        j = j - 1;
        continue;
      }

      diffNode(childPath, left, right, el.childNodes[j]);
    }
  }

  function diffComponent(path, prev, next, el) {
    if (next.component !== prev.component) {
      replaceNativeElement(path, next, el);
    } else {
      updateEntity(path, next);
    }
  }

  function diffElement(path, prev, next, el) {
    if (next.tagName != prev.tagName) return replaceNativeElement(path, next, el);
    diffAttributes(prev, next, el);
    diffChildren(path, prev, next, el); // recurse.
  }

  /**
   * Change attributes on a native element.
   *
   * Takes the difference of old and new virtual trees,
   * and applies them to the native element.
   */

  function diffAttributes(prev, next, el){
    var prevAttributes = prev.attributes;
    var nextAttributes = next.attributes;

    // add new attributes.
    for (var name in nextAttributes) {
      var value = nextAttributes[name];
      if (!prevAttributes[name] || prevAttributes[name] !== value) {
        setNativeAttribute(el, name, value);
      }
    }

    // remove old attributes.
    for (var name in prevAttributes) {
      if (!nextAttributes[name]) el.removeAttribute(name);
    }
  }

  /**
   * Convert virtual element to native element.
   *
   * @param {String} path
   * @param {VirtualNode} virtualElement
   * @return {HTMLElement}
   */

  function toNative(path, virtualElement) {
    switch (virtualElement.type) {
      case 'text': return toNativeText(virtualElement);
      case 'element': return toNativeElement(path, virtualElement);
      case 'component': return toNativeComponent(path, virtualElement);
    }
  }

  /**
   * Convert virtual element to native text element.
   *
   * @param {VirtualNode} virtualElement
   * @return {Text}
   */

  function toNativeText(virtualElement) {
    return document.createTextNode(virtualElement.data);
  }

  /**
   * Convert virtual element to native element.
   *
   * TODO: This could use `innerHTML` on the first round.
   *
   * @param {String} path
   * @param {VirtualNode} virtualElement
   * @return {HTMLElement}
   */

  function toNativeElement(path, virtualElement) {
    // create element.
    var el = constructNativeElement(path, virtualElement);
    var attributes = virtualElement.attributes;
    var children = virtualElement.children;
    var events = virtualElement.events;

    // set attributes.
    for (var name in attributes) setNativeAttribute(el, name, attributes[name]);
    // store `path` for fast event handling.
    el.__path__ = path;

    // add children.
    children.forEach(function(child, i){
      var childEl = toNative(path + '.' + i, child);
      el.appendChild(childEl);
    });

    // add events.
    for (var name in events) bindNativeEvent(path, name, events[name]);

    return el;
  }

  /**
   * Convert virtual element for component to native element.
   *
   * @param {String} path
   * @param {VirtualNode} virtualElement
   * @return {HTMLElement}
   */

  function toNativeComponent(path, virtualElement) {
    return create(path, virtualElement.component, virtualElement.props);
  }

  /**
   * Construct a native element.
   *
   * Either use one from the object pool, or create a new one.
   *
   * @param {String} path
   * @param {VirtualNode} virtualElement
   * @return {HTMLElement}
   */

  function constructNativeElement(path, virtualElement) {
    var component = world.pathToComponentMap[path];
    var tagName = virtualElement.tagName;
    var el = document.createElement(tagName);

    // TODO
    // if (false === component.options.pooling) {
    //   var el = document.createElement(tagName);
    // } else {
    //   var pool = getPool(tagName);
    //   var el = pool.pop();
    //   removeAllChildren(el);
    //   removeAllAttributes(el);
    // }

    return el;
  }

  /**
   * Set native element attribute.
   *
   * @param {HTMLElement} el
   * @param {String} name
   * @param {Mixed} value
   */

  function setNativeAttribute(el, name, value) {
    switch (name) {
      case 'value':
        el.value = value;
        break;
      case 'innerHTML':
        el.innerHTML = value;
        break;
      default:
        el.setAttribute(name, value);
        break;
    }
  }

  /**
   * Bind native event.
   *
   * This just inserts an event transducer in the io network.
   *
   * @param {String} path
   * @param {String} name
   * @param {Function} handler
   */

  function bindNativeEvent(path, name, handler) {
    var type = name.replace(/^on/, ''); // TODO: maybe a map instead.
    // essentially this is a virtual event.
    var val = Value(type).equal(prop, path); // value('click')
    val.on('update', handler);
    world.send('insert value', value); // insert into the network

    function prop(event) {
      return event.target.__path__;
    }
  }

  /**
   * Register a new type of component.
   *
   * This is mostly to pre-preprocess component properties and values chains.
   *
   * The end result is for every component that gets mounted,
   * you create a set of IO nodes in the network from the `value` definitions.
   *
   * @param {Component} component
   */

  function register(path, component) {
    var componentsMap = world.pathToComponentMap;
    var valuesMap = world.componentToValuesMap;
    var pathsMap = world.componentToPathsMap;
    var id = component.id;
    var paths = pathsMap[id] = pathsMap[id] || [];
    componentsMap[path] = component;

    // add specific path to map for component
    pathsMap[id].push(path);

    // if we've already wired up values, then skip
    if (valuesMap[id]) return;

    // find properties that have values.
    var properties = component.props;
    var valueToPropertyNameMap = {};
    var values = [];
    for (var name in properties) {
      var data = properties[name];
      if (!(data instanceof Value)) continue;
      values.push(data);
      valueToPropertyNameMap[data.id] = name;
    }
    valuesMap[id] = values;

    // insert values into the io network
    values.forEach(function(value){
      world.send('insert value', value);
    });

    // send value updates to all component instances
    values.forEach(function(value){
      value.on('update', send);

      function send(data) {
        var prop = valueToPropertyNameMap[value.id];
        paths.forEach(function(path){
          var changes = {};
          changes[prop] = data;
          update(path, changes);
        });
      }
    });
  }

  /**
   * Replace an element in the DOM. Removing all components
   * within that element and re-rendering the new virtual node.
   *
   * @param {String} path
   * @param {Object} virtualElement
   * @param {HTMLElement} el
   */

  function replaceNativeElement(path, virtualElement, el) {
    var parent = el.parentNode;
    var index = Array.prototype.indexOf.call(parent.childNodes, el);

    // remove the previous element and all nested components. This
    // needs to happen before we create the new element so we don't
    // get clashes on the component paths.

    removeNativeElement(path, el);

    // then add the new element in there.
    var newEl = toNative(path, virtualElement);
    var target = parent.childNodes[index];

    if (target) {
      parent.insertBefore(newEl, target);
    } else {
      parent.appendChild(newEl);
    }

    // update the root reference.
    world.nativeElements[path] = newEl;
  }

  /**
   * Removes an element from the DOM and unmounts and components
   * that are within that branch
   *
   * @param {String} path
   * @param {HTMLElement} el
   */

  function removeNativeElement(path, el) {
    var children = this.children[entityId];
    var entities = this.entities;
    var entity = entities[entityId];

    // Just remove the text node
    if (!isElement(el)) return el.parentNode.removeChild(el);

    // Return all of the elements in this node tree to the pool
    // so that the elements can be re-used.
    // walk(el, function(node){
    //   if (!isElement(node)) return;
    //   var parent = entities[node.__entity__];
    //   if (!parent || parent.option('disablePooling')) return;
    //   self.getPool(node.tagName.toLowerCase()).push(node);
    // });

    // Otherwise we need to find any components within this
    // branch and unmount them.
    // for (var childPath in children) {
    //   if (childPath === path || isWithinPath(path, childPath)) {
    //     this.unmount(entities[children[childPath]]);
    //     delete children[childPath];
    //   }
    // }

    el.parentNode.removeChild(el);
  }

  return teardown;
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

function getPool(tagName) {
  var pool = this.pools[tagName];
  if (!pool) {
    pool = this.pools[tagName] = new Pool({ tagName: tagName });
  }
  return pool;
}
