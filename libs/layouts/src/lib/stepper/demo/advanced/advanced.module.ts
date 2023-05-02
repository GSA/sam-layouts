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

@NgModule({
  imports: [CommonModule, FormlyModule, SdsStepperModule, SLStepperModule],
  declarations: [
    DemoStepperAdvancedComponent,
    SubawardeeDemoComponent,
    AddSubawardeeDialogDemo,
  ],
  exports: [DemoStepperAdvancedComponent],
})
export class DemoStepperAdvancedModule {}
