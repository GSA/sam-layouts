/**
 * Jest stub for `@ckeditor/ckeditor5-build-classic`.
 *
 * `@gsa-sam/components@18.0.1` does `import * as ClassicEditor from
 * '@ckeditor/ckeditor5-build-classic'` at the top of its fesm2022 bundle for
 * `SdsRichTextComponent`, but it declares that package in neither
 * `dependencies` nor `peerDependencies` (its only runtime dependency is
 * `tslib`). The package is also absent from this repo's `package-lock.json`
 * (0 occurrences), so under Jest every spec that touches the
 * `@gsa-sam/components` barrel dies with `Cannot find module
 * '@ckeditor/ckeditor5-build-classic'` before any assertion runs.
 *
 * This is the ngc-18 sibling of the `ckeditor5.ts` stub: `@gsa-sam/components`
 * at `19.0.0` switched the same component over to the modern unbundled
 * `ckeditor5` entry point, which is why both mappings are needed for the
 * harness to work on either dependency set. The mapping for this module is
 * simply never consulted at `^19`, where nothing imports it.
 *
 * Nothing in `sam-layouts/src/**` uses `SdsRichTextComponent`, so this stub is
 * never instantiated; it only needs to exist so the barrel evaluates. Delete it
 * once no installed `@gsa-sam/components` imports this module — it is already
 * unreferenced at `^19`, and `^21` likewise.
 */

export default class ClassicEditor {
  static builtinPlugins: unknown[] = [];
  static defaultConfig: Record<string, unknown> = {};

  static create(): Promise<ClassicEditor> {
    return Promise.resolve(new ClassicEditor());
  }
}
