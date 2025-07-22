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
      metadata: {
        ...metadata,
        userId: userId || 'unknown',
        planId: planId || 'none',
      },
      description: description || '',
    });

    // 2. Insert into subscriptions table (only if userId & planId provided)
    if (userId && planId) {
      const startDate = new Date().toISOString().split('T')[0];
      const endDateObj = new Date();
      endDateObj.setDate(endDateObj.getDate() + 30);
      const endDate = endDateObj.toISOString().split('T')[0];

      const insertQuery = `
        INSERT INTO subscriptions 
        (user_id, plan_id, start_date, end_date, price, status, payment_status, payment_method)
        VALUES (?, ?, ?, ?, ?, 'active', 'pending', ?)
      `;

      try {
        await db.promise().query(insertQuery, [
          userId,
          planId,
          startDate,
          endDate,
          amount / 100,
          'stripe',
        ]);
      } catch (insertErr) {
        console.error('DB Insert Error (subscriptions):', insertErr);
      }

      // 3. Update user’s plan
      const updateQuery = 'UPDATE users SET plan = ? WHERE id = ?';
      try {
        const [result] = await db.promise().query(updateQuery, [planId, userId]);

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
          clientSecret: paymentIntent.client_secret,
          description: paymentIntent.description,
          paymentIntentId: paymentIntent.id,
          message: 'Payment Intent created and subscription added',
        });
      } catch (updateErr) {
        console.error('DB Error (user update):', updateErr);
        return res.status(500).json({ error: 'Failed to update user plan' });
      }
    }

    // 4. Return PaymentIntent if no DB work needed
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      description: paymentIntent.description,
      paymentIntentId: paymentIntent.id,
      message: 'Payment Intent created successfully',
    });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};






