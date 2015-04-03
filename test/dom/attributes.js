import trigger from 'trigger-event'
import raf from 'component-raf'
import assert from 'assert'
import {component,dom,World} from '../../'
import {mount,div} from '../helpers'

var AttrComponent = component(function(props, state){
  var attrs = {};
  if (props.name) attrs.name = props.name;
  return dom('span', attrs);
});

it.skip('should add/update/remove attributes', function(){
  var app = World(AttrComponent)
  mount(app, function(el, renderer){
    assert.equal(el.innerHTML, '<span></span>')
    app.setProps({ name: 'Bob' })
    renderer.render()
    assert.equal(el.innerHTML, '<span name="Bob"></span>')
    app.setProps({ name: 'Tom' })
    renderer.render()
    assert.equal(el.innerHTML, '<span name="Tom"></span>')
    app.setProps({ name: null })
    renderer.render()
    assert.equal(el.innerHTML, '<span></span>')
  })
})

it.skip('should not touch the DOM if attributes have not changed', function(){
  var pass = true;
  var app = World(AttrComponent)
    .setProps({ name: 'Bob' })
  mount(app, function(el, renderer){
    el.setAttribute = function(){
      pass = false;
    }
    app.setProps({ name: 'Bob' })
    renderer.render()
    assert(pass)
  })
})

it.skip('should update the real value of input fields', function(){
  var Input = component({
    render: function(props, state){
      return dom('input', { value: props.value })
    }
  });

  var app = World(Input)
    .setProps({ value: 'Bob' })

  mount(app, function(el, renderer){
    assert(el.querySelector('input').value === 'Bob');
    app.setProps({ value: 'Tom' });
    renderer.render();
    assert(el.querySelector('input').value === 'Tom');
  })
})

it('should render innerHTML', function(){
  var Test = component(function(){
    return dom('div', { innerHTML: 'Hello <strong>World</strong>' });
  });
  var world = World();
  var el = div();
  world.mount(el, Test);
  assert.equal(el.innerHTML,'<div>Hello <strong>World</strong></div>');
});

it.skip('should update innerHTML', function(){
  var Test = component(function(props){
    return dom('div', { innerHTML: props.content });
  });

  var app = World(Test)
    .setProps({ content: 'Hello <strong>World</strong>' })

  mount(app, function(el, renderer){
    app.setProps({ content: 'Hello <strong>Pluto</strong>' });
    renderer.render();
    assert.equal(el.innerHTML,'<div>Hello <strong>Pluto</strong></div>');
  })
})
