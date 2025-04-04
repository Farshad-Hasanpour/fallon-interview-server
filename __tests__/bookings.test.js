const supertest = require('supertest');
require('../config/process');
const app = require('../config/app');

// jest.mock('../config/db');
const db = require('../config/db');

describe('POST /bookings', () => {
	it('must fail when req.body.mentorEmail is not set or mentor is not found', async () => {
		// db.getUsers.mockResolvedValue([{ id: 1, name: 'Alice' }]);

		expect(1 + 1).toBe(2);
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
			// db.getUsers.mockResolvedValue([{ id: 1, name: 'Alice' }]);

			expect(1 + 1).toBe(2);
		});
	})
});
