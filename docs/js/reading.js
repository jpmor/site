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
  {name: 'completed', idx: 10, vis: false},
  {name: 'rated',     idx: 11, vis: false},
];

var COMPLETED_IDX = 10;

var STATUS_ORDER = ['Started', 'Soon', 'Bought', 'Tier 1', 'Tier 2', 'Tier 3', '', 'Read'];
var PLACE_ORDER  = ['america', 'europe', 'neareast', 'fareast'];
var TIME_ORDER   = ['ancient', 'classical', 'medieval', 'early', 'modern'];
var TOPIC_ORDER  = ['nature', 'humanity/engineering', 'humanity/civilization', 'humanity/society', 'fiction'];

var STATUS_COLOR = {
  'Started': 'hsl(210, 70%, 65%)',
  'Soon':    'hsl(270, 65%, 65%)',
  'Bought':  'hsl(320, 65%, 65%)',
  'Tier 1':  'hsl(0,   70%, 65%)',
  'Tier 2':  'hsl(28,  70%, 65%)',
  'Tier 3':  'hsl(48,  70%, 65%)',
  'Read':    'hsl(120, 40%, 55%)',
};
var REGION_HUE = {america: 50, europe: 210, neareast: 130, fareast: 0};
var SYSTEM_HUE = {
  nature: 130,
  engineering: 50,
  civilization: 210,
  society: 0,
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
  return 'hsl(' + Math.round(10 + t * 110) + ', 70%, ' + Math.round(72 - t * 12) + '%)';
}

function cellColor(idx, val) {
  if (!val) return '';
  if (idx === 6 || idx === 11) return ratingColor(val);
  if (idx === 1) return STATUS_COLOR[val] || '';
  if (idx === 2) {
    var segs = val.split('/');
    var base = REGION_HUE[segs[0]];
    return base !== undefined ? 'hsl(' + (base + strHash(segs[segs.length - 1]) % 20 - 10) + ', 65%, 65%)' : '';
  }
  if (idx === 3) {
    var segs = val.split('/');
    var era = segs[0];
    if (era === 'ancient') return 'hsl(0, 0%, 82%)';
    var region = segs.length >= 2 && segs[1].indexOf(era) === 0 ? segs[1].slice(era.length) : null;
    var l = ERA_LIGHTNESS[era], h = REGION_HUE[region];
    return (l !== undefined && h !== undefined) ? 'hsl(' + h + ', 60%, ' + l + '%)' : '';
  }
  if (idx === 4) {
    var segs = val.split('/');
    var key = segs[0] === 'humanity' ? (segs[1] || 'humanity') : segs[0];
    var base = SYSTEM_HUE[key];
    return base !== undefined ? 'hsl(' + (base + strHash(segs[segs.length - 1]) % 20 - 10) + ', 65%, 65%)' : '';
  }
  return '';
}

function displayVal(idx, val) {
  if (!val) return val;
  if (idx === 2) {
    var parts = val.split('/');
    if (parts.length >= 3) return parts[1] + ' (' + parts[parts.length - 1] + ')';
    return parts.length === 2 ? parts[1] : parts[0];
  }
  if (idx === 3) {
    var parts = val.split('/');
    var seg = parts.length >= 2 ? parts[1] : parts[0];
    var era = TIME_ORDER.filter(function(e) { return seg.indexOf(e) === 0 && seg.length > e.length; })[0];
    return era ? era + ' ' + seg.slice(era.length) : seg;
  }
  if (idx === 4) {
    var parts = val.split('/');
    var leaf = parts[parts.length - 1];
    var anchor = parts[0] === 'humanity' ? (parts.length >= 3 ? parts[2] : leaf) : (parts.length >= 2 ? parts[1] : parts[0]);
    return anchor !== leaf ? anchor + ' (' + leaf + ')' : anchor;
  }
  return val;
}

function topicRank(v) {
  for (var i = 0; i < TOPIC_ORDER.length; i++) {
    if (v.indexOf(TOPIC_ORDER[i]) === 0) return i;
  }
  return TOPIC_ORDER.length;
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
      var xei = TIME_ORDER.indexOf(x.split('/')[0]), yei = TIME_ORDER.indexOf(y.split('/')[0]);
      if (xei === -1) xei = TIME_ORDER.length;
      if (yei === -1) yei = TIME_ORDER.length;
      var res = xei !== yei ? xei - yei : x.localeCompare(y);
      return sortAsc ? res : -res;
    }
    if (sortIdx === 2) {
      var xo = PLACE_ORDER.indexOf(x.split('/')[0]), yo = PLACE_ORDER.indexOf(y.split('/')[0]);
      var res = xo !== yo ? xo - yo : x.localeCompare(y);
      return sortAsc ? res : -res;
    }
    if (sortIdx === 1) {
      var xo = STATUS_ORDER.indexOf(x), yo = STATUS_ORDER.indexOf(y);
      var res = (xo === -1 ? STATUS_ORDER.length : xo) - (yo === -1 ? STATUS_ORDER.length : yo);
      return sortAsc ? res : -res;
    }
    if (sortIdx === 4) {
      var res = topicRank(x) !== topicRank(y) ? topicRank(x) - topicRank(y) : x.localeCompare(y);
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
    if (r[COMPLETED_IDX]) tr.style.color = 'hsl(120, 40%, 55%)';
    COLS.forEach(function(col) {
      var td = tr.insertCell();
      var val = r[col.idx] || '';
      td.textContent = displayVal(col.idx, val);
      td.style.display = vis[col.idx] ? '' : 'none';
      if (col.idx !== 0 && col.idx !== 5) td.style.textAlign = 'center';
      if (col.idx === 5) td.style.maxWidth = '150px';
      var color = cellColor(col.idx, val);
      if (color) td.style.color = color;
    });
  });
}
