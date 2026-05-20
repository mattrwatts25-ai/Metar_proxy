// Watts Aviation — METAR Proxy
// Deployed on Vercel (free). Fetches from aviationweather.gov
// and adds CORS headers so your map can read the data from any browser.

export default async function handler(req, res) {
  // Allow requests from any origin (your map, Wix, Wallpaper Engine, etc.)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const ids = req.query.ids;
  if (!ids) { res.status(400).json({ error: 'No ids provided' }); return; }

  try {
    const url = `https://aviationweather.gov/api/data/metar?ids=${ids}&format=json&hours=2`;
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`AWC returned ${upstream.status}`);
    const raw = await upstream.json();

    // Translate AWC format → the shape our map expects
    const data = raw.map(m => ({
      icaoId:         m.icaoId,
      lat:            m.lat,
      lon:            m.lon,
      flightCategory: m.flightCategory,
      rawOb:          m.rawOb,
      reportTime:     m.reportTime,
      wdir:           m.wdir,
      wspd:           m.wspd,
      wgst:           m.wgst,
      visib:          m.visib,
      temp:           m.temp,
      dewp:           m.dewp,
      altim:          m.altim ? (m.altim * 0.02953).toFixed(2) : null,
      wxString:       m.wxString || null,
      clouds:         (m.clouds || []).map(c => ({ cover: c.cover, base: c.base }))
    }));

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
