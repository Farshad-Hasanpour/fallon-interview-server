module.exports = (req, res, next) => {
	res.sendResponse = (
		status = 200,
		message = "",
		data = null,
	) => {
		return res.status(status).json({
			success: status < 400,
			message,
			data: {
				...data
			},
		});
	};

	next();
};
