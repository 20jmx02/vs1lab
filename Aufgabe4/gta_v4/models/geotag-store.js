// File origin: VS1LAB A3

/**
 * This script is a template for exercise VS1lab/Aufgabe3
 * Complete all TODOs in the code documentation.
 */

/**
 * A class for in-memory-storage of geotags
 * 
 * Use an array to store a multiset of geotags.
 * - The array must not be accessible from outside the store.
 * 
 * Provide a method 'addGeoTag' to add a geotag to the store.
 * 
 * Provide a method 'removeGeoTag' to delete geo-tags from the store by name.
 * 
 * Provide a method 'getNearbyGeoTags' that returns all geotags in the proximity of a location.
 * - The location is given as a parameter.
 * - The proximity is computed by means of a radius around the location.
 * 
 * Provide a method 'searchNearbyGeoTags' that returns all geotags in the proximity of a location that match a keyword.
 * - The proximity constrained is the same as for 'getNearbyGeoTags'.
 * - Keyword matching should include partial matches from name or hashtag fields. 
 */
class InMemoryGeoTagStore{
    #geotags = [];
    #nextID = 1;
    /**
     * Add a geotag to the store
     * @param {GeoTag} geotag - The geotag to add
     */
    addGeoTag(geotag) {
        if (geotag.id === null || geotag.id === undefined) {
            geotag.id = this.#nextID++;
        }
        this.#geotags.push(geotag);
        return geotag;
    }

    /**
     * Remove geotags by name
     * @param {string} name - The name to filter by
     */
    removeGeoTag(name) {
        this.#geotags = this.#geotags.filter(tag => tag.name !== name);
    }

    /**
     * Get all geotags within a radius
     * @param {number} latitude - Center latitude
     * @param {number} longitude - Center longitude
     * @param {number} radius - Radius in km (default 10km)
     * @returns {Array} Array of nearby geotags
     */
    getNearbyGeoTags(latitude, longitude, radius = 10) {
        return this.#geotags.filter(tag => {
            const distance = this.#calculateDistance(latitude, longitude, tag.latitude, tag.longitude);
            return distance <= radius;
        });
    }

    /**
     * Search for geotags within radius that match a keyword
     * @param {number} latitude - Center latitude
     * @param {number} longitude - Center longitude
     * @param {string} keyword - Search keyword
     * @param {number} radius - Radius in km (default 10km)
     * @returns {Array} Array of matching geotags
     */
    searchNearbyGeoTags(latitude, longitude, keyword, radius = 10) {
        const nearbyTags = this.getNearbyGeoTags(latitude, longitude, radius);
        
        if (!keyword || keyword.trim() === '') {
            return nearbyTags;
        }

        const lowerKeyword = keyword.toLowerCase();
        return nearbyTags.filter(tag => {
            return tag.name.toLowerCase().includes(lowerKeyword) ||
                   tag.hashtag.toLowerCase().includes(lowerKeyword);
        });
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param {number} lat1 - First latitude
     * @param {number} lon1 - First longitude
     * @param {number} lat2 - Second latitude
     * @param {number} lon2 - Second longitude
     * @returns {number} Distance in kilometers
     */
    #calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = this.#toRad(lat2 - lat1);
        const dLon = this.#toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.#toRad(lat1)) * Math.cos(this.#toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees
     * @returns {number} Radians
     */
    #toRad(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Get a copy of all stored geotags
     * @returns {Array} all geotags
    
    getAllGeoTags() {
        return [...this.#geotags];
    }
         */

    getGeoTagById(id) {
        const numericId = Number(id);
        if (Number.isNaN(numericId)) return null;
        return this.#geotags.find(tag => tag.id === numericId) || null;
    }

    updateGeoTag(id, data) {
        const numericId = Number(id);
        if (Number.isNaN(numericId)) return null;

        const index = this.#geotags.findIndex(tag => tag.id === numericId);
        if (index === -1) return null;

        // ID niemals überschreiben
        const { id: _ignored, ...safeData } = (data || {});

        // Merge (überschreibt nur übergebene Felder)
        this.#geotags[index] = { ...this.#geotags[index], ...safeData, id: numericId };

        return this.#geotags[index];
    }

    deleteGeoTagById(id) {
        const numericId = Number(id);
        if (Number.isNaN(numericId)) return null;

        const index = this.#geotags.findIndex(tag => tag.id === numericId);
        if (index === -1) return null;

        const [deletedTag] = this.#geotags.splice(index, 1);
        return deletedTag;
    }
    
}

module.exports = InMemoryGeoTagStore
