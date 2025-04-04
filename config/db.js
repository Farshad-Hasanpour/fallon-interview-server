const { JsonDB, Config } = require('node-json-db');

if(!process.env.NODE_APP_DB_NAME){
	throw new Error('NODE_APP_DB_NAME env variable is required');
}

module.exports = new JsonDB(new Config(
	process.env.NODE_APP_DB_NAME,
	true,
	true,
	'/'
));
