#!/usr/bin/env node

/**
 * Development Setup Checker
 *
 * Checks for common development environment issues and provides fixes.
 * Run this if you encounter SSL, CSP, or font loading errors.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n${'='.repeat(60)}`),
};

async function checkEnvironmentVariables() {
  log.section('Checking Environment Variables');

  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    log.error('.env.local file not found!');
    log.info('Create .env.local with the following variables:');
    console.log(`
${colors.yellow}NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_STREAM_API_KEY=xxx
STREAM_SECRET=xxx${colors.reset}
    `);
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_STREAM_API_KEY'
  ];

  let allPresent = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      log.success(`${varName} found`);
    } else {
      log.error(`${varName} missing`);
      allPresent = false;
    }
  });

  return allPresent;
}

async function checkNodeVersion() {
  log.section('Checking Node.js Version');

  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const majorVersion = parseInt(version.replace('v', '').split('.')[0]);

    if (majorVersion >= 18) {
      log.success(`Node.js ${version} (✓ >= 18.0.0)`);
      return true;
    } else {
      log.error(`Node.js ${version} (✗ < 18.0.0)`);
      log.warn('Please upgrade to Node.js 18 or higher');
      return false;
    }
  } catch (error) {
    log.error('Could not determine Node.js version');
    return false;
  }
}

async function checkDependencies() {
  log.section('Checking Dependencies');

  const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
  const packageLockExists = fs.existsSync(path.join(process.cwd(), 'package-lock.json'));

  if (!nodeModulesExists) {
    log.error('node_modules not found');
    log.info('Run: npm install');
    return false;
  }

  log.success('node_modules found');

  if (!packageLockExists) {
    log.warn('package-lock.json not found (expected for npm projects)');
  } else {
    log.success('package-lock.json found');
  }

  return nodeModulesExists;
}

async function checkNetworkAccess() {
  log.section('Checking Network Configuration');

  try {
    const { stdout } = await execAsync('ifconfig 2>/dev/null || ipconfig 2>/dev/null || ip addr 2>/dev/null');

    // Try to find local IP addresses
    const ipMatches = stdout.match(/inet (\d+\.\d+\.\d+\.\d+)/g);

    if (ipMatches) {
      const ips = ipMatches
        .map(match => match.replace('inet ', ''))
        .filter(ip => !ip.startsWith('127.'));

      if (ips.length > 0) {
        log.success('Local network IP addresses found:');
        ips.forEach(ip => {
          console.log(`  ${colors.green}→${colors.reset} http://${ip}:3000`);
        });
        log.warn('Always use http://, not https://, to avoid SSL errors');
      }
    }
  } catch (error) {
    log.warn('Could not determine network configuration');
  }
}

function checkSSLConfiguration() {
  log.section('Checking SSL/HTTPS Configuration');

  const serverJsExists = fs.existsSync(path.join(process.cwd(), 'server.js'));
  const certDirExists = fs.existsSync(path.join(process.cwd(), '.cert'));

  if (serverJsExists && certDirExists) {
    log.success('HTTPS development server configured');
    log.info('Run: npm run dev:https (if script exists)');
  } else if (serverJsExists || certDirExists) {
    log.warn('Partial HTTPS setup detected');
    log.info('See docs/DEVELOPMENT_SETUP.md for complete HTTPS setup');
  } else {
    log.info('No HTTPS setup (using HTTP is recommended for development)');
    log.info('Access via: http://localhost:3000');
    log.warn('Do NOT use: https://localhost:3000 (will cause ERR_SSL_PROTOCOL_ERROR)');
  }
}

function checkNextConfig() {
  log.section('Checking Next.js Configuration');

  const configPath = path.join(process.cwd(), 'next.config.ts');

  if (!fs.existsSync(configPath)) {
    log.error('next.config.ts not found!');
    return false;
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');

  // Check for environment-aware CSP
  if (configContent.includes('isDevelopment') && configContent.includes('isProduction')) {
    log.success('Environment-aware security headers configured');
  } else {
    log.warn('Security headers may not be environment-aware');
  }

  // Check CSP font sources
  if (configContent.includes('font-src')) {
    log.success('CSP font-src directive found');

    if (configContent.includes('fonts.gstatic.com') && configContent.includes('fonts.googleapis.com')) {
      log.success('Google Fonts allowed in CSP');
    }

    if (configContent.includes('r2cdn.perplexity.ai')) {
      log.success('Perplexity AI fonts allowed in CSP');
    }
  } else {
    log.error('CSP font-src directive missing');
  }

  // Check for upgrade-insecure-requests handling
  if (configContent.includes('upgrade-insecure-requests') && configContent.includes('isProduction')) {
    log.success('upgrade-insecure-requests only enabled in production (correct)');
  } else if (configContent.includes('upgrade-insecure-requests')) {
    log.warn('upgrade-insecure-requests may be enabled in development (can cause issues)');
  }

  return true;
}

function checkFontOptimization() {
  log.section('Checking Font Optimization');

  const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');

  if (!fs.existsSync(layoutPath)) {
    log.error('app/layout.tsx not found!');
    return false;
  }

  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  const optimizations = {
    'display: "swap"': 'Font display optimization',
    'preload: true': 'Font preloading',
    'adjustFontFallback: true': 'Fallback font metrics',
  };

  Object.entries(optimizations).forEach(([check, description]) => {
    if (layoutContent.includes(check)) {
      log.success(`${description} enabled`);
    } else {
      log.warn(`${description} not enabled`);
    }
  });

  return true;
}

function printSummary() {
  log.section('Summary & Quick Fixes');

  console.log(`
${colors.yellow}Common Issues:${colors.reset}

1. ${colors.red}ERR_SSL_PROTOCOL_ERROR${colors.reset}
   ${colors.green}Fix:${colors.reset} Use http://localhost:3000 instead of https://

2. ${colors.red}CSP Font Violations${colors.reset}
   ${colors.green}Fix:${colors.reset} Already fixed in next.config.ts

3. ${colors.red}"Font preloaded but not used"${colors.reset}
   ${colors.green}Fix:${colors.reset} Expected behavior, can be ignored

4. ${colors.red}Dependencies missing${colors.reset}
   ${colors.green}Fix:${colors.reset} Run: npm install

${colors.yellow}Quick Start:${colors.reset}

  ${colors.cyan}npm install${colors.reset}          # Install dependencies
  ${colors.cyan}npm run dev${colors.reset}           # Start development server (HTTP)
  ${colors.cyan}npm run type-check${colors.reset}    # Check TypeScript
  ${colors.cyan}npm run build${colors.reset}         # Test production build

${colors.yellow}Access the app:${colors.reset}

  ${colors.green}✓${colors.reset} http://localhost:3000
  ${colors.green}✓${colors.reset} http://192.168.x.x:3000
  ${colors.red}✗${colors.reset} https://localhost:3000 (will cause SSL errors)

${colors.blue}For more information, see:${colors.reset} docs/DEVELOPMENT_SETUP.md
  `);
}

async function main() {
  console.log(`
${colors.magenta}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     FindYourKing Development Setup Checker                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
  `);

  await checkNodeVersion();
  await checkDependencies();
  await checkEnvironmentVariables();
  checkNextConfig();
  checkFontOptimization();
  checkSSLConfiguration();
  await checkNetworkAccess();
  printSummary();

  console.log(`\n${colors.green}Setup check complete!${colors.reset}\n`);
}

// Run the checker
main().catch(error => {
  console.error(`${colors.red}Error running setup checker:${colors.reset}`, error);
  process.exit(1);
});
