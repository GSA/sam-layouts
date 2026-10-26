import {
  Component,
  Input,
  ContentChild,
  TemplateRef,
  Optional,
  OnChanges,
  SimpleChanges,
  OnInit,
  ChangeDetectorRef,
  HostListener,
  Output,
  EventEmitter,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import * as qs from 'qs';
import { SearchListInterface, SearchListConfiguration, ResultsModel } from './model/search-list-layout.model';
import { distinctUntilChanged } from 'rxjs/operators';
import { SDSFormlyUpdateComunicationService, SDSFormlyUpdateModelService } from '@gsa-sam/sam-formly';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash-es';
import { Location, NgTemplateOutlet } from '@angular/common';
import { PaginationModule, SdsSearchResultListModule } from '@gsa-sam/components';
import { FormsModule } from '@angular/forms';

@Component({
  // `search-list-layout` is a legacy, unprefixed selector that does not match
  // the `component-selector` prefix allowlist in `sam-layouts/eslint.config.mjs`
  // (`sds` / `sam-layouts` / `demo`). This component IS exported from
  // `src/lib/public-api.ts`, so the selector is PUBLIC API: consumers render
  // `<search-list-layout>` directly (see the @Optional() regression note in
  // `search-list-layout.component.spec.ts`), and renaming it is a breaking,
  // consumer-visible change. Disabled here rather than widening the allowlist
  // with a `search` prefix (which would admit arbitrary future `search-*`
  // selectors). Rename to a prefixed selector alongside the Wave 3
  // Angular 20 -> 21 breaking slice of GSA/sam-layouts#52.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'search-list-layout',
  templateUrl: './search-list-layout.component.html',
  styleUrls: ['./search-list-layout.component.scss'],
  imports: [PaginationModule, FormsModule, SdsSearchResultListModule, NgTemplateOutlet],
})
export class SearchListLayoutComponent implements OnInit {
  /**
   * Child Template to be used to display the data for each item in the list of items
   */
  @ContentChild('resultContent') resultContentTemplate: TemplateRef<any>;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    @Optional()
    private formlyUpdateComunicationService: SDSFormlyUpdateComunicationService,
    private filterUpdateModelService: SDSFormlyUpdateModelService,
    private loc: Location,
  ) {}

  /**
   * Input service to be called when items change
   */
  @Input() service: SearchListInterface;

  /**
   * Allow to insert a customized template for no results to use
   */
  @Input() customResultsTemplate: TemplateRef<any>;

  @Input() isHistoryEnabled = true;
  /**
   * configuration
   */
  @Input() configuration: SearchListConfiguration;

  @Input() enableApiCall = true;

  /**
   * Allow to insert a customized template for default model search message
   */
  @Input() templateForDefaultModel: TemplateRef<any>;

  @Output() sortFieldChange = new EventEmitter<string>();

  /**
   * Set to true when either filter is empty or filter is equal to default model
   */
  isDefaultModel = true;

  /**
   * Filter information
   */
  private filterData: any;

  /**
   * Total number of items
   */
  totalItems: number;
  private formlySubscription: Subscription;

  /**
   * Default Page setttings
   */
  page = {
    pageNumber: 1,
    pageSize: 25,
    totalPages: 0,
    default: true,
  };

  /**
   * Id of the top pagination control
   */
  top = { id: 'topPagination' };

  /**
   * Id of the bottom pagination control
   */
  bottom = { id: 'bottomPagination' };

  /**
   * Page event listener
   */
  public paginationChange = new BehaviorSubject<object>(this.page);

  /**
   * List of items to be displayed
   */
  items = [];

  /**
   * sort value
   */
  public sortField = '';

  /**
   * Value to track whether API call in progress for purpose of showing loading
   * template
   */
  loading = false;

  /**
   * Used in ngFor to create multiple copies of the same loading row.
   */
  loadingArray = Array(25);

  /**
   * Used to track whether update resulting in navigation is as the result of a
   * popstate. in order to apply correct navigation logic
   */
  private triggeredByPopState = false;

  private skipUpdate = false;

  // Introduce a variable to store the last distinct filter state
  private lastKnownFilter = null;
  private restorationEmissionPending = false;

  // The filter associated with the current page must not share consumer-owned references.
  private pageFilter: unknown;
  private hasPageFilter = false;
  private pageFilterFromUrl = false;

  @HostListener('window:popstate', ['$event'])
  onpopstate(event) {
    this.triggeredByPopState = true;
    if (this.isHistoryEnabled) {
      this.getHistoryModel();
    }
  }

  ngOnInit() {
    if (this.isHistoryEnabled) {
      this.getHistoryModel();
    }
    this.sortField = this.sortField != null ? this.sortField : this.configuration.defaultSortValue;
    this.paginationChange.subscribe(() => {
      this.updateContent();
    });
    if (this.formlyUpdateComunicationService) {
      this.formlySubscription = this.formlyUpdateComunicationService.filterUpdate
        .pipe(
          distinctUntilChanged((prev, curr) => {
            const normalized = this.normalizeFilterForComparison(curr);
            if (this.restorationEmissionPending) {
              this.restorationEmissionPending = false;
              this.lastKnownFilter = normalized;
              return false;
            }
            if (this.triggeredByPopState) {
              this.lastKnownFilter = normalized; // Sync with the restored filter snapshot
              return false; // Allow this event through
            }

            // Compare the effective Formly model. Form controls that are empty
            // are represented as null by Formly and are omitted by the filters
            // component's clean model, so they must not reset a restored page.
            const isEqual = _.isEqual(this.lastKnownFilter, normalized);
            this.lastKnownFilter = normalized;
            return isEqual; // Only pass genuinely different events afterward
          }),
        )
        .subscribe((filter) => {
          // RxJS does not call the comparator for the stream's first emission.
          // Snapshot every accepted emission so restoration is consumed there too.
          this.restorationEmissionPending = false;
          this.lastKnownFilter = this.normalizeFilterForComparison(filter);
          this.updateFilter(filter);
        });
    }
  }

  ngOnDestroy() {
    // Reset filter Model in update service
    this.filterUpdateModelService.updateModel(null);

    if (this.formlySubscription) {
      this.formlySubscription.unsubscribe();
    }
  }

  getHistoryModel() {
    const queryString = window.location.search.substring(1);
    const params: any = this.getUrlParams(queryString);
    const paramModel: any = this.convertToModel(params);

    this.page.default = true;
    this.page.pageNumber = paramModel['page'] ? +paramModel['page'] : 1;
    this.page.pageSize = paramModel['pageSize'] ? Number.parseInt(paramModel['pageSize']) : this.configuration.pageSize;

    this.sortField = paramModel['sort'];
    this.pageFilter = _.cloneDeep(paramModel['sfm'] ?? this.configuration.defaultFilterValue);
    this.hasPageFilter = true;
    this.pageFilterFromUrl = true;
    if (this.filterUpdateModelService) {
      if (paramModel && paramModel['sfm']) {
        this.filterUpdateModelService.updateModel(paramModel['sfm']);
      } else if (!this.triggeredByPopState) {
        this.filterUpdateModelService.updateModel(this.configuration.defaultFilterValue);
      }
    }
  }

  /**
   * updates the filter and set the page number to 1 and calls imported service
   * @param filter - the updated filter model
   */
  public updateFilter(filter: any) {
    const skip = (excluded, filter) => {
      return excluded.unless && excluded.unless(filter)
        ? false
        : _.get(filter, excluded.field) !== _.get(this.filterData, excluded.field);
    };

    if (
      this.configuration.excludeFilterFields &&
      this.configuration.excludeFilterFields.length > 0 &&
      this.filterData
    ) {
      this.skipUpdate = this.configuration.excludeFilterFields.some((excluded) => skip(excluded, filter));
    }

    this.filterData = filter;
    const normalizedPageFilter = this.normalizeFilterForComparison(this.pageFilter);
    const normalizedFilter = this.normalizeFilterForComparison(filter);
    const preservePage = this.hasPageFilter
      ? this.pageFilterFromUrl
        ? _.isEqual(
            this.normalizeUrlFilterForComparison(normalizedPageFilter),
            this.normalizeUrlFilterForComparison(normalizedFilter),
          )
        : _.isEqual(normalizedPageFilter, normalizedFilter)
      : this.page.default;
    this.page.pageNumber = preservePage ? this.page.pageNumber : 1;
    this.pageFilter = _.cloneDeep(filter);
    this.hasPageFilter = true;
    this.pageFilterFromUrl = false;
    this.page.default = filter ? false : true;
    if (this.skipUpdate === false) {
      this.isDefaultFilter(filter);
      if (this.isDefaultModel) {
        this.items = [];
      }
    }
    this.updateContent(true);
  }

  private normalizeFilterForComparison(filter: unknown): unknown {
    if (filter == null) {
      return {};
    }
    if (Array.isArray(filter)) {
      // Null entries are meaningful positions in a Formly model; do not turn
      // them into empty objects or collapse them while cleaning controls.
      return filter.map((value) => (value == null ? value : this.normalizeFilterForComparison(value)));
    }
    if (typeof filter === 'object') {
      const prototype = Object.getPrototypeOf(filter);
      // Formly control models are plain objects. Other values (for example a
      // Date) carry semantics that must survive comparison, but must not retain
      // consumer-owned references in the communication stream's snapshot.
      if (prototype !== Object.prototype && prototype !== null) {
        return _.cloneDeep(filter);
      }
      return Object.keys(filter as object).reduce(
        (result, key) => {
          const value = (filter as Record<string, unknown>)[key];
          if (value != null) {
            const normalized = this.normalizeFilterForComparison(value);
            if (!(this.isPlainObject(normalized) && Object.keys(normalized).length === 0)) {
              result[key] = normalized;
            }
          }
          return result;
        },
        {} as Record<string, unknown>,
      );
    }
    return filter;
  }

  private normalizeUrlFilterForComparison(filter: unknown): unknown {
    if (Array.isArray(filter)) {
      return filter.map((value) => (value == null ? value : this.normalizeUrlFilterForComparison(value)));
    }
    if (this.isPlainObject(filter)) {
      const keys = Object.keys(filter);
      // qs parses arrays above its default limit as index-keyed objects. Turn
      // contiguous numeric keys back into arrays so they compare with Formly.
      if (keys.length > 0 && keys.every((key, index) => key === index.toString())) {
        return keys.map((key) => this.normalizeUrlFilterForComparison(filter[key]));
      }
      return keys.reduce(
        (result, key) => {
          const normalized = this.normalizeUrlFilterForComparison(filter[key]);
          // Empty arrays and recursively empty plain-object controls have no
          // URL representation, but array slots remain meaningful.
          if (
            !(Array.isArray(normalized) && normalized.length === 0) &&
            !(this.isPlainObject(normalized) && Object.keys(normalized).length === 0)
          ) {
            result[key] = normalized;
          }
          return result;
        },
        {} as Record<string, unknown>,
      );
    }

    // Compare scalar leaves as the URL would represent them while retaining
    // the surrounding object and array structure (including null slots).
    const serialized = this.convertToParam({ value: filter });
    if (typeof serialized === 'object' && serialized !== null && Object.hasOwn(serialized, 'value')) {
      return serialized['value'];
    }
    // Non-plain values that serialize to nested keys must not all collapse to
    // undefined; retain their complete serialized representation instead.
    return serialized;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  isDefaultFilter(filter) {
    const cleanModel = this.flatten(filter);
    const op = this.flatten(this.configuration.defaultFilterValue);
    this.isDefaultModel = this.configuration.isDefaultFilter?.(filter) ?? _.isEqual(cleanModel, op);
  }

  flatten(input, reference?, output?) {
    output = output || {};
    for (let key in input) {
      const value = input[key];
      if (value) {
        key = reference ? reference + '.' + key : key;
        if (typeof value === 'object' && value !== null) {
          this.flatten(value, key, output);
        } else {
          // Treat true string as boolean value & ignore value of string 'false'
          if (value === 'true') {
            output[key] = true;
          } else if (value != 'false') {
            output[key] = value;
          }
        }
      }
    }
    return output;
  }

  updateNavigation(triggeredByFilter = false) {
    const queryString = window.location.search.substring(1);
    const queryObj = qs.parse(queryString, { allowPrototypes: true });

    let skipHistoryOnNav = false;

    if (Object.prototype.hasOwnProperty.call(queryObj, 'sfm')) {
      queryObj['sfm'] = {};
    }

    // Prevent recursive navigation when adding default page to search
    if (!queryObj.page || !queryObj.pageSize) {
      skipHistoryOnNav = true;
    }

    queryObj['page'] = this.page.pageNumber ? this.page.pageNumber.toString() : '1';
    queryObj['pageSize'] = this.page.pageSize ? this.page.pageSize.toString() : '25';

    queryObj['sort'] = this.sortField ? this.sortField.toString() : '';
    queryObj['sfm'] = this.filterData;

    const params = this.convertToParam(queryObj);
    /**
     * loc.go updates URL but also updates history stack so that upon clicking
     * back, the state which clicking forward would move user to is deleted by
     * loc.go This state is preserved by router.navigate, so use router.navigate
     * where we state needs to be preserved or we want the page jumped to the top.
     * use loc.go only where we need the page to remain in place, and would normally
     * overwrite the top of the history stack
     */
    if (!triggeredByFilter || this.triggeredByPopState) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: params,
        queryParamsHandling: this.configuration.queryParamsHandling,
        fragment: window.location.hash?.length > 1 ? window.location.hash.substring(1) : undefined,
        replaceUrl: skipHistoryOnNav || this.triggeredByPopState,
      });
      this.triggeredByPopState = false;
    } else {
      const urlTree = this.router.parseUrl(this.loc.path());
      urlTree.queryParams = params;
      urlTree.fragment = window.location.hash?.length > 1 ? window.location.hash.substring(1) : undefined;
      this.loc.go(urlTree.toString());
    }
  }

  convertToParam(filters) {
    const encodedValues = qs.stringify(filters, {
      skipNulls: true,
      encodeValuesOnly: true,
    });
    if (encodedValues) {
      return this.getUrlParams(encodedValues);
    } else {
      return '';
    }
  }

  getUrlParams(queryString) {
    const searchParams = new URLSearchParams(queryString);
    const target = {};
    searchParams.forEach((value, key) => {
      target[key] = value;
    });
    return target;
  }

  convertToModel(filters) {
    let obj = {};
    const encodedValues = qs.stringify(filters, {
      skipNulls: true,
      encode: false,
    });
    obj = qs.parse(encodedValues, { decoder: this.convertToModelParser });
    return obj;
  }

  /**
   * Decoder for qs.parse to convert true / false strings to boolean values
   */
  convertToModelParser(str: string, decoder: qs.defaultDecoder, charset: string, type: 'key' | 'value') {
    if (type === 'key') {
      return decoder(str, decoder, charset);
    }

    if (str === 'true' || str === 'false') {
      return str === 'true' ? true : false;
    }

    return decoder(str, decoder, charset);
  }

  /**
   * Sorty by change event
   */
  onSelectChange() {
    this.page.pageNumber = 1;
    this.updateContent();
    this.sortFieldChange.emit(this.sortField);
  }

  /**
   * calls service when updated
   */
  private updateContent(triggeredByFilter = false) {
    if (this.isHistoryEnabled) {
      this.updateNavigation(triggeredByFilter);
    }

    if (this.filterData && this.service && this.enableApiCall && !this.isDefaultModel && this.skipUpdate === false) {
      this.loading = true;

      setTimeout(() => {
        this.service
          .getData({
            page: this.page,
            sortField: this.sortField,
            filter: this.filterData,
          })
          .subscribe(
            (result) => {
              this.loading = false;
              this.items = result.items;
              this.page.totalPages = Math.ceil(result.totalItems / this.page.pageSize);
              this.totalItems = result.totalItems;
            },
            (error) => (this.loading = false),
            () => (this.loading = false),
          );
      });
    }
  }

  public updateSearchResultsModel(historyModel: ResultsModel) {
    this.filterData = historyModel.filterModel;
    this.pageFilter = _.cloneDeep(historyModel.filterModel);
    // Reconcile the communication stream with the newly restored snapshot:
    // an in-flight old value must remain observable if it differs from this
    // restoration, rather than being suppressed by stale deduplication state.
    this.lastKnownFilter = this.normalizeFilterForComparison(historyModel.filterModel);
    this.restorationEmissionPending = true;
    this.hasPageFilter = true;
    this.pageFilterFromUrl = false;
    this.page.default = historyModel.page || historyModel.sort ? true : false;
    this.page.pageNumber = historyModel.page ? historyModel.page : 1;
    this.sortField = historyModel.sort ? historyModel.sort : this.sortField;
    if (this.filterUpdateModelService) {
      if (historyModel && historyModel.filterModel) {
        this.filterUpdateModelService.updateModel(historyModel.filterModel);
      } else {
        this.filterUpdateModelService.updateModel({});
      }
    }
  }
}
