const APP_STORE_LOOKUP_URL = "https://itunes.apple.com/lookup?id=6739433324&country=mx";
let cachedVersion = null;
let lastChecked = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

async function fetchLatestVersion() {
  const now = Date.now();
  // if (cachedVersion && now - lastChecked < CACHE_DURATION) {
  //   return cachedVersion;
  // }

  // try {
  //   const response = await fetch(APP_STORE_LOOKUP_URL);
  //   if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

  //   const data = await response.json();
  //   if (data.resultCount > 0) {
  //     cachedVersion = data.results[0].version;
  //     lastChecked = now;
  //   }
  // } catch (error) {
  //   console.error("Error fetching App Store version:", error);
  // }

  return '1.0.12';
}


export default fetchLatestVersion;