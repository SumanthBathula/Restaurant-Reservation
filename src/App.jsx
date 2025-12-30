import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('login');

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCurrentView('login');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        <AuthScreen 
          setUser={setUser} 
          setToken={setToken}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      {user.role === 'admin' ? (
        <AdminDashboard token={token} user={user} />
      ) : (
        <CustomerDashboard token={token} user={user} />
      )}
    </div>
  );
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^[6-9]\d{9}$/; // Indian mobile numbers

const validateIdentifier = (value) => {
  if (emailRegex.test(value)) return true;
  if (mobileRegex.test(value)) return true;
  return false;
};


// ==================== AUTH SCREEN ====================
function AuthScreen({ setUser, setToken, currentView, setCurrentView }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = currentView === 'login' ? '/auth/login' : '/auth/register';
    const body = currentView === 'login' 
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Restaurant Reservation System</h1>
        <h2>{currentView === 'login' ? 'Login' : 'Register'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {currentView === 'register' && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email or Mobile</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => {
                handleChange(e);
                if (!validateIdentifier(e.target.value)) {
                  setError("Enter a valid email or 10-digit mobile number");
                } else {
                  setError("");
                }
              }}
              placeholder="Enter email or mobile number"
              required
            />
            {error && <p className="error">{error}</p>}
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Enter your password (min 6 characters)"
            />
          </div>

          {currentView === 'register' && (
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Please wait...' : (currentView === 'login' ? 'Login' : 'Register')}
          </button>
        </form>

        <p className="auth-toggle">
          {currentView === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button 
            className="link-button" 
            onClick={() => {
              setCurrentView(currentView === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {currentView === 'login' ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ==================== HEADER ====================
function Header({ user, onLogout }) {
  return (
    <header className="header">
      <h1>🍽️ Restaurant Reservations</h1>
      <div className="header-right">
        <span className="user-info">
          {user.name} ({user.role})
        </span>
        <button onClick={onLogout} className="btn-secondary">Logout</button>
      </div>
    </header>
  );
}

// ==================== CUSTOMER DASHBOARD ====================
function CustomerDashboard({ token, user }) {
  const [view, setView] = useState('make-reservation');
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [formData, setFormData] = useState({
    tableId: '',
    reservationDate: '',
    timeSlot: '',
    numberOfGuests: 2
  });
  const [searchParams, setSearchParams] = useState({
    date: '',
    timeSlot: '',
    guests: 2
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (view === 'my-reservations') {
      fetchMyReservations();
    }
  }, [view]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_URL}/tables`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchMyReservations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/reservations/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReservations(data);
    } catch (error) {
      setError('Error fetching reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAvailability = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/tables/available?date=${searchParams.date}&timeSlot=${searchParams.timeSlot}&guests=${searchParams.guests}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAvailableTables(data);
        if (data.length === 0) {
          setError('No tables available for the selected date, time, and party size.');
        } else {
          setSuccess(`${data.length} table(s) available!`);
        }
      } else {
        setError(data.error || 'Error checking availability');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Reservation created successfully!');
        setFormData({
          tableId: '',
          reservationDate: '',
          timeSlot: '',
          numberOfGuests: 2
        });
        setAvailableTables([]);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Error creating reservation');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/reservations/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Reservation cancelled successfully');
        fetchMyReservations();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Error cancelling reservation');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="dashboard">
      <div className="tabs">
        <button 
          className={view === 'make-reservation' ? 'tab active' : 'tab'}
          onClick={() => setView('make-reservation')}
        >
          Make Reservation
        </button>
        <button 
          className={view === 'my-reservations' ? 'tab active' : 'tab'}
          onClick={() => setView('my-reservations')}
        >
          My Reservations
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {view === 'make-reservation' && (
        <div className="content">
          <h2>Check Availability</h2>
          <form onSubmit={checkAvailability} className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={searchParams.date}
                  onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time Slot (24-hour format)</label>
                <input
                  type="time"
                  value={searchParams.timeSlot}
                  onChange={(e) => setSearchParams({ ...searchParams, timeSlot: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Number of Guests</label>
                <input
                  type="number"
                  value={searchParams.guests}
                  onChange={(e) => setSearchParams({ ...searchParams, guests: parseInt(e.target.value) })}
                  min="1"
                  max="20"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Checking...' : 'Check Availability'}
            </button>
          </form>

          {availableTables.length > 0 && (
            <div className="available-tables">
              <h3>Available Tables</h3>
              <div className="tables-grid">
                {availableTables.map(table => (
                  <div key={table._id} className="table-card">
                    <h4>Table {table.tableNumber}</h4>
                    <p>Capacity: {table.capacity} guests</p>
                    <button
  className="btn-primary"
  onClick={() => {
    setFormData({
      tableId: table._id,
      reservationDate: searchParams.date,
      timeSlot: searchParams.timeSlot,
      numberOfGuests: searchParams.guests
    });
    // Wait for DOM to update before scrolling
    setTimeout(() => {
      const element = document.getElementById('reservation-form');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }}
>
  Select This Table
</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.tableId && (
            <div id="reservation-form" className="reservation-form-section">
              <h3>Confirm Reservation</h3>
              <form onSubmit={handleReservation} className="form">
                <div className="form-group">
                  <label>Selected Table</label>
                  <input 
                    type="text" 
                    value={`Table ${tables.find(t => t._id === formData.tableId)?.tableNumber || ''}`}
                    disabled 
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="text" value={formData.reservationDate} disabled />
                </div>
                <div className="form-group">
                  <label>Time Slot</label>
                  <input type="text" value={formData.timeSlot} disabled />
                </div>
                <div className="form-group">
                  <label>Number of Guests</label>
                  <input type="text" value={formData.numberOfGuests} disabled />
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Confirm Reservation'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {view === 'my-reservations' && (
        <div className="content">
          <h2>My Reservations</h2>
          {isLoading ? (
            <div className="loading">Loading reservations...</div>
          ) : reservations.length === 0 ? (
            <p className="no-data">You don't have any reservations yet.</p>
          ) : (
            <div className="reservations-list">
              {reservations.map(reservation => (
                <div key={reservation._id} className="reservation-card">
                  <div className="reservation-info">
                    <h3>Table {reservation.tableId?.tableNumber}</h3>
                    <p><strong>Date:</strong> {reservation.reservationDate}</p>
                    <p><strong>Time:</strong> {reservation.timeSlot}</p>
                    <p><strong>Guests:</strong> {reservation.numberOfGuests}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${reservation.status}`}>
                        {reservation.status}
                      </span>
                    </p>
                  </div>
                  {reservation.status === 'active' && (
                    <button 
                      onClick={() => cancelReservation(reservation._id)}
                      className="btn-danger"
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== ADMIN DASHBOARD ====================
function AdminDashboard({ token, user }) {
  const [view, setView] = useState('all-reservations');
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);

  useEffect(() => {
    fetchReservations();
    fetchTables();
  }, [filterDate]);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const url = filterDate 
        ? `${API_URL}/admin/reservations?date=${filterDate}`
        : `${API_URL}/admin/reservations`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReservations(data);
    } catch (error) {
      setError('Error fetching reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_URL}/tables`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const cancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/reservations/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Reservation cancelled successfully');
        fetchReservations();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Error cancelling reservation');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const updateReservation = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/admin/reservations/${editingReservation._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tableId: editingReservation.tableId._id || editingReservation.tableId,
          reservationDate: editingReservation.reservationDate,
          timeSlot: editingReservation.timeSlot,
          numberOfGuests: editingReservation.numberOfGuests
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Reservation updated successfully');
        setEditingReservation(null);
        fetchReservations();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Error updating reservation');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createTable = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tableNumber = parseInt(formData.get('tableNumber'));
    const capacity = parseInt(formData.get('capacity'));

    try {
      const response = await fetch(`${API_URL}/admin/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tableNumber, capacity })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Table created successfully');
        fetchTables();
        e.target.reset();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Error creating table');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="dashboard admin-dashboard">
      <div className="tabs">
        <button 
          className={view === 'all-reservations' ? 'tab active' : 'tab'}
          onClick={() => setView('all-reservations')}
        >
          All Reservations
        </button>
        <button 
          className={view === 'manage-tables' ? 'tab active' : 'tab'}
          onClick={() => setView('manage-tables')}
        >
          Manage Tables
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {view === 'all-reservations' && (
        <div className="content">
          <div className="admin-header">
            <h2>All Reservations</h2>
            <div className="filter-section">
              <label>Filter by Date:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="btn-secondary">
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="loading">Loading reservations...</div>
          ) : reservations.length === 0 ? (
            <p className="no-data">No reservations found.</p>
          ) : (
            <div className="reservations-list">
              {reservations.map(reservation => (
                <div key={reservation._id} className="reservation-card admin-card">
                  <div className="reservation-info">
                    <h3>Table {reservation.tableId?.tableNumber}</h3>
                    <p><strong>Customer:</strong> {reservation.userId?.name} ({reservation.userId?.email})</p>
                    <p><strong>Date:</strong> {reservation.reservationDate}</p>
                    <p><strong>Time:</strong> {reservation.timeSlot}</p>
                    <p><strong>Guests:</strong> {reservation.numberOfGuests}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${reservation.status}`}>
                        {reservation.status}
                      </span>
                    </p>
                  </div>
                  <div className="reservation-actions">
                    {reservation.status === 'active' && (
                      <>
                        <button 
                          onClick={() => setEditingReservation(reservation)}
                          className="btn-primary"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => cancelReservation(reservation._id)}
                          className="btn-danger"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {editingReservation && (
            <div className="modal-overlay" onClick={() => setEditingReservation(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Edit Reservation</h3>
                <form onSubmit={updateReservation} className="form">
                  <div className="form-group">
                    <label>Table</label>
                    <select
                      value={editingReservation.tableId._id || editingReservation.tableId}
                      onChange={(e) => setEditingReservation({
                        ...editingReservation,
                        tableId: e.target.value
                      })}
                      required
                    >
                      {tables.map(table => (
                        <option key={table._id} value={table._id}>
                          Table {table.tableNumber} (Capacity: {table.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={editingReservation.reservationDate}
                      onChange={(e) => setEditingReservation({
                        ...editingReservation,
                        reservationDate: e.target.value
                      })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Time Slot</label>
                    <input
                      type="time"
                      value={editingReservation.timeSlot}
                      onChange={(e) => setEditingReservation({
                        ...editingReservation,
                        timeSlot: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Number of Guests</label>
                    <input
                      type="number"
                      value={editingReservation.numberOfGuests}
                      onChange={(e) => setEditingReservation({
                        ...editingReservation,
                        numberOfGuests: parseInt(e.target.value)
                      })}
                      min="1"
                      max="20"
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="submit" className="btn-primary" disabled={isLoading}>
                      {isLoading ? 'Updating...' : 'Update Reservation'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditingReservation(null)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'manage-tables' && (
        <div className="content">
          <h2>Manage Tables</h2>
          
          <div className="add-table-section">
            <h3>Add New Table</h3>
            <form onSubmit={createTable} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label>Table Number</label>
                  <input
                    type="number"
                    name="tableNumber"
                    min="1"
                    required
                    placeholder="Enter table number"
                  />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    max="20"
                    required
                    placeholder="Enter capacity"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary">Add Table</button>
            </form>
          </div>

          <div className="tables-section">
            <h3>Current Tables</h3>
            {tables.length === 0 ? (
              <p className="no-data">No tables available.</p>
            ) : (
              <div className="tables-grid">
                {tables.map(table => (
                  <div key={table._id} className="table-card">
                    <h4>Table {table.tableNumber}</h4>
                    <p>Capacity: {table.capacity} guests</p>
                    <p>Status: {table.isAvailable ? '✅ Available' : '❌ Unavailable'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;