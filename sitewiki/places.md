
# places

<div class="map-container" data-src="static/places/usa.svg"></div>

<div class="map-container" data-src="static/places/global.svg"></div>

<script>
document.querySelectorAll('.map-container').forEach(function(c) {
  fetch(c.dataset.src).then(function(r) { return r.text(); }).then(function(html) {
    c.innerHTML = html;
    var svg = c.querySelector('svg');
    var vb = svg.viewBox.baseVal;
    var ox = vb.x, oy = vb.y, ow = vb.width, oh = vb.height;

    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.display = 'block';
    svg.style.aspectRatio = ow + ' / ' + oh;
    var cx = ox, cy = oy, cw = ow, ch = oh;

    function apply() { svg.setAttribute('viewBox', cx+' '+cy+' '+cw+' '+ch); }

    c.addEventListener('wheel', function(e) {
      e.preventDefault();
      var r = c.getBoundingClientRect();
      var mx = e.clientX - r.left, my = e.clientY - r.top;
      var svgX = cx + (mx / r.width) * cw, svgY = cy + (my / r.height) * ch;
      var factor = e.deltaY < 0 ? 1/1.1 : 1.1;
      cw = Math.min(ow, Math.max(ow/10, cw * factor));
      ch = cw * (oh / ow);
      cx = svgX - (mx / r.width) * cw;
      cy = svgY - (my / r.height) * ch;
      apply();
    }, {passive: false});

    var drag = false, sx, sy, startCx, startCy;
    c.addEventListener('mousedown', function(e) {
      e.preventDefault();
      drag = true; sx = e.clientX; sy = e.clientY; startCx = cx; startCy = cy;
      c.classList.add('dragging');
    });
    window.addEventListener('mousemove', function(e) {
      if (!drag) return;
      var r = c.getBoundingClientRect();
      cx = startCx - (e.clientX - sx) / r.width * cw;
      cy = startCy - (e.clientY - sy) / r.height * ch;
      apply();
    });
    window.addEventListener('mouseup', function() { drag = false; c.classList.remove('dragging'); });
    c.addEventListener('dblclick', function() { cx = ox; cy = oy; cw = ow; ch = oh; apply(); });
  });
});
</script>
