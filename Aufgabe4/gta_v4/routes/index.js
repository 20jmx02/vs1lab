// File origin: VS1LAB A3, A4

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

// App routes (A3)

/**
 * Route '/' for HTTP 'GET' requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests cary no parameters
 *
 * As response, the ejs-template is rendered without geotag objects.
 */

router.get('/', (req, res) => {
  const allTags = store.getAllGeoTags();
  res.render('index', { 
    taglist: allTags,
    latitude: '',
    longitude: ''
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

router.get('/api/geotags', (req, res) => {
  const { latitude, longitude, searchterm, radius, page, pageSize } = req.query;
  const latNum = latitude !== undefined ? parseFloat(latitude) : undefined;
  const lonNum = longitude !== undefined ? parseFloat(longitude) : undefined;
  const radNum = radius !== undefined ? parseFloat(radius) : undefined;
  const pageNum = page !== undefined ? Math.max(1, parseInt(page, 10)) : undefined;
  const sizeNum = pageSize !== undefined ? Math.max(1, parseInt(pageSize, 10)) : undefined;

  const full = store.findAll({
    searchterm,
    latitude: latNum,
    longitude: lonNum,
    radius: radNum
  });

  // If pagination parameters are provided, return a paged response
  if (pageNum !== undefined && sizeNum !== undefined) {
    const total = full.length;
    const start = (pageNum - 1) * sizeNum;
    const items = full.slice(start, start + sizeNum);
    return res.json({ items, page: pageNum, pageSize: sizeNum, total });
  }

  // Otherwise, return the full list for compatibility
  res.json(full);
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

router.post('/api/geotags', (req, res) => {
  const { name, hashtag, latitude, longitude } = req.body || {};
  if (
    name === undefined || hashtag === undefined ||
    latitude === undefined || longitude === undefined
  ) {
    return res.status(400).json({ error: 'Missing fields: name, hashtag, latitude, longitude' });
  }
  const created = store.create({ name, hashtag, latitude, longitude });
  res.status(201).location(`/api/geotags/${created.id}`).json(created);
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

router.get('/api/geotags/:id', (req, res) => {
  const item = store.findById(req.params.id);
  return item ? res.json(item) : res.status(404).end();
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

router.put('/api/geotags/:id', (req, res) => {
  const { name, hashtag, latitude, longitude } = req.body || {};
  const updated = store.update(req.params.id, { name, hashtag, latitude, longitude });
  return updated ? res.json(updated) : res.status(404).end();
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

router.delete('/api/geotags/:id', (req, res) => {
  const removed = store.delete(req.params.id);
  return removed ? res.json(removed) : res.status(404).end();
});


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


module.exports = router;
