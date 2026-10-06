#!/usr/bin/env node
/**
 * OWASP ZAP severity gate for the sam-layouts demo runtime.
 *
 * The DAST job (`.github/workflows/security.yml`) runs the ZAP baseline scanner
 * with `fail_action: false`, so ZAP's own rule actions (WARN/FAIL) never decide
 * the build outcome. This script does: it parses ZAP's JSON report and fails
 * the build for any alert whose JSON `riskcode` is medium (`2`) or high (`3`),
 * unless a reviewed exception in `.zap/rules.tsv` matches it.
 *
 * Fail-closed posture:
 *   - An unreadable or non-object report exits non-zero.
 *   - A report whose `site`/`alerts` shape does not match ZAP's schema exits
 *     non-zero rather than silently reporting "no findings" (a truncated or
 *     changed report must not bypass the gate).
 *   - An EMPTY `site` array exits non-zero: a report with no scanned site means
 *     ZAP never reached the target, which is a broken scan, not a clean one. A
 *     site reported with `alerts: []` is a legitimate clean scan and passes.
 *   - A `riskcode` that is missing, of an unexpected type, blank, or outside
 *     ZAP's supported 0-3 range is treated as blocking, not as
 *     "informational" — `Number(null)`, `Number('')` and `Number(false)` all
 *     yield `0`, so the type and range are checked before conversion.
 *
 * Exception scope:
 *   Exceptions are matched on plugin id AND an instance scope (a URL substring),
 *   so a baseline row suppresses only the reviewed instance(s) of a finding, not
 *   every current and future instance of that ZAP rule across all URLs. This
 *   preserves the new-code gate and the "narrowest available scope" policy.
 *   A literal `*` in the scope column means rule-wide and must be justified in
 *   review. An alert is suppressed only when *every* one of its instances is
 *   provably covered; any uncovered instance — including an instance whose
 *   `uri` is missing, which cannot be proven covered — is reported and blocks.
 *   Only a rule-wide (`*`) waiver can suppress an alert with incomplete
 *   instance data.
 *
 * Ported from GSA/ngx-uswds; see GSA/sam-layouts#80. One deliberate divergence
 * from the upstream script, found by running it against a real report: ZAP
 * 0.15.0 emits NO top-level `url` on an alert — the URLs live in
 * `alert.instances[].uri`, with the alert itself acting as a group. Reading
 * `alert.url` therefore yields `undefined` for every real finding, which
 * silently broke URL-scoped exceptions (they could never match) and printed
 * "no url" in the failure output. We read `instances[].uri` and fall back to
 * `alert.url` only for compatibility.
 *
 * Usage:
 *   node scripts/check-zap-severity.mjs [report_json.json] [.zap/rules.tsv]
 */
import { readFileSync } from 'node:fs';

