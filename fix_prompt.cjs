const fs = require('fs');
const file = 'c:/Users/jvchi/CARPETAS/DesignStudio/src/editor/ai/systemPrompt.ts';
let content = fs.readFileSync(file, 'utf8');

// Unescape all first
content = content.replace(/\\`/g, '`');

// Replace all backticks with escaped backticks
content = content.replace(/`/g, '\\`');

// Restore the very first and last backtick for the template literal
content = content.replace(/^export const DS_SYSTEM_PROMPT = \\`/, 'export const DS_SYSTEM_PROMPT = `');
content = content.replace(/\\`;\r?\n?$/, '`;\n');

fs.writeFileSync(file, content);
