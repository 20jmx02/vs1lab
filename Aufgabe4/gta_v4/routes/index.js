// File origin: VS1LAB A3

/**
 * This script defines the main router of the GeoTag server.
 * It's a template for exercise VS1lab/Aufgabe3
 * Complete all TODOs in the code documentation.
 */

/**
 * Define module dependencies.
 */

const express = require('express');
const router = express.Router();

/**
 * The module "geotag" exports a class GeoTagStore. 
 * It represents geotags.
 * 
 * TODO: implement the module in the file "../models/geotag.js"
 */
// eslint-disable-next-line no-unused-vars
const GeoTag = require('../models/geotag');

/**
 * The module "geotag-store" exports a class GeoTagStore. 
 * It provides an in-memory store for geotag objects.
 * 
 * TODO: implement the module in the file "../models/geotag-store.js"
 */
// eslint-disable-next-line no-unused-vars
const GeoTagStore = require('../models/geotag-store');
const GeoTagExamples = require('../models/geotag-examples');

// Initialize store with example data
const store = new GeoTagStore();
GeoTagExamples.populateStore(store);

/**
 * Route '/' for HTTP 'GET' requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests cary no parameters
 *
 * As response, the ejs-template is rendered without geotag objects.
 */

// TODO: extend the following route example if necessary
router.get('/', (req, res) => {
  const allTags = store.getNearbyGeoTags();
  res.render('index', { 
    taglist: allTags,
    latitude: '',
    longitude: ''
  });
});

/**
 * Route '/tagging' for HTTP 'POST' requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests cary the fields of the tagging form in the body.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Based on the form data, a new geotag is created and stored.
 *
 * As response, the ejs-template is rendered with geotag objects.
 * All result objects are located in the proximity of the new geotag.
 * To this end, "GeoTagStore" provides a method to search geotags 
 * by radius around a given location.
 */

router.post('/tagging', (req, res) => {
  const { latitude, longitude, name, hashtag } = req.body;
  
  // Create and store new geotag
  const newTag = new GeoTag(latitude, longitude, name, hashtag);
  store.addGeoTag(newTag);
  
  // Get nearby tags around the new geotag
  const taglist = store.getNearbyGeoTags(latitude, longitude);
  
  // Render template with results
  res.render('index', {
    taglist: taglist,
    latitude: latitude,
    longitude: longitude
  });
});

/**
 * Route '/discovery' for HTTP 'POST' requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests cary the fields of the discovery form in the body.
 * This includes coordinates and an optional search term.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * As response, the ejs-template is rendered with geotag objects.
 * All result objects are located in the proximity of the given coordinates.
 * If a search term is given, the results are further filtered to contain 
 * the term as a part of their names or hashtags. 
 * To this end, "GeoTagStore" provides methods to search geotags 
 * by radius and keyword.
 */

router.post('/discovery', (req, res) => {
  const { latitude, longitude, searchterm } = req.body;
  
  // Search for nearby tags (with optional keyword filter)
  const taglist = store.searchNearbyGeoTags(latitude, longitude, searchterm || '');
  
  // Render template with results
  res.render('index', {
    taglist: taglist,
    latitude: latitude,
    longitude: longitude
  });
});


// API routes (A4)

/**
 * Route '/api/geotags' for HTTP 'GET' requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests contain the fields of the Discovery form as query.
 * (http://expressjs.com/de/4x/api.html#req.query)
 *
 * As a response, an array with Geo Tag objects is rendered as JSON.
 * If 'searchterm' is present, it will be filtered by search term.
 * If 'latitude' and 'longitude' are available, it will be further filtered based on radius.
 */

