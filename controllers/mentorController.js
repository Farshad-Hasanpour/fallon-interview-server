const router = require("express").Router();
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const db = require("../config/db.js");

router.get('/mentors', jwtMiddleware, async (req, res) => {
	const mentors = await db.getData("mentors");
	if(!Array.isArray(mentors)){
		return res.sendResponse(200, '', {mentors: []});
	}
	return res.sendResponse(200, '', {mentors});
})

module.exports = router;
