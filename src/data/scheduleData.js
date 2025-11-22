// Simulation d'une base de données partagée entre Admin & Prof
// ⚠️ Ce fichier sera remplacé par le backend plus tard.

export let schedule = {
  "dimanche": {
    "08:00": { salle: "S1", prof: "Ait Ali", occupied: false },
    "10:00": { salle: "S2", prof: "Benhaddou", occupied: false },
    "14:00": { salle: "S3", prof: "Mansouri", occupied: false }
  },
  "lundi": {
    "08:00": { salle: "S1", prof: "Ait Ali", occupied: false },
    "10:00": { salle: "S4", prof: "Rahmani", occupied: false },
    "14:00": { salle: "S6", prof: "Othmane", occupied: false }
  },
  "mardi": {},
  "mercredi": {},
  "jeudi": {}
};

export const hours = [
  "08:00", "09:00", "10:00", "11:00", 
  "12:00", "14:00", "15:00", "16:00"
];

export const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi"];

// Session duration in minutes (used to determine valid marking window)
export const SESSION_DURATION_MINUTES = 60;

// Ceci simule un appel API dans le futur
export const updateCell = (day, hour, salle, prof) => {
  // reset occupancy when admin changes the assignment
  schedule[day][hour] = { salle, prof, occupied: false, occupiedBy: null, occupiedAt: null };
  // persist
  try { localStorage.setItem('schedule', JSON.stringify(schedule)); } catch (e) { /* ignore */ }
};

// Prof marque qu'il est dans la salle 👉 occupation = true
export const markOccupied = (day, hour, userName) => {
  if (schedule[day] && schedule[day][hour]) {
    schedule[day][hour].occupied = true;
    schedule[day][hour].occupiedBy = userName || schedule[day][hour].prof || null;
    schedule[day][hour].occupiedAt = new Date().toISOString();
    try { localStorage.setItem('schedule', JSON.stringify(schedule)); } catch (e) { /* ignore */ }
  }
};

// Prof marque que sa séance est terminée 👉 libère la salle
export const unmarkOccupied = (day, hour, userName) => {
  if (schedule[day] && schedule[day][hour]) {
    // only clear if currently occupied
    schedule[day][hour].occupied = false;
    schedule[day][hour].occupiedBy = null;
    schedule[day][hour].occupiedAt = null;
    try { localStorage.setItem('schedule', JSON.stringify(schedule)); } catch (e) { /* ignore */ }
  }
};

// Persistence helpers
export const loadScheduleFromStorage = () => {
  try {
    const raw = localStorage.getItem('schedule');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    // shallow replace of schedule object keys
    Object.keys(schedule).forEach(day => {
      schedule[day] = parsed[day] || schedule[day] || {};
    });
  } catch (e) {
    // ignore parse errors
  }
};

// Initialize from storage at module load
try { loadScheduleFromStorage(); } catch (e) { /* ignore */ }
