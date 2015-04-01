
/**
 * Expose `dom`.
 */

module.exports = dom;

/**
 * Define IO for the dom.
 */

function dom(world, input, send) {
  subscribe();

  /**
   * Subscribe.
   */

  function subscribe() {
    world.virtualElements = {};
    world.nativeElements = {};
    world.changes = {};
    world.pools = {}; // different object pools we use throughout.
    world.on('mount component', mount);
    world.on('create component', create);
    world.on('update component', update);
    world.on('remove component', remove);
  }

  /**
   * Unsubscribe.
   */

  function unsubscribe() {
    world.virtualElements = {};
    world.nativeElements = {};
    world.changes = {};
    world.pools = {};
    world.off('mount component', mount);
    world.off('create component', create);
    world.off('update component', update);
    world.off('remove component', remove);
  }

  /**
   * Append. Create plus mounting it to an element.
   */

  function mount(data) {
    var properties = data.properties;
    var component = data.component;
    var root = data.element;
    var element = create({
      properties: properties,
      component: component
    });
    root.appendChild(element);
  }

  /**
   * Create.
   */

  function create(data) {
    var component = data.component;
    var state = data.state;
    var path = data.path;
    var virtualElement = render(path, state);
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
          world.send('update component', {
            state: data,
            path: path
          });
          // or an optimization:
          // update(path, data);
        } else {
          world.send(name, data);
        }
      }
    });
  }

  return unsubscribe;
}
