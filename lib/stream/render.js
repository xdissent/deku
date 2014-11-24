
/**
 * Expose `RenderStream`.
 */

module.exports = RenderStream;

/**
 * Initialize a new `RenderStream`.
 *
 * This is just a queue holding the patch for a component.
 * It gets passed into the rendering queue.
 */

function RenderStream() {
}

/**
 * Push patch into queue.
 *
 * @param {Object} patch
 */

RenderStream.prototype.push = function(patch){
  // TODO: something, maybe here it would get the component renderer or something.
  patch.apply(document.body);
};
