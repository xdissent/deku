
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
  world.source('string', string);
  if ('undefined' == typeof window) return;
  world.source('interaction', interaction);
  world.source('data', dataflow);
  world.source('dom', dom);
}
