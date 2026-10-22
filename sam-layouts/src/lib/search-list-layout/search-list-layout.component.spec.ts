import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SearchListLayoutComponent } from './search-list-layout.component';
import { SearchListServiceModule } from './search-list-layout.module';
import { PaginationModule, SdsSearchResultListModule } from '@gsa-sam/components';
import { FormsModule } from '@angular/forms';
import { SearchParameters, SearchResult, SearchListInterface, ResultsModel } from './model/search-list-layout.model';
import { of, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SDSFormlyUpdateComunicationService, SDSFormlyUpdateModelService } from '@gsa-sam/sam-formly';
import { SimpleChange } from '@angular/core';
import { allIcons, NgxBootstrapIconsModule } from 'ngx-bootstrap-icons';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { allIcons as sdsAllIcons } from '@gsa-sam/ngx-uswds-icons';

describe('SearchListLayoutComponent', () => {
  let component: SearchListLayoutComponent;
  let fixture: ComponentFixture<SearchListLayoutComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        SearchListServiceModule,
        PaginationModule,
        SdsSearchResultListModule,
        FormsModule,
        RouterTestingModule.withRoutes([]),
        NgxBootstrapIconsModule.pick(Object.assign(allIcons, sdsAllIcons)),
        IconModule,
      ],
      // `SearchListLayoutComponent` injects `SDSFormlyUpdateComunicationService`
      // with `@Optional()` but dereferences `.filterUpdate` unguarded in
      // `ngOnInit`, so the test module has to provide it. `@gsa-sam/sam-formly`
      // declares it as a bare `@Injectable()` with no `providedIn`, so it is
      // never available by default.
      providers: [SDSFormlyUpdateModelService, SDSFormlyUpdateComunicationService],
    });
    await TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchListLayoutComponent);
    component = fixture.componentInstance;
    component.configuration = {
      sortList: [{ text: 'Id', value: 'id' }],
      defaultSortValue: 'id',
      pageSize: 25,
    };
    component.service = new TestService();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onSelectChange', async () => {
    component.onSelectChange();
    fixture.detectChanges();
    // The old fakeAsync(() => tick(100)) was never invoked. Await the actual
    // navigation/change-detection work before asserting the default empty list.
    await fixture.whenStable();
    expect(component.items.length).toBe(0);
  });

  it('should call filterUpdate', async () => {
    const filterData = { searchKeyword: 'test', entity: 'testEntity' };
    component.page = {
      pageNumber: 1,
      pageSize: 25,
      totalPages: 0,
      default: true,
    };
    fixture.detectChanges();

    await updateFilterAndWait(fixture, filterData);
    expect(component.page.default).toBe(false);
  });

  it('should call updateFilterModel', () => {
    const service = fixture.debugElement.injector.get(SDSFormlyUpdateModelService);
    const serviceSpy = vi.spyOn(service, 'updateModel');
    const filterData = {
      filterModel: { searchKeyword: 'test', entity: 'testEntity' },
    };
    component.updateSearchResultsModel(filterData);
    fixture.detectChanges();
    expect(serviceSpy).toHaveBeenCalled();
    expect(service.updateModel).toHaveBeenCalled();
  });

  // Regression coverage for GSA/sam-layouts#76 (prototype-shadowing crash).
  // `updateNavigation` parses the live query string with
  // `qs.parse(..., { allowPrototypes: true })`, so a crafted URL such as
  // `?hasOwnProperty=x&sfm=1` produces an OWN `hasOwnProperty` key on
  // `queryObj`, shadowing `Object.prototype.hasOwnProperty`. Calling
  // `queryObj.hasOwnProperty('sfm')` then throws
  // `TypeError: queryObj.hasOwnProperty is not a function` — a user-triggerable
  // crash via the URL. The production code therefore MUST use
  // `Object.prototype.hasOwnProperty.call(queryObj, 'sfm')`; do NOT "simplify"
  // it back to `queryObj.hasOwnProperty(...)`.
  it('does not crash and clears sfm when the URL shadows hasOwnProperty (GSA/sam-layouts#76)', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // jsdom updates window.location from history.replaceState, so this stands
    // up the malicious query string without a real navigation or new deps.
    const originalSearch = window.location.search;
    window.history.replaceState({}, '', '?hasOwnProperty=x&sfm=1');

    try {
      // Call the uncovered path directly; the default arg takes the
      // router.navigate branch.
      expect(() => component.updateNavigation()).not.toThrow();

      expect(navigateSpy).toHaveBeenCalled();
      const queryParams = navigateSpy.mock.calls[0][1].queryParams;
      // The attacker-supplied `sfm=1` must be gone: production clears the sfm
      // slot (`queryObj['sfm'] = {}`) before rebuilding it, so the crafted
      // value never survives into the navigation params. Use the safe
      // prototype method because `queryParams` itself carries an own
      // `hasOwnProperty` key here too.
      expect(Object.prototype.hasOwnProperty.call(queryParams, 'sfm')).toBe(false);
    } finally {
      window.history.replaceState({}, '', originalSearch || '/');
    }
  });

  it('should update sortvalue through updateSearchResultsModel', () => {
    component.configuration = {
      defaultSortValue: 'legalBusinessName',
      pageSize: 25,
      sortList: [
        { text: 'Entity Name', value: 'legalBusinessName' },
        { text: 'Status', value: 'registrationStatus' },
      ],
    };
    fixture.detectChanges();

    const config: ResultsModel = { sort: 'registrationStatus', filterModel: {} };
    component.updateSearchResultsModel(config);
    fixture.detectChanges();
    expect(component.sortField).toBe('registrationStatus');
  });
});

