const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

// Create or idempotently record a purchase
router.post('/', purchaseController.createPurchase);

// List purchases by student id (and include course details)
router.get('/:studentId', purchaseController.listPurchasesByStudent);

// Update purchase completion status
router.patch('/:purchaseId', purchaseController.updatePurchase);

module.exports = router;
