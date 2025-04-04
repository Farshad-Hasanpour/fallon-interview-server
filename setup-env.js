const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const examplePath = path.resolve(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
	fs.copyFileSync(examplePath, envPath);
	console.log('✅ .env created from .env.example');
} else {
	console.log('📦 .env is setup');
}
