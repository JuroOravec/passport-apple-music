import fs from 'fs';
import jwt, { SignOptions } from 'jsonwebtoken';

export const encodeMusicKitToken = (
  options: SignOptions & {
    teamId: string;
    keyId: string;
    privateKeyLocation: string;
  }
): string => {
  const { teamId, keyId, privateKeyLocation, ...signOptions } = options;

  const privateKey = fs.readFileSync(privateKeyLocation).toString();

  const jwtToken = jwt.sign({}, privateKey, {
    ...signOptions,
    expiresIn: signOptions.expiresIn || '180d',
    algorithm: signOptions.algorithm || 'ES256',
    issuer: teamId,
    header: {
      ...signOptions.header,
      alg: 'ES256',
      kid: keyId,
    },
  });

  return jwtToken;
};
