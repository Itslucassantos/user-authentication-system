import { env } from '../config/env.js';
import type { MailerConfig } from './nodemailer-mailer.js';

export function loadMailerConfig(): MailerConfig {
  if (!env.MAIL_HOST || !env.MAIL_PORT || !env.MAIL_FROM) {
    throw new Error('Missing mail environment variables: MAIL_HOST, MAIL_PORT, MAIL_FROM');
  }

  const config: MailerConfig = {
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    from: env.MAIL_FROM,
    baseUrl: env.APP_BASE_URL.replace(/\/+$/, ''),
  };
  if (env.MAIL_USER) {
    config.auth = { user: env.MAIL_USER, pass: env.MAIL_PASSWORD! };
  }

  return config;
}