// Regression coverage for GSA/sam-layouts#63:
// `SDSFormlyUpdateComunicationService` is injected with `@Optional()`, so
// consumers are explicitly permitted to render `search-list-layout` without
// providing it. ngOnInit must not throw in that case.
describe('SearchListLayoutComponent without SDSFormlyUpdateComunicationService', () => {
  let component: SearchListLayoutComponent;
  let fixture: ComponentFixture<SearchListLayoutComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        SearchListServiceModule,
        PaginationModule,
        SdsSearchResultListModule,
        FormsModule,
        RouterTestingModule.withRoutes([]),
        NgxBootstrapIconsModule.pick(Object.assign(allIcons, sdsAllIcons)),
        IconModule,
      ],
      // Intentionally omit `SDSFormlyUpdateComunicationService` from providers
      // to reproduce the absent-service path permitted by `@Optional()`.
      providers: [SDSFormlyUpdateModelService],
    });
    await TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchListLayoutComponent);
    component = fixture.componentInstance;
    component.configuration = {
      sortList: [{ text: 'Id', value: 'id' }],
      defaultSortValue: 'id',
      pageSize: 25,
    };
    component.service = new TestService();
  });

  it('does not throw on ngOnInit when the service is absent', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('still updates the filter when triggered directly, with no formly subscription', async () => {
    fixture.detectChanges();

    const filterData = { searchKeyword: 'test', entity: 'testEntity' };
    await updateFilterAndWait(fixture, filterData);
    expect(component.page.default).toBe(false);
  });
});

async function updateFilterAndWait(fixture: ComponentFixture<SearchListLayoutComponent>, filterData: object) {
  const component = fixture.componentInstance;
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  try {
    component.updateFilter(filterData);
    // Direct method calls do not notify Angular's zoneless scheduler.
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(component.loading).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.items).toEqual([{ id: 1 }]);
    expect(component.loading).toBe(false);
  } finally {
    vi.useRealTimers();
  }
}

class TestService implements SearchListInterface {
  getData(search: SearchParameters): Observable<SearchResult> {
    return of({
      totalItems: 1,
      items: [{ id: 1 }],
    });
  }
}
