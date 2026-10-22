#!/usr/bin/env node
/** Enforce checked-in per-project Vitest coverage floors and run evidence. */
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { productionSource, trackedInputFiles } from './coverage-scope.mjs';

const [, , command = 'check'] = process.argv;
const metrics = ['statements', 'branches', 'functions', 'lines'];
const configPath = 'coverage-thresholds.json';
const markerPath = 'coverage/.coverage-run.json';
const projects = {
  layouts: { summary: 'coverage/layouts/coverage-summary.json', minimumTests: 26 },
  'sam-layouts': { summary: 'coverage/sam-layouts/coverage-summary.json', minimumTests: 3 },
};
const toleranceMs = 2_000;
const fail = (message) => {
  console.error(`coverage gate: ${message}`);
  process.exitCode = 1;
};
const loadJson = async (path) => {
  if (!existsSync(path)) throw new Error(`missing ${path}`);
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    throw new Error(`malformed ${path}`);
  }
};
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const inputFiles = () => trackedInputFiles();
const fingerprint = async () => {
  const parts = [];
  for (const file of inputFiles()) parts.push(`${file}\0${sha256(await readFile(file))}`);
  return sha256(parts.join('\0'));
};
const validateMetric = (value, label, zeroAllowed) => {
  if (
    !value ||
    !Number.isInteger(value.total) ||
    !Number.isInteger(value.covered) ||
    !Number.isInteger(value.skipped) ||
    value.total < 0 ||
    value.covered < 0 ||
    value.skipped < 0 ||
    value.covered + value.skipped > value.total ||
    !isNumber(value.pct) ||
    value.pct < 0 ||
    value.pct > 100
  )
    throw new Error(`invalid ${label} measurement`);
  if (value.total === 0) {
    if (!zeroAllowed || value.covered !== 0 || value.skipped !== 0)
      throw new Error(`${label} has undeclared zero total`);
    return;
  }
  const calculated = (value.covered / value.total) * 100;
  if (Math.abs(calculated - value.pct) > 0.020001) throw new Error(`${label} percentage disagrees with counts`);
};
const validateConfig = (config) => {
  if (
    !config ||
    typeof config !== 'object' ||
    Array.isArray(config) ||
    Object.keys(config).some((key) => !projects[key]) ||
    Object.keys(config).length !== Object.keys(projects).length
  )
    throw new Error('all projects must have floors');
  for (const [project, values] of Object.entries(config)) {
    if (!values || typeof values !== 'object' || Array.isArray(values))
      throw new Error(`invalid ${project} floor configuration`);
    const zero = values.zeroTotalMetrics ?? [];
    if (!Array.isArray(zero) || zero.some((metric) => !metrics.includes(metric)) || new Set(zero).size !== zero.length)
      throw new Error(`invalid ${project} zero-total configuration`);
    for (const metric of metrics)
      if (!isNumber(values[metric]) || values[metric] < 0 || values[metric] > 100)
        throw new Error(`invalid ${project} floor configuration`);
  }
};
const inRunWindow = (mtime, started, completed, label) => {
  if (mtime < started - toleranceMs || mtime > completed + toleranceMs)
    throw new Error(`${label} is outside the run window`);
};
const validateEvidence = async (marker, config) => {
  if (
    !marker ||
    typeof marker.runId !== 'string' ||
    !isNumber(Date.parse(marker.startedAt)) ||
    !isNumber(Date.parse(marker.completedAt)) ||
    Date.parse(marker.completedAt) < Date.parse(marker.startedAt) ||
    marker.success !== true ||
    marker.fingerprint !== (await fingerprint())
  )
    throw new Error('missing, stale, or changed run evidence');
  const started = Date.parse(marker.startedAt);
  const completed = Date.parse(marker.completedAt);
  const expectedManifest = (await productionSource(inputFiles())).slice().sort();
  if (
    !Array.isArray(marker.sourceManifest) ||
    marker.sourceManifest.some((file) => typeof file !== 'string') ||
    JSON.stringify(marker.sourceManifest) !== JSON.stringify(expectedManifest) ||
    !Array.isArray(marker.projects) ||
    marker.projects.length !== Object.keys(projects).length ||
    !Array.isArray(marker.evidence) ||
    marker.evidence.length !== Object.keys(projects).length
  )
    throw new Error('missing or malformed run evidence');
  const seenProjects = new Set();
  const seenPaths = new Set();
  for (const [project, details] of Object.entries(projects)) {
    const declared = marker.projects.find((item) => item?.name === project);
    const item = marker.evidence.find((entry) => entry?.project === project);
    if (
      !declared ||
      !item ||
      seenProjects.has(project) ||
      seenPaths.has(item.report) ||
      declared.tests !== details.minimumTests ||
      !Number.isInteger(item.numTotalTests) ||
      item.numTotalTests < details.minimumTests ||
      item.numFailedTests !== 0 ||
      item.numPendingTests !== 0 ||
      item.report !== `tmp/coverage/${project}-tests.json` ||
      !item.reportHash ||
      !item.summaryHash ||
      !item.lcovHash
    )
      throw new Error(`missing successful test evidence for ${project}`);
    seenProjects.add(project);
    seenPaths.add(item.report);
    const reportPath = item.report;
    const report = await loadJson(reportPath);
    const reportStat = await stat(reportPath);
    inRunWindow(reportStat.mtimeMs, started, completed, reportPath);
    if (sha256(await readFile(reportPath)) !== item.reportHash) throw new Error(`${project} test report changed`);
    const assertions = Array.isArray(report.testResults)
      ? report.testResults.flatMap((test) => test.assertionResults ?? [])
      : [];
    const statuses = assertions.map((assertion) => assertion.status);
    if (
      !statuses.length ||
      statuses.length !== report.numTotalTests ||
      statuses.some((status) => status !== 'passed') ||
      report.numTotalTests !== item.numTotalTests ||
      report.numPassedTests !== item.numPassedTests ||
      report.numFailedTests !== item.numFailedTests ||
      report.numPendingTests !== item.numPendingTests ||
      report.numTotalTests !== report.numPassedTests + report.numFailedTests + report.numPendingTests
    )
      throw new Error(`invalid test result evidence for ${project}`);
    const summaryPath = details.summary;
    const lcovPath = summaryPath.replace(/coverage-summary\.json$/, 'lcov.info');
    const lcovStat = await stat(lcovPath);
    inRunWindow(lcovStat.mtimeMs, started, completed, lcovPath);
    if (sha256(await readFile(lcovPath)) !== item.lcovHash) throw new Error(`${project} coverage lcov changed`);
    const lcov = await readFile(lcovPath, 'utf8');
    const coveredSources = new Set(
      [...lcov.matchAll(/^SF:(.+)$/gm)].map((match) => {
        const source = match[1].replaceAll('\\\\', '/');
        const marker = source.includes('apps/sam-layouts/') ? 'apps/sam-layouts/' : 'sam-layouts/';
        return source.slice(source.indexOf(marker));
      }),
    );
    const expected = (await productionSource(inputFiles())).filter((file) =>
      file.startsWith(project === 'layouts' ? 'sam-layouts/' : 'apps/sam-layouts/'),
    );
    if (expected.some((file) => !coveredSources.has(file)))
      throw new Error(`${project} coverage scope omits production source`);
    const summaryStat = await stat(summaryPath);
    inRunWindow(summaryStat.mtimeMs, started, completed, summaryPath);
    if (sha256(await readFile(summaryPath)) !== item.summaryHash) throw new Error(`${project} coverage report changed`);
    const summary = await loadJson(summaryPath);
    if (!summary.total || typeof summary.total !== 'object') throw new Error(`missing total in ${summaryPath}`);
    let nonzero = false;
    for (const metric of metrics) {
      const value = summary.total[metric];
      validateMetric(value, `${project} ${metric}`, config[project].zeroTotalMetrics.includes(metric));
      if (value.total > 0) nonzero = true;
    }
    if (!nonzero) throw new Error(`${project} has no instrumented source`);
  }
  if (seenProjects.size !== Object.keys(projects).length || seenPaths.size !== Object.keys(projects).length)
    throw new Error('duplicate project evidence');
};
try {
  const config = await loadJson(configPath);
  validateConfig(config);
  const marker = await loadJson(markerPath);
  await validateEvidence(marker, config);
  if (command === 'bump') {
    const next = structuredClone(config);
    for (const [project, details] of Object.entries(projects)) {
      const summary = await loadJson(details.summary);
      for (const metric of metrics)
        if (summary.total[metric].total > 0)
          next[project][metric] = Math.max(config[project][metric], summary.total[metric].pct);
    }
    await import('node:fs/promises').then(({ writeFile }) =>
      writeFile(configPath, `${JSON.stringify(next, null, 2)}\n`),
    );
    console.log(`coverage floors updated (never lowered): ${configPath}`);
  } else if (command === 'check') {
    for (const [project, details] of Object.entries(projects))
      for (const metric of metrics) {
        const measurement = (await loadJson(details.summary)).total[metric];
        if (measurement.total === 0) {
          console.log(`${project} ${metric}: declared zero-total metric (no percentage comparison)`);
          continue;
        }
        const value = measurement.pct;
        const floor = config[project][metric];
        console.log(`${project} ${metric}: ${value}% (floor ${floor}%)`);
        if (value < floor) fail(`${project} ${metric} ${value}% is below ${floor}%`);
      }
    if (!process.exitCode) console.log('coverage gate passed');
  } else throw new Error(`unknown command ${command}; use check or bump`);
} catch (error) {
  fail(error.message);
}
