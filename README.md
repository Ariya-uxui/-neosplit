<div align="center">
  <img src="https://i.ibb.co/JRcxX9y9/Heading-1.png" alt="NeoSplit Logo" width="300" />
  
  <h3>Gamified Expense Splitting App</h3>
  
  <p>Split bills with friends, earn points, compete on leaderboard</p>
 
  [![Live Demo](https://img.shields.io/badge/Live%20Demo-neosplit--olive.vercel.app-00ff85?style=for-the-badge&logo=vercel&logoColor=black)](https://neosplit-olive.vercel.app)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
  [![PWA](https://img.shields.io/badge/PWA-Ready-00ff85?style=for-the-badge)](https://web.dev/pwa)
 
</div>
 
---
 
## ✨ Features
 
| Feature | Description |
|---------|-------------|
| ⚖️ **Smart Settlement** | คำนวณยอดที่ต้องจ่ายอัตโนมัติ ลด transfers ให้น้อยที่สุด |
| 🏆 **Gamified Points** | รับคะแนนทุกครั้งที่ settle bill แข่งกับเพื่อนใน leaderboard |
| 📷 **Slip Attach** | แนบรูปสลิปกับแต่ละบิล เก็บหลักฐานการจ่าย |
| 📊 **Analytics** | สรุปค่าใช้จ่ายแยก category พร้อม export |
| 🎁 **Rewards** | แลกคะแนนเป็นรางวัลต่างๆ |
| 📱 **PWA** | ติดตั้งบน Android/iOS ได้เหมือน native app |
 
---
 
## 🚀 Getting Started
 
```bash
# Clone the repo
git clone https://github.com/Ariya-uxui/-neosplit.git
 
# Install dependencies
cd -neosplit
npm install
 
# Run development server
npm start
 
# Build for production
npm run build
```
 
---
 
## 📱 Install as App (PWA)
 
1. เปิด Chrome บน Android/iOS
2. ไปที่ [neosplit-olive.vercel.app](https://neosplit-olive.vercel.app)
3. กด ⋮ → **Add to Home screen**
 
---
 
## 🏗️ Tech Stack
 
- **Frontend** — React 18, CSS Variables
- **State** — React useState + localStorage
- **Charts** — Custom SVG donut chart
- **Deploy** — Vercel + GitHub Actions
- **PWA** — Service Worker + Web Manifest
 
---
 
## 📂 Project Structure
 
```
src/
├── screens/          # All page components
│   ├── Home.jsx      # Dashboard
│   ├── Bills.jsx     # Bill list
│   ├── Settlement.jsx # Smart settlement calculator
│   ├── Splitbill.jsx # Split modes (Equal/Custom/By Items)
│   ├── Leaderboard.jsx
│   ├── Rewards.jsx
│   └── ...
├── components/
│   ├── Navbar.js
│   └── ExpenseChart.jsx
└── App.jsx           # Main router + state
```
 
---
 
## 👩‍💻 Developer
 
**Ariya** — [@Ariya-uxui](https://github.com/Ariya-uxui)
 
---
 
<div align="center">
  <sub>Built with ❤️ using React · NeoSplit © 2026</sub>
</div>
 