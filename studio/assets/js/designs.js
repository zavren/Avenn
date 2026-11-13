S.guard(function () {
  var $ = function (i) { return document.getElementById(i); };
  function load() {
    Promise.all([D.templates(), D.designs(200)]).then(function (r) {
      var T = r[0], ds = r[1], host = $('grid'); host.innerHTML = '';
      if (!ds.length) { host.innerHTML = '<div class="card">No saved designs yet.</div>'; return; }
      ds.forEach(function (d) {
        var c = document.createElement('div'); c.className = 'tcard';
        c.innerHTML = '<div class="mini"></div><div class="bd"><h2></h2><p></p><div class="bt"></div></div>';
        c.querySelector('h2').textContent = d.name;
        c.querySelector('p').textContent = (T[d.templateId] ? T[d.templateId].name : d.type) + ' · ' + Poster.NAMES[d.exportSize || 'portrait'] + (d.updatedAt ? ' · ' + d.updatedAt.toDate().toLocaleDateString('en-GB') : '');
        Poster.mini(c.querySelector('.mini'), D.toState(d), 216);
        c.querySelector('.mini').onclick = function () { location.href = '/studio/create/?id=' + d.id; };
        var bt = c.querySelector('.bt');
        function add(txt, fn, cls) { var b = document.createElement('button'); b.className = 'btn sm ' + (cls || ''); b.textContent = txt; b.onclick = function () { fn(b); }; bt.appendChild(b); }
        function dl(f) { return function (b) { var o = b.textContent; b.disabled = true; b.textContent = '...'; var s = D.toState(d); Poster.exportImage(s, f).then(function (u) { Poster.download(u, s, f); }).catch(function (er) { S.toast('Export failed: ' + er.message); }).then(function () { b.disabled = false; b.textContent = o; }); }; }
        add('Edit', function () { location.href = '/studio/create/?id=' + d.id; }, 'pri');
        add('PNG', dl('PNG')); add('JPG', dl('JPG'));
        add('Duplicate', function () { var s = D.toState(d); s.name = d.name + ' copy'; D.saveDesign(null, D.pack(s)).then(function () { S.toast('Duplicated'); load(); }, function (e) { S.toast(e.message); }); });
        add('Delete', function () { if (confirm('Delete "' + d.name + '"?')) D.delDesign(d.id).then(load, function (e) { S.toast(e.message); }); }, 'del');
        host.appendChild(c);
      });
    }).catch(function (e) { $('grid').textContent = 'Could not load designs: ' + e.message; });
  }
  load();
});
