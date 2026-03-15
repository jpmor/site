var COLS = [
  {name: 'title',     idx: 0,  vis: true},
  {name: 'author',    idx: 5,  vis: true},
  {name: 'rating',    idx: 6,  vis: false},
  {name: 'year',      idx: 8,  vis: false},
  {name: 'pages',     idx: 7,  vis: false},
  {name: 'isbn13',    idx: 13, vis: false},
  {name: 'status',    idx: 1,  vis: true},
  {name: 'place',     idx: 2,  vis: true},
  {name: 'time',      idx: 3,  vis: true},
  {name: 'topic',     idx: 4,  vis: true},
  {name: 'completed',      idx: 10, vis: false},
  {name: 'rated',          idx: 11, vis: false},
];

var STATUS_ORDER = ['Started', 'Soon', 'Bought', 'Tier 1', 'Tier 2', 'Tier 3', '', 'Read'];
var PLACE_ORDER  = ['america','europe','neareast','fareast'];
var TIME_ORDER   = ['ancient','classical','medieval','early','modern'];
var TIME_REGION  = ['america','europe','neareast','fareast'];
var TOPIC_ORDER  = ['math','physics','environment','biology','taxonomy','engineering','resources','settlements','transport','manufacturing','military','info','healthcare','thought','culture','politics','economy','order','fiction'];
var STATUS_COLOR = {
  'Started': 'hsl(210, 70%, 65%)',
  'Soon':    'hsl(270, 65%, 65%)',
  'Bought':  'hsl(320, 65%, 65%)',
  'Tier 1':  'hsl(0,   70%, 65%)',
  'Tier 2':  'hsl(28,  70%, 65%)',
  'Tier 3':  'hsl(48,  70%, 65%)',
  'Read':    'hsl(120, 40%, 55%)',
};
var PLACE_HUE    = {
  america: 50,
  europe: 210,
  neareast: 130,
  fareast: 0,
};
var TIME_HUE     = {america: 50, europe: 210, neareast: 130, fareast: 0};
var SYSTEM_HUE   = {
  math: 130, physics: 130, environment: 130, biology: 130, taxonomy: 130,
  engineering: 50,
  resources: 210, settlements: 210, transport: 210, manufacturing: 210, military: 210, info: 210, healthcare: 210,
  thought: 0, culture: 0, politics: 0, economy: 0, order: 0,
  fiction: 270,
};
var ERA_LIGHTNESS = {modern: 65, medieval: 72, early: 79, classical: 86};

var vis = {};
COLS.forEach(function(col) { vis[col.idx] = col.vis; });

var sortIdx = 1, sortAsc = true, rows = [];

function strHash(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return h % 360;
}

function ratingColor(val) {
  var n = parseFloat(val);
  if (isNaN(n)) return '';
  var t = Math.pow(Math.min(Math.max(n, 0), 5) / 5, 3);
  var h = Math.round(10 + t * 110);
  var l = Math.round(72 - t * 12);
  return 'hsl(' + h + ', 70%, ' + l + '%)';
}

function cellColor(idx, val) {
  if (!val) return '';
  if (idx === 6 || idx === 11) {
    return ratingColor(val);
  }
  if (idx === 1) {
    return STATUS_COLOR[val] || '';
  }
  if (idx === 2) {
    var segs = val.split('/');
    var base = PLACE_HUE[segs[0]];
    if (base === undefined) return '';
    var leaf = segs[segs.length - 1];
    return 'hsl(' + (base + strHash(leaf) % 20 - 10) + ', 65%, 65%)';
  }
  if (idx === 3) {
    var parts = val.split(' ');
    var era = parts[0], region = parts[1];
    if (era === 'ancient') return 'hsl(0, 0%, 82%)';
    var l = ERA_LIGHTNESS[era], h2 = TIME_HUE[region];
    return (l !== undefined && h2 !== undefined)
      ? 'hsl(' + h2 + ', 60%, ' + l + '%)'
      : '';
  }
  if (idx === 4) {
    var sysBase = SYSTEM_HUE[val];
    return sysBase !== undefined
      ? 'hsl(' + (sysBase + strHash(val) % 20 - 10) + ', 65%, 65%)'
      : '';
  }
  return '';
}

