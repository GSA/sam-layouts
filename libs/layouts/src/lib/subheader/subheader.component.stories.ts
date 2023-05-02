import { moduleMetadata } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { Meta, Story } from '@storybook/angular/types-6-0';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SubHeaderWrapperMode } from './sds-subheader-wrapper.component';
import { RouterModule } from '@angular/router';
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
        RouterModule.forRoot([], { useHash: true }),
      ],
      providers: [],
    }),
  ],
} as Meta;

export const RequestMode: Story<SdsSubheaderComponent> = (args) => ({
  props: {
    ...args,
    clicks: action('Button Click'),
    mode: SubHeaderWrapperMode.SEARCH,
  },
  template: `
  <sds-subheader-wrapper
      [title]="'Request'"
      [mode]="mode"
      (action)="clicks($event)">
  </sds-subheader-wrapper>
  `,
});

export const SubmitMode: Story<SdsSubheaderComponent> = (args) => ({
  props: {
    ...args,
    clicks: action('Button Click'),
    mode: SubHeaderWrapperMode.SUBMIT,
  },
  template: `
  <sds-subheader-wrapper
      [title]="'Submit'"
      [mode]="mode"
      (action)="clicks($event)">
  </sds-subheader-wrapper>
  `,
});

export const TabsMode: Story<SdsSubheaderComponent> = (args) => ({
  props: {
    ...args,
    clicks: action('Click'),
    mode: SubHeaderWrapperMode.TAB,
    tabs: [
      { text: 'Tab 1', selected: true, id: 'tab1' },
      { text: 'Tab 2', selected: false, id: 'tab2' },
      { text: 'Tab 3', selected: false, id: 'tab3' },
    ],
  },
  template: `
  <sds-subheader-wrapper
      [title]="'Tabs'"
      [mode]="mode"
      [tabs]="tabs"
      (action)="clicks($event.value)">
  </sds-subheader-wrapper>
  `,
});

export const SearchMode: Story<SdsSubheaderComponent> = (args) => ({
  props: {
    ...args,
    clicks: action('Click'),
    mode: SubHeaderWrapperMode.CUSTOM,
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
});

export const SearchModeWithDropdown: Story<SdsSubheaderComponent> = (args) => ({
  props: {
    ...args,
    clicks: action('Click'),
    mode: SubHeaderWrapperMode.CUSTOM,
    searchDropDownItems: [
      { label: 'Item 1', value: 'itm1' },
      { label: 'Item 2', value: 'itm2' },
      { label: 'Item 3', value: 'itm3' },
    ],
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
});
SearchModeWithDropdown.storyName = 'Search mode with dropdown';
