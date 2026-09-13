import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Shield,
  UploadCloud,
  User,
  Lock,
  Phone,
  BookOpen,
  Building,
  Languages,
  CheckCircle2,
  Loader2,
  X,
  FileText,
} from 'lucide-react';

export function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    roll_number: '',
    department: 'Computer Science',
    year: '2',
    room_number: '',
    parent_name: '',
    parent_phone: '',
    parent_language: 'English',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const { signup } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (JPEG, PNG, WEBP).');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Username and password are required.');
      return;
    }
    if (!formData.name.trim() || !formData.roll_number.trim() || !formData.room_number.trim()) {
      setError('Student name, roll number, and room number are required.');
      return;
    }
    if (!formData.parent_name.trim() || !formData.parent_phone.trim()) {
      setError('Parent details and phone number are required.');
      return;
    }
    if (!photoFile) {
      setError('Please upload a student profile photo.');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('username', formData.username.trim());
      data.append('password', formData.password);
      data.append('name', formData.name.trim());
      data.append('roll_number', formData.roll_number.trim().toUpperCase());
      data.append('department', formData.department);
      data.append('year', parseInt(formData.year, 10));
      data.append('room_number', formData.room_number.trim().toUpperCase());
      data.append('parent_name', formData.parent_name.trim());
      data.append('parent_phone', formData.parent_phone.trim());
      data.append('parent_language', formData.parent_language);
      data.append('photo', photoFile);

      await signup(data);
      showSuccess('Account registered successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '3rem 1rem' }}>
      <div className="auth-card auth-card-wide animate-scale-up">
        <div className="auth-header">
          <div className="auth-logo">
            <Shield size={28} />
          </div>
          <h1 className="text-xl font-bold">Student Registration</h1>
          <p className="text-secondary text-sm mt-1">
            Register for PassFlow digital hostel outpass system
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Account Access */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <Lock size={15} /> 1. ACCOUNT CREDENTIALS
            </h2>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Username <span className="required">*</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="form-input"
                  placeholder="e.g. rahul_k"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password <span className="required">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Student Details */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <User size={15} /> 2. STUDENT DETAILS
            </h2>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul Kumar"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="roll_number">
                  Roll Number / Student ID <span className="required">*</span>
                </label>
                <input
                  id="roll_number"
                  name="roll_number"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 21CS045"
                  value={formData.roll_number}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="department">
                  Department <span className="required">*</span>
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Computer Science"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="year">
                    Year <span className="required">*</span>
                  </label>
                  <select
                    id="year"
                    name="year"
                    className="form-select"
                    value={formData.year}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="room_number">
                    Room No. <span className="required">*</span>
                  </label>
                  <input
                    id="room_number"
                    name="room_number"
                    type="text"
                    className="form-input"
                    placeholder="e.g. B-204"
                    value={formData.room_number}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="form-group mt-2">
              <label className="form-label">
                Student Profile Photo <span className="required">*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handlePhotoSelect}
                disabled={loading}
              />

              {!photoPreview ? (
                <div
                  className="dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '1.5rem 1rem' }}
                >
                  <UploadCloud size={32} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Click to upload photo
                    </div>
                    <div className="text-xs text-muted mt-1">PNG, JPG, JPEG up to 5MB</div>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-4"
                  style={{
                    background: 'var(--bg-tertiary)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  <img
                    src={photoPreview}
                    alt="Student Preview"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '2px solid var(--primary)',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {photoFile?.name}
                    </div>
                    <div className="text-xs text-secondary">
                      {(photoFile?.size / 1024).toFixed(1)} KB • Ready for upload
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--status-late-text)' }}
                    disabled={loading}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Parent & Contact Details */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <Phone size={15} /> 3. PARENT & GUARDIAN CONTACT
            </h2>
            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="parent_name">
                  Parent / Guardian Name <span className="required">*</span>
                </label>
                <input
                  id="parent_name"
                  name="parent_name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Suresh Kumar"
                  value={formData.parent_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="parent_phone">
                  Parent Phone Number (for Telegram) <span className="required">*</span>
                </label>
                <input
                  id="parent_phone"
                  name="parent_phone"
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +919876543210"
                  value={formData.parent_phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="parent_language">
                  Preferred Language <span className="required">*</span>
                </label>
                <select
                  id="parent_language"
                  name="parent_language"
                  className="form-select"
                  value={formData.parent_language}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Kannada">Kannada</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Registering Student Profile...
              </>
            ) : (
              <>
                <CheckCircle2 size={20} /> Complete Registration
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span className="text-secondary">Already have an account? </span>
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
