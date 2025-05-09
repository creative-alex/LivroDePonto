const express = require('express');
const router = express.Router();
const { showEntity } = require('../controllers/entityController'); 
const { createEntity } = require('../controllers/entityController'); 
const { updateEntity } = require('../controllers/entityController');
const { entityDetails } = require('../controllers/entityController');
const { deleteEntity } = require('../controllers/entityController');


// Rota para criar a entidade
router.post('/createEntity', createEntity);
router.post('/updateEntity', updateEntity);
router.post('/showEntities', showEntity);
router.post('/entityDetails', entityDetails);
router.post('/deleteEntity', deleteEntity);

module.exports = router;