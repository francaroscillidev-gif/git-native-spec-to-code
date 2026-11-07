import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SpecVerificationAgent } from '../healer/agent.js';
import { SmartLLMProvider } from '../llm/provider.js';
import * as path from 'node:path';

/**
 * Server MCP standard per consentire a Claude, Cursor, Antigravity o qualsiasi
 * client conforme MCP di invocare direttamente l'Agente di Verifica Formale come strumento.
 */
export async function startMcpServer() {
  const server = new Server(
    {
      name: 'spec-to-code-verifier',
      version: '9.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'verify_spec',
          description: 'Esegue la verifica formale completa, Property-Based Testing, Mutation Testing e Self-Healing su una specifica.',
          inputSchema: {
            type: 'object',
            properties: {
              specPath: { type: 'string', description: 'Percorso del file di specifica' },
              targetDir: { type: 'string', description: 'Directory di output per il codice generato' },
              maxIterations: { type: 'number', description: 'Numero massimo di round di self-healing' },
            },
            required: ['specPath', 'targetDir'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'verify_spec') {
      const args = request.params.arguments as any;
      const llm = new SmartLLMProvider();
      const agent = new SpecVerificationAgent(llm);

      const report = await agent.run({
        specPath: path.resolve(args.specPath),
        targetDir: path.resolve(args.targetDir),
        maxIterations: args.maxIterations || 4,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Verifica completata con successo (Esito: ${report.verified ? 'SUPERATO' : 'FALLITO'}).\n\n${report.markdownSummary}`,
          },
        ],
      };
    }

    throw new Error(`Tool ${request.params.name} non supportato.`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Avvio se invocato direttamente
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  startMcpServer().catch(console.error);
}
