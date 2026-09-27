import { loadMailerConfig } from './mailer-config.js';
import NodemailerMailer from './nodemailer-mailer.js';

try {
  process.loadEnvFile();
} catch {}

const to = process.argv[2];
if (!to) {
  console.error('Use: npm run mail:test -- person@example.com');
  process.exit(1);
}

try {
  const mailer = new NodemailerMailer(loadMailerConfig());
  await mailer.sendInvitationEmail(to, 'token-of-test');
  console.log(`Test email sent to ${to}.`);
} catch (error) {
  console.error('Failed to send email:', error);
  process.exit(1);
}
