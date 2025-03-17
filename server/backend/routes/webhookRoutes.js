// server/routes/webhookRoutes.js
const express = require('express');
const router = express.Router();
const { handleClerkWebhook } = require('../controllers/webhookController');

// This route should be publicly accessible to Clerk
router.post('/clerk', express.json(), handleClerkWebhook);

module.exports = router;