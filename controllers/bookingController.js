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

async function getBookingsByUserEmail(userEmail){
	return (await db.getData('/bookings'))
		.filter(booking => booking.userEmail === userEmail);
}

function isReserveTimeOverlapping(reservedTimestamp, bookingTimestamp){
	return (
		(
			bookingTimestamp >= reservedTimestamp &&
			bookingTimestamp <= reservedTimestamp + DEFAULT_BOOKING_DURATION
		) ||
		(
			bookingTimestamp <= reservedTimestamp &&
			bookingTimestamp >= reservedTimestamp - DEFAULT_BOOKING_DURATION
		)
	)
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



	const allMentorBookings = await getBookingsByMentorEmail(mentor.email);


	if(bookingTime){
		const bookingTimestamp = bookingTime.getTime()

		// Cancel if there is an overlapping booking reserved for user
		const allUserBookings = await getBookingsByUserEmail(req.authorizedUser.email);
		const userOverlappingBookings = allUserBookings
			.find(booking => {
				if(!booking.time) return false;
				const reservedStartTime = new Date(booking.time).getTime();
				return isReserveTimeOverlapping(reservedStartTime, bookingTime.getTime())
			})
		if(userOverlappingBookings) {
			return res.sendResponse(400, 'Sorry! You have another meeting around the same time');
		}

		// Cancel if there is an overlapping booking reserved for mentor
		const mentorOverlappingBooking = allMentorBookings
			.find(booking => {
				if(!booking.time) return false;
				const reservedStartTime = new Date(booking.time).getTime();
				return isReserveTimeOverlapping(reservedStartTime, bookingTime.getTime())
			})
		if(mentorOverlappingBooking) {
			let message = '';
			if(mentorOverlappingBooking.userEmail === req.authorizedUser.email){
				message = 'You have another meeting with this mentor around the same time';
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
