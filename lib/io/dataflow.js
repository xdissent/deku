
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
    world.on('update values', process);
  }

  /**
   * Unsubscribe.
   */

  function unsubscribe() {
    world.sources = {};
    world.off('update values');
  }

  /**
   * Pass source events through the dataflow graph.
   *
   * @param {String} id
   * @param {Object} data
   */

  function process(id, data) {
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
