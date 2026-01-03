import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Users, Calendar, FileText, TrendingUp, Building2 } from 'lucide-react';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    recentLeaves: [],
    departmentBreakdown: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [employeesRes, attendanceRes, leavesRes] = await Promise.all([
        api.get('/employees'),
        api.get('/attendance', {
          params: {
            startDate: today.toISOString(),
            endDate: today.toISOString(),
          },
        }),
        api.get('/leave'),
      ]);

      const presentToday = attendanceRes.data.attendance.filter(
        (a) => a.status === 'Present'
      ).length;

      const pendingLeaves = leavesRes.data.leaves.filter(
        (l) => l.status === 'Pending'
      ).length;

      // Calculate department breakdown
      const departmentBreakdown = {};
      employeesRes.data.employees.forEach((emp) => {
        const dept = emp.department || 'Unassigned';
        departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;
      });

      setStats({
        totalEmployees: employeesRes.data.count,
        presentToday,
        pendingLeaves,
        recentLeaves: leavesRes.data.leaves.filter(l => l.status === 'Pending').slice(0, 5),
        departmentBreakdown,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.put(`/leave/${leaveId}/review`, {
        status,
        reviewComments: status === 'Approved' ? 'Approved by admin' : 'Rejected by admin',
      });
      toast.success(`Leave ${status.toLowerCase()} successfully`);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update leave');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        <div className="page-header">
          <h1>Admin Dashboard 📊</h1>
          <p>Overview of your organization's HR metrics.</p>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
              <Users size={24} color="#3b82f6" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Employees</p>
              <p className="stat-value">{stats.totalEmployees}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7' }}>
              <Calendar size={24} color="#10b981" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Present Today</p>
              <p className="stat-value">{stats.presentToday}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <FileText size={24} color="#f59e0b" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Pending Leaves</p>
              <p className="stat-value">{stats.pendingLeaves}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e0e7ff' }}>
              <TrendingUp size={24} color="#6366f1" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Attendance Rate</p>
              <p className="stat-value">
                {stats.totalEmployees > 0 
                  ? Math.round((stats.presentToday / stats.totalEmployees) * 100) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="card">
          <h2 className="card-title">
            <Building2 size={20} />
            Department Breakdown
          </h2>
          
          {Object.keys(stats.departmentBreakdown).length > 0 ? (
            <div className="department-grid">
              {Object.entries(stats.departmentBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([department, count]) => (
                  <div key={department} className="department-card">
                    <div className="department-name">{department}</div>
                    <div className="department-count">{count} employee{count !== 1 ? 's' : ''}</div>
                    <div className="department-bar">
                      <div 
                        className="department-bar-fill"
                        style={{ 
                          width: `${(count / stats.totalEmployees) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="empty-state">No department data available.</p>
          )}
        </div>

        {/* Pending Leave Requests */}
        <div className="card">
          <h2 className="card-title">Pending Leave Requests</h2>
          
          {stats.recentLeaves.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLeaves.map((leave) => (
                    <tr key={leave._id}>
                      <td>
                        <div>
                          <strong>{leave.employee?.firstName} {leave.employee?.lastName}</strong>
                          {leave.employee?.designation && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {leave.employee?.designation}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-secondary">
                          {leave.employee?.department || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info">{leave.leaveType}</span>
                      </td>
                      <td>
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td>{leave.numberOfDays}</td>
                      <td className="reason-cell">{leave.reason}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon btn-success"
                            onClick={() => handleLeaveAction(leave._id, 'Approved')}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button 
                            className="btn-icon btn-danger"
                            onClick={() => handleLeaveAction(leave._id, 'Rejected')}
                            title="Reject"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No pending leave requests.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
