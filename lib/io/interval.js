
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
    world.on('initialize source interval', initialize);
  }

  /**
   * Teardown.
   */

  function teardown() {
    world.off('initialize source interval', initialize);
    Object.keys(world.intervals).map(clearInterval);
    world.intervals = {};
  }

  /**
   * When a `source('interval')` gets used by a component,
   * hook it up.
   */

  function initialize(input) {
    var interval = input.interval;
    if (!world.intervals[interval]) {
      var data = world.intervals[interval] = {};
      data.values = [ input ];
      data.id = setTimeout(update, interval);
    } else {
      var data = world.intervals[interval];
      data.values.push(input);
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
