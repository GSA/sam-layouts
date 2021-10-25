import { moduleMetadata } from '@storybook/angular';
import { Meta, Story } from '@storybook/angular/types-6-0';
import { SdsLandingLinkComponent } from './link.component';

export default {
  title: 'Landing/Link',
  component: SdsLandingLinkComponent,
  decorators: [
    moduleMetadata({
      declarations: [SdsLandingLinkComponent],
    }),
  ],
} as Meta;

const Template: Story<SdsLandingLinkComponent> = (args) => ({
  props: args,
  template: `
  <sds-landing-link [link]="externalLink"></sds-landing-link>
  |
  <sds-landing-link [link]="internalLink"></sds-landing-link>
  `,
});

export const Link = Template.bind({});
Link.args = {
  externalLink : {
    href: 'http://google.com',
    target: '_blank',
    innerHtml: 'External Link',
  },
  internalLink : {
    routerLink: 'internal-link',
    innerHtml: 'Internal Link',
  }
};
