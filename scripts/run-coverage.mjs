#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = process.cwd();
const markerPath = `${root}/coverage/.coverage-run.json`;
const projects = [
  {
    name: 'layouts',
    minimumTests: 25,
    report: 'tmp/coverage/layouts-tests.json',
    summary: 'coverage/layouts/coverage-summary.json',
  },
  {
    name: 'sam-layouts',
    minimumTests: 2,
    report: 'tmp/coverage/sam-layouts-tests.json',
    summary: 'coverage/sam-layouts/coverage-summary.json',
  },
];
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const inputFiles = async () => {
  const files = (
    await new Promise((resolve, reject) =>
      execFile('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: root }, (error, stdout) =>
        error ? reject(error) : resolve(stdout),
      ),
    )
  )
    .split('\0')
    .filter(Boolean)
    .filter(
      (file) =>
        file !== 'coverage-thresholds.json' && file !== 'coverage/.coverage-run.json' && !file.startsWith('coverage/'),
    );
  return files;
};
const fingerprint = async () => {
  const files = await inputFiles();
  const contents = await Promise.all(
    files.map(async (file) => `${file}\0${sha256(await readFile(`${root}/${file}`))}`),
  );
  return sha256(contents.join('\0'));
};
const startedAt = new Date().toISOString();
const runId = randomUUID();
await rm(`${root}/coverage`, { recursive: true, force: true });
await rm(`${root}/tmp/coverage`, { recursive: true, force: true });
await mkdir(`${root}/tmp/coverage`, { recursive: true });
await mkdir(`${root}/coverage`, { recursive: true });
const marker = {
  runId,
  startedAt,
  fingerprint: await fingerprint(),
  sourceManifest: (await inputFiles()).filter(
    (file) =>
      /^(sam-layouts|apps\/sam-layouts)\/src\/.*\.ts$/.test(file) &&
      !/(^|\/)([^/]+\.)?(spec|test)\.ts$/.test(file) &&
      !file.endsWith('.d.ts'),
  ),
  projects: projects.map(({ name, minimumTests }) => ({ name, tests: minimumTests })),
};
await writeFile(markerPath, `${JSON.stringify(marker, null, 2)}\n`);
const evidence = [];
for (const project of projects) {
  const args = [
    'nx',
    'test',
    project.name,
    '--coverage',
    '--watch=false',
    '--skip-nx-cache',
    '--reporters=json',
    '--outputFile',
    project.report,
  ];
  try {
    const result = await exec('npx', args, {
      cwd: root,
      env: { ...process.env, NX_DAEMON: 'false' },
      maxBuffer: 20 * 1024 * 1024,
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  } catch (error) {
    if (error.stdout) process.stdout.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    console.error(`coverage: ${project.name} exited with status ${error.status ?? error.code ?? 1}`);
    process.exitCode = typeof error.status === 'number' ? error.status : 1;
    process.exit();
  }
  const reportPath = `${root}/${project.report}`;
  if (!(await exists(reportPath))) {
    console.error(`coverage: missing test report ${project.report}`);
    process.exitCode = 1;
    process.exit();
  }
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  const resultTests = Array.isArray(report.testResults) ? report.testResults : [];
  const assertions = resultTests.flatMap((result) => result.assertionResults ?? []);
  const statuses = assertions.map((assertion) => assertion.status);
  const counts = {
    total: report.numTotalTests,
    passed: report.numPassedTests,
    failed: report.numFailedTests,
    pending: report.numPendingTests,
  };
  if (
    !Object.values(counts).every(Number.isInteger) ||
    counts.total !== counts.passed + counts.failed + counts.pending ||
    counts.total !== assertions.length ||
    statuses.some((status) => status !== 'passed')
  ) {
    console.error(`coverage: invalid or unsuccessful test diagnostics for ${project.name}`);
    process.exitCode = 1;
    process.exit();
  }
  evidence.push({
    project: project.name,
    numTotalTests: counts.total,
    numPassedTests: counts.passed,
    numFailedTests: counts.failed,
    numPendingTests: counts.pending,
    report: project.report,
    reportHash: sha256(await readFile(reportPath)),
    summaryHash: sha256(await readFile(`${root}/${project.summary}`)),
  });
}
const completedAt = new Date().toISOString();
await writeFile(markerPath, `${JSON.stringify({ ...marker, completedAt, success: true, evidence }, null, 2)}\n`);
const result = await exec(process.execPath, ['scripts/check-coverage.mjs'], {
  cwd: root,
  env: { ...process.env, NX_DAEMON: 'false' },
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = 0;

function exists(path) {
  return stat(path).then(
    () => true,
    () => false,
  );
}
