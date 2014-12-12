
/**
 * Module dependencies
 */

var Loop = require('./loop');
var Interactions = require('./interactions');
var Entity = require('./entity');
var Emitter = require('component/emitter');
var assign = require('sindresorhus/object-assign');

/**
 * Expose `Scene`
 *
 * @type {Function}
 */

module.exports = Scene;

/**
 * A scene renders a component tree to an element
 * and manages the lifecycle and events each frame.
 *
 * TODO: move interactions here
 *
 * @param {HTMLElement} container
 * @param {Entity} entity
 */

function Scene(container) {
  this.interactions = new Interactions(container);
  this.container = container;
  this.loop = new Loop();
}

assign(Scene.prototype, Emitter.prototype);

/**
 * Add an element to the scene
 *
 * @param {HTMLElement} el
 *
 * @return {void}
 */

Scene.prototype.append = function(el) {
  this.container.appendChild(el);
};

/**
 * Force update all the components
 */

Scene.prototype.update = function(){
  this.emit('update');
};

/**
 * Set new props on the component and trigger a re-render.
 *
 * TODO: could we use promises instead of callbacks?
 *
 * @param {Object} newProps
 * @param {Function} [done]
 */

Scene.prototype.setProps = function(newProps, done){
  if (done) this.once('update', done);
  this.entity.setProps(newProps);
};

/**
 * Remove the component from the DOM.
 */

Scene.prototype.remove = function(){
  this.loop.pause();
  this.interactions.remove();
  this.emit('end');
};