# SIMATS Lab IDE

**Offline Programming Lab IDE for Colleges**

An Electron-based desktop application designed to provide students with a powerful, offline-capable Integrated Development Environment (IDE) for programming labs and coursework.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Building from Source](#building-from-source)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Terms and Conditions](#terms-and-conditions)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## 🎯 Overview


SIMATS Lab IDE is a student-led project designed to provide an offline programming environment for educational institutions. Built with Electron and Monaco Editor (the same editor that powers Visual Studio Code), this IDE enables students to write, edit, and manage code without requiring an internet connection.

**Important Notice:** This software is a student-led project and is NOT an official product of SIMATS or any university.

---

## ✨ Features

- **🔌 Fully Offline Operation** - Work without internet connectivity
- **💻 Monaco Editor Integration** - Professional-grade code editor with syntax highlighting
- **🎨 Modern User Interface** - Clean and intuitive design
- **📦 Lightweight** - Minimal system resource usage
- **🔄 Auto-Updates** - Automatic update notifications and installation
- **🖥️ Cross-Platform Ready** - Built with Electron for desktop deployment
- **📝 Multi-Language Support** - Code in various programming languages
- **💾 Local Data Storage** - All code and projects stored locally on your machine
- **🎓 Educational Focus** - Designed specifically for academic lab environments

---

## 🛠️ Technologies Used

- **[Electron](https://www.electronjs.org/)** (v28.1.0) - Desktop application framework
- **[Monaco Editor](https://microsoft.github.io/monaco-editor/)** (v0.45.0) - Code editor component
- **[Electron Builder](https://www.electron.build/)** (v26.4.0) - Application packaging and distribution
- **[Electron Updater](https://www.electron.build/auto-update)** (v6.7.3) - Auto-update functionality
- **Node.js** - Runtime environment

---

## 💻 System Requirements

### Minimum Requirements

- **Operating System:** Windows 7/8/10/11 (64-bit)
- **RAM:** 2 GB
- **Storage:** 200 MB free disk space
- **Processor:** Intel/AMD dual-core processor

### Recommended Requirements

- **Operating System:** Windows 10/11 (64-bit)
- **RAM:** 4 GB or higher
- **Storage:** 500 MB free disk space
- **Processor:** Intel/AMD quad-core processor

---

## 📥 Installation

### For End Users

1. **Download** the latest installer from the releases section
2. **Run** the installer executable (`.exe` file)
3. **Follow** the installation wizard:
   - Choose installation directory
   - Accept terms and conditions
   - Select desktop shortcut option
4. **Launch** SIMATS Lab IDE from the desktop shortcut or Start Menu

### Installation Options

- ✅ **Custom Installation Directory** - Choose where to install
- ✅ **Desktop Shortcut** - Automatic desktop shortcut creation
- ✅ **Start Menu Integration** - Added to Windows Start Menu

---

## 🚀 Usage

### Getting Started

1. **Launch** the application from your desktop or Start Menu
2. **Create** a new file or open an existing project
3. **Write** your code using the Monaco editor
4. **Save** your work locally
5. **Compile/Run** your code (depending on configured features)

### Key Features

- **Syntax Highlighting** - Automatic language detection and color coding
- **Code Completion** - IntelliSense-style auto-completion
- **Error Detection** - Real-time syntax error highlighting
- **File Management** - Easy file and project organization

---

## 🔧 Building from Source

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **Git**

### Clone the Repository

```bash
git clone <repository-url>
cd offline-lab-simats-ide
```

### Install Dependencies

```bash
npm install
```

### Development Mode

Run the application in development mode:

```bash
npm start
```

### Build for Production

Build the application for Windows:

```bash
npm run build
```

The built application will be available in the `dist/` directory.

---

## 📁 Project Structure

```
offline-lab-simats-ide/
├── assets/
│   └── icon.ico              # Application icon
├── main.js                   # Main Electron process
├── package.json              # Project configuration
├── installer.nsh             # NSIS installer script
├── dist/                     # Build output directory
└── node_modules/             # Dependencies
```

---

## ⚙️ Configuration

### Application Settings

- **App ID:** `com.comrademohan.lab.ide`
- **Product Name:** SIMATS Lab IDE
- **Version:** 1.0.0
- **Build Output:** `dist/` directory

### Build Configuration

The application uses Electron Builder with the following configuration:

- **Target Platform:** Windows (NSIS installer)
- **Installer Type:** Multi-user with custom directory option
- **Auto-Update:** Enabled via GitHub releases

---

## 📜 Terms and Conditions

### 1. Student Project Acknowledgement
This software is a student-led project and is NOT an official product of SIMATS or any university.

### 2. Software Usage "As-Is"
The software is provided "as-is" without any warranties. The developers are not responsible for any bugs, data loss, or system issues.

### 3. Academic Integrity
This tool is designed for educational purposes. We do not encourage or support its use for cheating in formal examinations.

### 4. Data Privacy
All code and project data are stored locally on your machine. No data is uploaded to external servers.

### 5. Installation Agreement
By installing and using this software, you agree to these terms and conditions.

---

## 🤝 Contributing

This is a student project, and contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Areas for Contribution

- Bug fixes and improvements
- New language support
- UI/UX enhancements
- Documentation improvements
- Performance optimizations

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**Comrade Mohan**

- Project Lead & Developer
- Email: [Contact through repository]

---

## 🙏 Acknowledgments

- **Monaco Editor** - For providing the excellent code editor component
- **Electron** - For the cross-platform desktop framework
- **SIMATS Community** - For inspiration and support
- **Open Source Contributors** - For various dependencies used in this project

---

## 📞 Support

For issues, questions, or suggestions:

- **Issues:** Report bugs and request features through the issues section
- **Documentation:** Refer to this README for setup and usage instructions
- **Community:** Reach out to fellow users and contributors

---

## 🔄 Version History

### Version 1.0.0
- Initial release
- Monaco Editor integration
- Offline functionality
- Auto-update support
- Windows installer

---

## ⚠️ Disclaimer

This application is provided for educational purposes only. Users are responsible for ensuring their use complies with their institution's policies and academic integrity guidelines. The developers assume no liability for misuse of this software.

---

## 🎓 Educational Purpose

SIMATS Lab IDE is specifically designed to:
- Facilitate offline programming practice
- Provide a consistent development environment across lab computers
- Enable students to work on assignments without internet dependency
- Support various programming languages commonly taught in computer science curricula

---

**Made with ❤️ for students by students**
