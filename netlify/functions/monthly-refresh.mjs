/**
 * monthly-refresh.mjs
 *
 * Netlify Scheduled Function — fires on the 17th of each month at 07:00 UTC.
 * NHS England publishes the GP Patient Register between the 10th–16th of each
 * month, so the 17th gives a reliable one-day buffer after the latest
 * possible publication date.
 *
 * All it does is POST to the Netlify Build Hook, which triggers a fresh build
 * that runs scripts/fetch-nhs-data.mjs and picks up the new month's data.
 *
 * Configuration:
 *   Set the environment variable NETLIFY_BUILD_HOOK_URL in Netlify's UI:
 *   Site → Site configuration → Environment variables
 *
 *   To create a build hook:
 *   Site → Site configuration → Build & deploy → Build hooks → Add build hook
 *   Name it "Monthly NHS data refresh", branch "main".
 *   Copy the generated URL into NETLIFY_BUILD_HOOK_URL.
 */

import { schedule } from '@netlify/functions'

export const handler = schedule('0 7 17 * *', async (_event) => {
  const hookUrl = process.env.NETLIFY_BUILD_HOOK_URL

  if (!hookUrl) {
    console.log('[monthly-refresh] NETLIFY_BUILD_HOOK_URL not set — skipping rebuild trigger.')
    console.log('[monthly-refresh] Set this env var in Netlify to enable automatic monthly data refresh.')
    return { statusCode: 200, body: 'Hook URL not configured' }
  }

  try {
    const res = await fetch(hookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger_title: 'Monthly NHS data refresh' }),
    })

    if (res.ok) {
      console.log(`[monthly-refresh] ✅ Build triggered successfully (HTTP ${res.status})`)
      return { statusCode: 200, body: 'Build triggered' }
    } else {
      console.error(`[monthly-refresh] ✗ Build hook returned HTTP ${res.status}`)
      return { statusCode: 500, body: `Hook returned ${res.status}` }
    }
  } catch (err) {
    console.error('[monthly-refresh] ✗ Failed to trigger build:', err.message)
    return { statusCode: 500, body: err.message }
  }
})
