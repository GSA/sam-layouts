import { Component, Input } from '@angular/core';

	@Component({
	standalone: false,
  selector: 'sds-landing-list',
  templateUrl: 'list.component.html',
})
export class SdsLandingListComponent {
  @Input() list;
}
