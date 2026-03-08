document.addEventListener('DOMContentLoaded', function() {
  var nav = document.getElementById('toc');
  document.querySelectorAll('h2').forEach(function(h) {
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    nav.appendChild(a);
  });
});
