import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SdsStepper } from '@gsa-sam/sam-formly';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sam-layouts-stepper-footer',
  templateUrl: './footer.component.html',
})
export class SLStepperFooterComponent {
  @Input() customSave = false;
  @Output() previousBtnClick = new EventEmitter<any>();
  @Output() nextBtnClick = new EventEmitter<any>();
  @Output() submitBtnClick = new EventEmitter<any>();

  /**
  * determines if old or new stepper buttons are shown
  */
  @Input() stepperButtonsNew = false;

  public stepperID: string;
  constructor(stepper: SdsStepper) {
    this.stepperID = stepper.id;
  }
  
  previousBtn($event){
    this.previousBtnClick.emit($event);
  }

  nextBtn($event) {
    this.nextBtnClick.emit($event);
  }

  submitBtn($event) {
    this.submitBtnClick.emit($event);
  }

  showReviewButton() {
    return false;
  }

  showSubmitButton() {
    return false;
  }

  showNextButton() {
    return !this.showReviewButton() && !this.showSubmitButton();
  }
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sam-layouts-stepper-footer-custom-action',
  template: `
    <div class="margin-right-1">
      <button
        class="usa-button sds-button--circle usa-button--big usa-button--base bg-base-lighter padding-2"
        [attr.id]="stepperID + '-closeBtn'" [attr.aria-labelledby]="stepperID + '-closeBtn-label'"
        (click)="btnClicked($event)"
      >
        <usa-icon [icon]="icon"></usa-icon>
      </button>
      <label
        [attr.id]="stepperID + '-closeBtn-label'"
        [attr.for]="stepperID + '-closeBtn'"
        class="text-center usa-link cursor-pointer display-block margin-top-2"
      >
        <ng-content></ng-content>
      </label>
    </div>
  `,
})
export class SLStepperFooterCustomActionComponent {
  @Input() icon!: string;
  @Output() clickEvent = new EventEmitter<MouseEvent>();
  public stepperID: string;
  constructor(stepper: SdsStepper) {
    this.stepperID = stepper.id;
  }
  btnClicked(event: MouseEvent) {
    this.clickEvent.emit(event);
  }
}
