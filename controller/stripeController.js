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

    // 1. Create Stripe PaymentIntent with userId and planId in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'usd',
      metadata: {
        ...metadata,
        userId: userId || 'unknown',
        planId: planId || 'none',
      },
      description: description || '',
    });

    // 2. Insert into subscriptions table
    if (userId && planId) {
      const startDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const endDateObj = new Date();
      endDateObj.setDate(endDateObj.getDate() + 30); // 30-day duration
      const endDate = endDateObj.toISOString().split('T')[0];

      const insertQuery = `
        INSERT INTO subscriptions 
        (user_id, plan_id, start_date, end_date, price, status, payment_status, payment_method)
        VALUES (?, ?, ?, ?, ?, 'active', 'pending', ?)
      `;

      db.query(
        insertQuery,
        [userId, planId, startDate, endDate, amount / 100, 'stripe'],
        (insertErr) => {
          if (insertErr) {
            console.error('DB Insert Error (subscriptions):', insertErr);
            // Do not fail payment if subscription record fails — just log
          }
        }
      );
    }

    // 3. Update user's plan (optional)
    if (userId && planId) {
      const updateQuery = 'UPDATE users SET plan = ? WHERE id = ?';
      db.query(updateQuery, [planId, userId], (err, result) => {
        if (err) {
          console.error('DB Error (user update):', err);
          return res.status(500).json({ error: 'Failed to update user plan' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
          clientSecret: paymentIntent.client_secret,
          description: paymentIntent.description,
          paymentIntentId: paymentIntent.id,
          message: 'Payment Intent created and subscription added',
        });
      });
    } else {
      // If no userId or planId, just return the PaymentIntent
      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        description: paymentIntent.description,
        paymentIntentId: paymentIntent.id,
        message: 'Payment Intent created successfully',
      });
    }
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ error: error.message });
  }
};






