/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_MASTODON_URL?: string;
  readonly VITE_BLUESKY_URL?: string;
  readonly VITE_REDDIT_URL?: string;
  readonly VITE_LINKEDIN_URL?: string;
  readonly VITE_YOUTUBE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
