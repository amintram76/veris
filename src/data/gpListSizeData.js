// ─── Period definitions ────────────────────────────────────────────────────
// 24 months: May 2024 → Apr 2026
export const periods = [
  { id: '2024-05', label: 'May 2024' },
  { id: '2024-06', label: 'Jun 2024' },
  { id: '2024-07', label: 'Jul 2024' },
  { id: '2024-08', label: 'Aug 2024' },
  { id: '2024-09', label: 'Sep 2024' },
  { id: '2024-10', label: 'Oct 2024' },
  { id: '2024-11', label: 'Nov 2024' },
  { id: '2024-12', label: 'Dec 2024' },
  { id: '2025-01', label: 'Jan 2025' },
  { id: '2025-02', label: 'Feb 2025' },
  { id: '2025-03', label: 'Mar 2025' },
  { id: '2025-04', label: 'Apr 2025' },
  { id: '2025-05', label: 'May 2025' },
  { id: '2025-06', label: 'Jun 2025' },
  { id: '2025-07', label: 'Jul 2025' },
  { id: '2025-08', label: 'Aug 2025' },
  { id: '2025-09', label: 'Sep 2025' },
  { id: '2025-10', label: 'Oct 2025' },
  { id: '2025-11', label: 'Nov 2025' },
  { id: '2025-12', label: 'Dec 2025' },
  { id: '2026-01', label: 'Jan 2026' },
  { id: '2026-02', label: 'Feb 2026' },
  { id: '2026-03', label: 'Mar 2026' },
  { id: '2026-04', label: 'Apr 2026' },
]

// England-wide average registered patients per practice, per month (May 2024 → Apr 2026)
// Modelled on published NHS England data; rises as practices close/merge
export const nationalAverages = [
  9289, 9301, 9314, 9326, 9338, 9351, 9363, 9375,
  9388, 9400, 9413, 9425, 9438, 9450, 9462, 9475,
  9487, 9499, 9512, 9524, 9537, 9549, 9562, 9574,
]

// ─── Sample data helper ───────────────────────────────────────────────────
// Generates 24 monthly list-size values from a base (May 2024) + monthly delta.
// Deterministic — no randomness — so values are stable across renders.
function monthly(base, delta) {
  return Array.from({ length: 24 }, (_, i) => Math.max(100, Math.round(base + delta * i)))
}

