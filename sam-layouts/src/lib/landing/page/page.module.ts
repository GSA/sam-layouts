import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import {
  SdsLandingPageComponent,
  SdsLandingPageHeadComponent,
  SdsLandingPageTitleDirective,
  SdsLandingPageHeaderComponent,
  SdsLandingPageLegacyComponent,
  SdsLandingPageLegacyLogoDirective,
  SdsLandingPageOverviewDirective,
  SdsLandingPageOverviewParagraphDirective,
  SdsLandingPageTileDirective,
  SdsLandingPageCardDirective,
} from './page.component';

@NgModule({
  imports: [
    CommonModule,
    SdsLandingPageComponent,
    SdsLandingPageHeadComponent,
    SdsLandingPageHeaderComponent,
    SdsLandingPageTitleDirective,
    SdsLandingPageLegacyComponent,
    SdsLandingPageLegacyLogoDirective,
    SdsLandingPageOverviewDirective,
    SdsLandingPageOverviewParagraphDirective,
    SdsLandingPageTileDirective,
    SdsLandingPageCardDirective,
  ],
  exports: [
    SdsLandingPageComponent,
    SdsLandingPageHeadComponent,
    SdsLandingPageHeaderComponent,
    SdsLandingPageTitleDirective,
    SdsLandingPageLegacyComponent,
    SdsLandingPageLegacyLogoDirective,
    SdsLandingPageOverviewDirective,
    SdsLandingPageOverviewParagraphDirective,
    SdsLandingPageTileDirective,
    SdsLandingPageCardDirective,
  ],
  providers: [],
})
export class SdsLandingPageModule {}
