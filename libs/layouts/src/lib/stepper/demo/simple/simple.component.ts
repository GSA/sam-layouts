import { Component } from '@angular/core';
import { UsaStepIndicatorConfig } from '@gsa-sam/ngx-uswds';
import { SdsFormlyTypes } from '@gsa-sam/sam-formly';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'demo-stepper-simple',
  templateUrl: './simple.component.html',
  providers: [
    {
      // Stepper Header Configuration
      provide: UsaStepIndicatorConfig,
      useValue: {
        displayCounters: true,
        hideLabels: false,
        headerPosition: 'top'
      },
    },
  ],
})
export class DemoStepperSimpleComponent {
  stepOne: FormlyFieldConfig = {
    key: 'entityOne',
    fieldGroup: [
      {
        key: 'name',
        type: 'input',
        templateOptions: {
          label: 'Entity Name',
          placeholder: 'eg: Acme Corporation',
          description: 'Enter the name of your entity.',
          required: true,
        },
        modelOptions: {
          updateOn: 'blur',
        },
      },
      {
        className: 'desktop:grid-col-12 tablet:grid-col-12',
        type: 'input',
        key: 'title',

        templateOptions: {
          label: 'Program or Project Title',
          required: true,
          showError: false,
        },
      },
    ],
  };

  stepTwo = {
    key: 'purposeOfRegistration',
    fieldGroup: [
      {
        key: 'typeOfEntity',
        type: SdsFormlyTypes.RADIO,
        templateOptions: {
          label: 'What type of entity are you registering?',
          hideOptions: true,
          options: [
            {
              label: 'Business Or Organization',
              value: 'business',
            },
            {
              label: 'U.S. State Government',
              value: 'stateGovt',
            },
            {
              label: 'U.S. Local Government',
              value: 'localGovt',
            },
            {
              label: 'Tribal Government',
              value: 'tribal',
            },
            {
              label: 'Foreign Government',
              value: 'foreign',
            },
          ],
        },
      },
      {
        key: 'purposeOfRegistration',
        type: SdsFormlyTypes.RADIO,
        templateOptions: {
          hideOptions: true,
          label:
            'Why are you registering this entity to do business with the U.S. government?',
          options: [
            {
              label: `Bid on federal contracts or other procurement opportunities.`,
              value: 'bidContracts',
            },
            {
              label: 'Apply for federal assistance opportunities.',
              value: 'assistanceOpportunities',
            },
          ],
        },
      },
    ],
  };

  stepThree = {
    key: 'taxpayerDetails',
    fieldGroup: [
      {
        template: `
          <span>
            Please refer to your taxpayer documnets from IRS to find your taxpayer information
          </span>
        `,
      },
      {
        type: 'input',
        key: 'taxpayerName',
        templateOptions: {
          label: 'Taxpayer Name',
          hideOptional: true,
        },
      },
      {
        type: 'input',
        key: 'tinNumber',
        templateOptions: {
          label: 'TIN Number',
          hideOptional: true,
        },
      },
    ],
  };

  model = {};
  stepValidityMap = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSaveData($event: any) {
    console.log($event);
  }
}
