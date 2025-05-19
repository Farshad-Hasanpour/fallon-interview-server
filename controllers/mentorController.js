const router = require("express").Router();
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const {getAllMentors} = require("../config/db.js");

router.get('/mentors', jwtMiddleware, async (req, res) => {
	// payment params
	const userEmail = req.authorizedUser.email;
	const mentors = JSON.parse(JSON.stringify(await getAllMentors()))
	if(!Array.isArray(mentors)){
		return res.sendResponse(500, 'Something went wrong');
	}

	mentors.forEach(mentor => {
		mentor.paymentLink = `https://example.com/?userEmail=${userEmail}&mentorEmail=${mentor.email}`;
	})

	return res.sendResponse(200, '', {mentors});
})

module.exports = router;
