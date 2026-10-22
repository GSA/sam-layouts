import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { SdsLandingLinkComponent } from '../link/link.component';
import {
  NgxBootstrapIconsModule,
  arrowRightCircleFill,
  arrowRightCircle,
  questionCircle,
  fileEarmark,
  fileEarmarkText,
  file,
  book,
  play,
  search,
  person,
  info,
  playBtn,
  chevronLeft,
  checkCircle,
  filePdf,
  files,
  window,
  infoCircle,
  filterCircle,
  arrowClockwise,
} from 'ngx-bootstrap-icons';

@Component({
  selector: 'sds-landing-list',
  templateUrl: 'list.component.html',
  imports: [
    NgClass,
    IconModule,
    NgxBootstrapIconsModule.pick({
      arrowRightCircleFill,
      arrowRightCircle,
      questionCircle,
      fileEarmark,
      fileEarmarkText,
      file,
      book,
      play,
      search,
      person,
      info,
      playBtn,
      chevronLeft,
      checkCircle,
      filePdf,
      files,
      window,
      infoCircle,
      filterCircle,
      arrowClockwise,
    }),
    SdsLandingLinkComponent,
  ],
})
export class SdsLandingListComponent {
  @Input() list;
}
