import { moduleMetadata } from '@storybook/angular';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import {
  NgxBootstrapIconsModule,
  x,
  exclamationTriangle,
  caretDownFill,
} from 'ngx-bootstrap-icons';
import { SdsSystemAlertComponent } from './system-alert.component';
import { SdsSystemAlertModule } from './system-alert.module';

const Template = (args) => ({ props: args });

export default {
  title: 'System Alerts',
  component: SdsSystemAlertComponent,

  decorators: [
    moduleMetadata({
      imports: [
        IconModule,
        SdsSystemAlertModule,
        NgxBootstrapIconsModule.pick({
          x,
          exclamationTriangle,
          caretDownFill,
        }),
      ],
    }),
  ],
};

export const SingleAlert = {
  render: Template.bind({}),
  inline: true,
  name: 'Single Alert',

  args: {
    alerts: [
      {
        header: 'Alert Header',
        description: 'Alert Description',
        date: new Date(),
      },
    ],
  },
};

export const MultipleAlerts = {
  render: Template.bind({}),
  inline: true,
  name: 'Multiple Alerts',

  args: {
    alerts: [
      {
        header: 'Alert Header',
        description: 'Alert Description',
        date: new Date(),
      },
      {
        header: 'Alert Header 2',
        description: 'Alert 2 Description',
        date: new Date(),
      },
      {
        header: 'Alert Header 3',
        description: 'Alert 3 Description',
        date: new Date(),
      },
    ],
  },
};
