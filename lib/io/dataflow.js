
/**
 * Expose `dataflow`.
 */

module.exports = dataflow;

/**
 * Define dataflow IO for world.
 */

function dataflow(world) {
  setup();

  /**
   * Subscribe.
   */

  function setup() {
    world.sources = {};
    world.on('unsubscribe', unsubscribe);
    world.on('subscribe', subscribe);
    world.on('insert values', insert);
    world.on('update value', update);
    world.on('remove values', remove);
  }

  /**
   * Unsubscribe.
   */

  function teardown() {
    world.sources = {};
    world.off('unsubscribe', unsubscribe);
    world.off('subscribe', subscribe);
    world.off('include values', include);
    world.off('update value', update);
  }

  /**
   * Subscribe to all data sources defined in world.
   */

  function subscribe() {
    var subscriptions = world.subscriptions;
    var sources = world.sources;
    var send = world.update;
    for (var name in sources) {
      var subscribe = sources[name];
      switch (subscribe.length) {
        case 3:
          // TODO: these are local and depend on component specs I think.
          var input = {};
          var unsubscribe = subscribe(world, input, send);
          break;
        default:
          var unsubscribe = subscribe(world, send);
          break;
      }
      subscriptions[name] = unsubscribe;
    }
  }

  /**
   * Unsubscribe from all data sources defined in world.
   */

  function unsubscribe() {
    var subscriptions = world.subscriptions
    for (var name in subscriptions) {
      var unsubscribe = subscriptions[name];
      unsubscribe();
    }
    // reset
    world.subscriptions = {};
  }

  /**
   * Add a set of values to the dataflow network.
   *
   * @param {Array} values
   */

  function insert(values) {
    // TODO: merge these in an optimal way to the `world.network`.
    // 1. create `IO` node from this `value`.
    // 2. pipe io change to value
    // 3. somehow insert IO node in proper place in existing IO graph.
  }

  /**
   * Begin processing a top-level "source" event.
   *
   * This starts at the "root" of the graph. And then,
   * by following the value chains, sends/transforms
   * the values to the end nodes. The end result is that it
   * sets some property on a component, which triggers re-rendering.
   * Or it could send a request too, stuff like that.
   *
   * @param {Object} message
   */

  function update(message) {
    var prop = message.prop;
    var data = message.data;
    var id = message.id;
    var inputs = world.network[id]; // network['interval'] == value('interval')
    // TODO: currently, this is recursive.
    // seems like it would be more optimized/simpler if it was non-recursive.
    inputs.forEach(function(input){
      input.send(prop, data);
    });
  }

  /**
   * Remove values from dataflow network.
   */

  function remove(values) {
    throw new Error('not implemented yet');
  }

  return teardown;
}
