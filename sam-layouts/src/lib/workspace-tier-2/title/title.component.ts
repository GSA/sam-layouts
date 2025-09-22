import { Component } from '@angular/core';

	@Component({
	standalone: false,
  selector: 'sds-workspace-tier2-title',
  template: `
    <div
      role="heading"
      aria-level="2"
      class="font-sans-xs text-bold margin-bottom-1"
    >
      <ng-content></ng-content>
    </div>
  `,
})
export class SdsWorkspaceTier2TitleComponent {}
