import Email from './email.js';

describe('Email', () => {
  it('exposes the value it was created with', () => {
    expect(new Email('john.doe@example.com').value).toBe('john.doe@example.com');
  });

  it.each(['', 'john.doe', 'john.doe@', '@example.com', 'john@example', 'john doe@example.com'])(
    'rejects the malformed address "%s"',
    (value) => {
      expect(() => new Email(value)).toThrow('Invalid email format');
    },
  );
});
