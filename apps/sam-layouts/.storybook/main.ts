import type { StorybookConfig } from '@storybook/angular';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Storybook 10 loads this config as a real ES module, so the CommonJS
// `__dirname` that worked under Storybook 8 is no longer defined:
//
//   ReferenceError: __dirname is not defined in ES module scope
//
// Derive it from `import.meta.url` instead. See GSA/sam-layouts#81.
const configDir = dirname(fileURLToPath(import.meta.url));

// `@gsa-sam/components@18.0.1` imports from three packages inside its fesm2022
// bundle that it declares in neither `dependencies` nor `peerDependencies`, and
// two of them are absent from this repo's `package-lock.json` entirely:
//
//   from 'ngx-toastr'                        -> MISSING (0 refs in the lockfile)
//   from '@ckeditor/ckeditor5-build-classic' -> MISSING (0 refs in the lockfile)
//   from '@ckeditor/ckeditor5-angular'       -> present
//
// The Angular application builder never trips over this because it tree-shakes
// the unreached `SdsToastComponent`/`SdsRichTextComponent` branches. A resolver
// that eagerly walks the barrel cannot, so Storybook's webpack fails exactly
// where Jest did:
//
//   Module not found: Error: Can't resolve 'ngx-toastr'
//
// Six story/docs files import `@gsa-sam/components` directly, so the first
// build with a correct `stories` glob is also the first build that traverses
// the whole barrel.
//
// `sam-layouts/jest.config.ts` already solves this with `moduleNameMapper`
// pointing at hand-written stubs in `sam-layouts/test-stubs/`; those stub
// headers carry the full diagnosis. Reuse them here rather than duplicating.
//
// Deliberately NOT fixed by adding the packages to our manifest: the missing
// declarations belong to `@gsa-sam/components`, and declaring another
// package's dependencies as ours would hide the real defect. This is the
// second confirmed instance of the undeclared-dependency class tracked by
// GSA/sam-layouts#64 and GSA/sam-layouts#72 — and the first with a build
// failure attached. Delete these aliases once `@gsa-sam/components` declares
// its own dependencies.
const testStubs = join(
  configDir,
  '..',
  '..',
  '..',
  'sam-layouts',
  'test-stubs'
);

const undeclaredDependencyAliases = {
  'ngx-toastr': join(testStubs, 'ngx-toastr.ts'),
  '@ckeditor/ckeditor5-build-classic': join(
    testStubs,
    'ckeditor5-build-classic.ts'
  ),
};

const config: StorybookConfig = {
  // Every story and docs page in this repo lives in the *library* source tree
  // (`sam-layouts/src/lib`), not in the demo app's `src/app`. See
  // GSA/sam-layouts#75 — the old `../src/app/**` glob matched nothing, so
  // `build-storybook` shipped `{"v":5,"entries":{}}` and exited 0.
  stories: [
    '../../../sam-layouts/src/lib/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
  ],
  // Storybook 10 dissolved `@storybook/addon-essentials` and eight of the
  // nine addons it bundled into `storybook` core (actions, backgrounds,
  // controls, highlight, measure, outline, toolbars, viewport). None of them
  // has a 10.x line — the highest ever published is a 9.x alpha — so they are
  // removed rather than bumped (GSA/sam-layouts#81). Docs is the one piece
  // that is still a separate package and still has to be registered here, or
  // the eight `.mdx` files stop producing docs entries.
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  // `@storybook/angular@10.6.1` still depends on `@storybook/builder-webpack5`
  // and still drives `@ngtools/webpack`, so `webpackFinal` survives the 8 -> 10
  // move unchanged. Vite is only the default for the frameworks that ship a
  // Vite builder; the Angular framework is not one of them.
  webpackFinal: async (webpackConfig) => {
    webpackConfig.resolve = webpackConfig.resolve ?? {};
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      ...undeclaredDependencyAliases,
    };
    return webpackConfig;
  },
};

export default config;
