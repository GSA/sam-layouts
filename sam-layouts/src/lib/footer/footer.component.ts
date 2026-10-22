import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { FooterModel } from './model/FooterModel';
import { INavigationLink, SdsExternalLinkDirectivesModule } from '@gsa-sam/components';
import { NavigationHelper } from '@gsa-sam/components';
import { NgTemplateOutlet } from '@angular/common';
import { SdsFeedbackComponent } from '../sds-feedback/sds-feedback.component';
import { UsaAccordionModule } from '@gsa-sam/ngx-uswds';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { RouterLink } from '@angular/router';
import { NgxBootstrapIconsModule, exclamationTriangle } from 'ngx-bootstrap-icons';

@Component({
  selector: 'sds-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [
    NgTemplateOutlet,
    SdsFeedbackComponent,
    UsaAccordionModule,
    IconModule,
    NgxBootstrapIconsModule.pick({ exclamationTriangle }),
    RouterLink,
    SdsExternalLinkDirectivesModule,
  ],
})
export class SdsFooterComponent {
  public innerWidth: any;
  public expandedIndex: number;

  /**
   * Navigation helper
   */
  navigationHelper = new NavigationHelper();

  /**
   * Model used for the different display portions of the footer
   */
  @Input() model: FooterModel;
  @Input() feedbackTemplate: TemplateRef<any>;

  /**
   * event for event based
   */
  @Output()
  linkEvent = new EventEmitter<INavigationLink>();

  @Output()
  feedbackSubmit = new EventEmitter<string>();

  /**
   * Link clicked and emits the link data into an event
   * @param link
   */
  linkClickEvent(link: INavigationLink) {
    this.linkEvent.emit(link);
    return false;
  }

  onFeedbackSubmitClicked(feedback: string) {
    this.feedbackSubmit.emit(feedback);
  }
}
