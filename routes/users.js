const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUser } = require('../controllers/user.controller');

router.get('/', auth, getUser);

module.exports = router;
