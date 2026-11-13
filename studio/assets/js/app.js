(function () {
  firebase.initializeApp(STUDIO.firebase);
  var auth = firebase.auth(), db = firebase.firestore(), adminP = null;
  // Staff check: the live rules let only staff read /meta
  function isStaff() { return db.collection('meta').doc('studio-check').get().then(function () { return true; }, function () { return false; }); }
  // Admin check: the live rules let only admins list /revenue
  function isAdmin() { if (!adminP) adminP = db.collection('revenue').limit(1).get().then(function () { return true; }, function () { return false; }); return adminP; }
  function curTheme() { return document.documentElement.dataset.theme || 'light'; }
  function setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem('studio-theme', t); } catch (e) {} }
  function toast(m) {
    var t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }
  function side(u) {
    var el = document.getElementById('side'); if (!el) return;
    var pg = document.body.dataset.page;
    var L = [['dash', 'Dashboard', '/studio/'], ['create', 'Create design', '/studio/create/'], ['tpl', 'Templates', '/studio/templates/'], ['designs', 'Saved designs', '/studio/designs/']];
    el.innerHTML = '<div class="logo">MtaaniWeb Studio</div>' +
      L.map(function (l) { return '<a href="' + l[2] + '" class="' + (pg === l[0] ? 'on' : '') + '">' + l[1] + '</a>'; }).join('') +
      '<div class="gap"></div><small id="who"></small><button id="th"></button><button id="out">Sign out</button>';
    document.getElementById('who').textContent = u.email;
    var th = document.getElementById('th');
    function lab() { th.textContent = curTheme() === 'dark' ? 'Light mode' : 'Dark mode'; }
    th.onclick = function () { setTheme(curTheme() === 'dark' ? 'light' : 'dark'); lab(); }; lab();
    document.getElementById('out').onclick = function () { auth.signOut().then(function () { location.replace('/studio/login/'); }); };
  }
  window.S = {
    auth: auth, db: db, isStaff: isStaff, isAdmin: isAdmin, toast: toast,
    guard: function (ready) {
      auth.onAuthStateChanged(function (u) {
        if (!u) { location.replace('/studio/login/'); return; }
        isStaff().then(function (ok) {
          if (!ok) { auth.signOut().then(function () { location.replace('/studio/login/?denied=1'); }); return; }
          side(u); if (ready) ready(u);
        });
      });
    }
  };
})();
