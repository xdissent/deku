import raf from 'component-raf'
import assert from 'assert'
import {component,dom,World} from '../../'
import {TwoWords,mount,Span,div} from '../helpers'

var Test = component(TwoWords);

it.skip('should replace props on the scene', function(){
  var app = scene(Test)
    .setProps({ one: 'Hello', two: 'World' })

  mount(app, function(el, renderer){
    app.replaceProps({ one: 'Hello' })
    renderer.render()
    assert.equal(el.innerHTML, '<span>Hello undefined</span>')
  })
});

it.skip('should merge props on the scene', function(){
  var app = scene(Test)
    .setProps({ one: 'Hello', two: 'World' })

  mount(app, function(el, renderer){
    app.setProps({ two: 'Pluto' })
    renderer.render()
    assert.equal(el.innerHTML, '<span>Hello Pluto</span>')
  })
});

it.skip('should replace then set props on the scene', function(){
  var app = scene(Test)
    .setProps({ one: 'Hello', two: 'World' })

  mount(app, function(el, renderer){
    app.replaceProps({ one: 'Hello' });
    app.setProps({ two: 'Pluto' });
    renderer.render()
    assert.equal(el.innerHTML, '<span>Hello Pluto</span>')
  })
});

it('should update on the next frame', function(done){
  var world = World();
  var el = div();
  world.mount(el, Test, {
    one: 'Hello',
    two: 'World'
  });

  world.update(0, { one: 'Hello', two: 'Pluto' });
  assert.equal(el.innerHTML, '<span>Hello World</span>');

  requestAnimationFrame(function(){
    assert.equal(el.innerHTML, '<span>Hello Pluto</span>');
    done();
  });
});

it.skip('should not update props if the scene is removed', function (done) {
  var app = scene(component(Span))
    .setProps({ text: 'foo' })

  mount(app, function(el, renderer){
    renderer.update = function(){
      done(false)
    }
    app.setProps({ text: 'bar' });
    renderer.remove();
    raf(function(){
      done()
    });
  })
});

it.skip('should not update twice when setting props', function(){
  var i = 0;
  var IncrementAfterUpdate = component({
    afterUpdate: function(){
      i++;
    }
  });

  var app = scene(IncrementAfterUpdate)
    .setProps({ text: 'one' })

  mount(app, function(el, renderer){
    app.setProps({ text: 'two' });
    app.setProps({ text: 'three' });
    renderer.render();
    assert.equal(i, 1);
  })
});

it('should update child even when the parent props haven\'t changed', function(){
  var calls = 0;

  var Child = component(function(props){
    calls++;
    return dom('span', null, [ props.text ]);
  });

  var Parent = component(function(props){
    return dom('div', { name: props.character }, [
      dom(Child, { text: 'foo' })
    ]);
  });

  var world = World().set('renderImmediate', true);
  var el = div();
  world.mount(el, Parent, {
    character: 'Link'
  });

  world.update(0, { character: 'Zelda' });
  assert.equal(calls, 2);
});

// actually skip
it.skip('should call propsChanged when props are changed', function (done) {
  var Test = component({
    propsChanged: function(nextProps){
      assert(nextProps.foo);
      done();
    }
  });

  var app = scene(Test)
    .setProps({ foo: false })

  mount(app, function(el, renderer){
    app.setProps({ foo: true });
    renderer.render();
  })
});

it.skip('should call propsChanged on child components', function (done) {
  var Child = component({
    propsChanged: function(nextProps){
      assert(nextProps.count === 1);
      done();
    }
  });
  var Parent = component({
    render: function(props){
      return dom(Child, { count: props.count });
    }
  });

  var app = scene(Parent)
    .setProps({ count: 0 })

  mount(app, function(el, renderer){
    app.setProps({ count: 1 });
    renderer.render();
  })
});

// actually skip
it.skip('should not call propsChanged on child components when they props don\'t change', function(){
  // TODO
});
