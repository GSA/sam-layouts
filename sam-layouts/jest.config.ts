export default {
  displayName: 'layouts',
  preset: '../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  coverageDirectory: '../coverage/sam-layouts',
  // The stubs and the transformer below are harness scaffolding, not product
  // code — keep them out of the coverage number that the Wave 3 floor will be
  // derived from.
  coveragePathIgnorePatterns: ['<rootDir>/test-stubs/', '<rootDir>/test-harness/'],
  moduleNameMapper: {
    // `@gsa-sam/components` imports from `ngx-toastr` without declaring it as a
    // dependency, so the package is not installed. See the header comment in
    // the stub for the full diagnosis.
    '^ngx-toastr$': '<rootDir>/test-stubs/ngx-toastr.ts',
    // `ckeditor5` is pure-ESM with no `require` export condition, so Jest's
    // CommonJS resolver lands on its `.d.ts`. See the stub header.
    '^ckeditor5$': '<rootDir>/test-stubs/ckeditor5.ts',
    // The ngc-18 `@gsa-sam/components` reaches for the legacy bundled editor
    // instead, which is likewise undeclared and not installed. Inert on the
    // current `^19` tree, where nothing imports this module — the mapping is
    // simply never consulted. See the stub header.
    '^@ckeditor/ckeditor5-build-classic$':
      '<rootDir>/test-stubs/ckeditor5-build-classic.ts',
    // `lodash-es` ships ESM-only `.js` files, which Jest's default
    // `transformIgnorePatterns` (node_modules, except `.mjs`) will not
    // transform. The CommonJS `lodash` build is installed alongside it and is
    // API-identical, so point Jest at that instead. Used by
    // `search-list-layout.component.ts` and `@gsa-sam/sam-formly`.
    '^lodash-es$': 'lodash',
    '^lodash-es/(.*)$': 'lodash/$1',
  },
  transform: {
    // `@gsa-sam/*` bundles go through a `jest-preset-angular` wrapper that
    // re-materialises the `standalone: false` flag ngc <= 18 left implicit.
    // The wrapper gates on the emitting Angular major read from each package's
    // own manifest, so on the current `^19` tree it forwards the source
    // byte-for-byte unchanged. See the header comment in the harness.
    '[\\\\/]node_modules[\\\\/]@gsa-sam[\\\\/].+\\.m?js$': [
      '<rootDir>/test-harness/ngc18-compat.cjs',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
