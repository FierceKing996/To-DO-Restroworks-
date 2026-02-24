import { useEffect, useState } from 'react';
// @ts-ignore
import { AuthService } from '../services/authService';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  FiUsers, FiLayers, FiCheckCircle, FiTrendingUp, FiTrendingDown, 
  FiSearch, FiBell, FiLogOut, FiLayout 
} from 'react-icons/fi';

// --- THEME CONSTANTS (Light Mode) ---
const THEME = {
  bg: '#F9FAFB',        // Very light gray background
  card: '#FFFFFF',      // Pure white cards
  textMain: '#111827',  // Almost black
  textMuted: '#6B7280', // Soft gray
  border: '#E5E7EB',    // Light border
  primary: '#4F46E5',   // Indigo (for lines)
  secondary: '#F59E0B', // Orange (for donut)
  success: '#10B981',   // Green
  danger: '#EF4444',    // Red
};

export default function AdminDashboard({ onLogout }: any) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user] = useState<any>(AuthService.getUser() || {});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${AuthService.getToken()}` }
                });
                const response = await res.json();
                if (res.ok && response.data?.cards) {
                    setData(response.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || !data) return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: THEME.bg, color: THEME.textMuted }}>
            Loading Dashboard...
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: THEME.bg, color: THEME.textMain, fontFamily: 'sans-serif', padding: '32px' }}>
            
            {/* --- HEADER --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Welcome Back, {user.username || 'Admin'}</h1>
                    <p style={{ color: THEME.textMuted, fontSize: '14px', marginTop: '4px' }}>Here is what's happening in your agency today.</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: THEME.card, padding: '10px', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                        <FiSearch size={20} color={THEME.textMuted} />
                    </div>
                    <div style={{ background: THEME.card, padding: '10px', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                        <FiBell size={20} color={THEME.textMuted} />
                    </div>
                    <button onClick={onLogout} style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', backgroundColor: THEME.card, color: THEME.danger, border: `1px solid ${THEME.border}`, 
                        borderRadius: '30px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <FiLogOut /> Logout
                    </button>
                </div>
            </div>

            {/* --- 1. KPI CARDS --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <StatsCard 
                    title="Total Users" 
                    value={data.cards.totalUsers} 
                    trend={data.cards.userGrowth} 
                    icon={<FiUsers size={22} />} 
                    color={THEME.primary} 
                />
                <StatsCard 
                    title="Total Workspaces" 
                    value={data.cards.wsTotal} 
                    trend={data.cards.wsGrowth} 
                    icon={<FiLayout size={22} />} 
                    color="#EC4899" 
                />
                <StatsCard 
                    title="Total Tasks" 
                    value={data.cards.totalTasks} 
                    trend={data.cards.taskGrowth} 
                    icon={<FiLayers size={22} />} 
                    color={THEME.secondary} 
                />
                <StatsCard 
                    title="Completed" 
                    value={data.cards.completedTasks} 
                    trend={null} 
                    icon={<FiCheckCircle size={22} />} 
                    color={THEME.success} 
                />
            </div>

            {/* --- 2. MAIN CHARTS SECTION --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
                
                {/* Left: Growth Line Chart */}
                <div style={{ backgroundColor: THEME.card, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Growth Analytics</h3>
                        <div style={{ display: 'flex', gap: '15px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: THEME.secondary }}></div> Tasks Created</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: THEME.primary }}></div> New Users</div>
                        </div>
                    </div>
                    
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <LineChart data={data.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="date" stroke={THEME.textMuted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke={THEME.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px' }}
                                />
                                <Line type="monotone" dataKey="tasks" stroke={THEME.secondary} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="users" stroke={THEME.primary} strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Task Status Donut */}
                <div style={{ backgroundColor: THEME.card, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Task Status</h3>
                        <div style={{ padding: '4px', cursor: 'pointer' }}>...</div>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={data.pieData}
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill={THEME.secondary} /> {/* Active */}
                                    <Cell fill={THEME.primary} />   {/* Completed (Indigo) */}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Label */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.cards.totalTasks}</div>
                            <div style={{ fontSize: '12px', color: THEME.textMuted }}>Total</div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
                         <div style={{ fontSize: '13px', color: THEME.textMuted }}>● Active</div>
                         <div style={{ fontSize: '13px', color: THEME.textMuted }}>● Completed</div>
                    </div>
                </div>
            </div>

            {/* --- 3. RECENT ACTIVITY LIST (The "Order List" Look) --- */}
            <div style={{ backgroundColor: THEME.card, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Recent Activity Log</h3>
                    <div style={{ fontSize: '13px', color: THEME.textMuted, background: '#F3F4F6', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                        Last 7 Days ▼
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: THEME.textMuted, fontSize: '12px', borderBottom: `1px solid ${THEME.border}` }}>
                            <th style={{ padding: '16px', fontWeight: '500' }}>User</th>
                            <th style={{ padding: '16px', fontWeight: '500' }}>Task ID</th>
                            <th style={{ padding: '16px', fontWeight: '500' }}>Content</th>
                            <th style={{ padding: '16px', fontWeight: '500' }}>Date</th>
                            <th style={{ padding: '16px', fontWeight: '500' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.recentActivity.map((item: any) => (
                            <tr key={item.id} style={{ borderBottom: `1px solid ${THEME.bg}`, fontSize: '14px' }}>
                                <td style={{ padding: '16px', fontWeight: '600', color: THEME.textMain }}>{item.user}</td>
                                <td style={{ padding: '16px', color: THEME.primary }}>#{item.id.slice(-6).toUpperCase()}</td>
                                <td style={{ padding: '16px', color: THEME.textMuted }}>{item.task.substring(0, 30)}...</td>
                                <td style={{ padding: '16px', color: THEME.textMuted }}>{new Date(item.date).toLocaleDateString()}</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ 
                                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                        backgroundColor: item.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: item.status === 'Completed' ? THEME.success : THEME.secondary
                                    }}>
                                        ● {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- SUB COMPONENTS ---

function StatsCard({ title, value, trend, icon, color }: any) {
    return (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{value}</div>
                    <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>{title}</div>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                    {icon}
                </div>
            </div>
            
            {trend !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: trend >= 0 ? '#10B981' : '#EF4444' }}>
                    {trend >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                    <span>{Math.abs(trend)}% this week</span>
                </div>
            )}
        </div>
    );
}