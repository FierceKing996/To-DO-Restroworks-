const mongoose = require("mongoose");

const tasksschema = new mongoose.Schema({
  userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    clientId: { 
        type: String, 
        required: true 
    }, 
    content: { 
        type: String, 
        required: true 
    },  
    type: { 
        type: String, 
        default: 'text' 
    },
    workspaceId: { 
        type: String, 
        required: true, 
    },
    completed: { 
        type: Boolean, 
        default: false
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    },//for ghost task
    createdAt: { type: Date, 
        default: Date.now 
    },
    updatedAt: { type: Date, 
        default: Date.now 
    }
});
tasksschema.index({ userId: 1, workspace: 1 });
module.exports = mongoose.model("tasks", tasksschema);