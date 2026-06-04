// Watts Aviation — METAR Proxy v2
// Supports two modes:
//   1. ?ids=KCLL,KDFW        — fetch specific airports (original mode)
//   2. ?bbox=lat1,lon1,lat2,lon2  — fetch all stations within map bounds

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    let url;

    if (req.query.bbox) {
      // Bounding box mode — returns all stations in view
      const [minLat, minLon, maxLat, maxLon] = req.query.bbox.split(',');
      url = `https://aviationweather.gov/api/data/metar?bbox=${minLat},${minLon},${maxLat},${maxLon}&format=json&hours=2`;
    } else if (req.query.ids) {
      // Specific airports mode
      url = `https://aviationweather.gov/api/data/metar?ids=${req.query.ids}&format=json&hours=2`;
    } else {
      res.status(400).json({ error: 'Provide either ids or bbox parameter' });
      return;
    }

    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`AWC returned ${upstream.status}`);
    const raw = await upstream.json();

    if (!Array.isArray(raw)) throw new Error('Unexpected response from AWC');

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
      altim:          m.altim ? parseFloat((m.altim * 0.02953).toFixed(2)) : null,
      wxString:       m.wxString || null,
      clouds:         (m.clouds || []).map(c => ({ cover: c.cover, base: c.base }))
    }));

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
