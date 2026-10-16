/* 鼠标靠近，图标就按距离放大一点（像 Dock）。
   用法：dockMagnify(容器, 选择器, {radius, strength})。
   只跟距离有关，不改变点击区域；开了「减弱动态效果」就整个不启动。 */
(function () {
  window.dockMagnify = function (container, selector, opts) {
    if (!container) return;
    var o = opts || {};
    var radius = o.radius || 150;
    var strength = o.strength || 0.24;
    var lift = o.lift || 2;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var raf = null;
    var pt = null;

    function items() {
      return Array.prototype.slice.call(container.querySelectorAll(selector));
    }
    function paint() {
      raf = null;
      if (!pt) return;
      var list = items();
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        var r = el.getBoundingClientRect();
        if (!r.width) continue;
        var dx = pt.x - (r.left + r.width / 2);
        var dy = pt.y - (r.top + r.height / 2);
        var d = Math.sqrt(dx * dx + dy * dy);
        var k = d >= radius ? 0 : 1 - d / radius;
        var s = 1 + k * k * strength;
        el.style.transform = 'scale(' + s.toFixed(3) + ') translateY(' + (-lift * k).toFixed(2) + 'px)';
        el.style.zIndex = k > 0.05 ? '5' : '';
      }
    }
    function reset() {
      pt = null;
      items().forEach(function (el) {
        el.style.transform = '';
        el.style.zIndex = '';
      });
    }

    document.addEventListener('pointermove', function (e) {
      pt = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(paint);
    }, { passive: true });
    document.addEventListener('pointerleave', reset);
    container.addEventListener('pointerleave', reset);
    container.addEventListener('focusin', reset);      /* 用键盘操作时别乱动 */
    window.addEventListener('blur', reset);
  };
})();
