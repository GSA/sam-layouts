import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchListLayoutComponent } from './search-list-layout.component';
import { PaginationModule, SdsSearchResultListModule } from '@gsa-sam/components';

@NgModule({
    imports: [CommonModule, FormsModule, PaginationModule, SdsSearchResultListModule, SearchListLayoutComponent],
    exports: [SearchListLayoutComponent],
})
export class SearchListServiceModule {}
