import fs from 'fs/promises';
import path from 'path';

const dataDir = path.resolve('server/src/database/data');
const dataFile = path.join(dataDir, 'store.json');

const initialState = {
  user: {
    fullName: '',
    phone: '',
    nationalId: '',
    wilaya: 'سوق أهراس',
    commune: '',
    extraInfo: ''
  },
  logs: [],
  chats: [],
  status: {
    server: 'online',
    playwright: 'idle',
    bot: 'online',
    monitoring: false,
    registration: 'بانتظار بدء المراقبة',
    lastCheck: null,
    checkSpeed: 0,
    attempts: 0,
    currentWilaya: 'سوق أهراس',
    otpRequested: false
  }
};

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(initialState, null, 2), 'utf8');
  }
}

export async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, 'utf8');
  return { ...initialState, ...JSON.parse(raw) };
}

export async function writeStore(nextState) {
  await ensureStore();
  await fs.writeFile(dataFile, JSON.stringify(nextState, null, 2), 'utf8');
  return nextState;
}

export async function updateStore(updater) {
  const state = await readStore();
  const nextState = await updater(state);
  return writeStore(nextState);
}
