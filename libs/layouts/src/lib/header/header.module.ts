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

export const group_8_login_gov_icon = "<svg width=\"12.9839416px\" height=\"16.5px\" viewBox=\"0 0 12.9839416 16.5\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><title>Group 8login_gov_icon</title><defs><polygon id=\"path-1\" points=\"0 0 6.49381071 0 6.49381071 16.5 0 16.5\"></polygon></defs><g id=\"Desktop\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\"><g id=\"Home----Desktop-Copy-7\" transform=\"translate(-763.033, -267.25)\"><g id=\"Group-8\" transform=\"translate(763.033, 267.25)\"><g id=\"Group-3\" transform=\"translate(6.4901, 0)\"><mask id=\"mask-2\" fill=\"white\"><use xlink:href=\"#path-1\"></use></mask><g id=\"Clip-2\"></g><path d=\"M4.67892857,0 L0,0 L0,16.5 C4.43928571,14.5357143 5.99107143,11.99 6.38392857,11.1964286 C6.45778571,11.0447857 6.4955,10.8778214 6.49397574,10.7092857 L6.49397574,1.815 C6.49397574,0.812428571 5.68110714,0 4.67892857,0\" id=\"Fill-1\" fill=\"#B51E23\" mask=\"url(#mask-2)\"></path></g><path d=\"M1.81504717,0 C0.812475739,0 0,0.812428571 0,1.815 L0,10.7092857 C-0.00152426054,10.8782143 0.0361900252,11.0447857 0.110047168,11.1964286 C0.502904311,11.9821429 2.07433288,14.5475 6.49004717,16.5 L6.49004717,0 L1.81504717,0 Z\" id=\"Fill-4\" fill=\"#E21D3E\"></path><path d=\"M7.64115788,7.11075357 C8.44101503,6.48139643 8.57890788,5.32325357 7.9499436,4.52339643 C7.32058645,3.72353929 6.16205074,3.58525357 5.36258645,4.21461071 C4.56272931,4.843575 4.4244436,6.00211071 5.05380074,6.80196786 C5.14415788,6.91668214 5.24787217,7.02039643 5.36258645,7.11075357 C5.15830074,8.26575357 4.95676503,9.42075357 4.75758645,10.5757536 C5.32958645,10.6743607 5.9094436,10.7242536 6.49008645,10.7250393 C7.07937217,10.736825 7.66787217,10.6975393 8.25008645,10.6071821 C8.04580074,9.42861071 7.85722931,8.27361071 7.64115788,7.11075357\" id=\"Fill-6\" fill=\"#FFFFFF\"></path></g></g></g></g></g></svg>";

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
      squareFill,
      group_8_login_gov_icon
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
