import type { PluginManifest } from "@/types/plugin";

export interface ManifestValidationResult {
  valid: boolean;
  errors: ManifestValidationError[];
  warnings: ManifestValidationWarning[];
  manifest?: PluginManifest;
}

export interface ManifestValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ManifestValidationWarning {
  field: string;
  message: string;
  recommendation?: string;
}

export class PluginManifestValidator {
  private readonly requiredFields = [
    "id",
    "name",
    "version",
    "description",
    "author",
  ];

  private readonly validPermissions = [
    "btcpay.store.canviewinvoices",
    "btcpay.store.cancreateinvoice",
    "btcpay.store.canmodifyinvoices",
    "btcpay.store.candeleteinvoices",
    "btcpay.store.canviewstoresettings",
    "btcpay.store.canmodifystoresettings",
    "btcpay.store.canviewpaymentrequests",
    "btcpay.store.canmodifypaymentrequests",
    "btcpay.store.canviewpullpayments",
    "btcpay.store.cancreatepullpayments",
    "btcpay.store.cancreatepayout",
    "btcpay.store.canviewpayouts",
    "btcpay.store.canmodifypayouts",
    "btcpay.store.canviewcustodianaccounts",
    "btcpay.store.canmanagecustodianaccounts",
    "btcpay.store.candeposittocustodianaccounts",
    "btcpay.store.canwithdrawfromcustodianaccounts",
    "btcpay.store.cantradecustodianaccounts",
    "btcpay.user.canviewprofile",
    "btcpay.user.canmodifyprofile",
    "btcpay.user.canmanagenotificationsforuser",
    "btcpay.user.canviewnotificationsforuser",
    "btcpay.server.canviewusers",
    "btcpay.server.cancreateuser",
    "btcpay.server.candeleteuser",
    "btcpay.server.canmodifyserversettings",
    "btcpay.server.canviewserversettings",
    "btcpay.server.canuseinternallightningnode",
    "btcpay.server.cancreateinternallightningnode",
    "btcpay.server.canuseinternallightningnodeinstore",
  ];

  private readonly dangerousPermissions = [
    "btcpay.server.canmodifyserversettings",
    "btcpay.server.cancreateuser",
    "btcpay.server.candeleteuser",
    "btcpay.user.candeleteuser",
    "btcpay.store.canmodifystoresettings",
  ];

