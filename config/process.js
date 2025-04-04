require('dotenv').config();

process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
	process.exit(1);
});

process.on('unhandledRejection', (reason) => {
	console.error('Unhandled Rejection:', reason);
	process.exit(1);
});

if(!Number(process.env.NODE_APP_PORT)){
	throw new Error('NODE_APP_PORT env variable is required');
}

if(!process.env.NODE_APP_JWT_SECRET){
	throw new Error('NODE_APP_JWT_SECRET env variable is required');
}

if(!process.env.NODE_APP_JWT_REMEMBER_ME_EXPIRE || !process.env.NODE_APP_JWT_EXPIRE){
	throw new Error('NODE_APP_JWT_EXPIRE & NODE_APP_JWT_REMEMBER_ME_EXPIRE env variables are required');
}
