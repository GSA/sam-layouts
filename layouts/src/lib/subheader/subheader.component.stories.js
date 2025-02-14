import { action } from '@storybook/addon-actions';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DemoSubheaderComponent } from './subheader.demo';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { moduleMetadata } from '@storybook/angular';
import {
  SdsMenuModule,
  SdsSearchModule,
  SdsAutocompleteModule,
} from '@gsa-sam/components';
import { SdsButtonGroupModule } from '@gsa-sam/sam-material-extensions';
import { AutocompleteService } from './examples/services/autocomplete.service';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { FormsModule } from '@angular/forms';
import { SdsSubheaderModule } from './subheader.module';
import { SdsSubheaderComponent } from './subheader.component';

const Component = () => {
  return <SyntaxHighlighter />;
};

export default {
  title: 'Subheader',
  component: SdsSubheaderComponent,

  decorators: [
    moduleMetadata({
      declarations: [DemoSubheaderComponent],

      imports: [
        BrowserAnimationsModule,
        FormsModule,
        IconModule,
        SdsSearchModule,
        SdsAutocompleteModule,
        SdsSubheaderModule,
        SdsButtonGroupModule,
      ],

      providers: [AutocompleteService],
    }),
  ],
};

export const Basic = {
  render: (args) => ({
    props: {
      ...args,
      clicks: action('Button Click'),
    },

    template: `<demo-subheader (actionsClicks)="clicks($event)"></demo-subheader>`,
  }),

  inline: true,
  name: 'Basic',
  args: {},
};

export const DataEntry = {
  render: (args) => ({
    props: {
      ...args,
      clicks: action('Button Click'),
    },

    template: `
        <demo-subheader
          (actionsClicks)="clicks($event)"
          [showButtons]="true">
        </demo-subheader>
      `,
  }),

  inline: true,
  name: 'Data Entry',
  args: {},
};

export const Search = {
  render: (args) => ({
    props: {
      ...args,
      clicks: action('Button Click'),
    },

    template: `
        <demo-subheader
          (actionsClicks)="clicks($event)"
          [showSearch]="true">
        </demo-subheader>
      `,
  }),

  inline: true,
  name: 'Search',
  args: {},
};

export const SearchWithAutocomplete = {
  render: (args) => ({
    props: {
      ...args,
      clicks: action('Button Click'),
    },

    template: `
        <demo-subheader
          (actionsClicks)="clicks($event)"
          [showAutocomplete]="true">
        </demo-subheader>
      `,
  }),

  inline: true,
  name: 'Search with Autocomplete',
  args: {},
};

export const SearchWithSubPages = {
  render: (args) => ({
    props: {
      ...args,
      clicks: action('Button Click'),
    },

    template: `
        <demo-subheader
          (actionsClicks)="clicks($event)"
          [showSearch]="true"
          [showButtonGroup]="true">
        </demo-subheader>
      `,
  }),

  inline: true,
  name: 'Search with Sub-Pages',
  args: {},
};

export const Tier2Workspace = {
  render: (args) => ({
    props: {
      ...args,
      clicks: action('Button Click'),
    },

    template: `
        <demo-subheader
          (actionsClicks)="clicks($event)"
          [showSearch]="true"
          [showButtons]="true">
        </demo-subheader>
      `,
  }),

  inline: true,
  name: 'Tier 2 Workspace',
  args: {},
};
