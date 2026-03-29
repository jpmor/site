var COLS = [
  {name: 'title',    idx: 0,  vis: true,  row: 0},
  {name: 'author',   idx: 1,  vis: true,  row: 0},
  {name: 'year',     idx: 2,  vis: false, row: 0},
  {name: 'pages',    idx: 3,  vis: false, row: 0},
  {name: 'isbn13',   idx: 4,  vis: false, row: 0},
  {name: 'score',    idx: 16, vis: true,  row: 1},
  {name: 'rating',   idx: 14, vis: false, row: 1},
  {name: 'reviews',  idx: 15, vis: false, row: 1},
  {name: 'library',  idx: 11, vis: false, row: 1},
  {name: 'price',    idx: 12, vis: false, row: 1},
  {name: 'status',   idx: 5,  vis: true,  row: 2},
  {name: 'completed',idx: 9,  vis: false, row: 2},
  {name: 'rated',    idx: 10, vis: false, row: 2},
  {name: 'topic',    idx: 8,  vis: true,  row: 3},
  {name: 'place',    idx: 6,  vis: true,  row: 3},
  {name: 'time',     idx: 7,  vis: true,  row: 3},
];

var COMPLETED_IDX = 9;

var STATUS_ORDER = ['Reading', 'Next', 'Soon', 'Stalled', 'Eventually', 'Tier 1', 'Tier 2', 'Tier 3', '', 'Read'];
var PLACE_ORDER  = ['america', 'europe', 'neareast', 'fareast'];
var TIME_ORDER   = ['ancient', 'classical', 'medieval', 'early', 'modern'];
var TOPIC_ORDER  = ['nature', 'humanity/engineering', 'humanity/civilization', 'humanity/society', 'fiction'];
// column indices: title=0 author=1 year=2 pages=3 isbn13=4 status=5 place=6 time=7 topic=8 completed=9 rated=10 library=11 price=12 added=13 rating=14 reviews=15

