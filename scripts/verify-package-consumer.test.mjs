import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdtemp, mkdir, symlink, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { consumerPlan, consumerSources, assertPeerIdentity } from './verify-package-consumer.mjs';

const run = promisify(execFile);

test('CLI runs from a checkout path containing spaces and rejects a missing artifact', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'consumer checkout with spaces-'));
  const script = path.join(root, 'verify-package-consumer.mjs');
  await cp(new URL('./verify-package-consumer.mjs', import.meta.url), script);
  await symlink(path.resolve('node_modules'), path.join(root, 'node_modules'));
  await assert.rejects(run(process.execPath, [script]), /ENOENT|package\.json/);
});

test('consumer plan pins the packed tarball and derives peers from the root manifest', () => {
  const plan = consumerPlan({
    rootManifest: { dependencies: { '@angular/core': '21.2.25', rxjs: '~7.8.0' } },
    packageManifest: { peerDependencies: { '@angular/core': '^21.0.0', rxjs: '^7.8.0' } },
    tarball: '/tmp/layouts.tgz',
  });
  assert.equal(plan.dependencies['@gsa-sam/layouts'], 'file:/tmp/layouts.tgz');
  assert.equal(plan.dependencies['@angular/core'], '21.2.25');
  assert.equal(plan.dependencies.rxjs, '~7.8.0');
  assert.deepEqual(plan.peerNames, ['@angular/core', 'rxjs']);
});

test('plan rejects a peer absent from the root manifest', () =>
  assert.throws(
    () =>
      consumerPlan({
        rootManifest: { dependencies: {} },
        packageManifest: { peerDependencies: { '@angular/core': '^21.0.0' } },
        tarball: 'x',
      }),
    /must provide/,
  ));

test('consumer sources exercise standalone and compatibility module APIs', () => {
  const sources = consumerSources();
  assert.match(sources['standalone.ts'], /SdsLandingLinkComponent/);
  assert.match(sources['standalone.ts'], /https:\/\/example\.test/);
  assert.match(sources['app.module.ts'], /SdsLandingLinkModule/);
  assert.match(sources['app.module.ts'], /routerLink/);
  assert.match(sources['tsconfig.json'], /strictTemplates/);
});

test('peer identity verifies the installed package versions against package ranges', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'consumer-identity-'));
  const packageDir = path.join(dir, 'node_modules', '@angular', 'core');
  await mkdir(packageDir, { recursive: true });
  await writeFile(path.join(packageDir, 'package.json'), JSON.stringify({ name: '@angular/core', version: '21.2.25' }));
  const identity = assertPeerIdentity({
    consumerDir: dir,
    peerNames: ['@angular/core'],
    packageManifest: { peerDependencies: { '@angular/core': '^21.0.0' } },
  });
  assert.deepEqual(identity, { '@angular/core': '21.2.25' });
});

test('peer identity rejects an incompatible installed package', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'consumer-identity-'));
  const packageDir = path.join(dir, 'node_modules', '@angular', 'core');
  await mkdir(packageDir, { recursive: true });
  await writeFile(path.join(packageDir, 'package.json'), JSON.stringify({ name: '@angular/core', version: '20.0.0' }));
  assert.throws(
    () =>
      assertPeerIdentity({
        consumerDir: dir,
        peerNames: ['@angular/core'],
        packageManifest: { peerDependencies: { '@angular/core': '^21.0.0' } },
      }),
    /outside declared peer range/,
  );
});
