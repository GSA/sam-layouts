import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import * as core from '@angular/core';

// Restores the `ɵɵStandaloneFeature` runtime export that ngc-18-compiled
// `@gsa-sam/*` bundles reference and Angular 19 removed. This is a no-op unless
// an ngc-18 `@gsa-sam/*` package is actually installed — see the header comment
// in the harness for the full diagnosis and the deletion condition.
const ngc18Compat = require('./test-harness/ngc18-compat.cjs');

ngc18Compat.installStandaloneFeatureShim(core as unknown as Record<string, unknown>);

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});
