import { NgModule } from '@angular/core';
import { SdsWorkspaceTier2LabelDotComponent } from './label-dot.component';
import { SdsWorkspaceTier2LabelComponent } from './label.component';

@NgModule({
  imports: [SdsWorkspaceTier2LabelComponent, SdsWorkspaceTier2LabelDotComponent],
  exports: [SdsWorkspaceTier2LabelComponent, SdsWorkspaceTier2LabelDotComponent],
  providers: [],
})
export class SdsWorkspaceTier2LabelModule {}
