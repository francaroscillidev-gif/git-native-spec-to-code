import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';

// Workaround per interoperabilità ESM di default import babel
const traverse = (traverseModule as any).default || traverseModule;
const generate = (generateModule as any).default || generateModule;

export interface CodeMutant {
  id: string;
  description: string;
  mutatedCode: string;
  originalOp?: string;
  mutatedOp?: string;
}

export class AstMutator {
  /**
   * Genera mutanti del codice target applicando mutazioni comuni agli operatori logici e aritmetici.
   */
  generateMutants(sourceCode: string): CodeMutant[] {
    const mutants: CodeMutant[] = [];

    const binaryOpReplacements: Record<string, string> = {
      '>=': '<',
      '<=': '>',
      '>': '<=',
      '<': '>=',
      '===': '!==',
      '!==': '===',
      '==': '!=',
      '!=': '==',
      '+': '-',
      '-': '+',
      '*': '/',
      '/': '*',
    };

    let mutantIndex = 0;

    // Per ogni potenziale mutazione, generiamo una variante isolata
    // 1. Troviamo tutte le posizioni mutabili
    const ast = parse(sourceCode, {
      sourceType: 'module',
      plugins: ['typescript'],
    });

    const targetPositions: { line: number; op: string; replacement: string }[] = [];

    traverse(ast, {
      BinaryExpression(path: any) {
        const op = path.node.operator;
        if (binaryOpReplacements[op]) {
          targetPositions.push({
            line: path.node.loc?.start.line || 0,
            op,
            replacement: binaryOpReplacements[op],
          });
        }
      },
    });

    // 2. Per ciascuna posizione, creiamo un mutante
    for (const target of targetPositions) {
      mutantIndex++;
      const mutantAst = parse(sourceCode, {
        sourceType: 'module',
        plugins: ['typescript'],
      });

      let currentMatch = 0;
      traverse(mutantAst, {
        BinaryExpression(path: any) {
          const op = path.node.operator;
          if (op === target.op && path.node.loc?.start.line === target.line) {
            currentMatch++;
            if (currentMatch === 1) {
              path.node.operator = target.replacement;
            }
          }
        },
      });

      const output = generate(mutantAst, {}, sourceCode);
      mutants.push({
        id: `mutant_${mutantIndex}`,
        description: `Sostituito operatore '${target.op}' con '${target.replacement}' a riga ${target.line}`,
        mutatedCode: output.code,
        originalOp: target.op,
        mutatedOp: target.replacement,
      });
    }

    return mutants;
  }
}
