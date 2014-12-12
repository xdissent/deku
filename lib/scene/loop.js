
/**
 * Module dependecies
 */

var raf = require('component/raf');
var Emitter = require('component/emitter');

/**
 * Export `Loop`
 */

module.exports = Loop;

/**
 * The loop calls a function every animation frame
 *
 * @param {Function} fn
 */

function Loop() {
  this.resume();
}

/**
 * Mixins
 */

Emitter(Loop.prototype);

/**
 * Start the loop
 */

Loop.prototype.resume = function() {
  var self = this;
  if (this.running) return;
  this.running = true;
  this.frame = raf(function tick(timestamp){
    self.emit('tick', timestamp);
    self.frame = raf(tick);
  });
};

/**
 * Stop the loop.
 */

Loop.prototype.pause = function() {
  if (this.frame) raf.cancel(this.frame);
  this.frame = null;
  this.running = false;
};

/**
 * Add a handler
 */

Loop.prototype.add = function(fn) {
  var loop = this;
  var handle = {
    pause: function(){
      loop.off('tick', fn);
    },
    resume: function(){
      loop.on('tick', fn);
    }
  };
  handle.resume();
  return handle;
};