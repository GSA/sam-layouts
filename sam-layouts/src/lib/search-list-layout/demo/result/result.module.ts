import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResultComponent } from './result.component';
@NgModule({
  imports: [CommonModule, RouterModule, ResultComponent],
  exports: [ResultComponent],
})
export class ResultModule {}
