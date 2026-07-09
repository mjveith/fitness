process.env.TZ = 'UTC';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const base = path.join(projectRoot, request.slice(2));
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, path.join(base, 'index.ts')];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = function compileTs(module, filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        resolveJsonModule: true
      },
      fileName: filename
    });

    module._compile(output.outputText, filename);
  };
}

const { formatDate, getWeekStart } = require(path.join(projectRoot, 'lib/date.ts'));

test('formatDate preserves UTC calendar dates when local timezone is UTC', () => {
  assert.equal(formatDate(new Date('2026-05-12T23:30:00Z')), '2026-05-12');
  assert.equal(formatDate(new Date('2026-05-13T00:30:00Z')), '2026-05-13');
});

test('getWeekStart and formatDate round-trip UTC week starts for every configured weekStartDay', () => {
  const input = new Date('2026-05-14T23:30:00Z');
  const expectedByWeekStartDay = {
    0: '2026-05-10',
    1: '2026-05-11',
    2: '2026-05-12',
    3: '2026-05-13',
    4: '2026-05-14',
    5: '2026-05-08',
    6: '2026-05-09'
  };

  for (const [weekStartDay, expectedDate] of Object.entries(expectedByWeekStartDay)) {
    const weekStart = getWeekStart(input, Number(weekStartDay));
    assert.equal(formatDate(weekStart), expectedDate, `weekStartDay ${weekStartDay}`);
    assert.equal(weekStart.getHours(), 0, `weekStartDay ${weekStartDay} hour`);
    assert.equal(weekStart.getMinutes(), 0, `weekStartDay ${weekStartDay} minute`);
  }
});
