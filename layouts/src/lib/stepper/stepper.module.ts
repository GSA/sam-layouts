import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SdsSideToolbarModule } from '@gsa-sam/components';
import { SLStepperComponent } from './stepper.component';
import {
  NgxBootstrapIconsModule,
  chevronLeft,
  chevronRight,
  slashCircleFill,
  checkCircleFill,
  circle,
  question,
  save,
  x,
} from 'ngx-bootstrap-icons';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { SdsStepperModule } from '@gsa-sam/sam-formly';
import { UsaStepIndicatorModule } from '@gsa-sam/ngx-uswds';
import {
  SLStepperHeaderComponent,
  SLStepperHeaderWithStatusComponent,
} from './header/header.component';
import { SLStepperFooterComponent, SLStepperFooterCustomActionComponent } from './footer/footer.component';

@NgModule({
  declarations: [
    SLStepperComponent,
    SLStepperHeaderComponent,
    SLStepperHeaderWithStatusComponent,
    SLStepperFooterComponent,
    SLStepperFooterCustomActionComponent
  ],
  imports: [
    CommonModule,
    SdsSideToolbarModule,
    UsaStepIndicatorModule,
    NgxBootstrapIconsModule.pick({
      chevronLeft,
      chevronRight,
      circle,
      slashCircleFill,
      checkCircleFill,
      question,
      save,
      x,
    }),
    IconModule,
    SdsStepperModule,
  ],
  exports: [
    SLStepperComponent,
    SLStepperHeaderComponent,
    SLStepperHeaderWithStatusComponent,
    SLStepperFooterComponent,
    SLStepperFooterCustomActionComponent
  ],
})
export class SLStepperModule {}
