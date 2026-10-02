import type MailerInterface from '../../application/@shared/mailer.interface.js';

export interface CapturedEmail {
  kind: 'invitation' | 'password-reset';
  to: string;
  token: string;
}

/** Stand-in for NodemailerMailer in the integration suite: records mails instead of sending. */
export class CapturedMailer implements MailerInterface {
  static sent: CapturedEmail[] = [];

  static clear(): void {
    CapturedMailer.sent = [];
  }

  static lastTo(to: string, kind: CapturedEmail['kind']): CapturedEmail | undefined {
    return [...CapturedMailer.sent].reverse().find((mail) => mail.to === to && mail.kind === kind);
  }

  async sendInvitationEmail(to: string, token: string): Promise<void> {
    CapturedMailer.sent.push({ kind: 'invitation', to, token });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    CapturedMailer.sent.push({ kind: 'password-reset', to, token });
  }
}
