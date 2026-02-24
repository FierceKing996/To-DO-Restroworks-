Key Features
- Offline-First Architecture
Zero Latency: Create tasks, edit content, and switch workspaces instantly, even without internet.

Robust Sync Engine: Uses a custom SyncManager with exponential backoff and jitter to handle network flaky-ness.

Soft References: Utilizes UUIDs for frontend relationships, allowing complex relational data (Tasks inside Workspaces) to be created offline before the database assigns real IDs.

- Executive Analytics (Super Admin)
Real-Time Dashboard: A dedicated command center for Super Admins.

Productivity Scoring: Automated scoring based on task volume, completion speed, and system usage.

Heatmaps: Visual analysis of peak productivity hours (UTC).

Growth Trends: Interactive charts tracking user signups vs. task volume over time.

System Health: Monitoring of "Online" users and global active/completed task ratios.

- Security & Role-Based Access
JWT Authentication: Secure, stateless authentication using Passport.js.

Role-Based Access Control (RBAC): Distinct interfaces for Standard Users (Task Board) and Super Admins (Analytics Console).

Encrypted Archives: Completed tasks are encrypted before archiving for long-term storage security.

- Tech Stack
Frontend: React (v19), TypeScript, Vite

Styling: CSS3, Responsive Grid/Flexbox

Visualization: Recharts (Data Visualization), React Icons

State/Storage: React Hooks, IndexedDB (Local Storage)

Backend: Node.js, Express.js

Database: MongoDB (Mongoose)

Auth: Passport.js (JWT Strategy), Bcrypt

-- Getting Started
Follow these instructions to set up the project locally.

1. Prerequisites
Node.js (v16 or higher)

MongoDB (Local instance or Atlas URI)

NPM or Yarn

2. Backend Setup
The backend handles API requests, authentication, and database syncing.

Navigate to the server folder (or root if server is in root):

Create a .env file in the root directory:

Start the Server:

Server should run on http://localhost:5000

3. Frontend Setup
The frontend is the React application.

Navigate to the client folder (e.g., client, frontend, or ui):

Start the React App:

App should run on http://localhost:3000

----- Usage Guide
Creating a Standard User
Open the app in your browser.

Click "Sign Up".

Enter a username and password.

You will be directed to the Task Board, where you can create Workspaces and Tasks.

Accessing the Super Admin Dashboard
Currently, the system does not have a "Sign Up as Admin" UI for security reasons.

Sign up as a normal user first (e.g., username: admin).

Open your database GUI (MongoDB Compass or Atlas).

Find the users collection.

Edit your user document and change the role field:

Log out and Log back in. You will now see the Executive Analytics Dashboard.

> Project Structure
> Contributing
Fork the repository.

Create your feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.
