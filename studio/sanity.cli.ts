import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: 'iba4i6lg',
    dataset: 'production',
  },
  // The editor lives at https://eqlbrm.sanity.studio after `npm run deploy`.
  studioHost: 'eqlbrm',
  deployment: {
    autoUpdates: true,
  },
});
