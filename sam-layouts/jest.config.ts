export default {
  displayName: 'layouts',
  preset: '../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  coverageDirectory: '../coverage/sam-layouts',
  // The stubs below are harness scaffolding, not product code — keep them out
  // of the coverage number that the Wave 3 floor will be derived from.
  coveragePathIgnorePatterns: ['<rootDir>/test-stubs/'],
  moduleNameMapper: {
    // `@gsa-sam/components` imports from `ngx-toastr` without declaring it as a
    // dependency, so the package is not installed. See the header comment in
    // the stub for the full diagnosis.
    '^ngx-toastr$': '<rootDir>/test-stubs/ngx-toastr.ts',
    // `ckeditor5` is pure-ESM with no `require` export condition, so Jest's
    // CommonJS resolver lands on its `.d.ts`. See the stub header.
    '^ckeditor5$': '<rootDir>/test-stubs/ckeditor5.ts',
    // `lodash-es` ships ESM-only `.js` files, which Jest's default
    // `transformIgnorePatterns` (node_modules, except `.mjs`) will not
    // transform. The CommonJS `lodash` build is installed alongside it and is
    // API-identical, so point Jest at that instead. Used by
    // `search-list-layout.component.ts` and `@gsa-sam/sam-formly`.
    '^lodash-es$': 'lodash',
    '^lodash-es/(.*)$': 'lodash/$1',
  },
  transform: {
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
