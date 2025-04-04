const router = require("express").Router();
const User = require("../models/user");
const cloudinary = require("../config/cloudinary");
const jwtMiddleware = require("../middlewares/jwtMiddleware");

router.get(
	'/users/profile',
	jwtMiddleware,
	async (req, res) => {
		return res.sendResponse(200, '', {profile: req.authorizedUser || null})
	}
)

router.get(
	'/users',
	jwtMiddleware,
	async (req, res) => {
		const users = await User.find({_id: {$ne: req.authorizedUser?._id}})

		return res.sendResponse(200, '', {users})
	}
)

router.post('/user/avatar', jwtMiddleware, async (req, res) => {
	let newAvatar = '';
	// if req.body.avatar exists, upload it
	if(req.body.avatar){
		const uploadedAvatar = await cloudinary.uploader.upload(req.body.avatar, {
			folder: 'chat-org',
		})
		newAvatar = uploadedAvatar.secure_url || ''
	}

	// delete previous avatar
	if(req.authorizedUser.avatar) await cloudinary.uploader.destroy(req.authorizedUser.avatar)

	// update user avatar link
	const user = await User.findByIdAndUpdate(req.authorizedUser._id, {
		avatar: newAvatar
	}, {new: true})

	res.sendResponse(200, 'Avatar updated successfully', {
		user
	})
})

module.exports = router;
