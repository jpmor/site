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
  {name: 'topic',    idx: 8,  vis: false, row: 3},
  {name: 'place',    idx: 6,  vis: false, row: 3},
  {name: 'time',     idx: 7,  vis: false, row: 3},
];

var COMPLETED_IDX = 9;

var STATUS_ORDER = ['Reading', 'Next', 'Soon', 'Stalled', 'Eventually', 'Tier 1', 'Tier 2', 'Tier 3', '', 'Read'];
var PLACE_ORDER  = ['america', 'europe', 'neareast', 'fareast'];
var TIME_ORDER   = ['ancient', 'classical', 'medieval', 'early', 'modern'];
var TOPIC_ORDER  = ['nature', 'humanity/engineering', 'humanity/civilization', 'humanity/society', 'fiction'];
// TSV indices: title=0 author=1 year=2 pages=3 isbn13=4 status=5 place=6 time=7 topic=8 completed=9 rated=10 library=11 price=12 added=13 rating=14 reviews=15 score=16

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
var colFilters = {};  // idx -> Set of excluded raw values (null key = exclude blanks)

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
  var t = Math.min(n, 60) / 60;
  return 'hsl(' + Math.round(120 - t * 110) + ', 60%, 65%)';
}

function reviewsColor(val) {
  var n = parseInt(val);
  if (isNaN(n)) return '';
  var t = Math.min(Math.log10(n + 1) / Math.log10(10000), 1);
  return 'hsl(' + Math.round(10 + t * 110) + ', 60%, 68%)';
}


function cellColor(idx, val) {
  if (!val) return '';
  if (idx === 10) return ratingColor(val);
  if (idx === 12) return priceColor(val);
  if (idx === 14) return ratingColor(val);
  if (idx === 15) return reviewsColor(val);
  if (idx === 16) {
    var n = parseFloat(val);
    if (isNaN(n)) return '';
    var t = Math.min(n / 15, 1);
    return 'hsl(' + Math.round(10 + t * 110) + ', 65%, 65%)';
  }
  if (idx === 11) {
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

// --- column filter menu ---

var activeMenu = null;

function closeMenu() {
  if (activeMenu) { activeMenu.remove(); activeMenu = null; }
}

function openMenu(th, colIdx) {
  closeMenu();

  // collect unique raw values for this column
  var seen = {}, vals = [];
  rows.forEach(function(r) {
    var v = r[colIdx] || '';
    if (!seen[v]) { seen[v] = true; vals.push(v); }
  });
  vals.sort();

  var excluded = colFilters[colIdx] || new Set();

  var menu = document.createElement('div');
  menu.style.cssText = 'position:absolute;z-index:1000;background:#2a2a2a;border:1px solid #555;border-radius:4px;padding:6px 0;min-width:160px;max-height:360px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,.5);font-size:0.85em;';

  // sort options
  function sortItem(label, asc) {
    var d = document.createElement('div');
    d.textContent = label;
    d.style.cssText = 'padding:5px 12px;cursor:pointer;color:#ccc;';
    d.onmouseenter = function() { d.style.background = '#3a3a3a'; };
    d.onmouseleave = function() { d.style.background = ''; };
    d.onclick = function() { sortIdx = colIdx; sortAsc = asc; closeMenu(); render(); };
    return d;
  }
  menu.appendChild(sortItem('↑ Sort ascending', true));
  menu.appendChild(sortItem('↓ Sort descending', false));

  // separator
  var sep = document.createElement('div');
  sep.style.cssText = 'border-top:1px solid #444;margin:4px 0;';
  menu.appendChild(sep);

  // select all / clear
  var actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:8px;padding:3px 12px 5px;';
  function actionBtn(label, fn) {
    var b = document.createElement('span');
    b.textContent = label;
    b.style.cssText = 'cursor:pointer;color:#888;text-decoration:underline;font-size:0.9em;';
    b.onclick = fn;
    return b;
  }
  actions.appendChild(actionBtn('all', function() {
    colFilters[colIdx] = new Set();
    rebuildChecks();
    render();
    updateHeaders();
  }));
  actions.appendChild(actionBtn('none', function() {
    colFilters[colIdx] = new Set(vals);
    rebuildChecks();
    render();
    updateHeaders();
  }));
  menu.appendChild(actions);

  // checkboxes
  var checks = [];
  function rebuildChecks() {
    excluded = colFilters[colIdx] || new Set();
    checks.forEach(function(item) {
      item.cb.checked = !excluded.has(item.val);
    });
  }

  vals.forEach(function(val) {
    var row = document.createElement('label');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:3px 12px;cursor:pointer;color:#ccc;';
    row.onmouseenter = function() { row.style.background = '#3a3a3a'; };
    row.onmouseleave = function() { row.style.background = ''; };

    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !excluded.has(val);
    cb.onchange = function() {
      if (!colFilters[colIdx]) colFilters[colIdx] = new Set();
      if (cb.checked) colFilters[colIdx].delete(val);
      else colFilters[colIdx].add(val);
      render();
      updateHeaders();
    };

    var label = document.createElement('span');
    var display = displayVal(colIdx, val) || '(blank)';
    label.textContent = display;
    var color = cellColor(colIdx, val);
    if (color) label.style.color = color;

    row.appendChild(cb);
    row.appendChild(label);
    menu.appendChild(row);
    checks.push({cb: cb, val: val});
  });

  // position below the th
  var rect = th.getBoundingClientRect();
  menu.style.top = (rect.bottom + window.scrollY) + 'px';
  menu.style.left = (rect.left + window.scrollX) + 'px';
  document.body.appendChild(menu);
  activeMenu = menu;
}

function updateHeaders() {
  document.querySelectorAll('#books th').forEach(function(th) {
    var idx = +th.dataset.idx;
    var hasFilter = colFilters[idx] && colFilters[idx].size > 0;
    th.style.color = hasFilter ? 'hsl(40, 90%, 65%)' : '';
  });
}

document.addEventListener('click', function(e) {
  if (activeMenu && !activeMenu.contains(e.target) && !e.target.closest('#books thead')) {
    closeMenu();
  }
});

// --- end menu ---

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
    th.onclick = function(e) {
      e.stopPropagation();
      if (activeMenu) { closeMenu(); return; }
      openMenu(th, col.idx);
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
  var filtered = rows.filter(function(r) {
    if (searchQuery && !r.some(function(v) { return v.toLowerCase().indexOf(searchQuery) !== -1; })) return false;
    for (var idx in colFilters) {
      var excluded = colFilters[idx];
      if (!excluded || excluded.size === 0) continue;
      if (excluded.has(r[+idx] || '')) return false;
    }
    return true;
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
        a.href = r[4]
          ? 'https://www.goodreads.com/book/isbn/' + encodeURIComponent(r[4])
          : 'https://www.goodreads.com/search?q=' + encodeURIComponent(val + ' ' + (r[1] || ''));
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
