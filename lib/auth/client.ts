'use client';
let client: ReturnType<typeof import('@neon/auth/next').createAuthClient> | undefined;
export async function getAuthClient(){return client ??= (await import('@neon/auth/next')).createAuthClient();}
