#!/usr/bin/env node
/** Audit the runtime contract of emitted JavaScript, not TypeScript source. */
import { readFile, readdir } from 'node:fs/promises';
import { builtinModules, createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const require = createRequire(import.meta.url);
let semver;
try {
  semver = require('semver');
} catch {
  throw new Error(
    'check-package-contract requires the transitive semver package; run npm ci or add semver as an exact dev dependency',
  );
}

export const REQUIRED_PEERS = [
  '@angular/core',
  '@angular/common',
  '@angular/forms',
  '@angular/router',
  '@angular/cdk',
  '@angular/material',
  '@gsa-sam/components',
  '@gsa-sam/ngx-uswds',
  '@gsa-sam/ngx-uswds-icons',
  '@gsa-sam/sam-formly',
  '@gsa-sam/sam-material-extensions',
  'lodash-es',
  'ngx-bootstrap-icons',
  'qs',
  'rxjs',
];
const builtins = new Set([...builtinModules, ...builtinModules.map((x) => `node:${x}`)]);
const isBare = (s) =>
  !s.startsWith('.') && !s.startsWith('/') && !s.startsWith('#') && !builtins.has(s) && !s.startsWith('node:');
export function packageName(specifier) {
  if (!isBare(specifier)) return null;
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** Extract unconditional runtime imports. Dynamic import() is intentionally lazy/optional evidence. */
export function extractRuntimeSpecifiers(source, file = 'emitted.js') {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (sf.parseDiagnostics.length) {
    const d = sf.parseDiagnostics[0];
    throw new Error(
      `${file}:${sf.getLineAndCharacterOfPosition(d.start ?? 0).line + 1}: malformed JavaScript: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`,
    );
  }
  const found = new Set();
  const visit = (node) => {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier?.text;
    else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference))
      specifier = node.moduleReference.expression?.text;
    else if (
      ts.isCallExpression(node) &&
      node.expression.getText(sf) === 'require' &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0])
    )
      specifier = node.arguments[0].text;
    const name = specifier && packageName(specifier);
    if (name) found.add(name);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return [...found].sort();
}

export function angularCompilationKind(source, file = 'emitted.js') {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let partial = false,
    full = false;
  const visit = (node) => {
    if (ts.isIdentifier(node)) {
      partial ||= node.text.startsWith('ɵɵngDeclare');
      full ||= node.text.startsWith('ɵɵdefine');
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return partial && !full ? 'partial-ivy' : full && !partial ? 'full-aot' : partial && full ? 'mixed' : 'unknown';
}

async function emittedFiles(root) {
  const out = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (/\.m?js$/.test(entry.name)) out.push(file);
    }
  };
  await walk(root);
  return out;
}
export async function extractEmittedDependencies(dist) {
  const files = await emittedFiles(dist);
  if (!files.length) throw new Error(`no emitted JavaScript files found in ${dist}`);
  const deps = new Set();
  for (const file of files)
    for (const dep of extractRuntimeSpecifiers(await readFile(file, 'utf8'), file)) deps.add(dep);
  return [...deps].sort();
}

function validAngularRange(range) {
  return semver.validRange(range) && semver.subset(range, '>=21.0.0 <22.0.0');
}
function validSdsRange(range) {
  return semver.validRange(range) && semver.subset(range, '>=21.0.2 <22.0.0');
}
export function validateContract({ manifest, dependencies, file = 'package.json' }) {
  const peers = manifest.peerDependencies ?? {},
    declaredDeps = manifest.dependencies ?? {};
  const errors = [];

  for (const dep of dependencies) {
    if (!peers[dep] && !declaredDeps[dep])
      errors.push(`${file}: emitted runtime dependency ${dep} is not declared in peerDependencies or dependencies`);
    if (manifest.peerDependenciesMeta?.[dep]?.optional)
      errors.push(`${file}: ${dep} is marked optional but is unconditionally imported by the emitted package`);
  }
  for (const [dep, range] of Object.entries(peers)) {
    if (dep.startsWith('@angular/') && !validAngularRange(range))
      errors.push(`${file}: ${dep} must be a subset of Angular 21 (<22), not ${range}`);
    if (
      ['@gsa-sam/components', '@gsa-sam/sam-formly', '@gsa-sam/sam-material-extensions'].includes(dep) &&
      !validSdsRange(range)
    )
      errors.push(`${file}: ${dep} must admit >=21.0.2 and remain <22, not ${range}`);
  }
  return errors;
}
export async function checkPackageContract({ dist, manifestPath }) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const dependencies = await extractEmittedDependencies(dist);
  return { dependencies, errors: validateContract({ manifest, dependencies, file: manifestPath }) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [dist = 'dist/sam-layouts', manifestPath = path.join(dist, 'package.json')] = process.argv.slice(2);
  try {
    const result = await checkPackageContract({ dist, manifestPath });
    console.log(`emitted runtime dependencies (${result.dependencies.length}): ${result.dependencies.join(', ')}`);
    if (result.errors.length) {
      result.errors.forEach((e) => console.error(`package contract: ${e}`));
      process.exitCode = 1;
    } else console.log('package contract passed');
  } catch (e) {
    console.error(`package contract: ${e.message}`);
    process.exitCode = 1;
  }
}
