#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 *
 * This script validates that all required environment variables are set
 * and provides helpful error messages for missing variables.
 */

const fs = require('fs');
const path = require('path');

// Define required environment variables
const REQUIRED_VARS = {
    // Supabase (critical)
    'NEXT_PUBLIC_SUPABASE_URL': {
        description: 'Supabase project URL',
        pattern: /^https:\/\/.*\.supabase\.co$/,
    },
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
        description: 'Supabase anonymous key',
        pattern: /^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/,
    },

    // Application (critical)
    'NEXT_PUBLIC_APP_URL': {
        description: 'Application URL',
        pattern: /^https?:\/\/.*/,
    },
    'NEXT_PUBLIC_APP_NAME': {
        description: 'Application name',
        pattern: /.+/,
    },

    // P2P (important)
    'NEXT_PUBLIC_TRYSTERO_APP_ID': {
        description: 'Trystero app ID',
        pattern: /.+/,
    },
};

// Define optional but recommended variables
const RECOMMENDED_VARS = {
    // AI Services
    'OPENROUTER_API_KEY': {
        description: 'OpenRouter API key for AI features',
        pattern: /^sk-or-v1/,
    },

    // Mapping
    'NEXT_PUBLIC_MAPTILER_KEY': {
        description: 'MapTiler API key for maps',
        pattern: /.+/,
    },

    // Analytics
    'NEXT_PUBLIC_SENTRY_DSN': {
        description: 'Sentry DSN for error tracking',
        pattern: /^https:\/\/.*@/,
    },

    // WebRTC
    'NEXT_PUBLIC_TURN_URL': {
        description: 'TURN server URL for WebRTC',
        pattern: /^turn:|stun:/,
    },
};

// Load environment file
function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Environment file not found: ${filePath}`);
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const envVars = {};

    content.split('\n').forEach(line => {
        const match = line.match(/^([^#]\w+)=?(.*)$/);
        if (match) {
            const [, key, value] = match;
            envVars[key] = value.trim();
        }
    });

    return envVars;
}

// Validate environment variables
function validateEnvVars(envVars, requiredVars, recommendedVars) {
    let hasErrors = false;
    let hasWarnings = false;

    console.log('\n🔍 Environment Variable Validation\n');
    console.log('=====================================\n');

    // Check required variables
    console.log('📋 Required Variables:');
    Object.entries(requiredVars).forEach(([key, config]) => {
        const value = envVars[key];

        if (!value || value === 'your_' + key.toLowerCase().replace(/_/g, '_') ||
            value === 'https://xxxxxxxxxxxxx.supabase.co' ||
            value === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...') {
            console.log(`❌ ${key}: ${config.description}`);
            console.log(`   Required but missing or using placeholder value`);
            hasErrors = true;
        } else if (config.pattern && !config.pattern.test(value)) {
            console.log(`❌ ${key}: ${config.description}`);
            console.log(`   Invalid format. Expected pattern: ${config.pattern}`);
            hasErrors = true;
        } else {
            console.log(`✅ ${key}: ${config.description}`);
        }
    });

    // Check recommended variables
    console.log('\n💡 Recommended Variables:');
    Object.entries(recommendedVars).forEach(([key, config]) => {
        const value = envVars[key];

        if (!value || value === 'your_' + key.toLowerCase().replace(/_/g, '_')) {
            console.log(`⚠️  ${key}: ${config.description}`);
            console.log(`   Recommended but not set`);
            hasWarnings = true;
        } else if (config.pattern && !config.pattern.test(value)) {
            console.log(`⚠️  ${key}: ${config.description}`);
            console.log(`   Invalid format. Expected pattern: ${config.pattern}`);
            hasWarnings = true;
        } else {
            console.log(`✅ ${key}: ${config.description}`);
        }
    });

    return {hasErrors, hasWarnings};
}

// Main execution
function main() {
    const envFile = process.argv[2] || '.env.local';
    const envPath = path.resolve(process.cwd(), envFile);

    console.log(`📁 Loading environment from: ${envFile}`);

    const envVars = loadEnvFile(envPath);
    const {hasErrors, hasWarnings} = validateEnvVars(envVars, REQUIRED_VARS, RECOMMENDED_VARS);

    console.log('\n=====================================');

    if (hasErrors) {
        console.log('❌ Validation failed! Please fix the required variables above.');
        process.exit(1);
    } else if (hasWarnings) {
        console.log('⚠️  Validation passed with warnings. Consider setting the recommended variables.');
        process.exit(0);
    } else {
        console.log('✅ All environment variables are properly configured!');
        process.exit(0);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {validateEnvVars, loadEnvFile};
