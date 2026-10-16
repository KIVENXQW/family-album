/* 展示页共用的外壳逻辑：背景色（调色盘 + 记住选择）、右上角入口的显隐、
   进出幕布、Esc 返回。两种展示方式都引这一份。 */
(function () {
  var KEY = 'album.bg';
  var PRESETS = [
    ['#f6f2eb', '纸白'],
    ['#f0e6d2', '米黄'],
    ['#dfe3da', '灰绿'],
    ['#dde4ea', '雾蓝'],
    ['#f2e4e2', '藕粉'],
    ['#e6e2dc', '暖灰'],
    ['#2a2724', '深褐'],
    ['#10161f', '夜蓝']
  ];

  function lum(hex) {
    var h = String(hex || '').trim();
    if (!/^#[0-9a-f]{6}$/i.test(h)) return 1;
    var c = [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16) / 255; })
      .map(function (v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function isDark(hex) { return lum(hex) < 0.4; }

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  var bg = stored || PRESETS[0][0];
  /* 也可以直接从网址给颜色，比如 /display?bg=2a2724，方便给 iPad 存一个固定底色 */
  var fromUrl = /[?&]bg=([0-9a-fA-F]{6})/.exec(location.search);
  if (fromUrl) {
    bg = '#' + fromUrl[1].toLowerCase();
    try { localStorage.setItem(KEY, bg); } catch (e) {}
  }
  var watchers = [];

  function apply(next, save) {
    bg = next;
    if (save) { try { localStorage.setItem(KEY, bg); } catch (e) {} }
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
    /* flow.html / gallery.html 的 <head> 里抢先注入过一条 html,body{background:... !important}，
       作用是首屏不闪色。它带 !important，会盖过上面这两行行内样式——不同步它的话，
       在页面打开之后换底色就不会变了（得刷新才看得到），这就是「底色用不了」的根因。 */
    var guard = document.getElementById('bgGuard');
    if (guard) guard.textContent = 'html,body{background:' + bg + ' !important}';
    var dark = isDark(bg);
    document.body.classList.toggle('disp-dark', dark);
    var host = document.getElementById('palette');
    if (host) {
      host.querySelectorAll('.sw[data-bg]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.bg.toLowerCase() === String(bg).toLowerCase() ? 'true' : 'false');
      });
      var now = host.querySelector('#bgNow');
      if (now) now.textContent = String(bg).toUpperCase();
    }
    watchers.forEach(function (f) { try { f(bg, dark); } catch (e) {} });
  }

  window.displayBg = function () { return bg; };
  window.displayBgIsDark = function () { return isDark(bg); };
  window.onDisplayBgChange = function (fn) { watchers.push(fn); fn(bg, isDark(bg)); };

  function buildPalette() {
    var host = document.getElementById('palette');
    if (!host) return;
    var html = '<div class="cap">背景颜色</div><div class="swrow">';
    PRESETS.forEach(function (p) {
      var ink = isDark(p[0]) ? '#efeee9' : '#1a1714';
      html += '<button class="sw" type="button" data-bg="' + p[0] + '"' +
        ' style="--c:' + p[0] + ';color:' + ink + '"' +
        ' aria-pressed="false" title="' + p[1] + '" aria-label="' + p[1] + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>' +
        '</button>';
    });
    html += '</div><div class="pal-foot"><label class="pick">' +
      '<span class="dot"></span><span>自己挑一个颜色</span><span class="now" id="bgNow"></span>' +
      '<input type="color" id="bgPick" aria-label="自己挑一个背景颜色"></label></div>';
    host.innerHTML = html;

    host.addEventListener('click', function (e) {
      var b = e.target.closest('.sw[data-bg]');
      if (b) apply(b.dataset.bg, true);
    });
    var pick = host.querySelector('#bgPick');
    if (pick) {
      pick.value = bg;
      pick.addEventListener('input', function () { apply(pick.value, true); });
      pick.addEventListener('change', function () { apply(pick.value, true); });
      /* 「自己挑一个颜色」这一行：直接点它就把取色器调出来。
         只靠 label 包住一个 1px 的隐藏 input，在部分浏览器上点不开。 */
      var row = host.querySelector('.pick');
      if (row) {
        row.addEventListener('click', function (e) {
          if (e.target === pick) return;
          e.preventDefault();
          if (pick.showPicker) { try { pick.showPicker(); return; } catch (err) {} }
          pick.click();
        });
      }
    }
  }

  /* 返回：点一下或动一下鼠标叫出入口，过 6 秒自己收起；
     进页面先亮 3 秒让人知道右上角有东西。Esc 一直可用。 */
  var hideT = null;
  function reveal(keep) {
    document.body.classList.add('chrome-on');
    clearTimeout(hideT);
    if (!keep) hideT = setTimeout(function () { document.body.classList.remove('chrome-on'); }, 6000);
  }
  function hideChrome() {
    clearTimeout(hideT);
    document.body.classList.remove('chrome-on');
    var p = document.getElementById('palette');
    if (p) { p.classList.remove('on'); var b = document.getElementById('paletteBtn'); if (b) b.setAttribute('aria-expanded', 'false'); }
  }

  function wire() {
    buildPalette();
    apply(bg, false);

    /* 鼠标靠近，右上角这些按钮和色块按距离放大一点 */
    if (window.dockMagnify) {
      var row = document.querySelector('.chrome');
      if (row) {
        window.dockMagnify(row, '.chrome-btn', { radius: 160, strength: 0.26 });
        window.dockMagnify(row, '.sw', { radius: 130, strength: 0.3, lift: 0 });
      }
    }

    var btn = document.getElementById('paletteBtn');
    var panel = document.getElementById('palette');
    if (btn && panel) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var on = panel.classList.toggle('on');
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        clearTimeout(hideT);
        document.body.classList.add('chrome-on');
      });
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest('.chrome')) return;
      if (panel && panel.classList.contains('on')) {
        panel.classList.remove('on');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        return;
      }
      if (document.body.classList.contains('chrome-on')) hideChrome(); else reveal(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (panel && panel.classList.contains('on')) {
        panel.classList.remove('on');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        return;
      }
      if (window.displayNoExit) return;   /* 独立打开的版本没有相册可回 */
      location.href = 'index.html';
    });

    window.addEventListener('pointermove', function () { reveal(true); });

    setTimeout(function () {
      document.body.classList.add('chrome-on');
      clearTimeout(hideT);
      hideT = setTimeout(function () { document.body.classList.remove('chrome-on'); }, 3200);
    }, 1400);

    /* 出去这一半：渐隐到幕布再回相册 */
    var back = document.getElementById('backLink');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (back) {
      var leaving = false;
      back.addEventListener('click', function (e) {
        if (leaving) { e.preventDefault(); return; }
        leaving = true;
        e.preventDefault();
        var v = document.getElementById('leaveVeil');
        if (v) v.classList.add('on');
        setTimeout(function () { location.href = 'index.html'; }, reduced ? 0 : 1000);
      });
    }

    /* 截图用的钩子：?pointer=1100,40 假装鼠标在这个位置，方便核对放大效果 */
    var pt = /[?&]pointer=(\d+)(?:,(\d+))?/.exec(location.search);
    if (pt) {
      setTimeout(function () {
        clearTimeout(hideT);
        document.body.classList.add('chrome-on');     /* 别让入口自己收起来，挡住核对 */
        document.dispatchEvent(new PointerEvent('pointermove', {
          clientX: Number(pt[1]), clientY: Number(pt[2] || 40), bubbles: true
        }));
      }, 5000);   /* 等入口那 3 秒自动收起结束之后再假装鼠标进去，截图才拍得到 */
    }

    /* 截图用的钩子：?panel=palette 或 ?panel=picker 直接展开对应面板 */
    var panelHook = /[?&]panel=(palette|picker)/.exec(location.search);
    if (panelHook) {
      setTimeout(function () {
        clearTimeout(hideT);
        document.body.classList.add('chrome-on');
        var b = document.getElementById(panelHook[1] === 'palette' ? 'paletteBtn' : 'pickBtn2');
        if (b) b.click();
      }, 5300);
    }

    /* 进来这一半：从幕布里渐显 */
    var enter = document.getElementById('enterVeil');
    if (enter) {
      if (reduced) {
        enter.classList.add('gone');
        setTimeout(function () { enter.style.display = 'none'; }, 40);
      } else {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            enter.classList.add('gone');
            setTimeout(function () { enter.style.display = 'none'; }, 1100);
          });
        });
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
