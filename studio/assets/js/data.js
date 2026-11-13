// Firestore and Cloudinary access
var D = {
  T: {},
  col: function (n) { return S.db.collection(n); },
  ts: function () { return firebase.firestore.FieldValue.serverTimestamp(); },
  // Built-in templates, with any saved overrides, plus saved variations
  templates: function () {
    var map = clone(BUILTIN);
    return D.col('studioTemplates').get().then(function (q) {
      q.forEach(function (d) {
        var v = d.data(), id = d.id;
        if (BUILTIN[id]) map[id] = Object.assign(clone(BUILTIN[id]), v, { id: id, builtin: true });
        else map[id] = Object.assign({ fields: BUILTIN.custom.fields, meta: BUILTIN.custom.meta, sample: BUILTIN.custom.sample, enabled: true }, v, { id: id });
      });
    }).catch(function () {}).then(function () { D.T = map; return map; });
  },
  ordered: function (map) {
    var ids = Object.keys(map), o = ORDER.filter(function (i) { return map[i]; });
    return o.concat(ids.filter(function (i) { return ORDER.indexOf(i) < 0; }).sort(function (a, b) { return (map[a].name || '').localeCompare(map[b].name || ''); })).map(function (i) { return map[i]; });
  },
  settings: function () { return D.col('studioSettings').doc('app').get().then(function (d) { return d.exists ? d.data() : {}; }).catch(function () { return {}; }); },
  setDefault: function (id) { return D.col('studioSettings').doc('app').set({ defaultTemplate: id, updatedAt: D.ts() }, { merge: true }); },
  saveTemplate: function (id, data) { data.updatedAt = D.ts(); return D.col('studioTemplates').doc(id).set(data, { merge: true }); },
  addTemplate: function (data) { data.createdAt = D.ts(); data.updatedAt = D.ts(); return D.col('studioTemplates').add(data).then(function (r) { return r.id; }); },
  delTemplate: function (id) { return D.col('studioTemplates').doc(id).delete(); },
  designs: function (n) {
    return D.col('studioDesigns').orderBy('updatedAt', 'desc').limit(n || 100).get().then(function (q) { return q.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }); });
  },
  design: function (id) { return D.col('studioDesigns').doc(id).get().then(function (d) { if (!d.exists) throw new Error('Design not found'); return Object.assign({ id: d.id }, d.data()); }); },
  pack: function (s) {
    var content = {}, config = {};
    CONTENT_KEYS.forEach(function (k) { content[k] = s[k] || ''; });
    CONFIG_KEYS.forEach(function (k) { config[k] = clone(s[k] === undefined ? null : s[k]); });
    return { name: s.name || s.title || 'Untitled', type: s.kind || s.tpl, templateId: s.tpl, content: content, config: config,
      imageUrl: s.img || '', imageId: s.imgId || '', exportSize: s.ar, format: s.fmt };
  },
  saveDesign: function (id, p) {
    p.updatedAt = D.ts();
    if (id) return D.col('studioDesigns').doc(id).set(p, { merge: true }).then(function () { return id; });
    p.createdAt = D.ts(); p.createdBy = S.auth.currentUser.uid;
    return D.col('studioDesigns').add(p).then(function (r) { return r.id; });
  },
  delDesign: function (id) { return D.col('studioDesigns').doc(id).delete(); },
  toState: function (d) {
    var t = D.T[d.templateId] || D.T.custom || BUILTIN.custom, s = stateFor(t, false);
    Object.assign(s, d.content || {}, clone(d.config || {}), { id: d.id, name: d.name, tpl: d.templateId, kind: d.type || t.kind, img: d.imageUrl || null, imgId: d.imageId || null, ar: d.exportSize || 'portrait', fmt: d.format || 'PNG', dirty: 1 });
    return s;
  },
  // Direct browser upload with the unsigned preset; the reference is also kept in studioMedia
  upload: function (file) {
    var c = STUDIO.cloudinary, fd = new FormData(); fd.append('file', file); fd.append('upload_preset', c.preset);
    return fetch('https://api.cloudinary.com/v1_1/' + c.cloudName + '/image/upload', { method: 'POST', body: fd }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error((j.error && j.error.message) || 'Upload failed'); return j; });
    }).then(function (j) {
      var m = { url: j.secure_url, publicId: j.public_id, width: j.width, height: j.height, bytes: j.bytes };
      D.col('studioMedia').add(Object.assign({ createdAt: D.ts(), by: S.auth.currentUser.uid }, m)).catch(function () {});
      return m;
    });
  }
};
