import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Angular/Vite resolves ngx-bootstrap-icons through its es2020 export.
    // Native ESM imports in external @gsa-sam packages must use the same export,
    // otherwise its private Icons DI token is instantiated twice (NG0201).
    execArgv: ['--conditions=es2020'],
  },
});
