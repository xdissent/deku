
/**
 * Expose `interval`.
 */

module.exports = interval;

/**
 * Send interval data to browser.
 *
 *   component()
 *     .prop('count', value('interval').every('second'))
 *
 * @param {World} world
 * @param {Function} send How this data source sends data to the world.
 * @return {Function} teardown Unsubscribe from this datasource.
 */

function interval(world){
  setup();

  /**
   * Setup.
   */

  function setup() {
    world.intervals = {}; // intervals with key as milliseconds, to reuse.
    world.on('insert value', connect);
  }

  /**
   * Teardown.
   */

  function teardown() {
    world.off('insert value', connect);
    for (var interval in world.intervals) {
      clearInterval(world.intervals[interval]);
    }
    world.intervals = {};
  }

  /**
   * When a `value('interval')` gets used by a component, hook it up.
   *
   * @param {Value} value
   */

  function connect(value) {
    if ('interval' != value.type) return;
    var interval = value.interval;
    // already handled
    if (world.intervals[interval]) return;
    world.intervals[interval] = setTimeout(handle, interval);

    /**
     * Handle a specific interval, updating anything subscribing to it.
     */

    function update() {
      send('update value', {
        type: 'interval',
        data: interval // second count that updated
      });
    }
  }

  return teardown;
}
