// File origin: VS1LAB A3

/**
 * This script is a template for exercise VS1lab/Aufgabe3
 * Complete all TODOs in the code documentation.
 */

/** * 
 * A class representing geotags.
 * GeoTag objects should contain at least all fields of the tagging form.
 */
class GeoTag {
    /**
     * Create a new GeoTag
     * @param {number} latitude - The latitude coordinate
     * @param {number} longitude - The longitude coordinate
     * @param {string} name - The name of the location
     * @param {string} hashtag - The hashtag for the location
     */
    constructor(latitude, longitude, name, hashtag) {
        this.latitude = parseFloat(latitude);
        this.longitude = parseFloat(longitude);
        this.name = name;
        this.hashtag = hashtag;
    }
}

module.exports = GeoTag;
