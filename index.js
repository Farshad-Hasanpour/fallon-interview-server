require('./config/process');
const db = require('./config/db');
const app = require('./config/app.js');

const server = app.listen(Number(process.env.NODE_APP_PORT), () => {
	console.log('Listening to requests on: \r\n\t' + 'http://localhost:' + process.env.NODE_APP_PORT);
});

server?.on('close', () => {
	process.exit(1);
});
