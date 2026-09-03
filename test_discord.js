import fetch from 'node-fetch';
async function test() {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if(url) {
    console.log('PASS: Webhook URL successfully retrieved from process.env');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '🔔 **Journal Gem**\nBackend environment test connection verified.' })
    });
    if(res.ok) console.log('PASS: Discord webhook triggered successfully');
    else console.log('FAIL: Discord API rejected payload - ' + res.status);
  } else {
    console.log('FAIL: Webhook URL not found in process.env');
  }
}
test();
