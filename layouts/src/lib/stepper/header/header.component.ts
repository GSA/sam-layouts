import { AfterContentInit, Component, ElementRef, Input, TemplateRef } from '@angular/core';

import {
  UsaStepIndicatorComponent,
  UsaStepIndicatorConfig,
} from '@gsa-sam/ngx-uswds';
import { SdsStepper } from '@gsa-sam/sam-formly';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sam-layouts-stepper-header',
  templateUrl: './header.component.html',
})
export class SLStepperHeaderComponent
  extends UsaStepIndicatorComponent
  implements AfterContentInit
{
  @Input() custom = false;
  @Input() template: TemplateRef<any>;

  stepLabels: any = [];
  currentStepIndex = 0;

  constructor(
    private stepper: SdsStepper,
    config: UsaStepIndicatorConfig,
    elementRef: ElementRef
  ) {
    super(config, elementRef);
  }

  ngAfterContentInit() {
    this.stepLabels = this.stepper.stepTemplates.map((stepTemplate, index) => {
      if (stepTemplate.id === this.stepper.currentStepId) {
        this.currentStepIndex = index;
      }
      return { ...stepTemplate, label: stepTemplate.text };
    });
    this.steps = this.stepLabels;
  }
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sam-layouts-stepper-header-with-status',
  templateUrl: './header-with-status.component.html',
})
export class SLStepperHeaderWithStatusComponent {
  @Input() title: string;
  @Input() status: { text: string; color: string };
}
