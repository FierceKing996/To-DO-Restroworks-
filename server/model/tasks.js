const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    clientId: { type: String, unique: true, required: true }, // Offline ID
    
    workspaceId: { type: String, required: true }, 
    projectId: { type: String, required: true }, // Tasks now live in a Project
    sectionId: { type: String, required: true, default: 'todo' }, // Which column?
    
    content: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    
    order: { type: Number, default: 0 }, 
    
    // We keep this for your Analytics Dashboard!
    completed: { type: Boolean, default: false },
    
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;