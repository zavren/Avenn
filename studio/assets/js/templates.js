// Templates are data. Built-in ones live here; saved variations and overrides live in Firestore (studioTemplates).
var CONTENT_KEYS = ['label', 'title', 'desc', 'cat', 'loc', 'date', 'time', 'venue', 'period', 'ticket', 'tags', 'extra'];
var CONFIG_KEYS = ['layout', 'flip', 'ip', 'align', 'dp', 'fp', 'sp', 'scale', 'bgc', 'acc', 'show', 'meta', 'scene'];
var FIELDS = { // key: [label, input type, show key]
  label: ['Label on graphic', 'text', 'lab'], title: ['Title', 'text'], desc: ['Short description', 'area'],
  cat: ['Category', 'text', 'cat'], loc: ['Location', 'text', 'loc'], date: ['Publication date', 'date', 'date'],
  time: ['Time', 'text', 'time'], venue: ['Venue', 'text', 'venue'], period: ['Date or weekend period', 'text', 'period'],
  ticket: ['Ticket information or link', 'text', 'ticket'], tags: ['Tags (comma separated)', 'text', 'tags'], extra: ['Additional information', 'text', 'extra']
};
var SHOWN = { lab: 'Label', cat: 'Category', loc: 'Location', date: 'Date', time: 'Time', venue: 'Venue', period: 'Period', ticket: 'Tickets', tags: 'Tags', extra: 'Extra info' };
var LAYOUTS = [
  ['top', 'Image top', '<rect width="60" height="26" fill="#38B6FF"/><rect x="6" y="31" width="34" height="4" fill="#888"/>'],
  ['overlay', 'Full image', '<rect width="60" height="42" fill="#38B6FF"/><rect x="6" y="28" width="34" height="4" fill="#fff"/><rect x="6" y="34" width="22" height="3" fill="#fff" opacity=".7"/>'],
  ['split', 'Split', '<rect width="26" height="42" fill="#38B6FF"/><rect x="31" y="10" width="24" height="4" fill="#888"/><rect x="31" y="18" width="18" height="3" fill="#888" opacity=".7"/>'],
  ['panel', 'Compact panel', '<rect width="60" height="42" fill="#38B6FF"/><rect x="5" y="22" width="36" height="15" fill="#fff"/>'],
  ['magazine', 'Magazine', '<rect x="4" y="4" width="52" height="22" fill="#38B6FF"/><rect x="4" y="30" width="10" height="2" fill="#9B59B6"/><rect x="4" y="34" width="34" height="4" fill="#888"/>'],
  ['typed', 'Type-led', '<rect x="5" y="4" width="40" height="5" fill="#888"/><rect x="5" y="12" width="30" height="5" fill="#888"/><rect x="5" y="22" width="50" height="16" fill="#38B6FF"/>']
];
var ORDER = ['discovery', 'picks', 'events', 'editorial', 'weekend', 'custom'];
var BG_PRESETS = ['#0D0B2B', '#FFFFFF', '#F2F3F8', '#2B1A4A'], ACC_PRESETS = ['#38B6FF', '#9B59B6', '#FFFFFF', '#0D0B2B'];
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function cfg(o) {
  var c = { layout: 'top', flip: 0, ip: 55, align: 'left', dp: 'below', fp: 'bottom', sp: 100, scale: 100, bgc: '#0D0B2B', acc: '#38B6FF', scene: 0,
    show: { lab: 1, cat: 1, loc: 1, date: 1, time: 1, venue: 1, period: 1, ticket: 1, tags: 1, extra: 1 } };
  for (var k in o) c[k] = o[k]; return c;
}
var BUILTIN = {
  discovery: { name: 'Mtaani Discovery', label: 'Mtaani Discovery', fields: ['label', 'title', 'desc', 'cat', 'loc', 'date', 'extra'], meta: ['cat', 'loc', 'date'],
    config: cfg({ layout: 'top', scene: 0 }),
    sample: { title: 'Kileleshwa Roastery', desc: 'A corner coffee bar roasting Kenyan single-origins on site, with a quiet back garden.', cat: 'Cafe', loc: 'Kileleshwa, Nairobi', date: '2026-11-13' } },
  picks: { name: 'Mtaani Picks', label: 'Mtaani Picks', fields: ['label', 'title', 'desc', 'cat', 'loc', 'date', 'extra'], meta: ['cat', 'loc', 'date'],
    config: cfg({ layout: 'overlay', acc: '#9B59B6', scene: 1 }),
    sample: { title: 'Five rooftops worth the climb', desc: 'Sunset views, good food and a breeze. Our picks for the week.', cat: 'Dining', loc: 'Nairobi', date: '2026-11-13' } },
  events: { name: 'Events', label: 'Event', fields: ['label', 'title', 'desc', 'date', 'time', 'venue', 'loc', 'cat', 'ticket', 'extra'], meta: ['date', 'time', 'venue', 'loc', 'cat'],
    config: cfg({ layout: 'split', bgc: '#FFFFFF', scene: 2 }),
    sample: { title: 'Nairobi Jazz Night', desc: 'Live sets from local trios on the lawn, with food trucks until late.', date: '2026-11-21', time: '7:00 PM', venue: 'The Alchemist Lawn', loc: 'Westlands, Nairobi', cat: 'Music', ticket: 'Tickets from KES 1,500 at mtaaniweb.co.ke/events' } },
  editorial: { name: 'Editorial', label: 'Guide', fields: ['label', 'title', 'desc', 'cat', 'date', 'tags', 'extra'], meta: ['cat', 'date'],
    config: cfg({ layout: 'magazine', bgc: '#FFFFFF', acc: '#9B59B6', scene: 0 }),
    sample: { title: 'A slow weekend guide to Lamu', desc: 'Where to stay, what to eat and how to get around the island without a car.', cat: 'Travel', date: '2026-11-13', tags: 'lamu, coast, weekend' } },
  weekend: { name: 'Weekend Preview', label: 'Weekend Preview', fields: ['label', 'title', 'desc', 'period', 'cat', 'loc', 'extra'], meta: ['period', 'cat', 'loc'],
    config: cfg({ layout: 'panel', scene: 1 }),
    sample: { title: 'What to do this weekend', desc: 'Markets, live music and a rooftop film night. Here is what is on.', period: 'Sat 14 to Sun 15 Nov', cat: 'Weekend', loc: 'Nairobi' } },
  custom: { name: 'Custom', label: 'Feature', fields: ['label', 'title', 'desc', 'cat', 'loc', 'date', 'time', 'venue', 'period', 'ticket', 'tags', 'extra'], meta: ['cat', 'loc', 'date', 'time', 'venue', 'period'],
    config: cfg({ layout: 'typed', scene: 2 }),
    sample: { title: 'Your headline goes here', desc: 'Use Custom for anything that is not covered by the other templates. Choose your own label.', cat: 'General', loc: 'Nairobi', date: '2026-11-13' } }
};
ORDER.forEach(function (id) { var t = BUILTIN[id]; t.id = id; t.kind = id; t.builtin = true; t.enabled = true; });
var PAL = [['#F2B880', '#9B59B6', '#0D0B2B', '#FFD9A0'], ['#38B6FF', '#1B4F8A', '#0D0B2B', '#FFFFFF'], ['#E88A6A', '#6A3A7A', '#1A1440', '#FFE2B8']];
// Placeholder art shown until a real photo is uploaded
function scene(i) {
  var c = PAL[i % 3];
  var b = [[40, 560, 90, 440], [150, 600, 70, 400], [240, 520, 110, 480], [370, 580, 80, 420], [470, 540, 100, 460], [590, 610, 90, 390], [690, 570, 110, 430]]
    .map(function (r) { return "<rect x='" + r[0] + "' y='" + r[1] + "' width='" + r[2] + "' height='" + r[3] + "' fill='" + c[2] + "'/>"; }).join('');
  var s = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000' preserveAspectRatio='xMidYMid slice'><rect width='800' height='1000' fill='" + c[0] + "'/><circle cx='560' cy='330' r='130' fill='" + c[3] + "'/><path d='M0 600 Q200 470 420 580 T800 540 V1000 H0Z' fill='" + c[1] + "'/>" + b + "</svg>";
  return 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
}
// A full editor state from a template. full = include sample content.
function stateFor(t, full) {
  var s = { tpl: t.id, kind: t.kind || t.id, name: '', img: null, imgId: null, ar: 'portrait', fmt: 'PNG' };
  CONTENT_KEYS.forEach(function (k) { s[k] = ''; });
  Object.assign(s, clone(t.config), { meta: t.meta.slice(), label: t.label });
  if (full !== false) Object.assign(s, clone(t.sample));
  return s;
}
