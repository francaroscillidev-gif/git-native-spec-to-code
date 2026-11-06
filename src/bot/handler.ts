export interface GithubCommentCommand {
  command: 'VERIFY' | 'HEAL' | 'AUDIT';
  targetProperty?: string;
  maxIterations?: number;
}

export class GithubBotCommandHandler {
  /**
   * Interpreta i comandi interattivi lasciati dagli sviluppatori nei commenti delle PR GitHub:
   * Esempi:
   *   /spec-verify
   *   /spec-verify heal --property "Capacity"
   *   /spec-verify audit
   */
  parseComment(commentBody: string): GithubCommentCommand | null {
    const trimmed = commentBody.trim();
    if (!trimmed.startsWith('/spec-verify')) {
      return null;
    }

    if (trimmed.includes('heal')) {
      const match = trimmed.match(/--property\s+["']?([^"']+)["']?/i);
      return {
        command: 'HEAL',
        targetProperty: match ? match[1] : undefined,
      };
    }

    if (trimmed.includes('audit')) {
      return {
        command: 'AUDIT',
      };
    }

    return {
      command: 'VERIFY',
    };
  }

  generateBotResponse(cmd: GithubCommentCommand, reportUrl?: string): string {
    return `🤖 **Spec-to-Code Bot (@francaroscillidev-gif)**:
Comando ricevuto: \`${cmd.command}\`${cmd.targetProperty ? ` sulla proprietà \`${cmd.targetProperty}\`` : ''}.
Avvio della pipeline di verifica formale e self-healing in sandbox isolata.
${reportUrl ? `\n🔗 **Attestazione & Dashboard**: ${reportUrl}` : ''}`;
  }
}
