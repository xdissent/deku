import assert from 'assert'
import {component,dom,World} from '../../'
import {mount,div} from '../helpers'

var Toggle = component(function(props){
  return props.showText
    ? dom('div', null, [ props.text ])
    : dom('div');
});

it('should add/update/remove text nodes', function(){
  var world = World().set('renderImmediate', true);
  var el = div();
  world.mount(el, Toggle, {
    showText: false
  });

  assert.equal(el.innerHTML, '<div></div>');
  // add
  world.update(0, { showText: true, text: 'bar' });
  assert.equal(el.innerHTML, '<div>bar</div>');
  // update
  world.update(0, { text: 'Hello Pluto' });
  assert.equal(el.innerHTML, '<div>Hello Pluto</div>');
  // remove
  world.update(0, { showText: false });
  assert.equal(el.innerHTML, '<div></div>');
});