var STATUS_COLOR = {
  'Reading': 'hsl(210, 70%, 65%)',
  'Next':    'hsl(240, 70%, 65%)',
  'Soon':    'hsl(270, 65%, 65%)',
  'Stalled':    'hsl(30,  30%, 62%)',
  'Eventually': 'hsl(320, 65%, 65%)',
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

var sortIdx = 5, sortAsc = true, rows = [];
var searchQuery = '', colWidthsLocked = false;

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

function priceColor(val) {
  var n = parseFloat(val.replace(/[^0-9.]/g, ''));
  if (isNaN(n) || val === 'N/A') return 'hsl(0, 0%, 50%)';
  var t = Math.min(n, 60) / 60;  // $0=green, $60+=red
  return 'hsl(' + Math.round(120 - t * 110) + ', 60%, 65%)';
}

function reviewsColor(val) {
  var n = parseInt(val);
  if (isNaN(n)) return '';
  var t = Math.min(Math.log10(n + 1) / Math.log10(10000), 1);  // log scale, 10k = max
  return 'hsl(' + Math.round(10 + t * 110) + ', 60%, 68%)';
}

function computeScore(r) {
  var rating  = parseFloat(r[14]);
  var reviews = parseInt(r[15]);
  if (isNaN(rating) || isNaN(reviews)) return '';
  var base = rating * Math.log10(Math.min(reviews, 1000) + 1);
  var library = r[11], price = r[12];
  var mult = 1.0;
  if (library && library !== 'FALSE') {
    mult = 1.1;
  } else {
    var p = parseFloat((price || '').replace(/[^0-9.]/g, ''));
    if (price === 'N/A' || !price) mult = 0.9;
    else if (!isNaN(p) && p <= 15)  mult = 1.05;
    else if (!isNaN(p) && p <= 40)  mult = 1.0;
    else mult = 0.97;
  }
  var year  = parseInt(r[2]),  pages = parseInt(r[3]);
  var recency = (!isNaN(year)  && year > 0)  ? Math.min((2026 - year) / 2, 1) : 1;
  var length  = (!isNaN(pages) && pages > 0) ? (1 - 0.15 * Math.min(pages, 1200) / 1200) : 1;

  return (base * mult * recency * length).toFixed(1);
}

function cellColor(idx, val) {
  if (!val) return '';
  if (idx === 10) return ratingColor(val);   // rated
  if (idx === 12) return priceColor(val);    // price
  if (idx === 14) return ratingColor(val);   // rating
  if (idx === 15) return reviewsColor(val);  // reviews
  if (idx === 16) {                           // score
    var n = parseFloat(val);
    if (isNaN(n)) return '';
    var t = Math.min(n / 15, 1);
    return 'hsl(' + Math.round(10 + t * 110) + ', 65%, 65%)';
  }
  if (idx === 11) {                           // library
    if (val === 'FALSE') return 'hsl(0, 0%, 45%)';
    if (val) return 'hsl(140, 50%, 60%)';
    return '';
  }
  if (idx === 5) return STATUS_COLOR[val] || '';
  if (idx === 6) {
    var segs = val.split('/');
    var base = REGION_HUE[segs[0]];
    return base !== undefined ? 'hsl(' + (base + strHash(segs[segs.length - 1]) % 20 - 10) + ', 65%, 65%)' : '';
  }
  if (idx === 7) {
    var segs = val.split('/');
    var era = segs[0];
    if (era === 'ancient') return 'hsl(0, 0%, 82%)';
    var region = segs.length >= 2 && segs[1].indexOf(era) === 0 ? segs[1].slice(era.length) : null;
    var l = ERA_LIGHTNESS[era], h = REGION_HUE[region];
    return (l !== undefined && h !== undefined) ? 'hsl(' + h + ', 60%, ' + l + '%)' : '';
  }
  if (idx === 8) {
    var segs = val.split('/');
    var key = segs[0] === 'humanity' ? (segs[1] || 'humanity') : segs[0];
    var base = SYSTEM_HUE[key];
    return base !== undefined ? 'hsl(' + (base + strHash(segs[segs.length - 1]) % 20 - 10) + ', 65%, 65%)' : '';
  }
  return '';
}

var LIB_ABBR = {book: 'bk', ebook: 'e', audiobook: 'au'};

function displayVal(idx, val) {
  if (!val) return val;
  if (idx === 11) {
    if (val === 'FALSE' || val === 'TRUE') return val;
    return val.split(',').map(function(f) { return LIB_ABBR[f] || f; }).join('+');
  }
  if (idx === 6) {
    var parts = val.split('/');
    if (parts.length >= 3) return parts[1] + ' (' + parts[parts.length - 1] + ')';
    return parts.length === 2 ? parts[1] : parts[0];
  }
  if (idx === 7) {
    var parts = val.split('/');
    var seg = parts.length >= 2 ? parts[1] : parts[0];
    var era = TIME_ORDER.filter(function(e) { return seg.indexOf(e) === 0 && seg.length > e.length; })[0];
    return era ? era + ' ' + seg.slice(era.length) : seg;
  }
  if (idx === 8) {
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

  var searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'search...';
  searchInput.style.cssText = 'margin-bottom:8px;padding:4px 8px;background:#222;color:#ccc;border:1px solid #444;border-radius:3px;font-size:0.9em;width:200px;';
  searchInput.oninput = function() { searchQuery = this.value.toLowerCase(); render(); };
  toggles.appendChild(searchInput);
  toggles.appendChild(document.createElement('br'));

  var curRow = -1;
  COLS.forEach(function(col) {
    if (col.row !== curRow) {
      if (curRow !== -1) toggles.appendChild(document.createElement('br'));
      curRow = col.row;
    }
    var b = document.createElement('button');
    b.textContent = col.name;
    b.dataset.idx = col.idx;
    b.onclick = function() { vis[col.idx] = !vis[col.idx]; render(); };
    toggles.appendChild(b);
  });

  render();
});


function render() {
  rows.forEach(function(r) { r[16] = computeScore(r); });

  var filtered = rows.filter(function(r) {
    if (!searchQuery) return true;
    return r.some(function(v) { return v.toLowerCase().indexOf(searchQuery) !== -1; });
  });

  var sorted = filtered.sort(function(a, b) {
    var x = a[sortIdx] || '', y = b[sortIdx] || '';
    var xempty = !x || x === '?', yempty = !y || y === '?';
    if (xempty && !yempty) return 1;
    if (!xempty && yempty) return -1;
    if (xempty && yempty) return 0;
    if (sortIdx === 7) {
      var xei = TIME_ORDER.indexOf(x.split('/')[0]), yei = TIME_ORDER.indexOf(y.split('/')[0]);
      if (xei === -1) xei = TIME_ORDER.length;
      if (yei === -1) yei = TIME_ORDER.length;
      var res = xei !== yei ? xei - yei : x.localeCompare(y);
      return sortAsc ? res : -res;
    }
    if (sortIdx === 6) {
      var xo = PLACE_ORDER.indexOf(x.split('/')[0]), yo = PLACE_ORDER.indexOf(y.split('/')[0]);
      var res = xo !== yo ? xo - yo : x.localeCompare(y);
      return sortAsc ? res : -res;
    }
    if (sortIdx === 5) {
      var xo = STATUS_ORDER.indexOf(x), yo = STATUS_ORDER.indexOf(y);
      var res = (xo === -1 ? STATUS_ORDER.length : xo) - (yo === -1 ? STATUS_ORDER.length : yo);
      return sortAsc ? res : -res;
    }
    if (sortIdx === 8) {
      var res = topicRank(x) !== topicRank(y) ? topicRank(x) - topicRank(y) : x.localeCompare(y);
      return sortAsc ? res : -res;
    }
    var xn = parseFloat(x.replace(/[^0-9.]/g, '')), yn = parseFloat(y.replace(/[^0-9.]/g, ''));
    var n = xn - yn;
    var res = (isNaN(n) || n === 0) ? x.localeCompare(y) : n;
    return sortAsc ? res : -res;
  });

  document.querySelectorAll('#books th').forEach(function(th) {
    th.style.display = vis[+th.dataset.idx] ? '' : 'none';
  });

  if (!colWidthsLocked) {
    document.querySelectorAll('#books th').forEach(function(th) {
      th.style.width = th.offsetWidth + 'px';
    });
    document.getElementById('books').style.tableLayout = 'fixed';
    colWidthsLocked = true;
  }
  document.querySelectorAll('#toggles button').forEach(function(b) {
    b.classList.toggle('active', !!vis[+b.dataset.idx]);
  });

  var tbody = document.querySelector('#books tbody');
  tbody.innerHTML = '';
  sorted.forEach(function(r) {
    var tr = tbody.insertRow();
    if (r[COMPLETED_IDX]) tr.style.color = 'hsl(120, 40%, 55%)';
    COLS.forEach(function(col) {
      var td = tr.insertCell();
      var val = r[col.idx] || '';
      var text = displayVal(col.idx, val);
      if (col.idx === 0) {
        var a = document.createElement('a');
        var q = r[4] ? r[4] : (val + ' ' + (r[1] || ''));
        a.href = 'https://www.goodreads.com/search?q=' + encodeURIComponent(q);
        a.target = '_blank';
        a.style.cssText = 'color:inherit;text-decoration:none;';
        a.textContent = text;
        td.appendChild(a);
      } else if (col.idx === 12) {
        var a = document.createElement('a');
        var q = r[4] ? r[4] : ((r[0] || '') + ' ' + (r[1] || ''));
        a.href = 'https://www.amazon.com/s?k=' + encodeURIComponent(q);
        a.target = '_blank';
        a.style.cssText = 'color:inherit;text-decoration:none;';
        a.textContent = text;
        td.appendChild(a);
      } else {
        td.textContent = text;
      }
      td.style.display = vis[col.idx] ? '' : 'none';
      if (col.idx !== 0 && col.idx !== 1) td.style.textAlign = 'center';
      if (col.idx === 0) td.style.minWidth = '220px';
      if (col.idx === 1) td.style.maxWidth = '150px';
      var color = cellColor(col.idx, val);
      if (color) td.style.color = color;
    });
  });
}
