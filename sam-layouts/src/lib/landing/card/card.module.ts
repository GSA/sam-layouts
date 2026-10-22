import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SdsLandingCardComponent, SdsLandingCardTitleDirective } from './card.component';

@NgModule({
    imports: [CommonModule, SdsLandingCardComponent, SdsLandingCardTitleDirective],
    exports: [SdsLandingCardComponent, SdsLandingCardTitleDirective],
    providers: [],
})
export class SdsLandingCardModule {}
