import assert from 'assert'
import {component,dom,World} from '../../'
import {mount,div} from '../helpers'

/**
 * Custom components used for testing
 */

var Toggle = component(function(props){
  return props.showChildren
    ? dom('div', null, [dom('span', { id: 'foo' })])
    : dom('div');
});

var CustomTag = component(function(props){
  return dom(props.type);
});

var AdjacentTest = component(function(props){
  if (props.i === 1) return dom('div', { id: 'root' }, [dom('span', { id: 'foo' }), dom('span', { id: 'bar' }), dom('span', { id: 'baz' })]);
  if (props.i === 2) return dom('div', { id: 'root' }, [dom('span', { id: 'foo' })]);
});

var BasicComponent = component(function(props){
  return dom('div', null, ['component']);
});

var ComponentToggle = component(function(props){
  return props.showComponent
    ? dom(BasicComponent)
    : dom('span');
});

/**
 * When updating a component it should add new elements
 * that are created on the new pass. These elements should
 * be added to the DOM.
 */

it('should add/remove element nodes', function(){
  var world = World().set('renderImmediate', true);
  var el = div();
  world.mount(el, Toggle, {
    showChildren: false
  });

  assert.equal(el.innerHTML, '<div></div>');
  world.update({ showChildren: true });
  assert.equal(el.innerHTML, '<div><span id="foo"></span></div>');
  world.update({ showChildren: false });
  assert.equal(el.innerHTML, '<div></div>');
});

/**
 * When updating a component it should remove child elements
 * from the DOM that don't exist in the new rendering but leave the existing nodes.
 */

it('should only remove adjacent element nodes', function(){
  var world = World().set('renderImmediate', true);
  var el = div();
  world.mount(el, AdjacentTest, {
    i: 1
  });

  assert(document.querySelector('#foo'));
  assert(document.querySelector('#bar'));
  assert(document.querySelector('#baz'));
  world.update({ i: 2 });
  assert(document.querySelector('#foo'));
  assert(document.querySelector('#bar') == null);
  assert(document.querySelector('#baz') == null);
});

/**
 * It should change the tag name of element.
 */

it('should change tag names', function(){
  var world = World().set('renderImmediate', true);
  var el = div();
  world.mount(el, CustomTag, {
    type: 'span'
  });

  assert.equal(el.innerHTML, '<span></span>');
  world.update({ type: 'div' });
  assert.equal(el.innerHTML, '<div></div>');
});

/**
 * Because the root node has changed, when updating the mounted component
 * should have it's element updated so that it applies the diff patch to
 * the correct element.
 */

it('should change root node and still update correctly', function(){
  var ComponentA = component(function(props){
    return dom(props.type, null, props.text);
  });
  var Test = component(function(props){
    return dom(ComponentA, { type: props.type, text: props.text });
  });

  var world = World().set('renderImmediate', true);
  var el = div();
  world.mount(el, Test, {
    type: 'span',
    text: 'test'
  });

  assert.equal(el.innerHTML, '<span>test</span>');
  world.update({ type: 'div', text: 'test' });
  assert.equal(el.innerHTML, '<div>test</div>');
  world.update({ type: 'div', text: 'foo' });
  assert.equal(el.innerHTML, '<div>foo</div>');
});

/**
 * When a node is removed from the tree, all components within that
 * node should be recursively removed and unmounted.
 */

it.skip('should unmount components when removing an element node', function(){
  var i = 0;
  function inc() { i++ }
  var UnmountTest = component({
    afterUnmount: inc,
    beforeUnmount: inc
  });

  var App = component({
    render: function(props, state){
      if (props.showElements) {
        return dom('div', null, [
          dom('div', null, [
            dom(UnmountTest)
          ])
        ]);
      }
      else {
        return dom('div');
      }
    }
  });

  var app = scene(App)
    .setProps({ showElements: true })

  mount(app, function(el, renderer){
    app.setProps({ showElements: false });
    renderer.render();
    assert.equal(i, 2);
  })
});

/**
 * When a component has another component directly rendered
 * with it, it should be able to swap out the type of element
 * that is rendered.
 */

it('should change sub-component tag names', function(){
  var Test = component(function(props){
    return dom(CustomTag, { type: props.type });
  });

  var world = World().set('renderImmediate', true);
  var el = div();
  world.mount(el, Test, {
    type: 'span'
  });

  assert.equal(el.innerHTML, '<span></span>');
  world.update({ type: 'div' });
  assert.equal(el.innerHTML, '<div></div>');
});

/**
 * It should be able to render new components when re-rendering
 */

it('should replace elements with component nodes', function(){
  var Test = component(function(props){
    return props.showElement
      ? dom('span', null, ['element'])
      : dom(BasicComponent);
  });

  var world = World().set('renderImmediate', true);
  var el = div();
  world.mount(el, Test, {
    showElement: true
  });

  assert.equal(el.innerHTML, '<span>element</span>');
  world.update({ showElement: false });
  assert.equal(el.innerHTML, '<div>component</div>');
});

/**
 * If the component type changes at a node, the first component
 * should be removed and unmount and replaced with the new component
 */

it.skip('should replace components', function(){
  var ComponentA = component(function(props){
    return dom('div', null, ['A']);
  });
  var ComponentB = component(function(props){
    return dom('div', null, ['B']);
  });
  var ComponentC = component(function(props){
    return props.type === 'A'
      ? dom(ComponentA)
      : dom(ComponentB);
  });

  var world = World().set('renderImmediate', true);
  var el = div();
  world.mount(el, ComponentC, {
    type: 'A'
  });

  assert.equal(el.innerHTML, '<div>A</div>');
  world.update({ type: 'B' });
  assert.equal(el.innerHTML, '<div>B</div>')
  // TODO
  // var childId = renderer.children[app.root.id]['0'];
  // var entity = renderer.entities[childId];
  // assert(entity.component instanceof ComponentB);
});

/**
 * It should remove components from the children hash when they
 * are moved from the tree.
 */

it.skip('should remove references to child components when they are removed', function(){
  var app = scene(ComponentToggle)
    .setProps({ showComponent: true })

  mount(app, function(el, renderer){
    var entityId = app.root.id;
    assert(renderer.children[entityId]);
    app.setProps({ showComponent: false });
    renderer.render()
    assert(!renderer.children[entityId]['0']);
  })
});

