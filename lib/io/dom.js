
/**
 * Module dependencies.
 */

var virtualize = require('virtualize');
var Value = require('../struct/value');
var merge = require('merge');
var dom = virtualize.node;

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
    world.on('unmount component', mount);
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
    world.off('unmount component', mount);
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
    register(path, component);
    // TODO: set default values
    // var defaults = getDefaultValues(component);
    // merge(defaults, properties);
    // world.pathToPropertiesMap[path] = properties;
    var virtualElement = render(component, properties);
    var nativeElement = toNative(path, node);
    // basically like storing a db, optimized.
    world.virtualElements[path] = virtualElement;
    world.nativeElements[path] = nativeElement;
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
    if (!virtualElement) virtualElement = dom('noscript');
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
    requestAnimationFrame(updateFrame);
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
      var previousProperties = world.previousProperties[path];
      var component = world.components[path];
      var nextProperties = changes[path];
      var properties = extend({}, previousProperties, nextProperties);
      var nextVirtualElement = render(path, component, properties);
      patch(previousVirtualElement, nextVirtualElement);
    });
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
    // TODO
    return toNative(path, virtualElement);
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
    var valuesMap = world.componentToValuesMap;
    var pathsMap = world.componentToPathsMap;
    var id = component.id;
    var paths = pathsMap[id] = pathsMap[id] || [];

    // add specific path to map for component
    pathsMap[id].push(path);

    // if we've already wired up values, then skip
    if (valuesMap[id]) return;

    // find properties that have values.
    var properties = component.properties;
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

  return teardown;
}
