<div align="center">

# ✉️ MiniMail

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

A lightweight, purely client-side email client simulation that provides an incredibly fast and fluid inbox experience entirely in the browser using LocalStorage.

</div>

---

## 🚀 Features Overview

| Feature | Description |
|---|---|
| **Zero Backend** | Runs entirely in the browser using LocalStorage as a simulated database. |
| **Lightning Fast** | No network latency. State updates and DOM manipulation happen instantly. |
| **Auth Simulation** | Fully simulated login, registration, and session management. |
| **Responsive UI** | Beautiful, modern glass-morphism design that scales to any screen size. |

---

## 💻 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Storage Engine**: Browser window.localStorage
- **Architecture**: Modular JS (uth.js, mail.js, storage.js, pp.js)

---

## 📂 Project Structure

`	ext
mini-gmail/
├── index.html        # Authentication page (Login/Register)
├── inbox.html        # Main dashboard and email interface
├── style.css         # Global styles and UI components
├── storage.js        # LocalStorage database wrapper
├── auth.js           # Authentication and session logic
├── mail.js           # Email handling and DOM rendering
└── app.js            # Core application initialization
`

---

## ⚡ Installation & Setup

Because MiniMail is fully client-side, you don't need any complex build tools or backend servers to run it!

1. **Clone the repository:**
   `ash
   git clone https://github.com/dharani2006lakshmi-sys/mini-gmail.git
   cd mini-gmail
   `

2. **Run Locally:**
   Simply open index.html in your favorite web browser! 
   *(Optionally, you can use VS Code Live Server for hot reloading).*

---

## 📜 License

MIT License - Free to use, modify, and learn from!
