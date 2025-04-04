// node imports
const fs = require('fs');
const path = require('path');

// Automatically load and use all helper middlewares from helpers directory
function loadHelpers(app){
	const helpersPath = path.join(__dirname, '../helpers');
	fs.readdirSync(helpersPath).forEach((file) => {
		if (!file.endsWith('Helper.js')) return;
		const helperMiddleware = require(path.join(helpersPath, file));
		if (typeof helperMiddleware === 'function') {
			app.use(helperMiddleware); // Mounting all routes under /api/v1
		}else {
			console.error('Helper middleware doesn\'t exist: ' + file);
		}
	});
}

// Automatically load and use all route files from the controllers directory
function loadControllers(app, express, prefix){
	const controllersPath = path.join(__dirname, '../controllers');
	fs.readdirSync(controllersPath).forEach((file) => {
		if (!file.endsWith('Controller.js')) return;
		const route = require(path.join(controllersPath, file));
		if (typeof route === 'function') {
			app.use(prefix, getRoutesWrapper(express)(route)); // Mounting all routes under /api/v1
		}else {
			console.error('Router doesn\'t exist: ' + file);
		}
	});
}

// Customize all routes
function getRoutesWrapper(express){
	return (router) => {
		const newRouter = express.Router();

		// Iterate over all route methods (GET, POST, etc.)
		router.stack.forEach((layer) => {
			if(!layer.route) return;

			const { path, stack, methods } = layer.route;

			stack.forEach(handler => {
				Object.keys(methods).forEach(method => {
					newRouter[method](path, async (req, res, next) => {
						// Wrap each route handler with a try catch
						try {
							await handler.handle(req, res, next);
						} catch (error) {
							res.status(500).send({
								success: false,
								message: error.message,
								data: {}
							});
						}
					});
				});
			});
		});

		return newRouter;
	};
}

module.exports = {
	loadHelpers,
	loadControllers
}
