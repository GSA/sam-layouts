import { moduleMetadata } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SubHeaderWrapperMode } from './sds-subheader-wrapper.component';
import { RouterTestingModule } from '@angular/router/testing';
import { SdsSubheaderModule } from './subheader.module';
import { SdsSubheaderComponent } from './subheader.component';

export default {
  title: 'Subheader/Modes',
  component: SdsSubheaderComponent,
  decorators: [
    moduleMetadata({
      declarations: [],
      imports: [
        BrowserAnimationsModule,
        SdsSubheaderModule,
        RouterTestingModule,
      ],
      providers: [],
    }),
  ],
} satisfies Meta<SdsSubheaderComponent>;

export const RequestMode: StoryObj<SdsSubheaderComponent> = {
  args: {
    mode: SubHeaderWrapperMode.SEARCH,
  },
  render: (args) => ({
    props: {
      ...args,
      clicks: action('Button Click'),
    },
    template: `
      <sds-subheader-wrapper
        [title]="'Request'"
        [mode]="mode"
        (action)="clicks($event)">
      </sds-subheader-wrapper>
    `,
  }),
};

export const SubmitMode: StoryObj<SdsSubheaderComponent> = {
  args: {
    mode: SubHeaderWrapperMode.SUBMIT,
  },
  render: (args) => ({
    props: {
      ...args,
      clicks: action('Button Click'),
    },
    template: `
      <sds-subheader-wrapper
        [title]="'Submit'"
        [mode]="mode"
        (action)="clicks($event)">
      </sds-subheader-wrapper>
    `,
  }),
};

export const TabsMode: StoryObj<SdsSubheaderComponent> = {
  args: {
    mode: SubHeaderWrapperMode.TAB,
    tabs: [
      { text: 'Tab 1', selected: true, id: 'tab1' },
      { text: 'Tab 2', selected: false, id: 'tab2' },
      { text: 'Tab 3', selected: false, id: 'tab3' },
    ],
  },
  render: (args) => ({
    props: {
      ...args,
      clicks: action('Click'),
    },
    template: `
      <sds-subheader-wrapper
        [title]="'Tabs'"
        [mode]="mode"
        [tabs]="tabs"
        (action)="clicks($event.value)">
      </sds-subheader-wrapper>
    `,
  }),
};

export const SearchMode: StoryObj<SdsSubheaderComponent> = {
  args: {
    mode: SubHeaderWrapperMode.CUSTOM,
  },
  render: (args) => ({
    props: {
      ...args,
      clicks: action('Click'),
    },
    template: `
      <sds-subheader-wrapper
        [title]="'Search'"
        [mode]="mode"
        [searchPlaceholderText]="'Enter an entity id'"
        [searchEnabled]="true"
        (action)="clicks($event)">
      </sds-subheader-wrapper>
    `,
  }),
};

export const SearchModeWithDropdown: StoryObj<SdsSubheaderComponent> = {
  name: 'Search mode with dropdown',
  args: {
    mode: SubHeaderWrapperMode.CUSTOM,
    searchDropDownItems: [
      { label: 'Item 1', value: 'itm1' },
      { label: 'Item 2', value: 'itm2' },
      { label: 'Item 3', value: 'itm3' },
    ],
  },
  render: (args) => ({
    props: {
      ...args,
      clicks: action('Click'),
    },
    template: `
      <sds-subheader-wrapper
        [title]="'Search Dropdown'"
        [mode]="mode"
        [searchPlaceholderText]="'Enter an entity id'"
        [searchEnabled]="true"
        [searchDropDownItems]="searchDropDownItems"
        (action)="clicks($event)">
      </sds-subheader-wrapper>
    `,
  }),
};
