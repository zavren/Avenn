(function () {
  var R = { portrait: [1080, 1350], square: [1080, 1080], story: [1080, 1920], landscape: [1200, 675] };
  var NAMES = { portrait: 'Instagram portrait', square: 'Square', story: 'Story', landscape: 'Landscape' };
  var FONTS = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap';
  var HTML = '<div class="ph"></div><span class="lab"></span><div class="tx"><h2 class="ti"></h2><p class="de"></p><p class="ex"></p><div class="me"></div><div class="tg"></div><p class="tk"></p></div><div class="ft"><b>MtaaniWeb</b><span>mtaaniweb.co.ke</span></div>';
  function fmt(d) { return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
  function lum(h) { var n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
  function draw(el, s) {
    if (!el.firstChild) el.innerHTML = HTML;
    var d = el.dataset;
    d.layout = (s.ar === 'landscape' && (s.layout === 'top' || s.layout === 'magazine')) ? 'split' : s.layout;
    d.ar = s.ar; d.al = s.align; d.dp = s.dp; d.fp = s.fp; d.flip = s.flip;
    var st = el.style, bg = s.bgc || '#0D0B2B', ac = s.acc || '#38B6FF';
    st.setProperty('--pb', bg); st.setProperty('--pf', lum(bg) > 0.55 ? '#0D0B2B' : '#FFFFFF');
    st.setProperty('--ac', ac); st.setProperty('--lt', lum(ac) > 0.6 ? '#0D0B2B' : '#FFFFFF');
    st.setProperty('--s', s.scale / 100); st.setProperty('--sp', s.sp / 100); st.setProperty('--ip', s.ip);
    function q(c) { return el.querySelector(c); }
    var sh = s.show || {};
    q('.lab').textContent = sh.lab ? s.label : ''; q('.ti').textContent = s.title; q('.de').textContent = s.desc;
    q('.ex').textContent = sh.extra ? s.extra : ''; q('.tk').textContent = sh.ticket ? s.ticket : '';
    var me = q('.me'); me.innerHTML = '';
    (s.meta || []).forEach(function (k) {
      var v = k === 'date' ? fmt(s.date) : s[k];
      if (sh[k] && v) { var n = document.createElement('span'); n.textContent = v; me.appendChild(n); }
    });
    q('.tg').textContent = sh.tags ? (s.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean).map(function (t) { return '#' + t.replace(/\s+/g, ''); }).join('  ') : '';
    q('.ph').style.backgroundImage = s.img ? 'url("' + s.img + '")' : scene(s.scene || 0);
  }
  function fit(stage, el, ar) {
    var r = R[ar], k = Math.min((stage.clientWidth - 32) / r[0], (stage.clientHeight - 32) / r[1]);
    if (k > 0) { el.style.width = r[0] * k + 'px'; el.style.height = r[1] * k + 'px'; }
  }
  function mini(host, s, w) {
    var r = R[s.ar], el = document.createElement('div'); el.className = 'poster';
    el.style.width = w + 'px'; el.style.height = Math.round(w * r[1] / r[0]) + 'px';
    host.innerHTML = ''; host.appendChild(el); draw(el, s);
  }
  function toData(url) {
    return fetch(url, { mode: 'cors' }).then(function (r) { if (!r.ok) throw new Error('Image could not be loaded'); return r.blob(); }).then(function (b) {
      return new Promise(function (res, rej) { var f = new FileReader(); f.onload = function () { res(f.result); }; f.onerror = rej; f.readAsDataURL(b); });
    });
  }
  // Embed the three brand fonts (latin subsets) so the export never depends on the network
  var fontCache;
  function fontCss() {
    if (fontCache) return fontCache;
    fontCache = fetch(FONTS).then(function (r) { return r.text(); }).then(function (css) {
      var blocks = css.split('/* ').slice(1).filter(function (b) { return /^latin(-ext)? \*\//.test(b); });
      return Promise.all(blocks.map(function (b) {
        var m = b.match(/url\((https:[^)]+)\)/); if (!m) return '';
        return toData(m[1]).then(function (u) { return '/* ' + b.replace(m[1], u); });
      })).then(function (a) { return a.join('\n'); });
    }).catch(function () { fontCache = null; return undefined; });
    return fontCache;
  }
  // Renders an exact-size copy off screen, so no controls or borders can appear. Resolves to a data URL.
  function exportImage(s, format) {
    var r = R[s.ar], w = r[0], h = r[1], host = document.createElement('div'), el = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-30000px;top:0;width:' + w + 'px;height:' + h + 'px;pointer-events:none';
    el.className = 'poster'; el.style.width = w + 'px'; el.style.height = h + 'px'; host.appendChild(el); document.body.appendChild(host);
    var s2 = Object.assign({}, s);
    return Promise.all([s.img ? toData(s.img).then(function (u) { s2.img = u; }) : 0, fontCss(), document.fonts.ready]).then(function (res) {
      draw(el, s2);
      return Promise.all(['600 40px Fraunces', 'italic 500 40px Fraunces', '400 20px Inter', '500 20px Inter', '600 20px Inter', '400 20px "JetBrains Mono"'].map(function (f) { return document.fonts.load(f); })).then(function () {
        return new Promise(function (ok) { requestAnimationFrame(function () { requestAnimationFrame(ok); }); });
      }).then(function () {
        var o = { width: w, height: h, pixelRatio: 1, cacheBust: false, backgroundColor: s.bgc || '#0D0B2B' };
        if (res[1]) o.fontEmbedCSS = res[1];
        var go = function () { return format === 'JPG' ? htmlToImage.toJpeg(el, Object.assign({ quality: 0.95 }, o)) : htmlToImage.toPng(el, o); };
        return go().catch(function () {}).then(go); // first pass warms up image decoding in some browsers
      });
    }).then(function (u) { host.remove(); return u; }, function (e) { host.remove(); throw e; });
  }
  function download(url, s, format) {
    var a = document.createElement('a'), r = R[s.ar], n = (s.name || s.title || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design';
    a.href = url; a.download = n + '-' + r[0] + 'x' + r[1] + '.' + (format === 'JPG' ? 'jpg' : 'png'); document.body.appendChild(a); a.click(); a.remove();
  }
  window.Poster = { R: R, NAMES: NAMES, draw: draw, fit: fit, mini: mini, exportImage: exportImage, download: download };
})();
