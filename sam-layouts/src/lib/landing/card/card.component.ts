import { Component, Directive } from '@angular/core';

	@Directive({
	standalone: false,
  selector: `[sdsLandingCardTitle]`,
  host: {
    class: 'sds-card__title',
  },
})
export class SdsLandingCardTitleDirective {}

	@Component({
	standalone: false,
  selector: 'sds-landing-card',
  templateUrl: './card.component.html',
})
export class SdsLandingCardComponent {}
