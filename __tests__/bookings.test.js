const request  = require('supertest');
require('../config/process');
const app = require('../config/app');

jest.mock('../config/db');
const {getAllUsers, getAllMentors, getAllBookings, addBooking} = require("../config/db.js");

// Set jwt token
const jwt = require('jsonwebtoken');
const loggedUserEmail = 'farshad.hasanpour96@gmail.com'
const token = jwt.sign({
	email: loggedUserEmail
}, process.env.NODE_APP_JWT_SECRET, {
	expiresIn: process.env.NODE_APP_JWT_REMEMBER_ME_EXPIRE
});

const prefix = '/api/v1'

const tomorrow = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));
const tenMinAfterTomorrow = new Date(tomorrow.getTime() + (10 * 60 * 1000));
const tenMinBeforeTomorrow = new Date(tomorrow.getTime() - (10 * 60 * 1000));

function mockAction(databaseAction, data){
	databaseAction.mockImplementation(jest.fn().mockReturnValue(data))
}

function book(data){
	return request(app).post(`${prefix}/bookings`)
		.send({...data, noEmail: true})
		.set('Authorization', `Bearer ${token}`)
}

describe('POST /bookings', () => {
	beforeEach(() => {
		getAllUsers.mockClear();
		getAllMentors.mockClear();
		getAllBookings.mockClear();
		addBooking.mockClear();
	});

	mockAction(getAllUsers, [
		{ email: loggedUserEmail },
		{ email: 'milad@akbari.com' }
	])
	mockAction(getAllMentors, [
		{ email: 'john@carpet.com' },
		{ email: 'sara@johnson.com'}
	])

	it('must fail when req.body.mentorEmail is not set', async () => {
		const res = await book({time: null});
		expect(res.body.message).toBe('Mentor not found');
	});

	it('must fail when mentor is not found', async () => {
		const res = await book({mentorEmail: 'sdfgf@sdffg.com'});
		expect(res.body.message).toBe('Mentor not found');
	});

	it('must fail when req.body.time is not formatted correctly', async () => {
		const res = await book({mentorEmail: 'john@carpet.com', time: 'd3c3'});
		expect(res.body.message).toBe('Incorrect time format');
	});

	it('Must fail when req.body.time is too soon', async () => {
		const res = await book({mentorEmail: 'john@carpet.com', time: '2020-04-04T16:55:39.442Z'});
		expect(res.body.message).toBe('Too soon! please select another time');
	})

	describe('When booking has no time (as soon as possible)', () => {
		it('Must create when user has not booked with that mentor yet', async () => {
			mockAction(getAllBookings, [])

			const res = await book({ mentorEmail: 'john@carpet.com' });
			expect(res.status).toBe(201);
		})
		it('Must fail when user has already booked with that mentor', async () => {
			mockAction(getAllBookings, [{
				mentorEmail: 'john@carpet.com',
				userEmail: loggedUserEmail
			}])

			const res = await book({ mentorEmail: 'john@carpet.com' });
			expect(res.body.message).toBe('You already have a meeting with the same mentor and no time set. We will contact you as soon as possible');
		})
	})

	describe('When booking has specific start time (each meeting takes 30 minutes)', () => {
		describe('Must fail when user has another meeting with overlapping times', () => {

			const mockBookings = () => mockAction(getAllBookings, [
				{ mentorEmail: 'sara@johnson.com', userEmail: loggedUserEmail, time: tomorrow.toISOString() },
			])

			it('When overlapping time is greater than booking time', async () => {
				mockBookings();

				const res = await book({ mentorEmail: 'john@carpet.com', time: tenMinAfterTomorrow.toISOString() });
				expect(
					res.body.message.startsWith('Sorry! You have another meeting around the same time from ')
				).toBe(true);
			})

			it('When overlapping time is lower than booking time', async () => {
				mockBookings();

				const res = await book({ mentorEmail: 'john@carpet.com', time: tenMinBeforeTomorrow.toISOString() });
				expect(
					res.body.message.startsWith('Sorry! You have another meeting around the same time from ')
				).toBe(true);
			})
		})

		describe('Must fail when mentor has another meeting with overlapping times', () => {
			const markBookings = () => mockAction(getAllBookings, [
				{ mentorEmail: 'john@carpet.com', userEmail: 'test@example.com', time: tomorrow.toISOString() },
			])

			it('When overlapping time is greater than booking time', async () => {
				markBookings()

				const res = await book({ mentorEmail: 'john@carpet.com', time: tenMinAfterTomorrow.toISOString() });
				expect(
					res.body.message.startsWith('Sorry. This mentor has another meeting from ')
				).toBe(true);
			})

			it('When overlapping times lower than booking time', async () => {
				markBookings()

				const res = await book({ mentorEmail: 'john@carpet.com', time: tenMinBeforeTomorrow.toISOString() });
				expect(
					res.body.message.startsWith('Sorry. This mentor has another meeting from ')
				).toBe(true);
			})
		})

		it('Must create booking when both user and mentor are free around that time', async () => {
			mockAction(getAllBookings, [{
				mentorEmail: 'john@carpet.com',
				userEmail: loggedUserEmail,
				time: new Date().toISOString(),
			}])

			const res = await book({ mentorEmail: 'john@carpet.com', time: tomorrow.toISOString() });
			expect(
				res.status
			).toBe(201);
		});
	})
});
