
/**
 * Expose `interval`.
 */

module.exports = interval;

/**
 * Send interval data to browser.
 *
 *   component()
 *     .prop('count', value('interval').every('second'))
 */

function interval(world, send){
  setup();

  /**
   * Setup.
   */

  function setup() {
    world.intervals = {}; // intervals with key as milliseconds, to reuse.
    world.on('define value', define);
  }

  /**
   * Teardown.
   */

  function teardown() {
    world.off('define value', define);
    Object.keys(world.intervals).map(clearInterval);
    world.intervals = {};
  }

  /**
   * When a `value('interval')` gets used by a component,
   * hook it up.
   */

  function define(value) {
    if ('interval' != value.type) return;
    var interval = value.interval;
    if (!world.intervals[interval]) {
      var data = world.intervals[interval] = {};
      data.values = [ value ];
      data.id = setTimeout(update, interval);
    } else {
      var data = world.intervals[interval];
      data.values.push(value);
    }
  }

  /**
   * Handle a specific interval, updating anything subscribing to it.
   */

  function update() {
    var values = world.intervals[interval].values;
    // TODO: some more robust piping todo.
    values.forEach(function(value){
      value.update();
    });
  }

  return teardown;
}
