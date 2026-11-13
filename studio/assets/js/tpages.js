S.guard(function () {
  var $ = function (i) { return document.getElementById(i); }, ADMIN = false, SET = {};
  function load() {
    Promise.all([D.templates(), D.settings(), S.isAdmin()]).then(function (r) {
      var T = r[0]; SET = r[1]; ADMIN = r[2];
      $('note').textContent = ADMIN ? '' : 'You can use templates. Only admins can change them.';
      var host = $('grid'); host.innerHTML = '';
      D.ordered(T).forEach(function (t) {
        var isDef = (SET.defaultTemplate || 'discovery') === t.id, c = document.createElement('div'); c.className = 'tcard';
        c.innerHTML = '<div class="mini"></div><div class="bd"><h2></h2><p></p><div class="bt"></div></div>';
        c.querySelector('h2').textContent = t.name;
        [isDef ? 'Default' : '', t.enabled === false ? 'Disabled' : '', t.builtin ? 'Built in' : 'Variation'].filter(Boolean).forEach(function (b) { var s = document.createElement('span'); s.className = 'badge'; s.textContent = b; c.querySelector('h2').appendChild(s); });
        c.querySelector('p').textContent = LAYOUTS.filter(function (l) { return l[0] === t.config.layout; })[0][1] + ' layout';
        var s = stateFor(t, true); Poster.mini(c.querySelector('.mini'), s, 216);
        c.querySelector('.mini').onclick = function () { location.href = '/studio/create/?tpl=' + t.id; };
        var bt = c.querySelector('.bt');
        function add(txt, fn, cls) { var b = document.createElement('button'); b.className = 'btn sm ' + (cls || ''); b.textContent = txt; b.onclick = fn; bt.appendChild(b); return b; }
        add('Use', function () { location.href = '/studio/create/?tpl=' + t.id; }, 'pri');
        if (ADMIN) {
          if (!isDef && t.enabled !== false) add('Make default', function () { D.setDefault(t.id).then(load, fail); });
          add('Duplicate', function () {
            var n = prompt('Name for the copy', t.name + ' copy'); if (!n) return;
            var d = clone(t); delete d.id; delete d.builtin; d.name = n; d.enabled = true; D.addTemplate(d).then(load, fail);
          });
          add('Rename', function () { var n = prompt('New name', t.name); if (n) D.saveTemplate(t.id, { name: n }).then(load, fail); });
          add(t.enabled === false ? 'Enable' : 'Disable', function () { D.saveTemplate(t.id, { enabled: t.enabled === false }).then(load, fail); });
          if (!t.builtin) add('Delete', function () { if (confirm('Delete this template variation? Saved designs keep their own settings.')) D.delTemplate(t.id).then(load, fail); }, 'del');
        }
        host.appendChild(c);
      });
    });
  }
  function fail() { S.toast('Could not save the change. Only admins can change templates.'); }
  load();
});