// TODO: ... your code here ...
router.get('/api/geotags', (req, res) => {
  const { latitude, longitude, searchterm } = req.query;

  const lat = latitude ? Number(latitude) : null;
  const lon = longitude ? Number(longitude) : null;

  let taglist;

  // Fall 1: Koordinaten vorhanden
  if (lat !== null && lon !== null) {

    // 1a: Koordinaten + Suchbegriff
    if (searchterm && searchterm.trim() !== '') {
      taglist = store.searchNearbyGeoTags(lat, lon, searchterm);
    }
    // 1b: Nur Koordinaten
    else {
      taglist = store.getNearbyGeoTags(lat, lon);
    }

  }
  // Fall 2: Keine Koordinaten
  else {

    // 2a: Nur Suchbegriff
    if (searchterm && searchterm.trim() !== '') {
      // alle Tags holen und manuell filtern
      taglist = store
        .getAllGeoTags()
        .filter(tag =>
          tag.name.toLowerCase().includes(searchterm.toLowerCase()) ||
          tag.hashtag.toLowerCase().includes(searchterm.toLowerCase())
        );
    }
    // 2b: gar keine Filter
    else {
      taglist = store.getAllGeoTags();
    }
  }

  res.json(taglist);
});

/**
 * Route '/api/geotags' for HTTP 'POST' requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests contain a GeoTag as JSON in the body.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * The URL of the new resource is returned in the header as a response.
 * The new resource is rendered as JSON in the response.
 */

// TODO: ... your code here ...
router.post('/api/geotags', (req, res) => {
  const { latitude, longitude, name, hashtag } = req.body; // JSON body

  // minimale Validierung
  if (latitude === undefined || longitude === undefined || !name) {
    return res.status(400).json({ error: 'latitude, longitude and name are required' });
  }

  // GeoTag erzeugen (id wird im Store vergeben)
  const newTag = new GeoTag(latitude, longitude, name, hashtag);
  const created = store.addGeoTag(newTag);

  // Location Header + 201 + JSON
  res.location(`/api/geotags/${created.id}`);
  return res.status(201).json(created);
});

/**
 * Route '/api/geotags/:id' for HTTP 'GET' requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests contain the ID of a tag in the path.
 * (http://expressjs.com/de/4x/api.html#req.params)
 *
 * The requested tag is rendered as JSON in the response.
 */

// TODO: ... your code here ...
router.get('/api/geotags/:id', (req, res) => {
  const { id } = req.params;

  const tag = store.getGeoTagById(id);
  if (!tag) {
    return res.status(404).json({ error: 'GeoTag not found' });
  }

  return res.json(tag);
});


/**
 * Route '/api/geotags/:id' for HTTP 'PUT' requests.
 * (http://expressjs.com/de/4x/api.html#app.put.method)
 *
 * Requests contain the ID of a tag in the path.
 * (http://expressjs.com/de/4x/api.html#req.params)
 * 
 * Requests contain a GeoTag as JSON in the body.
 * (http://expressjs.com/de/4x/api.html#req.query)
 *
 * Changes the tag with the corresponding ID to the sent value.
 * The updated resource is rendered as JSON in the response. 
 */

// TODO: ... your code here ...
router.put('/api/geotags/:id', (req, res) => {
  const { id } = req.params;   // kommt als String
  const data = req.body;       // JSON body

  const updated = store.updateGeoTag(id, data);

  if (!updated) {
    return res.status(404).json({ error: 'GeoTag not found' });
  }

  return res.json(updated);
});


/**
 * Route '/api/geotags/:id' for HTTP 'DELETE' requests.
 * (http://expressjs.com/de/4x/api.html#app.delete.method)
 *
 * Requests contain the ID of a tag in the path.
 * (http://expressjs.com/de/4x/api.html#req.params)
 *
 * Deletes the tag with the corresponding ID.
 * The deleted resource is rendered as JSON in the response.
 */

// TODO: ... your code here ...
router.delete('/api/geotags/:id', (req, res) => {
  const { id } = req.params;

  const deleted = store.deleteGeoTagById(id);
  if (!deleted) {
    return res.status(404).json({ error: 'GeoTag not found' });
  }

  return res.json(deleted);
});


module.exports = router;
