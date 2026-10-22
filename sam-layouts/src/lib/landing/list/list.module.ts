import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  NgxBootstrapIconsModule,
  arrowRightCircleFill,
  fileEarmark,
  questionCircle,
  fileEarmarkText,
  book,
  file,
  play,
  search,
  person,
  info,
  arrowRightCircle,
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

import { SdsLandingListComponent, arrowRightCircleGreen } from './list.component';
import { SdsLandingLinkModule } from '../link/link.module';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';

@NgModule({
  imports: [
    CommonModule,
    SdsLandingLinkModule,
    IconModule,
    NgxBootstrapIconsModule,
    NgxBootstrapIconsModule.pick({
      arrowRightCircleFill,
      fileEarmark,
      arrowRightCircle,
      questionCircle,
      fileEarmarkText,
      file,
      book,
      play,
      search,
      person,
      info,
      arrowRightCircleGreen,
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
    SdsLandingListComponent,
  ],
  exports: [SdsLandingListComponent],
  providers: [],
})
export class SdsLandingListModule {}
