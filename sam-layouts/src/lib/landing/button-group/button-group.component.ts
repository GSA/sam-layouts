import { Component, Input } from '@angular/core';

	@Component({
	standalone: false,
  selector: 'sds-landing-button-group',
  templateUrl: 'button-group.component.html',
  host: {
    class: 'display-block'
  },
})

export class SdsLandingButtonGroupComponent {
  @Input() buttons: [];
}
