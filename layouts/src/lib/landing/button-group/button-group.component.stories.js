import { SdsLandingButtonGroupComponent } from './button-group.component';

const Template = (args) => ({ props: args });

export default {
  title: 'Landing/Button Group',
  component: SdsLandingButtonGroupComponent,
};

export const ButtonGroup = {
  render: Template.bind({}),
  inline: true,
  name: 'Button Group',

  args: {
    buttons: [
      {
        text: 'Lorem ipsum dolor sit amet',
        url: '/test',
        external: true,
        clickHandler: () => console.log('click'),
      },
      {
        text: 'Consectetur adipiscing elit',
        url: './test',
        external: true,
        classes: ['bg-primary-lighter'],
      },
    ],
  },
};
