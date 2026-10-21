import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  PUBLIC_COMBAT_ENGINE_URL: { public: true, static: true },
});
