/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from '@angular/core';
import { FormlyUtilsService, SdsStepper } from '@gsa-sam/sam-formly';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { StepperAdvancedService } from './advanced.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: `demo-stepper-advanced`,
  templateUrl: `./advanced.component.html`,
  providers: [StepperAdvancedService, SdsStepper],
})
export class DemoStepperAdvancedComponent {
  model = {
    subawardee: [],
  };

  showLoading = false;

  stepMap = {
    welcome: {
      validationFn: () => true,
    },
    registrationPurpose: {
      fieldConfig: this.stepperAdvancedService.getRegistrationPurpose(),
    },
    enitityInformation: {
      fieldConfig: this.stepperAdvancedService.getEntityInformation(),
    },
    reportDetails: {
      fieldConfig: this.stepperAdvancedService.getReportDetails() as FormlyFieldConfig,
    },
    taxpayerInformation: {
      fieldConfig: this.stepperAdvancedService.getTaxpayerForm(),
    },
    subawardee: {
      validationFn: (model: any) => {
        return model.subawardee.length ? true : undefined;
      },
    },
    review: {
      fieldConfig: {
        fieldGroup: [
          this.stepperAdvancedService.getRegistrationPurpose(),
          this.stepperAdvancedService.getEntityInformation(),
          this.stepperAdvancedService.getReportDetails() as FormlyFieldConfig,
          this.stepperAdvancedService.getTaxpayerForm(),
        ],
      },
      validationFn: () => true,
    },
  };

  currentStepId: string | undefined;
  stepValidityMap = {};

  versions = [
    { label: '2', value: '2'},
    { label: '1', value: '1'},
  ];

  linear = false;
  reinitializeComponents = false;
  constructor(private stepperAdvancedService: StepperAdvancedService) {}

  onStepChange($event: any) {
    this.currentStepId = $event.id;

    if (this.currentStepId === 'review') {
      FormlyUtilsService.setReadonlyMode(
        true,
        this.stepMap.review.fieldConfig.fieldGroup as any
      );
    }
  }

  onSaveData(data: { model: any; metadata: any }) {
    console.log(data);
  }

  updateSubawardee($event: any) {
    this.model.subawardee = $event;
  }

  toggleLinearMode() {
    this.linear = !this.linear;
  }

  customBtnClick(evt: MouseEvent){
    console.log(evt)
  }
}
