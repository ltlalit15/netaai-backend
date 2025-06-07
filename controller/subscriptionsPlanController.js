const db = require('../config'); // Assuming you are using a database configuration file

// Create a new subscription plan
exports.createSubscriptionPlan = async (req, res) => {
  const { plan_name, price, duration, description } = req.body;

  if (!plan_name || !price || !duration) {
    return res.status(400).json({ message: 'Missing required fields (plan_name, price, duration)' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO subscriptions_plan (plan_name, price, duration, description) VALUES (?, ?, ?, ?)',
      [plan_name, price, duration, description || 'No description available']
    );

    res.status(201).json({
      message: 'Subscription plan created successfully',
      planId: result.insertId
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all subscription plans
exports.getAllSubscriptionPlans = async (req, res) => {
  try {
    const [plans] = await db.query('SELECT * FROM subscriptions_plan ORDER BY plan_name ASC');
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific subscription plan by ID
exports.getSubscriptionPlanById = async (req, res) => {
  const { planId } = req.params;

  if (!planId) {
    return res.status(400).json({ message: 'Plan ID is required' });
  }

  try {
    const [plan] = await db.query('SELECT * FROM subscriptions_plan WHERE id = ?', [planId]);

    if (plan.length === 0) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json(plan[0]);
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a subscription plan by ID
exports.updateSubscriptionPlan = async (req, res) => {
  const { planId } = req.params;
  const { plan_name, price, duration, description } = req.body;

  if (!plan_name || !price || !duration) {
    return res.status(400).json({ message: 'Missing required fields (plan_name, price, duration)' });
  }

  try {
    const [result] = await db.query(
      'UPDATE subscriptions_plan SET plan_name = ?, price = ?, duration = ?, description = ? WHERE id = ?',
      [plan_name, price, duration, description || 'No description available', planId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json({ message: 'Subscription plan updated successfully' });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a subscription plan by ID
exports.deleteSubscriptionPlan = async (req, res) => {
  const { planId } = req.params;

  if (!planId) {
    return res.status(400).json({ message: 'Plan ID is required' });
  }

  try {
    const [result] = await db.query('DELETE FROM subscriptions_plan WHERE id = ?', [planId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
