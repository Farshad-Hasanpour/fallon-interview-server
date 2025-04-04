const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async (req, res, next) => {
	try{
		const token = req.headers.authorization?.split(' ')[1];
		if(!token) return res.sendResponse(401, 'No token provided')
		const payload = await jwt.verify(token, process.env.NODE_APP_JWT_SECRET);
		if(!payload.email){
			return res.sendResponse(401, 'email does not exist in token payload.')
		}

		const authorizedUser = (await db.getData(`/users`))
			.find(user => user.email === payload.email);

		if(!authorizedUser){
			return res.sendResponse(401, 'Failed to authorize token')
		}

		req.authorizedUser = authorizedUser;

		next();
	}catch(err){
		res.send({
			message: err.message,
			success: false,
		})
	}
}
