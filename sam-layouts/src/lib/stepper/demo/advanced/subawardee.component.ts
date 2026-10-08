/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  SdsDialogRef,
  SdsDialogService,
  SDS_DIALOG_DATA,
} from '@gsa-sam/components';
import { SdsFormlyDialogData } from '@gsa-sam/sam-formly';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { StepperAdvancedService } from './advanced.service';

	@Component({
	standalone: false,
  // `-demo` is a suffix, not a prefix, so this selector can't be covered by
  // the `component-selector` prefix allowlist in
  // `sam-layouts/eslint.config.mjs` without adding a meaningless `subawardee`
  // prefix. Demo-only (not exported from `src/lib/public-api.ts`); rename to
  // `demo-subawardee` alongside the next intentional selector change.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: `subawardee-demo`,
  templateUrl: './subawardee.component.html',
})
export class SubawardeeDemoComponent {
  @Input() displayInput = true;
  @Input() subawardees: any[] = [];

  @Output() subawardeeUpdate = new EventEmitter<any[]>();

  awardDialogRef: SdsDialogRef<AddSubawardeeDialogDemo> | undefined;

  constructor(public dialog: SdsDialogService) {}

  onAddSubawardee(value: any) {
    this.awardDialogRef = this.dialog.open(AddSubawardeeDialogDemo, {
      width: 'medium',
    });

    this.awardDialogRef.afterClosed().subscribe((result: any[]) => {
      if (!result) {
        return;
      }
      this.subawardees = [...this.subawardees, result];
      this.subawardeeUpdate.emit(this.subawardees);
    });
  }
}

	@Component({
	standalone: false,
  // Same `-demo`-as-suffix case as `subawardee-demo` above; also only ever
  // opened imperatively via `SdsDialog.open(...)`, never as an element.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: `add-subawardee-dialog-demo`,
  template: `
    <div sds-dialog-title>
      <h3>Add Subawardee</h3>
    </div>
    <div sds-dialog-content>
      <formly-form [fields]="subawardeeFields" [model]="model"> </formly-form>
    </div>
    <div sds-dialog-actions>
      <button class="usa-button usa-button--base bg-base-lighter" (click)="cancel()">
        Cancel
      </button>
      <button
        type="submit"
        (click)="onFormSubmit()"
        class="usa-button margin-top-2"
      >
        Submit
      </button>
    </div>
  `,
  providers: [StepperAdvancedService],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AddSubawardeeDialogDemo implements OnInit {
  subawardeeFields!: FormlyFieldConfig[];
  model = {};

  constructor(
    public dialogRef: SdsDialogRef<AddSubawardeeDialogDemo>,
    @Inject(SDS_DIALOG_DATA) public data: SdsFormlyDialogData,
    private stepperAdvancedService: StepperAdvancedService
  ) {}

  ngOnInit() {
    this.subawardeeFields = [this.stepperAdvancedService.getSubawardeeForm()];
  }

  onFormSubmit() {
    if (Object.keys(this.model).length) {
      this.dialogRef.close(this.model);
    } else {
      this.cancel();
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
