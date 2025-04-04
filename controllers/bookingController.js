const router = require("express").Router();
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const db = require("../config/db.js");

const DEFAULT_BOOKING_DURATION = 1000 * 60 * 30;

async function findMentorByEmail(email) {
	const allMentors = await db.getData(`/mentors`);
	if(!allMentors?.length) return null;
	return allMentors.find(mentor => mentor.email === email)
}

async function getBookingsByMentorEmail(mentorEmail){
	return (await db.getData('/bookings'))
		.filter(booking => booking.mentorEmail === mentorEmail);
}

router.post('/bookings', jwtMiddleware, async (req, res) => {
	const mentor = await findMentorByEmail(req.body.mentorEmail);
	if(!mentor) return res.sendResponse(404, 'Mentor not found')

	let bookingTime = null;
	if(req.body.time){
		try{
			bookingTime = new Date(req.body.time);
		} catch(error){
			return res.sendResponse(400, 'Incorrect time format');
		}
	}

	const allMentorBookings = getBookingsByMentorEmail(mentor.email);

	if(bookingTime){
		// Cancel if there is an overlapping booking reserved
		const bookingTimestamp = bookingTime.getTime()
		const overlappingBooking = allMentorBookings
			.find(booking => {
				if(!booking.time) return false;
				const reservedStartTime = new Date(booking.time).getTime();

				return (
					(
						bookingTimestamp >= reservedStartTime &&
						bookingTimestamp <= reservedStartTime + DEFAULT_BOOKING_DURATION
					) ||
					(
						bookingTimestamp <= reservedStartTime &&
						bookingTimestamp >= reservedStartTime - DEFAULT_BOOKING_DURATION
					)
				)
			})

		if(overlappingBooking) {
			let message = '';
			if(overlappingBooking.userEmail === req.authorizedUser.email){
				message = 'You have another booking set around the same time';
			}else {
				const reservedStartTime = new Date(overlappingBooking.time).getTime();
				const reservedFinishTime = reservedStartTime + DEFAULT_BOOKING_DURATION;
				message = `Sorry. This mentor is has another meeting from ${new Date(reservedStartTime).toLocaleString()} to ${new Date(reservedFinishTime).toLocaleString()}. Please try another time or another mentor.`;
			}

			return res.sendResponse(400, message)
		}
	} else {
		// Cancel if this user has another booking with the same mentor and no time is set
		const doesBookingAlreadyExist = allMentorBookings
			.find(booking => (
				booking.userEmail === req.authorizedUser.email &&
				!booking.time
			))

		if(doesBookingAlreadyExist){
			return res.sendResponse(400, 'You already have a meeting with the same mentor. We will contact you as soon as possible');
		}
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
