/**
 * Jest stub for `ngx-toastr`.
 *
 * `@gsa-sam/components` imports `Toast`, `ToastrService` and `ToastPackage`
 * from `ngx-toastr` inside its fesm2022 bundle (`SdsToastComponent`), but it
 * does NOT declare `ngx-toastr` in its `dependencies` or `peerDependencies`.
 * Verified on both the internal-registry build (`19.0.0`) and the public
 * tarball (`18.0.1`) — neither manifest mentions `ngx-toastr`, and the package
 * is absent from this repo's `package-lock.json` (0 occurrences).
 *
 * Because every spec in this library imports something from
 * `@gsa-sam/components`, Jest eagerly evaluates the whole barrel and dies with
 * `Cannot find module 'ngx-toastr'` before any assertion runs. The webpack/
 * esbuild app build never hit this because the Angular builder tree-shakes the
 * unreached `SdsToastComponent` branch; CommonJS `require` under Jest cannot.
 *
 * Nothing in `sam-layouts/src/**` references toasts (`grep -ri toast` → no
 * hits), so these stubs are never exercised — they only need to exist so the
 * barrel evaluates. Delete this file once `@gsa-sam/components` declares
 * `ngx-toastr` properly.
 */

export class ToastPackage {
  toastType = 'sds-toast--info';
  toastId = 0;
  config: Record<string, unknown> = {};
  message: string | null = null;
  title: string | undefined = undefined;
  triggerAction(): void {
    /* no-op */
  }
  triggerTap(): void {
    /* no-op */
  }
}

export class ToastrService {
  remove(): boolean {
    return true;
  }
}

export class Toast {
  constructor(
    protected toastrService: ToastrService,
    public toastPackage: ToastPackage
  ) {}
  remove(): void {
    /* no-op */
  }
}

export class ToastrModule {
  static forRoot() {
    return { ngModule: ToastrModule, providers: [] };
  }
}