// ─── 50 sample practices across England ──────────────────────────────────
// listSizes: 24 values, one per month from May 2024 → Apr 2026
export const practices = [
  // Greater Manchester ──────────────────────────────────────────────────
  { code: 'A81001', name: 'Broad Street Medical Practice',    icb: 'NHS Greater Manchester ICB', pcn: 'Manchester City Centre PCN', listSizes: monthly(6089, 17) },
  { code: 'A81002', name: 'Ancoats Primary Care Centre',      icb: 'NHS Greater Manchester ICB', pcn: 'Manchester East PCN',        listSizes: monthly(11423, 5) },
  { code: 'A81003', name: 'Fallowfield Surgery',              icb: 'NHS Greater Manchester ICB', pcn: 'South Manchester PCN',       listSizes: monthly(4045, -5) },
  { code: 'A81004', name: 'Chorlton Family Practice',         icb: 'NHS Greater Manchester ICB', pcn: 'South Manchester PCN',       listSizes: monthly(7845, 39) },
  { code: 'A81005', name: 'Northenden Group Practice',        icb: 'NHS Greater Manchester ICB', pcn: 'Wythenshawe PCN',            listSizes: monthly(9556, 3) },
  { code: 'A81006', name: 'Didsbury Village Surgery',         icb: 'NHS Greater Manchester ICB', pcn: 'South Manchester PCN',       listSizes: monthly(6334, 3) },
  { code: 'A81007', name: 'Old Trafford Medical Centre',      icb: 'NHS Greater Manchester ICB', pcn: 'Salford Central PCN',        listSizes: monthly(8812, -3) },
  { code: 'A81008', name: 'Withington Group Practice',        icb: 'NHS Greater Manchester ICB', pcn: 'South Manchester PCN',       listSizes: monthly(12767, 10) },
  { code: 'A81009', name: 'Salford Central Surgery',          icb: 'NHS Greater Manchester ICB', pcn: 'Salford Central PCN',        listSizes: monthly(5767, 3) },
  { code: 'A81010', name: 'Eccles Practice',                  icb: 'NHS Greater Manchester ICB', pcn: 'Salford East PCN',           listSizes: monthly(3412, -2) },

  // West Yorkshire ──────────────────────────────────────────────────────
  { code: 'B83001', name: 'Headingley Medical Centre',        icb: 'NHS West Yorkshire ICB', pcn: 'Leeds North West PCN',   listSizes: monthly(8434, 6) },
  { code: 'B83002', name: 'Roundhay Road Surgery',            icb: 'NHS West Yorkshire ICB', pcn: 'Leeds North East PCN',   listSizes: monthly(7056, 9) },
  { code: 'B83003', name: 'Meanwood Valley Practice',         icb: 'NHS West Yorkshire ICB', pcn: 'Leeds North West PCN',   listSizes: monthly(3367, -4) },
  { code: 'B83004', name: 'Chapeltown Health Centre',         icb: 'NHS West Yorkshire ICB', pcn: 'Leeds Inner North PCN',  listSizes: monthly(5767, 3) },
  { code: 'B83005', name: 'Pudsey Group Practice',            icb: 'NHS West Yorkshire ICB', pcn: 'West Leeds PCN',         listSizes: monthly(12789, 13) },
  { code: 'B83006', name: 'Harrogate Central Surgery',        icb: 'NHS West Yorkshire ICB', pcn: 'Harrogate PCN',          listSizes: monthly(8067, 5) },
  { code: 'B83007', name: 'Bradford City Practice',           icb: 'NHS West Yorkshire ICB', pcn: 'Bradford City PCN',      listSizes: monthly(9145, -3) },
  { code: 'B83008', name: 'Ilkley Moor Practice',             icb: 'NHS West Yorkshire ICB', pcn: 'Wharfedale PCN',         listSizes: monthly(4656, 3) },
  { code: 'B83009', name: 'Wakefield South Surgery',          icb: 'NHS West Yorkshire ICB', pcn: 'Wakefield South PCN',    listSizes: monthly(10545, 10) },
  { code: 'B83010', name: 'Huddersfield Road Medical Centre', icb: 'NHS West Yorkshire ICB', pcn: 'Kirklees Central PCN',   listSizes: monthly(7212, 3) },

  // North East and North Cumbria ────────────────────────────────────────
  { code: 'C83001', name: 'Gateshead Central Surgery', icb: 'NHS North East and North Cumbria ICB', pcn: 'Gateshead PCN',       listSizes: monthly(7367, 4) },
  { code: 'C83002', name: 'Sunderland Bay Practice',   icb: 'NHS North East and North Cumbria ICB', pcn: 'Sunderland PCN',      listSizes: monthly(5034, -3) },
  { code: 'C83003', name: 'Newcastle Quayside Health', icb: 'NHS North East and North Cumbria ICB', pcn: 'Newcastle Central PCN', listSizes: monthly(8678, 7) },
  { code: 'C83004', name: 'Carlisle Group Practice',   icb: 'NHS North East and North Cumbria ICB', pcn: 'North Cumbria PCN',   listSizes: monthly(9145, -3) },
  { code: 'C83005', name: 'Durham City Surgery',       icb: 'NHS North East and North Cumbria ICB', pcn: 'Durham City PCN',     listSizes: monthly(6878, 3) },

  // Cheshire and Merseyside ─────────────────────────────────────────────
  { code: 'D83001', name: 'Chester City Practice',            icb: 'NHS Cheshire and Merseyside ICB', pcn: 'Chester PCN',           listSizes: monthly(9034, 4) },
  { code: 'D83002', name: 'Liverpool Central Health Centre',  icb: 'NHS Cheshire and Merseyside ICB', pcn: 'Liverpool City Ctr PCN', listSizes: monthly(11056, -5) },
  { code: 'D83003', name: 'Warrington North Surgery',         icb: 'NHS Cheshire and Merseyside ICB', pcn: 'Warrington PCN',         listSizes: monthly(7678, 7) },
  { code: 'D83004', name: 'Wirral Peninsula Practice',        icb: 'NHS Cheshire and Merseyside ICB', pcn: 'Wirral North PCN',       listSizes: monthly(5589, -3) },
  { code: 'D83005', name: 'Macclesfield Group Practice',      icb: 'NHS Cheshire and Merseyside ICB', pcn: 'East Cheshire PCN',      listSizes: monthly(13901, 15) },

  // North West London ───────────────────────────────────────────────────
  { code: 'E81001', name: 'Marylebone Health Centre',      icb: 'NHS North West London ICB', pcn: 'Westminster PCN', listSizes: monthly(9456, 6) },
  { code: 'E81002', name: 'Hampstead Group Practice',      icb: 'NHS North West London ICB', pcn: 'Camden PCN',      listSizes: monthly(8023, 4) },
  { code: 'E81003', name: 'Ealing Road Surgery',           icb: 'NHS North West London ICB', pcn: 'Ealing PCN',      listSizes: monthly(6123, -7) },
  { code: 'E81004', name: 'Paddington Green Practice',     icb: 'NHS North West London ICB', pcn: 'Westminster PCN', listSizes: monthly(10545, 10) },
  { code: 'E81005', name: 'Harrow on the Hill Surgery',    icb: 'NHS North West London ICB', pcn: 'Harrow PCN',      listSizes: monthly(8656, 3) },

  // South East London ───────────────────────────────────────────────────
  { code: 'F81001', name: 'Greenwich Park Surgery',      icb: 'NHS South East London ICB', pcn: 'Greenwich PCN',  listSizes: monthly(7545, 9) },
  { code: 'F81002', name: 'Lewisham Central Practice',   icb: 'NHS South East London ICB', pcn: 'Lewisham PCN',   listSizes: monthly(9323, -4) },
  { code: 'F81003', name: 'Bermondsey Group Practice',   icb: 'NHS South East London ICB', pcn: 'Southwark PCN',  listSizes: monthly(11545, 10) },
  { code: 'F81004', name: 'Camberwell Road Surgery',     icb: 'NHS South East London ICB', pcn: 'Southwark PCN',  listSizes: monthly(5767, 3) },
  { code: 'F81005', name: 'Catford Hill Practice',       icb: 'NHS South East London ICB', pcn: 'Lewisham PCN',   listSizes: monthly(4212, 3) },

  // Sussex ──────────────────────────────────────────────────────────────
  { code: 'G83001', name: 'Brighton Central Surgery',   icb: 'NHS Sussex ICB', pcn: 'Brighton and Hove PCN',   listSizes: monthly(8545, 10) },
  { code: 'G83002', name: 'Worthing Beach Practice',    icb: 'NHS Sussex ICB', pcn: 'Coastal West Sussex PCN', listSizes: monthly(6701, -3) },
  { code: 'G83003', name: 'Crawley New Town Surgery',   icb: 'NHS Sussex ICB', pcn: 'Crawley PCN',             listSizes: monthly(10901, 14) },
  { code: 'G83004', name: 'Eastbourne Medical Practice',icb: 'NHS Sussex ICB', pcn: 'Eastbourne PCN',          listSizes: monthly(7323, 3) },
  { code: 'G83005', name: 'Chichester Group Practice',  icb: 'NHS Sussex ICB', pcn: 'Chichester PCN',          listSizes: monthly(9212, 3) },

  // Bristol, North Somerset and South Gloucestershire ───────────────────
  { code: 'H83001', name: 'Bristol City Centre Practice',         icb: 'NHS Bristol, North Somerset and South Gloucestershire ICB', pcn: 'Bristol Central PCN',        listSizes: monthly(8156, 8) },
  { code: 'H83002', name: 'Clifton Village Surgery',              icb: 'NHS Bristol, North Somerset and South Gloucestershire ICB', pcn: 'Bristol West PCN',            listSizes: monthly(5767, 3) },
  { code: 'H83003', name: 'Knowle West Health Centre',            icb: 'NHS Bristol, North Somerset and South Gloucestershire ICB', pcn: 'Bristol South PCN',           listSizes: monthly(8812, -3) },
  { code: 'H83004', name: 'Weston-super-Mare Group Practice',     icb: 'NHS Bristol, North Somerset and South Gloucestershire ICB', pcn: 'North Somerset PCN',          listSizes: monthly(13945, 16) },
  { code: 'H83005', name: 'Yate Medical Centre',                  icb: 'NHS Bristol, North Somerset and South Gloucestershire ICB', pcn: 'South Gloucestershire PCN',    listSizes: monthly(9767, 10) },
]

export const CHART_COLORS = [
  '#2D6A4F',
  '#E76F51',
  '#264653',
  '#E9C46A',
  '#8338EC',
  '#3A86FF',
  '#F72585',
  '#06D6A0',
]

export const NATIONAL_AVG_COLOR = '#9CA3AF'
