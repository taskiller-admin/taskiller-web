import { get, writable } from 'svelte/store';

const token = writable<string | null>(null);
export const accessToken = { subscribe: token.subscribe };
export const getAccessToken = () => get(token);
export const setAccessToken = (value: string | null) => token.set(value);
