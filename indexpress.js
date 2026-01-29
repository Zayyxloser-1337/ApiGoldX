export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const goldRes = await fetch('https://api.metals.live/v1/spot')
    const goldData = await goldRes.json()

    if (!goldData || !goldData.gold) {
      throw new Error('Failed to fetch gold price')
    }

    const goldUsdPerOunce = goldData.gold

    const fxRes = await fetch(
      'https://api.exchangerate.host/latest?base=USD&symbols=IDR'
    )
    const fxData = await fxRes.json()

    const usdToIdr = fxData?.rates?.IDR
    if (!usdToIdr) {
      throw new Error('Failed to fetch USD to IDR rate')
    }

    const GRAM_PER_OUNCE = 31.1034768
    const pricePerGramIdr = (goldUsdPerOunce / GRAM_PER_OUNCE) * usdToIdr

    res.status(200).json({
      status: true,
      type: 'REALTIME_SPOT',
      gold: {
        usd_per_ounce: goldUsdPerOunce,
        idr_per_gram: Math.round(pricePerGramIdr)
      },
      fx: {
        usd_to_idr: usdToIdr
      },
      source: {
        gold: 'metals.live',
        fx: 'exchangerate.host'
      },
      updatedAt: new Date().toISOString()
    })
  } catch (e) {
    res.status(500).json({
      status: false,
      error: e.message
    })
  }
}
