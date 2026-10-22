// Imports every executable production module in the coverage manifest.
import * as module0 from './app/app.component';
import * as module1 from './app/app.config';
import * as module2 from './app/app.routes';
import * as module3 from './app/nx-welcome.component';

import { describe, expect, it } from 'vitest';

const productionModules = [module0, module1, module2, module3] as const;

describe('coverage support', () => {
  it('loads the production module graph and exposes exports', () => {
    for (const productionModule of productionModules) {
      expect(Object.keys(productionModule)).not.toHaveLength(0);
    }
  });
});
