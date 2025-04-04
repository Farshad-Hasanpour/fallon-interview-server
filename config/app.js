const express = require('express');
const app = express();

const {
	loadHelpers,
	loadControllers
} = require('./autoloader');

// package middlewares
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const sanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require("hpp");

const prefix = '/api/v1';

// Header security
app.use(helmet());

// Rate Limiter Middleware
app.use(prefix, rateLimit({
	max: 1000,
	windowMs: 1000 * 60 * 60,
	message: 'We have received too many requests from this IP. Please try after one hour',
}))

// Middleware to parse JSON
app.use(express.json());

// Sanitize to prevent nosql injection
app.use(sanitize());

// Prevent XSS attack
app.use(xssClean());

// prevent http parameter pollution
app.use(hpp({}));

// Cors middleware
const corsOptions = {
	origin: (origin, callback) => {
		// Allow localhost with any port
		if (!origin || /localhost:\d+/.test(origin)) {
			callback(null, true);
		} else {
			const allowedOrigins = process.env.NODE_APP_CORS?.split(',').map(item => item?.trim());
			for(let i = 0; i < allowedOrigins.length; i++) {
				if(allowedOrigins[i] === origin) {
					callback(null, true);
					return;
				}
			}
			callback(new Error('CORS policy: Access denied.'));
		}
	},
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],  // Specify allowed methods
	allowedHeaders: ['Content-Type', 'Authorization'],
}
app.use(cors(corsOptions))

// Helpers must be loaded before controllers
loadHelpers(app);
loadControllers(app, express, prefix);

module.exports = app;
