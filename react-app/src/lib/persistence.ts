import { Profile } from '../types';

const STORAGE_KEY = 'spellboundmaze:profiles:v1';
const SETTINGS_KEY = 'spellboundmaze:settings:v1';

export function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Profile[];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Profile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function addProfile(p: Profile) {
  const list = loadProfiles();
  // replace temp id if already present
  const existing = list.findIndex(x=>x.id===p.id);
  if(existing >= 0){ list[existing] = p; saveProfiles(list); return }
  list.push(p);
  saveProfiles(list);
}

export function updateProfile(updated: Profile) {
  const list = loadProfiles().map(p => p.id === updated.id ? updated : p);
  saveProfiles(list);
}

export function deleteProfile(id: string) {
  const list = loadProfiles().filter(p => p.id !== id);
  saveProfiles(list);
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveSettings(s: any) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch(e){}
}
