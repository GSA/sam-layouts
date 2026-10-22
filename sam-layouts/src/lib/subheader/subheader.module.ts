import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SdsMenuModule, SdsSearchModule, SdsObserversModule, SdsTruncateModule } from '@gsa-sam/components';
import {
  SdsSubheaderComponent,
  SdsSubheaderActionsComponent,
  SdsSubheaderDrawerComponent,
  SdsDrawerContentComponent,
} from './subheader.component';
import { SdsSubheaderWrapperComponent } from './sds-subheader-wrapper.component';
import { SdsActionsMenuModule } from '@gsa-sam/components';
import { NgxBootstrapIconsModule, threeDotsVertical, chevronLeft } from 'ngx-bootstrap-icons';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { SdsButtonGroupModule } from '@gsa-sam/sam-material-extensions';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    SdsMenuModule,
    SdsObserversModule,
    SdsSearchModule,
    SdsTruncateModule,
    SdsActionsMenuModule,
    IconModule,
    SdsButtonGroupModule,
    NgxBootstrapIconsModule.pick({ threeDotsVertical, chevronLeft }),
    FormsModule,
    SdsSubheaderComponent,
    SdsSubheaderActionsComponent,
    SdsSubheaderDrawerComponent,
    SdsDrawerContentComponent,
    SdsSubheaderWrapperComponent,
  ],
  exports: [
    SdsSubheaderComponent,
    SdsSubheaderActionsComponent,
    SdsSubheaderDrawerComponent,
    SdsDrawerContentComponent,
    SdsSubheaderWrapperComponent,
  ],
})
export class SdsSubheaderModule {}
