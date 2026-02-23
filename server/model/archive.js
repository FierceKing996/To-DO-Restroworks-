const mongoose = require('mongoose');

const ArchiveSchema = new mongoose.Schema({
    userId: { type: String, required: true }, 
    vaultId: { type: String, required: true },
    originalWorkspace: { type: String, required: true }, 
    encryptedData: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Archive', ArchiveSchema);