const router = require('express').Router();
const homeController = require('../controllers/home.controller');

router.get('/', homeController.showHome);

module.exports = router;