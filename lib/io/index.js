
/**
 * Module dependencies.
 */

var dataflow = require('./dataflow');
var dom = require('./dom');

/**
 * Expose `io`.
 */

module.exports = io;

/**
 * Attach IO plugins to the world.
 */

function io(world) {
  if ('undefined' == typeof window) return;
  world.source('data', dataflow);
  world.source('dom', dom);
}
