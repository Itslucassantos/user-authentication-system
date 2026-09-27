import nodemailer, { type Transporter } from 'nodemailer';
import type MailerInterface from '../../application/@shared/mailer.interface.js';

export interface MailerConfig {
  host: string;
  port: number;
  from: string;
  baseUrl: string;
  auth?: { user: string; pass: string };
}

export default class NodemailerMailer implements MailerInterface {
  private readonly transporter: Transporter;

  constructor(private readonly config: MailerConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: config.auth,

      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  async sendInvitationEmail(to: string, invitationToken: string): Promise<void> {
    const link = `${this.config.baseUrl}/set-password?token=${encodeURIComponent(invitationToken)}`;
    await this.transporter.sendMail({
      from: this.config.from,
      to,
      subject: 'You’ve been invited — set your password',
      text: `Set your password by visiting: ${link}\nThe link expires in 7 days.`,
      html: `<p>Set your password <a href="${link}">by clicking here</a>.</p><p>The link expires in 7 days.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const link = `${this.config.baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    await this.transporter.sendMail({
      from: this.config.from,
      to,
      subject: 'Reset your password',
      text: `Reset your password by visiting: ${link}\nThe link expires in 1 hour.`,
      html: `<p>Reset your password <a href="${link}">by clicking here</a>.</p><p>The link expires in 1 hour.</p>`,
    });
  }
}
