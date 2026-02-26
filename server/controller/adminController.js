const User = require('../model/User');
const Task = require('../model/tasks');
const Workspace = require('../model/Workspace');
const catchAsync = require('../utils/catchAsync');

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    // Dates for Trends
    const now = new Date();
    const startOfDay = new Date(now.setHours(0,0,0,0));
    
    const sevenDaysAgo = new Date(); 
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const fourteenDaysAgo = new Date(); 
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // -----------------------------------------------------------------------
    // 1. MASTER TASK AGGREGATION
    // -----------------------------------------------------------------------
    const taskStats = await Task.aggregate([
        { $match: { isDeleted: false } }, // Global Filter
        {
            $facet: {
                // A. KPI Counts
                "total": [{ $count: "count" }],
                "active": [{ $match: { completed: false } }, { $count: "count" }],
                "completed": [{ $match: { completed: true } }, { $count: "count" }],

                // B. Trends (For Green/Red Arrows)
                "thisWeek": [{ $match: { createdAt: { $gte: sevenDaysAgo } } }, { $count: "count" }],
                "lastWeek": [{ $match: { createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } }, { $count: "count" }],

                // C. Productivity Score Inputs
                "todayCreated": [{ $match: { createdAt: { $gte: startOfDay } } }, { $count: "count" }],
                "todayCompleted": [{ $match: { completed: true, updatedAt: { $gte: startOfDay } } }, { $count: "count" }],

                // D. NEW: Creation Heatmap (When do users ADD tasks?)
                "creationHeatmap": [
                    { $project: { hour: { $hour: "$createdAt" } } },
                    { $group: { _id: "$hour", count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ],

                // E. Existing: Completion Heatmap (When do users FINISH tasks?)
                "completionHeatmap": [
                    { $match: { completed: true } },
                    { $project: { hour: { $hour: "$updatedAt" } } },
                    { $group: { _id: "$hour", count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ],

                // F. Avg Turnaround Time
                "turnaroundTime": [
                    { $match: { completed: true } },
                    { $project: { duration: { $subtract: ["$updatedAt", "$createdAt"] } } },
                    { $group: { _id: null, avg: { $avg: "$duration" } } }
                ],

                // G. Project Distribution
                "projects": [
                    { $group: { _id: "$workspaceId", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ],

                // H. Growth Chart (Last 7 Days)
                "growthChart": [
                    { $match: { createdAt: { $gte: sevenDaysAgo } } },
                    { 
                        $group: { 
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                            count: { $sum: 1 } 
                        } 
                    },
                    { $sort: { _id: 1 } }
                ],

                // I. Streak Data (Consecutive Days)
                "streakData": [
                    { $match: { completed: true } },
                    { 
                        $group: { 
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } } 
                        } 
                    },
                    { $sort: { _id: -1 } }
                ],

                // J. Recent Activity List (via Aggregation)
                "recentActivity": [
                    { $sort: { updatedAt: -1 } },
                    { $limit: 5 },
                    // Join with Users to get username
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "userDetails"
                        }
                    },
                    { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            id: "$_id",
                            user: { $ifNull: ["$userDetails.username", "Unknown"] },
                            task: "$content",
                            status: { $cond: [{ $eq: ["$completed", true] }, "Completed", "Active"] },
                            date: "$updatedAt"
                        }
                    }
                ]
            }
        }
    ]);

    // -----------------------------------------------------------------------
    // 2. USER AGGREGATION
    // -----------------------------------------------------------------------
    const userStats = await User.aggregate([
        {
            $facet: {
                "total": [{ $count: "count" }],
                "thisWeek": [{ $match: { createdAt: { $gte: sevenDaysAgo } } }, { $count: "count" }],
                "lastWeek": [{ $match: { createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } }, { $count: "count" }],
                "today": [{ $match: { createdAt: { $gte: startOfDay } } }, { $count: "count" }]
            }
        }
    ]);

    // -----------------------------------------------------------------------
    // 3. WORKSPACE AGGREGATION
    // -----------------------------------------------------------------------
    const wsStats = await Workspace.aggregate([
        { $match: { isDeleted: false } },
        {
            $facet: {
                "total": [{ $count: "count" }],
                "thisWeek": [{ $match: { createdAt: { $gte: sevenDaysAgo } } }, { $count: "count" }],
                "lastWeek": [{ $match: { createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } }, { $count: "count" }]
            }
        }
    ]);

    // -----------------------------------------------------------------------
    // 4. PROCESS RESULTS (Extracting values)
    // -----------------------------------------------------------------------
    const tRes = taskStats[0]; // Task Results
    const uRes = userStats[0]; // User Results
    const wRes = wsStats[0];   // Workspace Results

    // Helper: Safely get count from array
    const getCount = (arr) => arr && arr.length > 0 ? arr[0].count : 0;
    
    // Helper: Calculate % Growth
    const calcGrowth = (now, prev) => prev === 0 ? 100 : Math.round(((now - prev) / prev) * 100);

    // -- Extract KPIs --
    const totalUsers = getCount(uRes.total);
    const totalTasks = getCount(tRes.total);
    const activeTasks = getCount(tRes.active);
    const completedTasks = getCount(tRes.completed);
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // -- Extract Trends --
    const userGrowth = calcGrowth(getCount(uRes.thisWeek), getCount(uRes.lastWeek));
    const taskGrowth = calcGrowth(getCount(tRes.thisWeek), getCount(tRes.lastWeek));
    const wsTotal = getCount(wRes.total);
    const wsGrowth = calcGrowth(getCount(wRes.thisWeek), getCount(wRes.lastWeek));

    // -- Streak Calculation --
    let currentStreak = 0;
    const activeDays = tRes.streakData;
    if (activeDays && activeDays.length > 0) {
        let checkDate = new Date(); checkDate.setHours(0,0,0,0);
        // Start from the actual last active day
        const lastActive = new Date(activeDays[0]._id); lastActive.setHours(0,0,0,0);
        
        const diffDays = Math.ceil(Math.abs(checkDate - lastActive) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
            checkDate = lastActive;
            for (let day of activeDays) {
                const d = new Date(day._id); d.setHours(0,0,0,0);
                if (d.getTime() === checkDate.getTime()) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else break;
            }
        }
    }

    // -- Productivity Score --
    const productivityScore = (getCount(tRes.todayCompleted) * 10) + (getCount(uRes.today) * 20) + (currentStreak * 5);

    // -- Heatmap Formatting --
    const formatHeatmap = (raw) => Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        value: raw.find(h => h._id === i)?.count || 0
    }));

    // -- Project Enrichment --
    // Aggregation gives us IDs, we need Titles.
    const enrichedProjects = await Promise.all(tRes.projects.map(async (p) => {
        const ws = await Workspace.findOne({ clientId: p._id }).select('title');
        return { name: ws ? ws.title : 'Unsorted', value: p.count };
    }));

    // -- Growth Chart Formatting --
    const formattedGrowth = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const found = tRes.growthChart.find(t => t._id === dateStr);
        return { date: dateStr.slice(5), tasks: found ? found.count : 0 };
    });

    res.status(200).json({
        status: 'success',
        data: {
            cards: { 
                totalUsers,
                totalTasks,
                activeTasks,
                completedTasks,
                completionRate,
                productivityScore,
                currentStreak,
                avgCompletionTime: tRes.turnaroundTime.length > 0 ? Math.round(tRes.turnaroundTime[0].avg / (1000*60*60)) : 0,
                userGrowth,
                taskGrowth,
                wsTotal,
                wsGrowth
            },
            chartData: formattedGrowth,
            recentActivity: tRes.recentActivity, 
            pieData: [
                { name: 'Active', value: activeTasks },
                { name: 'Completed', value: completedTasks }
            ],
            // ⚡ TWO HEATMAPS NOW:
            creationHeatmap: formatHeatmap(tRes.creationHeatmap), // When do they ADD tasks?
            completionHeatmap: formatHeatmap(tRes.completionHeatmap), // When do they FINISH tasks?
            projects: enrichedProjects
        }
    });
});