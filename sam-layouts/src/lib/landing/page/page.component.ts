import {
  Component,
  Directive,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input,
} from '@angular/core';

	@Component({
	standalone: false,
  selector: 'sds-landing-page-head',
  templateUrl: 'page-head.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdsLandingPageHeadComponent {}

	@Directive({
	standalone: false,
  selector: `[sdsLandingPageTitle]`,
  host: {
    class: 'text-gray-70 text-ls-neg-2',
  },
})
export class SdsLandingPageTitleDirective {}

	@Component({
	standalone: false,
  selector: 'sds-landing-page-header',
  templateUrl: 'page-header.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdsLandingPageHeaderComponent {}

	@Component({
	standalone: false,
  selector: 'sds-landing-page-legacy',
  templateUrl: 'page-legacy.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'grid-col flex-auto text-center',
  },
})
export class SdsLandingPageLegacyComponent {}

	@Directive({
	standalone: false,
  selector: `[sdsLandingPageLegacyLogo]`,
  host: {
    '[class]': "logoSize ? 'height-' + logoSize : 'height-4'",
  },
})
export class SdsLandingPageLegacyLogoDirective {
  @Input() logoSize: string;
}

	@Directive({
	standalone: false,
  selector: `[sdsLandingPageOverview]`,
  host: {
    class: 'display-block margin-top-2',
  },
})
export class SdsLandingPageOverviewDirective {}

	@Directive({
	standalone: false,
  selector: `[sdsLandingPageOverviewParagraph]`,
  host: {
    class: 'font-sans-md line-height-sans-4',
  },
})
export class SdsLandingPageOverviewParagraphDirective {}

	@Directive({
	standalone: false,
  selector: `[sdsLandingPageTile]`,
  host: {
    class: 'grid-col',
  },
})
export class SdsLandingPageTileDirective {}

	@Directive({
	standalone: false,
  selector: `[sdsLandingPageCard]`,
  host: {
    class: '',
  },
})
export class SdsLandingPageCardDirective {}

	@Component({
	standalone: false,
  selector: 'sds-landing-page',
  templateUrl: 'page.component.html',
})
export class SdsLandingPageComponent {}
