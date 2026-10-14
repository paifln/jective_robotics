import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['tests/*.test.ts'],reporters:['default','json'],outputFile:'test-results/unit.json',coverage:{provider:'v8',include:['packages/**/*.ts'],reportsDirectory:'test-results/coverage',reporter:['text','json','json-summary','html'],thresholds:{branches:80,perFile:true}}}});
