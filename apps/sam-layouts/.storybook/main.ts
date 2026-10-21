import type { StorybookConfig } from '@storybook/angular';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Storybook 10 loads this config as a real ES module, so the CommonJS
// `__dirname` that worked under Storybook 8 is no longer defined:
//
//   ReferenceError: __dirname is not defined in ES module scope
//
// Derive it from `import.meta.url` instead. See GSA/sam-layouts#81.
const configDir = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  // Every story and docs page in this repo lives in the *library* source tree
  // (`sam-layouts/src/lib`), not in the demo app's `src/app`. See
  // GSA/sam-layouts#75 — the old `../src/app/**` glob matched nothing, so
  // `build-storybook` shipped `{"v":5,"entries":{}}` and exited 0.
  stories: ['../../../sam-layouts/src/lib/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
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
};

export default config;
