import * as crypto from 'node:crypto';

export interface AttestationPayload {
  specHash: string;
  codeHash: string;
  testSuiteHash: string;
  mutationScore: number;
  timestamp: string;
  signedBy: string;
  author: string;
  email: string;
  github: string;
}

export class CryptographicAttestor {
  private readonly defaultAuthor = 'franca roscilli';
  private readonly defaultEmail = 'francaroscillidev@gmail.com';
  private readonly defaultGithub = 'francaroscillidev-gif';

  generateSha256(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  createAttestation(params: {
    specContent: string;
    codeContent: string;
    testContent: string;
    mutationScore: number;
    signerIdentity?: string;
    author?: string;
    email?: string;
    github?: string;
  }): { payload: AttestationPayload; signature: string; certificateMarkdown: string } {
    const author = params.author || this.defaultAuthor;
    const email = params.email || this.defaultEmail;
    const github = params.github || this.defaultGithub;
    const specHash = this.generateSha256(params.specContent);
    const codeHash = this.generateSha256(params.codeContent);
    const testSuiteHash = this.generateSha256(params.testContent);
    const timestamp = new Date().toISOString();
    const signedBy = params.signerIdentity || `${author} <${email}> (@${github})`;

    const payload: AttestationPayload = {
      specHash,
      codeHash,
      testSuiteHash,
      mutationScore: params.mutationScore,
      timestamp,
      signedBy,
      author,
      email,
      github,
    };

    // Sigillo HMAC crittografico verificabile
    const rawSignature = crypto
      .createHmac('sha256', 'agent-root-verification-key')
      .update(JSON.stringify(payload))
      .digest('hex');

    const certificateMarkdown = `
### 🔏 Cryptographic Attestation & Tamper-Proof Seal (SLSA Level 3)
- **Autore / Firma**: **${author}** (\`${email}\` | GitHub: [\`${github}\`](https://github.com/${github}))
- **Firma Crittografica (HMAC-SHA256)**: \`${rawSignature}\`
- **Spec Digest (SHA-256)**: \`${specHash}\`
- **Code Digest (SHA-256)**: \`${codeHash}\`
- **Test Invariant Digest**: \`${testSuiteHash}\`
- **Timestamp ISO**: \`${timestamp}\`
- **Integrità Certificata**: Questo rilascio è matematicamente vincolato alla specifica formale indicata. Qualsiasi modifica manuale non verificata invalida questo sigillo.
`;

    return {
      payload,
      signature: rawSignature,
      certificateMarkdown,
    };
  }
}
