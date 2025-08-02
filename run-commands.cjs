const { spawn, execSync } = require('child_process');
const fs = require('fs');

console.log('🎯 Document Scanner Pro - Structured Text Feature');
console.log('==================================================\n');

const commands = {
  setup: () => {
    console.log('🔧 Setting up structured text feature...\n');
    execSync('node setup-structured-text.cjs', { stdio: 'inherit' });
  },

  test: () => {
    console.log('🧪 Testing structured text feature...\n');
    execSync('node test-structured-text.cjs', { stdio: 'inherit' });
  },

  'db-setup': () => {
    console.log('📊 Setting up database schema...\n');
    execSync('node add-structured-text-column.cjs', { stdio: 'inherit' });
  },

  worker: () => {
    console.log('👷 Starting document worker...\n');
    console.log('Press Ctrl+C to stop the worker\n');
    execSync('npm run worker', { stdio: 'inherit' });
  },

  dev: () => {
    console.log('🚀 Starting backend server...\n');
    console.log('Press Ctrl+C to stop the server\n');
    execSync('npm run dev', { stdio: 'inherit' });
  },

  frontend: () => {
    console.log('🎨 Starting frontend...\n');
    console.log('Press Ctrl+C to stop the frontend\n');
    execSync('npm run frontend', { stdio: 'inherit' });
  },

  all: () => {
    console.log('🚀 Starting all services (backend + frontend + worker)...\n');
    console.log('Press Ctrl+C to stop all services\n');
    execSync('npm run start:all', { stdio: 'inherit' });
  },

  'check-docs': () => {
    console.log('📋 Checking latest documents...\n');
    execSync('node check-latest-docs.cjs', { stdio: 'inherit' });
  },

  'check-files': () => {
    console.log('📁 Checking file paths...\n');
    execSync('node check-filepaths.js', { stdio: 'inherit' });
  },

  typecheck: () => {
    console.log('🔍 Type checking TypeScript files...\n');
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
  },

  help: () => {
    console.log('📖 Available Commands:');
    console.log('======================');
    console.log('node run-commands.cjs setup       - Set up structured text feature');
    console.log('node run-commands.cjs test        - Test the feature');
    console.log('node run-commands.cjs db-setup    - Set up database schema');
    console.log('node run-commands.cjs worker      - Start document worker');
    console.log('node run-commands.cjs dev         - Start backend server');
    console.log('node run-commands.cjs frontend    - Start frontend');
    console.log('node run-commands.cjs all         - Start all services');
    console.log('node run-commands.cjs check-docs  - Check latest documents');
    console.log('node run-commands.cjs check-files - Check file paths');
    console.log('node run-commands.cjs typecheck   - Type check TypeScript');
    console.log('node run-commands.cjs help        - Show this help\n');
    
    console.log('🎯 Quick Start:');
    console.log('===============');
    console.log('1. node run-commands.cjs setup');
    console.log('2. node run-commands.cjs test');
    console.log('3. node run-commands.cjs all');
    console.log('4. Open http://localhost:5000\n');
  }
};

// Get command from command line argument
const command = process.argv[2];

if (!command || !commands[command]) {
  console.log('❌ Invalid or missing command\n');
  commands.help();
  process.exit(1);
}

try {
  commands[command]();
} catch (error) {
  console.error(`❌ Error executing command '${command}':`, error.message);
  process.exit(1);
}
