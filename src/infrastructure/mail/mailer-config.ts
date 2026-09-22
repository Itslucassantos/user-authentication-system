import type { MailerConfig } from './nodemailer-mailer.js';

const required = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_FROM', 'APP_BASE_URL'] as const;

export function loadMailerConfig(env: NodeJS.ProcessEnv = process.env): MailerConfig {
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing mail environment variables: ${missing.join(', ')}`);
  }

  const port = Number(env.MAIL_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('MAIL_PORT must be a positive integer');
  }

  if (Boolean(env.MAIL_USER) !== Boolean(env.MAIL_PASSWORD)) {
    throw new Error('MAIL_USER and MAIL_PASSWORD must be set together');
  }

  const config: MailerConfig = {
    host: env.MAIL_HOST!,
    port,
    from: env.MAIL_FROM!,
    baseUrl: env.APP_BASE_URL!.replace(/\/+$/, ''),
  };
  if (env.MAIL_USER) {
    config.auth = { user: env.MAIL_USER, pass: env.MAIL_PASSWORD! };
  }

  return config;
}
