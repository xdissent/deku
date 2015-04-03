
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
    world.network = {};
    world.sources = {};
    world.on('insert value', insert);
    world.on('update value', update);
    world.on('remove value', remove);
    subscribe();
  }

  /**
   * Unsubscribe from data source.
   */

  function teardown() {
    world.network = {};
    world.sources = {};
    world.off('insert value', insert);
    world.off('update value', update);
    world.off('remove value', remove);
    unsubscribe();
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
   * Add a value to the dataflow network.
   *
   * TODO: This should be a simple, though complex, algorithm to figure out.
   * Once this is done, then the data is wired up!
   *
   * TODO: merge these in an optimal way to the `world.network`.
   * 1. create `IO` node from this `value`.
   * 2. pipe io change to value
   * 3. also, somehow insert IO node in proper place in existing IO graph.
   *
   * @param {Value} value
   */

  function insert(value) {
    var network = world.network;
    var sources = world.sources;
    // build list of them from parent to child for iterating.
    var child = value;
    var chain = [ child ];
    while (child.parent) {
      child = child.parent;
      chain.unshift(child);
    }

    var parentPath;
    var parentIO;
    var parent;
    var path;
    var io;

    // pipe parents to children when they change.
    // this builds the whole IO graph.
    chain.forEach(function(child){
      if (!parent) {
        path = child.type;
        // it's a root child
        if (!sources[path]) throw new Error('Source "' + path + '" doesnt exist.');
        io = network[path] = network[path] || IO(path);
        parentPath = path;
        parent = child;
        parentIO = io;
        return;
      }

      // can't be a source after this point (it seems, at least gonna try)
      path = parentPath + '.' + child.type; // interval.map, interval.filter.convert..., etc.
      io = network[path];
      // TODO: somehow create function inside `IO` for actually
      // doing the map/filter/etc.
      if (!io) {
        io = network[path] = IO();
        // pipe parentIO to childIO, but only first time around.
        parentIO.pipe(io);
      }
    });

    // then when the last value changes, emit an event on the value.
    // this will cause components to update!
    // that happens in ./dom.js
    io.pipe(value); // `io` is the last one.
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
    inputs.forEach(function(input){
      input.send(data);
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
