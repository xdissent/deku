
var assert = require('component/assert@0.4.0');
var component = require('/lib/component');

describe('Component Lifecycle Hooks', function(){
  it('should fire the `afterMount` hook', function(done){
    var Page = component({
      afterMount: function(){
        done();
      }
    });
    Page.render(el);
  })

  it('should fire the `afterUnmount` hook', function(done){
    var Page = component({
      afterUnmount: function(){
        done();
      }
    });
    var mount = Page.render(el);
    mount.remove();
  })

  it('should fire the `beforeMount` hook before `mount`', function(){
    var pass;
    var Page = component({
      beforeMount: function(){
        pass = false;
      },
      afterMount: function(){
        pass = true;
      }
    });
    Page.render(el);
    assert(pass);
  })

  it('should fire the `beforeUnmount` hook before `unmount`', function(){
    var pass;
    var Page = component({
      beforeUnmount: function(){
        pass = false;
      },
      afterUnmount: function(){
        pass = true;
      }
    });
    Page.render(el).remove();
    assert(pass);
  })

  it('should not unmount twice', function(){
    var Page = component();
    var mount = Page.render(el);
    mount.remove();
    mount.remove();
  })

  it('should fire mount events on sub-components', function(){
    var i = 0;

    function inc() { i++ }

    var ComponentA = component({
      afterMount: inc,
      beforeMount: inc,
      render: function(n, state, props){
        return n('span', { name: props.name }, [props.text]);
      }
    });

    var ComponentB = component({
      afterMount: inc,
      beforeMount: inc,
      render: function(n, state, props){
        return n(ComponentA, { text: 'foo', name: props.name });
      }
    });

    var mount = ComponentB.render(el, { name: 'Bob' });
    assert(i === 4, i);
  });

  it('should fire unmount events on sub-components', function(){
    var i = 0;

    function inc() { i++ }

    var ComponentA = component({
      afterUnmount: inc,
      beforeUnmount: inc,
      render: function(n, state, props){
        return n('span', { name: props.name }, [props.text]);
      }
    });

    var ComponentB = component({
      afterUnmount: inc,
      beforeUnmount: inc,
      render: function(n, state, props){
        return n(ComponentA, { text: 'foo', name: props.name });
      }
    });

    var mount = ComponentB.render(el, { name: 'Bob' });
    mount.remove();
    assert(i === 4, i);
    assert(el.innerHTML === "");
  });

  it('should fire mount events on sub-components created later', function(done){
    var calls = 0;
    function inc() { calls++ }

    var ComponentA = component({
      afterMount: inc,
      beforeMount: inc,
      render: function(n, state, props){
        return n('span', { name: props.name }, [props.text]);
      }
    });

    var ComponentB = component({
      afterMount: inc,
      beforeMount: inc,
      render: function(n, state, props){
        if (props.i === 1) {
          return n();
        } else {
          return n(ComponentA, { text: 'foo', name: props.name });
        }
      }
    });

    var mount = ComponentB.render(el, { name: 'Bob', i: 1 });
    mount.setProps({
      i: 2
    }, function(){
      assert.equal(calls, 4);
      done();
    });

  });

  it('should fire unmount events on sub-components created later', function(done){
    var calls = 0;
    function inc() { calls++ }

    var ComponentA = component({
      afterUnmount: inc,
      beforeUnmount: inc,
      render: function(n, state, props){
        return n('span', { name: props.name }, [props.text]);
      }
    });

    var ComponentB = component({
      afterUnmount: inc,
      beforeUnmount: inc,
      render: function(n, state, props){
        if (props.i !== 1) {
          return n();
        } else {
          return n(ComponentA, { text: 'foo', name: props.name });
        }
      }
    });

    var mount = ComponentB.render(el, { name: 'Bob', i: 1 });
    mount.setProps({
      i: 2
    }, function(){
      assert.equal(calls, 4);
      done();
    });
  });
});
