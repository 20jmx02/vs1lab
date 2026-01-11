// File origin: VS1LAB A3

/* eslint-disable no-unused-vars */

// This script is executed when the browser loads index.html.

// "console.log" writes to the browser's console. 
// The console window must be opened explicitly in the browser.
// Try to find this output in the browser...
console.log("The geoTagging (A4) script is going to start...");

/**
 * 'updateLocation'
 * A function to retrieve the current location and update the page.
 * It is called once the page has been fully loaded.
 * 
 * OPTIMIZATION: Only calls GeoLocation API if coordinates are not already present in form fields.
 * This reduces latency on repeated page loads.
 */
// Global state for pagination and discovery context
let currentLat;
let currentLon;
let currentSearchterm = '';
let currentPage = 1;
let currentPageSize = 3;

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
        initializeMap(latitude, longitude);
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
        initializeMap(latitude, longitude);

        // Set current coords and refresh discovery (page 1)
        currentLat = latitude;
        currentLon = longitude;
        currentPage = 1;
        refreshDiscovery({ lat: currentLat, lon: currentLon, searchterm: currentSearchterm, page: currentPage, pageSize: currentPageSize });
    });
}

/**
 * Initialize the map and load markers from data-tags attribute
 */
let mapManager;
function initializeMap(latitude, longitude) {
    const mapElement = document.getElementById('map');
    let geoTags = [];
    if (mapElement && mapElement.dataset.tags) {
        try {
            geoTags = JSON.parse(mapElement.dataset.tags);
        } catch (e) {
            console.error('Error parsing geotags:', e);
            geoTags = [];
        }
    }

    mapManager = new MapManager();
    mapManager.initMap(latitude, longitude);
    mapManager.updateMarkers(latitude, longitude, geoTags);
}

function renderTagList(geoTags) {
    const listElem = document.getElementById('discoveryResults');
    if (!listElem) return;
    listElem.innerHTML = (geoTags || []).map(gtag => (
        `<li>${gtag.name} (${gtag.latitude}, ${gtag.longitude}) ${gtag.hashtag || ''}</li>`
    )).join('');
}

async function refreshDiscovery({ lat, lon, searchterm = '', radius = 10, page, pageSize }) {
    const params = new URLSearchParams();
    if (lat !== undefined && lon !== undefined) {
        params.set('latitude', lat);
        params.set('longitude', lon);
        params.set('radius', String(radius));
    }
    if (searchterm) params.set('searchterm', searchterm);
    if (page !== undefined && pageSize !== undefined) {
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
    }

    const res = await fetch(`/api/geotags?${params.toString()}`);
    if (!res.ok) {
        console.error('Discovery fetch failed', res.status);
        return;
    }
    const data = await res.json();
    const isPaged = data && typeof data === 'object' && Array.isArray(data.items) && typeof data.total === 'number';
    const list = isPaged ? data.items : Array.isArray(data) ? data : [];
    const total = isPaged ? data.total : list.length;

    renderTagList(list);
    renderPagination(total);
    if (mapManager) {
        mapManager.updateMarkers(lat, lon, list);
    }
}

function renderPagination(total) {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.max(1, Math.ceil(total / currentPageSize));
    currentPage = Math.min(currentPage, totalPages);

    const parts = [];
    // Prev
    parts.push(`<button data-page="${Math.max(1, currentPage - 1)}" ${currentPage === 1 ? 'disabled' : ''}>«</button>`);
    // Pages (simple: show 1..totalPages)
    for (let p = 1; p <= totalPages; p++) {
        parts.push(`<button data-page="${p}" ${p === currentPage ? 'disabled' : ''}>${p}</button>`);
    }
    // Next
    parts.push(`<button data-page="${Math.min(totalPages, currentPage + 1)}" ${currentPage === totalPages ? 'disabled' : ''}>»</button>`);

    container.innerHTML = parts.join(' ');

    // Bind events
    container.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetPage = parseInt(btn.getAttribute('data-page'), 10);
            if (targetPage === currentPage) return;
            currentPage = targetPage;
            await refreshDiscovery({ lat: currentLat, lon: currentLon, searchterm: currentSearchterm, page: currentPage, pageSize: currentPageSize });
        });
    });
}

// Wait for the page to fully load its DOM content, then call updateLocation
document.addEventListener("DOMContentLoaded", () => {
    updateLocation();

    // Tagging form: prevent default and send JSON via fetch
    const tagForm = document.getElementById('tag-form');
    if (tagForm) {
        tagForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const latInput = tagForm.querySelector("input[name='latitude']");
            const lonInput = tagForm.querySelector("input[name='longitude']");
            const nameInput = tagForm.querySelector("input[name='name']");
            const hashtagInput = tagForm.querySelector("input[name='hashtag']");

            const payload = {
                latitude: parseFloat(latInput.value),
                longitude: parseFloat(lonInput.value),
                name: nameInput.value,
                hashtag: hashtagInput.value
            };

            const res = await fetch('/api/geotags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                console.error('Tagging fetch failed', res.status);
                return;
            }
            // Optionally clear name/hashtag
            nameInput.value = '';
            hashtagInput.value = '';

            // Refresh discovery around current coordinates (page reset)
            currentLat = payload.latitude;
            currentLon = payload.longitude;
            currentSearchterm = '';
            currentPage = 1;
            await refreshDiscovery({ lat: currentLat, lon: currentLon, searchterm: currentSearchterm, page: currentPage, pageSize: currentPageSize });
        });
    }

    // Discovery form: prevent default and query via fetch
    const discForm = document.getElementById('discoveryFilterForm');
    if (discForm) {
        discForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const latInput = discForm.querySelector("input[name='latitude']");
            const lonInput = discForm.querySelector("input[name='longitude']");
            const searchInput = discForm.querySelector("input[name='searchterm']");
            const lat = parseFloat(latInput.value);
            const lon = parseFloat(lonInput.value);
            const term = searchInput.value || '';
            currentLat = lat;
            currentLon = lon;
            currentSearchterm = term;
            currentPage = 1;
            await refreshDiscovery({ lat: currentLat, lon: currentLon, searchterm: currentSearchterm, page: currentPage, pageSize: currentPageSize });
        });
    }
});