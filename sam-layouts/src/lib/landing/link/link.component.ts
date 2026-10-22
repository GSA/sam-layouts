import { Component, Input } from '@angular/core';
import { Link } from './link.model';
import { SdsExternalLinkDirectivesModule } from '@gsa-sam/components';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sds-landing-link',
  templateUrl: './link.component.html',
  imports: [SdsExternalLinkDirectivesModule, NgClass, RouterLink],
})
export class SdsLandingLinkComponent {
  @Input() link;
}
