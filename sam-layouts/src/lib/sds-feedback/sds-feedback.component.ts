import { Component, EventEmitter, Input, OnInit, Output, NgModule } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { SdsCollapseModule } from '@gsa-sam/components';
import { NgxBootstrapIconsModule, arrowDownCircleFill, arrowUpCircleFill } from 'ngx-bootstrap-icons';

@NgModule({
  imports: [NgxBootstrapIconsModule.pick({ arrowDownCircleFill, arrowUpCircleFill })],
  exports: [NgxBootstrapIconsModule],
})
class SdsFeedbackIconsModule {}

@Component({
  selector: 'sds-feedback',
  templateUrl: './sds-feedback.component.html',
  styleUrls: ['./sds-feedback.component.scss'],
  imports: [IconModule, SdsFeedbackIconsModule, SdsCollapseModule, FormsModule, ReactiveFormsModule],
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
