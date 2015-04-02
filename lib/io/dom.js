
/**
 * Expose `dom`.
 */

module.exports = dom;

/**
 * Define IO for the dom.
 */

function dom(world, input, send) {
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
    world.on('mount component', mount);
    world.on('create component', create);
    world.on('update component', update);
    world.on('remove component', remove);
    world.on('unbind event', unbind);
    world.on('bind event', bind);
  }

  /**
   * Teardown.
   */

  function teardown() {
    world.virtualElements = {};
    world.nativeElements = {};
    world.changes = {};
    world.pools = {};
    world.off('mount component', mount);
    world.off('create component', create);
    world.off('update component', update);
    world.off('remove component', remove);
    world.off('unbind event', unbind);
    world.off('bind event', bind);
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
   * Append. Create plus mounting it to an element.
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
    var element = create({
      properties: properties,
      component: component
    });
    subscribe(path, component);
    root.appendChild(element);
  }

  /**
   * Create component.
   *
   * @param {Object} data
   *   @property {Component} component
   *   @property {Object} properties
   *   @property {String} path
   */

  function create(data) {
    var properties = data.properties;
    var component = data.component;
    var path = data.path;
    var virtualElement = render(path, properties);
    var nativeElement = toNative(node);
    // basically like storing a db, optimized.
    world.nativeElements[path] = element;
    world.virtualElements[path] = node;
    world.components[path] = component;
  }

  /**
   * Update component.
   */

  function update(data) {
    var state = data.state;
    var path = data.path;
    // queue changes.
    if (world.changes[path]) {
      merge(world.changes[path], state);
    } else {
      world.changes[path] = state;
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
    var handlers = world.handlers;
    var path = target.__entity__;
    var type = event.type;
    var fn = handlers[path][type];
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
    world.send('insert values', values);
  }

  return teardown;
}
