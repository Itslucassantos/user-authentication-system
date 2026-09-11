export default class Email {
  private readonly _email: string;

  constructor(email: string) {
    this._email = email;
    this.validateEmail(email);
  }

  private validateEmail(email: string): void {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      throw new Error('Invalid email format');
    }
  }
}
