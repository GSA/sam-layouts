import nx from '@nx/eslint-plugin';
import baseConfig from '../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      // Warn, not error: the library declares 2 of its 15 runtime peers.
      // Completing the peer-dependency manifest is owned by
      // GSA/sam-layouts#64 (and the legacy-peer-deps audit in
      // GSA/sam-layouts#72); auto-fixing it here would silently ship a
      // consumer-visible manifest change from a lint-config PR.
      '@nx/dependency-checks': [
        'warn',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs}'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      // The Nx library generator stamped `prefix: 'lib'` in
      // `sam-layouts/project.json`, but this library has never used `lib-*`.
      // That generator prefix is now `sds` so newly scaffolded components are
      // lint-clean on the first try instead of landing as `lib-*` and
      // immediately failing the rule below. `@gsa-sam/layouts` is a published
      // design library, so its selectors are public API: renaming the existing
      // ones to satisfy the old scaffold default would break every consumer.
      // The prefixes below are the ones actually in use in `src/`:
      //
      //   sds          24 components + 7 directives (sds-header, sds-footer,
      //                [sdsLandingPageTitle], ...) — the SAM Design System
      //                prefix shared with the sibling libraries
      //   sam-layouts   5 components — the stepper family
      //                (sam-layouts-stepper, ...)
      //   demo          demo-only components shipped for the Storybook/demo
      //                app (demo-subheader, demo-stepper-simple, ...)
      //   search        search-list-layout (legacy, unprefixed, public API)
      //   result        result-item (legacy, unprefixed, demo-only)
      //
      // A few remaining legacy demo selectors use `-demo` as a *suffix*
      // (`subawardee-demo`, `add-subawardee-dialog-demo`) and keep their
      // existing file-local `eslint-disable-next-line` rather than forcing a
      // junk prefix such as `add` into this allowlist.
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: ['sds'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: ['sds', 'sam-layouts', 'demo', 'search', 'result'],
          style: 'kebab-case',
        },
      ],
      // Warn, not error: converting these components to standalone is a
      // breaking, consumer-visible change owned by the Wave 3 Angular 20 -> 21
      // slice of GSA/sam-layouts#52 ("Angular 20 -> 21 (LTS) +
      // prefer-standalone conversion (breaking, needs a documented migration
      // note)"). Parked in the warning baseline so it blocks *new* debt
      // without blocking CI today. Delete this override in Wave 3.
      '@angular-eslint/prefer-standalone': 'warn',
      // Warn, not error: pre-existing empty constructors / lifecycle hooks
      // inherited from the 2022 codebase. Tracked by the ratcheting warning
      // baseline (`eslint-baseline.json`) rather than blocking CI.
      '@typescript-eslint/no-empty-function': 'warn',
      '@angular-eslint/no-empty-lifecycle-method': 'warn',
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      // Warn, not error: template accessibility findings are owned by
      // GSA/sam-layouts#82 (Playwright story smoke tests + WCAG 2.1 AA axe
      // gate with a committed baseline), which lands the real a11y gate.
      // Parked in the warning baseline until then.
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/valid-aria': 'warn',
    },
  },
];
