/**
 * Jest harness for loading ngc-18-compiled `@gsa-sam/*` bundles on an Angular 19
 * runtime. Exports a `jest-preset-angular` wrapper transformer (`createTransformer`)
 * plus the two predicates the rest of the harness needs
 * (`hasNgc18GsaSamPackage`, `installStandaloneFeatureShim`).
 *
 * ## The dependency bug this works around
 *
 * Angular flipped the default value of the `standalone` flag in v19:
 *
 *   - ngc 2..18 emit `standalone: true` explicitly and omit the flag entirely
 *     when a declarable is NgModule-scoped, because the runtime defaulted the
 *     missing flag to `false`.
 *   - Angular 19's runtime defaults the missing flag to `true`
 *     (`@angular/core` `getNgDirectiveDef`: `standalone: directiveDefinition.standalone ?? true`,
 *     and the same `?? true` in `getNgPipeDef`). The v19 compiler therefore
 *     emits `standalone: false` explicitly instead.
 *
 * `@gsa-sam/components@18.0.1`, `@gsa-sam/sam-formly@18.0.1` and
 * `@gsa-sam/sam-material-extensions@18.0.1` (the versions public npm resolves
 * for `^18.0.x`) ship *fully compiled* ngc-18 fesm2022 bundles: 121 of their
 * 125 `ɵɵdefineComponent` / `ɵɵdefineDirective` /
 * `ɵɵdefinePipe` calls omit the flag, and so does the matching
 * `ɵsetClassMetadata` decorator payload that `TestBed` JIT-recompiles from.
 * Loaded on an Angular 19 runtime every one of those declarables silently
 * becomes standalone, and any `TestBed` that lists them through an NgModule
 * fails with NG0302 / "is not marked as standalone".
 *
 * Partially-compiled packages (`@gsa-sam/ngx-uswds`, `@gsa-sam/ngx-uswds-icons`,
 * which emit `ɵɵngDeclare*` plus a `version: "18.2.x"` marker) are NOT affected:
 * the linker in `@angular/compiler` reads that marker and applies
 * `getJitStandaloneDefaultForVersion`, which returns `false` for v2..v18. They
 * contain no `ɵɵdefine*` calls at all, so this transformer makes no edits in
 * them either way.
 *
 * ## What this transformer does
 *
 * For a bundle that a pre-19 ngc emitted (see `targetsAngular18OrOlder` below),
 * insert `standalone: false` into every `ɵɵdefineComponent` / `ɵɵdefineDirective`
 * / `ɵɵdefinePipe` argument and every `Component` / `Directive` / `Pipe`
 * `ɵsetClassMetadata` payload **that does not already carry a `standalone`
 * property**. Declarables that ngc 18 marked `standalone: true` explicitly
 * (`SdsTooltip`, `SdsTooltipWindow`, `SdsPopover`, `SdsPopoverWindow`) are left
 * untouched.
 *
 * ## Why it is inert on the current `^19` dependency set
 *
 * The gate is the emitting Angular major, not a text pattern, so for
 * `@gsa-sam/*@19.0.0` (and `@21.0.0`) `process()` returns the source byte-for-byte
 * unchanged and delegates straight to `jest-preset-angular`. That matters,
 * because "insert the flag where it is missing" is *wrong* on ngc-19 output: the
 * four genuinely standalone `components` declarables above omit the flag there
 * precisely because v19's default is already `true`.
 *
 * ## When this file can be deleted
 *
 * As soon as no installed `@gsa-sam/*` package is ngc-18 output. At `^21` all
 * five packages are ngc-21 output, so once the dependency floor is `^21` this
 * transformer, its `transform` entry in `jest.config.ts` and the
 * `ɵɵStandaloneFeature` shim in `test-setup.ts` should all be removed together.
 */

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const ts = require('typescript');

const jestPresetAngularPath = 'jest-preset-angular';

/** Bump when the rewriting rules change, so Jest's transform cache is invalidated. */
const TRANSFORMER_VERSION = '1';

