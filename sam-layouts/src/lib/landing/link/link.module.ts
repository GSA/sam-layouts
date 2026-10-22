import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SdsLandingLinkComponent } from './link.component';
import { SdsExternalLinkDirectivesModule } from '@gsa-sam/components';

@NgModule({
    imports: [CommonModule, RouterModule, SdsExternalLinkDirectivesModule, SdsLandingLinkComponent],
    exports: [SdsLandingLinkComponent],
})
export class SdsLandingLinkModule {}
