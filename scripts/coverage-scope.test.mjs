import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRuntimeSyntax } from './coverage-scope.mjs';

test('excludes ambient declarations while retaining runtime declarations', () => {
  for (const source of [
    'export declare const value: string;',
    'export declare function value(): void;',
    'export declare class Value {}',
    'export declare namespace Value { export const nested: string; }',
    'export type Value = string;',
    'export interface Value {}',
  ]) assert.equal(hasRuntimeSyntax(source), false, source);
  for (const source of ['export const value = 1;', 'export enum Value { One }', 'export class Value {}'])
    assert.equal(hasRuntimeSyntax(source), true, source);
});
