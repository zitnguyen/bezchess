const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');

router.get('/', parentController.getAllParents);
router.get('/:id', parentController.getParentById);
router.post('/', parentController.createParent);
router.put('/:id', parentController.updateParent);
router.delete('/:id', parentController.deleteParent);
router.get('/:id/students', parentController.getParentStudents);

module.exports = router;
