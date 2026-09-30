import type MailerInterface from '../../application/@shared/mailer.interface.js';
import { logger } from '../logging/logger.js';

/**
 * Dev-only stand-in for `NodemailerMailer`: used when MAIL_HOST isn't configured, so running
 * locally doesn't require a real SMTP account (or Mailhog/Ethereal) just to exercise the
 * invite/reset flows. Never selected in production — see `container/index.ts`.
 */
export default class ConsoleMailer implements MailerInterface {
  constructor(private readonly baseUrl: string) {}

  async sendInvitationEmail(to: string, invitationToken: string): Promise<void> {
    const link = `${this.baseUrl}/set-password?token=${encodeURIComponent(invitationToken)}`;
    logger.info({ to, link }, '[ConsoleMailer] Invitation email (not sent, MAIL_HOST unset)');
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const link = `${this.baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    logger.info({ to, link }, '[ConsoleMailer] Password reset email (not sent, MAIL_HOST unset)');
  }
}
