import { IDB } from '../db/idbHelper.js'; //

const API_URL = 'http://localhost:5000/api/auth';

export const AuthService = {
    async login(username, password) {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            // ⚡ WIPE LOCAL CACHE FOR A CLEAN SLATE!
            await IDB.clear('workspaces');
            await IDB.clear('tasks');
            await IDB.clear('syncQueue');

            localStorage.setItem('agency_token', data.token);
            localStorage.setItem('agency_user', data.data.user.username);
            return data.data.user;
        }
        throw new Error(data.message || 'Login failed');
    },

    async signup(username, password) {
        const res = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            // ⚡ WIPE LOCAL CACHE FOR A CLEAN SLATE!
            await IDB.clear('workspaces');
            await IDB.clear('tasks');
            await IDB.clear('syncQueue');

            localStorage.setItem('agency_token', data.token);
            localStorage.setItem('agency_user', data.data.user.username);
            return data.data.user;
        }
        throw new Error(data.message || 'Signup failed');
    },

    logout() {
        localStorage.removeItem('agency_token');
        localStorage.removeItem('agency_user');
    },

    getToken() {
        return localStorage.getItem('agency_token');
    },

    isAuthenticated() {
        return !!this.getToken();
    }
};