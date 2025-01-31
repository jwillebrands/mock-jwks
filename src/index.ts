import nock from 'nock'
import * as request from 'superagent'
import url from 'url'
import { createJWKS, createKeyPair, signJwt } from './tools'
export interface JWKSMock {
  start(): void
  stop(): Promise<void>
  kid(): string
  token(token: Record<string, unknown>): string
}

const createJWKSMock = (
  jwksOrigin: string,
  jwksPath = '/.well-known/jwks.json'
): JWKSMock => {
  const keypair = createKeyPair()
  const JWKS = createJWKS({
    ...keypair,
    jwksOrigin,
  })
  let jwksUrlNock: nock.Scope
  return {
    start() {
      jwksUrlNock = nock(jwksOrigin).get(jwksPath).reply(200, JWKS).persist()
    },
    async stop() {
      if (jwksUrlNock) {
        jwksUrlNock.persist(false)
        await request.get(url.resolve(jwksOrigin, jwksPath)) // Hack to remove the last nock.
      }
    },
    kid() {
      return JWKS.keys[0].kid
    },
    token(token = {}) {
      return signJwt(keypair.privateKey, token, this.kid())
    },
  }
}

export default createJWKSMock
