const db = require('../config'); // If needed for logging or saving payment info
const axios = require('axios');  // You can remove this if not used below

const stripe = require('stripe')(
  'sk_test_51QjO3HAkiLZQygvD8kwZLwH5r0jExg8yautBgymqFOIjAC6wa1WSgzEuXKfzrWt40MhsFZhgATSn5AbPkJNMPFYf00PSEFqGrc'
);

// exports.createStripePayment = async (req, res) => {
//   try {
//     const { amount, currency, metadata } = req.body;

//     // Validate amount (must be number)
//     if (!amount || typeof amount !== 'number') {
//       return res.status(400).json({ error: 'Invalid or missing amount' });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount, // e.g. 5000 means $50.00
//       currency: currency || 'usd',
//       metadata: metadata || {},
//     });

//     res.status(200).json({
//       clientSecret: paymentIntent.client_secret,
//       message: 'Payment Intent created successfully',
//     });
//   } catch (error) {
//     console.error('Stripe Error:', error); // Log for debugging
//     res.status(500).json({ error: error.message });
//   }
// };


exports.createStripePayment = async (req, res) => {
  try {
    const { amount, currency, metadata, description } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Invalid or missing amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'usd',
      metadata: metadata || {},
      description: description || '',
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      description: paymentIntent.description, // included
      message: 'Payment Intent created successfully',
    });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ error: error.message });
  }
};
