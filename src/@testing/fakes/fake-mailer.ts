import type MailerInterface from '../../application/@shared/mailer.interface.js';

export default class FakeMailer implements MailerInterface {
  readonly invitations: { to: string; token: string }[] = [];
  readonly passwordResets: { to: string; token: string }[] = [];

  async sendInvitationEmail(to: string, invitationToken: string): Promise<void> {
    this.invitations.push({ to, token: invitationToken });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    this.passwordResets.push({ to, token: resetToken });
  }
}
