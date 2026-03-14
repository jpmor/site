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
  {name: 'system',    idx: 4,  vis: true},
  {name: 'completed', idx: 10, vis: false},
  {name: 'rated',     idx: 11, vis: false},
];

var STATUS_ORDER = ['Started', 'Soon', 'Bought', 'Tier 1', 'Tier 2', 'Tier 3', ''];
var STATUS_COLOR = {
  'Started': 'hsl(210, 70%, 65%)',
  'Soon':    'hsl(270, 65%, 65%)',
  'Bought':  'hsl(320, 65%, 65%)',
  'Tier 1':  'hsl(0,   70%, 65%)',
  'Tier 2':  'hsl(28,  70%, 65%)',
  'Tier 3':  'hsl(48,  70%, 65%)',
};
var PLACE_HUE    = {am: 50, eu: 210, ne: 130, fe: 0};
var SYSTEM_HUE   = {civ: 210, soc: 0, nat: 130, eng: 50, fic: 270};
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
    var prefix = val.split('-')[0];
    var base = PLACE_HUE[prefix];
    return base !== undefined
      ? 'hsl(' + (base + strHash(val) % 20 - 10) + ', 65%, 65%)'
      : '';
  }
  if (idx === 3) {
    var parts = val.split('-');
    var era = parts[0], region = parts[1];
    if (era === 'ancient') return 'hsl(0, 0%, 82%)';
    var l = ERA_LIGHTNESS[era], h2 = PLACE_HUE[region];
    return (l !== undefined && h2 !== undefined)
      ? 'hsl(' + h2 + ', 60%, ' + l + '%)'
      : '';
  }
  if (idx === 4) {
    var sysPrefix = val.split('-')[0];
    var sysBase = SYSTEM_HUE[sysPrefix];
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
    if (sortIdx === 1) {
      var xi = STATUS_ORDER.indexOf(x), yi = STATUS_ORDER.indexOf(y);
      if (xi === -1) xi = STATUS_ORDER.length;
      if (yi === -1) yi = STATUS_ORDER.length;
      var res = xi - yi;
      return sortAsc ? res : -res;
    }
    var xunk = !x || x === '?', yunk = !y || y === '?';
    if (xunk && !yunk) return 1;
    if (!xunk && yunk) return -1;
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
      td.textContent = val;
      td.style.display = vis[col.idx] ? '' : 'none';
      if (col.idx !== 0 && col.idx !== 5) td.style.textAlign = 'center';
      if (col.idx === 5) td.style.maxWidth = '150px';
      var color = cellColor(col.idx, val);
      if (color) td.style.color = color;
    });
  });
}
