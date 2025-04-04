const router = require("express").Router();
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const db = require("../config/db.js");

async function findMentorByEmail(email) {
	const allMentors = await db.getData(`/mentors`);
	if(!allMentors?.length) return null;
	return allMentors.find(mentor => mentor.email === email)
}

router.post('/bookings', jwtMiddleware, async (req, res) => {
	const mentor = await findMentorByEmail(req.body.mentorEmail);
	if(!mentor) return res.sendResponse(404, 'Mentor not found')

	let bookingTime = null;
	if(req.body.time){
		try{
			bookingTime = new Date(req.body.time).toISOString();
		} catch(error){
			return res.sendResponse(400, 'Incorrect time format');
		}
	}

	const allBookings = await db.getData('/bookings');

	// If time exists then check to see if another booking with same mentor and time exists
	if(bookingTime){
		const isMentorBusy = allBookings
			.find(booking => (
				booking.mentorEmail === mentor.email &&
				booking.time === bookingTime // null not possible
			))
		if(isMentorBusy) return res.sendResponse(400, 'Sorry. Our mentor is busy at this time.')
	}

	const doesBookingAlreadyExist = allBookings
		.find(booking => (
			booking.userEmail === req.authorizedUser.email &&
			booking.mentorEmail === mentor.email &&
			booking.time === bookingTime // null possible
		))
	if(doesBookingAlreadyExist){
		return res.sendResponse(400, 'You already have a booking with the same mentor and at the same time');
	}


	const newBooking = {
		userEmail: req.authorizedUser.email,
		mentorEmail: mentor.email,
		time: bookingTime,
	}
	await db.push('/mentors[]', newBooking);

	return res.sendResponse(201, '', {
		mentor,
		time: bookingTime,
	});
})

module.exports = router;
