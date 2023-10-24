import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import {
  SdsSearchResultListModule,
  SdsSideNavigationModule,
  SdsSelectionPanelModule,
  SdsSideToolbarModule,
  SdsDialogModule,
} from '@gsa-sam/components';
import {
  SdsFiltersModule,
  SDSFormlyUpdateModelService,
} from '@gsa-sam/sam-formly';

import { ResultModule } from './result/result.module';
import { SearchListServiceModule } from '../search-list-layout.module';
import { FilterService } from './filter.service';
import { AutocompleteSampleDataService } from './services/autocomplete-sample.service';
import { LayoutResponsiveComponent } from './layout-responsive/layout-responsive.component';
import { SdsAccordionModule } from '@gsa-sam/sam-material-extensions';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { FilterTabModalComponent } from './filter-tab-modal.component';
@NgModule({
  imports: [
    CommonModule,
    IconModule,
    SdsAccordionModule,
    SdsSideNavigationModule,
    SdsFiltersModule,
    SdsSearchResultListModule,
    SearchListServiceModule,
    ResultModule,
    SdsSideToolbarModule,
    SdsSelectionPanelModule,
    SdsDialogModule
  ],

  exports: [LayoutResponsiveComponent],
  declarations: [LayoutResponsiveComponent, FilterTabModalComponent],
  providers: [
    FilterService,
    AutocompleteSampleDataService,
    SDSFormlyUpdateModelService,
  ],
})
export class ResultsLayoutModule {}
