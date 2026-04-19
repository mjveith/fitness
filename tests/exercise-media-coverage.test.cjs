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
    const candidates = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.json`,
      path.join(base, 'index.ts')
    ];

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
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        resolveJsonModule: true
      },
      fileName: filename
    });

    module._compile(output.outputText, filename);
  };
}

const { exerciseCatalog } = require(path.join(projectRoot, 'lib/exercise-catalog.ts'));
const { exerciseImageMap } = require(path.join(projectRoot, 'lib/exercise-image-map.ts'));

async function getStatus(url) {
  const tryRequest = async (method) => {
    const response = await fetch(url, {
      method,
      redirect: 'follow',
      headers: { 'user-agent': 'OpenClaw-Fitness-Media-Test/1.0' }
    });
    return response.status;
  };

  try {
    return await tryRequest('HEAD');
  } catch {
    return await tryRequest('GET');
  }
}

test('every catalog exercise has a real-life image pair mapped', () => {
  const missing = exerciseCatalog
    .filter((exercise) => !exercise.imageUrls || !exercise.imageUrls[0] || !exercise.imageUrls[1])
    .map((exercise) => `${exercise.id} (${exercise.name})`);

  assert.deepEqual(missing, []);
});

test('mapped media uses non-SVG real-life assets only', () => {
  const svgMappings = Object.entries(exerciseImageMap)
    .flatMap(([exerciseId, urls]) => urls.map((url) => ({ exerciseId, url })))
    .filter(({ url }) => /\.svg(?:$|\?)/i.test(url));

  assert.deepEqual(svgMappings, []);
});

test('mapped media URLs are reachable', async () => {
  const checks = [];

  for (const [exerciseId, urls] of Object.entries(exerciseImageMap)) {
    for (const url of urls) {
      checks.push({ exerciseId, url });
    }
  }

  const bad = [];
  const concurrency = 8;
  let index = 0;

  async function worker() {
    while (index < checks.length) {
      const current = checks[index++];
      const status = await getStatus(current.url);

      if (status !== 200) {
        bad.push({ ...current, status });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  assert.deepEqual(bad, []);
});
