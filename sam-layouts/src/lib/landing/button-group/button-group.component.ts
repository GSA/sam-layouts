import { Component, Input } from '@angular/core';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
    selector: 'sds-landing-button-group',
    templateUrl: 'button-group.component.html',
    host: {
        class: 'display-block',
    },
    imports: [
        IconModule,
        RouterLink,
        NgClass,
    ],
})
export class SdsLandingButtonGroupComponent {
  @Input() buttons: [];
}
