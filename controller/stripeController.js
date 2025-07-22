const db = require('../config'); // If needed for logging or saving payment info
const axios = require('axios');  // You can remove this if not used below

const stripe = require('stripe')(
  'sk_test_51QjO3HAkiLZQygvD8kwZLwH5r0jExg8yautBgymqFOIjAC6wa1WSgzEuXKfzrWt40MhsFZhgATSn5AbPkJNMPFYf00PSEFqGrc'
);


// exports.createStripePayment = async (req, res) => {
//   try {
//     const { amount, currency, metadata, description } = req.body;

//     if (!amount || typeof amount !== 'number') {
//       return res.status(400).json({ error: 'Invalid or missing amount' });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount,
//       currency: currency || 'usd',
//       metadata: metadata || {},
//       description: description || '',
//     });

//     res.status(200).json({
//       clientSecret: paymentIntent.client_secret,
//       description: paymentIntent.description, // included
//       message: 'Payment Intent created successfully',
//     });
//   } catch (error) {
//     console.error('Stripe Error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };




exports.createStripePayment = async (req, res) => {
  try {
    const { amount, currency, metadata, description, userId, planId } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Invalid or missing amount' });
    }

    // 1. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'usd',
      metadata: metadata || {},
      description: description || '',
    });

    // 2. Update user's plan in MySQL (if userId and planId are given)
    if (userId && planId) {
      const updateQuery = 'UPDATE users SET plan = ? WHERE id = ?';
      db.query(updateQuery, [planId, userId], (err, result) => {
        if (err) {
          console.error('DB Error:', err);
          return res.status(500).json({ error: 'Failed to update user plan' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        // 3. Return success with payment intent
        res.status(200).json({
          clientSecret: paymentIntent.client_secret,
          description: paymentIntent.description,
          message: 'Payment Intent created and user plan updated successfully',
        });
      });
    } else {
      // If no plan update needed
      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        description: paymentIntent.description,
        message: 'Payment Intent created successfully',
      });
    }
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ error: error.message });
  }
};







