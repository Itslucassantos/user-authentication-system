export default class Email {
  private readonly _email: string;

  constructor(email: string) {
    this._email = email;
    this.validateEmail(email);
  }

  get value(): string {
    return this._email;
  }

  private validateEmail(email: string): void {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      throw new Error('Invalid email format');
    }
  }
}
