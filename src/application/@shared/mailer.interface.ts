export default interface MailerInterface {
  sendInvitationEmail(to: string, invitationToken: string): Promise<void>;
  sendPasswordResetEmail(to: string, resetToken: string): Promise<void>;
}
