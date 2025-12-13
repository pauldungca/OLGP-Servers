# ⛪ OLGP Servers Scheduling System

<div align="center">

![Status](https://img.shields.io/badge/status-active-success.svg)
![Academic Project](https://img.shields.io/badge/project-capstone-blue.svg)
![License](https://img.shields.io/badge/license-academic-informational.svg)

**Modernizing Parish Server Management Through Digital Innovation**

[Features](#-core-features) • [Tech Stack](#-technologies-used) • [Structure](#-project-structure) • [Getting Started](#-getting-started)

</div>

---

## 📖 Project Description

The **OLGP Servers Scheduling System** is a comprehensive web-based solution developed for **Our Lady of Guadalupe Parish** that transforms traditional paper-based scheduling into a streamlined digital workflow.

### 🎯 The Challenge

Parish administrators previously managed server schedules using manual paper lists and spreadsheets—a time-consuming process prone to conflicts and human error.

### ✨ The Solution

A full-stack web application that automates scheduling, manages Mass assignments, assigns specific roles to servers, and prevents scheduling conflicts through intelligent automation and a centralized management platform.

> 💡 **Academic Excellence**: This capstone project demonstrates practical application of modern web development principles while solving real-world organizational challenges.

---

## 🚀 Core Features

<table>
<tr>
<td width="50%">

### 📅 Smart Scheduling

- **Automated schedule generation**
- **Template-based workflows**
- **Conflict detection & prevention**
- **Multi-department coordination**

</td>
<td width="50%">

### 👥 Member Management

- **Role-based assignments**
- **Server availability tracking**
- **Group organization**
- **Cross-department visibility**

</td>
</tr>
<tr>
<td width="50%">

### 📧 Communication

- **Automatic email notifications**
- **Assignment alerts**
- **Schedule updates**
- **Real-time notifications**

</td>
<td width="50%">

### 🔐 Security & Access

- **Supabase authentication**
- **Role-based permissions**
- **Secure data handling**
- **Password management**

</td>
</tr>
</table>

---

## 🛠️ Technologies Used

### Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

### Database & Services

![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer-0F9DCE?style=for-the-badge&logo=nodemailer&logoColor=white)
![EmailJS](https://img.shields.io/badge/EmailJS-E85D2A?style=for-the-badge&logo=email&logoColor=white)

---

## 📁 Project Structure

```
OLGP-Servers-main/
│
├── 📱 public/
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
│
└── 📂 src/
    ├── 🎨 App.jsx
    ├── 📝 index.js
    ├── 💅 index.css
    │
    ├── 🎨 assets/
    │   ├── css/
    │   │   ├── account.css
    │   │   ├── calendar.css
    │   │   ├── dashboard.css
    │   │   ├── departmentSettings.css
    │   │   ├── schedule.css
    │   │   └── ...
    │   │
    │   └── scripts/
    │       ├── account.js
    │       ├── addMember.js
    │       ├── assignMember.js
    │       ├── calendar.js
    │       ├── cross-department-conflict-prevention.js
    │       ├── dashboard.js
    │       ├── departmentSettings.js
    │       ├── exportSchedule.js
    │       ├── fetchMember.js
    │       └── ...
    │
    ├── 📄 pages/
    │   └── secretary-pages/
    │       ├── layout.jsx
    │       │
    │       ├── 👤 account-pages/
    │       │   ├── account.jsx
    │       │   ├── changePasswordAccount.jsx
    │       │   └── verifyOTP.jsx
    │       │
    │       ├── 🔔 notification-pages/
    │       │   ├── notification.jsx
    │       │   └── viewNotification.jsx
    │       │
    │       └── 📅 schedule-pages/
    │           ├── make-schedule-pages/
    │           │   ├── createtemplate.jsx
    │           │   ├── editTemplate.jsx
    │           │   ├── selectTemplate.jsx
    │           │   ├── useTemplate.jsx
    │           │   └── makeSchedule.jsx
    │           │
    │           ├── altar-server-schedule-pages/
    │           │   ├── assignMember.jsx
    │           │   ├── selectMass.jsx
    │           │   ├── selectRole.jsx
    │           │   └── selectSchedule.jsx
    │           │
    │           ├── choir-schedule-pages/
    │           │   ├── assignGroup.jsx
    │           │   ├── selectMass.jsx
    │           │   └── selectSchedule.jsx
    │           │
    │           └── eucharistic-minister-schedule-pages/
    │               ├── assignGroup.jsx
    │               ├── assignMember.jsx
    │               ├── selectMass.jsx
    │               └── selectSchedule.jsx
    │
    └── 🔧 utils/
        ├── axios.js
        ├── emails.js
        └── supabase.js

📦 server/
├── package.json
├── index.js
├── routes/
├── controllers/
└── middleware/
```

---

## 🎓 Project Scope & Learning Outcomes

This capstone project demonstrates mastery in:

| Area                   | Skills Demonstrated                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------- |
| 🏗️ **Architecture**    | Full-stack application design, client-server communication, RESTful API implementation |
| 💾 **Data Management** | Database design, authentication flows, state management                                |
| 🔌 **Integration**     | Third-party service integration (Supabase, email services)                             |
| 🎯 **Problem Solving** | Real-world workflow automation, conflict resolution algorithms                         |
| 📱 **UI/UX**           | Responsive design, user-centered interface development                                 |
| 🚀 **Deployment**      | Production-ready application setup and configuration                                   |

---

## 🌟 Key Highlights

- ✅ **Workflow Automation** - Eliminates manual scheduling processes
- ✅ **Conflict Prevention** - Intelligent system prevents double-booking
- ✅ **Multi-Department Support** - Manages Altar Servers, Choir, and Eucharistic Ministers
- ✅ **Template System** - Reusable schedule templates for recurring events
- ✅ **Email Integration** - Automated notifications keep everyone informed
- ✅ **Secure Authentication** - Protected access with role-based permissions

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Email service configuration

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/OLGP-Servers.git

# Navigate to project directory
cd OLGP-Servers-main

# Install frontend dependencies
npm install

# Navigate to server directory
cd server

# Install backend dependencies
npm install

# Set up environment variables
# Create .env file with your Supabase and email credentials

# Start the development server
npm run dev
```

---

## 📸 Screenshots

> 🎨 _Coming soon - Dashboard, Calendar, and Scheduling interface previews_

---

## 🤝 Contributing

This is an academic project developed for portfolio purposes. While it's not open for direct contributions, feedback and suggestions are welcome!

---

## 📬 Contact & Support

**Developer**: John Paul B. Dungca  
**Institution**: Dominican College of Tarlac  
**Email**: johnpauldungca0908@gmail.com

---

## 📄 License

This project is developed for academic purposes and internal parish use. All rights reserved.

---

<div align="center">

**Built with ❤️ for Our Lady of Guadalupe Parish**

⭐ Star this repo if you find it interesting!

</div>
