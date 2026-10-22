import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const metrics = ['statements', 'branches', 'functions', 'lines'];
const floors = {
  layouts: { ...Object.fromEntries(metrics.map((metric) => [metric, 70])), zeroTotalMetrics: [] },
  'sam-layouts': { ...Object.fromEntries(metrics.map((metric) => [metric, 100])), zeroTotalMetrics: [] },
};
const summary = (pct = 100) => ({
  total: Object.fromEntries(
    metrics.map((metric) => [metric, { total: 10, covered: pct === 100 ? 10 : 6, skipped: 0, pct }]),
  ),
});
const hash = (value) => createHash('sha256').update(value).digest('hex');

async function run(setup = () => {}) {
  const dir = await mkdtemp(join(tmpdir(), 'coverage-gate-'));
  await mkdir(join(dir, 'coverage/layouts'), { recursive: true });
  await mkdir(join(dir, 'coverage/sam-layouts'), { recursive: true });
  await cp('scripts/check-coverage.mjs', join(dir, 'check.mjs'));
  await cp('scripts/coverage-scope.mjs', join(dir, 'coverage-scope.mjs'));
  await mkdir(join(dir, 'node_modules'), { recursive: true });
  await cp(join(process.cwd(), 'node_modules/typescript'), join(dir, 'node_modules/typescript'), { recursive: true });
  await writeFile(join(dir, 'input.ts'), 'export const input = 1;');
  await mkdir(join(dir, 'sam-layouts/src'), { recursive: true });
  await mkdir(join(dir, 'apps/sam-layouts/src'), { recursive: true });
  await writeFile(join(dir, 'sam-layouts/src/input.ts'), 'export const input = 1;');
  await writeFile(join(dir, 'apps/sam-layouts/src/input.ts'), 'export const input = 1;');
  await writeFile(join(dir, 'coverage-thresholds.json'), JSON.stringify(floors));
  const reports = {};
  for (const [project, count] of [
    ['layouts', 26],
    ['sam-layouts', 3],
  ]) {
    const reportPath = `tmp/coverage/${project}-tests.json`;
    const reportFile = join(dir, reportPath);
    reports[project] = reportPath;
    await mkdir(join(dir, 'tmp/coverage'), { recursive: true });
    await writeFile(
      reportFile,
      JSON.stringify({
        numTotalTests: count,
        numPassedTests: count,
        numFailedTests: 0,
        numPendingTests: 0,
        testResults: [{ assertionResults: Array.from({ length: count }, () => ({ status: 'passed' })) }],
      }),
    );
    await writeFile(join(dir, `coverage/${project}/coverage-summary.json`), JSON.stringify(summary()));
    await writeFile(
      join(dir, `coverage/${project}/lcov.info`),
      `SF:${project === 'layouts' ? 'sam-layouts/src/input.ts' : 'apps/sam-layouts/src/input.ts'}\nDA:1,1\nend_of_record\n`,
    );
  }
  await exec('git', ['init', '-q'], { cwd: dir });
  await exec('git', ['add', '.'], { cwd: dir });
  const fingerprint = await fingerprintFor(dir);
  const startedAt = new Date(Date.now() - 100000).toISOString();
  const completedAt = new Date(Date.now() + 100000).toISOString();
  const evidence = [];
  for (const [project, report] of Object.entries(reports)) {
    const count = project === 'layouts' ? 26 : 3;
    evidence.push({
      project,
      numTotalTests: count,
      numPassedTests: count,
      numFailedTests: 0,
      numPendingTests: 0,
      report,
      reportHash: hash(await (await import('node:fs/promises')).readFile(join(dir, report))),
      summaryHash: hash(
        await (await import('node:fs/promises')).readFile(join(dir, `coverage/${project}/coverage-summary.json`)),
      ),
      lcovHash: hash(
        await (await import('node:fs/promises')).readFile(join(dir, `coverage/${project}/lcov.info`)),
      ),
    });
  }
  await writeFile(
    join(dir, 'coverage/.coverage-run.json'),
    JSON.stringify({
      runId: 'test',
      startedAt,
      completedAt,
      success: true,
      fingerprint,
      sourceManifest: ['apps/sam-layouts/src/input.ts', 'sam-layouts/src/input.ts'],
      projects: [
        { name: 'layouts', tests: 26 },
        { name: 'sam-layouts', tests: 3 },
      ],
      evidence,
    }),
  );
  await setup(dir);
  const result = await new Promise((resolve) => {
    const child = spawn(process.execPath, ['check.mjs'], { cwd: dir });
    let output = '';
    child.stderr.on('data', (data) => {
      output += data;
    });
    child.on('close', (code) => resolve({ code, output }));
  });
  await rm(dir, { recursive: true, force: true });
  return result;
}
async function fingerprintFor(dir) {
  const { stdout } = await exec('git', ['ls-files', '-z'], { cwd: dir });
  const files = stdout
    .split('\0')
    .filter(
      (file) =>
        file &&
        file !== 'coverage-thresholds.json' &&
        file !== 'coverage/.coverage-run.json' &&
        !file.startsWith('coverage/'),
    );
  const parts = await Promise.all(
    files.map(async (file) => `${file}\0${hash(await (await import('node:fs/promises')).readFile(join(dir, file)))}`),
  );
  return hash(parts.join('\0'));
}

