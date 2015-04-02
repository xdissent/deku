
/**
 * Expose `dataflow`.
 */

module.exports = dataflow;

/**
 * Define dataflow IO for world.
 *
 * @param {World} world
 * @return {Function} teardown Unsubscribe from this datasource.
 */

function dataflow(world) {
  setup();

  /**
   * Subscribe to data source.
   */

  function setup() {
    world.sources = {};
    world.on('unsubscribe', unsubscribe);
    world.on('subscribe', subscribe);
    world.on('insert value', insert);
    world.on('update value', update);
    world.on('remove value', remove);
  }

  /**
   * Unsubscribe from data source.
   */

  function teardown() {
    world.sources = {};
    world.off('unsubscribe', unsubscribe);
    world.off('subscribe', subscribe);
    world.off('insert value', insert);
    world.off('update value', update);
    world.off('remove value', remove);
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
      var unsubscribe = subscribe(world, send);
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
    world.subscriptions = {}; // reset
  }

  /**
   * Add a set of values to the dataflow network.
   *
   * TODO: This should be a simple, though complex, algorithm to figure out.
   * Once this is done, then the data is wired up!
   *
   * @param {Value} value
   */

  function insert(value) {
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
    var type = message.type;
    var data = message.data;
    var inputs = world.network[type]; // network['interval'] == value('interval')
    // TODO: currently, this is recursive.
    // seems like it would be more optimized/simpler if it was non-recursive.
    inputs.forEach(function(input){
      input.send(type, data);
    });
  }

  /**
   * Remove values from dataflow network.
   */

  function remove(value) {
    throw new Error('not implemented yet');
  }

  return teardown;
}
