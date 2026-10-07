import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

/**
 * Static file server for the built sam-layouts demo app, used only by the DAST
 * job in `.github/workflows/security.yml`. It serves the Nx application build
 * output with representative production security headers so the OWASP ZAP
 * baseline scan exercises the headers a real deployment would emit, rather than
 * the bare, header-less defaults of a dev file server.
 *
 * Output path note (the one real adaptation from the GSA/ngx-uswds original):
 * ngx-uswds is a plain Angular CLI workspace, so it serves `dist/<app>`. This
 * repo is an Nx workspace whose `sam-layouts` build target is
 * `@angular-devkit/build-angular:application` with
 * `outputPath: dist/apps/sam-layouts`, and the `application` builder writes the
 * browser bundle into a `browser/` subdirectory. The scan root is therefore
 * `dist/apps/sam-layouts/browser` — verified against a real
 * `npx nx build sam-layouts`, not assumed. `nx serve-static` points at the same
 * directory in `apps/sam-layouts/project.json`.
 *
 * The demo app is internal tooling; the published artifact is the `layouts`
 * library, which has no standalone runtime surface. This scan is therefore
 * defense-in-depth on the demo, not a control over the shipped package.
 *
 * See GSA/sam-layouts#80.
 */
const root = resolve('dist/apps/sam-layouts/browser');
const port = Number(process.env.SECURITY_SCAN_PORT ?? 4200);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/**
 * `style-src 'unsafe-inline'` is deliberate, and it is the reason ZAP rule
 * 10055 fires. It stays, rather than being tightened to make a finding
 * disappear: the generated `app-nx-welcome` scaffolding component declares
 * `encapsulation: ViewEncapsulation.None` and carries a literal `<style>` block
 * inside its template, and `app.component.html` renders `<app-nx-welcome>` on
 * the demo's root route. Angular therefore injects that `<style>` element into
 * the live document, so a nonce/hash-free policy without `'unsafe-inline'`
 * would break the very page the scanner is pointed at.
 *
 * Dropping it would silence 10055 while making the served headers
 * *unrepresentative* of what the demo actually needs — a worse outcome than a
 * documented waiver. GSA/ngx-uswds baselines the same rule for the same reason.
 * Every other directive is locked down. The waiver lives in `.zap/rules.tsv`
 * with a rationale and an expiry; prefer a nonce or hash over renewing it if
 * the demo shell is ever reworked.
 */
const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url ?? '/', 'http://localhost').pathname
    );
  } catch {
    // Malformed percent-encoding (e.g. `%zz`) must not crash the server.
    response.writeHead(400, securityHeaders).end('Bad request');
    return;
  }
  const requestedPath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
  let filePath = join(root, requestedPath);

  // Prevent path traversal outside the served root; fall back to the SPA
  // index so client-side routes still resolve for the scanner.
  if (!filePath.startsWith(root)) {
    response.writeHead(404, securityHeaders).end('Not found');
    return;
  }
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    const candidate = existsSync(filePath)
      ? join(filePath, 'index.html')
      : filePath;
    filePath = existsSync(candidate) ? candidate : join(root, 'index.html');
  }
  if (!existsSync(filePath)) {
    response.writeHead(404, securityHeaders).end('Not found');
    return;
  }

  response.writeHead(200, {
    ...securityHeaders,
    'Content-Type':
      contentTypes[extname(filePath)] ?? 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
}).listen(port, '127.0.0.1', () =>
  console.log(
    `Security scan server listening on http://127.0.0.1:${port} (root: ${root})`
  )
);