const DEFINITION_CALLS = new Set([
  'ɵɵdefineComponent',
  'ɵɵdefineDirective',
  'ɵɵdefinePipe',
]);
const DECLARABLE_DECORATORS = new Set(['Component', 'Directive', 'Pipe']);

/** Only `@gsa-sam/*` ships the affected bundles; never touch anything else. */
const AFFECTED_BUNDLE = /[\\/]node_modules[\\/]@gsa-sam[\\/][^\\/]+[\\/].*\.m?js$/;

const manifestCache = new Map();

function nearestManifest(file) {
  let dir = path.dirname(file);
  for (;;) {
    if (manifestCache.has(dir)) return manifestCache.get(dir);
    const candidate = path.join(dir, 'package.json');
    if (fs.existsSync(candidate)) {
      let manifest = null;
      try {
        manifest = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      } catch {
        manifest = null;
      }
      if (manifest && manifest.name && manifest.version) {
        manifestCache.set(dir, manifest);
        return manifest;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * True when the package ships ngc-compiled Angular declarables emitted by
 * ngc <= 18, i.e. when an absent `standalone` property means `false`.
 *
 * The `@angular/core` peer range is the signal (`>=18.0.0 <19.0.0` vs
 * `>=19.0.0 <20.0.0`). A package that declares no `@angular/core` peer is
 * deliberately treated as "not affected":
 *
 *   - `@gsa-sam/sam-styles` is a plain SCSS/asset package with no declarables.
 *   - `@gsa-sam/ngx-uswds` declares no peers, but is *partially* compiled
 *     (`ɵɵngDeclare*` with a `version: "18.2.5"` marker), so the linker already
 *     resolves its `standalone` default correctly — see the file header.
 *
 * Guessing from the package's own version instead would be wrong for both.
 */
function targetsAngular18OrOlder(manifest) {
  const range = manifest.peerDependencies && manifest.peerDependencies['@angular/core'];
  if (!range || !semver.validRange(range)) return false;
  return (
    semver.intersects(range, '<19.0.0', { includePrerelease: true }) &&
    !semver.intersects(range, '>=19.0.0', { includePrerelease: true })
  );
}

function propertyNamed(objectLiteral, name) {
  return objectLiteral.properties.find(
    (property) =>
      property.name &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === name
  );
}

function calleeName(expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return null;
}

/** Collect the offsets (just past the opening brace) that need the flag inserted. */
function collectInsertionPoints(sourceFile) {
  const offsets = [];

  const needsFlag = (node) => {
    if (!node || !ts.isObjectLiteralExpression(node)) return;
    if (propertyNamed(node, 'standalone')) return;
    offsets.push({ pos: node.getStart(sourceFile) + 1, empty: node.properties.length === 0 });
  };

  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const name = calleeName(node.expression);

      if (DEFINITION_CALLS.has(name)) {
        needsFlag(node.arguments[0]);
      }

      // `ɵsetClassMetadata(Cls, [{ type: Component, args: [{ ... }] }], ...)` is
      // what `TestBed` re-reads when it JIT-recompiles a declaration, so the
      // decorator payload has to agree with the compiled definition above.
      if (name === 'ɵsetClassMetadata' && node.arguments[1] && ts.isArrayLiteralExpression(node.arguments[1])) {
        for (const decorator of node.arguments[1].elements) {
          if (!ts.isObjectLiteralExpression(decorator)) continue;
          const type = propertyNamed(decorator, 'type');
          if (!type || !ts.isIdentifier(type.initializer)) continue;
          if (!DECLARABLE_DECORATORS.has(type.initializer.text)) continue;
          const args = propertyNamed(decorator, 'args');
          if (!args || !ts.isArrayLiteralExpression(args.initializer)) continue;
          needsFlag(args.initializer.elements[0]);
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return offsets.sort((a, b) => a.pos - b.pos);
}

function restoreImplicitStandaloneFalse(source, filename) {
  const sourceFile = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.ESNext,
    /* setParentNodes */ true,
    ts.ScriptKind.JS
  );

  const offsets = collectInsertionPoints(sourceFile);
  if (offsets.length === 0) return source;

  const chunks = [];
  let cursor = 0;
  for (const { pos, empty } of offsets) {
    chunks.push(source.slice(cursor, pos), empty ? ' standalone: false ' : ' standalone: false,');
    cursor = pos;
  }
  chunks.push(source.slice(cursor));
  return chunks.join('');
}

function shouldRewrite(filename) {
  if (!AFFECTED_BUNDLE.test(filename)) return false;
  const manifest = nearestManifest(filename);
  return manifest ? targetsAngular18OrOlder(manifest) : false;
}

/**
 * True when at least one installed `@gsa-sam/*` package is ngc-18 output, i.e.
 * when the harness workarounds in this file are actually needed.
 *
 * Used to keep `installStandaloneFeatureShim` a genuine no-op on the `^19`
 * dependency set: nothing is monkey-patched onto `@angular/core` unless an
 * ngc-18 bundle is present to need it.
 */
let ngc18PackagePresent;
function hasNgc18GsaSamPackage() {
  if (ngc18PackagePresent !== undefined) return ngc18PackagePresent;

  let scopeDir;
  try {
    // Resolve through the installed tree rather than guessing at a path, so this
    // works the same in the repo and in an isolated probe root.
    scopeDir = path.dirname(path.dirname(require.resolve('@gsa-sam/components/package.json')));
  } catch {
    ngc18PackagePresent = false;
    return ngc18PackagePresent;
  }

  ngc18PackagePresent = fs
    .readdirSync(scopeDir)
    .map((pkg) => path.join(scopeDir, pkg, 'package.json'))
    .filter((manifestPath) => fs.existsSync(manifestPath))
    .map((manifestPath) => nearestManifest(manifestPath))
    .some((manifest) => manifest && targetsAngular18OrOlder(manifest));

  return ngc18PackagePresent;
}

/**
 * ## The second half of the same dependency bug
 *
 * ngc 18 emits `features: [i0.ɵɵStandaloneFeature]` for genuinely standalone
 * declarables, and Angular 19 removed that runtime export (`SdsTooltipWindow`
 * and `SdsPopoverWindow` in `@gsa-sam/components@18.0.1` are the two call
 * sites). Evaluating the bundle therefore throws before any test runs. In v19
 * the equivalent work moved inline into `ɵɵdefineComponent`, which installs
 * `getStandaloneInjector` itself when `standalone` is true — so a no-op is the
 * correct replacement, not a stub that silently drops behaviour.
 *
 * Returns `true` when the shim was installed, so callers can assert inertness.
 */
function installStandaloneFeatureShim(core) {
  if (!hasNgc18GsaSamPackage()) return false;

  const slot = 'ɵɵStandaloneFeature';
  if (typeof core[slot] === 'function') return false;

  Object.defineProperty(core, slot, {
    value: () => undefined,
    configurable: true,
  });
  return true;
}

module.exports = {
  hasNgc18GsaSamPackage,
  installStandaloneFeatureShim,
  // Exported so the inertness of this harness on a given dependency set can be
  // asserted directly rather than inferred.
  rewritesFile: shouldRewrite,
  restoreImplicitStandaloneFalse,

  createTransformer(config) {
    // Required lazily: `test-setup.ts` loads this module inside the Jest module
    // registry just for `installStandaloneFeatureShim`, and pulling
    // `jest-preset-angular` (and therefore `esbuild`) in there fails.
    const jestPresetAngular = require(jestPresetAngularPath);
    const presetFactory = jestPresetAngular.default ?? jestPresetAngular;
    const inner = presetFactory.createTransformer(config);

    return {
      ...inner,
      getCacheKey(source, filename, options) {
        const key = inner.getCacheKey(source, filename, options);
        return `${key}:ngc18-standalone@${TRANSFORMER_VERSION}:${shouldRewrite(filename) ? 'on' : 'off'}`;
      },
      process(source, filename, options) {
        const patched = shouldRewrite(filename)
          ? restoreImplicitStandaloneFalse(source, filename)
          : source;
        return inner.process(patched, filename, options);
      },
    };
  },
};
