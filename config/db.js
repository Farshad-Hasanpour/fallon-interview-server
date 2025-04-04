const { JsonDB, Config } = require('node-json-db');

const db = new JsonDB(new Config(
	process.env.NODE_APP_DB_NAME,
	true,
	true,
	'/'
));

module.exports = {
	getAllUsers: () => db.getData("/users"),
	getAllMentors: () => db.getData("/mentors"),
	getAllBookings: () => db.getData("/bookings"),
	addUser: (newUser) => db.push('/users[]', newUser),
	addBooking: (newBooking) => db.push('/bookings[]', newBooking),
};
