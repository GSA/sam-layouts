import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: [
      '../src/app/**/*.stories.@(js|jsx|ts|tsx)',
      '../../../layouts/src/lib/**/*.stories.@(js|jsx|ts|tsx)',
      '../../../layouts/src/lib/**/*.mdx'
  ],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/react'],
  framework: '@storybook/angular',
  staticDirs: [
    {from: '../src/assets', to: 'assets/' },
    {from: '../../../node_modules/@uswds/uswds/dist/fonts/', to: 'assets/uswds/fonts' },
    {from: '../../../node_modules/@uswds/uswds/dist/img/', to: 'assets/uswds/img' }
  ],
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            '@babel/preset-react',
            '@babel/preset-typescript'
          ]
        }
      }
    });
  
    return config;
  },  
  docs: {
    autodocs: false
  }

};

export default config;

// To customize your webpack configuration you can use the webpackFinal field.
// Check https://storybook.js.org/docs/react/builders/webpack#extending-storybooks-webpack-config
// and https://nx.dev/recipes/storybook/custom-builder-configs
