import * as vscode from "vscode";
import * as prettier from "prettier";
import { ESLint } from "eslint";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as os from "os";

export function activate(context: vscode.ExtensionContext) {
  console.log("SyntaxilitY Code Formatter is now active!");

  try {
    const config = vscode.workspace.getConfiguration("syntaxilityCodeFormatter");
    const userFormatters = config.get<{ [key: string]: string }>("formatters", {}) || {};
    const preCommitHookEnabled = config.get<boolean>("preCommitHook", true);

    let formatCommand = vscode.commands.registerCommand(
      "syntaxilityCodeFormatter.formatDocument",
      async () => {
        try {
          const editor = vscode.window.activeTextEditor;
          if (!editor) {
            vscode.window.showErrorMessage("No active editor found!");
            return;
          }

          const { document, selections } = editor;
          const text = document.getText();
          const languageId = document.languageId;
          const workspacePath = vscode.workspace.rootPath || "";

          let formattedText = text;
          let formatter = userFormatters[languageId] || getDefaultFormatter(languageId);

          // Check if formatter is installed
          if (!isFormatterInstalled(formatter)) {
            vscode.window.showWarningMessage(`Formatter "${formatter}" not found. Using fallback: Prettier.`);
            formatter = "prettier";
          }

          // Step 1: Prettier Formatting
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

          // Step 2: ESLint Fixes
          if (formatter === "eslint") {
            if (!isFormatterInstalled("eslint")) {
              vscode.window.showErrorMessage("ESLint is not installed! Install it using `npm install -g eslint`.");
              return;
            }

            const eslint = new ESLint({ fix: true });
            const results = await eslint.lintText(formattedText);
            formattedText = results[0].output || formattedText;
          }

          // Step 3: Other Formatters
          formattedText = runFormatter(formatter, formattedText);

          // Step 4: Apply Formatting to Selected Text
          editor.edit((editBuilder) => {
            selections.forEach((selection) => {
              editBuilder.replace(
                selection.isEmpty ? new vscode.Range(0, 0, document.lineCount, 0) : selection,
                formattedText
              );
            });
          });

          vscode.window.showInformationMessage(`Formatted with ${formatter}!`);
        } catch (error) {
          vscode.window.showErrorMessage(`Formatting failed: ${(error as Error).message}`);
        }
      }
    );

    vscode.workspace.onWillSaveTextDocument((event) => {
      if (config.get("autoFormatOnSave", true)) {
        vscode.commands.executeCommand("syntaxilityCodeFormatter.formatDocument");
      }
    });

    if (preCommitHookEnabled) {
      setupGitPreCommitHook();
    }

    context.subscriptions.push(formatCommand);
  } catch (error) {
    vscode.window.showErrorMessage(`Extension activation failed: ${(error as Error).message}`);
  }
}

export function deactivate() {}

function getDefaultFormatter(languageId: string): string {
  const defaultFormatters: { [key: string]: string } = {
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

function getPrettierParser(languageId: string): prettier.BuiltInParserName {
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

function isFormatterInstalled(formatter: string): boolean {
  try {
    const command = os.platform() === "win32" ? `where ${formatter}` : `which ${formatter}`;
    execSync(command, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runFormatter(command: string, text: string): string {
  try {
    return execSync(command, { input: text, encoding: "utf8" });
  } catch (error) {
    vscode.window.showErrorMessage(`Error running formatter ${command}: ${(error as Error).message}`);
    return text;
  }
}

function setupGitPreCommitHook() {
  try {
    const workspacePath = vscode.workspace.rootPath;
    if (!workspacePath) {return;};

    const gitHookPath = path.join(workspacePath, ".git", "hooks", "pre-commit");
    if (fs.existsSync(gitHookPath)) {return;};

    const hookScript = `#!/bin/sh
    echo "Running SyntaxilitY Code Formatter before commit..."
    npx syntaxility-code-formatter || echo "Formatting failed, skipping commit."
    git add .
    `;

    fs.writeFileSync(gitHookPath, hookScript);
    fs.chmodSync(gitHookPath, "755");

    vscode.window.showInformationMessage("Git pre-commit hook installed for auto-formatting.");
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to set up Git pre-commit hook: ${(error as Error).message}`);
  }
}
