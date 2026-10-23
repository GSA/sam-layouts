import test from 'node:test';
import assert from 'node:assert/strict';
import { compareBaseline, normalizeTarget, violationFingerprints } from './storybook-a11y.mjs';

test('Angular selectors normalize without losing meaningful target details', () => {
  assert.equal(
    normalizeTarget('sds-item.ng-tns-c8-12[_ngcontent-ng-c109] > button[_nghost-ng-c98].primary'),
    'sds-item > button.primary',
  );
  assert.deepEqual(
    violationFingerprints('story--one', [{ id: 'label', nodes: [{ target: ['.ng-tns-c1-2#field'] }] }]),
    ['story--one | label | #field'],
  );
});

test('new and resolved violations require explicit baseline update', () => {
  assert.deepEqual(compareBaseline(['story | rule | #new'], ['story | rule | #old']), {
    added: ['story | rule | #new'],
    resolved: ['story | rule | #old'],
  });
});
