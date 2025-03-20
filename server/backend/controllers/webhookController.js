// server/controllers/webhookController.js
const User = require('../model/user');
const { Webhook } = require('svix');

const handleClerkWebhook = async (req, res) => {
  try {
    // Verify the webhook signature
    console.log("here");
    const webhookSecret = "whsec_VMoits05TrA5PARWkkAjNkwFc0AbEeL6";
    const headers = req.headers;
    const payload = req.body;

    const webhook = new Webhook(webhookSecret);
    let event;

    try {
      event = webhook.verify(JSON.stringify(payload), headers);
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const eventType = event.type;
    const data = event.data;

    console.log(`Processing webhook event: ${eventType}`);

    // Handle user creation and updates
    if (eventType === 'user.created' || eventType === 'user.updated') {
      try {
        // Prepare email data
        const primaryEmail = data.email_addresses?.find(email => email.id === data.primary_email_address_id);
        const emailAddress = primaryEmail ? primaryEmail.email_address : '';

        console.log(`Updating user with clerkId: ${data.id}`);

        // Use a simpler approach for debugging
        const userData = {
          clerkId: data.id,
          email: emailAddress,
          firstName: data.first_name,
          lastName: data.last_name,
          imageUrl: data.image_url,
          onboardingCompleted: false,
          lastUpdated: new Date()
        };

        console.log('User data:', userData);

        // First check if the user exists
        const existingUser = await User.findOne({ email: emailAddress });

        if (existingUser) {
          // Update existing user
          console.log(`User updated: ${data.id}`);
        } else {
          // Create new user
          const newUser = new User(userData);
          ;
          await newUser.save();
          console.log(`New user created: ${data.id}`);
        }

        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error details:', error);
        return res.status(500).json({ message: 'Error syncing user data', error: error.message });
      }
    }

    // Handle user deletion
    if (eventType === 'user.deleted') {
      try {
        await User.deleteOne({ clerkId: data.id });
        console.log(`User deleted: ${data.id}`);
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Error deleting user data' });
      }
    }

    // Return 200 for unhandled events
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('General webhook error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { handleClerkWebhook };