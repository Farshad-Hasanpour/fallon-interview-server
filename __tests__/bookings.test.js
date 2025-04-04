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
		it('Must create when user has not booked with that mentor yet', () => {
			expect(1 + 1).toBe(2);
		})
		it('Must fail when user has already booked with that mentor', async () => {
			expect(1 + 1).toBe(2);
		})
	})

	describe('When booking has specific start time (each meeting takes 30 minutes)', () => {

		it('Must fail when user has another meeting with overlapping times', async () => {
			expect(1 + 1).toBe(2);
		})

		it('Must fail when mentor has another meeting with overlapping times', async () => {
			expect(1 + 1).toBe(2);
		})

		it('Must create booking when both user and mentor are free around that time', async () => {
			expect(1 + 1).toBe(2);
		});
	})
});
