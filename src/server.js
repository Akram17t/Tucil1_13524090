var express = require('express');
var path = require('path');
var spawn = require('child_process').spawn;

var app = express();

app.use(express.static(__dirname));
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== FUNGSI HELPER ====================
function parseGridInput(rawGrid) {
  var grid = String(rawGrid || '').trim();
  if (!grid) return { ok: false, error: 'Input grid kosong' };
  var lines = grid.split(/\r?\n/);
  var rows = [];
  for (var i = 0; i < lines.length; i++) {
    var t = lines[i].trim();
    if (t) rows.push(t);
  }
  var n = rows.length;
  if (n === 0) return { ok: false, error: 'Grid harus NxN' };
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].length !== n) return { ok: false, error: 'Grid harus NxN' };
  }
  return { ok: true, rows: rows, n: n };
}

function parseSolverOutput(output, n) {
  var lines = output.split(/\r?\n/).filter(function(l) { return l.trim(); });
  var timeMs = 0, cases = 0, noSolution = false, solutionRows = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line.indexOf('Waktu pencarian:') !== -1) {
      var m = line.match(/\d+/);
      if (m) timeMs = Number(m[0]);
    }
    if (line.indexOf('Banyak kasus yang ditinjau:') !== -1) {
      var m = line.match(/\d+/);
      if (m) cases = Number(m[0]);
    }
    if (line.indexOf('Tidak Ada Solusi') !== -1) noSolution = true;
    if (line.length === n && /^[A-Z#]+$/.test(line) && solutionRows.length < n) {
      solutionRows.push(line);
    }
  }
  return { found: !noSolution && solutionRows.length === n, rows: solutionRows, timeMs: timeMs, cases: cases };
}

function processLine(line, state, send) {
  if (line.indexOf('ITER:') === 0) {
    var rest = line.slice(5);
    var idx = rest.indexOf(':');
    if (idx !== -1) {
      var cases = Number(rest.slice(0, idx));
      var rows = rest.slice(idx + 1).split('|');
      state.lastCases = cases;
      send({ type: 'snapshot', rows: rows, cases: cases });
    }
  }
}


app.get('/solve-live', function(req, res) {
  req.socket.setNoDelay(true);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(': connected\n\n');

  function send(payload) {
    res.write('data: ' + JSON.stringify(payload) + '\n\n');
    if (typeof res.flush === 'function') res.flush();
  }

  var parsed = parseGridInput(req.query.grid);
  if (!parsed.ok) { send({ type: 'error', error: parsed.error }); res.end(); return; }

  var proc = spawn(path.join(__dirname, '..', 'bin', 'main.exe'), [], { windowsHide: true });
  proc.stdin.end(parsed.rows.join('\n'));

  var stdout = '', stderrBuf = '';
  var state = { lastCases: 0 };

  proc.stdout.on('data', function(d) { stdout += d.toString(); });

  proc.stderr.on('data', function(d) {
    stderrBuf += d.toString();
    var parts = stderrBuf.split(/\r?\n/);
    stderrBuf = parts.pop() || '';
    for (var i = 0; i < parts.length; i++) {
      var msg = parts[i].trim();
      if (msg) processLine(msg, state, send);
    }
  });

  proc.on('error', function() { send({ type: 'error', error: 'main.exe tidak bisa dijalankan' }); res.end(); });

  proc.on('close', function() {
    var tail = stderrBuf.trim();
    if (tail) processLine(tail, state, send);
    var result = parseSolverOutput(stdout, parsed.n);
    send({ type: 'done', found: result.found, rows: result.rows, timeMs: result.timeMs, cases: result.cases });
    res.end();
  });

  req.on('close', function() { if (!proc.killed) proc.kill(); });
});

app.listen(3000, function() { console.log('Server berjalan di http://localhost:3000'); });
