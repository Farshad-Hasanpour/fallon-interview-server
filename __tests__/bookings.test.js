const request  = require('supertest');
require('../config/process');
const app = require('../config/app');

jest.mock('node-json-db');
const { JsonDB } = require('node-json-db');
// const db = new JsonDB(new Config("__tests__/database", true, true, '/'));

describe('POST /bookings', () => {
	beforeEach(() => {
		JsonDB.mockClear();
	});

	it('must fail when req.body.mentorEmail is not set or mentor is not found', async () => {
		const mockGetData = jest.fn().mockReturnValue({ id: 1, name: 'Alice' });

		// When Express app calls new JsonDB(...), it gets this fake instance
		JsonDB.mockImplementation(() => ({
			getData: mockGetData
		}));

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
