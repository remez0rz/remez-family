// World Cup 2026 shared data & helpers

// Tournament window (Israel time). Flags + Mondial UI show during this period.
// Starts before kickoff (June 11) so the family can pick teams in the lead-up.
export const WC_START = new Date('2026-06-01T00:00:00+03:00')
export const WC_END   = new Date('2026-07-20T00:00:00+03:00')

export function isWorldCupActive(date = new Date()) {
  return date >= WC_START && date <= WC_END
}

// Participating / expected teams for the 48-team 2026 World Cup.
// code = short id, flag = emoji, name = Hebrew display name.
export const WC_TEAMS = [
  { code: 'ARG', flag: '🇦🇷', name: 'ארגנטינה' },
  { code: 'BRA', flag: '🇧🇷', name: 'ברזיל' },
  { code: 'FRA', flag: '🇫🇷', name: 'צרפת' },
  { code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'אנגליה' },
  { code: 'ESP', flag: '🇪🇸', name: 'ספרד' },
  { code: 'GER', flag: '🇩🇪', name: 'גרמניה' },
  { code: 'POR', flag: '🇵🇹', name: 'פורטוגל' },
  { code: 'NED', flag: '🇳🇱', name: 'הולנד' },
  { code: 'BEL', flag: '🇧🇪', name: 'בלגיה' },
  { code: 'ITA', flag: '🇮🇹', name: 'איטליה' },
  { code: 'CRO', flag: '🇭🇷', name: 'קרואטיה' },
  { code: 'URU', flag: '🇺🇾', name: 'אורוגוואי' },
  { code: 'USA', flag: '🇺🇸', name: 'ארה"ב' },
  { code: 'MEX', flag: '🇲🇽', name: 'מקסיקו' },
  { code: 'CAN', flag: '🇨🇦', name: 'קנדה' },
  { code: 'JPN', flag: '🇯🇵', name: 'יפן' },
  { code: 'KOR', flag: '🇰🇷', name: 'דרום קוריאה' },
  { code: 'AUS', flag: '🇦🇺', name: 'אוסטרליה' },
  { code: 'MAR', flag: '🇲🇦', name: 'מרוקו' },
  { code: 'SEN', flag: '🇸🇳', name: 'סנגל' },
  { code: 'NGA', flag: '🇳🇬', name: 'ניגריה' },
  { code: 'EGY', flag: '🇪🇬', name: 'מצרים' },
  { code: 'GHA', flag: '🇬🇭', name: 'גאנה' },
  { code: 'CIV', flag: '🇨🇮', name: 'חוף השנהב' },
  { code: 'CMR', flag: '🇨🇲', name: 'קמרון' },
  { code: 'COL', flag: '🇨🇴', name: 'קולומביה' },
  { code: 'ECU', flag: '🇪🇨', name: 'אקוודור' },
  { code: 'CHI', flag: '🇨🇱', name: "צ'ילה" },
  { code: 'PER', flag: '🇵🇪', name: 'פרו' },
  { code: 'SUI', flag: '🇨🇭', name: 'שווייץ' },
  { code: 'DEN', flag: '🇩🇰', name: 'דנמרק' },
  { code: 'SWE', flag: '🇸🇪', name: 'שוודיה' },
  { code: 'NOR', flag: '🇳🇴', name: 'נורווגיה' },
  { code: 'POL', flag: '🇵🇱', name: 'פולין' },
  { code: 'AUT', flag: '🇦🇹', name: 'אוסטריה' },
  { code: 'SRB', flag: '🇷🇸', name: 'סרביה' },
  { code: 'TUR', flag: '🇹🇷', name: 'טורקיה' },
  { code: 'UKR', flag: '🇺🇦', name: 'אוקראינה' },
  { code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'סקוטלנד' },
  { code: 'WAL', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', name: 'ויילס' },
  { code: 'KSA', flag: '🇸🇦', name: 'ערב הסעודית' },
  { code: 'IRN', flag: '🇮🇷', name: 'איראן' },
  { code: 'QAT', flag: '🇶🇦', name: 'קטאר' },
  { code: 'TUN', flag: '🇹🇳', name: 'תוניסיה' },
  { code: 'CPV', flag: '🇨🇻', name: 'כף ורדה' },
  { code: 'COD', flag: '🇨🇩', name: 'קונגו' },
  { code: 'UZB', flag: '🇺🇿', name: 'אוזבקיסטן' },
  { code: 'PAR', flag: '🇵🇾', name: 'פרגוואי' },
]

export function teamByCode(code) {
  if (!code) return null
  return WC_TEAMS.find(t => t.code === code) || null
}

export function flagFor(code) {
  return teamByCode(code)?.flag || ''
}
