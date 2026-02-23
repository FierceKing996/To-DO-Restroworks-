const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: String, required: true, unique: true }, // Sync ID
    
    title: { type: String, required: true },
    color: { type: String, default: '#666666' }, 
    
    isDeleted: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
});

// Index for fast lookups
WorkspaceSchema.index({ userId: 1, clientId: 1 });

module.exports = mongoose.model('Workspace', WorkspaceSchema);