import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { SdsCollapseModule } from '@gsa-sam/components';

@Component({
    selector: 'sds-feedback',
    templateUrl: './sds-feedback.component.html',
    styleUrls: ['./sds-feedback.component.scss'],
    imports: [
        IconModule,
        SdsCollapseModule,
        FormsModule,
        ReactiveFormsModule,
    ],
})
export class SdsFeedbackComponent {
  @Input() feedbackModel: FormControl = new FormControl('');
  @Input() isCollapsedContent = true;
  @Output() feedbackSubmit = new EventEmitter<string>();

  constructor() {}

  onFeedbackSubmitClicked() {
    this.feedbackSubmit.emit(this.feedbackModel.value);
  }
}
