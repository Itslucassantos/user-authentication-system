jest.mock('../../infrastructure/mail/nodemailer-mailer.js', () => ({
  __esModule: true,
  default: jest.requireActual('./captured-mail.js').CapturedMailer,
}));