  validate(manifestData: any): ManifestValidationResult {
    const errors: ManifestValidationError[] = [];
    const warnings: ManifestValidationWarning[] = [];

    // Check if manifest is an object
    if (!manifestData || typeof manifestData !== "object") {
      return {
        valid: false,
        errors: [
          {
            field: "manifest",
            message: "Manifest must be a valid JSON object",
          },
        ],
        warnings: [],
      };
    }

    // Validate required fields
    for (const field of this.requiredFields) {
      if (!manifestData[field]) {
        errors.push({
          field,
          message: `Required field "${field}" is missing`,
        });
      }
    }

    // Validate ID format
    if (manifestData.id) {
      if (!this.validateId(manifestData.id)) {
        errors.push({
          field: "id",
          message:
            "Plugin ID must contain only lowercase letters, numbers, and hyphens",
          value: manifestData.id,
        });
      }

      if (manifestData.id.length > 50) {
        errors.push({
          field: "id",
          message: "Plugin ID must be 50 characters or less",
          value: manifestData.id,
        });
      }
    }

    // Validate name
    if (manifestData.name) {
      if (manifestData.name.length > 100) {
        errors.push({
          field: "name",
          message: "Plugin name must be 100 characters or less",
          value: manifestData.name,
        });
      }

      if (!/^[\w\s\-.]+$/.test(manifestData.name)) {
        warnings.push({
          field: "name",
          message: "Plugin name contains special characters",
          recommendation:
            "Use only letters, numbers, spaces, hyphens, and periods",
        });
      }
    }

    // Validate version
    if (manifestData.version) {
      if (!this.validateVersion(manifestData.version)) {
        errors.push({
          field: "version",
          message: "Version must follow semantic versioning (e.g., 1.0.0)",
          value: manifestData.version,
        });
      }
    }

    // Validate description
    if (manifestData.description) {
      if (manifestData.description.length > 500) {
        warnings.push({
          field: "description",
          message: "Description is very long (>500 characters)",
          recommendation: "Consider keeping description concise",
        });
      }

      // Check for suspicious content in description
      if (this.containsSuspiciousContent(manifestData.description)) {
        warnings.push({
          field: "description",
          message: "Description contains potentially suspicious content",
          recommendation:
            "Review description for misleading or malicious content",
        });
      }
    }

    // Validate author
    if (manifestData.author) {
      if (manifestData.author.length > 100) {
        errors.push({
          field: "author",
          message: "Author name must be 100 characters or less",
          value: manifestData.author,
        });
      }
    }

    // Validate homepage URL
    if (manifestData.homepage) {
      if (!this.validateUrl(manifestData.homepage)) {
        errors.push({
          field: "homepage",
          message: "Homepage must be a valid URL",
          value: manifestData.homepage,
        });
      }

      // Check for suspicious domains
      if (this.isSuspiciousDomain(manifestData.homepage)) {
        warnings.push({
          field: "homepage",
          message: "Homepage URL points to a potentially suspicious domain",
          recommendation: "Verify the domain is legitimate",
        });
      }
    }

    // Validate license
    if (manifestData.license) {
      const validLicenses = [
        "MIT",
        "Apache-2.0",
        "GPL-3.0",
        "BSD-3-Clause",
        "ISC",
        "MPL-2.0",
      ];
      if (!validLicenses.includes(manifestData.license)) {
        warnings.push({
          field: "license",
          message: `Non-standard license: ${manifestData.license}`,
          recommendation: "Consider using a standard open-source license",
        });
      }
    }

    // Validate main entry point
    if (manifestData.main) {
      if (!this.validateFilePath(manifestData.main)) {
        errors.push({
          field: "main",
          message: "Main entry point must be a valid file path",
          value: manifestData.main,
        });
      }

      if (!manifestData.main.match(/\.(js|jsx|ts|tsx)$/)) {
        errors.push({
          field: "main",
          message: "Main entry point must be a JavaScript or TypeScript file",
          value: manifestData.main,
        });
      }
    }

    // Validate routes
    if (manifestData.routes) {
      if (typeof manifestData.routes !== "object") {
        errors.push({
          field: "routes",
          message: "Routes must be an object",
          value: manifestData.routes,
        });
      } else {
        for (const [key, value] of Object.entries(manifestData.routes)) {
          if (typeof value !== "string") {
            errors.push({
              field: `routes.${key}`,
              message: "Route value must be a string",
              value,
            });
          } else if (!this.validateRoute(value as string)) {
            errors.push({
              field: `routes.${key}`,
              message:
                "Route must start with / and contain only valid URL characters",
              value,
            });
          }
        }
      }
    }

    // Validate permissions
    if (manifestData.requiredPermissions) {
      if (!Array.isArray(manifestData.requiredPermissions)) {
        errors.push({
          field: "requiredPermissions",
          message: "Required permissions must be an array",
          value: manifestData.requiredPermissions,
        });
      } else {
        const seenPermissions = new Set<string>();

        for (let i = 0; i < manifestData.requiredPermissions.length; i++) {
          const perm = manifestData.requiredPermissions[i];

          if (!perm || typeof perm !== "object") {
            errors.push({
              field: `requiredPermissions[${i}]`,
              message: "Permission must be an object",
              value: perm,
            });
            continue;
          }

          if (!perm.permission) {
            errors.push({
              field: `requiredPermissions[${i}].permission`,
              message: "Permission string is required",
            });
          } else {
            // Check for duplicates
            if (seenPermissions.has(perm.permission)) {
              errors.push({
                field: `requiredPermissions[${i}].permission`,
                message: "Duplicate permission",
                value: perm.permission,
              });
            }
            seenPermissions.add(perm.permission);

            // Validate permission string
            if (!this.validPermissions.includes(perm.permission)) {
              errors.push({
                field: `requiredPermissions[${i}].permission`,
                message: "Invalid permission string",
                value: perm.permission,
              });
            }

            // Warn about dangerous permissions
            if (this.dangerousPermissions.includes(perm.permission)) {
              warnings.push({
                field: `requiredPermissions[${i}].permission`,
                message: `Dangerous permission requested: ${perm.permission}`,
                recommendation:
                  "This permission grants significant access. Ensure it is necessary.",
              });
            }
          }

          if (!perm.description) {
            warnings.push({
              field: `requiredPermissions[${i}].description`,
              message: "Permission description is missing",
              recommendation:
                "Add a description to explain why this permission is needed",
            });
          }

          if (typeof perm.required !== "boolean") {
            errors.push({
              field: `requiredPermissions[${i}].required`,
              message: "Permission required field must be a boolean",
              value: perm.required,
            });
          }
        }

        // Warn if too many permissions
        if (manifestData.requiredPermissions.length > 10) {
          warnings.push({
            field: "requiredPermissions",
            message: "Plugin requests many permissions (>10)",
            recommendation:
              "Consider reducing permissions to the minimum necessary",
          });
        }
      }
    }

    // Validate dependencies
    if (manifestData.dependencies) {
      if (typeof manifestData.dependencies !== "object") {
        errors.push({
          field: "dependencies",
          message: "Dependencies must be an object",
          value: manifestData.dependencies,
        });
      } else {
        for (const [pkg, version] of Object.entries(
          manifestData.dependencies,
        )) {
          if (typeof version !== "string") {
            errors.push({
              field: `dependencies.${pkg}`,
              message: "Dependency version must be a string",
              value: version,
            });
          }

          // Warn about suspicious packages
          if (this.isSuspiciousPackage(pkg)) {
            warnings.push({
              field: `dependencies.${pkg}`,
              message: `Potentially suspicious package: ${pkg}`,
              recommendation: "Review this dependency carefully",
            });
          }
        }
      }
    }

    // Validate price fields
    if (manifestData.isPaid !== undefined) {
      if (typeof manifestData.isPaid !== "boolean") {
        errors.push({
          field: "isPaid",
          message: "isPaid must be a boolean",
          value: manifestData.isPaid,
        });
      }

      if (manifestData.isPaid && manifestData.price === undefined) {
        errors.push({
          field: "price",
          message: "Price is required when isPaid is true",
        });
      }
    }

    if (manifestData.price !== undefined) {
      if (typeof manifestData.price !== "number" || manifestData.price < 0) {
        errors.push({
          field: "price",
          message: "Price must be a positive number",
          value: manifestData.price,
        });
      }
    }

    // Validate minAppVersion
    if (manifestData.minAppVersion) {
      if (!this.validateVersion(manifestData.minAppVersion)) {
        errors.push({
          field: "minAppVersion",
          message: "minAppVersion must follow semantic versioning",
          value: manifestData.minAppVersion,
        });
      }
    }

    // Check for unknown fields (potential security risk)
    const knownFields = [
      ...this.requiredFields,
      "homepage",
      "license",
      "main",
      "icon",
      "routes",
      "requiredPermissions",
      "dependencies",
      "isPaid",
      "price",
      "category",
      "tags",
      "screenshots",
      "minAppVersion",
    ];

    for (const field of Object.keys(manifestData)) {
      if (!knownFields.includes(field)) {
        warnings.push({
          field,
          message: `Unknown field in manifest: ${field}`,
          recommendation: "Remove unknown fields from manifest",
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      manifest:
        errors.length === 0 ? (manifestData as PluginManifest) : undefined,
    };
  }

  private validateId(id: string): boolean {
    return /^[a-z0-9-]+$/.test(id);
  }

  private validateVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?(\+[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?$/.test(
      version,
    );
  }

  private validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private validateFilePath(path: string): boolean {
    // No path traversal
    if (path.includes("..")) return false;
    // Valid file path characters
    return /^[a-zA-Z0-9\-_./]+$/.test(path);
  }

  private validateRoute(route: string): boolean {
    // Must start with /
    if (!route.startsWith("/")) return false;
    // No double slashes
    if (route.includes("//")) return false;
    // Valid URL path characters
    return /^\/[a-zA-Z0-9\-_./]*$/.test(route);
  }

  private containsSuspiciousContent(text: string): boolean {
    const suspiciousPatterns = [
      /hack/i,
      /crack/i,
      /bypass/i,
      /exploit/i,
      /unlimited/i,
      /free.*premium/i,
      /cheat/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(text));
  }

  private isSuspiciousDomain(url: string): boolean {
    try {
      const { hostname } = new URL(url);
      const suspiciousTLDs = [".tk", ".ml", ".ga", ".cf"];
      const suspiciousKeywords = ["hack", "crack", "keygen", "warez"];

      return (
        suspiciousTLDs.some((tld) => hostname.endsWith(tld)) ||
        suspiciousKeywords.some((keyword) => hostname.includes(keyword))
      );
    } catch {
      return false;
    }
  }

  private isSuspiciousPackage(packageName: string): boolean {
    const suspicious = [
      "eval",
      "child_process",
      "fs-extra",
      "node-cmd",
      "shelljs",
      "node-ssh",
    ];

    return suspicious.some((s) => packageName.includes(s));
  }
}
