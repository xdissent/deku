
/**
 * Expose `dataflow`.
 */

module.exports = dataflow;

/**
 * Define dataflow IO for world.
 */

function dataflow(world) {
  subscribe();

  /**
   * Subscribe.
   */

  function subscribe() {
    world.sources = {};
    world.on('subscribe', onsubscribe)
    world.on('update values', onprocess);
  }

  /**
   * Unsubscribe.
   */

  function unsubscribe() {
    world.sources = {};
    world.off('update values');
  }

  function onsubscribe() {
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

  function onunsubscribe() {
    var subscriptions = world.subscriptions
    for (var name in subscriptions) {
      var unsubscribe = subscriptions[name];
      unsubscribe();
    }
    // reset
    world.subscriptions = {};
  }

  /**
   * Pass source events through the dataflow graph.
   *
   * @param {String} id
   * @param {Object} data
   */

  function onprocess(id, data) {
    var io = world.io[id];
    var field = io.type;
    var ids = world.connections[id];
    for (var i = 0, n = ids.length; i < n; i++) {
      var inputId = ids[i];
      var input = world.io[inputId];
      input.send(field, data);
    }
  }
}
