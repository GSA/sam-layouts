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

/**
 * Produce deterministic fingerprints while preserving repeated target occurrences.
 * Repeated normalized targets are suffixed so they do not collapse in the baseline.
 */
export function violationFingerprints(storyId, violations) {
  const counts = new Map();
  for (const violation of violations)
    for (const node of violation.nodes)
      for (const target of node.target) {
        const key = [storyId, violation.id, normalizeTarget(target)].join(' | ');
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => (count === 1 ? key : `${key} | occurrences ${count}`));
}

export function compareBaseline(current, baseline) {
  const currentSet = new Set(current);
  const baselineSet = new Set(baseline);
  return {
    added: current.filter((item) => !baselineSet.has(item)),
    resolved: baseline.filter((item) => !currentSet.has(item)),
  };
}
