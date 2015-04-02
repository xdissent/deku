
/**
 * Expose `mouse`.
 */

module.exports = mouse;

/**
 * Handle standard mouse click events, and TODO normalize touch events.
 */

function mouse(world, send) {
  window.addEventListener('onmousedown', send);
  window.addEventListener('onmousemove', send);
  window.addEventListener('onmouseover', send);
  window.addEventListener('ondblclick', send);
  window.addEventListener('onmouseout', send);
  window.addEventListener('onmouseup', send);
  window.addEventListener('onclick', send);

  function unsubscribe() {
    window.removeEventListener('onmousedown', send);
    window.removeEventListener('onmousemove', send);
    window.removeEventListener('onmouseover', send);
    window.removeEventListener('ondblclick', send);
    window.removeEventListener('onmouseout', send);
    window.removeEventListener('onmouseup', send);
    window.removeEventListener('onclick', send);
  }

  return unsubscribe;
}
