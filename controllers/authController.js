const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = require("express").Router();
const db = require("../config/db");

async function signJWT(email, rememberMe){
	return jwt.sign({
		email
	}, process.env.NODE_APP_JWT_SECRET, {
		expiresIn: rememberMe
			? process.env.NODE_APP_JWT_REMEMBER_ME_EXPIRE
			: process.env.NODE_APP_JWT_EXPIRE
	})
}

router.post("/auth/signup", async (req, res) => {
	// Cancel if user already exists
	const existingUser = (await db.getData(`/users`))
		.find(user => user.email === req.body.email)
	if(existingUser){
		return res.sendResponse(400, 'User already exists.')
	}

	// hash password
	req.body.password = await bcrypt.hash(req.body.password, 10);

	// save user
	const newUser = {
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
	};
	await db.push('/users', newUser);

	// assign a jwt
	const token = await signJWT(newUser.email, req.body.rememberMe)

	return res.sendResponse(201, 'User created successfully', {token})
})

router.post('/auth/login', async (req, res) => {
	//Check if user exists
	const existingUser = (await db.getData(`/users`))
		.find(user => user.email === req.body.email)
	if(!existingUser) return res.sendResponse(404, 'User does not exist.')

	// Check if password is correct
	const isPasswordCorrect = await bcrypt.compare(req.body.password, existingUser.password)
	if(!isPasswordCorrect) return res.sendResponse(401, 'Email or password is incorrect.')

	// assign a jwt
	const token = await signJWT(existingUser.email, req.body.rememberMe)

	return res.sendResponse(200, 'Logged-in successfully', {token})
})

module.exports = router;
