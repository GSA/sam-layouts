import { moduleMetadata } from '@storybook/angular';
import { Meta, StoryObj } from '@storybook/angular';
import { SdsLandingLinkComponent } from './link.component';
import { SdsLandingLinkModule } from './link.module';
import { RouterTestingModule } from '@angular/router/testing';
import { Link } from './link.model';

export default {
  title: 'Landing/Link',
  component: SdsLandingLinkComponent,
  decorators: [
    moduleMetadata({
      declarations: [],
      imports: [
        SdsLandingLinkModule,
        RouterTestingModule,
      ]
    }),
  ],
} as Meta<SdsLandingLinkComponent>;

export const ExternalLink: StoryObj<SdsLandingLinkComponent> = {
  args: {
    link: {
      href: 'http://google.com',
      target: '_blank',
      innerHtml: 'External Link',
    } as Link,
  },
};

export const InternalLink: StoryObj<SdsLandingLinkComponent> = {
  args: {
    link: {
      routerLink: 'internal-link',
      innerHtml: 'Internal Link',
    } as Link,
  },
};
