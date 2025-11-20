const User = require('../Models/Users');
const bcrypt = require('bcrypt');

// Get logged-in user's profile
exports.getProfile = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
		}

		const user = await User.findById(userId).select('-password');
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		res.status(200).json(user);
	} catch (err) {
		console.error('❌ Error fetching profile:', err);
		res.status(500).json({ message: 'Server error', error: err.message });
	}
};

// Update logged-in user's profile
exports.updateProfile = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
		}

		const { name, email, password, specialization, phoneNumber, age, gender } = req.body;
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// 🔹 Email update check
		if (email && email.toLowerCase() !== user.email.toLowerCase()) {
			const existing = await User.findOne({ email: email.toLowerCase() });
			if (existing) {
				return res.status(400).json({ message: 'Email already in use' });
			}
			user.email = email.toLowerCase();
		}

		// 🔹 Basic fields
		if (name) {
			user.name = name;

			// Update name in all related appointments
			try {
				if (user.role === 'patient') {
					// Update patientName in appointments where this user is the patient
					await require('../Models/Appointment').updateMany(
						{ patient: userId },
						{ patientName: name }
					);
				} else if (user.role === 'doctor') {
					// Update doctorName in appointments where this user is the doctor
					await require('../Models/Appointment').updateMany(
						{ doctor: userId },
						{ doctorName: name }
					);
				}
			} catch (updateErr) {
				console.error('Failed to update appointment names:', updateErr);
				// Don't fail the entire update if appointment update fails
			}
		}

		// 🔹 Role-specific updates
		if (user.role === 'doctor' && specialization) {
			user.specialization = specialization;
		}
		if (user.role === 'doctor' && phoneNumber !== undefined) {
			user.phoneNumber = phoneNumber;
		}
		if (user.role === 'patient') {
			if (age !== undefined) user.age = age;
			if (gender) user.gender = gender;
		}

		// 🔹 Password update
		if (password && password.trim() !== '') {
			const hashedPassword = await bcrypt.hash(password, 10);
			user.password = hashedPassword;
		}

		await user.save();

		const updatedUser = await User.findById(userId).select('-password');
		res.status(200).json({
			message: 'Profile updated successfully',
			user: updatedUser
		});
	} catch (err) {
		console.error('❌ Error updating profile:', err);
		res.status(500).json({
			message: 'Server error while updating profile',
			error: err.message
		});
	}
};
