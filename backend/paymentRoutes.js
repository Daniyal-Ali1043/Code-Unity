const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const protect = require('./middleware/authMiddleware');

// Create a payment intent
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { amount, currency, description, orderDetails } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({
        error: 'Amount and currency are required'
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata: {
        orderDetails: JSON.stringify(orderDetails)
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      error: 'Failed to create payment intent'
    });
  }
});

// Retrieve a payment intent
router.get('/payment-intent/:id', protect, async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);
    res.json(paymentIntent);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({
      error: 'Failed to retrieve payment intent'
    });
  }
});

module.exports = router; 