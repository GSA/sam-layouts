/** Stable axe fingerprints and strict ratchet comparison for rendered Storybook stories. */
export const WCAG_21_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export function normalizeTarget(selector) {
  return selector
    .replace(/\.ng-tns-c\d+-\d+/g, '')
    .replace(/\[_ngcontent-[^\]]+\]/g, '')
    .replace(/\[_nghost-[^\]]+\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function violationFingerprints(storyId, violations) {
  return violations.flatMap((violation) =>
    violation.nodes.map((node) => [storyId, violation.id, ...node.target.map(normalizeTarget)].join(' | ')),
  );
}

export function compareBaseline(current, baseline) {
  const currentSet = new Set(current);
  const baselineSet = new Set(baseline);
  return {
    added: current.filter((item) => !baselineSet.has(item)),
    resolved: baseline.filter((item) => !currentSet.has(item)),
  };
}
