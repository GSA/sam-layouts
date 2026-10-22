import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

export const sourceRoots = {
  layouts: 'sam-layouts/src/',
  'sam-layouts': 'apps/sam-layouts/src/',
};

export function trackedInputFiles() {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
    .filter(
      (file) =>
        file !== 'coverage-thresholds.json' && file !== 'coverage/.coverage-run.json' && !file.startsWith('coverage/'),
    );
}

function hasRuntimeSyntax(source) {
  const file = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  if (output.replace(/\s|[;{}]/g, '') === '') return false;
  return file.statements.some((statement) => {
    if (
      ts.isImportDeclaration(statement) ||
      ts.isExportDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement)
    )
      return false;
    if (ts.isModuleDeclaration(statement) && statement.flags & ts.NodeFlags.Namespace) return true;
    return true;
  });
}

export async function productionSource(files = trackedInputFiles()) {
  const result = [];
  for (const file of files) {
    const root = Object.values(sourceRoots).find((prefix) => file.startsWith(prefix));
    if (
      !root ||
      !file.endsWith('.ts') ||
      /\.(spec|test|stories|demo)\.ts$/.test(file) ||
      file.includes('/demo/') ||
      file.endsWith('.d.ts')
    )
      continue;
    const relative = file.slice(root.length);
    if (/(^|\/)(main|test-setup)\.ts$/.test(relative)) continue;
    const source = await readFile(file, 'utf8');
    if (hasRuntimeSyntax(source)) result.push(file);
  }
  return result.sort();
}

export function projectSources(files, project) {
  const root = sourceRoots[project];
  return files.filter((file) => file.startsWith(root));
}
