import { Component, Inject } from '@angular/core';
import {
  SdsDialogRef,
  SDS_DIALOG_DATA,
  TabPanelComponent,
} from '@gsa-sam/components';
import { SdsFormlyDialogComponent } from '@gsa-sam/sam-formly';

	@Component({
	standalone: false,
  // `filter-tab-modal.component` is a latent typo: the `.component` suffix
  // belongs to the *filename*, not the selector, and ESLint parses it as an
  // element `filter-tab-modal` plus a class `.component` — which is why it
  // fails `@angular-eslint/component-selector` on both prefix and style.
  //
  // Deliberately left as-is here and kept disabled rather than renamed:
  // GSA/sam-layouts#76 is a config-only slice with an explicit "zero selector
  // renames in src/" acceptance criterion. It is also harmless today — this
  // component is only ever instantiated imperatively via
  // `SdsDialog.open(FilterTabModalComponent, ...)` in
  // `./filter.service.ts`, is never referenced as an element in any template,
  // and is demo-only (not exported from `src/lib/public-api.ts`), so nothing
  // matches the selector at runtime. Rename it to `demo-filter-tab-modal`
  // alongside the next intentional selector change.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'filter-tab-modal.component',
  template: `
    <div sds-dialog-title>Switch Tabs?</div>
    <div sds-dialog-content>
      Switching tabs will clear your current keywords.
    </div>
    <div sds-dialog-actions>
      <button (click)="cancel()" class="usa-button usa-button--base bg-base-lighter">
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
