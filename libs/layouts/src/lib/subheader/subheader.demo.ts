import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  SDSAutocompletelConfiguration,
  SDSSelectedItemModel,
  SearchSettings,
  SelectionMode,
} from '@gsa-sam/components';
import { AutocompleteService } from './examples/services/autocomplete.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'demo-subheader',
  template: `
    <sds-subheader>
      <button class="sds-button sds-button--circular">
        <usa-icon [icon]="'chevron-left'"></usa-icon>
        <span class="usa-sr-only">Go Back</span>
      </button>

      <span class="sds-navbar__title">Contract Opportunities</span>

      <ng-content></ng-content>

      <ng-container *ngIf="showButtons" subheader-buttons-container>
        <button class="usa-button usa-button--secondary grid-col-6">
          Button
        </button>
        <button class="usa-button grid-col-6">Button</button>
      </ng-container>

      <sds-search
        *ngIf="showSearch"
        [(ngModel)]="searchModel"
        [searchSettings]="searchSettings"
        (submit)="searchSubmit($event)"
      >
      </sds-search>

      <sds-autocomplete
        *ngIf="showAutocomplete"
        [service]="autocompleteService"
        [(ngModel)]="autocompleteModel"
        [configuration]="autocompleteSettings"
      >
      </sds-autocomplete>

      <ng-container *ngIf="showButtonGroup" subheader-buttongroup-container>
        <sds-button-group
          [mode]="'radio'"
          class="sds-button-group sds-button-group--secondary"
        >
          <sds-button-group-option
            [checked]="true"
            value="selected"
            [aria-label]="'selected'"
          >
            Selected
          </sds-button-group-option>
          <sds-button-group-option value="button1" [aria-label]="'button1'">
            Button 1
          </sds-button-group-option>
          <sds-button-group-option value="button2" [aria-label]="'button2'">
            Button 2
          </sds-button-group-option>
        </sds-button-group>
      </ng-container>

      <sds-subheader-actions
        [model]="actionsModel"
        (clicks)="actionsClicks.emit($event)"
      >
      </sds-subheader-actions>
    </sds-subheader>
  `,
})
export class DemoSubheaderComponent {
  @Input() showButtons = false;
  @Input() showSearch = false;
  @Input() showAutocomplete = false;
  @Input() showButtonGroup = false;
  @Output() actionsClicks = new EventEmitter<string>();

  constructor(public autocompleteService: AutocompleteService) {
    this.autocompleteSetup();
  }

  autocompleteSettings = new SDSAutocompletelConfiguration();

  autocompleteModel = new SDSSelectedItemModel();

  actionsModel = {
    actions: [
      { id: 'Download', text: 'Download' },
      { id: 'Follow', text: 'Follow' },
      { id: 'Share', text: 'Share' },
    ],
  };

  searchModel = {};
  searchSettings: SearchSettings = {
    placeholder: 'Enter an entity ID, name, or keyword',
    parentSelector: '.sds-subheader__content',
    inputClass:
      'width-card-lg widescreen:width-mobile display-none desktop-lg:display-inline-block',
    size: 'small',
    ariaLabel: 'Search Entity',
    dropdown: {},
  };

  searchSubmit(model) {
    console.log('Search Submitted', model);
  }

  autocompleteSetup() {
    this.autocompleteSettings.id = 'autocompleteBasic';
    this.autocompleteSettings.primaryKeyField = 'id';
    this.autocompleteSettings.primaryTextField = 'name';
    this.autocompleteSettings.secondaryTextField = 'subtext';
    this.autocompleteSettings.labelText = 'Autocomplete 1';
    this.autocompleteSettings.selectionMode = SelectionMode.SINGLE;
    this.autocompleteSettings.autocompletePlaceHolderText = 'Enter text';
  }
}
