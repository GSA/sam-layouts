import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  TemplateRef,
} from '@angular/core';
import { SdsDrawerCommunicationService } from './drawer-communication.service';

@Component({
  selector: 'sds-subheader',
  templateUrl: 'subheader.component.html',
  styleUrls: ['subheader.component.scss'],
})
export class SdsSubheaderComponent {
  constructor() { }
}

@Component({
  selector: 'sds-subheader-actions',
  templateUrl: 'subheader-actions.component.html',
})
export class SdsSubheaderActionsComponent {
  @Input() mobileTabletStyle: SUBHEADERACTIONSTYLE = SUBHEADERACTIONSTYLE.DEFAULT;
  @Input() model;
  @Output() clicks = new EventEmitter<string>();
  getButtonStyle() {

    let addedCSS = '';
    switch (this.mobileTabletStyle) {

      case SUBHEADERACTIONSTYLE.DEFAULT:
        addedCSS = 'usa-button sds-button--circle sds-button--white';
        break;
      case SUBHEADERACTIONSTYLE.PRIMARY:
        addedCSS = 'usa-button sds-button--circle ';
        break;
      case SUBHEADERACTIONSTYLE.SECONDARY:
        addedCSS = 'usa-button sds-button--circle usa-button--secondary';
        break;
      case SUBHEADERACTIONSTYLE.SECONDARY_DARK:
        addedCSS = 'sds-button sds-button--circular sds-button--secondary';
        break;
      case SUBHEADERACTIONSTYLE.ACCENT_COOL:
        addedCSS = 'usa-button sds-button--circle usa-button--accent-cool';
        break;
      case SUBHEADERACTIONSTYLE.DANGER:
        addedCSS = 'usa-button sds-button--circle sds-button--danger';
        break;
      case SUBHEADERACTIONSTYLE.OUTLINE:
        addedCSS = 'usa-button sds-button--circle usa-button--outline';
        break;
      case SUBHEADERACTIONSTYLE.OUTLINE_SECONDARY:
        addedCSS = 'usa-button sds-button--circle usa-button--outline usa-button--secondary';
        break;
      case SUBHEADERACTIONSTYLE.WHITE:
        addedCSS = 'usa-button sds-button--circle sds-button--white';
        break;
      default:
        break;
    }

    return addedCSS;
  }

  constructor() { }
}

export enum SUBHEADERACTIONSTYLE {
  DEFAULT, PRIMARY, SECONDARY, SECONDARY_DARK, OUTLINE, OUTLINE_SECONDARY, WHITE, ACCENT_COOL, DANGER
}

@Component({
  selector: 'sds-subheader-drawer',
  templateUrl: 'subheader-drawer.component.html',
})
export class SdsSubheaderDrawerComponent implements OnInit {
  @Input() drawerContentTemplate: TemplateRef<any>;
  @Output() isDrawerOpen = new EventEmitter<boolean>();
  isOpen = false;

  constructor(public data: SdsDrawerCommunicationService) { }
  onDrawerOpenClose(ev) {
    this.isOpen = !this.isOpen;
    this.data.onDrawerOpen(this.isOpen, this.drawerContentTemplate);
  }
  ngOnInit() { }
}

@Component({
  selector: 'sds-drawer-content',
  templateUrl: 'drawer.content.component.html',
})
export class SdsDrawerContentComponent implements OnInit {
  drawerContentTemplate: TemplateRef<any>;
  isDrawerOpen = false;

  constructor(public data: SdsDrawerCommunicationService) { }
  ngOnInit() {
    this.data.contentTemplate.subscribe(
      (template) => (this.drawerContentTemplate = template)
    );
    this.data.isDrawerOpen.subscribe((open) => (this.isDrawerOpen = open));
  }
}
