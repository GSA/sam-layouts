import { moduleMetadata } from '@storybook/angular';
import { Meta, Story } from '@storybook/angular/types-6-0';
import {
  SdsWorkspaceTier2ItemComponent,
  SdsWorkspaceTier2ItemHeadComponent,
  SdsWorkspaceTier2ItemBodyComponent,
} from './item.component';
import { SdsWorkspaceTier2TitleModule } from '../title/title.module';
import { SdsWorkspaceTier2LabelModule } from '../label/label.module';

export default {
  title: 'Workspace Tier 2/Results Item',
  component: SdsWorkspaceTier2ItemComponent,
  decorators: [
    moduleMetadata({
      declarations: [
        SdsWorkspaceTier2ItemComponent,
        SdsWorkspaceTier2ItemHeadComponent,
        SdsWorkspaceTier2ItemBodyComponent,
      ],
      imports: [SdsWorkspaceTier2TitleModule, SdsWorkspaceTier2LabelModule],
    }),
  ],
} as Meta;

const Template: Story<SdsWorkspaceTier2ItemComponent> = (args) => ({
  props: args,
  template: `
  <sds-workspace-tier2-title>
    <a class="usa-link" href="#">Entity LLC</a>
  </sds-workspace-tier2-title>
  <div class="grid-row margin-bottom-2">
    <div class="grid-col-4">
      <sds-workspace-tier2-item>
        <sds-workspace-tier2-item-head>
          <sds-workspace-tier2-item-label size="small" color="purple">
            DUNS
          </sds-workspace-tier2-item-label>
          Unique Entity ID
        </sds-workspace-tier2-item-head>
        <sds-workspace-tier2-item-body>
          230783938
        </sds-workspace-tier2-item-body>
      </sds-workspace-tier2-item>
    </div>
    <div class="grid-col-4">
      <sds-workspace-tier2-item>
        <sds-workspace-tier2-item-head>
          Purpose of Registration
        </sds-workspace-tier2-item-head>
        <sds-workspace-tier2-item-body>
          All Awards
        </sds-workspace-tier2-item-body>
      </sds-workspace-tier2-item>
    </div>
    <div class="grid-col-2">
      <sds-workspace-tier2-item>
        <sds-workspace-tier2-item-head>
          Registration Status
        </sds-workspace-tier2-item-head>
        <sds-workspace-tier2-item-body>
          <sds-workspace-tier2-item-label color="gray">
            <sds-workspace-tier2-label-dot color="yellow">
            </sds-workspace-tier2-label-dot>
            Awaiting Review
          </sds-workspace-tier2-item-label>
        </sds-workspace-tier2-item-body>
      </sds-workspace-tier2-item>
    </div>
    <div class="grid-col-2">
      <sds-workspace-tier2-item>
        <sds-workspace-tier2-item-head>
          Expiration Date
        </sds-workspace-tier2-item-head>
        <sds-workspace-tier2-item-body>
          <sds-workspace-tier2-item-label color="gray">
            Aug 6, 2019
          </sds-workspace-tier2-item-label>
        </sds-workspace-tier2-item-body>
      </sds-workspace-tier2-item>
    </div>
  </div>
  <div class="grid-row margin-bottom-2">
    <div class="grid-col-4">
      <sds-workspace-tier2-item>
        <sds-workspace-tier2-item-head>
          <sds-workspace-tier2-item-label size="small">
            SAM
          </sds-workspace-tier2-item-label>
          Unique Entity ID
        </sds-workspace-tier2-item-head>
        <sds-workspace-tier2-item-body>
          RL87YMLJDGB5
        </sds-workspace-tier2-item-body>
      </sds-workspace-tier2-item>
    </div>
    <div class="grid-col-4">
      <sds-workspace-tier2-item>
        <sds-workspace-tier2-item-head>
          Address
        </sds-workspace-tier2-item-head>
        <sds-workspace-tier2-item-body>
          <div>SOUTH DENES</div>
          <div>GREAT YARMOUTH, NR30 3PX GBR</div>
        </sds-workspace-tier2-item-body>
      </sds-workspace-tier2-item>
    </div>
  </div>
  <div class="grid-row margin-bottom-2">
    <div class="grid-col-4">
      <sds-workspace-tier2-item>
        <sds-workspace-tier2-item-head>
          CAGE/NCAGE
        </sds-workspace-tier2-item-head>
        <sds-workspace-tier2-item-body>
          U4388
        </sds-workspace-tier2-item-body>
      </sds-workspace-tier2-item>
    </div>
  </div>
  `,
});

export const ResultsItem = Template.bind({});
ResultsItem.args = {};
