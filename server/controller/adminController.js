const User = require('../model/User');
const Task = require('../model/tasks'); 
const Workspace = require('../model/Workspace'); // ⚡ NEW: Import Workspace
const catchAsync = require('../utils/catchAsync');

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    // Helper: Date X days ago
    const daysAgo = (n) => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    // --- 1. KPI CARDS (Now with Workspaces) ---
    const countDocs = async (Model, rangeStart, rangeEnd) => 
        await Model.countDocuments({ createdAt: { $gte: rangeStart, $lt: rangeEnd } });

    const thisWeek = daysAgo(7);
    const lastWeek = daysAgo(14);

    // Users
    const usersNow = await countDocs(User, thisWeek, new Date());
    const usersPrev = await countDocs(User, lastWeek, thisWeek);
    const userGrowth = usersPrev === 0 ? 100 : Math.round(((usersNow - usersPrev) / usersPrev) * 100);

    // Tasks
    const tasksNow = await countDocs(Task, thisWeek, new Date());
    const tasksPrev = await countDocs(Task, lastWeek, thisWeek);
    const taskGrowth = tasksPrev === 0 ? 100 : Math.round(((tasksNow - tasksPrev) / tasksPrev) * 100);

    // Workspaces (⚡ NEW ANALYTIC)
    const wsTotal = await Workspace.countDocuments();
    const wsNow = await countDocs(Workspace, thisWeek, new Date());
    const wsPrev = await countDocs(Workspace, lastWeek, thisWeek);
    const wsGrowth = wsPrev === 0 ? 100 : Math.round(((wsNow - wsPrev) / wsPrev) * 100);

    // Totals
    const totalUsers = await User.countDocuments();
    const totalTasks = await Task.countDocuments();
    const activeTasks = await Task.countDocuments({ completed: false });
    const completedTasks = await Task.countDocuments({ completed: true });

    // --- 2. DUAL-LINE CHART (Signups vs Tasks) ---
    // We aggregate both collections by date to compare velocity
    const last7Days = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i).toISOString().split('T')[0]);
    
    const chartData = await Promise.all(last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const tasks = await Task.countDocuments({ createdAt: { $gte: new Date(date), $lt: nextDay } });
        const users = await User.countDocuments({ createdAt: { $gte: new Date(date), $lt: nextDay } });
        
        return { date: date.slice(5), tasks, users }; // Send "MM-DD" as label
    }));

    // --- 3. RECENT ACTIVITY ---
    const recentActivity = await Task.find()
        .sort({ createdAt: -1 })
        .limit(7) // Increased to 7 rows
        .populate('userId', 'username')
        .lean();

    res.status(200).json({
        status: 'success',
        data: {
            cards: {
                totalUsers, userGrowth,
                totalTasks, taskGrowth,
                wsTotal, wsGrowth,
                completedTasks
            },
            chartData, // Now contains both tasks AND users
            recentActivity: recentActivity.map(t => ({
                id: t._id,
                user: t.userId ? t.userId.username : "Unknown",
                task: t.content,
                status: t.completed ? "Completed" : "In Progress",
                amount: t.clientId ? "Synced" : "Local", // Just a placeholder for the "Amount" column
                date: t.createdAt
            })),
            pieData: [
                { name: 'Active', value: activeTasks },
                { name: 'Completed', value: completedTasks }
            ]
        }
    });
});