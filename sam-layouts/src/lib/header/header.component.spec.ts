/* tslint:disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdsHeaderComponent } from './header.component';
import { RouterTestingModule } from '@angular/router/testing';

import { NavigationMode } from '@gsa-sam/components';
import { group_8_login_gov_icon } from './header.module';

describe('SdsHeaderComponent', () => {
  let component: SdsHeaderComponent;
  let fixture: ComponentFixture<SdsHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, SdsHeaderComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SdsHeaderComponent);
    component = fixture.componentInstance;
    component.model = {
      home: { text: '', logo: '', id: 'home', route: '', selected: false, mode: NavigationMode.INTERNAL },
      navigationLinks: [
        {
          text: '',
          selected: false,
          route: '',
          children: [
            { text: '', selected: false, route: '', children: [], id: 'childLink', mode: NavigationMode.INTERNAL },
          ],
          id: 'navLink',
          mode: NavigationMode.INTERNAL,
        },
      ],
      secondaryLinks: [
        {
          text: '',
          selected: false,
          route: '',
          id: 'secNavLink',
          hasCounter: false,
          imageClass: '',
          mode: NavigationMode.INTERNAL,
        },
      ],
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the Login.gov SVG when imported standalone without SdsHeaderModule or a global icon registry', () => {
    component.model.secondaryLinks[0].imageClass = 'group_8_login_gov_icon';
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('#secNavLink usa-icon svg');
    expect(svg).not.toBeNull();
    expect(svg.querySelector('path[id="Fill-1"]')).not.toBeNull();
    expect(group_8_login_gov_icon).toContain('Fill-1');
  });

  it('should remove white space', () => {
    const before = 'T E S T';
    const after = 'TEST';
    expect(component.removeWhiteSpace(before)).toBe(after);
  });

  it('find should be null when model is empty', () => {
    expect(component.find('')).toBe(null);
  });

  it('home find / select /deselect', () => {
    expect(component.find(component.model.home.id)).toBe(component.model.home);

    expect(component.model.home.selected).toBe(false);
    component.select(component.model.home.id);
    expect(component.model.home.selected).toBe(true);
    component.deselect();
    expect(component.model.home.selected).toBe(false);
  });

  it('navigation link find / select /deselect', () => {
    expect(component.find(component.model.navigationLinks[0].id)).toBe(component.model.navigationLinks[0]);
    component.select(component.model.navigationLinks[0].id);
    expect(component.model.navigationLinks[0].selected).toBe(true);
    component.deselect();
    expect(component.model.navigationLinks[0].selected).toBe(false);
  });

  it('secondary navigation link find / select /deselect', () => {
    expect(component.find(component.model.secondaryLinks[0].id)).toBe(component.model.secondaryLinks[0]);

    component.select(component.model.secondaryLinks[0].id);
    expect(component.model.secondaryLinks[0].selected).toBe(true);
    component.deselect();
    expect(component.model.secondaryLinks[0].selected).toBe(false);
  });

  it('navigation link child find / select /deselect', () => {
    expect(component.find(component.model.navigationLinks[0].children[0].id)).toBe(
      component.model.navigationLinks[0].children[0],
    );
    component.select(component.model.navigationLinks[0].children[0].id);
    expect(component.model.navigationLinks[0].children[0].selected).toBe(true);
    component.deselect();
    expect(component.model.navigationLinks[0].children[0].selected).toBe(false);
  });

  it('has counter ', () => {
    expect(component.hasCounter()).toBe(false);
    component.model.secondaryLinks[0].hasCounter = true;
    expect(component.hasCounter()).toBe(true);
  });

  it('event click', () => {
    const navItem = { mode: NavigationMode.EVENT, text: 'test', route: '/' };
    vi.spyOn(component.linkEvent, 'emit');
    component.linkClickEvent(navItem);
    expect(component.linkEvent.emit).toHaveBeenCalledWith(navItem);
  });
});
