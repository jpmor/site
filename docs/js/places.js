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

    function zoomAt(mx, my, factor) {
      var r = c.getBoundingClientRect();
      var svgX = cx + (mx / r.width) * cw, svgY = cy + (my / r.height) * ch;
      cw = Math.min(ow, Math.max(ow/10, cw * factor));
      ch = cw * (oh / ow);
      cx = svgX - (mx / r.width) * cw;
      cy = svgY - (my / r.height) * ch;
      apply();
    }

    c.addEventListener('wheel', function(e) {
      e.preventDefault();
      var r = c.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1/1.1 : 1.1);
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

    var t0 = null, pinchDist = null;
    c.addEventListener('touchstart', function(e) {
      e.preventDefault();
      if (e.touches.length === 1) {
        t0 = e.touches[0];
        startCx = cx; startCy = cy;
      } else if (e.touches.length === 2) {
        t0 = null;
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchDist = Math.sqrt(dx*dx + dy*dy);
      }
    }, {passive: false});

    c.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var r = c.getBoundingClientRect();
      if (e.touches.length === 1 && t0) {
        cx = startCx - (e.touches[0].clientX - t0.clientX) / r.width * cw;
        cy = startCy - (e.touches[0].clientY - t0.clientY) / r.height * ch;
        apply();
      } else if (e.touches.length === 2 && pinchDist) {
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        var dist = Math.sqrt(dx*dx + dy*dy);
        var mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
        var my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
        zoomAt(mx, my, pinchDist / dist);
        pinchDist = dist;
      }
    }, {passive: false});

    c.addEventListener('touchend', function() { t0 = null; pinchDist = null; });
  });
});
