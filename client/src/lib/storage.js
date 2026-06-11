const KEY = 'pcb_builds';

export function loadBuilds() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function saveBuilds(builds) {
  localStorage.setItem(KEY, JSON.stringify(builds));
}

export function deleteBuild(id) {
  saveBuilds(loadBuilds().filter((b) => b.id !== id));
}
