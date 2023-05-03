import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormlyModule } from '@ngx-formly/core';
import { SdsStepperModule } from '@gsa-sam/sam-formly';

import { SLStepperModule } from '@gsa-sam/layouts';
import { DemoStepperAdvancedComponent } from './advanced.component';
import {
  AddSubawardeeDialogDemo,
  SubawardeeDemoComponent,
} from './subawardee.component';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { NgxBootstrapIconsModule, chevronRight } from 'ngx-bootstrap-icons';

@NgModule({
  imports: [
    CommonModule,
    FormlyModule,
    SdsStepperModule,
    SLStepperModule,
    NgxBootstrapIconsModule.pick({
      chevronRight,
    }),
    IconModule,
  ],
  declarations: [
    DemoStepperAdvancedComponent,
    SubawardeeDemoComponent,
    AddSubawardeeDialogDemo,
  ],
  exports: [DemoStepperAdvancedComponent],
})
export class DemoStepperAdvancedModule {}
