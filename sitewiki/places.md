
# places

<style>
  .map-controls button {
    background: none;
    border: 1px solid #444;
    color: #8c66ff;
    cursor: pointer;
    font-family: verdana, sans-serif;
    font-size: 0.85rem;
    margin: 0.2em;
    padding: 0.3em 0.7em;
  }
  .map-controls button:hover {
    border-color: #fabc2a;
    color: #fabc2a;
  }
  .map-controls button.active {
    border-color: #66d9ff;
    color: #66d9ff;
  }
</style>

<div class="map-controls">
  <button id="btn-usa" class="active" onclick="showMap('usa')">usa</button>
  <button id="btn-global" onclick="showMap('global')">global</button>
</div>

<div class="map-container" id="map-usa" data-src="static/places/usa.svg"></div>

<div class="map-container" id="map-global" data-src="static/places/global.svg" style="display:none"></div>

<script>
  function showMap(name) {
    ['usa', 'global'].forEach(function(m) {
      document.getElementById('map-' + m).style.display = m === name ? '' : 'none';
      document.getElementById('btn-' + m).classList.toggle('active', m === name);
    });
  }
</script>

<script src="js/places.js"></script>
