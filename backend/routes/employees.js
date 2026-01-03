const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/employees
// @desc    Get all employees (Admin/HR only)
// @access  Private
router.get('/', protect, authorize('Admin', 'HR'), async (req, res) => {
  try {
    const employees = await Employee.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    // Employees can only view their own profile unless they're Admin/HR
    if (req.employee.role === 'Employee' && req.employee._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this profile'
      });
    }

    const employee = await Employee.findById(req.params.id).select('-password');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Define fields that employees can update
    const employeeEditableFields = ['phoneNumber', 'address', 'profilePicture'];
    
    // Employees can only update their own limited fields
    if (req.employee.role === 'Employee' && req.employee._id.toString() === req.params.id) {
      // Filter to only allow editable fields
      const updates = {};
      employeeEditableFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      
      Object.assign(employee, updates);
    } 
    // Admin/HR can update all fields
    else if (req.employee.role === 'Admin' || req.employee.role === 'HR') {
      const { password, ...updates } = req.body;
      Object.assign(employee, updates);
    } 
    else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    await employee.save();

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: employee.getPublicProfile()
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee (Admin only)
// @access  Private
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await employee.deleteOne();

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
