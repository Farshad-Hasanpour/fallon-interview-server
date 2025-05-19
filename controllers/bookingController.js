const router = require("express").Router();
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const {getAllMentors, getAllBookings, addBooking} = require("../config/db.js");
const mailer = require("../config/mail");

// TODO: create end time for bookings
const gapByMinute = 30;
const DEFAULT_BOOKING_DURATION = 1000 * 60 * gapByMinute;

async function findMentorByEmail(email) {
	const allMentors = await getAllMentors();
	if(!allMentors?.length) return null;
	return allMentors.find(mentor => mentor.email === email)
}

async function getBookingsByMentorEmail(mentorEmail){
	return (await getAllBookings())?.filter(booking =>
		booking.mentorEmail === mentorEmail
	) || [];
}

async function getBookingsByUserEmail(userEmail){
	return (await getAllBookings())?.filter(booking =>
		booking.userEmail === userEmail
	) || [];
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

function findOverlappingBookingInList(bookingList, bookingTimestamp){
	const overlappingBookingInList = bookingList
		.find(booking => {
			if(!booking.time) return false;
			const reservedStartTime = new Date(booking.time).getTime();
			return isReserveTimeOverlapping(reservedStartTime, bookingTimestamp)
		})
	if(overlappingBookingInList) {
		const reservedStartTime = new Date(overlappingBookingInList.time).getTime();
		const reservedFinishTime = reservedStartTime + DEFAULT_BOOKING_DURATION;

		return {
			start:  new Date(reservedStartTime).toLocaleString(),
			end: new Date(reservedFinishTime).toLocaleString(),
		}
	}
	return null;
}

function sendBookingEmail(mentor, userEmail){
	const mailText = `You booked a meeting with ${mentor.name}, successfully.`
	return mailer.sendMail({
		from: '"Fallon" <info@fallon.email>', // sender address
		to: userEmail, // list of receivers
		subject: "Meeting Booked",
		text: mailText, // plain text body
		html: `<p>${mailText}</p>`, // html body
	}, (error, info) => {
		if(info?.messageId) {
			console.log('Email sent:', info.messageId);
		} else {
			console.log('Count not send Email')
		}
	});
}

router.get('/bookings', jwtMiddleware, async (req, res) => {
	const myBookings = JSON.parse(JSON.stringify(
		await getBookingsByUserEmail(req.authorizedUser.email)
	));
	const now = new Date().getTime();

	const myFutureBookings = await Promise.all(
		myBookings
			// filter future meetings
			.filter(booking => !booking.time || new Date(booking.time).getTime() >= now)
			// populate mentor
			.map(async (booking) => {
				delete booking.userEmail;
				booking.mentor = JSON.parse(JSON.stringify(await findMentorByEmail(booking.mentorEmail)));
				delete booking.mentorEmail;
				return booking
			})
	)

	return res.sendResponse(200, '', {bookings: myFutureBookings});
})

router.post('/bookings', jwtMiddleware, async (req, res) => {
	// mentorEmail validation
	const mentor = await findMentorByEmail(req.body.mentorEmail);
	if(!mentor) return res.sendResponse(404, 'Mentor not found')

	// time validation
	let bookingTime = null;
	if(req.body.time){
		bookingTime = new Date(req.body.time);
		if(isNaN(bookingTime)){
			return res.sendResponse(400, 'Incorrect time format');
		}
		// must be bigger than min acceptable time
		if(bookingTime.getTime() <= new Date().getTime() + DEFAULT_BOOKING_DURATION){
			return res.sendResponse(400, 'Too soon! please select another time');
		}
	}

	// TODO: specify limited times for client using a different endpoint
	const allMentorBookings = await getBookingsByMentorEmail(mentor.email);
	if(bookingTime){
		const bookingTimestamp = bookingTime.getTime()

		// Cancel if there is an overlapping booking reserved for user
		const allUserBookings = await getBookingsByUserEmail(req.authorizedUser.email);
		const userOverlappingBookings = findOverlappingBookingInList(
			allUserBookings,
			bookingTimestamp
		)
		if(userOverlappingBookings) {
			const message = `Sorry! You have another meeting around the same time from ${userOverlappingBookings.start} to ${userOverlappingBookings.end}. Please try another time with ${gapByMinute} minutes gap.`;
			return res.sendResponse(400, message)
		}

		// Cancel if there is an overlapping booking reserved for mentor
		const mentorOverlappingBooking = findOverlappingBookingInList(
			allMentorBookings,
			bookingTimestamp
		)
		if(mentorOverlappingBooking) {
			const message = `Sorry. This mentor has another meeting from ${mentorOverlappingBooking.start} to ${mentorOverlappingBooking.end}. Please try another time with ${gapByMinute} minutes gap or try another mentor.`;
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
			return res.sendResponse(400, 'You already have a meeting with the same mentor and no time set. We will contact you as soon as possible');
		}
	}

	// push to database
	const newBooking = {
		userEmail: req.authorizedUser.email,
		mentorEmail: mentor.email,
		time: bookingTime,
	}
	await addBooking(newBooking);

	// Send email on success
	!req.body.noEmail && sendBookingEmail(mentor, req.authorizedUser.email)

	return res.sendResponse(201, '', {
		mentor,
		time: bookingTime,
	});
})

module.exports = router;
