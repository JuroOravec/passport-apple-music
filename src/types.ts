import type { StrategyOptions as OAuth2StrategyOptions } from 'passport-oauth2';
import type passport from 'passport';
import type express from 'express';
import type { SignOptions, Algorithm } from 'jsonwebtoken';

export interface Profile extends Pick<passport.Profile, 'provider'> {
  expiresIn: number;
}

export interface AuthenticateOptions extends passport.AuthenticateOptions {
  showDialog?: boolean;
}

export interface StrategyOptions
  extends Omit<
    OAuth2StrategyOptions,
    'authorizationURL' | 'tokenURL' | 'clientID' | 'clientSecret'
  > {
  /**
   * Your Team ID (aka Developer ID).
   *
   * A 10-letter ID that can be found on your account page at https://developer.apple.com/account/#/membership.
   *
   * This ID requires Apple Developer Program membership ($100/yr).
   */
  teamID: string;
  /**
   * Your Key ID for MusicKit.
   *
   * A 10-letter ID that can be found or created at https://developer.apple.com/account/resources/authkeys/list.
   *
   * The key **MUST** have "MusicKit" among "Enabled Services".
   *
   * To create Key ID with MusicKit access:
   * 1) Create Music IDs Identifier at https://developer.apple.com/account/resources/identifiers
   * 2) Register new Key at https://developer.apple.com/account/resources/authkeys/add
   *    1. Enable (tick) MusicKit
   *    2. Click "Configure" and select the Music ID from step 1)
   *    3. Save / Continue
   * 3) Confirm MusicKit is among enabled services when you go to https://developer.apple.com/account/resources/authkeys/review/<KeyID>
   */
  keyID: string;
  /**
   * Path to the file with private key that belongs to the keyID.
   *
   * Private key can be downloaded from https://developer.apple.com/account/resources/authkeys/review/<KeyID>.
   *
   * Note: Private key can be downloaded only once.
   */
  privateKeyLocation: string;
  /** App Name shown on auth page */
  appName?: string;
  /** Url of app icon shown on auth page */
  appIcon?: string;
  jwtOptions?: SignOptions & {
    /**
     * Encryption algorithm as mentioned in Apple Music API token generation guide.
     *
     * DO NOT override this value unless you know what you are doing.
     *
     * Defaults to 'ES256'.
     *
     * See https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens.
     */
    algorithm?: Algorithm;
    /**
     * JWT expiry.
     *
     * Maximum expiry for Apple Music API token is "180d".
     *
     * Expressed in seconds or a string describing a time span [zeit/ms](https://github.com/zeit/ms.js).
     *
     * Eg: 60, "2 days", "10h", "7d"
     */
    expiresIn?: string | number;
  };
}

export interface StrategyOptionsWithRequest
  extends Omit<StrategyOptions, 'passReqToCallback'> {
  passReqToCallback: true;
}

export type VerifyFunction = (
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  done: (error: any, user?: any, info?: any) => void
) => void;

export type VerifyFunctionWithRequest = (
  req: express.Request,
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  done: (error: any, user?: any, info?: any) => void
) => void;
