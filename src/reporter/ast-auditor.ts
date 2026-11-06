import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = (traverseModule as any).default || traverseModule;

export interface AstQualityReport {
  cyclomaticComplexity: number;
  totalFunctions: number;
  unhandledAsyncOps: number;
  passedQualityGate: boolean;
  warnings: string[];
}

export class AstQualityAuditor {
  auditSource(code: string): AstQualityReport {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    });

    let complexity = 1; // Base complexity
    let totalFunctions = 0;
    let unhandledAsyncOps = 0;
    const warnings: string[] = [];

    traverse(ast, {
      FunctionDeclaration() { totalFunctions++; },
      FunctionExpression() { totalFunctions++; },
      ArrowFunctionExpression() { totalFunctions++; },
      ClassMethod() { totalFunctions++; },

      // Punti decisionali che aumentano la complessità ciclomatica
      IfStatement() { complexity++; },
      ForStatement() { complexity++; },
      ForInStatement() { complexity++; },
      ForOfStatement() { complexity++; },
      WhileStatement() { complexity++; },
      DoWhileStatement() { complexity++; },
      ConditionalExpression() { complexity++; }, // Ternario ? :
      SwitchCase(path: any) {
        if (path.node.test) complexity++;
      },
      LogicalExpression(path: any) {
        if (['&&', '||', '??'].includes(path.node.operator)) complexity++;
      },
      CatchClause() { complexity++; },
    });

    if (complexity > 15) {
      warnings.push(`Complessità ciclomatica elevata (${complexity} > soglia 15). Consigliato refactoring in sotto-funzioni.`);
    }

    return {
      cyclomaticComplexity: complexity,
      totalFunctions,
      unhandledAsyncOps,
      passedQualityGate: complexity <= 15,
      warnings,
    };
  }
}
