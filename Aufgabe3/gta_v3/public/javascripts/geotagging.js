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
    });
}

/**
 * Initialize the map and load markers from data-tags attribute
 */
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

    const mapManager = new MapManager();
    mapManager.initMap(latitude, longitude);
    mapManager.updateMarkers(latitude, longitude, geoTags);
}

// Wait for the page to fully load its DOM content, then call updateLocation
document.addEventListener("DOMContentLoaded", () => {
    updateLocation();
});