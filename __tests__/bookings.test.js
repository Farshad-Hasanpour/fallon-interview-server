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

function book(data){
	return request(app).post(`${prefix}/bookings`)
		.send(data)
		.set('Authorization', `Bearer ${token}`)
}

describe('POST /bookings', () => {
	beforeEach(() => {
		getAllUsers.mockClear();
		getAllMentors.mockClear();
		getAllBookings.mockClear();
		addBooking.mockClear();
	});

	getAllUsers.mockImplementation(jest.fn().mockReturnValue([
		{ email: loggedUserEmail },
		{ email: 'john@carpet.com' }
	]));

	it('must fail when req.body.mentorEmail is not set', async () => {
		const res = await book({time: null});
		expect(res.body.message).toBe('Mentor not found');
	});

	it('must fail when mentor is not found', async () => {
		getAllMentors.mockImplementation(jest.fn().mockReturnValue([
			{ email: 'john@carpet.com' }
		]));

		const res = await book({mentorEmail: 'sdfgf@sdffg.com'});
		expect(res.body.message).toBe('Mentor not found');
	});

	it('must fail when req.body.time is not formatted correctly', async () => {
		getAllMentors.mockImplementation(jest.fn().mockReturnValue([
			{ email: 'john@carpet.com' }
		]));
		const res = await book({mentorEmail: 'john@carpet.com', time: 'd3c3'});
		expect(res.body.message).toBe('Incorrect time format');
	});

	describe('When booking has no time (as soon as possible)', () => {
		getAllMentors.mockImplementation(jest.fn().mockReturnValue([
			{ email: 'john@carpet.com' }
		]));

		it('Must create when user has not booked with that mentor yet', async () => {
			getAllBookings.mockImplementation(jest.fn().mockReturnValue([]));

			const res = await book({ mentorEmail: 'john@carpet.com' });
			expect(res.status).toBe(201);
		})
		it('Must fail when user has already booked with that mentor', async () => {
			getAllBookings.mockImplementation(jest.fn().mockReturnValue([{
				mentorEmail: 'john@carpet.com',
				userEmail: loggedUserEmail
			}]));

			const res = await book({ mentorEmail: 'john@carpet.com' });
			expect(res.body.message).toBe('You already have a meeting with the same mentor and no time set. We will contact you as soon as possible');
		})
	})

	describe('When booking has specific start time (each meeting takes 30 minutes)', () => {
		getAllMentors.mockImplementation(jest.fn().mockReturnValue([
			{ email: 'john@carpet.com' },
			{ email: 'sara@johnson.com'}
		]));

		it('Must fail when user has another meeting with overlapping times greater than booking time', async () => {
			getAllBookings.mockImplementation(jest.fn().mockReturnValue([
				{ mentorEmail: 'sara@johnson.com', userEmail: loggedUserEmail, time: '2025-04-04T16:55:39.442Z' },
			]));

			const res = await book({ mentorEmail: 'john@carpet.com', time: '2025-04-04T17:00:39.442Z' });
			expect(
				res.body.message.startsWith('Sorry! You have another meeting around the same time from ')
			).toBe(true);
		})

		it('Must fail when user has another meeting with overlapping times lower than booking time', async () => {
			getAllBookings.mockImplementation(jest.fn().mockReturnValue([
				{ mentorEmail: 'sara@johnson.com', userEmail: loggedUserEmail, time: '2025-04-04T16:55:39.442Z' },
			]));

			const res = await book({ mentorEmail: 'john@carpet.com', time: '2025-04-04T16:50:39.442Z' });
			expect(
				res.body.message.startsWith('Sorry! You have another meeting around the same time from ')
			).toBe(true);
		})

		it('Must fail when mentor has another meeting with overlapping times greater than booking time', async () => {
			getAllBookings.mockImplementation(jest.fn().mockReturnValue([
				{ mentorEmail: 'john@carpet.com', userEmail: 'test@example.com', time: '2025-04-04T16:55:39.442Z' },
			]));

			const res = await book({ mentorEmail: 'john@carpet.com', time: '2025-04-04T17:00:39.442Z' });
			console.log(res.body);
			expect(
				res.body.message.startsWith('Sorry. This mentor has another meeting from ')
			).toBe(true);
		})

		it('Must fail when mentor has another meeting with overlapping times lower than booking time', async () => {
			getAllBookings.mockImplementation(jest.fn().mockReturnValue([
				{ mentorEmail: 'john@carpet.com', userEmail: 'test@example.com', time: '2025-04-04T16:55:39.442Z' },
			]));

			const res = await book({ mentorEmail: 'john@carpet.com', time: '2025-04-04T16:50:39.442Z' });
			expect(
				res.body.message.startsWith('Sorry. This mentor has another meeting from ')
			).toBe(true);
		})

		it('Must create booking when both user and mentor are free around that time', async () => {
			getAllBookings.mockImplementation(jest.fn().mockReturnValue([]));

			const res = await book({ mentorEmail: 'john@carpet.com', time: '2025-04-04T16:50:39.442Z' });
			expect(
				res.status
			).toBe(201);
		});
	})
});
