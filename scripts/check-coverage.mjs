#!/usr/bin/env node
/** Enforce checked-in per-project Vitest coverage floors. */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const [, , command = 'check'] = process.argv;
const metrics = ['statements', 'branches', 'functions', 'lines'];
const configPath = 'coverage-thresholds.json';
const projects = {
  layouts: 'coverage/layouts/coverage-summary.json',
  'sam-layouts': 'coverage/sam-layouts/coverage-summary.json',
};

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

const validate = (config) => {
  for (const [project, values] of Object.entries(config)) {
    if (!projects[project] || !values || typeof values !== 'object')
      throw new Error(`unknown or malformed project ${project}`);
    for (const metric of metrics) {
      if (!Number.isFinite(values[metric]) || values[metric] < 0 || values[metric] > 100)
        throw new Error(`invalid ${project}.${metric} floor`);
    }
  }
  if (Object.keys(config).length !== Object.keys(projects).length) throw new Error('all projects must have floors');
};

try {
  const config = await loadJson(configPath);
  validate(config);
  if (command === 'bump') {
    const next = structuredClone(config);
    for (const [project, summaryPath] of Object.entries(projects)) {
      const summary = await loadJson(summaryPath);
      if (!summary.total) throw new Error(`missing total in ${summaryPath}`);
      for (const metric of metrics) {
        const value = Number(summary.total[metric]?.pct);
        if (!Number.isFinite(value)) throw new Error(`invalid ${project} ${metric} measurement`);
        next[project][metric] = Math.max(config[project][metric], value);
      }
    }
    await import('node:fs/promises').then(({ writeFile }) =>
      writeFile(configPath, `${JSON.stringify(next, null, 2)}\n`),
    );
    console.log(`coverage floors updated (never lowered): ${configPath}`);
  } else if (command !== 'check') {
    throw new Error(`unknown command ${command}; use check or bump`);
  } else {
    for (const [project, summaryPath] of Object.entries(projects)) {
      const summary = await loadJson(summaryPath);
      if (!summary.total) throw new Error(`missing total in ${summaryPath}`);
      for (const metric of metrics) {
        const value = Number(summary.total[metric]?.pct);
        const floor = config[project][metric];
        if (!Number.isFinite(value)) throw new Error(`invalid ${project} ${metric} measurement`);
        console.log(`${project} ${metric}: ${value}% (floor ${floor}%)`);
        if (value < floor) fail(`${project} ${metric} ${value}% is below ${floor}%`);
      }
    }
    if (process.exitCode !== 1) console.log('coverage gate passed');
  }
} catch (error) {
  fail(error.message);
}
