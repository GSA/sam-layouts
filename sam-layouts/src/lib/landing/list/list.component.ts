import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { SdsLandingLinkComponent } from '../link/link.component';

@Component({
    selector: 'sds-landing-list',
    templateUrl: 'list.component.html',
    imports: [
        NgClass,
        IconModule,
        SdsLandingLinkComponent,
    ],
})
export class SdsLandingListComponent {
  @Input() list;
}
