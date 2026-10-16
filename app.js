(function () {
  const A = window.ALBUM;
  const view = document.getElementById('view');
  const toast = document.getElementById('toast');

  const photoById = {};
  A.photos.forEach(p => (photoById[p.id] = p));
  const personById = {};
  A.people.forEach(p => (personById[p.id] = p));

  // 图标：按 ui-ux-pro-max 图标库的清单挑的，内联成 SVG，跟着 currentColor 走
  const IC = {
    arrow: '<svg class="ic slide-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
    check: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>',
    alert: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.6h.01"/></svg>',
    lock: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3"/><rect x="5" y="11" width="14" height="9" rx="2"/></svg>',
    lockOpen: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 9.5-2"/><rect x="5" y="11" width="14" height="9" rx="2"/></svg>'
  };

  const state = { family: false, uploads: [], removed: [] };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function photosOf(personId) {
    return visiblePhotos().filter(p => p.people.indexOf(personId) >= 0);
  }
  /* 照片在硬盘上的文件名：/__photos/01-x.png → 01-x.png。
     删除是按文件名记的（photos-removed.json），所以对一下就这道哪张被删过。 */
  function baseName(src) {
    return String(src || '').split('/').pop();
  }
  function isRemoved(p) {
    return state.removed.indexOf(baseName(p.src)) >= 0;
  }
  /* 还留在相册里的照片。删掉的不再画出来，但文件没丢——挪进了 photos/_trash */
  function visiblePhotos() {
    return A.photos.filter(p => !isRemoved(p));
  }
  /* 每张照片的「身份证」：p: 开头是相册里的，u: 开头是刚导入的。
     右键菜单、看大图、删掉，三条路都靠它认人。 */
  function shotOfPhoto(p) { return 'p:' + baseName(p.src); }
  function shotOfUpload(u) { return 'u:' + u.id; }
  function shotKey(ref) { return String(ref || '').slice(2); }
  function shotIsUpload(ref) { return String(ref || '').charAt(0) === 'u'; }
  function photoByFile(file) {
    return A.photos.filter(p => baseName(p.src) === file)[0] || null;
  }
  /* 头像那张要是被删了，就退而用这个人的第一张照片 */
  function portraitOf(person) {
    const p = photoById[person.portrait];
    if (p && !isRemoved(p)) return p;
    return photosOf(person.id)[0] || null;
  }
  function img(p, cls) {
    return '<img class="' + (cls || '') + '" loading="lazy" src="' + p.src + '" alt="' + esc(p.note) + '">';
  }
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('on');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('on'), 3000);
  }
  function humanSize(n) {
    if (!n && n !== 0) return '';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  // ---------- 首页：时间轴 ----------
  function renderHome() {
    let html = '<section class="hero">';
    const newest = visiblePhotos().slice().sort((a, b) => b.year - a.year)[0];
    if (newest) {
      html += '<button class="hero-photo tile-btn" type="button" data-shot="' + shotOfPhoto(newest) +
        '" aria-label="打开看这张照片">' + img(newest) + '</button>';
      html += '<div class="hero-side">';
      html += '<div class="kicker">最近</div>';
      html += '<h1>' + newest.year + ' 年</h1>';
      html += '<p class="note">' + esc(newest.note) + '</p>';
      html += '</div>';
    }
    html += '</section>';
    html += wallHtml();
    view.innerHTML = html;
  }

  /* 照片墙：未认领的排在前面，其余按年份倒序 */
  function wallHtml() {
    const list = visiblePhotos().slice().sort((a, b) => b.year - a.year);
    let html = '<section class="all-grid">';
    state.uploads.forEach(u => {
      html += '<button class="tile-btn" type="button" data-shot="' + shotOfUpload(u) +
        '" title="刚导入，还没认领">' +
        '<img loading="lazy" decoding="async" src="uploads/' + encodeURIComponent(u.file) + '" alt=""></button>';
    });
    list.forEach(p => {
      html += '<button class="tile-btn" type="button" data-shot="' + shotOfPhoto(p) + '">' + img(p) + '</button>';
    });
    html += '</section>';
    return html;
  }

  // ---------- 人物 ----------
  function personCard(p) {
    const face = portraitOf(p);
    return '<a class="p-card" href="person.html?id=' + p.id + '">' +
      '<div class="p-img">' + (face ? img(face) : '') + '</div>' +
      '<div class="p-name">' + esc(p.name) + IC.arrow + '</div>' +
      '<div class="p-sub">' + esc(p.years || '出现在照片里') + ' · ' + photosOf(p.id).length + ' 张</div>' +
      '</a>';
  }

  function renderPeople() {
    const fam = A.people.filter(p => p.family);
    let html = '<section class="page-head"><div class="kicker">人物</div><h1>谁在照片里</h1>';
    html += '<p class="lead">脸是机器分的，名字是人取的。认不出来的先放「未识别」，等你哪天有空再认领。</p></section>';
    html += '<section class="grid people">' + fam.map(personCard).join('') + '</section>';
    view.innerHTML = html;
  }

  // ---------- 全部照片：最简格式，只有图 ----------
  function renderAll() {
    const list = visiblePhotos().slice().sort((a, b) => b.year - a.year);
    const years = visiblePhotos().map(p => p.year);
    const upN = state.uploads.length;
    let html = '<section class="page-head tight"><h1>全部照片</h1>';
    html += '<div class="meta big">' + (list.length + upN) + ' 张' +
      (years.length ? ' · ' + Math.min.apply(null, years) + ' 到 ' + Math.max.apply(null, years) : '') +
      (upN ? ' · 其中 ' + upN + ' 张刚导入还没归位' : '') + '</div></section>';
    html += wallHtml();
    view.innerHTML = html;
  }

  function renderPerson(id) {
    const person = personById[id];
    if (!person) return renderPeople();
    const list = photosOf(id).sort((a, b) => b.year - a.year);
    const years = list.map(p => p.year);
    const range = years.length ? Math.min.apply(null, years) + ' — ' + Math.max.apply(null, years) : '';

    let html = '<section class="person-head">';
    const face = portraitOf(person);
    html += '<div class="person-portrait">' + (face ? img(face) : '') + '</div>';
    html += '<div class="person-info"><h1>' + esc(person.name) + '</h1>';
    html += '<div class="meta">' + esc(person.years || '') + (person.years ? ' · ' : '') + list.length + ' 张照片' + (range ? ' · ' + range : '') + '</div>';
    html += '<p class="note">这个页面上的照片，是同一个人从年轻到现在。</p></div></section>';

    let cur = null;
    list.forEach(p => {
      if (p.year !== cur) {
        if (cur !== null) html += '</div></section>';
        html += '<section class="year-row"><div class="tl-year">' + p.year + '</div><div class="year-grid">';
        cur = p.year;
      }
      html += '<button class="ph tile-btn" type="button" data-shot="' + shotOfPhoto(p) + '">' + img(p) +
        '<span class="ph-note">' + esc(p.note) + '</span></button>';
    });
    if (cur !== null) html += '</div></section>';
    view.innerHTML = html;
  }

  // ---------- 未识别 ----------
  /* 未认领照片的排序：时间 / 大小，各自可正可反 */
  const uploadSort = { key: 'time', dir: -1 };
  function fmtTime(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function sortedUploads() {
    const list = state.uploads.slice();
    list.sort((a, b) => {
      const v = uploadSort.key === 'size'
        ? (a.size || 0) - (b.size || 0)
        : String(a.at || '').localeCompare(String(b.at || ''));
      return v * uploadSort.dir;
    });
    return list;
  }

  function renderUnknown() {
    const crops = ['n11', 'n10', 'n09'].map(id => photoById[id]).filter(p => p && !isRemoved(p));
    let html = '<section class="page-head"><div class="kicker">未识别</div><h1>这些脸，还没认出来</h1>';
    html += '<p class="lead">机器认不出的先放在这里，不影响别的页面照常用。哪天你有空，点一下告诉他们分别是谁，以后新照片里这个人就自动归位了。</p></section>';
    html += '<section class="grid unknown">';
    crops.forEach((p, i) => {
      html += '<figure class="u-card"><div class="u-face" style="background-image:url(' + p.src + ')"></div>';
      html += '<figcaption><div class="meta">' + p.year + ' 年的照片</div>';
      html += claimButton(i) + '</figcaption></figure>';
    });
    html += '</section>';

    if (state.uploads.length) {
      const list = sortedUploads();
      html += '<section class="page-head sub" style="padding-top:44px"><h2>刚导进来，还没认领的 ' + state.uploads.length + ' 张</h2>';
      html += '<div class="sortrow" role="group" aria-label="排序方式">';
      [['time', -1, '最近'], ['time', 1, '最早'], ['size', -1, '最大'], ['size', 1, '最小']].forEach(function (o) {
        const on = uploadSort.key === o[0] && uploadSort.dir === o[1];
        html += '<button class="sortbtn" type="button" data-sort="' + o[0] + '" data-dir="' + o[1] +
          '" aria-pressed="' + (on ? 'true' : 'false') + '">' + o[2] + '</button>';
      });
      html += '</div></section>';
      html += '<section class="grid unknown">';
      list.forEach(u => {
        const file = encodeURIComponent(u.file);
        const ref = shotOfUpload(u);
        html += '<figure class="u-card" data-shot="' + ref + '">';
        html += '<div class="u-shotwrap">' +
          '<button class="u-shot tile-btn" type="button" data-shot="' + ref + '" aria-label="打开看这张照片">' +
            '<img loading="lazy" decoding="async" src="thumbs/' + file + '" alt="" ' +
              'onerror="this.onerror=null;this.src=\'uploads/' + file + '\'">' +
          '</button>' +
          '<button class="u-more" type="button" data-menu="' + ref + '" aria-label="更多操作">⋯</button>' +
        '</div>';
        html += '<figcaption><div class="meta">' + humanSize(u.size) + ' · ' + fmtTime(u.at) + '</div>';
        const bits = [u.tag, u.place].filter(Boolean).map(esc);
        if (bits.length) html += '<div class="meta sm">' + bits.join(' · ') + '</div>';
        html += claimButton(u.id) + '</figcaption></figure>';
      });
      html += '</section>';
    }
    view.innerHTML = html;
  }

  function claimButton(key) {
    return '<button class="learn-more learn-more--sm claim" type="button" data-i="' + esc(key) + '">' +
      '<span class="circle" aria-hidden="true"><span class="icon arrow"></span></span>' +
      '<span class="button-text">这是谁</span></button>';
  }

  // ---------- 路由 ----------
  function route() {
    const hash = (location.hash || '#/').replace(/^#/, '');
    const parts = hash.split('/').filter(Boolean);
    let nav = 'home';

    if (parts.length === 0) renderHome();
    else if (parts[0] === 'people') { renderPeople(); nav = 'people'; }
    else if (parts[0] === 'person') { renderPerson(parts[1]); nav = 'people'; }
    else if (parts[0] === 'all') { renderAll(); nav = 'all'; }
    else if (parts[0] === 'unknown') { renderUnknown(); nav = 'unknown'; }
    else renderHome();

    document.querySelectorAll('nav.main a').forEach(a => a.classList.toggle('on', a.dataset.nav === nav));
    window.scrollTo(0, 0);
    resetIdle();
  }

  // ---------- 弹窗底座 ----------
  let lastFocus = null;
  function openModal(el, focusEl) {
    lastFocus = document.activeElement;
    el.dataset.open = '1';
    document.body.style.overflow = 'hidden';
    clearTimeout(idleTimer);
    if (focusEl) setTimeout(() => focusEl.focus(), 80);
  }
  function closeModal(el) {
    delete el.dataset.open;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    resetIdle();
  }
  document.querySelectorAll('.modal').forEach(m => {
    m.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => closeModal(m)));
  });
  document.addEventListener('keydown', e => {
    if (lb.dataset.open === '1') {
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowRight') { stepLightbox(1); return; }
      if (e.key === 'ArrowLeft') { stepLightbox(-1); return; }
    }
    if (e.key !== 'Escape') return;
    if (ctx.classList.contains('on')) { closeMenu(); return; }
    const open = document.querySelector('.modal[data-open="1"]');
    if (open) closeModal(open);
  });

  // ---------- 访客 / 家人 ----------
  const whoBtn = document.getElementById('whoBtn');
  const whoIconBox = document.getElementById('whoIconBox');
  const whoText = document.getElementById('whoText');
  const addBtn = document.getElementById('addBtn');
  const gate = document.getElementById('gate');
  const gateCode = document.getElementById('gateCode');
  const gateMsg = document.getElementById('gateMsg');
  const gateMsgText = document.getElementById('gateMsgText');

  function paintWho() {
    whoBtn.classList.toggle('fam', state.family);
    whoBtn.setAttribute('aria-pressed', state.family ? 'true' : 'false');
    whoText.textContent = state.family ? '家人 · 可整理' : '访客 · 只看';
    whoIconBox.innerHTML = state.family ? IC.lockOpen : IC.lock;
    addBtn.hidden = !state.family;
  }
  function setFamily(on) {
    state.family = on;
    try { sessionStorage.setItem('album.family', on ? '1' : '0'); } catch (e) {}
    paintWho();
  }

  whoBtn.addEventListener('click', () => {
    if (state.family) {
      setFamily(false);
      showToast('已切回访客，现在只能看。');
      return;
    }
    gateMsg.dataset.show = '0';
    gateCode.value = '';
    openModal(gate, gateCode);
  });

  document.getElementById('gateOk').addEventListener('click', tryUnlock);
  gateCode.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });

  function tryUnlock() {
    const v = gateCode.value.trim();
    if (v === '1234') {
      setFamily(true);
      gateCode.value = '';
      gateMsg.dataset.show = '0';
      closeModal(gate);
      showToast('欢迎回来。现在能导入照片、改说明、认领脸。');
    } else {
      gateMsgText.textContent = v ? '口令不对，再试一次。' : '还没输口令。';
      gateMsg.dataset.show = '1';
      gateCode.focus();
      gateCode.select();
    }
  }

  // ---------- 导入照片 ----------
  const imp = document.getElementById('imp');
  const drop = document.getElementById('drop');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const impSummary = document.getElementById('impSummary');
  const impTags = document.getElementById('impTags');
  const impPlace = document.getElementById('impPlace');
  let chosenTag = '';
  let uploading = false;

  /* 这一批「大概是什么事」：单选，再点一下取消 */
  impTags.addEventListener('click', e => {
    const b = e.target.closest('.tagchip');
    if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    impTags.querySelectorAll('.tagchip').forEach(x => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    chosenTag = on ? b.dataset.tag : '';
  });

  addBtn.addEventListener('click', () => {
    fileList.innerHTML = '';
    impSummary.textContent = '';
    openModal(imp, document.getElementById('pickBtn'));
  });
  document.getElementById('pickBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length) handleFiles(Array.from(fileInput.files));
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.add('over');
  }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.remove('over');
  }));
  drop.addEventListener('drop', e => {
    const f = e.dataTransfer && e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (f.length) handleFiles(f);
  });

  function rowFor(file) {
    const row = document.createElement('div');
    row.className = 'file-row';
    row.innerHTML =
      '<div class="file-top"><span class="nm">' + esc(file.name) + '</span>' +
      '<span class="sz">' + humanSize(file.size) + '</span>' +
      '<span class="st" data-st>等待</span></div>' +
      '<div class="bar"><i></i></div>';
    fileList.appendChild(row);
    const bar = row.querySelector('.bar i');
    const st = row.querySelector('[data-st]');
    return {
      pct(v) { bar.style.width = Math.max(4, Math.min(100, v)) + '%'; st.textContent = Math.round(v) + '%'; },
      ok() { bar.style.width = '100%'; st.className = 'st ok'; st.innerHTML = IC.check + '已收到'; },
      fail(msg) { st.className = 'st bad'; st.innerHTML = IC.alert + esc(msg || '失败'); }
    };
  }

  function uploadOne(file, ui) {
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name));
      xhr.setRequestHeader('content-type', file.type || 'application/octet-stream');
      xhr.setRequestHeader('x-photo-tag', encodeURIComponent(chosenTag || ''));
      xhr.setRequestHeader('x-photo-place', encodeURIComponent((impPlace.value || '').trim()));
      xhr.upload.onprogress = e => { if (e.lengthComputable) ui.pct(e.loaded / e.total * 100); };
      xhr.onload = () => {
        let r = null;
        try { r = JSON.parse(xhr.responseText); } catch (e) {}
        if (r && r.ok) { ui.ok(); resolve(r.item); }
        else { ui.fail(r && r.error ? r.error : '服务器没收下'); resolve(null); }
      };
      xhr.onerror = () => { ui.fail('网络断了'); resolve(null); };
      xhr.send(file);
    });
  }

  async function handleFiles(files) {
    if (uploading) { showToast('上一批还在传，稍等一下。'); return; }
    uploading = true;
    fileList.setAttribute('aria-busy', 'true');
    const images = files.filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|heic)$/i.test(f.name));
    const skipped = files.length - images.length;

    let ok = 0, bad = 0;
    const got = [];
    for (const f of images) {
      const ui = rowFor(f);
      ui.pct(0);
      const item = await uploadOne(f, ui);
      if (item) { ok++; got.push(item); } else { bad++; }
    }
    if (skipped) for (let i = 0; i < skipped; i++) rowForSkipped();

    fileList.removeAttribute('aria-busy');
    uploading = false;
    impSummary.textContent = '成功 ' + ok + ' 张' + (bad ? ' · 失败 ' + bad + ' 张' : '') + (skipped ? ' · 跳过 ' + skipped + ' 个非图片' : '');

    if (got.length) {
      await refreshUploads();
      showToast('收到 ' + got.length + ' 张。先去「未识别」里认领。');
    } else if (bad) {
      showToast('一张都没传上去，检查一下网络。');
    }
  }

  function rowForSkipped() {
    const row = document.createElement('div');
    row.className = 'file-row';
    row.innerHTML = '<div class="file-top"><span class="nm">（一个不是图片的文件）</span>' +
      '<span class="st bad">' + IC.alert + '跳过</span></div>';
    fileList.appendChild(row);
  }

  async function refreshUploads() {
    try {
      const r = await fetch('/api/uploads', { cache: 'no-store' });
      const j = await r.json();
      state.uploads = Array.isArray(j.items) ? j.items : [];
    } catch (e) {
      state.uploads = [];
    }
    paintBadge();
  }
  function paintBadge() {
    const badge = document.getElementById('unkBadge');
    const n = state.uploads.length;
    badge.hidden = n === 0;
    badge.textContent = n;
  }

  /* 相册里被删掉的照片清单（记的是文件名），删完不用刷新页面 */
  async function refreshRemoved() {
    try {
      const r = await fetch('/api/removed', { cache: 'no-store' });
      const j = await r.json();
      state.removed = Array.isArray(j.files) ? j.files : [];
    } catch (e) {
      state.removed = [];
    }
  }

  // ---------- 点照片：看大图 / 开菜单 / 认领 ----------
  let justOpenedMenu = 0;
  view.addEventListener('click', e => {
    const sortBtn = e.target.closest('.sortbtn');
    if (sortBtn) {
      uploadSort.key = sortBtn.dataset.sort;
      uploadSort.dir = Number(sortBtn.dataset.dir);
      renderUnknown();
      return;
    }
    const menuBtn = e.target.closest('[data-menu]');
    if (menuBtn) {
      const r = menuBtn.getBoundingClientRect();
      openMenu(menuBtn.dataset.menu, r.right - 150, r.bottom + 6);
      return;
    }
    const tile = e.target.closest('[data-shot]');
    if (tile) {
      /* 长按刚把菜单叫出来，松手这一下不该再看大图 */
      if (Date.now() - justOpenedMenu < 700) return;
      openShot(tile.dataset.shot);
      return;
    }
    const claim = e.target.closest('.claim');
    if (!claim) return;
    if (!state.family) {
      showToast('认领要先进家人模式（右上角那个按钮）。');
      return;
    }
    showToast('草稿版：这里会让你选一个人，或者新建一个。');
  });

  /* 右键一张照片 → 出同一份菜单，相册里的和刚导入的都算。
     键盘按「菜单键」时拿到的坐标是 0，那就改成这张卡的中心。 */
  view.addEventListener('contextmenu', e => {
    const tile = e.target.closest('[data-shot]');
    if (!tile) return;
    e.preventDefault();
    const r = tile.getBoundingClientRect();
    const x = e.clientX || Math.round(r.left + r.width / 2);
    const y = e.clientY || Math.round(r.top + Math.min(r.height, 200) / 2);
    openMenu(tile.dataset.shot, x, y);
  });

  /* 触屏：按住半秒也叫出同一个菜单。iPad 上没有右键，
     少了这一条，家里人只能看、不能删。 */
  let pressTimer = null;
  view.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    const tile = e.target.closest('[data-shot]');
    if (!tile) return;
    const ref = tile.dataset.shot;
    const x = e.clientX;
    const y = e.clientY;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      justOpenedMenu = Date.now();
      openMenu(ref, x, y);
    }, 500);
  }, { passive: true });
  ['pointerup', 'pointercancel', 'pointermove'].forEach(ev => {
    view.addEventListener(ev, () => clearTimeout(pressTimer), { passive: true });
  });

  // ---------- 菜单、看大图、删除 ----------
  const ctx = document.getElementById('ctxmenu');
  let ctxRef = null;
  function openMenu(ref, x, y) {
    if (!ref) return;
    ctxRef = ref;
    ctx.classList.add('on');
    const r = ctx.getBoundingClientRect();
    const left = Math.max(12, Math.min(x, window.innerWidth - r.width - 12));
    const top = Math.max(12, Math.min(y, window.innerHeight - r.height - 12));
    ctx.style.left = left + 'px';
    ctx.style.top = top + 'px';
    const first = ctx.querySelector('button');
    if (first) first.focus();
  }
  function closeMenu() {
    ctx.classList.remove('on');
    ctxRef = null;
  }
  ctx.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]');
    if (!b || !ctxRef) return;
    const ref = ctxRef;
    closeMenu();
    if (b.dataset.act === 'open') openShot(ref);
    else if (b.dataset.act === 'delete') askDelete(ref);
  });
  /* 点别处、滚屏、右键别处都收起来 */
  document.addEventListener('click', e => {
    if (!ctx.classList.contains('on')) return;
    if (e.target.closest('#ctxmenu') || e.target.closest('[data-menu]')) return;
    closeMenu();
  });
  window.addEventListener('scroll', closeMenu, { passive: true });
  window.addEventListener('resize', closeMenu);

  // ---------- 看大图 ----------
  const lb = document.getElementById('lightbox');
  let lbList = [], lbIndex = 0;
  function albumItems() {
    return visiblePhotos().slice().sort((a, b) => b.year - a.year)
      .map(p => ({ id: baseName(p.src), src: (p.full || p.src), alt: p.src, cap: p.year + ' 年 · ' + p.note }));
  }
  function uploadItems() {
    return sortedUploads().map(u => ({
      id: u.id,
      src: 'uploads/' + encodeURIComponent(u.file),
      cap: humanSize(u.size) + ' · ' + fmtTime(u.at)
    }));
  }
  /* 翻的是「同一拨」照片：在照片墙上点开的，左右键就在照片墙里走 */
  function openShot(ref) {
    if (!ref) return;
    lbList = shotIsUpload(ref) ? uploadItems() : albumItems();
    if (!lbList.length) return;
    lbIndex = Math.max(0, lbList.findIndex(it => it.id === shotKey(ref)));
    paintLightbox();
    lb.dataset.open = '1';
    document.body.style.overflow = 'hidden';
  }
  function paintLightbox() {
    const it = lbList[lbIndex];
    if (!it) return;
    var bigImg = document.getElementById('lbImg');
    /* photos/ 閲岀殑鍘熷浘娌′紶涓婃潵锛堟垨娌＄敓鎴愶級鏃讹紝閫€鍥炵敤缂╃暐鍥撅紝鍒樉绀鸿鍥?*/
    bigImg.onerror = function(){ if (it.alt && bigImg.getAttribute('src') !== it.alt) bigImg.src = it.alt; };
    bigImg.src = it.src;
    document.getElementById('lbCap').textContent =
      it.cap + ' · 第 ' + (lbIndex + 1) + ' / ' + lbList.length + ' 张';
  }
  function closeLightbox() {
    delete lb.dataset.open;
    document.body.style.overflow = '';
  }
  function stepLightbox(d) {
    if (!lbList.length) return;
    lbIndex = (lbIndex + d + lbList.length) % lbList.length;
    paintLightbox();
  }
  document.querySelectorAll('[data-lb]').forEach(b => {
    b.addEventListener('click', () => {
      const a = b.dataset.lb;
      if (a === 'close') closeLightbox();
      else stepLightbox(a === 'next' ? 1 : -1);
    });
  });
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  // ---------- 删掉一张 ----------
  const delModal = document.getElementById('delModal');
  let delRef = null;
  function askDelete(ref) {
    if (!state.family) {
      showToast('删除要先进家人模式（右上角那个按钮）。');
      return;
    }
    if (!ref) return;
    let desc = '';
    if (shotIsUpload(ref)) {
      const u = state.uploads.find(x => x.id === shotKey(ref));
      if (!u) return;
      desc = humanSize(u.size) + ' · ' + fmtTime(u.at) + '。删掉之后文件会先挪进 uploads/_trash，还能找回来。';
    } else {
      const p = photoByFile(shotKey(ref));
      if (!p) return;
      /* 说明本身可能已经带句号，撞在一起会变成「。。」 */
      const bare = String(p.note || '').replace(/[。！？!?]$/, '');
      desc = p.year + ' 年 · ' + bare + '。删掉之后文件会先挪进 photos/_trash，还能找回来。';
    }
    delRef = ref;
    document.getElementById('delDesc').textContent = desc;
    openModal(delModal, document.getElementById('delOk'));
  }
  document.getElementById('delOk').addEventListener('click', async () => {
    if (!delRef) return;
    const ref = delRef;
    delRef = null;
    const isUpload = shotIsUpload(ref);
    const key = shotKey(ref);
    const url = isUpload
      ? '/api/upload?id=' + encodeURIComponent(key)
      : '/api/photo?file=' + encodeURIComponent(key);
    try {
      const r = await fetch(url, { method: 'DELETE' });
      const j = await r.json();
      closeModal(delModal);
      if (j && j.ok) {
        if (isUpload) await refreshUploads();
        else if (Array.isArray(j.files)) state.removed = j.files;
        closeLightbox();
        route();
        showToast('删掉了，文件挪到了 ' + (isUpload ? 'uploads/_trash' : 'photos/_trash') + '。');
      } else {
        showToast('没删掉：' + ((j && j.error) || '服务器没答应'));
      }
    } catch (e) {
      closeModal(delModal);
      showToast('没删掉：网络不通');
    }
  });

  // ---------- 主界面 → 展示页：约 2 秒的过渡 ----------
  // 出去：渐黑到全黑约 0.95 秒，1 秒时跳走；到了展示页再从黑里渐亮 1 秒。
  const pageFade = document.getElementById('pageFade');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OUT_MS = reduced ? 0 : 1000;
  let leaving = false;

  function go(url) {
    if (leaving) return;
    leaving = true;
    clearTimeout(idleTimer);
    pageFade.classList.add('on');
    setTimeout(() => { location.href = url; }, OUT_MS);
  }

  // 进来这一半：从黑里渐亮
  (function enterFade() {
    const v = document.getElementById('enterVeil');
    if (!v) return;
    if (reduced) { v.classList.add('gone'); setTimeout(() => { v.style.display = 'none'; }, 40); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      v.classList.add('gone');
      setTimeout(() => { v.style.display = 'none'; }, 720);
    }));
  })();
  document.getElementById('displayBtn').addEventListener('click', e => {
    e.preventDefault();
    go('start.html');
  });

  // ---------- 没人动就进展示模式 ----------
  let idleTimer = null;
  /* 没人动的时候直接进上次选的那种展示方式，不卡在选样式那一页 */
  function idleTarget() {
    try { return localStorage.getItem('album.mode') === 'flow' ? 'flow.html' : 'gallery.html'; }
    catch (e) { return 'gallery.html'; }
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (document.querySelector('.modal[data-open="1"]')) return;
      go(idleTarget());
    }, 90000);
  }
  ['pointermove', 'keydown', 'click', 'wheel', 'touchstart'].forEach(ev => {
    window.addEventListener(ev, () => { if (!document.querySelector('.modal[data-open="1"]')) resetIdle(); }, { passive: true });
  });

  // ---------- 起步 ----------
  window.addEventListener('hashchange', route);
  try { state.family = sessionStorage.getItem('album.family') === '1'; } catch (e) {}
  /* 截图用的钩子：?fam=1 直接进家人模式，?gate=1 / ?imp=1 直接把弹窗打开 */
  if (/[?&]fam=1/.test(location.search)) state.family = true;
  /* 顶栏这几个按钮也跟鼠标的距离放大一点 */
  if (window.dockMagnify) {
    window.dockMagnify(document.querySelector('.tools'), '.learn-more, .icon-btn', { radius: 150, strength: 0.24, lift: 0 });
  }
  /* 截图用的钩子：?pointer=1150,36 假装鼠标在这个位置 */
  var ptHook = /[?&]pointer=(\d+)(?:,(\d+))?/.exec(location.search);
  if (ptHook) {
    setTimeout(function () {
      document.dispatchEvent(new PointerEvent('pointermove', {
        clientX: Number(ptHook[1]), clientY: Number(ptHook[2] || 36), bubbles: true
      }));
    }, 700);
  }
  paintWho();
  paintBadge();
  route();
  /* 两张清单读完再画一遍：一张是「删过的照片」，一张是「刚导入还没认领的」。
     没读完就画的话，删掉的照片会先闪一下，刚导入的也会漏。 */
  Promise.all([refreshUploads(), refreshRemoved()]).then(() => route());

  if (/[?&]gate=1/.test(location.search)) openModal(gate, gateCode);
  if (/[?&]imp=1/.test(location.search)) { state.family = true; paintWho(); openModal(imp, document.getElementById('pickBtn')); }
})();
