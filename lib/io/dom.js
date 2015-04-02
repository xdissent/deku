
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
    world.virtualElements = {};
    world.nativeElements = {};
    world.changes = {};
    world.pools = {};
    world.off('unmount component', mount);
    world.off('mount component', mount);
  }

  /**
   * Register a new type of component.
   *
   * This is mostly to pre-preprocess component properties and values chains.
   *
   * The end result is for every component that gets mounted,
   * you create a set of IO nodes in the network from the `value` definitions.
   */

  function register(component) {

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
    subscribe(path, component);
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
    var virtualElement = render(path, properties);
    var nativeElement = toNative(node);
    // basically like storing a db, optimized.
    world.nativeElements[path] = element;
    world.virtualElements[path] = node;
    world.components[path] = component;
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
    // if there's no component, we already removed.
    var component = world.components[path];
    if (!component) return;

    // remove actual dom element.
    // only need to remove the top-most one.
    var el = world.nativeElements[path];
    el.parentNode.removeChild(el);

    // then clear up the data structures.
    var paths = world.traverse(path);
    var i = paths.length;
    while (--i) {
      path = paths[i];
      world.components[path] = false;
      world.elements[path] = false;
      world.states[path] = false;
      world.nodes[path] = false;
      world.tree[path] = false;
    }
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
      var nextVirtualElement = component.render(properties, send);
      patch(previousVirtualElement, nextVirtualElement);

      /**
       * Simplify the common-case of updating a component's "state".
       */

      function send(name, data) {
        if (1 == arguments.length) {
          // world.send('update component', {
          //   state: data,
          //   path: path
          // });
          // this is an optimization of the above, cuts out extra processing.
          data = name;
          update(path, data);
        } else {
          world.send(name, data);
        }
      }
    });
  }

  /**
   * Handle an event that has occured within the container.
   *
   * TODO: this should pipe from world.
   */

  function handle(event) {
    var target = event.target;
    var path = target.__entity__;
    var type = event.type;
    var fn = world.handlers[path][type];
    event.delegateTarget = target;
    fn(event);
  }

  /**
   * Create native element from virtual one.
   */

  function toNative(virtualElement) {
    bind(el, event);
  }

  /**
   * Attach event handler for event.
   *
   * Probably should do this just once.
   */

  function bind(element, event) {
    world
      .value('mouse')
      .detect('click')
      .match(element)
      .call(handle);
  }

  /**
   * Watch values change, then update stream.
   */

  function subscribe(path, component) {
    var values = world.values[component.id]
      .map(function(value){
        return value.match(path);
      });

    values.forEach(function(value){
      value.on('update', send);

      function send(data) {
        update(path, data);
      }
    });

    // the world will merge them in to optimally compute update paths.
    values.forEach(function(value){
      world.send('insert value', value);
    });
  }

  return teardown;
}
