import fs from "node:fs/promises";
import path from "node:path";
import type { PluginManifest } from "@/types/plugin";

export interface SecurityScanResult {
  passed: boolean;
  score: number; // 0-100
  issues: SecurityIssue[];
  recommendations: string[];
}

export interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  message: string;
  file?: string;
  line?: number;
  code?: string;
}

export class PluginSecurityScanner {
  private readonly dangerousPatterns: Array<{
    pattern: RegExp;
    severity: string;
    message: string;
    type?: string;
  }> = [
    // Direct eval and code execution
    {
      pattern: /\beval\s*\(/gi,
      severity: "critical",
      message: "Direct eval() usage detected",
    },
    {
      pattern: /new\s+Function\s*\(/gi,
      severity: "critical",
      message: "Dynamic function creation detected",
    },
    {
      pattern: /setTimeout\s*\([^,]+,/gi,
      severity: "high",
      message: "Dynamic setTimeout detected",
    },
    {
      pattern: /setInterval\s*\([^,]+,/gi,
      severity: "high",
      message: "Dynamic setInterval detected",
    },

    // Process and system access
    {
      pattern: /require\s*\(\s*['"]child_process['"]\s*\)/gi,
      severity: "critical",
      message: "Child process access attempted",
    },
    {
      pattern: /require\s*\(\s*['"]fs['"]\s*\)/gi,
      severity: "critical",
      message: "File system access attempted",
    },
    {
      pattern: /require\s*\(\s*['"]net['"]\s*\)/gi,
      severity: "high",
      message: "Network module access attempted",
    },
    {
      pattern: /require\s*\(\s*['"]os['"]\s*\)/gi,
      severity: "high",
      message: "OS module access attempted",
    },
    {
      pattern: /require\s*\(\s*['"]cluster['"]\s*\)/gi,
      severity: "high",
      message: "Cluster module access attempted",
    },

    // Environment and secrets access
    {
      pattern: /process\.env/gi,
      severity: "critical",
      message: "Environment variable access detected",
    },
    {
      pattern: /BTCPAYSERVER_API_KEY/gi,
      severity: "critical",
      message: "API key access attempted",
    },
    {
      pattern: /localStorage\s*\./gi,
      severity: "high",
      message: "LocalStorage access detected",
    },
    {
      pattern: /sessionStorage\s*\./gi,
      severity: "high",
      message: "SessionStorage access detected",
    },
    {
      pattern: /document\.cookie/gi,
      severity: "critical",
      message: "Cookie access detected",
    },
    {
      pattern: /indexedDB/gi,
      severity: "high",
      message: "IndexedDB access detected",
    },

    // XSS vulnerabilities
    {
      pattern: /innerHTML\s*=/gi,
      severity: "high",
      message: "innerHTML usage detected (XSS risk)",
    },
    {
      pattern: /outerHTML\s*=/gi,
      severity: "high",
      message: "outerHTML usage detected (XSS risk)",
    },
    {
      pattern: /document\.write/gi,
      severity: "high",
      message: "document.write usage detected",
    },
    {
      pattern: /insertAdjacentHTML/gi,
      severity: "medium",
      message: "insertAdjacentHTML usage detected",
    },

    // Network requests
    {
      pattern: /fetch\s*\(/gi,
      severity: "medium",
      message: "External fetch detected",
    },
    {
      pattern: /XMLHttpRequest/gi,
      severity: "medium",
      message: "XMLHttpRequest usage detected",
    },
    {
      pattern: /WebSocket/gi,
      severity: "high",
      message: "WebSocket usage detected",
    },
    {
      pattern: /EventSource/gi,
      severity: "medium",
      message: "EventSource usage detected",
    },

    // Crypto mining
    {
      pattern: /CryptoNight|Monero|coinhive|cryptonight|coin-hive/gi,
      severity: "critical",
      message: "Potential crypto mining code detected",
    },
    {
      pattern: /WebAssembly/gi,
      severity: "high",
      message: "WebAssembly usage detected",
    },

    // Prototype pollution
    {
      pattern: /__proto__|constructor\s*\[|Object\.prototype/gi,
      severity: "high",
      message: "Potential prototype pollution",
    },

    // Dangerous DOM manipulation
    {
      pattern: /document\.domain\s*=/gi,
      severity: "critical",
      message: "Document domain manipulation detected",
    },
    {
      pattern: /window\.location\s*=/gi,
      severity: "high",
      message: "Window location manipulation detected",
    },
    {
      pattern: /top\.location/gi,
      severity: "high",
      message: "Top frame location access detected",
    },
    {
      pattern: /parent\./gi,
      severity: "medium",
      message: "Parent frame access detected",
    },

    // Import/Export of dangerous modules
    {
      pattern: /import\s+.*['"]fs['"]/gi,
      severity: "critical",
      message: "File system import detected",
    },
    {
      pattern: /import\s+.*['"]child_process['"]/gi,
      severity: "critical",
      message: "Child process import detected",
    },
    {
      pattern: /import\s+.*['"]crypto['"]/gi,
      severity: "medium",
      message: "Crypto module import detected",
    },

    // Obfuscation patterns
    {
      pattern: /\\x[0-9a-f]{2}/gi,
      severity: "medium",
      message: "Hex encoded strings detected (possible obfuscation)",
      type: "obfuscation",
    },
    {
      pattern: /\\u[0-9a-f]{4}/gi,
      severity: "low",
      message: "Unicode encoded strings detected",
      type: "obfuscation",
    },
    {
      pattern: /atob|btoa/gi,
      severity: "medium",
      message: "Base64 encoding/decoding detected",
      type: "obfuscation",
    },
    {
      pattern: /String\.fromCharCode/gi,
      severity: "medium",
      message: "String.fromCharCode usage detected (possible obfuscation)",
      type: "obfuscation",
    },
  ];

  private readonly allowedDomains = [
    "btcpayserver.org",
    "api.btcpayserver.org",
    "docs.btcpayserver.org",
    // Add other trusted domains
  ];

  async scanPlugin(pluginPath: string): Promise<SecurityScanResult> {
    const issues: SecurityIssue[] = [];
    const recommendations: string[] = [];

    try {
      // Scan manifest
      const manifestIssues = await this.scanManifest(pluginPath);
      issues.push(...manifestIssues);

      // Scan all JavaScript/TypeScript files
      const codeIssues = await this.scanCodeFiles(pluginPath);
      issues.push(...codeIssues);

      // Check for suspicious files
      const fileIssues = await this.checkSuspiciousFiles(pluginPath);
      issues.push(...fileIssues);

      // Check dependencies
      const depIssues = await this.checkDependencies(pluginPath);
      issues.push(...depIssues);

      // Calculate security score
      const score = this.calculateSecurityScore(issues);

      // Generate recommendations
      if (issues.some((i) => i.severity === "critical")) {
        recommendations.push(
          "This plugin contains critical security issues and should not be installed.",
        );
      }

      if (issues.some((i) => i.type === "obfuscation")) {
        recommendations.push(
          "Plugin code appears to be obfuscated, which may hide malicious behavior.",
        );
      }

      if (issues.some((i) => i.type === "network")) {
        recommendations.push(
          "Plugin makes external network requests. Verify all endpoints are trusted.",
        );
      }

      if (score < 50) {
        recommendations.push(
          "This plugin has a low security score. Review all issues before installation.",
        );
      }

      // Check for specific high-risk file types that should always fail
      const hasHighRiskFiles = issues.some(
        (i) =>
          i.type === "suspicious-file" &&
          i.severity === "high" &&
          (i.message.includes("WebAssembly") ||
            i.message.includes("Shell script") ||
            i.message.includes("PowerShell")),
      );

      return {
        passed:
          score >= 70 &&
          !issues.some((i) => i.severity === "critical") &&
          !hasHighRiskFiles,
        score,
        issues,
        recommendations,
      };
    } catch (error) {
      console.error("Security scan failed:", error);
      return {
        passed: false,
        score: 0,
        issues: [
          {
            severity: "critical",
            type: "scan-error",
            message: `Security scan failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        recommendations: [
          "Unable to complete security scan. Do not install this plugin.",
        ],
      };
    }
  }

  private async scanManifest(pluginPath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const manifestPath = path.join(pluginPath, "manifest.json");

    try {
      const content = await fs.readFile(manifestPath, "utf-8");
      const manifest: PluginManifest = JSON.parse(content);

      // Check for excessive permissions
      if (manifest.requiredPermissions) {
        const dangerousPerms = [
          "btcpay.server.canmodifysettings",
          "btcpay.server.cancreateuser",
          "btcpay.user.candeleteuser",
        ];

        for (const perm of manifest.requiredPermissions) {
          if (dangerousPerms.includes(perm.permission)) {
            issues.push({
              severity: "high",
              type: "permission",
              message: `Requests dangerous permission: ${perm.permission}`,
              file: "manifest.json",
            });
          }
        }

        if (manifest.requiredPermissions.length > 5) {
          issues.push({
            severity: "medium",
            type: "permission",
            message: "Plugin requests excessive number of permissions",
            file: "manifest.json",
          });
        }
      }

      // Check for suspicious URLs in manifest
      const urlPattern = /https?:\/\/[^\s"']+/gi;
      const urls = content.match(urlPattern) || [];

      for (const url of urls) {
        const urlObj = new URL(url);
        if (
          !this.allowedDomains.some((domain) =>
            urlObj.hostname.endsWith(domain),
          )
        ) {
          issues.push({
            severity: "medium",
            type: "network",
            message: `External URL found in manifest: ${url}`,
            file: "manifest.json",
          });
        }
      }

      // Check version format
      if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
        issues.push({
          severity: "low",
          type: "manifest",
          message: "Invalid version format in manifest",
          file: "manifest.json",
        });
      }
    } catch (_error) {
      issues.push({
        severity: "critical",
        type: "manifest",
        message: "Unable to read or parse manifest.json",
        file: "manifest.json",
      });
    }

    return issues;
  }

  private async scanCodeFiles(pluginPath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const codeExtensions = [".js", ".jsx", ".ts", ".tsx", ".mjs"];

    const scanDirectory = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && entry.name !== "node_modules") {
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (codeExtensions.includes(ext)) {
            const fileIssues = await this.scanFile(fullPath, pluginPath);
            issues.push(...fileIssues);
          }
        }
      }
    };

    await scanDirectory(pluginPath);
    return issues;
  }

  private async scanFile(
    filePath: string,
    basePath: string,
  ): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const relativePath = path.relative(basePath, filePath);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n");

      // Check for dangerous patterns
      for (const { pattern, severity, message, type } of this
        .dangerousPatterns) {
        const matches = content.matchAll(pattern);

        for (const match of matches) {
          const lineNumber = content
            .substring(0, match.index)
            .split("\n").length;
          const line = lines[lineNumber - 1];

          issues.push({
            severity: severity as SecurityIssue["severity"],
            type: type || "code-pattern",
            message,
            file: relativePath,
            line: lineNumber,
            code: line?.trim(),
          });
        }
      }

      // Check for obfuscation
      const obfuscationScore = this.detectObfuscation(content);
      if (obfuscationScore > 0.7) {
        issues.push({
          severity: "high",
          type: "obfuscation",
          message: `High obfuscation detected (score: ${(obfuscationScore * 100).toFixed(0)}%)`,
          file: relativePath,
        });
      } else if (obfuscationScore > 0.4) {
        issues.push({
          severity: "medium",
          type: "obfuscation",
          message: `Moderate obfuscation detected (score: ${(obfuscationScore * 100).toFixed(0)}%)`,
          file: relativePath,
        });
      }

      // Check for suspicious strings
      const suspiciousStrings = [
        /password|passwd|pwd/gi,
        /secret|token|key/gi,
        /api[_-]?key/gi,
        /private[_-]?key/gi,
      ];

      for (const pattern of suspiciousStrings) {
        if (pattern.test(content)) {
          issues.push({
            severity: "medium",
            type: "sensitive-data",
            message: `Potential sensitive data handling detected: ${pattern.source}`,
            file: relativePath,
          });
          break; // Only report once per file
        }
      }
    } catch (error) {
      issues.push({
        severity: "low",
        type: "file-error",
        message: `Unable to scan file: ${error instanceof Error ? error.message : "Unknown error"}`,
        file: relativePath,
      });
    }

    return issues;
  }

  private detectObfuscation(code: string): number {
    let score = 0;
    const factors = [
      { pattern: /[a-zA-Z_$][a-zA-Z0-9_$]{50,}/g, weight: 0.3 }, // Very long identifiers
      { pattern: /\\x[0-9a-f]{2}/gi, weight: 0.2 }, // Hex strings
      { pattern: /\\u[0-9a-f]{4}/gi, weight: 0.1 }, // Unicode escapes
      { pattern: /[^\x20-\x7E\n\r\t]/g, weight: 0.2 }, // Non-printable characters
      { pattern: /['"][^'"]{200,}['"]/g, weight: 0.2 }, // Very long strings
    ];

    for (const { pattern, weight } of factors) {
      const matches = code.match(pattern);
      if (matches && matches.length > 0) {
        score += Math.min(matches.length / 100, 1) * weight;
      }
    }

    // Check entropy of identifiers
    const identifiers = code.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];
    const avgLength =
      identifiers.reduce((sum, id) => sum + id.length, 0) /
      (identifiers.length || 1);
    if (avgLength > 30) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  private async checkSuspiciousFiles(
    pluginPath: string,
  ): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const suspiciousPatterns = [
      {
        pattern: /\.exe$/i,
        severity: "critical",
        message: "Executable file found",
      },
      { pattern: /\.dll$/i, severity: "critical", message: "DLL file found" },
      {
        pattern: /\.so$/i,
        severity: "high",
        message: "Shared library file found",
      },
      {
        pattern: /\.wasm$/i,
        severity: "high",
        message: "WebAssembly file found",
      },
      { pattern: /\.sh$/i, severity: "high", message: "Shell script found" },
      { pattern: /\.bat$/i, severity: "high", message: "Batch file found" },
      { pattern: /\.cmd$/i, severity: "high", message: "Command file found" },
      {
        pattern: /\.ps1$/i,
        severity: "high",
        message: "PowerShell script found",
      },
    ];

    const checkDirectory = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(pluginPath, fullPath);

        if (entry.isDirectory() && entry.name !== "node_modules") {
          await checkDirectory(fullPath);
        } else if (entry.isFile()) {
          for (const { pattern, severity, message } of suspiciousPatterns) {
            if (pattern.test(entry.name)) {
              issues.push({
                severity: severity as SecurityIssue["severity"],
                type: "suspicious-file",
                message,
                file: relativePath,
              });
            }
          }

          // Check file size (files over 10MB are suspicious)
          const stats = await fs.stat(fullPath);
          if (stats.size > 10 * 1024 * 1024) {
            issues.push({
              severity: "medium",
              type: "suspicious-file",
              message: `Large file detected (${(stats.size / 1024 / 1024).toFixed(2)} MB)`,
              file: relativePath,
            });
          }
        }
      }
    };

    await checkDirectory(pluginPath);
    return issues;
  }

  private async checkDependencies(
    pluginPath: string,
  ): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const packageJsonPath = path.join(pluginPath, "package.json");

    try {
      const content = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(content);

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for suspicious packages
      const suspiciousPackages = [
        "child_process",
        "fs-extra",
        "node-ssh",
        "node-cmd",
        "shelljs",
        "node-powershell",
      ];

      for (const [name, version] of Object.entries(allDeps)) {
        if (suspiciousPackages.includes(name)) {
          issues.push({
            severity: "high",
            type: "dependency",
            message: `Suspicious dependency detected: ${name}@${version}`,
            file: "package.json",
          });
        }

        // Check for packages with scripts
        if (name.includes("postinstall") || name.includes("preinstall")) {
          issues.push({
            severity: "high",
            type: "dependency",
            message: `Package with install scripts detected: ${name}`,
            file: "package.json",
          });
        }
      }

      // Check for npm scripts that might be dangerous
      if (packageJson.scripts) {
        const dangerousScripts = ["postinstall", "preinstall", "prepare"];
        for (const script of dangerousScripts) {
          if (packageJson.scripts[script]) {
            issues.push({
              severity: "high",
              type: "npm-script",
              message: `Dangerous npm script detected: ${script}`,
              file: "package.json",
              code: packageJson.scripts[script],
            });
          }
        }
      }
    } catch (_error) {
      // No package.json is fine for simple plugins
    }

    return issues;
  }

  private calculateSecurityScore(issues: SecurityIssue[]): number {
    let score = 100;

    const penalties = {
      critical: 30,
      high: 15,
      medium: 5,
      low: 2,
    };

    for (const issue of issues) {
      score -= penalties[issue.severity];
    }

    return Math.max(0, Math.min(100, score));
  }

  async generateSecurityReport(
    scanResult: SecurityScanResult,
  ): Promise<string> {
    const report = [];

    report.push("# Plugin Security Scan Report");
    report.push(`Generated: ${new Date().toISOString()}\n`);

    report.push("## Summary");
    report.push(
      `- **Status**: ${scanResult.passed ? "✅ PASSED" : "❌ FAILED"}`,
    );
    report.push(`- **Security Score**: ${scanResult.score}/100`);
    report.push(`- **Total Issues**: ${scanResult.issues.length}`);
    report.push(
      `- **Critical Issues**: ${scanResult.issues.filter((i) => i.severity === "critical").length}`,
    );
    report.push(
      `- **High Issues**: ${scanResult.issues.filter((i) => i.severity === "high").length}`,
    );
    report.push(
      `- **Medium Issues**: ${scanResult.issues.filter((i) => i.severity === "medium").length}`,
    );
    report.push(
      `- **Low Issues**: ${scanResult.issues.filter((i) => i.severity === "low").length}\n`,
    );

    if (scanResult.recommendations.length > 0) {
      report.push("## Recommendations");
      for (const rec of scanResult.recommendations) {
        report.push(`- ${rec}`);
      }
      report.push("");
    }

    if (scanResult.issues.length > 0) {
      report.push("## Issues Found\n");

      const groupedIssues = scanResult.issues.reduce(
        (acc, issue) => {
          if (!acc[issue.severity]) acc[issue.severity] = [];
          acc[issue.severity].push(issue);
          return acc;
        },
        {} as Record<string, SecurityIssue[]>,
      );

      for (const severity of ["critical", "high", "medium", "low"]) {
        const issues = groupedIssues[severity];
        if (issues && issues.length > 0) {
          report.push(`### ${severity.toUpperCase()} Severity\n`);

          for (const issue of issues) {
            report.push(`**${issue.message}**`);
            if (issue.file) report.push(`- File: \`${issue.file}\``);
            if (issue.line) report.push(`- Line: ${issue.line}`);
            if (issue.code) report.push(`- Code: \`${issue.code}\``);
            report.push("");
          }
        }
      }
    }

    return report.join("\n");
  }
}
