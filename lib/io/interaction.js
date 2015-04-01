
/**
 * Module dependencies.
 */

var throttle = require('per-frame');
var keypath = require('object-path');

/**
 * All of the events we will bind to
 */

var events = [
  'blur',
  'change',
  'click',
  'contextmenu',
  'copy',
  'cut',
  'dblclick',
  'drag',
  'dragend',
  'dragenter',
  'dragexit',
  'dragleave',
  'dragover',
  'dragstart',
  'drop',
  'focus',
  'input',
  'keydown',
  'keyup',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'paste',
  'scroll',
  'submit',
  'touchcancel',
  'touchend',
  'touchmove',
  'touchstart',
  'wheel'
];

/**
 * Expose `interactions`.
 */

module.exports = interactions;

/**
 * Handle events for a component.
 */

function interactions(world, input, send) {
  world.handlers = {}; // for easier debugging.

  /**
   * Bind events for an element, and all it's rendered child elements.
   */

  function bind(namespace, path, event, fn) {
    keypath.set(world.handlers, [namespace, path, event], throttle(fn));
  }

  /**
   * Unbind events for a namespace.
   */

  function unbind(namespace) {
    delete world.handlers[namespace];
  }

  /**
   * Start listening for events
   */

  function resume() {
    events.forEach(function(name){
      el.addEventListener(name, handle, true);
    });
  }

  /**
   * Stop listening for events
   */

  function pause() {
    events.forEach(function(name){
      el.removeEventListener(name, handle, true);
    });
  }

  /**
   * After render, finally bind event listeners.
   */

  function remove() {
    world.handlers = {};
    pause();
  }

  /**
   * Handle an event that has occured within the container.
   */

  function handle(event) {
    var target = event.target;
    var handlers = world.handlers;
    var entityId = target.__entity__;
    var eventType = event.type;

    // Walk up the DOM tree and see if there is a handler
    // for this event type higher up.
    while (target && target.__entity__ === entityId) {
      var fn = keypath.get(handlers, [entityId, target.__path__, eventType]);
      if (fn) {
        event.delegateTarget = target;
        fn(event);
        break;
      }
      target = target.parentNode;
    }
  }
}
