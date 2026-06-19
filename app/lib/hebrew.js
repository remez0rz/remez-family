// Gendered Hebrew helpers — so verbs/adjectives read correctly (e.g. on the
// text-to-speech feature). Pick the female form only for an explicit
// gender === 'female'; null/unknown falls back to the male form.
export function vg(gender, male, female) {
  return gender === 'female' ? female : male
}

// Convenience for the most common feed/notification phrases, keyed by gender.
export const phrases = {
  earnedPoints: (g) => vg(g, 'צבר', 'צברה'),       // "<name> צבר/צברה נקודות"
  reachedLevel: (g) => vg(g, 'הגיע', 'הגיעה'),     // "<name> הגיע/הגיעה לרמה"
  shared:       (g) => vg(g, 'שיתף', 'שיתפה'),     // "<name> שיתף/שיתפה רגע"
  commented:    (g) => vg(g, 'הגיב', 'הגיבה'),     // "<name> הגיב/הגיבה לך"
  enjoyed:      (g) => vg(g, 'נהנה', 'נהנתה'),     // "<name> נהנה/נהנתה מ..."
}
