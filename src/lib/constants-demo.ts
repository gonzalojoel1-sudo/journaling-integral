// src/lib/constants-demo.ts
// Demo user constants used ONLY by seed scripts and dev tooling.
// Must not be imported by runtime application code.

export const DEMO_USER_ID = 'demo-user-id' as const;
export const DEMO_USER_EMAIL = 'joel@journalingintegral.demo' as const;
export const DEMO_USER_NAME = 'Joel Pacheco' as const;
export const DEMO_USER_PASSWORD_HASH =
  '7d2143c548907019260ce52552eab73d263ba0343bcbabf3780aebfaa62dea003bbc1a3522005bd091e31158b10526bd11909312a98b3cca418b8eba0c806aa5' as const;