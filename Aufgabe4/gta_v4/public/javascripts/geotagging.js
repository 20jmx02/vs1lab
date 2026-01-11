// File origin: VS1LAB A3

/* eslint-disable no-unused-vars */

// This script is executed when the browser loads index.html.

// "console.log" writes to the browser's console. 
// The console window must be opened explicitly in the browser.
// Try to find this output in the browser...
console.log("The geoTagging script is going to start...");

/**
 * 'updateLocation'
 * A function to retrieve the current location and update the page.
 * It is called once the page has been fully loaded.
 * 
 * OPTIMIZATION: Only calls GeoLocation API if coordinates are not already present in form fields.
 * This reduces latency on repeated page loads.
 */

let mapManager = null;
let mapInitialized = false;



function updateLocation() {
    // Get form field references
    const tagLat = document.querySelector("#tag-form input[name='latitude']");
    const tagLong = document.querySelector("#tag-form input[name='longitude']");
    const discLat = document.querySelector("#discoveryFilterForm input[name='latitude']");
    const discLong = document.querySelector("#discoveryFilterForm input[name='longitude']");

    // Check if coordinates are already present (from server) and valid numbers
    const latVal = tagLat && typeof tagLat.value === 'string' ? tagLat.value.trim() : '';
    const lonVal = tagLong && typeof tagLong.value === 'string' ? tagLong.value.trim() : '';
    const hasCoordinates = latVal !== '' && lonVal !== '' && !isNaN(parseFloat(latVal)) && !isNaN(parseFloat(lonVal));

    if (hasCoordinates) {
        // Use existing coordinates
        const latitude = parseFloat(latVal);
        const longitude = parseFloat(lonVal);
        initializeMap(latitude, longitude, []); // Map zeigen
        reloadDiscovery();                      // echte Daten holen
        return;
    }

    // Get fresh location from GeoLocation API
    LocationHelper.findLocation(function(locationHelper) {
        const latitude = parseFloat(locationHelper.latitude);
        const longitude = parseFloat(locationHelper.longitude);

        // Write coordinates to the forms
        if (tagLat) tagLat.value = latitude;
        if (tagLong) tagLong.value = longitude;
        if (discLat) discLat.value = latitude;
        if (discLong) discLong.value = longitude;

        // Initialize map with new coordinates
        initializeMap(latitude, longitude, []); // Map zeigen
        reloadDiscovery().catch(console.error); // echte Daten holen
    });
}

/**
 * Initialize the map and load markers from data-tags attribute
 */
function initializeMap(latitude, longitude, tags = []) {
    if (!mapManager) mapManager = new MapManager();

    if (!mapInitialized) {
        mapManager.initMap(latitude, longitude);
        mapInitialized = true;
    }

    mapManager.updateMarkers(latitude, longitude, tags);
}



async function onTagSubmit(event) {
    event.preventDefault();

    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    const name = document.getElementById('name').value;
    const hashtag = document.getElementById('hashtag').value;

    const payload = { latitude, longitude, name, hashtag };

    const response = await fetch('/api/geotags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('POST /api/geotags failed');

    // optional: const created = await response.json();
    await reloadDiscovery();   // danach Liste+Karte neu laden
}

async function onDiscoverySubmit(event) {
    event.preventDefault();
    await reloadDiscovery();
}

async function reloadDiscovery() {
    const searchterm = document.getElementById('searchterm').value;

    const latitude = document.getElementById('disc-latitude').value;
    const longitude = document.getElementById('disc-longitude').value;

    const params = new URLSearchParams();
    if (searchterm) params.set('searchterm', searchterm);
    if (latitude && longitude) {
        params.set('latitude', latitude);
        params.set('longitude', longitude);
        params.set('radius', '10');
    }

    const response = await fetch(`/api/geotags?${params.toString()}`);
    if (!response.ok) throw new Error('GET /api/geotags failed');

    const tags = await response.json();
    updateDiscoveryUI(tags);
}


function updateDiscoveryUI(tags) {
    const ul = document.getElementById('discoveryResults');
    ul.innerHTML = '';

    for (const t of tags) {
        const li = document.createElement('li');
        li.textContent = `${t.name} (${t.latitude}, ${t.longitude}) ${t.hashtag}`;
        ul.appendChild(li);
    }

    const lat = parseFloat(document.getElementById('disc-latitude').value);
    const lon = parseFloat(document.getElementById('disc-longitude').value);

    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        initializeMap(lat, lon, tags);
    }
}




// Wait for the page to fully load its DOM content, then call updateLocation
document.addEventListener("DOMContentLoaded", () => {
    updateLocation();

    const tagForm = document.getElementById('tag-form');
    const discoveryForm = document.getElementById('discoveryFilterForm');

    tagForm.addEventListener('submit', onTagSubmit);
    discoveryForm.addEventListener('submit', onDiscoverySubmit);
});