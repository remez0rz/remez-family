// Notification categories the user can toggle, grouped by role so each person
// only sees the kinds of notifications they actually receive.
//
// Category ids are also the values passed as `category` to /api/push/send, which
// skips a recipient whose notif_prefs[category] === false (default on).
export const NOTIF_CATEGORIES = {
  parent: [
    { id: 'achievements', emoji: '🌟', label: 'הישגים ועליות רמה', desc: 'כשילד משלים אתגר חשוב או עולה רמה' },
    { id: 'rewards',      emoji: '🎁', label: 'פרסים',             desc: 'בקשות פרס מהילדים' },
    { id: 'suggestions',  emoji: '💡', label: 'הצעות מסבא וסבתא',  desc: 'משימות ופרסים שממתינים לאישור' },
  ],
  grandparent: [
    { id: 'moments', emoji: '💜', label: 'רגעים משפחתיים', desc: 'רגעים חדשים שהילדים משתפים (יכול להיות הרבה)' },
    { id: 'rewards', emoji: '🎁', label: 'פרסים',          desc: 'כשילד נהנה מפרס חדש' },
  ],
}

export function categoriesFor(role) {
  return NOTIF_CATEGORIES[role] || NOTIF_CATEGORIES.parent
}

// A category is on unless explicitly turned off.
export function isOn(prefs, id) {
  return prefs?.[id] !== false
}
