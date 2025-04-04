const nodemailer = require('nodemailer');

module.exports = nodemailer.createTransport({
	host: process.env.NODE_APP_MAIL_HOST,
	port: Number(process.env.NODE_APP_MAIL_PORT),
	auth: {
		user: process.env.NODE_APP_MAIL_USERNAME,
		pass: process.env.NODE_APP_MAIL_PASSWORD,
	},
});
