// File origin: VS1LAB A3/A4

/**
 * This script is a template for exercise VS1lab/Aufgabe3/4
 * Complete all TODOs in the code documentation.
 */

const GeoTag = require('./geotag');

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
    #nextId = 1;

    /**
     * Add a geotag to the store
     * @param {GeoTag} geotag - The geotag to add
     */
    addGeoTag(geotag) {
        // Legacy helper (A3): add without ID
        this.#geotags.push(geotag);
    }

    /**
     * Create and store a new geotag with an ID (A4)
     * @param {{latitude:number, longitude:number, name:string, hashtag:string}} data
     * @returns {GeoTag & {id:string}} created geotag with id
     */
    create(data) {
        const tag = new GeoTag(data.latitude, data.longitude, data.name, data.hashtag);
        tag.id = String(this.#nextId++);
        this.#geotags.push(tag);
        return { ...tag };
    }

    /**
     * Remove geotags by name
     * @param {string} name - The name to filter by
     */
    removeGeoTag(name) {
        this.#geotags = this.#geotags.filter(tag => tag.name !== name);
    }

    /**
     * Find a geotag by id
     * @param {string|number} id
     * @returns {object|null}
     */
    findById(id) {
        const found = this.#geotags.find(tag => String(tag.id) === String(id));
        return found ? { ...found } : null;
    }

    /**
     * Update a geotag by id
     * @param {string|number} id
     * @param {{latitude?:number, longitude?:number, name?:string, hashtag?:string}} data
     * @returns {object|null}
     */
    update(id, data) {
        const idx = this.#geotags.findIndex(tag => String(tag.id) === String(id));
        if (idx < 0) return null;
        const current = this.#geotags[idx];
        if (data.latitude !== undefined) current.latitude = parseFloat(data.latitude);
        if (data.longitude !== undefined) current.longitude = parseFloat(data.longitude);
        if (data.name !== undefined) current.name = data.name;
        if (data.hashtag !== undefined) current.hashtag = data.hashtag;
        return { ...current };
    }

    /**
     * Delete a geotag by id
     * @param {string|number} id
     * @returns {object|null} removed tag
     */
    delete(id) {
        const idx = this.#geotags.findIndex(tag => String(tag.id) === String(id));
        if (idx < 0) return null;
        const [removed] = this.#geotags.splice(idx, 1);
        return removed ? { ...removed } : null;
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
     * Find all geotags optionally filtered by location and search term
     * @param {{searchterm?:string, latitude?:number, longitude?:number, radius?:number}} opts
     * @returns {Array}
     */
    findAll(opts = {}) {
        const { searchterm, latitude, longitude, radius = 10 } = opts;
        if (latitude !== undefined && longitude !== undefined) {
            return this.searchNearbyGeoTags(latitude, longitude, searchterm || '', radius);
        }
        let result = [...this.#geotags];
        if (searchterm && searchterm.trim() !== '') {
            const lower = searchterm.toLowerCase();
            result = result.filter(tag => tag.name.toLowerCase().includes(lower) || tag.hashtag.toLowerCase().includes(lower));
        }
        return result;
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
     */
    getAllGeoTags() {
        return [...this.#geotags];
    }
}

module.exports = InMemoryGeoTagStore
