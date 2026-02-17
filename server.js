var express = require('express');
var path = require('path');
var spawn = require('child_process').spawn;

var app = express();

// Serve file statis (index.html, gambar, dll) dari folder ini
app.use(express.static(__dirname));

// ==================== FUNGSI HELPER ====================

function parseGridInput(rawGrid) {
  var grid = String(rawGrid || '').trim();
  if (!grid) return { ok: false, error: 'Input grid kosong' };

  var lines = grid.split(/\r?\n/);
  var rows = [];
  for (var i = 0; i < lines.length; i++) {
    var trimmed = lines[i].trim();
    if (trimmed !== '') rows.push(trimmed);
  }

  var n = rows.length;
  if (n === 0) return { ok: false, error: 'Grid harus NxN' };

  for (var i = 0; i < rows.length; i++) {
    if (rows[i].length !== n) return { ok: false, error: 'Grid harus NxN' };
  }

  return { ok: true, rows: rows, n: n };
}

function parseSolverOutput(output, n) {
  var lines = output.split(/\r?\n/);
  var cleanLines = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trimRight();
    if (line !== '') cleanLines.push(line);
  }

  var timeMs = 0;
  for (var i = 0; i < cleanLines.length; i++) {
    if (cleanLines[i].indexOf('Waktu pencarian:') !== -1) {
      var match = cleanLines[i].match(/\d+/);
      if (match) timeMs = Number(match[0]);
      break;
    }
  }

  var cases = 0;
  for (var i = 0; i < cleanLines.length; i++) {
    if (cleanLines[i].indexOf('Banyak kasus yang ditinjau:') !== -1) {
      var match = cleanLines[i].match(/\d+/);
      if (match) cases = Number(match[0]);
      break;
    }
  }

  var noSolution = false;
  for (var i = 0; i < cleanLines.length; i++) {
    if (cleanLines[i].indexOf('Tidak Ada Solusi') !== -1) {
      noSolution = true;
      break;
    }
  }

  var solutionRows = [];
  for (var i = 0; i < cleanLines.length; i++) {
    if (cleanLines[i].length === n && /^[A-Z#]+$/.test(cleanLines[i])) {
      solutionRows.push(cleanLines[i]);
      if (solutionRows.length >= n) break;
    }
  }

  var found = !noSolution && solutionRows.length === n;
  return { found: found, rows: solutionRows, timeMs: timeMs, cases: cases };
}

function processLine(line, state, send) {
  if (line.indexOf('TOTAL:') === 0) {
    send({ type: 'total', total: Number(line.slice(6)) });

  } else if (line.indexOf('SNAP:') === 0) {
    state.lastSnap = line.slice(5).split('|');

  } else if (line.indexOf('REASON:') === 0) {
    var parts = line.slice(7).split(',');
    var nums = [];
    for (var i = 0; i < parts.length; i++) {
      nums.push(Number(parts[i]));
    }
    var err = [];
    if (nums.length >= 4) {
      err = [[nums[0], nums[1]], [nums[2], nums[3]]];
    }
    send({ type: 'snapshot', rows: state.lastSnap || [], cases: state.lastCases, err: err });

  } else {
    var match = line.match(/(\d+)/);
    if (match) state.lastCases = Number(match[1]);
    send({ type: 'progress', cases: state.lastCases });
  }
}

// ==================== ROUTE SSE ====================

app.get('/solve-live', function (req, res) {
  // Set header untuk Server-Sent Events
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  function send(payload) {
    res.write('data: ' + JSON.stringify(payload) + '\n\n');
  }

  // Parse input grid dari query string
  var rawGrid = req.query.grid;
  var parsed = parseGridInput(rawGrid);
  if (!parsed.ok) {
    send({ type: 'error', error: parsed.error });
    res.end();
    return;
  }

  var rows = parsed.rows;
  var n = parsed.n;

  // Jalankan solver C++
  var exe = path.join(__dirname, 'output', 'main.exe');
  var proc = spawn(exe, [], { windowsHide: true });
  proc.stdin.end(rows.join('\n'));

  var stdout = '';
  var stderrBuf = '';
  var state = { lastCases: 0, lastSnap: null };

  proc.stdout.on('data', function (d) {
    stdout += d.toString();
  });

  proc.stderr.on('data', function (d) {
    stderrBuf += d.toString();
    var parts = stderrBuf.split(/\r?\n/);
    stderrBuf = parts.pop() || '';
    for (var i = 0; i < parts.length; i++) {
      var msg = parts[i].trim();
      if (msg) processLine(msg, state, send);
    }
  });

  proc.on('error', function () {
    send({ type: 'error', error: 'main.exe tidak bisa dijalankan' });
    res.end();
  });

  proc.on('close', function () {
    var tail = stderrBuf.trim();
    if (tail) processLine(tail, state, send);

    var result = parseSolverOutput(stdout, n);
    send({
      type: 'done',
      found: result.found,
      rows: result.rows,
      timeMs: result.timeMs,
      cases: result.cases
    });
    res.end();
  });

  // Kalau client disconnect, kill solver
  req.on('close', function () {
    if (!proc.killed) proc.kill();
  });
});

// ==================== START SERVER ====================

app.listen(3000, function () {
  console.log('Server: http://localhost:3000');
});
