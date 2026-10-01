import FakeMailer from '../../../@testing/fakes/fake-mailer.js';
import PasswordResetRequestedEvent from '../../../domain/auth/event/password-reset-requested.event.js';
import SendPasswordResetEmailHandler from './send-password-reset-email.handler.js';

describe('SendPasswordResetEmailHandler', () => {
  it('sends the reset token to the e-mail of the event', async () => {
    const mailer = new FakeMailer();
    const handler = new SendPasswordResetEmailHandler(mailer);

    await handler.handle(
      new PasswordResetRequestedEvent({
        userId: 'user-1',
        email: 'john.doe@example.com',
        resetToken: 'reset-token',
      }),
    );

    expect(mailer.passwordResets).toEqual([{ to: 'john.doe@example.com', token: 'reset-token' }]);
    expect(mailer.invitations).toHaveLength(0);
  });

  it('lets mailer failures surface to the dispatcher', async () => {
    const mailer = new FakeMailer();
    jest.spyOn(mailer, 'sendPasswordResetEmail').mockRejectedValueOnce(new Error('smtp down'));
    const handler = new SendPasswordResetEmailHandler(mailer);

    await expect(
      handler.handle(
        new PasswordResetRequestedEvent({ userId: 'u', email: 'a@b.co', resetToken: 't' }),
      ),
    ).rejects.toThrow('smtp down');
  });
});
