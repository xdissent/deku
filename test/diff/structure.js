
var assert = require('component/assert@0.4.0');
var component = require('/lib/component');

describe('structure', function(){

  /**
   * When updating a component it should add new elements
   * that are created on the new pass. These elements should
   * be added to the DOM.
   */

  it('should add new elements', function(done){
    var Page = component({
      render: function(dom, state, props){
        if (props.i === 1) return dom('div');
        if (props.i === 2) return dom('div', null, [dom('span', { id: 'foo' })]);
      }
    });
    var mount = Page.render(el, { i: 1 });
    assert(document.querySelector('#foo') == null);
    mount.setProps({ i: 2 }, function(){
      assert(document.querySelector('#foo'));
      done();
    });
  });

  /**
   * When updating a component it should remove elements
   * from the DOM that don't exist in the new rendering.
   */

  it('should remove nodes', function(done){
    var Page = component({
      render: function(dom, state, props){
        if (props.i === 1) return dom('div', null, [dom('span', { id: 'foo' })]);
        if (props.i === 2) return dom('div');
      }
    });
    var mount = Page.render(el, { i: 1 });
    assert(document.querySelector('#foo'));
    mount.setProps({ i: 2 }, function(){
      assert(document.querySelector('#foo') == null);
      done();
    });
  });

  /**
   * When updating a component it should remove child elements
   * from the DOM that don't exist in the new rendering.
   */

  it('should remove child nodes', function(done){
    var Page = component({
      render: function(dom, state, props){
        if (props.i === 1) return dom('div', { id: 'root' }, [dom('span', { id: 'foo' }), dom('span', { id: 'bar' }), dom('span', { id: 'baz' })]);
        if (props.i === 2) return dom('div', { id: 'root' }, [dom('span', { id: 'foo' })]);
      }
    });
    var scene = Page.render(el, { i: 1 });
    assert(document.querySelector('#foo'));
    assert(document.querySelector('#bar'));
    assert(document.querySelector('#baz'));
    scene.setProps({ i: 2 }, function(){
      assert(document.querySelector('#foo'));
      assert(document.querySelector('#bar') == null);
      assert(document.querySelector('#baz') == null);
      done();
    });
  });

  /**
   * It should change the tag name of element and keep
   * the same content.
   */

  it('should change tag names', function(done){
    var i = 0;
    var ComponentA = component({
      render: function(n, state, props){
        return n(props.type, null, ['test']);
      }
    });
    var mount = ComponentA.render(el, { type: 'span' });
    assert.equal(el.innerHTML, '<span>test</span>');
    mount.setProps({ type: 'div' }, function(){
      assert.equal(el.innerHTML, '<div>test</div>');
      done();
    });
  });

  /**
   * If there are child component that actually reference the same
   * element as the root element, we need to make sure the references
   * are updated correctly.
   */

  it('should change tag names and update parent components that reference the element', function(){
    var i = 0;
    var ComponentA = component({
      render: function(n, state, props){
        return n(props.type, null, ['test']);
      }
    });
    var ComponentB = component({
      render: function(n, state, props){
        return n(ComponentA, { type: props.type });
      }
    });
    var mount = ComponentB.render(el, { type: 'span' });
    assert(mount.entity.el === mount.entity.children['0'].el);
    mount.setProps({ type: 'div' }, function(){
      assert(mount.entity.el === mount.entity.children['0'].el);
      mount.setProps({ type: 'b' }, function(){
        assert.equal(mount.entity.el.outerHTML, '<b>test</b>');
        assert.equal(mount.entity.children['0'].el.outerHTML, '<b>test</b>');
      });
    });
  });

  /**
   * Because the root node has changed, when updating the mounted component
   * should have it's element updated so that it applies the diff patch to
   * the correct element.
   */

  it('should change tag names and update', function(done){
    var ComponentA = component({
      render: function(n, state, props){
        return n(props.type, null, props.text);
      }
    });
    var ComponentB = component({
      render: function(n, state, props){
        return n(ComponentA, { type: props.type, text: props.text });
      }
    });
    var mount = ComponentB.render(el, { type: 'span', text: 'test' });
    mount.setProps({ type: 'div', text: 'test' }, function(){
      mount.setProps({ type: 'div', text: 'foo' }, function(){
        assert.equal(el.innerHTML, '<div>foo</div>');
        done();
      });
    });
  });

  /**
   * When a node is removed from the tree, all components within that
   * node should be recursively removed and unmounted.
   */

  it('should remove nested components when removing a branch', function(done){
    var i = 0;
    function inc() { i++ }
    var ComponentA = component({
      afterUnmount: inc,
      beforeUnmount: inc,
      render: function(n, state, props){
        return n('span', null, ['test']);
      }
    });
    var ComponentB = component({
      afterUnmount: inc,
      beforeUnmount: inc,
      render: function(n, state, props){
        return n(ComponentA);
      }
    });
    var ComponentC = component({
      afterUnmount: inc,
      beforeUnmount: inc,
      render: function(n, state, props){
        if (props.n === 0) {
          return n('div', null, [
            n('div', null, [
              n(ComponentB),
              n(ComponentA)
            ])
          ]);
        }
        else {
          return n('div');
        }
      }
    });
    var mount = ComponentC.render(el, { n: 0 });
    mount.setProps({ n: 1 }, function(){
      assert.equal(i, 6);
      done();
    });
  });

  /**
   * When a component has another component directly rendered
   * with it, it should be able to swap out the type of element
   * that is rendered.
   */

  it('should change sub-component tag names', function(done){
    var i = 0;
    var ComponentA = component({
      render: function(n, state, props){
        return n(props.type, null, ['test']);
      }
    });
    var ComponentB = component({
      render: function(n){
        return n(ComponentA);
      }
    });
    var mount = ComponentB.render(el, { type: 'span' });
    mount.setProps({ type: 'div' }, function(){
      assert.equal(el.innerHTML, '<div>test</div>');
      done();
    });
  });

  /**
   * It should be able to render new components when re-rendering
   */

  it('should swap elements for components', function(done){
    var i = 0;
    var ComponentA = component({
      render: function(n, state, props){
        return n(props.type, null, ['test']);
      }
    });
    var ComponentB = component({
      render: function(n){
        if (i === 0) return n('div');
        return n(ComponentA);
      }
    });
    var mount = ComponentB.render(el, { i: 0 });
    mount.setProps({ i: 1 }, function(){
      assert.equal(el.innerHTML, '<div>test</div>');
      done();
    });
  });

  /**
   * If the component type changes at a node, the first component
   * should be removed and unmount and replaced with the new component
   */

  it('should replace components', function(done){
    var ComponentA = component({
      render: function(n, state, props){
        return n('div', null, ['A']);
      }
    });
    var ComponentB = component({
      render: function(n, state, props){
        return n('div', null, ['B']);
      }
    });
    var ComponentC = component({
      render: function(n, state, props){
        if (props.type === 'A') return n(ComponentA);
        return n(ComponentB);
      }
    });
    var mount = ComponentC.render(el, { type: 'A' });
    assert.equal(el.innerHTML, '<div>A</div>');
    mount.setProps({ type: 'B' }, function(){
      assert.equal(el.innerHTML, '<div>B</div>');
      assert(mount.entity.children['0'].component instanceof ComponentB);
      done();
    });
  })

  /**
   * It should remove components from the children hash when they
   * are moved from the tree.
   */

  it('should remove references to child components when they are removed', function(done){
    var Component = component({
      render: function(n, state, props){
        return n('div', null, ['Component']);
      }
    });
    var Wrapper = component({
      render: function(n, state, props){
        if (props.type === 'component') return n(Component);
        return n('div', null, ['Element']);
      }
    });
    var mount = Wrapper.render(el, { type: 'component' });
    assert(mount.entity.children['0']);
    mount.setProps({ type: 'element' }, function(){
      assert.equal(el.innerHTML, '<div>Element</div>');
      assert(mount.entity.children['0'] == null);
      done();
    });
  });
});
