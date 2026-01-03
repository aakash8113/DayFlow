import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import './Profile.css';

const Profile = () => {
  const { employee, updateEmployee } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/employees/${employee._id}`);
      setProfile(response.data.employee);
      setFormData(response.data.employee);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.put(`/employees/${employee._id}`, formData);
      setProfile(response.data.employee);
      updateEmployee(response.data.employee);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditing(false);
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

  const isAdmin = employee.role === 'Admin' || employee.role === 'HR';

  return (
    <Layout>
      <div className="profile-page">
        <div className="page-header">
          <h1>My Profile</h1>
          {!editing && (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              <Edit2 size={18} />
              Edit Profile
            </button>
          )}
        </div>

        <div className="profile-container">
          {/* Profile Header */}
          <div className="profile-header-card">
            <div className="profile-avatar-large">
              {profile?.firstName?.[0]}{profile?.lastName?.[0]}
            </div>
            <div className="profile-info">
              <h2>{profile?.firstName} {profile?.lastName}</h2>
              <p className="profile-role">{profile?.role}</p>
              {profile?.designation && (
                <p className="profile-designation">
                  {profile.designation}
                  {profile?.department && ` • ${profile.department}`}
                </p>
              )}
              <p className="profile-id">ID: {profile?.employeeId}</p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit}>
            <div className="profile-section">
              <h3 className="section-title">Personal Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <User size={16} />
                    First Name
                  </label>
                  {editing && isAdmin ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName || ''}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <p className="form-value">{profile?.firstName}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <User size={16} />
                    Last Name
                  </label>
                  {editing && isAdmin ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName || ''}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <p className="form-value">{profile?.lastName}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Mail size={16} />
                    Email
                  </label>
                  {editing && isAdmin ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <p className="form-value">{profile?.email}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Phone size={16} />
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber || ''}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-value">{profile?.phoneNumber || 'Not provided'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    Date of Birth
                  </label>
                  {editing && isAdmin ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-value">
                      {profile?.dateOfBirth 
                        ? format(new Date(profile.dateOfBirth), 'MMM dd, yyyy')
                        : 'Not provided'}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    Date of Joining
                  </label>
                  {editing && isAdmin ? (
                    <input
                      type="date"
                      name="dateOfJoining"
                      value={formData.dateOfJoining ? formData.dateOfJoining.split('T')[0] : ''}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-value">
                      {profile?.dateOfJoining 
                        ? format(new Date(profile.dateOfJoining), 'MMM dd, yyyy')
                        : 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3 className="section-title">Address</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>
                    <MapPin size={16} />
                    Street
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address?.street || ''}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-value">{profile?.address?.street || 'Not provided'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>City</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address?.city || ''}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-value">{profile?.address?.city || 'Not provided'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>State</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address?.state || ''}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-value">{profile?.address?.state || 'Not provided'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Zip Code</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address?.zipCode || ''}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-value">{profile?.address?.zipCode || 'Not provided'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Country</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address?.country || ''}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-value">{profile?.address?.country || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3 className="section-title">Job Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <Briefcase size={16} />
                    Department
                  </label>
                  {editing && isAdmin ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department || ''}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-value">{profile?.department || 'Not assigned'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Briefcase size={16} />
                    Designation
                  </label>
                  {editing && isAdmin ? (
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation || ''}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="form-value">{profile?.designation || 'Not assigned'}</p>
                  )}
                </div>
              </div>
            </div>

            {editing && (
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  <X size={18} />
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="spinner-small"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
