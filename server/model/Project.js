const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    id: { type: String, required: true }, // e.g., "todo", "done" (UUID from frontend)
    title: { type: String, required: true },
    order: { type: Number, default: 0 }
});

const projectSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'A project must have a title'],
        trim: true 
    },
    workspaceId: {
        type: String, // Storing Client ID (UUID) for easier sync
        required: [true, 'A project must belong to a workspace']
    },
    sections: {
        type: [sectionSchema],
        default: [
            { id: 'todo', title: 'To Do', order: 0 },
            { id: 'in-progress', title: 'In Progress', order: 1 },
            { id: 'done', title: 'Done', order: 2 }
        ]
    },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure quick lookups of projects within a workspace
projectSchema.index({ workspaceId: 1, isDeleted: 1 });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;