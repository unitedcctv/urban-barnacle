# Chatwoot for Urban Barnacle

The website has an optional, click-to-load chat launcher. The self-hosted service
runs as a separate Docker Compose project on the production host, behind the
existing Traefik proxy at `https://chat.ubdm.io`. It uses Chatwoot Community Edition
4.19.0, a separate PostgreSQL 16 database, Redis, and a shared uploads volume.
The normal website deployment does not start or stop Chatwoot.

## First deployment

1. Create a DNS A record for `chat.ubdm.io` pointing to the production server
   (and an AAAA record only if that server supports IPv6). Traefik must already
   have its `traefik-public` network, HTTPS redirect, and `le` certificate resolver.
2. In GitHub's **production** environment, add these **variables**:
   - `CHATWOOT_DOMAIN`: `chat.ubdm.io`
   - `CHATWOOT_ADMIN_EMAIL`: `karl@ubdm.io`
   - `CHATWOOT_SMTP_DOMAIN`: `mg.ubdm.io`
3. Add these **secrets**, with a different random value for each:
   - `CHATWOOT_ADMIN_PASSWORD`: strong password for the initial administrator.
   - `CHATWOOT_SECRET_KEY_BASE`: generate with `openssl rand -hex 64`.
   - `CHATWOOT_POSTGRES_PASSWORD`: generate with `openssl rand -hex 32`.
   - `CHATWOOT_REDIS_PASSWORD`: generate with `openssl rand -hex 32`.
   - `CHATWOOT_ENCRYPTION_PRIMARY_KEY`: generate with `openssl rand -hex 16`.
   - `CHATWOOT_ENCRYPTION_DETERMINISTIC_KEY`: generate with `openssl rand -hex 16`.
   - `CHATWOOT_ENCRYPTION_KEY_DERIVATION_SALT`: generate with `openssl rand -hex 16`.
4. The deployment reuses the existing `SMTP_HOST` and `EMAILS_FROM_EMAIL`
   variables and `SMTP_USER` and `SMTP_PASSWORD` secrets. These must contain
   working Mailgun SMTP credentials. Chatwoot uses port 587 with STARTTLS.
5. Commit/push the setup and run **Actions → Deploy Chatwoot → Run workflow**.
   This initializes the database and creates the first administrator before
   exposing the web service. Public signup and installation onboarding are
   disabled. Subsequent deployments preserve the account and its password.
6. Sign in at `https://chat.ubdm.io` using the new administrator credentials.
   Create a **Website** inbox for `https://ubdm.io`, add yourself as an agent,
   and configure its greeting, availability, and allowed website domains.
7. Copy the inbox's `websiteToken` from its installation snippet. Add these
   GitHub production **variables**:
   - `VITE_CHATWOOT_BASE_URL`: `https://chat.ubdm.io`
   - `VITE_CHATWOOT_WEBSITE_TOKEN`: that inbox's website token.
   The website token is public; never put an agent API token in a `VITE_` value.
8. Redeploy the website. The launcher only appears when both variables are set.
   Send a test conversation from a phone and desktop and reply from Chatwoot.

The launcher sits above the website footer and loads the SDK only after a visitor
clicks **Chat with us**. If loading fails, it offers `karl@ubdm.io` as a fallback.
It does not automatically send the signed-in website user's identity to Chatwoot.
Review the site's privacy notice for the chat messages and visitor data you retain.

## Operations

Use the same production environment values when running commands on the server:

```sh
docker compose -f docker-compose.chatwoot.yml -p urban-barnacle-chatwoot ps
docker compose -f docker-compose.chatwoot.yml -p urban-barnacle-chatwoot logs --tail=100 rails sidekiq
```

Keep the signing/encryption keys stable. Back up the Chatwoot Postgres database
and `storage` volume together, and retain the keys in your secret manager.
Redis also has a persistent volume for queued jobs. Do not use `down -v` unless
you intend to erase the instance. No database or Redis port is published.

For upgrades, back up first, change the pinned image in
`docker-compose.chatwoot.yml`, and run the Chatwoot workflow. It stops web and
worker processes before migrations; this causes brief chat downtime. If migrations
fail, the workflow stops with those processes still stopped for investigation.
Restoring a previous image may also require restoring the pre-upgrade database.

Chatwoot needs additional server resources beyond the existing website; check
[Chatwoot's requirements](https://developers.chatwoot.com/self-hosted/deployment/requirements)
before deployment. The stack follows the
[official Docker deployment guide](https://developers.chatwoot.com/self-hosted/deployment/docker).

## Local frontend verification

```sh
cd frontend
npx playwright test --config=playwright.chatwoot.config.ts
```

These tests mock the Chatwoot SDK; they do not send messages or require a live instance.
