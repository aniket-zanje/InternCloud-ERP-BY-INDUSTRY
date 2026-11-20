const router = require('express').Router();
const { verifyVirtualId } = require('../controllers/publicController');

router.get('/verify/:number', verifyVirtualId);

module.exports = router;
