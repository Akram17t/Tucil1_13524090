var crownImage = 'png-clipart-crown-silhouette-crown-logo-silhouette.png';
var eventSource = null;
var currentSolution = null;
var currentTimeMs = 0;
var currentCases = 0;
var originalGrid = null;

function getColor(huruf, i, j) {
  var ch = (huruf === '#' && originalGrid && originalGrid[i]) ? originalGrid[i][j] : huruf;
  return (ch.charCodeAt(0) * 37) % 360;
}

function gambarPapan(rows) {
  var n = rows.length;
  var html = '';
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      var h = rows[i][j];
      var bg = 'hsl(' + getColor(h, i, j) + ' 55% 78%)';
      html += '<div class="cell" style="background:' + bg + '">';
      html += h === '#' ? '<img src="' + crownImage + '">' : h;
      html += '</div>';
    }
  }
  document.getElementById('board').innerHTML = '<div class="grid" style="grid-template-columns: repeat(' + n + ', 48px)">' + html + '</div>';
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  var c = (1 - Math.abs(2 * l - 1)) * s;
  var x = c * (1 - Math.abs((h / 60) % 2 - 1));
  var m = l - c / 2;
  var r, g, b;
  if (h < 60) { r=c; g=x; b=0; }
  else if (h < 120) { r=x; g=c; b=0; }
  else if (h < 180) { r=0; g=c; b=x; }
  else if (h < 240) { r=0; g=x; b=c; }
  else if (h < 300) { r=x; g=0; b=c; }
  else { r=c; g=0; b=x; }
  return [Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255)];
}

function renderToCanvas(rows, cellSize) {
  return new Promise(function(resolve) {
    var n = rows.length;
    var canvas = document.createElement('canvas');
    canvas.width = n * cellSize;
    canvas.height = n * cellSize;
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.onload = function() {
      for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
          var h = rows[i][j];
          var hue = getColor(h, i, j);
          var rgb = hslToRgb(hue, 55, 78);
          ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
          ctx.strokeStyle = '#333';
          ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
          if (h === '#') {
            var pad = cellSize * 0.15;
            ctx.drawImage(img, j * cellSize + pad, i * cellSize + pad, cellSize - pad * 2, cellSize - pad * 2);
          } else {
            ctx.fillStyle = '#000';
            ctx.font = 'bold ' + Math.round(cellSize * 0.4) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(h, j * cellSize + cellSize / 2, i * cellSize + cellSize / 2);
          }
        }
      }
      resolve(canvas);
    };
    img.src = crownImage;
  });
}

document.getElementById('fileInput').onchange = function(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(evt) { document.getElementById('input').value = evt.target.result; };
  reader.readAsText(file);
};

document.getElementById('downloadTxt').onclick = function() {
  if (!currentSolution) return;
  var content = currentSolution.join('\n');
  content += '\n\nWaktu pencarian: ' + currentTimeMs + ' ms';
  content += '\nBanyak kasus yang ditinjau: ' + currentCases + ' kasus';
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  a.download = 'solution.txt';
  a.click();
};

document.getElementById('downloadImg').onclick = function() {
  if (!currentSolution) return;
  renderToCanvas(currentSolution, 80).then(function(canvas) {
    canvas.toBlob(function(blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'solution.png';
      a.click();
    });
  });
};

document.getElementById('solveBtn').onclick = function() {
  document.getElementById('error').textContent = '';
  document.getElementById('meta').textContent = '';
  document.getElementById('iter').textContent = '';
  document.getElementById('boardStatus').textContent = '';
  document.getElementById('downloadTxt').style.display = 'none';
  document.getElementById('downloadImg').style.display = 'none';
  currentSolution = null;

  var lines = document.getElementById('input').value.split('\n');
  var rows = [];
  for (var i = 0; i < lines.length; i++) {
    var b = lines[i].trim();
    if (b) rows.push(b);
  }
  var n = rows.length;
  if (n === 0) { document.getElementById('error').textContent = 'Input grid kosong'; return; }
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].length !== n) { document.getElementById('error').textContent = 'Grid harus NxN'; return; }
  }

  originalGrid = rows.slice();
  if (eventSource) eventSource.close();
  document.getElementById('solveBtn').disabled = true;
  document.getElementById('boardStatus').textContent = 'Solving...';
  gambarPapan(rows);

  eventSource = new EventSource('/solve-live?grid=' + encodeURIComponent(rows.join('\n')));
  var selesai = false;

  eventSource.onmessage = function(e) {
    var data = JSON.parse(e.data);

    if (data.type === 'snapshot') {
      gambarPapan(data.rows);
      document.getElementById('iter').textContent = 'Iterasi: ' + data.cases;
      document.getElementById('boardStatus').textContent = 'Iterasi ke-' + data.cases + '...';
    }

    if (data.type === 'error') {
      document.getElementById('error').textContent = data.error;
      document.getElementById('boardStatus').textContent = '';
      document.getElementById('solveBtn').disabled = false;
      eventSource.close();
      eventSource = null;
    }

    if (data.type === 'done') {
      selesai = true;
      if (data.found) {
        gambarPapan(data.rows);
        currentSolution = data.rows;
        currentTimeMs = data.timeMs;
        currentCases = data.cases;
        document.getElementById('boardStatus').textContent = 'Solusi ditemukan!';
        document.getElementById('downloadTxt').style.display = 'inline-block';
        document.getElementById('downloadImg').style.display = 'inline-block';
      } else {
        document.getElementById('board').textContent = 'Tidak Ada Solusi Yang Memenuhi';
        document.getElementById('boardStatus').textContent = 'Tidak ada solusi.';
      }
      document.getElementById('iter').textContent = 'Iterasi: ' + data.cases;
      document.getElementById('meta').textContent = 'Waktu: ' + data.timeMs + ' ms | Kasus ditinjau: ' + data.cases;
      document.getElementById('solveBtn').disabled = false;
      eventSource.close();
      eventSource = null;
    }
  };

  eventSource.onerror = function() {
    if (!selesai) {
      document.getElementById('error').textContent = 'Koneksi ke server terputus';
      document.getElementById('boardStatus').textContent = '';
    }
    document.getElementById('solveBtn').disabled = false;
    if (eventSource) { eventSource.close(); eventSource = null; }
  };
};
