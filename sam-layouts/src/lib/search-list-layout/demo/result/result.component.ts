import { Component, Input } from '@angular/core';
	@Component({
	standalone: false,
  // `result-item` is a legacy, unprefixed selector that does not match the
  // `component-selector` prefix allowlist in `sam-layouts/eslint.config.mjs`
  // (`sds` / `sam-layouts` / `demo`). Demo-only (NOT exported from
  // `src/lib/public-api.ts`), so it is not public API. Disabled here rather
  // than widening the allowlist with a `result` prefix (which would admit
  // arbitrary future `result-*` selectors). Rename to `demo-result-item`
  // alongside the next intentional selector change.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'result-item',
  templateUrl: './result.component.html'
})
export class ResultComponent {
  @Input() model: any;
}
