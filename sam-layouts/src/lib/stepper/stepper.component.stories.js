import { moduleMetadata } from '@storybook/angular';
import { RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SLStepperComponent } from './stepper.component';
import { DemoStepperSimpleModule } from './demo/simple/simple.module';
import { DemoStepperAdvancedModule } from './demo/advanced/advanced.module';

export default {
  title: 'Stepper',
  component: SLStepperComponent,

  decorators: [
    moduleMetadata({
      declarations: [],

      imports: [
        BrowserAnimationsModule,
        RouterTestingModule,
        DemoStepperSimpleModule,
        DemoStepperAdvancedModule,
      ],
    }),
  ],
};

export const Stepper = {
  render: (args) => ({
    template: `<demo-stepper-simple></demo-stepper-simple>`,
  }),

  inline: true,
  name: 'Stepper',
  args: {},
};

export const StepperWithNavigation = {
  render: (args) => ({
    template: `<demo-stepper-advanced></demo-stepper-advanced>`,
  }),

  inline: true,
  name: 'Stepper with Navigation',
  args: {},
};
