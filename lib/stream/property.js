
/**
 * Expose `PropertyStream`.
 */

module.exports = PropertyStream;

/**
 * Initialize a new `PropertyStream`.
 *
 * This is basically like a cursor (from om) or property in bacon,
 * or an input stream.
 */

function PropertyStream() {
  this.queue = [];
}

/**
 * Push properties into queue.
 *
 * @param {Object} properties
 */

PropertyStream.prototype.push = function(properties){
  this.queue.push(properties);
};

/**
 * Pipe properties to change stream.
 *
 * @param {NodeStream} changes
 */

PropertyStream.prototype.pipe = function(changes){
  this.on('data', function(properties){
    changes.push(properties);
  });
};
