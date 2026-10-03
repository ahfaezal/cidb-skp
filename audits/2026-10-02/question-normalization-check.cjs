// Read-only checks against the actual frontend normalization functions.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const source = fs.readFileSync(path.join(__dirname, '../../frontend/app/question-bank/page.tsx'), 'utf8');
const options = source.slice(source.indexOf('function getObjectiveCombinationOptions('), source.indexOf('const roleOptions:'));
const normalization = source.slice(source.indexOf('function splitOption('), source.indexOf('export default function QuestionBankPage('));
const context = vm.createContext({});
vm.runInContext(stripTypeScriptTypes(options + '\n' + normalization, { mode: 'strip' }), context);
const single = context.normalizeObjectiveOptions({ type: 'Objektif', options: ['A. Very long correct answer', 'B. Short', 'C. Medium answer', 'D. X'], correctAnswer: 'A' });
const singlePass = single.options.find(x => x.startsWith(single.correctAnswer + '.')).endsWith('Very long correct answer');
const combination = context.normalizeObjectiveOptions({ type: 'Objektif', objectiveFormat: 'Soalan Aneka Gabungan', combinationItems: ['I. Very long false statement', 'II. A', 'III. Medium truth', 'IV. Short'], correctAnswer: 'D' });
// Keep statement identities and check every possible answer, including a reload.
const items = ['I. Very long false statement', 'II. A', 'III. Medium truth', 'IV. Short'];
const combinationPass = ['A', 'B', 'C', 'D'].every(correctAnswer => {
  const original = { type: 'Objektif', objectiveFormat: 'Soalan Aneka Gabungan', combinationItems: items, correctAnswer };
  const normalized = context.normalizeObjectiveOptions(original);
  const reloaded = context.normalizeObjectiveOptions(JSON.parse(JSON.stringify(normalized)));
  return normalized.correctAnswer === correctAnswer && JSON.stringify(normalized.combinationItems) === JSON.stringify(items)
    && JSON.stringify(reloaded) === JSON.stringify(normalized);
});
console.log(JSON.stringify({ singleAnswerPreserved: singlePass, combinationAnswerPreserved: combinationPass }, null, 2));
if (!singlePass || !combinationPass) process.exitCode = 1;
