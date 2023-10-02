const config = {
  stories: [
    '../src/app/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../../../libs/layouts/src/lib/**/*.stories.@(js|jsx|ts|tsx|mdx)'
  ],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  staticDirs: [
    {from: '../src/assets', to: 'assets/' },
    {from: '../../../node_modules/@uswds/uswds/dist/fonts/', to: 'assets/uswds/fonts' },
    {from: '../../../node_modules/@uswds/uswds/dist/img/', to: 'assets/uswds/img' }
  ]
};

export default config;

// To customize your webpack configuration you can use the webpackFinal field.
// Check https://storybook.js.org/docs/react/builders/webpack#extending-storybooks-webpack-config
// and https://nx.dev/packages/storybook/documents/custom-builder-configs
