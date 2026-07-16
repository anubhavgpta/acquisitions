import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';

describe('userIdSchema', () => {
  it('accepts a positive numeric id and coerces it to a number', () => {
    const result = userIdSchema.safeParse({ id: '42' });

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(42);
  });

  it('rejects a non-numeric id', () => {
    const result = userIdSchema.safeParse({ id: 'abc' });

    expect(result.success).toBe(false);
  });

  it('rejects a zero or negative id', () => {
    const result = userIdSchema.safeParse({ id: '0' });

    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('accepts a partial update with a single valid field', () => {
    const result = updateUserSchema.safeParse({ name: 'Jane Doe' });

    expect(result.success).toBe(true);
  });

  it('normalizes email to lowercase and trims whitespace', () => {
    const result = updateUserSchema.safeParse({ email: '  Jane@Example.com  ' });

    expect(result.success).toBe(true);
    expect(result.data.email).toBe('jane@example.com');
  });

  it('rejects an empty update object', () => {
    const result = updateUserSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('rejects an invalid role', () => {
    const result = updateUserSchema.safeParse({ role: 'superadmin' });

    expect(result.success).toBe(false);
  });
});
