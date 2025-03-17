// server/controllers/userController.js - Simplified version without authentication
const User = require('../model/user');

// Complete user onboarding
exports.completeOnboarding = async (req, res) => {
  try {
    // Extract onboarding fields from request body
    const {
      clerkId, // Get this from the request body for now
      firstName,
      lastName,
      jobTitle,
      company,
      githubName,
      Experience,
      purpose
    } = req.body;
    
    if (!clerkId) {
      return res.status(400).json({ message: 'clerkId is required' });
    }
    
    // Try to find the user first
    let user = await User.findOne({ clerkId });
    
    if (!user) {
      // Create a new user if not found
      user = new User({
        clerkId,
        email: req.body.email || 'user@example.com', // Use provided email or default
        firstName,
        lastName
      });
    }
    
    // Update user fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.jobTitle = jobTitle || user.jobTitle;
    user.company = company || user.company;
    user.githubName = githubName || user.githubName;
    user.Experience = Experience || user.Experience;
    user.purpose = purpose || user.purpose;
    user.onboardingCompleted = true;
    user.lastUpdated = Date.now();
    
    // Save the user
    await user.save();
    
    // Return success response with updated user data
    res.status(200).json({ 
      success: true, 
      message: 'Onboarding completed successfully',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted
      }
    });
    
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Server error during onboarding' });
  }
};

// server/routes/userRoutes.js - Simplified version without middlewar