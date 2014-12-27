
var assert = require('component/assert@0.4.0');
var component = require('/lib/component');
var Emitter = require('component/emitter');

describe('Scene Rendering', function(){

  it('should update props on the next frame', function(){
    var Component = component({
      render: function(dom, state, props){
        return dom('div', null, [props.text]);
      }
    });
    var mount = Component.render(el, {
      text: 'one'
    });
    mount.setProps({
      text: 'two'
    });
    assert(el.innerHTML === '<div>one</div>');
    assert(mount.entity.props.text === 'one');
  });

  it.skip('should only update on each frame if it has change', function () {

  });

  it('should return a promise', function(done){
    var Component = component({
      render: function(dom, state, props){
        return dom('div', null, [props.text]);
      }
    });
    var mount = Component.render(el, {
      text: 'one'
    });
    mount.setProps({ text: 'two' }).then(function(){
      assert(el.innerHTML === '<div>one</div>');
      assert(mount.entity.props.text === 'one');
      done();
    });
  });

  it('should setProps and call the callback', function(done){
    var Component = component({
      render: function(dom, state, props){
        return dom('div', null, [props.text]);
      }
    });
    var mount = Component.render(el, {
      text: 'one'
    });
    mount.setProps({ text: 'two' }, function(){
      assert(el.innerHTML === '<div>two</div>');
      done();
    });
  });

  it('should return a promise when changing the props', function(done){
    var Component = component({
      render: function(dom, state, props){
        return dom('div', null, [props.text]);
      }
    });
    var mount = Component.render(el, {
      text: 'one'
    });
    mount.setProps({ text: 'two' })
      .then(function(){
        assert(el.innerHTML === '<div>two</div>');
        done();
      });
  });

  it('should not update twice when setting props', function(done){
    var i = 0;
    var Component = component({
      render: function(dom, state, props){
        i++;
        return dom('div', null, [props.text]);
      }
    });
    var mount = Component.render(el, {
      text: 'one'
    });
    mount.setProps({ text: 'two' });
    mount.setProps({ text: 'three' }, function(){
      assert(i === 2);
      done();
    });
  });

  it('should only call `beforeUpdate` once', function(done){
    var i = 0;
    var Component = component({
      beforeUpdate: function(state, props, prevState, nextProps){
        i++;
        assert(props.text === 'one');
        assert(nextProps.text === 'three');
      },
      render: function(dom, state, props){
        return dom('div', null, [props.text]);
      }
    });
    var mount = Component.render(el, {
      text: 'one'
    });
    mount.setProps({ text: 'two' });
    mount.setProps({ text: 'three' }, function(){
      assert(i === 1);
      done();
    });
  });

  it('should throw update when setting state in `beforeUpdate`', function(done){
    var i = 0;
    var Component = component({
      initialState: function(){
        return {
          shield: 'Deku Shield'
        };
      },
      beforeUpdate: function(){
        var self = this;
        assert.throws(function(){
          self.setState({ shield: 'Mirror Shield' });
        });
        done();
      },
      render: function(dom, state, props){
        i++;
        return dom('div', null, [props.text, ' ', state.shield]);
      }
    });
    var mount = Component.render(el, { text: 'one' });
    mount.setProps({ text: 'two' });
  });

  it("should still call all callback even if it doesn't change", function(done){
    var Page = component({
      render: function(dom, state, props) {
        return dom('div', { name: props.name })
      }
    });
    var mount = Page.render(el, { name: 'Bob' });
    mount.setProps({ name: 'Bob' }, function(){
      done();
    });
  })

  it('should only render components once when state and props change', function(done){
    var i = 0;
    var emitter = new Emitter();
    var ComponentA = component({
      initialState: function(){
        return {
          text: 'Deku Shield'
        };
      },
      afterMount: function() {
        var self = this;
        emitter.on('data', function(text){
          self.setState({ text: text });
        })
      },
      render: function(dom, state, props){
        i++;
        console.log(state, props);
        return dom('div', null, [props.text, ' ', state.text]);
      }
    });
    var ComponentB = component({
      render: function(dom, state, props){
        i++;
        return dom('div', null, [
          dom(ComponentA, { text: props.text })
        ]);
      }
    });
    var mount = ComponentB.render(el, { text: '2x' });
    i = 0;

    // Mark ComponentA as dirty from a state change
    emitter.emit('data', 'Mirror Shield');

    // Mark ComponentB as dirty
    mount.setProps({ text: '3x' }, function(){
      assert.equal(i, 2);
      assert.equal(el.innerHTML, "<div><div>3x Mirror Shield</div></div>");
      done();
    });
  });
});