const reportPath = process.argv[2] ?? 'report_json.json';
const rulesPath = process.argv[3] ?? '.zap/rules.tsv';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(path, description) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (error) {
    fail(`Unable to read ${description} at ${path}: ${error.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`Unable to parse ${description} at ${path}: ${error.message}`);
  }
}

/**
 * Read reviewed exceptions as { pluginId, scope } pairs. `scope` is a URL
 * substring (or `*` for rule-wide). Column layout:
 *   rule-id  IGNORE  scope  issue-url  owner  expiry  rationale
 */
function readExceptions(path) {
  let contents;
  try {
    contents = readFileSync(path, 'utf8');
  } catch {
    // No rules file means no exceptions — the gate stays strict.
    return [];
  }
  return contents
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => line.split('\t'))
    .filter((columns) => columns[1] === 'IGNORE')
    .map((columns) => ({
      pluginId: columns[0]?.trim(),
      scope: columns[2]?.trim() ?? '',
    }));
}

/**
 * Every observation of this alert, as `{ uri, known }`. ZAP groups instances
 * under one alert and does not set a top-level `url`; `alert.url` is read only
 * as a fallback for hand-written fixtures and older report shapes.
 *
 * An instance that carries no usable `uri` is kept as `{ known: false }`
 * instead of being dropped: a URL-scoped waiver cannot be shown to cover an
 * observation whose URL we do not know, and silently discarding it would let a
 * partially degraded report satisfy a narrow waiver.
 */
function observationsOf(alert) {
  if (Array.isArray(alert.instances) && alert.instances.length > 0) {
    return alert.instances.map((instance) => {
      const uri = instance?.uri;
      return typeof uri === 'string' && uri.length > 0
        ? { uri, known: true }
        : { uri: 'instance with no url', known: false };
    });
  }
  return alert.url === undefined || alert.url === null
    ? []
    : [{ uri: String(alert.url), known: true }];
}

/**
 * The instance URLs of `alert` that no reviewed exception covers. An empty
 * result means the whole alert is excepted. An alert carrying no URL at all —
 * or any single instance whose URL is missing — can only be suppressed
 * rule-wide (`*`) — fail-closed, so a report missing instance data cannot be
 * waved through by a narrow scope.
 */
function unexceptedUrls(alert, exceptions) {
  const pluginId = String(alert.pluginid);
  const forThisRule = exceptions.filter(
    (exception) => exception.pluginId === pluginId
  );
  if (forThisRule.some((exception) => exception.scope === '*')) return [];

  const observations = observationsOf(alert);
  if (observations.length === 0) return ['no url'];
  return observations
    .filter(
      ({ uri, known }) =>
        !known ||
        !forThisRule.some(
          (exception) =>
            exception.scope.length > 0 && uri.includes(exception.scope)
        )
    )
    .map(({ uri }) => uri);
}

/**
 * ZAP reports risk as one of its four supported risk codes (0 informational,
 * 1 low, 2 medium, 3 high), emitted as a numeric string. Validate the type and
 * membership BEFORE conversion: `Number(null)`, `Number('')` and
 * `Number(false)` all yield `0`, so a corrupted `riskcode` would otherwise read
 * as "informational" and sail through the gate without a waiver. Anything
 * unrecognised — wrong type, blank, or a code outside 0-3 — becomes NaN and is
 * treated as blocking.
 */
const SUPPORTED_RISK_CODES = new Set([0, 1, 2, 3]);

function riskcodeOf(alert) {
  const raw = alert?.riskcode;
  if (typeof raw !== 'string' && typeof raw !== 'number') return Number.NaN;
  if (typeof raw === 'string' && raw.trim().length === 0) return Number.NaN;
  const value = Number(raw);
  return Number.isInteger(value) && SUPPORTED_RISK_CODES.has(value)
    ? value
    : Number.NaN;
}

const report = readJson(reportPath, 'ZAP JSON report');
const exceptions = readExceptions(rulesPath);

// Fail closed on a report shape we do not recognise: ZAP always emits a `site`
// array. A missing/non-array `site`, or a `site` entry whose `alerts` is not an
// array, means the report is truncated or schema-changed and must not be read
// as "no findings". An EMPTY `site` array means ZAP produced a report without
// ever scanning the target (bad target URL, container networking failure, the
// server dying before the scan) — nothing else in the job proves ZAP visited
// the runtime, so that must block too. A site reported *with* `alerts: []` is a
// legitimate clean scan and still passes.
if (
  report === null ||
  typeof report !== 'object' ||
  !Array.isArray(report.site)
) {
  fail(
    'ZAP report is missing the expected "site" array — refusing to pass a malformed report.'
  );
}
if (report.site.length === 0) {
  fail(
    'ZAP report contains no scanned site — refusing to pass a scan that never reached the target.'
  );
}
for (const site of report.site) {
  if (
    site === null ||
    typeof site !== 'object' ||
    !Array.isArray(site.alerts)
  ) {
    fail(
      'ZAP report has a site with no "alerts" array — refusing to pass a malformed report.'
    );
  }
}

const alerts = report.site.flatMap((site) => site.alerts);

// A non-numeric riskcode is treated as blocking so a corrupted severity field
// cannot silently downgrade a finding below the gate.
const suspicious = alerts.filter((alert) => Number.isNaN(riskcodeOf(alert)));
if (suspicious.length > 0) {
  console.error(
    'ZAP report has alerts with a missing or non-numeric riskcode:'
  );
  for (const alert of suspicious) {
    console.error(
      `- [${alert.pluginid ?? '?'}] ${alert.alert ?? 'unknown'}: riskcode=${
        alert.riskcode
      }`
    );
  }
  process.exit(1);
}

const blockingAlerts = alerts
  .filter((alert) => riskcodeOf(alert) >= 2)
  .map((alert) => ({ alert, urls: unexceptedUrls(alert, exceptions) }))
  .filter(({ urls }) => urls.length > 0);

if (blockingAlerts.length > 0) {
  console.error('ZAP found medium- or high-risk alerts:');
  for (const { alert, urls } of blockingAlerts) {
    console.error(
      `- [${alert.pluginid}] ${alert.alert}: ${alert.riskdesc} (${urls.join(
        ', '
      )})`
    );
  }
  process.exit(1);
}

console.log('ZAP found no unexcepted medium- or high-risk alerts.');
