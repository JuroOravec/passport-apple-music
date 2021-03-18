import path from 'path';
import fs from 'fs';
import OAuth2Strategy from 'passport-oauth2';
import type { Request } from 'express';
import ms from 'ms';

import { encodeMusicKitToken } from './encodeMusicKitToken';
import type {
  StrategyOptions,
  StrategyOptionsWithRequest,
  VerifyFunction,
  VerifyFunctionWithRequest,
  AuthenticateOptions,
  Profile,
} from './types';

interface AppleMusicStrategy {
  new (
    options: StrategyOptionsWithRequest,
    verify: VerifyFunctionWithRequest
  ): void;
  new (options: StrategyOptions, verify: VerifyFunction): void;
}

/**
 * `Strategy` constructor.
 *
 * The Apple Music authentication strategy authenticates requests by delegating to
 * Apple using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `teamID`              Your Apple Developer Membership Team ID
 *   - `keyID`               Your Key ID with permission for for Apple Music.
 *   - `privateKeyLocation`  Path to the file with private key corresponding to keyID
 *   - `callbackURL`         URL to which the user will be redirected after granting authorization
 *
 * Examples:
 *
 *     passport.use(new AppleMusicStrategy({
 *       teamID: "<YOUR_TEAM_ID>",
 *       keyID: "<YOUR_KEY_ID>",
 *       privateKeyLocation: "path/to/AuthKey_<YOUR_KEY_ID>.p8"
 *       callbackURL: "<CALLBACK_URL>",
 *       passReqToCallback: true
 *     }, function(req, accessToken, refreshToken, profile, cb) {
 *       // The JWT dev token used to generate the music user token can be accessed via req.query.id_token_hint
 *       // Use this token in authorization header as
 *       // Authorization: Bearer <DEV_TOKEN>
 *       const devToken = req.query.id_token_hint;
 *       // accessToken is the music user token. Always use this token with the devToken above.
 *       // Music-User-Token: <MUSIC_USER_TOKEN>
 *       const musicUserToken = accessToken;
 *
 *        cb(null, ...);
 *     }));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */

class AppleMusicStrategy extends OAuth2Strategy implements AppleMusicStrategy {
  name: string;

  _options: (StrategyOptionsWithRequest | StrategyOptions) & {
    authorizationURL: string;
  };

  constructor(
    options: StrategyOptionsWithRequest | StrategyOptions,
    verify: VerifyFunctionWithRequest | VerifyFunction
  ) {
    const optionsWithDefaults = {
      ...options,
      authorizationURL: 'https://authorize.music.apple.com/woa',
      tokenURL: 'none',
      clientID: 'none',
      clientSecret: 'none',
    };

    // @ts-expect-error - super expects StrategyOptionsWithRequest
    super(optionsWithDefaults, verify);

    this.name = 'apple-music';
    this._options = optionsWithDefaults;

    // @ts-expect-error - getOAuthAccessToken is less permissive than us
    this._oauth2.getOAuthAccessToken = function getOAuthAccessToken(
      code: string,
      params: Record<string, string>,
      callback: (
        err: { statusCode: number; data?: any; } | null,
        accessToken?: string,
        refreshToken?: string,
        params?: any
      ) => void
    ) {
      if (!code) return callback({ statusCode: 403, data: 'No auth code received' });
      return callback(null, code, undefined, params);
    };
  }

  authenticate(req: Request, options: AuthenticateOptions): void {
    const oldRedirect = this.redirect;
    this.redirect = (url: string, status?: number) => {
      const authUrl = new URL(this._options.authorizationURL);
      const redirectUrl = new URL(url);

      const urlMatch =
        authUrl.origin === redirectUrl.origin &&
        authUrl.pathname === redirectUrl.pathname;

      if (urlMatch && req.res) {
        const {
          teamID: teamId,
          keyID: keyId,
          privateKeyLocation,
          jwtOptions,
        } = this._options;

        const token = encodeMusicKitToken({
          teamId,
          keyId,
          ...jwtOptions,
          privateKeyLocation,
        });

        const html = fs
          .readFileSync(path.join(`${__dirname  }/index.html`), 'utf-8')
          .replace('$TOKEN', token)
          .replace('$REDIRECT_URI', this._options.callbackURL || '')
          .replace('$STATE', redirectUrl.searchParams.get('state') || '')
          .replace('$APP_NAME', this._options.appName || '')
          .replace('$APP_ICON', this._options.appIcon || '')
          .replace('$SHOW_DIALOG', Boolean(options.showDialog).toString());

        req.res.send(html);
        return;
      }
      oldRedirect(url, status);
    };

    super.authenticate(req, options);
  }

  userProfile(
    accessToken: string,
    done: (err?: Error | null, profile?: any) => void
  ): void {
    const expiresIn = this._options.jwtOptions?.expiresIn ?? '180d';
    const profile: Profile = {
      provider: 'apple-music',
      expiresIn: Math.floor(
        (typeof expiresIn === 'string' ? ms(expiresIn) : expiresIn) / 1000
      ),
    };
    return done(null, profile);
  }
}

export { AppleMusicStrategy as Strategy };
