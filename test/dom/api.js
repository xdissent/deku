/** @jsx dom */

import assert from 'assert'
import {dom,render,remove,inspect} from '../../'
import {div} from '../helpers'

it('should curry the render function for a container', function(){
  var app1 = (<span>Hello World</span>);
  var app2 = (<span>Goodbye World</span>);
  var el = div();
  var elRender = render(el, { batching: false });
  assert.equal(el.innerHTML, '');
  elRender(app1);
  assert.equal(el.innerHTML, '<span>Hello World</span>');
  elRender(app2);
  assert.equal(el.innerHTML, '<span>Goodbye World</span>');
  remove(el);
  elRender(app1);
  assert.equal(el.innerHTML, '<span>Hello World</span>');
  render(app2, el, { batching: false });
  assert.equal(el.innerHTML, '<span>Goodbye World</span>');
  elRender(app1);
  assert.equal(el.innerHTML, '<span>Hello World</span>');
  remove(el);
  assert.equal(el.innerHTML, '');
})

it('should remove an element', function(){
  var app = (<span>Hello World</span>);
  var el = div();
  render(app, el, { batching: false });
  assert.equal(el.innerHTML, '<span>Hello World</span>');
  remove(el);
  assert.equal(el.innerHTML, '');
  // Double remove
  remove(el);
  assert.equal(el.innerHTML, '');
})

it('should inspect an element', function(){
  var app = (<span>Hello World</span>);
  var el = div();
  var inspected = inspect(el)
  assert.equal('object', typeof inspected)
  assert('entities' in inspected)
  assert('pools' in inspected)
  assert('handlers' in inspected)
  assert('currentElement' in inspected)
  assert('options' in inspected)
  assert('container' in inspected)
  assert('children' in inspected)
  assert.equal(0, Object.keys(inspected.children).length)
  assert.equal(null, inspected.currentElement)
  render(app, el, { batching: false });
  inspected = inspect(el)
  assert.equal(1, Object.keys(inspected.children).length)
  assert.notEqual(null, inspected.currentElement)
  remove(el);
  inspected = inspect(el)
  assert.equal(0, Object.keys(inspected.children).length)
})
