import { Component, Input } from '@angular/core';
import { Link } from './link.model';

@Component({
  selector: 'sds-landing-link',
  templateUrl: './link.component.html'
})
export class SdsLandingLinkComponent {
  @Input() link;
}
