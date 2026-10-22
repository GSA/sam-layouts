/**
 * Jest CommonJS stub for `ckeditor5`.
 *
 * `@gsa-sam/components` imports editor plugins from this pure-ESM package at
 * its FESM top level. Jest's CommonJS resolver selects its declaration-only
 * entry and cannot evaluate it. The demo build consumes the real ESM package;
 * library specs do not instantiate `SdsRichTextComponent`, so this minimal
 * surface only lets the SDS barrel load under Jest.
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
