const express = require('express');
const router = express.Router();
const archiveController = require('../controller/archiveController');

router.route('/')
    .get(archiveController.getArchives)
    .post(archiveController.createArchive);

router.route('/:vaultId')
    .delete(archiveController.deleteArchive);

module.exports = router;