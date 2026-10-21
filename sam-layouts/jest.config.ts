module.exports = {
  displayName: 'layouts',
  preset: '../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  coverageDirectory: '../coverage/sam-layouts',
  moduleNameMapper: {
    // `ckeditor5` has no CommonJS export. The app build uses its ESM entry;
    // specs only need the SDS barrel to load.
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
