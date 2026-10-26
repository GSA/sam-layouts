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

  it('preserves the URL-restored page across equivalent nested filter emissions (#104)', async () => {
    const originalUrl = window.location.href;
    window.history.replaceState({}, '', '?page=3&sfm[keyword][value]=test');
    try {
      fixture.detectChanges();
      await updateFilterAndWait(fixture, { keyword: { value: 'test' } });
      await updateFilterAndWait(fixture, { keyword: { value: 'test' } });
      expect(component.page.pageNumber).toBe(3);
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('preserves a newly restored results-model page after an earlier filter (#104)', async () => {
    fixture.detectChanges();
    await updateFilterAndWait(fixture, { keyword: { value: 'earlier' } });
    component.updateSearchResultsModel({ page: 3, filterModel: { keyword: { value: 'restored' } } });
    await updateFilterAndWait(fixture, { keyword: { value: 'restored' } });
    await updateFilterAndWait(fixture, { keyword: { value: 'restored' } });
    expect(component.page.pageNumber).toBe(3);
  });

  it('resets the page for a different filter even on the first restoration emission (#104)', async () => {
    fixture.detectChanges();
    component.updateSearchResultsModel({ page: 3, filterModel: { keyword: { value: 'restored' } } });
    await updateFilterAndWait(fixture, { keyword: { value: 'changed' } });
    expect(component.page.pageNumber).toBe(1);
  });

  it('does not retain consumer-owned references when restoring a results model (#104)', async () => {
    fixture.detectChanges();
    const filter = { keyword: { value: 'restored' } };
    component.updateSearchResultsModel({ page: 3, filterModel: filter });
    filter.keyword.value = 'changed';
    await updateFilterAndWait(fixture, filter);
    expect(component.page.pageNumber).toBe(1);
  });

  it('resets after an in-place mutation of a previously emitted filter (#104)', async () => {
    fixture.detectChanges();
    const filter = { keyword: { value: 'restored' } };
    component.updateSearchResultsModel({ page: 3, filterModel: filter });
    await updateFilterAndWait(fixture, filter);
    filter.keyword.value = 'changed';
    await updateFilterAndWait(fixture, filter);
    expect(component.page.pageNumber).toBe(1);
  });

  it('preserves the new history page after popstate-style restoration (#104)', async () => {
    const originalUrl = window.location.href;
    try {
      fixture.detectChanges();
      await updateFilterAndWait(fixture, { keyword: { value: 'earlier' } });
      window.history.replaceState({}, '', '?page=4&sfm[keyword][value]=restored');
      component.onpopstate(new PopStateEvent('popstate'));
      await updateFilterAndWait(fixture, { keyword: { value: 'restored' } });
      await updateFilterAndWait(fixture, { keyword: { value: 'restored' } });
      expect(component.page.pageNumber).toBe(4);
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('preserves restored pages through real Formly service emissions (#104)', async () => {
    fixture.detectChanges();
    component.enableApiCall = false;
    const service = TestBed.inject(SDSFormlyUpdateComunicationService);
    component.updateSearchResultsModel({ page: 3, filterModel: { keyword: { value: 'restored' } } });
    service.updateFilter({ keyword: { value: 'restored' } });
    service.updateFilter({ keyword: { value: 'restored' } });
    expect(component.page.pageNumber).toBe(3);
    service.updateFilter({ keyword: { value: 'changed' } });
    expect(component.page.pageNumber).toBe(1);
    await fixture.whenStable();
  });

  it('applies an earlier Formly filter after restoring a different results page (#104)', async () => {
    fixture.detectChanges();
    const requests: SearchParameters[] = [];
    component.service = {
      getData: (search) => {
        requests.push(search);
        return of({ totalItems: 0, items: [] });
      },
    };
    const service = TestBed.inject(SDSFormlyUpdateComunicationService);
    const filterA = { keyword: 'a' };
    const filterB = { keyword: 'b' };
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      service.updateFilter(filterA);
      service.updateFilter(filterA);
      component.updateSearchResultsModel({ page: 3, filterModel: filterB });
      service.updateFilter(filterA);
      await vi.advanceTimersByTimeAsync(100);

      expect(component.page.pageNumber).toBe(1);
      expect(requests.at(-1)?.filter).toEqual(filterA);
    } finally {
      vi.useRealTimers();
    }
  });

  it('applies the first restored Formly filter after an earlier request settles (#104)', async () => {
    fixture.detectChanges();
    const requests: SearchParameters[] = [];
    component.service = {
      getData: (search) => {
        requests.push(search);
        return of({ totalItems: 0, items: [] });
      },
    };
    const service = TestBed.inject(SDSFormlyUpdateComunicationService);
    const filterA = { keyword: 'a' };
    const filterB = { keyword: 'b' };
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      service.updateFilter(filterA);
      await vi.advanceTimersByTimeAsync(100);
      component.updateSearchResultsModel({ page: 3, filterModel: filterB });
      service.updateFilter(filterB);
      await vi.advanceTimersByTimeAsync(100);

      expect(requests.at(-1)?.filter).toEqual(filterB);
      expect(requests.at(-1)?.page.pageNumber).toBe(3);
      expect(component.page.pageNumber).toBe(3);
      service.updateFilter(filterB);
      await vi.advanceTimersByTimeAsync(100);
      expect(requests).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('preserves restored pagination for an equivalent nested empty Formly group (#104)', async () => {
    fixture.detectChanges();
    component.enableApiCall = false;
    const service = TestBed.inject(SDSFormlyUpdateComunicationService);
    component.updateSearchResultsModel({ page: 3, filterModel: { keyword: 'test' } });
    service.updateFilter({ keyword: 'test', location: { city: null } });
    expect(component.page.pageNumber).toBe(3);
    await fixture.whenStable();
  });

  it('preserves the URL-restored page for an equivalent nested Formly class instance (#122)', () => {
    class Selection {
      constructor(public id: string) {}
    }

    const originalUrl = window.location.href;
    window.history.replaceState({}, '', '?page=3&sfm[selection][id]=AL');
    try {
      fixture.detectChanges();
      component.enableApiCall = false;
      TestBed.inject(SDSFormlyUpdateComunicationService).updateFilter({ selection: new Selection('AL') });
      expect(component.page.pageNumber).toBe(3);
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('preserves the URL-restored page when Formly emits an equivalent numeric value (#104)', () => {
    const originalUrl = window.location.href;
    window.history.replaceState({}, '', '?page=3&sfm[count]=0');
    try {
      fixture.detectChanges();
      component.enableApiCall = false;
      TestBed.inject(SDSFormlyUpdateComunicationService).updateFilter({ count: 0 });
      expect(component.page.pageNumber).toBe(3);
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('resets the URL-restored page when Formly adds a null array slot (#104)', () => {
    const originalUrl = window.location.href;
    window.history.replaceState({}, '', '?page=3&sfm[values][0]=x');
    try {
      fixture.detectChanges();
      component.enableApiCall = false;
      TestBed.inject(SDSFormlyUpdateComunicationService).updateFilter({ values: ['x', null] });
      expect(component.page.pageNumber).toBe(1);
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('preserves the URL-restored page when Formly emits an empty array omitted by the URL (#104)', () => {
    const originalUrl = window.location.href;
    window.history.replaceState({}, '', '?page=3&sfm[keyword]=test');
    try {
      fixture.detectChanges();
      component.enableApiCall = false;
      TestBed.inject(SDSFormlyUpdateComunicationService).updateFilter({ keyword: 'test', values: [] });
      expect(component.page.pageNumber).toBe(3);
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('preserves the URL-restored page when Formly emits a group containing only an empty array (#104)', () => {
    const originalUrl = window.location.href;
    window.history.replaceState({}, '', '?page=3&sfm[keyword]=test');
    try {
      fixture.detectChanges();
      component.enableApiCall = false;
      TestBed.inject(SDSFormlyUpdateComunicationService).updateFilter({
        keyword: 'test',
        location: { state: [] },
      });
      expect(component.page.pageNumber).toBe(3);
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('preserves the URL-restored page for arrays beyond the qs array limit (#104)', () => {
    const originalUrl = window.location.href;
    const values = Array.from({ length: 21 }, (_, index) => String(index));
    window.history.replaceState(
      {},
      '',
      `?page=3&${values.map((value, index) => `sfm[values][${index}]=${value}`).join('&')}`,
    );
    try {
      fixture.detectChanges();
      component.enableApiCall = false;
      TestBed.inject(SDSFormlyUpdateComunicationService).updateFilter({ values });
      expect(component.page.pageNumber).toBe(3);
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('preserves the restored URL page immediately for an equivalent Formly emission (#104)', () => {
    const originalUrl = window.location.href;
    window.history.replaceState({}, '', '?page=3&sfm[keyword]=test');
    try {
      fixture.detectChanges();
      component.enableApiCall = false;
      TestBed.inject(SDSFormlyUpdateComunicationService).updateFilter({ keyword: 'test', unused: null });
      expect(component.page.pageNumber).toBe(3);
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('publishes an empty effective model when restoring a null results filter (#104)', () => {
    fixture.detectChanges();
    const modelService = TestBed.inject(SDSFormlyUpdateModelService);
    const updateSpy = vi.spyOn(modelService, 'updateModel');
    component.updateSearchResultsModel({ page: 3, filterModel: null });
    expect(component.page.pageNumber).toBe(3);
    expect(updateSpy).toHaveBeenLastCalledWith({});
    component.enableApiCall = false;
    const effectiveModel = updateSpy.mock.calls.at(-1)![0];
    TestBed.inject(SDSFormlyUpdateComunicationService).updateFilter(effectiveModel);
    expect(component.page.pageNumber).toBe(3);
  });

  it('distinguishes null and empty-object array slots when restoring a page (#104)', () => {
    fixture.detectChanges();
    component.enableApiCall = false;
    component.updateSearchResultsModel({ page: 3, filterModel: { values: [null] } });
    component.updateFilter({ values: [{}] });
    expect(component.page.pageNumber).toBe(1);
  });

  it('keeps results-model restoration type-sensitive (#104)', () => {
    fixture.detectChanges();
    component.enableApiCall = false;
    component.updateSearchResultsModel({ page: 3, filterModel: { count: '0' } });
    component.updateFilter({ count: 0 });
    expect(component.page.pageNumber).toBe(1);
  });

  it('retains false and zero filter values during page comparison (#104)', () => {
    fixture.detectChanges();
    component.enableApiCall = false;
    const filter = { active: false, count: 0 };
    component.updateSearchResultsModel({ page: 3, filterModel: filter });
    component.updateFilter({ active: false, count: 0 });
    expect(component.page.pageNumber).toBe(3);
  });

  it('distinguishes meaningful non-plain filter values during page comparison (#104)', () => {
    fixture.detectChanges();
    component.enableApiCall = false;
    const restored = { date: new Date('2026-01-01T00:00:00.000Z') };
    component.updateSearchResultsModel({ page: 3, filterModel: restored });
    component.updateFilter({ date: new Date('2026-01-02T00:00:00.000Z') });
    expect(component.page.pageNumber).toBe(1);
  });

  it('resets the restored page after a Date is mutated through real Formly emissions (#104)', () => {
    fixture.detectChanges();
    component.enableApiCall = false;
    const service = TestBed.inject(SDSFormlyUpdateComunicationService);
    const date = new Date('2026-01-01T00:00:00.000Z');
    const filter = { date };
    component.updateSearchResultsModel({ page: 3, filterModel: filter });
    service.updateFilter(filter);
    expect(component.page.pageNumber).toBe(3);
    date.setUTCDate(2);
    service.updateFilter(filter);
    expect(component.page.pageNumber).toBe(1);
  });

  it('retains excluded-field request suppression while resetting a changed filter page (#104)', async () => {
    fixture.detectChanges();
    const requests: SearchParameters[] = [];
    component.service = {
      getData: (search) => {
        requests.push(search);
        return of({ totalItems: 1, items: [{ id: 1 }] });
      },
    };
    component.configuration.excludeFilterFields = [{ field: 'presentation', unless: () => false }];
    component.updateSearchResultsModel({ page: 3, filterModel: { keyword: 'restored', presentation: 'list' } });
    await updateFilterAndWait(fixture, { keyword: 'restored', presentation: 'list' });
    expect(requests).toHaveLength(1);
    component.updateFilter({ keyword: 'restored', presentation: 'grid' });
    await fixture.whenStable();
    expect(component.page.pageNumber).toBe(1);
    expect(requests).toHaveLength(1);
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
