import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SdsFormlyModule } from '@gsa-sam/sam-formly';
import { FormlyModule } from '@ngx-formly/core';
import { SdsToastModule } from '@gsa-sam/components';
import { SystemConfig } from './thread-config-model';
import { GenericThreadComponent } from './thread.component';
import { GenericThreadService } from './thread.service';
import { ThreadMockService } from './thread-mock.service';
import { CommentComponent } from './comment/comment.component';
import { IconModule } from '@gsa-sam/ngx-uswds-icons';
import { NgxBootstrapIconsModule, chevronDown, chevronUp,chatLeftDots } from 'ngx-bootstrap-icons';


@NgModule({
  declarations: [
    GenericThreadComponent,
    CommentComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormlyModule.forChild({
      wrappers: [

      ],
    }),
    SdsFormlyModule,
    SdsToastModule,
    IconModule,
    NgxBootstrapIconsModule.pick({chevronDown,chevronUp,chatLeftDots}),
  ],
  exports: [
    GenericThreadComponent
  ],
  providers: [GenericThreadService, ThreadMockService]
})

export class GenericThreadModule {

  static forRoot(config: SystemConfig): ModuleWithProviders<GenericThreadModule> {
    return {
      ngModule: GenericThreadModule,
      providers: [
        { provide: SystemConfig, useValue: config }
      ]
    };
  }
}

