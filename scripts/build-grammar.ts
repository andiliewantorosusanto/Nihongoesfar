import { generateGrammar } from './content/grammar.ts';
try {
  const entries = generateGrammar(process.argv.includes('--check'));
  console.log(
    `Grammar ${process.argv.includes('--check') ? 'checked' : 'generated'}: ${entries.length} topics, ${entries.reduce((n, e) => n + (e.exercises?.length ?? 0), 0)} exercises.`,
  );
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
}
