// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../model/user');
const userController = require('../controllers/userController');

router.post('/onboarding', userController.completeOnboarding);

router.get('/:id', async (req, res) => {
  try {
    console.log("here tere");
    // Use the dynamic ID from the URL parameters
    const userId = req.params.id;
    console.log("id is " + userId)
    // Find user by the dynamic ID instead of Clerk ID
    const user = await User.findOne({ clerkId: userId });
    const users = await User.find({});
    console.log(users);
    // Alternative: const user = await User.findOne({ _id: userId });
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;