
/**
 * Module dependencies.
 */

var interaction = require('./interaction');
var dataflow = require('./dataflow');
var string = require('./string');
var dom = require('./dom');

/**
 * Expose `io`.
 */

module.exports = io;

/**
 * Attach IO plugins to the world.
 */

function io(world) {
  world.io('string', string);
  if ('undefined' == typeof window) return;
  world.io('interaction', interaction);
  world.io('data', dataflow);
  world.io('dom', dom);
}
