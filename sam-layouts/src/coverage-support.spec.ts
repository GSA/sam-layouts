// Smoke-load every executable production module in the checked-in coverage scope.
// This intentionally validates module evaluation/exports, not application behavior.
import { describe, expect, it } from 'vitest';
import * as module0 from './lib/footer/footer.component';
import * as module1 from './lib/footer/footer.module';
import * as module2 from './lib/header/header.component';
import * as module3 from './lib/header/header.module';
import * as module4 from './lib/header/help.component';
import * as module5 from './lib/landing/button-group/button-group.component';
import * as module6 from './lib/landing/button-group/button-group.module';
import * as module7 from './lib/landing/card/card.component';
import * as module8 from './lib/landing/card/card.module';
import * as module9 from './lib/landing/link/link.component';
import * as module11 from './lib/landing/link/link.module';
import * as module12 from './lib/landing/list/list.component';
import * as module13 from './lib/landing/list/list.module';
import * as module14 from './lib/landing/page/page.component';
import * as module15 from './lib/landing/page/page.module';
import * as module16 from './lib/layouts.module';
import * as module17 from './lib/public-api';
import * as module18 from './lib/sds-feedback/sds-feedback.component';
import * as module19 from './lib/sds-feedback/sds-feedback.module';
import * as module20 from './lib/search-list-layout/search-list-layout.component';
import * as module21 from './lib/search-list-layout/search-list-layout.module';
import * as module22 from './lib/stepper/footer/footer.component';
import * as module23 from './lib/stepper/header/header.component';
import * as module24 from './lib/stepper/stepper.component';
import * as module25 from './lib/stepper/stepper.module';
import * as module26 from './lib/subheader/drawer-communication.service';
import * as module27 from './lib/subheader/examples/services/autocomplete.data';
import * as module28 from './lib/subheader/examples/services/autocomplete.service';
import * as module29 from './lib/subheader/sds-subheader-wrapper.component';
import * as module30 from './lib/subheader/subheader.component';
import * as module31 from './lib/subheader/subheader.module';
import * as module32 from './lib/system-alert/system-alert.component';
import * as module33 from './lib/system-alert/system-alert.module';
import * as module34 from './lib/workspace-tier-2/item/item.component';
import * as module35 from './lib/workspace-tier-2/item/item.module';
import * as module36 from './lib/workspace-tier-2/label/label-dot.component';
import * as module37 from './lib/workspace-tier-2/label/label.component';
import * as module38 from './lib/workspace-tier-2/label/label.module';
import * as module39 from './lib/workspace-tier-2/title/title.component';
import * as module40 from './lib/workspace-tier-2/title/title.module';

const productionModules = [
  ['footer component', module0],
  ['footer module', module1],
  ['header component', module2],
  ['header module', module3],
  ['help component', module4],
  ['button group component', module5],
  ['button group module', module6],
  ['card component', module7],
  ['card module', module8],
  ['link component', module9],
  ['link module', module11],
  ['list component', module12],
  ['list module', module13],
  ['page component', module14],
  ['page module', module15],
  ['layouts module', module16],
  ['public api', module17],
  ['feedback component', module18],
  ['feedback module', module19],
  ['search list component', module20],
  ['search list module', module21],
  ['stepper footer', module22],
  ['stepper header', module23],
  ['stepper component', module24],
  ['stepper module', module25],
  ['drawer service', module26],
  ['autocomplete data', module27],
  ['autocomplete service', module28],
  ['subheader wrapper', module29],
  ['subheader component', module30],
  ['subheader module', module31],
  ['alert component', module32],
  ['alert module', module33],
  ['item component', module34],
  ['item module', module35],
  ['label dot component', module36],
  ['label component', module37],
  ['label module', module38],
  ['title component', module39],
  ['title module', module40],
] as const;

describe('coverage support', () => {
  it('evaluates every manifest module and exposes exports', () => {
    expect(productionModules).toHaveLength(40);
    for (const [label, moduleExports] of productionModules) {
      expect(Object.keys(moduleExports), label).not.toHaveLength(0);
    }
  });
});
