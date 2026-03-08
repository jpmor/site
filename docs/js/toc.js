document.addEventListener('DOMContentLoaded', function() {
  var seen = {}, links = [];
  document.querySelectorAll('h2').forEach(function(h) {
    var m = h.textContent.match(/\b(\d{4})\b/);
    if (!m) return;
    var year = m[1];
    if (seen[year]) return;
    seen[year] = true;
    links.push({year: year, id: h.id});
  });
  if (!links.length) return;
  var nav = document.createElement('nav');
  links.forEach(function(l) {
    var a = document.createElement('a');
    a.href = '#' + l.id;
    a.textContent = l.year;
    nav.appendChild(a);
  });
  var h1 = document.querySelector('h1');
  if (h1) h1.insertAdjacentElement('afterend', nav);
});
