import { readStore, updateStore } from '../database/store.js';
import { eventBus } from './eventBus.js';

export async function getStatus() {
  const state = await readStore();
  return state.status;
}

export async function setStatus(patch) {
  let status;
  await updateStore((state) => {
    status = { ...state.status, ...patch };
    return { ...state, status };
  });
  eventBus.emit('status:update', status);
  return status;
}

export async function getUser() {
  const state = await readStore();
  return state.user;
}

export async function saveUser(user) {
  const normalized = {
    fullName: String(user.fullName || '').trim(),
    phone: String(user.phone || '').trim(),
    nationalId: String(user.nationalId || '').trim(),
    wilaya: String(user.wilaya || 'سوق أهراس').trim(),
    commune: String(user.commune || '').trim(),
    extraInfo: String(user.extraInfo || '').trim()
  };

  await updateStore((state) => ({ ...state, user: normalized }));
  eventBus.emit('user:update', normalized);
  return normalized;
}

export async function registerChat(chatId) {
  await updateStore((state) => ({
    ...state,
    chats: Array.from(new Set([...state.chats, chatId]))
  }));
}

export async function getChats() {
  const state = await readStore();
  return state.chats;
}
