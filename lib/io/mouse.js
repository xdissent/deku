
/**
 * Expose `mouse`.
 */

module.exports = mouse;

/**
 * Handle standard mouse click events, and TODO normalize touch events.
 *
 * @param {World} world
 * @return {Function} teardown Unsubscribe from this datasource.
 */

function mouse(world) {
  setup();

  /**
   * Setup data source.
   */

  function setup() {
    window.addEventListener('onmousedown', handle);
    window.addEventListener('onmousemove', handle);
    window.addEventListener('onmouseover', handle);
    window.addEventListener('ondblclick', handle);
    window.addEventListener('onmouseout', handle);
    window.addEventListener('onmouseup', handle);
    window.addEventListener('onclick', handle);
  }

  /**
   * Teardown data source.
   */

  function teardown() {
    window.removeEventListener('onmousedown', handle);
    window.removeEventListener('onmousemove', handle);
    window.removeEventListener('onmouseover', handle);
    window.removeEventListener('ondblclick', handle);
    window.removeEventListener('onmouseout', handle);
    window.removeEventListener('onmouseup', handle);
    window.removeEventListener('onclick', handle);
  }

  /**
   * Handle event.
   *
   * @param {Event} event
   */

  function handle(event) {
    world.send('update value', {
      type: 'mouse', // TODO: click/dbclick/etc.
      data: event
    });
  }

  return teardown;
}