fetch('static/reading.tsv').then(function(r) { return r.text(); }).then(function(tsv) {
  rows = tsv.trim().split('\n').slice(1).map(function(l) { return l.split('\t'); });

  var table = document.getElementById('books');
  var hr = table.createTHead().insertRow();
  table.createTBody();

  COLS.forEach(function(col) {
    var th = document.createElement('th');
    th.textContent = col.name;
    th.dataset.idx = col.idx;
    th.style.cursor = 'pointer';
    th.onclick = function() {
      if (sortIdx === col.idx) sortAsc = !sortAsc;
      else { sortIdx = col.idx; sortAsc = true; }
      render();
    };
    hr.appendChild(th);
  });

  var toggles = document.getElementById('toggles');
  COLS.forEach(function(col) {
    var b = document.createElement('button');
    b.textContent = col.name;
    b.dataset.idx = col.idx;
    b.onclick = function() { vis[col.idx] = !vis[col.idx]; render(); };
    toggles.appendChild(b);
  });

  render();
});

function render() {
  var sorted = rows.slice().sort(function(a, b) {
    var x = a[sortIdx] || '', y = b[sortIdx] || '';
    var xempty = !x || x === '?', yempty = !y || y === '?';
    if (xempty && !yempty) return 1;
    if (!xempty && yempty) return -1;
    if (xempty && yempty) return 0;
    if (sortIdx === 3) {
      var xp = x.split(' '), yp = y.split(' ');
      var xei = TIME_ORDER.indexOf(xp[0]), yei = TIME_ORDER.indexOf(yp[0]);
      var xri = TIME_REGION.indexOf(xp[1]), yri = TIME_REGION.indexOf(yp[1]);
      if (xei === -1) xei = TIME_ORDER.length;
      if (yei === -1) yei = TIME_ORDER.length;
      if (xri === -1) xri = TIME_REGION.length;
      if (yri === -1) yri = TIME_REGION.length;
      var res = xei !== yei ? xei - yei : xri - yri;
      return sortAsc ? res : -res;
    }
    if (sortIdx === 2) {
      var xo = PLACE_ORDER.indexOf(x.split('/')[0]), yo = PLACE_ORDER.indexOf(y.split('/')[0]);
      var res = (xo === -1 ? PLACE_ORDER.length : xo) - (yo === -1 ? PLACE_ORDER.length : yo);
      if (res !== 0) return sortAsc ? res : -res;
      res = x.localeCompare(y);
      return sortAsc ? res : -res;
    }
    var orderMap = sortIdx === 1 ? STATUS_ORDER : sortIdx === 4 ? TOPIC_ORDER : null;
    if (orderMap) {
      var xo = orderMap.indexOf(x), yo = orderMap.indexOf(y);
      var res = (xo === -1 ? orderMap.length : xo) - (yo === -1 ? orderMap.length : yo);
      return sortAsc ? res : -res;
    }
    var n = parseFloat(x) - parseFloat(y);
    var res = (isNaN(n) || n === 0) ? x.localeCompare(y) : n;
    return sortAsc ? res : -res;
  });
  document.getElementById('count').textContent = sorted.length + ' books';

  document.querySelectorAll('#books th').forEach(function(th) {
    th.style.display = vis[+th.dataset.idx] ? '' : 'none';
  });
  document.querySelectorAll('#toggles button').forEach(function(b) {
    b.style.fontWeight = vis[+b.dataset.idx] ? 'bold' : 'normal';
  });

  var tbody = document.querySelector('#books tbody');
  tbody.innerHTML = '';
  sorted.forEach(function(r) {
    var tr = tbody.insertRow();
    if (r[10]) tr.style.color = 'hsl(120, 40%, 55%)';
    COLS.forEach(function(col) {
      var td = tr.insertCell();
      var val = r[col.idx] || '';
      var display = val;
      if (col.idx === 2 && val) {
        var parts = val.split('/');
        if (parts.length >= 3) display = parts[1] + ' (' + parts[parts.length - 1] + ')';
        else if (parts.length === 2) display = parts[1];
        else display = parts[0];
      }
      td.textContent = display;
      td.style.display = vis[col.idx] ? '' : 'none';
      if (col.idx !== 0 && col.idx !== 5) td.style.textAlign = 'center';
      if (col.idx === 5) td.style.maxWidth = '150px';
      var color = cellColor(col.idx, val);
      if (color) td.style.color = color;
    });
  });
}
