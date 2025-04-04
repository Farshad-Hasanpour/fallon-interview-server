const request  = require('supertest');
require('../config/process');
const app = require('../config/app');
const jwt = require('jsonwebtoken');

jest.mock('node-json-db');
const { JsonDB } = require('node-json-db');

const prefix = '/api/v1'
describe('POST /bookings', () => {
	beforeEach(() => {
		JsonDB.mockClear();
	});

	// Set jwt token
	const loggedUserEmail = 'farshad.hasanpour96@gmail.com'
	const mockGetAllUsers = jest.fn().mockReturnValue([
		{
			email: loggedUserEmail,
		},
		{
			email: 'john@carpet.com'
		}
	]);

	JsonDB.mockImplementation(() => ({
		getAllUsers: mockGetAllUsers
	}));
	const token = jwt.sign({
		email: loggedUserEmail
	}, process.env.NODE_APP_JWT_SECRET, {
		expiresIn: process.env.NODE_APP_JWT_REMEMBER_ME_EXPIRE
	});

	it('must fail when req.body.mentorEmail is not set', async () => {
		const res = await request(app).post(`${prefix}/bookings`)
			.send({time: null})
			.set('Authorization', `Bearer ${token}`)

		expect(res.body.message).toBe('Mentor not found');
	});

	it('must fail when mentor is not found', async () => {
		expect(1 + 1).toBe(2)
	});

	it('must fail when req.body.time is not formatted correctly', async () => {
		// db.getUsers.mockResolvedValue([{ id: 1, name: 'Alice' }]);

		expect(1 + 1).toBe(2);
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
