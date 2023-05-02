import { moduleMetadata } from '@storybook/angular';
import { Meta, Story } from '@storybook/angular/types-6-0';
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
  ]
} as Meta;

const Template: Story<SdsLandingCardComponent> = (args) => ({
  props: args,
  template: `
    <sds-landing-card>
      <h2 sdsLandingCardTitle>Rhoncus id ullamcorper sed</h2>
      <ng-container landing-page-card-content>
        Ut et aliquam nunc, vitae facilisis metus. Vestibulum sed finibus ex, ut
        posuere dui. Sed vel lobortis felis. Vestibulum pretium arcu non lorem
        lobortis vulputate.
      </ng-container>
    </sds-landing-card>
  `,
});

export const Card = Template.bind({});
Card.args = {};
