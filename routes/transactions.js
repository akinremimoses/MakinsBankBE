const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTransactions,
  transfer,
  withdraw
} = require('../controllers/user.controller');

router.get('/', auth, getTransactions);
router.post('/transfer', auth, transfer);
router.post('/withdraw', auth, withdraw);

module.exports = router;
