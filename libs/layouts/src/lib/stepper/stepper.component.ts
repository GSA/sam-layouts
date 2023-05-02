import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SdsStepper } from '@gsa-sam/sam-formly';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sam-layouts-stepper',
  providers: [{ provide: SdsStepper, useExisting: SLStepperComponent }],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
})
export class SLStepperComponent extends SdsStepper {
  @Input() versions: [];
  @Input() expirationDate: string;
  @Input() reviewMode = false;
  @Input() hideSideNav = true;
  @Output() versionChange = new EventEmitter<any>();
  @Output() previousClick = new EventEmitter<any>();
  @Output() nextClick = new EventEmitter<any>();

  versionSelected(event) {
    this.versionChange.emit(event.target.value);
  }

  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    cdr: ChangeDetectorRef
  ) {
    super(router, activatedRoute, cdr);
  }
}
