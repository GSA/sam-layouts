/**
 * Jest stub for `ckeditor5`.
 *
 * `@gsa-sam/components` imports 14 editor plugins from `ckeditor5` at the top
 * of its fesm2022 bundle for `SdsRichTextComponent`. `ckeditor5@46.1.1` is a
 * pure-ESM package (`"type": "module"`) whose `exports["."]` map offers only
 * `types` and `import` conditions — there is no `require` entry. Under Jest's
 * CommonJS resolver that resolves to `ckeditor5/src/index.d.ts`, which is a
 * TypeScript declaration file living in `node_modules`, so it is excluded by
 * `transformIgnorePatterns` and Jest reports:
 *
 *   SyntaxError: Cannot use import statement outside a module
 *   at ckeditor5/src/index.d.ts:5
 *
 * The Angular application builder never hits this because esbuild consumes the
 * `import` condition natively. Note also that `ckeditor5` is NOT a direct
 * dependency of this repo — it arrives transitively as a peer of
 * `@ckeditor/ckeditor5-angular@9.1.0`.
 *
 * Nothing in `sam-layouts/src/**` uses `SdsRichTextComponent`, so these stubs
 * are never instantiated; they only need to exist so the `@gsa-sam/components`
 * barrel evaluates under Jest.
 */

class Plugin {}

export class ClassicEditor {
  static builtinPlugins: unknown[] = [];
  static defaultConfig: Record<string, unknown> = {};
}

export class Heading extends Plugin {}
export class Bold extends Plugin {}
export class Italic extends Plugin {}
export class Link extends Plugin {}
export class List extends Plugin {}
export class Indent extends Plugin {}
export class IndentBlock extends Plugin {}
export class BlockQuote extends Plugin {}
export class Essentials extends Plugin {}
export class Table extends Plugin {}
export class TableToolbar extends Plugin {}
export class MediaEmbed extends Plugin {}
export class Paragraph extends Plugin {}
