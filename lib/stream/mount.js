
/**
 * Expose `MountStream`.
 */

module.exports = MountStream;

/**
 * Initialize a new `MountStream`.
 *
 * This holds a queue of actions (append or remove)
 * for components to/from the actual dom.
 */

function MountStream() {
  this.queue = [];
}

/**
 * Push action into queue.
 *
 * @param {Object} action
 *   @property {Component} component
 *   @property {String} type
 */

MountStream.prototype.push = function(action){
  this.queue.push(action);
};

/**
 * Pipe changes to top-level rendering coordinator stream.
 *
 * @param {RenderStream} renderer
 */

MountStream.prototype.pipe = function(renderer){
  this.on('data', function(action){
    var component = action.component;
    var container = action.container;
    var type = action.type;

    if ('mount' == type) {
      // TODO: transition in and append to dom.
      component._beforeMount();
      container.appendChild(component.el);
      component._afterMount();
      return;
    }

    if ('unmount' == type) {
      // TODO: transition out and remove from dom.
      var el = this.el;
      if (!el) return;
      // TODO: add support for animation transitions (async behavior).
      component.trigger('beforeUnmount', [
        component.el,
        component.state,
        component.props,
      ]);
      if (el.parentNode) el.parentNode.removeChild(el);
      component.each(function(child){
        child.remove();
      });
      component.trigger('afterUnmount', [
        component.el,
        component.state,
        component.props,
      ]);
      component.children = {};
      component.el = null;
      return;
    }
  });
};
