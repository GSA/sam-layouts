import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SdsStepperModule } from '@gsa-sam/sam-formly';
import { DemoStepperSimpleComponent } from './simple.component';
import { SLStepperModule } from '../../stepper.module';

@NgModule({
    imports: [CommonModule, SdsStepperModule, SLStepperModule, DemoStepperSimpleComponent],
    exports: [DemoStepperSimpleComponent],
})
export class DemoStepperSimpleModule {}
