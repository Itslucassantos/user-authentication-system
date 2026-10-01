import FakeMailer from '../../../@testing/fakes/fake-mailer.js';
import UserCreatedEvent from '../../../domain/user/event/user-created.event.js';
import SendInvitationEmailHandler from './send-invitation-email.handler.js';

describe('SendInvitationEmailHandler', () => {
  it('sends the invitation token to the e-mail of the new user', async () => {
    const mailer = new FakeMailer();
    const handler = new SendInvitationEmailHandler(mailer);

    await handler.handle(
      new UserCreatedEvent({
        userId: 'user-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        invitationToken: 'invitation-token',
      }),
    );

    expect(mailer.invitations).toEqual([{ to: 'john.doe@example.com', token: 'invitation-token' }]);
    expect(mailer.passwordResets).toHaveLength(0);
  });

  it('lets mailer failures surface to the dispatcher', async () => {
    const mailer = new FakeMailer();
    jest.spyOn(mailer, 'sendInvitationEmail').mockRejectedValueOnce(new Error('smtp down'));
    const handler = new SendInvitationEmailHandler(mailer);

    await expect(
      handler.handle(
        new UserCreatedEvent({ userId: 'u', name: 'n', email: 'a@b.co', invitationToken: 't' }),
      ),
    ).rejects.toThrow('smtp down');
  });
});
