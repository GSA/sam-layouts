import { CdkPortalOutletAttachedRef, CdkPortalOutlet } from '@angular/cdk/portal';
import { Component, ComponentRef, Inject, Input, ViewEncapsulation } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { SdsDialogRef, SdsDialogService, SDS_DIALOG_DATA } from '@gsa-sam/components';
import { filter } from 'rxjs/operators';
import { MatTooltip } from '@angular/material/tooltip';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { NgxBootstrapIconsModule, questionCircle } from 'ngx-bootstrap-icons';

interface Data {
  help: [];
}

@Component({
  selector: 'sds-header-help',
  styleUrls: ['./help.component.scss'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      class="usa-button usa-button--unstyled"
      (click)="openSlidePanel()"
      matTooltipClass="help-tooltip"
      matTooltip="Find help articles for features on this page"
      title="Find help articles for features on this page"
    >
      <usa-icon class="text-info" [icon]="'question-circle'" [size]="'2x'"></usa-icon>
    </button>
  `,
  imports: [MatTooltip, IconModule, NgxBootstrapIconsModule.pick({ questionCircle })],
})
export class SdsHeaderHelpComponent {
  @Input() content;

  openedDialogRef: SdsDialogRef<HelpContentComponent>;

  constructor(public dialog: SdsDialogService) {}

  openSlidePanel() {
    this.openedDialogRef = this.dialog.open(HelpContentComponent, {
      hasBackdrop: false,
      height: '100%',
      position: { right: 'true' },
      slideOut: {
        width: '20rem',
        time: '350ms',
      },
      data: {
        help: this.content,
      },
    });
  }
}

@Component({
  template: `
    <div class="help-slide-out bg-base-lighter minh-full padding-x-2 padding-top-2">
      <h2 class="font-heading-lg text-semibold">Help</h2>
      @for (item of data.help; track item) {
        <div>
          <h3 class="font-heading-md text-semibold margin-top-205 margin-bottom-1">
            {{ item.head.title }}
          </h3>
          @for (content of item.body.content; track content) {
            <ng-template [cdkPortalOutlet]="content.component" (attached)="inputs($event, content.inputs)">
            </ng-template>
          }
        </div>
      }
    </div>
  `,
  styles: ['.help-slide-out .sds-list .usa-link:hover { color: #625028; }'], // 508: Contrast fix
  encapsulation: ViewEncapsulation.None,
  imports: [CdkPortalOutlet],
})
export class HelpContentComponent {
  constructor(
    private router: Router,
    public dialogRef: SdsDialogRef<HelpContentComponent>,
    @Inject(SDS_DIALOG_DATA) public data: Data,
  ) {
    this.router.events.pipe(filter((event) => event instanceof NavigationStart)).subscribe(() => {
      this.dialogRef.close();
    });
  }

  inputs(ref: CdkPortalOutletAttachedRef, componentInputs = {}) {
    ref = ref as ComponentRef<never>;
    for (const [input, value] of Object.entries(componentInputs)) {
      ref.instance[input] = value;
    }
  }
}
