#  Cyberthreat Guardian

A simple website to check if URLs or files are dangerous (like malware or phishing). It uses the **VirusTotal API** to scan and keep you safe online.

---

##  About the Project

**Cyberthreat Guardian** helps you stay safe by scanning:

- URLs (like `https://example.com`)
- Files (like `.exe` or `.bat`)

It's user-friendly—even for non-techies. Features include user authentication, real-time scans, and a dashboard for tracking your activity.

---

##  Features

-  Secure sign-up and login
-  Scan URLs for threats
-  Upload files to check for malware
-  View scan history and statistics on a personal dashboard
-  Get updates on scan results in real time

---

##  How It Works

1. **Frontend** (React) runs in your browser
2. **Backend** (Express) handles requests
3. Backend communicates with **VirusTotal API** for scanning
4. Results are saved in **MySQL** and shown on your dashboard

---

##  Getting Started

### Requirements

- **Node.js** (v16+)
- **MySQL**
- **VirusTotal API Key** – [Get one here](https://virustotal.com/)
- **Gmail Account** – for password reset (use an App Password)

---

###  Installation

#### 1. Download the Project

```bash
git clone <repository-url>
cd cyberthreat-guardian
```

Or download files manually.

---

###  Backend Setup

```bash
cd C:\Users\YourName\Downloads\CTG
npm install
```

Create a `.env` file in the `CTG` folder:

```env
DATABASE_URL=mysql://your-username:your-password@localhost:3306/cyberthreatguardian
VIRUSTOTAL_API_KEY=your-virustotal-api-key
EMAIL_USER=your-gmail-address
EMAIL_PASS=your-gmail-app-password
```

#### Set up MySQL:

```sql
mysql -u your-username -p
```

```sql
CREATE DATABASE cyberthreatguardian;
EXIT;
```

Run database migrations:

```bash
npm run migrate
```

Start the backend:

```bash
npm run dev
```

> Server will run at `http://localhost:5000`

---

###  Frontend Setup

```bash
cd C:\Users\YourName\Downloads\CTG\client
npm install
npm run dev
```

> Frontend will open at `http://localhost:5000`

---

##  How to Use

1. Open `http://localhost:5000` in your browser
2. Sign up (e.g., username: `john`, email: `john@example.com`, password: `password123`)
3. Log in to your account
4. Scan a URL or upload a file
5. View your scan history and stats on the dashboard

---

##  Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, [shadcn/ui](https://ui.shadcn.com)
- **Backend:** Express, TypeScript, Drizzle ORM, MySQL, Nodemailer, bcrypt
- **External API:** VirusTotal API

---

##  Challenges

- **Long URLs:** Solved by shortening URLs in the backend
- **Scan Time:** Implemented polling for scan results
- **Security:** Used bcrypt for password hashing and added secure password reset flow

---

##  Future Ideas

- Add ML to predict if something is dangerous
- Support more file types (.pdf, .docx, etc.)
- Create a mobile app version


---

##  Contributing

1. Fork the repo on GitHub
2. Make your changes
3. Submit a pull request

---

##  Contact

Questions? Email me at: `varundeepreddy05@gmail.com` 

---


> Thanks for using **Cyberthreat Guardian**! Stay safe online. 
