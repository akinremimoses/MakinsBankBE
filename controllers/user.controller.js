const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const sendEmail = require('../utils/senEmail');

function generateAccountNumber() {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return 'MAK' + randomNumber;
}

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user object 
    user = new User({
      name,
      email,
      password: hashedPassword,
      accountNumber: generateAccountNumber(), 
      balance: 10000 
    });

    // 4. Save user to DB
    console.log('Saving user...');
    await user.save();
    console.log('User saved.');

    // 5. Send welcome email (optional: skip to debug)
    console.log('Sending email...');
    try {
      await sendEmail({
        to: email,
        subject: 'Account Created Successfully',
        text: `Hello ${name},\n\nYour account has been created.\nAccount Number: ${user.accountNumber}\nBalance: $${user.balance}`
      });
      console.log('Email sent.');
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr.message);
      // You can choose to continue or return an error here if email is required
    }

    // 6. Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment');
    }

    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 7. Return response
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        accountNumber: user.accountNumber,
        balance: user.balance
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        accountNumber: user.accountNumber,
        balance: user.balance
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get user profile
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get all transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Transfer money
exports.transfer = async (req, res) => {
  try {
    const { recipientAccount, amount, description } = req.body;

    const recipient = await User.findOne({ accountNumber: recipientAccount });
    if (!recipient) return res.status(400).json({ message: 'Recipient not found' });

    const sender = await User.findById(req.user.id);
    if (sender.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    sender.balance -= amount;
    recipient.balance += amount;

    await sender.save();
    await recipient.save();

    const transactions = [
      new Transaction({
        user: sender._id,
        type: 'transfer',
        amount,
        recipient: recipient.accountNumber,
        description: `Transfer to ${recipient.name}: ${description}`
      }),
      new Transaction({
        user: recipient._id,
        type: 'transfer',
        amount,
        recipient: sender.accountNumber,
        description: `Received from ${sender.name}: ${description}`
      })
    ];

    await Promise.all(transactions.map(tx => tx.save()));

    res.json({ message: 'Transfer successful', balance: sender.balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Withdraw money
exports.withdraw = async (req, res) => {
  try {
    const { amount, description } = req.body;

    const user = await User.findById(req.user.id);
    if (user.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    user.balance -= amount;
    await user.save();

    const transaction = new Transaction({
      user: user._id,
      type: 'withdrawal',
      amount,
      description: description || 'Withdrawal'
    });

    await transaction.save();

    res.json({ message: 'Withdrawal successful', balance: user.balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
