import { moduleMetadata } from '@storybook/angular';
import { Meta, StoryObj } from '@storybook/angular';
import {
  SdsLandingCardComponent,
  SdsLandingCardTitleDirective,
} from './card.component';

export default {
  title: 'Landing/Card',
  component: SdsLandingCardComponent,
  decorators: [
    moduleMetadata({
      declarations: [SdsLandingCardComponent, SdsLandingCardTitleDirective],
    }),
  ],
} satisfies Meta<SdsLandingCardComponent>;

export const Default: StoryObj<SdsLandingCardComponent> = {
  args: {},
  render: (args) => ({
    props: args,
    template: `
      <sds-landing-card>
        <h2 sdsLandingCardTitle>Rhoncus id ullamcorper sed</h2>
        <ng-container landing-page-card-content>
          Ut et aliquam nunc, vitae facilisis metus. Vestibulum sed posuere dui.
          Sed vel lobortis felis. Vestibulum pretium augue lobortis vulputate.
        </ng-container>
      </sds-landing-card>
    `,
  }),
};
