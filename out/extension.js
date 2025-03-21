"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const prettier = __importStar(require("prettier"));
const eslint_1 = require("eslint");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const os = __importStar(require("os"));
function activate(context) {
    console.log("SyntaxilitY Code Formatter is now active!");
    const config = vscode.workspace.getConfiguration("syntaxilityCodeFormatter");
    const userFormatters = config.get("formatters", {});
    const preCommitHookEnabled = config.get("preCommitHook", true);
    let formatCommand = vscode.commands.registerCommand("syntaxilityCodeFormatter.formatDocument", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found!");
            return;
        }
        const { document, selections } = editor;
        const text = document.getText();
        const languageId = document.languageId;
        const workspacePath = vscode.workspace.rootPath || "";
        try {
            let formattedText = text;
            let formatter = userFormatters[languageId] || getDefaultFormatter(languageId);
            // Check if the formatter is installed
            if (!isFormatterInstalled(formatter)) {
                vscode.window.showWarningMessage(`Formatter "${formatter}" not found. Using fallback: Prettier.`);
                formatter = "prettier";
            }
            // Step 1: Prettier Formatting (if applicable)
            if (formatter === "prettier") {
                if (!isFormatterInstalled("prettier")) {
                    vscode.window.showErrorMessage("Prettier is not installed! Install it using `npm install -g prettier`.");
                    return;
                }
                const prettierConfigPath = path.join(workspacePath, ".prettierrc.json");
                const prettierOptions = fs.existsSync(prettierConfigPath)
                    ? JSON.parse(fs.readFileSync(prettierConfigPath, "utf8"))
                    : { parser: getPrettierParser(languageId) };
                formattedText = await prettier.format(text, prettierOptions);
            }
            // Step 2: ESLint Fixes (for JS/TS)
            if (formatter === "eslint") {
                if (!isFormatterInstalled("eslint")) {
                    vscode.window.showErrorMessage("ESLint is not installed! Install it using `npm install -g eslint`.");
                    return;
                }
                const eslint = new eslint_1.ESLint({ fix: true });
                const results = await eslint.lintText(formattedText);
                formattedText = results[0].output || formattedText;
            }
            // Step 3: Other Formatters
            formattedText = runFormatter(formatter, formattedText);
            // Step 4: Apply Formatting to Selected Text
            editor.edit((editBuilder) => {
                selections.forEach((selection) => {
                    editBuilder.replace(selection.isEmpty ? new vscode.Range(0, 0, document.lineCount, 0) : selection, formattedText);
                });
            });
            vscode.window.showInformationMessage(`Formatted with ${formatter}!`);
        }
        catch (error) {
            console.error("SyntaxilitY Code Formatter Error:", error);
            vscode.window.showErrorMessage(`Formatting failed: ${error.message}`);
        }
    });
    vscode.workspace.onWillSaveTextDocument((event) => {
        if (config.get("autoFormatOnSave", true)) {
            vscode.commands.executeCommand("syntaxilityCodeFormatter.formatDocument");
        }
    });
    if (preCommitHookEnabled) {
        setupGitPreCommitHook();
    }
    context.subscriptions.push(formatCommand);
}
function deactivate() { }
function getDefaultFormatter(languageId) {
    const defaultFormatters = {
        javascript: "prettier",
        typescript: "eslint",
        python: "black",
        cpp: "clang-format",
        go: "gofmt",
        rust: "rustfmt",
        java: "google-java-format",
        sql: "sql-formatter",
        yaml: "prettier",
        markdown: "markdown-it",
    };
    return defaultFormatters[languageId] || "prettier";
}
function getPrettierParser(languageId) {
    switch (languageId) {
        case "javascript":
        case "typescript":
            return "babel";
        case "json":
            return "json";
        case "html":
            return "html";
        case "css":
        case "scss":
        case "less":
            return "css";
        case "yaml":
            return "yaml";
        case "markdown":
            return "markdown";
        default:
            return "babel"; // Default fallback
    }
}
function isFormatterInstalled(formatter) {
    try {
        const command = os.platform() === "win32" ? `where ${formatter}` : `which ${formatter}`;
        (0, child_process_1.execSync)(command, { stdio: "ignore" });
        return true;
    }
    catch {
        return false;
    }
}
function runFormatter(command, text) {
    try {
        return (0, child_process_1.execSync)(command, { input: text, encoding: "utf8" });
    }
    catch (error) {
        console.error(`Error running formatter ${command}:`, error);
        return text;
    }
}
function setupGitPreCommitHook() {
    const workspacePath = vscode.workspace.rootPath;
    if (!workspacePath) {
        return;
    }
    ;
    const gitHookPath = path.join(workspacePath, ".git", "hooks", "pre-commit");
    if (fs.existsSync(gitHookPath)) {
        return;
    }
    ;
    const hookScript = `#!/bin/sh
  echo "Running SyntaxilitY Code Formatter before commit..."
  npx syntaxility-code-formatter || echo "Formatting failed, skipping commit."
  git add .
  `;
    fs.writeFileSync(gitHookPath, hookScript);
    fs.chmodSync(gitHookPath, "755");
    vscode.window.showInformationMessage("Git pre-commit hook installed for auto-formatting.");
}
//# sourceMappingURL=extension.js.map