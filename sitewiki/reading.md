# reading

<div id="toggles"></div>
<div id="count"></div>
<div class="table-wrap"><table id="books"></table></div>

<script>
var COLS = [
  {name: 'title',    idx: 0},
  {name: 'author',   idx: 5},
  {name: 'rating',   idx: 11},
  {name: 'year',     idx: 8},
  {name: 'pages',    idx: 7},
  {name: 'isbn13',   idx: 13},
  {name: 'interest', idx: 1},
  {name: 'place',    idx: 2},
  {name: 'time',     idx: 3},
  {name: 'system',   idx: 4},
  {name: 'read',     idx: 10},
];
var COLOR_IDX = {1: true, 2: true, 3: true, 4: true};
var vis = {0: true, 5: true, 8: false, 7: false, 13: false, 1: true, 2: true, 3: true, 4: true, 10: false, 11: false};
var sortIdx = 0, sortAsc = true, rows = [];

function hue(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return h % 360;
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
    COLS.forEach(function(col) {
      var td = tr.insertCell();
      var val = r[col.idx] || '';
      td.textContent = val;
      td.style.display = vis[col.idx] ? '' : 'none';
      if (col.idx !== 0 && col.idx !== 5) td.style.textAlign = 'center';
      if (val && COLOR_IDX[col.idx]) {
        td.style.backgroundColor = 'hsl(' + hue(val) + ', 50%, 28%)';
        td.style.borderRadius = '3px';
        td.style.padding = '0.15em 0.4em';
      }
    });
  });
}
</script>
