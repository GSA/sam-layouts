import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SdsHeaderComponent } from './header.component';
import { RouterModule } from '@angular/router';
import { SdsTopBannerModule, SdsDialogModule } from '@gsa-sam/components';

import { A11yModule } from '@angular/cdk/a11y';
import {
  NgxBootstrapIconsModule,
  square,
  justifyLeft,
  circle,
  circleFill,
  questionCircle,
  pencilSquare,
  bell,
  grid,
  arrowRightSquare,
  list,
  xCircle,
  squareFill
} from 'ngx-bootstrap-icons';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { HelpContentComponent, SdsHeaderHelpComponent } from './help.component';
import { PortalModule } from '@angular/cdk/portal';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdsLandingListModule } from '../landing/list/list.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IconModule,
    A11yModule,
    SdsTopBannerModule,
    SdsDialogModule,
    PortalModule,
    MatTooltipModule,
    SdsLandingListModule,
    NgxBootstrapIconsModule.pick({
      square,
      justifyLeft,
      circle,
      circleFill,
      questionCircle,
      pencilSquare,
      bell,
      grid,
      arrowRightSquare,
      list,
      xCircle,
      squareFill
    }),
  ],
  declarations: [
    SdsHeaderComponent,
    SdsHeaderHelpComponent,
    HelpContentComponent,
  ],
  exports: [SdsHeaderComponent],
})
export class SdsHeaderModule {}
