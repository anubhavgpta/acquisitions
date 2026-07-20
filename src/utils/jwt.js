import jwt from 'jsonwebtoken';
import logger from '#config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}
const JWT_EXPIRES_IN = '1d';

export const jwttoken = {
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (e) {
      logger.error('Failed to authenticate token', e);
      throw new Error('Failed to authenticate token', { cause: e });
    }
  },
  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      logger.error('Failed to authenticate token', e);
      throw new Error('Failed to authenticate token', { cause: e });
    }
  },
};
