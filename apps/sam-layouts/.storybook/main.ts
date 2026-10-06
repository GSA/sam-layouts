import type { StorybookConfig } from '@storybook/angular';
import { join } from 'node:path';

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
  __dirname,
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
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
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
