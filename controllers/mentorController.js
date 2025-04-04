const router = require("express").Router();
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const {getAllMentors} = require("../config/db.js");

router.get('/mentors', jwtMiddleware, async (req, res) => {
	const mentors = await getAllMentors();
	if(!Array.isArray(mentors)){
		return res.sendResponse(500, 'Something went wrong');
	}

	return res.sendResponse(200, '', {mentors});
})

module.exports = router;
