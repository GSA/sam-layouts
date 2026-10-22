import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { SdsLandingLinkComponent } from './link.component';
import { SdsLandingLinkModule } from './link.module';

describe('SdsLandingLinkComponent', () => {
  let component: SdsLandingLinkComponent;
  let fixture: ComponentFixture<SdsLandingLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, SdsLandingLinkModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdsLandingLinkComponent);
    component = fixture.componentInstance;
  });

  it('renders an external link from its href', () => {
    component.link = { href: 'https://example.com', innerHtml: 'External' };
    fixture.detectChanges();

    const anchor = fixture.debugElement.query(By.css('a')).nativeElement as HTMLAnchorElement;
    expect(anchor.getAttribute('href')).toBe('https://example.com');
    expect(anchor.textContent).toContain('External');
  });

  it('renders an internal link with router navigation attributes', () => {
    component.link = { routerLink: ['/details'], innerHtml: 'Details', queryParams: { tab: 'summary' } };
    fixture.detectChanges();

    const anchor = fixture.debugElement.query(By.css('a')).nativeElement as HTMLAnchorElement;
    expect(anchor.getAttribute('href')).toBe('/details?tab=summary');
    expect(anchor.textContent).toContain('Details');
  });
});
