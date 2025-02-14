import { moduleMetadata } from '@storybook/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SearchListLayoutComponent } from './search-list-layout.component';
import { ResultsLayoutModule } from './demo/layout.module';

export default {
  title: 'Responsive Layout',
  component: SearchListLayoutComponent,

  decorators: [
    moduleMetadata({
      declarations: [],
      imports: [
        BrowserAnimationsModule,
        RouterTestingModule,
        ResultsLayoutModule,
      ],
    }),
  ],
};

export const ResponsiveLayout = {
  render: (args) => ({
    props: {
      ...args,
    },

    template: `<demo-search-list-layout></demo-search-list-layout>`,
  }),

  inline: true,
  name: 'Responsive Layout',
  args: {},
};