test('passes valid independent floors', async () => {
  const result = await run();
  assert.equal(result.code, 0, result.output);
});
for (const metric of metrics)
  test(`rejects ${metric} regression`, async () =>
    assert.equal(
      (
        await run(async (dir) => {
          const value = summary(60);
          await writeFile(join(dir, 'coverage/layouts/coverage-summary.json'), JSON.stringify(value));
        })
      ).code,
      1,
    ));
test('rejects mismatched and unsorted source manifests', async () => {
  for (const manifest of [
    ['apps/sam-layouts/src/input.ts'],
    ['sam-layouts/src/input.ts', 'apps/sam-layouts/src/input.ts'],
  ]) {
    const result = await run(async (dir) => {
      const markerPath = join(dir, 'coverage/.coverage-run.json');
      const marker = JSON.parse(await (await import('node:fs/promises')).readFile(markerPath, 'utf8'));
      marker.sourceManifest = manifest;
      await writeFile(markerPath, JSON.stringify(marker));
    });
    assert.equal(result.code, 1);
  }
});
test('rejects arbitrary report paths', async () => {
  const result = await run(async (dir) => {
    const markerPath = join(dir, 'coverage/.coverage-run.json');
    const marker = JSON.parse(await (await import('node:fs/promises')).readFile(markerPath, 'utf8'));
    marker.evidence[0].report = 'arbitrary.json';
    await writeFile(markerPath, JSON.stringify(marker));
  });
  assert.equal(result.code, 1);
});
test('rejects changed and stale lcov evidence', async () => {
  for (const setup of [
    async (dir) => {
      await writeFile(join(dir, 'coverage/layouts/lcov.info'), 'changed');
    },
    async (dir) => {
      const old = new Date(Date.now() - 200_000);
      const { utimes } = await import('node:fs/promises');
      await utimes(join(dir, 'coverage/layouts/lcov.info'), old, old);
    },
  ]) {
    const result = await run(setup);
    assert.equal(result.code, 1);
  }
});
test('rejects malformed types and inconsistent counts', async () =>
  assert.equal(
    (
      await run(async (dir) => {
        const value = summary();
        value.total.statements.covered = '10';
        await writeFile(join(dir, 'coverage/layouts/coverage-summary.json'), JSON.stringify(value));
      })
    ).code,
    1,
  ));
test('rejects stale marker, changed source, missing report, and stale timestamps', async () => {
  assert.equal(
    (
      await run(async (dir) => {
        await writeFile(join(dir, 'input.ts'), 'changed');
      })
    ).code,
    1,
  );
  assert.equal(
    (
      await run(async (dir) => {
        await rm(join(dir, 'tmp/coverage/layouts-tests.json'));
      })
    ).code,
    1,
  );
  assert.equal(
    (
      await run(async (dir) => {
        const old = new Date(Date.now() - 200_000);
        const { utimes } = await import('node:fs/promises');
        await utimes(join(dir, 'coverage/layouts/coverage-summary.json'), old, old);
      })
    ).code,
    1,
  );
});
test('rejects no tests, skips, failures, and inconsistent evidence', async () =>
  assert.equal(
    (
      await run(async (dir) => {
        const report = JSON.parse(
          await (await import('node:fs/promises')).readFile(join(dir, 'tmp/coverage/layouts-tests.json'), 'utf8'),
        );
        report.numPassedTests = 24;
        await writeFile(join(dir, 'tmp/coverage/layouts-tests.json'), JSON.stringify(report));
      })
    ).code,
    1,
  ));
test('rejects undeclared zero and empty instrumentation', async () =>
  assert.equal(
    (
      await run(async (dir) => {
        const value = summary();
        value.total.branches = { total: 0, covered: 0, skipped: 0, pct: 100 };
        await writeFile(join(dir, 'coverage/layouts/coverage-summary.json'), JSON.stringify(value));
      })
    ).code,
    1,
  ));
test('rejects floor bumps that are stale or lower', async () =>
  assert.equal(
    (
      await run(async (dir) => {
        await writeFile(
          join(dir, 'coverage-thresholds.json'),
          JSON.stringify({ ...floors, layouts: { ...floors.layouts, statements: 101 } }),
        );
      })
    ).code,
    1,
  ));
