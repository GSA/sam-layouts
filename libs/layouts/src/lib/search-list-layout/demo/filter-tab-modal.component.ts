import { Component, Inject } from '@angular/core';
import {
  SdsDialogRef,
  SDS_DIALOG_DATA,
  TabPanelComponent,
} from '@gsa-sam/components';
import { SdsFormlyDialogComponent } from '@gsa-sam/sam-formly';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'filter-tab-modal.component',
  template: `
    <div sds-dialog-title>Switch Tabs?</div>
    <div sds-dialog-content>
      Switching tabs will clear your current keywords.
    </div>
    <div sds-dialog-actions>
      <button (click)="cancel()" class="usa-button usa-button--base">
        Cancel
      </button>
      <button (click)="changeTabs()" cdkFocusInitial class="usa-button">
        Switch
      </button>
    </div>
  `,
})
export class FilterTabModalComponent {
  selectedTab: TabPanelComponent;

  constructor(
    public dialogRef: SdsDialogRef<SdsFormlyDialogComponent>,
    @Inject(SDS_DIALOG_DATA) public data: any
  ) {
    this.selectedTab = this.data.options.selectedTab;
  }

  changeTabs() {
    this.data.fields[0].templateOptions.selectedTab = this.selectedTab;

    const keywordFieldArray =
      this.data.form.controls.keyword._fields[0].fieldArray;

    if (this.selectedTab.tabHeader === 'Simple Search') {
      keywordFieldArray.fieldGroup[1].fieldGroup[0].formControl.setValue(null);
    }

    if (this.selectedTab.tabHeader === 'Search Editor') {
      keywordFieldArray.fieldGroup[0].fieldGroup.forEach((field) => {
        field.formControl.setValue(null);
      });
    }

    this.dialogRef.close();
  }

  cancel() {
    this.dialogRef.close();
  }
}
