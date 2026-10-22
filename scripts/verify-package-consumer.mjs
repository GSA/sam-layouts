#!/usr/bin/env node
/**
 * Pack the library and compile a clean, external Angular consumer. This deliberately
 * installs into a directory outside this checkout so npm hoisting cannot hide a
 * missing peer dependency.
 */
import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import semver from 'semver';

const run = promisify(execFile);
const require = createRequire(import.meta.url);
const repo = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = path.join(repo, 'dist/sam-layouts');
const packageManifest = path.join(dist, 'package.json');

export function consumerPlan({ rootManifest, packageManifest: manifest, tarball }) {
  const peers = manifest.peerDependencies ?? {};
  const versions = {};
  const names = new Set(Object.keys(peers));
  // Pin every Angular package in the workspace, not just this library's direct
  // peers: npm otherwise auto-installs an incompatible latest Angular package
  // for a transitive peer (for example platform-browser).
  for (const name of Object.keys(rootManifest.dependencies ?? {})) {
    if (name.startsWith('@angular/')) names.add(name);
  }
  for (const name of names) {
    const version = rootManifest.dependencies?.[name];
    if (!version || !semver.valid(version.replace(/^[~^]/, ''))) {
      throw new Error(`root package.json must provide an exact dependency for peer ${name}`);
    }
    versions[name] = version;
  }
  return {
    dependencies: { ...versions, '@gsa-sam/layouts': `file:${tarball}` },
    peerNames: Object.keys(peers).sort(),
  };
}

export function assertPeerIdentity({ consumerDir, peerNames, packageManifest: manifest, resolve = require.resolve }) {
  const result = {};
  for (const name of peerNames) {
    const declared = manifest.peerDependencies[name];
    const packageJson = resolve(`${name}/package.json`, { paths: [consumerDir] });
    const installed = JSON.parse(require('node:fs').readFileSync(packageJson, 'utf8')).version;
    if (!semver.satisfies(installed, declared))
      throw new Error(`${name}@${installed} is outside declared peer range ${declared}`);
    result[name] = installed;
  }
  return result;
}

export function consumerSources() {
  return {
    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          skipLibCheck: true,
          target: 'ES2022',
          module: 'ES2022',
          moduleResolution: 'node',
          lib: ['ES2022', 'DOM'],
          experimentalDecorators: true,
          useDefineForClassFields: false,
        },
        angularCompilerOptions: { strictTemplates: true, compilationMode: 'full' },
        files: ['app.module.ts', 'standalone.ts'],
      },
      null,
      2,
    ),
    'standalone.ts': `import { Component } from '@angular/core';\nimport { SdsLandingLinkComponent } from '@gsa-sam/layouts';\n@Component({selector: 'consumer-standalone', standalone: true, imports: [SdsLandingLinkComponent], template: \`<sds-landing-link [link]="{ href: 'https://example.test', innerHtml: 'External' }"></sds-landing-link>\`})\nexport class ConsumerStandalone {}`,
    'app.module.ts': `import { NgModule } from '@angular/core';\nimport { RouterModule } from '@angular/router';\nimport { SdsLandingLinkModule } from '@gsa-sam/layouts';\nimport { Component } from '@angular/core';\n@Component({selector: 'consumer-module', standalone: false, template: \`<sds-landing-link [link]="{ routerLink: '/home', innerHtml: 'Home' }"></sds-landing-link>\`})\nexport class ConsumerModuleComponent {}\n@NgModule({imports: [RouterModule.forRoot([]), SdsLandingLinkModule], declarations: [ConsumerModuleComponent]})\nexport class ConsumerModule {}`,
  };
}

async function main() {
  const expected = process.argv[2];
  const manifest = JSON.parse(await readFile(packageManifest, 'utf8'));
  if (expected && manifest.version !== expected)
    throw new Error(`expected package ${expected}, found ${manifest.version}`);
  const rootManifest = JSON.parse(await readFile(path.join(repo, 'package.json'), 'utf8'));
  const work = await mkdtemp(path.join(tmpdir(), 'sam-layouts-consumer-'));
  let tarball;
  try {
    const dry = await run('npm', ['pack', '--json', '--dry-run'], {
      cwd: dist,
      env: { ...process.env, npm_config_userconfig: '/dev/null' },
    });
    const dryInfo = JSON.parse(dry.stdout)[0];
    if (!dryInfo.files?.some((file) => file.path === 'package.json'))
      throw new Error('npm pack dry-run did not include package.json');
    const packed = JSON.parse(
      (await run('npm', ['pack', '--json', '--userconfig=/dev/null', '--ignore-scripts'], { cwd: dist })).stdout,
    )[0];
    tarball = path.join(dist, packed.filename);
    const plan = consumerPlan({ rootManifest, packageManifest: manifest, tarball });
    await writeFile(
      path.join(work, 'package.json'),
      JSON.stringify(
        {
          name: 'sam-layouts-consumer-proof',
          private: true,
          type: 'module',
          dependencies: plan.dependencies,
          devDependencies: {
            '@angular/compiler-cli': rootManifest.devDependencies['@angular/compiler-cli'],
            typescript: rootManifest.devDependencies.typescript,
          },
        },
        null,
        2,
      ),
    );
    for (const [file, source] of Object.entries(consumerSources())) await writeFile(path.join(work, file), source);
    await run('npm', ['install', '--userconfig=/dev/null', '--no-audit', '--no-fund'], { cwd: work, timeout: 180_000 });
    const identities = assertPeerIdentity({ consumerDir: work, peerNames: plan.peerNames, packageManifest: manifest });
    const ls = await run('npm', ['ls', '--all', '--userconfig=/dev/null'], { cwd: work, timeout: 30_000 });
    const ngc = path.join(work, 'node_modules/.bin/ngc');
    await run(ngc, ['-p', 'tsconfig.json'], { cwd: work, timeout: 60_000 });
    console.log(
      JSON.stringify(
        {
          package: `${manifest.name}@${manifest.version}`,
          peerIdentities: identities,
          npmLs: ls.stdout.trim(),
          compilation: 'passed',
        },
        null,
        2,
      ),
    );
  } finally {
    if (tarball) await rm(tarball, { force: true });
    await rm(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)))
  main().catch((error) => {
    console.error(`consumer proof failed: ${error.message}`);
    process.exitCode = 1;
  });
