import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = async (plainPassword: string): Promise<string> =>
  bcrypt.hash(plainPassword, SALT_ROUNDS);

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => bcrypt.compare(plainPassword, hashedPassword);
