S.guard(function () {
  var $ = function (i) { return document.getElementById(i); };
  Promise.all([D.templates(), D.designs(200).catch(function () { return []; })]).then(function (r) {
    var T = r[0], ds = r[1];
    $('nt').textContent = D.ordered(T).filter(function (t) { return t.enabled !== false; }).length;
    $('nd').textContent = ds.length;
    var host = $('recent');
    if (!ds.length) { host.innerHTML = '<div class="card">No designs yet. Choose a template and enter your content to make the first one.</div>'; return; }
    host.innerHTML = '';
    ds.slice(0, 6).forEach(function (d) {
      var c = document.createElement('div'); c.className = 'tcard';
      c.innerHTML = '<div class="mini"></div><div class="bd"><h2></h2><p></p></div>';
      c.querySelector('h2').textContent = d.name; c.querySelector('p').textContent = (T[d.templateId] ? T[d.templateId].name : d.type) + (d.updatedAt ? ' · ' + d.updatedAt.toDate().toLocaleDateString('en-GB') : '');
      var s = D.toState(d); Poster.mini(c.querySelector('.mini'), s, 216);
      c.querySelector('.mini').onclick = function () { location.href = '/studio/create/?id=' + d.id; };
      host.appendChild(c);
    });
  });
});
