import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';
import { PluginManifest } from '@/types/plugin';
import { PluginSecurityScanner } from './plugin-security-scanner';

export interface ExtractResult {
  success: boolean;
  message: string;
  manifest?: PluginManifest;
  pluginId?: string;
  securityReport?: string;
  securityScore?: number;
}

export class PluginExtractor {
  private pluginsDir: string;
  private tempDir: string;

  constructor() {
    this.pluginsDir = path.join(process.cwd(), 'plugins');
    this.tempDir = path.join(process.cwd(), '.temp');
  }

  async extractPlugin(buffer: Buffer, filename: string): Promise<ExtractResult> {
    const tempExtractPath = path.join(this.tempDir, `plugin-${Date.now()}`);
    
    try {
      // Ensure directories exist
      await this.ensureDirectories();
      
      // Create temp extraction directory
      await fs.mkdir(tempExtractPath, { recursive: true });
      
      // Extract ZIP to temp directory
      await this.extractZip(buffer, tempExtractPath);
      
      // Check if the ZIP has a single root folder (common case)
      const actualPluginPath = await this.findPluginRoot(tempExtractPath);
      
      // Validate plugin structure
      const validation = await this.validatePlugin(actualPluginPath);
      if (!validation.success) {
        await this.cleanup(tempExtractPath);
        return validation;
      }
      
      // Run security scan
      const scanner = new PluginSecurityScanner();
      const securityScan = await scanner.scanPlugin(actualPluginPath);
      const securityReport = await scanner.generateSecurityReport(securityScan);
      
      if (!securityScan.passed) {
        await this.cleanup(tempExtractPath);
        return {
          success: false,
          message: `Plugin failed security scan (score: ${securityScan.score}/100). ${securityScan.recommendations[0] || 'Review security report for details.'}`,
          securityReport,
          securityScore: securityScan.score
        };
      }
      
      const manifest = validation.manifest!;
      
      // Check if plugin already exists
      const pluginPath = path.join(this.pluginsDir, manifest.id);
      const exists = await this.checkExists(pluginPath);
      
      if (exists) {
        await this.cleanup(tempExtractPath);
        return {
          success: false,
          message: `Plugin "${manifest.name}" (${manifest.id}) already exists. Please remove it first or update the version.`,
        };
      }
      
      // Move plugin to final location
      // If the plugin was in a subfolder, move that subfolder
      if (actualPluginPath !== tempExtractPath) {
        await fs.rename(actualPluginPath, pluginPath);
        await this.cleanup(tempExtractPath);
      } else {
        await fs.rename(tempExtractPath, pluginPath);
      }
      
      return {
        success: true,
        message: `Successfully installed plugin "${manifest.name}" v${manifest.version} (Security Score: ${securityScan.score}/100)`,
        manifest,
        pluginId: manifest.id,
        securityReport,
        securityScore: securityScan.score
      };
      
    } catch (error) {
      // Clean up on error
      await this.cleanup(tempExtractPath);
      
      console.error('Plugin extraction failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to extract plugin',
      };
    }
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.pluginsDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  private async extractZip(buffer: Buffer, targetPath: string): Promise<void> {
    try {
      const zip = new AdmZip(buffer);
      
      // Log ZIP contents for debugging
      const entries = zip.getEntries();
      console.log('ZIP contains', entries.length, 'entries:');
      entries.forEach(entry => {
        console.log(' -', entry.entryName, entry.isDirectory ? '(directory)' : `(${entry.header.size} bytes)`);
      });
      
      zip.extractAllTo(targetPath, true);
      console.log('Extracted to:', targetPath);
    } catch (error) {
      throw new Error(`Failed to extract ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async findPluginRoot(extractPath: string): Promise<string> {
    // Check if manifest.json exists at the root
    const rootManifest = path.join(extractPath, 'manifest.json');
    if (await this.checkExists(rootManifest)) {
      return extractPath;
    }

    // Check if there's a single directory containing the plugin
    const entries = await fs.readdir(extractPath, { withFileTypes: true });
    const directories = entries.filter(entry => entry.isDirectory());
    
    // If there's exactly one directory, check if it contains manifest.json
    if (directories.length === 1) {
      const subDir = path.join(extractPath, directories[0].name);
      const subManifest = path.join(subDir, 'manifest.json');
      
      if (await this.checkExists(subManifest)) {
        console.log(`Found plugin in subdirectory: ${directories[0].name}`);
        return subDir;
      }
    }
    
    // If we have multiple directories, look for one that has manifest.json
    for (const dir of directories) {
      const subDir = path.join(extractPath, dir.name);
      const subManifest = path.join(subDir, 'manifest.json');
      
      if (await this.checkExists(subManifest)) {
        console.log(`Found plugin in subdirectory: ${dir.name}`);
        return subDir;
      }
    }
    
    // Default to the extract path if no manifest found in subdirectories
    return extractPath;
  }

  private async validatePlugin(pluginPath: string): Promise<ExtractResult> {
    try {
      // Log the path we're checking
      console.log('Validating plugin at path:', pluginPath);
      
      // List all files in the plugin directory for debugging
      try {
        const files = await fs.readdir(pluginPath);
        console.log('Files in plugin directory:', files);
      } catch (error) {
        console.error('Could not list files in plugin directory:', error);
      }
      
      // Check for manifest.json
      const manifestPath = path.join(pluginPath, 'manifest.json');
      const manifestExists = await this.checkExists(manifestPath);
      
      if (!manifestExists) {
        return {
          success: false,
          message: `Invalid plugin: manifest.json not found at ${manifestPath}`,
        };
      }
      
      // Read and parse manifest
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);
      
      // Validate required fields
      if (!manifest.id) {
        return {
          success: false,
          message: 'Invalid plugin: manifest.id is required',
        };
      }
      
      if (!manifest.name) {
        return {
          success: false,
          message: 'Invalid plugin: manifest.name is required',
        };
      }
      
      if (!manifest.version) {
        return {
          success: false,
          message: 'Invalid plugin: manifest.version is required',
        };
      }
      
      // Validate plugin ID format (alphanumeric with hyphens)
      if (!/^[a-z0-9-]+$/.test(manifest.id)) {
        return {
          success: false,
          message: 'Invalid plugin ID: must contain only lowercase letters, numbers, and hyphens',
        };
      }
      
      // Check for main entry file
      const mainFile = manifest.main || 'index.tsx';
      const mainPath = path.join(pluginPath, mainFile);
      const mainExists = await this.checkExists(mainPath);
      
      if (!mainExists) {
        return {
          success: false,
          message: `Invalid plugin: main entry file "${mainFile}" not found`,
        };
      }
      
      // Check for required component exports
      const componentsDir = path.join(pluginPath, 'components');
      const componentsExist = await this.checkExists(componentsDir);
      
      if (!componentsExist) {
        return {
          success: false,
          message: 'Invalid plugin: components directory not found',
        };
      }
      
      return {
        success: true,
        message: 'Plugin validation successful',
        manifest,
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Plugin validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async checkExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async cleanup(path: string): Promise<void> {
    try {
      await fs.rm(path, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to clean up temp directory:', error);
    }
  }

  async removePlugin(pluginId: string): Promise<ExtractResult> {
    try {
      const pluginPath = path.join(this.pluginsDir, pluginId);
      const exists = await this.checkExists(pluginPath);
      
      if (!exists) {
        return {
          success: false,
          message: `Plugin "${pluginId}" not found`,
        };
      }
      
      // Read manifest before deletion for the response
      const manifestPath = path.join(pluginPath, 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);
      
      // Remove the plugin directory
      await fs.rm(pluginPath, { recursive: true, force: true });
      
      return {
        success: true,
        message: `Successfully removed plugin "${manifest.name}"`,
        manifest,
        pluginId,
      };
      
    } catch (error) {
      console.error('Failed to remove plugin:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove plugin',
      };
    }
  }
}