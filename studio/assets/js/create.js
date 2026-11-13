S.guard(function () {
  var $ = function (i) { return document.getElementById(i); };
  var p = $('p'), stage = $('stage'), st, TPLS, SET, ADMIN, uploading = false;

  Promise.all([D.templates(), D.settings(), S.isAdmin()]).then(function (r) {
    TPLS = r[0]; SET = r[1]; ADMIN = r[2];
    var q = new URLSearchParams(location.search), id = q.get('id');
    if (id) return D.design(id).then(function (d) { st = D.toState(d); }, function () { S.toast('Design not found. Starting a new one.'); });
    var tid = q.get('tpl') || SET.defaultTemplate;
    st = stateFor(TPLS[tid] && (TPLS[tid].enabled !== false) ? TPLS[tid] : TPLS.discovery);
  }).then(function () { if (!st) st = stateFor(TPLS.discovery); init(); });

  function init() {
    $('lays').innerHTML = LAYOUTS.map(function (l) { return '<button data-k="layout" data-v="' + l[0] + '"><svg viewBox="0 0 60 42"><rect width="60" height="42" fill="#d9dbe6" opacity=".5"/>' + l[2] + '</svg>' + l[1] + '</button>'; }).join('');
    $('imgs').innerHTML = [0, 1, 2].map(function (i) { return '<button data-scene="' + i + '" style="background-image:' + scene(i) + '" aria-label="Placeholder ' + (i + 1) + '"></button>'; }).join('');
    $('bgs').innerHTML = BG_PRESETS.map(function (c) { return '<button data-cv="bgc|' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>'; }).join('') + '<input type="color" data-c="bgc" aria-label="Custom background">';
    $('accs').innerHTML = ACC_PRESETS.map(function (c) { return '<button data-cv="acc|' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>'; }).join('') + '<input type="color" data-c="acc" aria-label="Custom accent">';
    $('adm').style.display = ADMIN ? '' : 'none';
    tplChips(); fields(); sync(); render();
    new ResizeObserver(function () { Poster.fit(stage, p, st.ar); }).observe(stage);
    (document.fonts && document.fonts.ready || Promise.resolve()).then(render);
  }
  function tplChips() {
    $('tpls').innerHTML = D.ordered(TPLS).filter(function (t) { return t.enabled !== false || t.id === st.tpl; })
      .map(function (t) { return '<button class="chip" data-tpl="' + t.id + '">' + esc(t.name) + '</button>'; }).join('');
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Inputs depend on the template, so they are rebuilt whenever the template changes
  function fields() {
    var t = TPLS[st.tpl] || TPLS.custom;
    $('fields').innerHTML = t.fields.map(function (k) {
      var d = FIELDS[k];
      return '<label>' + d[0] + (d[1] === 'area' ? '<textarea rows="3" data-f="' + k + '"></textarea>' : '<input type="' + d[1] + '" data-f="' + k + '">') + '</label>';
    }).join('');
    $('shows').innerHTML = t.fields.filter(function (k) { return FIELDS[k][2]; }).map(function (k) {
      var s = FIELDS[k][2]; return '<label class="ck"><input type="checkbox" data-t="' + s + '">' + SHOWN[s] + '</label>';
    }).join('');
    document.querySelectorAll('[data-f]').forEach(function (i) { i.addEventListener('input', function () { st[i.dataset.f] = i.value; st.dirty = 1; render(); }); });
    document.querySelectorAll('[data-t]').forEach(function (c) { c.addEventListener('change', function () { st.show[c.dataset.t] = c.checked ? 1 : 0; render(); }); });
  }
  function sync() {
    document.querySelectorAll('[data-f]').forEach(function (i) { i.value = st[i.dataset.f] || ''; });
    document.querySelectorAll('[data-t]').forEach(function (c) { c.checked = !!st.show[c.dataset.t]; });
    document.querySelectorAll('[data-r]').forEach(function (r) { r.value = st[r.dataset.r]; });
    document.querySelectorAll('[data-c]').forEach(function (c) { c.value = st[c.dataset.c]; });
    $('nm').value = st.name || '';
  }
  function mark() {
    on('[data-tpl]', function (b) { return b.dataset.tpl === st.tpl; });
    on('[data-k]', function (b) { return String(st[b.dataset.k]) === b.dataset.v; });
    on('[data-cv]', function (b) { var a = b.dataset.cv.split('|'); return String(st[a[0]]).toLowerCase() === a[1].toLowerCase(); });
    on('[data-scene]', function (b) { return !st.img && +b.dataset.scene === st.scene; });
  }
  function on(sel, f) { document.querySelectorAll(sel).forEach(function (b) { b.classList.toggle('on', f(b)); }); }
  function render() {
    Poster.draw(p, st); Poster.fit(stage, p, st.ar); mark();
    var r = Poster.R[st.ar]; $('dims').textContent = Poster.NAMES[st.ar] + ', ' + r[0] + ' x ' + r[1] + ' px, ' + st.fmt;
  }
  // Change template: keep typed content, take the template's layout and style. Untouched sample text is swapped for the new sample.
  function applyTpl(t, full) {
    var keep = { ar: st.ar, fmt: st.fmt, id: st.id, name: st.name, img: st.img, imgId: st.imgId, dirty: st.dirty };
    var base = stateFor(t, false);
    if (full || !st.dirty) { base = stateFor(t, true); if (full) { keep.img = null; keep.imgId = null; keep.dirty = 0; } }
    else CONTENT_KEYS.forEach(function (k) { if (k !== 'label') base[k] = st[k]; });
    st = Object.assign(base, keep); fields(); sync(); tplChips(); render();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; var d = b.dataset;
    if (d.tpl) applyTpl(TPLS[d.tpl], false);
    else if (d.k) { st[d.k] = d.k === 'flip' ? Number(d.v) : d.v; render(); }
    else if (d.cv) { var a = d.cv.split('|'); st[a[0]] = a[1]; sync(); render(); }
    else if (d.scene) { st.scene = +d.scene; st.img = null; st.imgId = null; render(); }
  });
  document.querySelectorAll('[data-r]').forEach(function (r) { r.addEventListener('input', function () { st[r.dataset.r] = +r.value; render(); }); });
  document.querySelectorAll('[data-c]').forEach(function (c) { c.addEventListener('input', function () { st[c.dataset.c] = c.value; render(); }); });
  $('nm').addEventListener('input', function () { st.name = $('nm').value; });
  $('file').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    st.img = URL.createObjectURL(f); st.imgId = null; uploading = true; $('upl').textContent = 'Uploading to Cloudinary...'; render();
    D.upload(f).then(function (m) { st.img = m.url; st.imgId = m.publicId; uploading = false; $('upl').textContent = 'Uploaded (' + m.width + ' x ' + m.height + ' px).'; render(); })
      .catch(function (er) { uploading = false; $('upl').textContent = 'Upload failed: ' + er.message + '. Preview only; saving needs an uploaded image.'; });
  });
  $('rst').onclick = function () { applyTpl(TPLS[st.tpl], true); S.toast('Reset to template defaults'); };
  $('save').onclick = function () {
    if (uploading || (st.img && st.img.indexOf('blob:') === 0)) { S.toast('Wait for the image upload to finish.'); return; }
    st.name = $('nm').value || st.title;
    D.saveDesign(st.id, D.pack(st)).then(function (id) { st.id = id; history.replaceState(null, '', '/studio/create/?id=' + id); S.toast('Design saved'); })
      .catch(function (er) { S.toast('Could not save: ' + er.message); });
  };
  $('exp').onclick = function () {
    if (uploading) { S.toast('Wait for the image upload to finish.'); return; }
    var btn = $('exp'); btn.disabled = true; btn.textContent = 'Preparing...';
    Poster.exportImage(st, st.fmt).then(function (u) { Poster.download(u, st, st.fmt); S.toast('Downloaded'); })
      .catch(function (er) { S.toast('Export failed: ' + er.message); })
      .then(function () { btn.disabled = false; btn.textContent = 'Export'; });
  };
  // Template saving is admin only (enforced by the Firestore rules as well)
  function tplData() { var t = TPLS[st.tpl]; return { config: clone(CONFIG_KEYS.reduce(function (o, k) { o[k] = st[k]; return o; }, {})), meta: st.meta, label: st.label, name: t.name, kind: t.kind || t.id, fields: t.fields, sample: t.sample, enabled: true }; }
  $('tupd').onclick = function () {
    var d = tplData(); delete d.sample; delete d.fields;
    D.saveTemplate(st.tpl, d).then(function () { Object.assign(TPLS[st.tpl], { config: d.config, meta: d.meta, label: d.label }); S.toast('Template updated'); }, function () { S.toast('Only admins can change templates.'); });
  };
  $('tnew').onclick = function () {
    var n = prompt('Name for the new template variation'); if (!n) return;
    var d = tplData(); d.name = n; d.enabled = true;
    D.addTemplate(d).then(function (id) { d.id = id; TPLS[id] = d; st.tpl = id; tplChips(); render(); S.toast('Template saved'); }, function () { S.toast('Only admins can change templates.'); });
  };
});
