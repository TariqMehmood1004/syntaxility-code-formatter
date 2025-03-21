# **SyntaxilitY Code Formatter - Quickstart Guide**  

Welcome to the **SyntaxilitY Code Formatter**! This guide will help you get started with **installing, using, and developing** this extension.  

---

### **Installation**  
- Open **Visual Studio Code**.  
- Go to **Extensions Marketplace** (`Ctrl + Shift + X` / `Cmd + Shift + X`).  
- Search for **"SyntaxilitY Code Formatter"**.  
- Click **Install**.  

---

## **Features**  
- **Supports multiple languages**: JavaScript, TypeScript, Python, C++, Rust, Go, SQL, YAML, Markdown, HTML, CSS.  
- **Auto-detects installed formatters** & falls back to **Prettier** if missing.  
- **Right-click context menu for quick formatting**.  
- **Auto-format on save (configurable in `settings.json`)**.  
- **Custom keyboard shortcut**: `Ctrl + Alt + F`.  
- **Git Pre-Commit Hook for auto-formatting before commits**.  

---

## **Usage**  

### **1. Format Code Manually**  
Use the **command palette** (`Ctrl + Shift + P` / `Cmd + Shift + P`) and search for:  
- **"SyntaxilitY: Code Formatter"**  

### **2. Auto-Format on Save**
Enable auto-formatting via **VS Code settings** (`settings.json`):  
```"syntaxilityCodeFormatter.autoFormatOnSave": true```

### **2. Customize Formatters for Specific Languages**  
```
"syntaxilityCodeFormatter.formatters": {
  "javascript": "prettier",
  "typescript": "eslint",
  "python": "black",
  "cpp": "clang-format",
  "sql": "sql-formatter",
  "markdown": "markdown-it"
}
```

### **3. Enable Git Pre-Commit Hook**  
```"syntaxilityCodeFormatter.preCommitHook": true```

---

## **Developer Guide**  

### **Clone & Setup the Project**  
```
git clone https://github.com/TariqMehmood1004/syntaxility-code-formatter.git
cd syntaxility-code-formatter
npm install
```

### **Run in Development Mode**  
```npm run dev```
> This will compile and launch a new VS Code window with the extension loaded.  

### **Package the Extension (`vsce`)**  
```
npm run compile
vsce package
```> Ensure you have `vsce` installed globally:```
```npm install -g @vscode/vsce```

---

## **Useful Links**  
- **GitHub Repository**: [SyntaxilitY Code Formatter](https://github.com/TariqMehmood1004/syntaxility-code-formatter)  
- **Marketplace Listing**: _(To be added after publishing)_  
- **License**: [MIT](https://opensource.org/licenses/MIT)  

---

## **Contributing**  
Feel free to **fork** the repository and **submit pull requests** to improve the extension.  

**Happy Coding with SyntaxilitY Code Formatter!**