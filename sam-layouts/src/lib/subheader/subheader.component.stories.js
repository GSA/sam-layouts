import { action } from 'storybook/actions';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DemoSubheaderComponent } from './subheader.demo';
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

// Removed: an unexported, unreferenced `const Component = () => <SyntaxHighlighter />`
// and its `react-syntax-highlighter` import. This is a `.js` story, so webpack
// hands it to `@angular-devkit/build-angular`'s Babel loader, which has no JSX
// support and no JSX plugin installed:
//
//   SyntaxError: Support for the experimental syntax 'jsx' isn't currently
//   enabled (19:10) ... Add @babel/preset-react
//
// It was dead code — nothing in this module or any other read it — and the
// equivalent live snippet still renders from `subheader.component.mdx`, where
// MDX compiles JSX natively. Deleting it is what keeps GSA/sam-layouts#75 from
// having to add a Babel preset the repo does not have. See #75.

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
