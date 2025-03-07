const express = require('express');
const router = express.Router();
const { getUserInfo } = require('../controllers/usersController'); 
const { createUser } = require('../controllers/usersController');  
const { verifyToken } = require('../controllers/usersController'); 
const { registerEntry } = require('../controllers/usersController'); 
const { registerLeave } = require('../controllers/usersController');
const { getUserRecords } = require('../controllers/usersController');
const { getUsersByEntity } = require('../controllers/usersController');
const { userDetails } = require('../controllers/usersController');
const { checkEntry } = require('../controllers/usersController');
const { checkLeave } = require('../controllers/usersController');
const { updateUserTime } = require('../controllers/usersController');
const { updateFirstLogin } = require('../controllers/usersController');
const { updateUserDetails } = require('../controllers/usersController');
const { createVacation } = require('../controllers/usersController');
const { deleteRegister } = require('../controllers/usersController');

router.post("/userDetails", userDetails);
router.post('/getUserRole', getUserInfo);
router.post('/createUser', createUser);
router.post("/verifyToken", verifyToken);
router.post("/registerEntry", registerEntry);
router.post("/registerLeave", registerLeave);
router.post("/calendar", getUserRecords);
router.post("/byEntity", getUsersByEntity);
router.post("/checkEntry", checkEntry);
router.post("/checkLeave", checkLeave);
router.post("/update-time", updateUserTime);
router.post("/updateFirstLogin", updateFirstLogin);
router.post("/updateUserDetails", updateUserDetails);
router.post("/vacation", createVacation);
router.post("/deleteRegister", deleteRegister);

module.exports = router;

