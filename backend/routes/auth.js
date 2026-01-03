const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Employee = require('../models/Employee');
const { generateToken } = require('../middleware/auth');

// @route   POST /api/auth/signup
// @desc    Register a new employee
// @access  Public
router.post('/signup', [
  body('employeeId').notEmpty().trim().withMessage('Employee ID is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('role').isIn(['Employee', 'HR', 'Admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { employeeId, email, password, role, firstName, lastName, phoneNumber, department, designation, dateOfJoining } = req.body;

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ 
      $or: [{ email }, { employeeId }] 
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email or ID already exists'
      });
    }

    // Create new employee
    const employeeData = {
      employeeId,
      email,
      password,
      role,
      firstName,
      lastName,
      isVerified: true
    };

    if (phoneNumber) employeeData.phoneNumber = phoneNumber;
    if (department) employeeData.department = department;
    if (designation) employeeData.designation = designation;
    if (dateOfJoining) employeeData.dateOfJoining = dateOfJoining;

    const employee = await Employee.create(employeeData);

    // Generate token
    const token = generateToken(employee._id);

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      token,
      employee: employee.getPublicProfile()
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/signin
// @desc    Login employee
// @access  Public
router.post('/signin', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find employee
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await employee.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!employee.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact HR.'
      });
    }

    // Generate token
    const token = generateToken(employee._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      employee: employee.getPublicProfile()
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in employee
// @access  Private
router.get('/me', require('../middleware/auth').protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id).select('-password');
    
    res.json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
