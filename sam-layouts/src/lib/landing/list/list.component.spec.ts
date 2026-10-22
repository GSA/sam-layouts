import { TestBed } from '@angular/core/testing';
import { SdsLandingListComponent } from './list.component';

describe('SdsLandingListComponent imported directly', () => {
  it('renders the custom green-arrow icon without its compatibility module', async () => {
    await TestBed.configureTestingModule({ imports: [SdsLandingListComponent] }).compileComponents();

    const fixture = TestBed.createComponent(SdsLandingListComponent);
    fixture.componentInstance.list = {
      title: 'Links',
      iconList: true,
      items: [{ text: 'Example', icon: { icon: 'arrow-right-circle-green', classes: [] } }],
    };
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('li usa-icon svg');
    expect(svg).not.toBeNull();
    expect(svg.querySelector('path')).not.toBeNull();
    expect(svg.classList.contains('bg-primary')).toBe(true);
  });
});
