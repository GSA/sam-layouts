import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SdsStepperModule } from '@gsa-sam/sam-formly';
import { DemoStepperSimpleComponent } from './simple.component';
import { SLStepperModule } from '@gsa-sam/layouts';

@NgModule({
  declarations: [DemoStepperSimpleComponent],
  imports: [CommonModule, SdsStepperModule, SLStepperModule],
  exports: [DemoStepperSimpleComponent],
})
export class DemoStepperSimpleModule {}
