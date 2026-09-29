/*
 * dc-lite — мінімальний рантайм для запуску Main.dc.html поза редактором Claude Design.
 * Підтримує: {{path}}, <sc-if>, <sc-for>, події onClick/onSubmit, DCLogic (state/setState/renderVals).
 */
(function (global) {
  'use strict';

  var HOLE = /\{\{\s*([^{}]+?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/;

  function lookup(scope, path) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null' || path === 'undefined') return undefined;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    var cur = scope;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) {
      var v = lookup(scope, p);
      return v == null || v === false ? '' : String(v);
    });
  }

  function evalAttr(str, scope) {
    var m = WHOLE.exec(str || '');
    return m ? lookup(scope, m[1]) : str;
  }

  function renderChildren(node, scope, out) {
    for (var c = node.firstChild; c; c = c.nextSibling) render(c, scope, out);
  }

  function render(node, scope, out) {
    if (node.nodeType === 3) {
      out.appendChild(document.createTextNode(interp(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;

    var tag = node.localName;
    if (tag === 'helmet') return;
    if (tag === 'sc-if') {
      if (evalAttr(node.getAttribute('value'), scope)) renderChildren(node, scope, out);
      return;
    }
    if (tag === 'sc-for') {
      var list = evalAttr(node.getAttribute('list'), scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var child = Object.create(scope);
        child[as] = list[i];
        child.$index = i;
        renderChildren(node, child, out);
      }
      return;
    }

    var el = document.createElementNS(node.namespaceURI, tag);
    for (var k = 0; k < node.attributes.length; k++) {
      var a = node.attributes[k];
      var name = a.name;
      if (name.indexOf('hint-') === 0) continue;
      var m = WHOLE.exec(a.value);
      if (m) {
        var v = lookup(scope, m[1]);
        if (/^on[a-z]+$/.test(name) && typeof v === 'function') {
          el.addEventListener(name.slice(2), v);
          continue;
        }
        if (v === false || v == null) continue;
        el.setAttribute(name, v === true ? '' : String(v));
      } else {
        el.setAttribute(name, interp(a.value, scope));
      }
    }
    renderChildren(node, scope, el);
    out.appendChild(el);
  }

  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  }
  DCLogic.prototype.setState = function (patch, cb) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    this._schedule(cb);
  };
  DCLogic.prototype.forceUpdate = function (cb) {
    this._schedule(cb);
  };
  DCLogic.prototype._schedule = function (cb) {
    var self = this;
    if (cb) (self._cbs = self._cbs || []).push(cb);
    if (self._pending) return;
    self._pending = true;
    Promise.resolve().then(function () {
      self._pending = false;
      if (self._update) self._update();
      var cbs = self._cbs || [];
      self._cbs = [];
      cbs.forEach(function (f) { f(); });
    });
  };

  function defaultProps(scriptEl) {
    var props = {};
    var raw = scriptEl.getAttribute('data-props');
    if (!raw) return props;
    try {
      var decl = JSON.parse(raw);
      Object.keys(decl).forEach(function (key) {
        if (key.charAt(0) !== '$' && decl[key] && 'default' in decl[key]) props[key] = decl[key].default;
      });
    } catch (e) { /* ignore */ }
    return props;
  }

  function mount(url, container) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      return res.text();
    }).then(function (text) {
      var doc = new DOMParser().parseFromString(text, 'text/html');
      var xdc = doc.querySelector('x-dc');
      var scriptEl = doc.querySelector('script[data-dc-script]');
      if (!xdc || !scriptEl) throw new Error('у файлі немає <x-dc> або скрипта компонента');

      if (doc.documentElement.lang) document.documentElement.lang = doc.documentElement.lang;
      if (doc.title) document.title = doc.title;
      var helmet = xdc.querySelector('helmet');
      if (helmet) {
        Array.prototype.forEach.call(helmet.children, function (n) {
          document.head.appendChild(document.importNode(n, true));
        });
      }

      var Component = new Function('DCLogic', scriptEl.textContent + '\n;return Component;')(DCLogic);
      var inst = new Component(defaultProps(scriptEl));

      inst._update = function () {
        var active = document.activeElement;
        var focusIdx = -1;
        if (active && container.contains(active)) {
          focusIdx = Array.prototype.indexOf.call(container.querySelectorAll('*'), active);
        }
        var y = global.scrollY;
        var frag = document.createDocumentFragment();
        var vals = inst.renderVals();
        for (var c = xdc.firstChild; c; c = c.nextSibling) render(c, vals, frag);
        container.replaceChildren(frag);
        global.scrollTo(0, y);
        if (focusIdx >= 0) {
          var cand = container.querySelectorAll('*')[focusIdx];
          if (cand && active && cand.localName === active.localName) cand.focus({ preventScroll: true });
        }
      };
      inst._update();
      if (typeof inst.componentDidMount === 'function') inst.componentDidMount();
      return inst;
    });
  }

  global.DCLite = { mount: mount, DCLogic: DCLogic };
})(window);
