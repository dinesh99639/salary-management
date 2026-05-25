import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Globe, 
  PieChart, 
  Briefcase, 
  X, 
  CheckCircle, 
  AlertCircle,
  ArrowUpDown,
  Building2,
  Calendar,
  Mail,
  UserCheck
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'directory'

  // Metadata for dropdowns
  const [meta, setMeta] = useState({
    countries: [],
    departments: [],
    jobTitles: [],
    jobTitleDeptMap: {}
  });

  // Insights State
  const [insights, setInsights] = useState({
    global: { headcount: 0, totalBudget: 0, avgSalary: 0 },
    countries: [],
    departments: [],
    statuses: []
  });
  const [selectedCountry, setSelectedCountry] = useState('United States');
  const [jobTitleInsights, setJobTitleInsights] = useState([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);

  // Employee Directory State
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterJobTitle, setFilterJobTitle] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  // CRUD Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [modalEmployee, setModalEmployee] = useState({
    id: null,
    full_name: '',
    email: '',
    job_title: '',
    department: '',
    country: '',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0],
    status: 'Active'
  });
  const [modalErrors, setModalErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch Meta Categories
  const fetchMeta = async () => {
    try {
      const res = await fetch(`${API_URL}/meta`);
      if (res.ok) {
        const data = await res.json();
        setMeta(data);
        // Default country if available
        if (data.countries.length > 0 && !data.countries.includes(selectedCountry)) {
          setSelectedCountry(data.countries[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching meta:', err);
    }
  };

  // Fetch Insights
  const fetchInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await fetch(`${API_URL}/insights/salary`);
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      addToast('Failed to load salary insights.', 'error');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Fetch Job Title average salaries for selected country
  const fetchJobTitleInsights = useCallback(async (country) => {
    if (!country) return;
    try {
      const res = await fetch(`${API_URL}/insights/job-titles?country=${encodeURIComponent(country)}`);
      if (res.ok) {
        const data = await res.json();
        setJobTitleInsights(data);
      }
    } catch (err) {
      console.error('Error fetching job title insights:', err);
    }
  }, []);

  // Fetch Employees Grid (Paginated, filtered)
  const fetchEmployees = useCallback(async () => {
    setIsLoadingEmployees(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        country: filterCountry,
        department: filterDepartment,
        jobTitle: filterJobTitle,
        sortBy,
        sortOrder
      });

      const res = await fetch(`${API_URL}/employees?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      addToast('Failed to load employee list.', 'error');
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, filterCountry, filterDepartment, filterJobTitle, sortBy, sortOrder, addToast]);

  // Initial Bootstrapping
  useEffect(() => {
    fetchMeta();
    fetchInsights();
  }, []);

  // Sync Job Title insights with country changes
  useEffect(() => {
    fetchJobTitleInsights(selectedCountry);
  }, [selectedCountry, fetchJobTitleInsights]);

  // Sync Employees grid with dependencies
  useEffect(() => {
    fetchEmployees();
  }, [pagination.page, pagination.limit, filterCountry, filterDepartment, filterJobTitle, sortBy, sortOrder, fetchEmployees]);

  // Search debounce / instant trigger
  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400); // 400ms debounce
    return () => clearTimeout(delay);
  }, [search]);

  // Reset pagination on debounced search changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearch]);

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Reset Filters
  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setFilterCountry('');
    setFilterDepartment('');
    setFilterJobTitle('');
    setSortBy('id');
    setSortOrder('desc');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Sorting columns
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Open Add Modal
  const handleAddClick = () => {
    setModalMode('add');
    setModalEmployee({
      id: null,
      full_name: '',
      email: '',
      job_title: '',
      department: '',
      country: '',
      salary: '',
      hire_date: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setModalErrors([]);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleEditClick = (emp) => {
    setModalMode('edit');
    setModalEmployee({
      id: emp.id,
      full_name: emp.full_name,
      email: emp.email,
      job_title: emp.job_title,
      department: emp.department,
      country: emp.country,
      salary: emp.salary,
      hire_date: emp.hire_date,
      status: emp.status
    });
    setModalErrors([]);
    setShowModal(true);
  };

  // Delete Employee
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const handleDeleteClick = (id) => {
    if (deleteConfirmId === id) {
      // Confirmed delete
      performDelete(id);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000); // Reset confirm after 3s
      addToast('Click again to confirm deletion.', 'error');
    }
  };

  const performDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        addToast('Employee record deleted successfully.', 'success');
        fetchEmployees();
        fetchInsights();
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to delete employee.', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      addToast('Error communicating with backend.', 'error');
    }
  };

  // Form Cascading Option selection
  const handleModalChange = (field, value) => {
    setModalEmployee(prev => {
      const updated = { ...prev, [field]: value };
      // Cascade: Reset job title if department changes
      if (field === 'department') {
        updated.job_title = '';
      }
      return updated;
    });
  };

  // Submit Modal Form (Add / Edit)
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalErrors([]);

    // Client-side validations
    const errors = [];
    if (!modalEmployee.full_name.trim()) errors.push('Full name is required.');
    if (!modalEmployee.email.trim() || !modalEmployee.email.includes('@')) errors.push('Valid email is required.');
    if (!modalEmployee.department) errors.push('Department is required.');
    if (!modalEmployee.job_title) errors.push('Job title is required.');
    if (!modalEmployee.country) errors.push('Country is required.');
    
    const salaryNum = parseFloat(modalEmployee.salary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      errors.push('Salary must be a positive number.');
    }

    if (!modalEmployee.hire_date) errors.push('Hire date is required.');

    if (errors.length > 0) {
      setModalErrors(errors);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      ...modalEmployee,
      salary: salaryNum
    };

    try {
      const url = modalMode === 'add' 
        ? `${API_URL}/employees` 
        : `${API_URL}/employees/${modalEmployee.id}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        addToast(
          modalMode === 'add' ? 'Employee created successfully.' : 'Employee updated successfully.', 
          'success'
        );
        setShowModal(false);
        fetchEmployees();
        fetchInsights();
      } else {
        setModalErrors(data.errors || [data.error || 'Server error occurred.']);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setModalErrors(['Failed to connect to the backend server.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format Currencies
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Format Headcounts
  const formatNumber = (val) => {
    return new Intl.NumberFormat('en-US').format(val || 0);
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <DollarSign size={18} />
          </div>
          <span>CompVantage</span>
        </div>

        <ul className="nav-menu">
          <li 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <TrendingUp className="nav-item-icon" />
            <span>Salary Insights</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <Users className="nav-item-icon" />
            <span>Employee Directory</span>
          </li>
        </ul>

        <div className="sidebar-footer">
          <p>Logged in as HR Manager</p>
          <p style={{ marginTop: '4px', fontSize: '0.65rem' }}>Version 1.0.0 (Express/SQLite)</p>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        
        {/* Dynamic header row */}
        <header className="dashboard-title-row">
          <h1>{activeTab === 'dashboard' ? 'Compensation Insights Dashboard' : 'Employee Directory'}</h1>
          <p>
            {activeTab === 'dashboard' 
              ? 'Real-time compensation trends, distribution analytics, and global payroll spend' 
              : 'Add, update, search, and manage corporate employee records'}
          </p>
        </header>

        {/* Global Statistics Cards (always shown for quick high-level context) */}
        <section className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label">Total Headcount</span>
              <div className="kpi-icon-wrapper">
                <Users size={20} />
              </div>
            </div>
            <div className="kpi-value">{formatNumber(insights.global.headcount)}</div>
            <div className="kpi-subtext">Active corporate payroll staff</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label">Annual Payroll Budget</span>
              <div className="kpi-icon-wrapper">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(insights.global.totalBudget)}</div>
            <div className="kpi-subtext">Combined annual salaries</div>
          </div>

          <div className="kpi-card accent-pink">
            <div className="kpi-card-header">
              <span className="kpi-label">Average Annual Salary</span>
              <div className="kpi-icon-wrapper">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(insights.global.avgSalary)}</div>
            <div className="kpi-subtext">Global compensation mean</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label">Active Staff Ratio</span>
              <div className="kpi-icon-wrapper">
                <UserCheck size={20} />
              </div>
            </div>
            <div className="kpi-value">
              {insights.statuses.length > 0 
                ? `${Math.round(((insights.statuses.find(s => s.status === 'Active')?.headcount || 0) / (insights.global.headcount || 1)) * 100)}%` 
                : '100%'}
            </div>
            <div className="kpi-subtext">Percentage actively working</div>
          </div>
        </section>

        {/* TAB 1: Insights Dashboard */}
        {activeTab === 'dashboard' && (
          <section className="tab-dashboard">
            {/* Interactive geographic selectors */}
            <div className="chart-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Geographic Analysis Control</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select a country to load fine-grained salary averages and job role distributions</p>
                </div>
                <div className="selector-group">
                  <div style={{ position: 'relative' }}>
                    <Globe size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select 
                      className="styled-select" 
                      style={{ paddingLeft: '2.25rem' }}
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                    >
                      {meta.countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Country KPIs and SVG charts */}
            <div className="insights-row">
              {/* Country summary card */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <h3 className="chart-title">Compensation Bounds — {selectedCountry}</h3>
                    <p className="chart-subtitle">Direct statistical analysis for this country</p>
                  </div>
                </div>
                
                {isLoadingInsights ? (
                  <div className="empty-state">Loading bounding metrics...</div>
                ) : (
                  (() => {
                    const localData = insights.countries.find(c => c.country === selectedCountry) || {
                      min_salary: 0, max_salary: 0, avg_salary: 0, headcount: 0, total_salary: 0
                    };
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center', height: '100%' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Minimum Salary</div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--danger)' }}>{formatCurrency(localData.min_salary)}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Maximum Salary</div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--success)' }}>{formatCurrency(localData.max_salary)}</div>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(99, 102, 241, 0.03)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--card-hover-border)', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Country Average</div>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', margin: '0.25rem 0' }}>{formatCurrency(localData.avg_salary)}</div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Based on {formatNumber(localData.headcount)} local employee contracts</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Total Country Spend:</span>
                          <span style={{ fontWeight: 600, color: 'white' }}>{formatCurrency(localData.total_salary)}</span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Custom SVG Horizontal Bar Chart for Job Titles in selected country */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <h3 className="chart-title">Role Compensation Mean — {selectedCountry}</h3>
                    <p className="chart-subtitle">Average annual salary organized by job title</p>
                  </div>
                </div>

                <div className="chart-container">
                  {jobTitleInsights.length === 0 ? (
                    <div className="empty-state">No role-specific data.</div>
                  ) : (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                      {(() => {
                        const maxVal = Math.max(...jobTitleInsights.map(j => j.avg_salary), 1);
                        return jobTitleInsights.map((job) => {
                          const percentage = (job.avg_salary / maxVal) * 100;
                          return (
                            <div key={job.job_title} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                <span style={{ fontWeight: 500 }}>{job.job_title} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>(HC: {job.headcount})</span></span>
                                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{formatCurrency(job.avg_salary)}</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                <div 
                                  style={{ 
                                    width: `${percentage}%`, 
                                    height: '100%', 
                                    background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', 
                                    borderRadius: '4px',
                                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Department Comparison Horizontal table card */}
            <div className="chart-card" style={{ marginBottom: '2.5rem' }}>
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Department Compensation Comparison</h3>
                  <p className="chart-subtitle">Breakdown of average salary, headcount, and budget across standard departments</p>
                </div>
                <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Building2 size={16} />
                  <span style={{ fontSize: '0.8rem' }}>{insights.departments.length} Departments</span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ cursor: 'default' }}>Department</th>
                      <th style={{ cursor: 'default', textAlign: 'center' }}>Headcount</th>
                      <th style={{ cursor: 'default', textAlign: 'right' }}>Average Salary</th>
                      <th style={{ cursor: 'default', textAlign: 'right' }}>Min / Max Salary</th>
                      <th style={{ cursor: 'default', textAlign: 'right' }}>Total Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.departments.map(dept => (
                      <tr key={dept.department}>
                        <td style={{ fontWeight: 600, color: 'white' }}>{dept.department}</td>
                        <td style={{ textAlign: 'center' }}>{formatNumber(dept.headcount)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-primary)' }}>{formatCurrency(dept.avg_salary)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {formatCurrency(dept.min_salary)} – {formatCurrency(dept.max_salary)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(dept.total_salary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: Employee Directory */}
        {activeTab === 'directory' && (
          <section className="tab-directory">
            {/* Search, Filter, and Action Buttons */}
            <div className="table-controls">
              
              <div className="search-wrapper">
                <Search className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search 10,000 employees by name..." 
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="filter-group">
                <select 
                  className="styled-select" 
                  value={filterCountry}
                  onChange={(e) => {
                    setFilterCountry(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  <option value="">All Countries</option>
                  {meta.countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select 
                  className="styled-select" 
                  value={filterDepartment}
                  onChange={(e) => {
                    setFilterDepartment(e.target.value);
                    setFilterJobTitle(''); // Clear cascading title
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  <option value="">All Departments</option>
                  {meta.departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {filterDepartment && (
                  <select 
                    className="styled-select" 
                    value={filterJobTitle}
                    onChange={(e) => {
                      setFilterJobTitle(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="">All Roles</option>
                    {(meta.jobTitleDeptMap[filterDepartment] || []).map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                )}

                {(search || filterCountry || filterDepartment || filterJobTitle || sortBy !== 'id') && (
                  <button className="btn-secondary" onClick={resetFilters} style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
                    Reset
                  </button>
                )}

                <button className="btn-primary" onClick={handleAddClick}>
                  <Plus size={16} />
                  <span>Add Employee</span>
                </button>
              </div>

            </div>

            {/* Main Employees Grid */}
            <div className="table-card">
              {isLoadingEmployees ? (
                <div className="empty-state" style={{ minHeight: '350px' }}>
                  <TrendingUp className="empty-state-icon" style={{ animation: 'spin 1.5s infinite linear' }} />
                  <h3>Loading Employee Records...</h3>
                  <p>Searching through our database of 10,000 employees</p>
                </div>
              ) : employees.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '350px' }}>
                  <Users className="empty-state-icon" />
                  <h3>No Employees Found</h3>
                  <p>Try modifying your search query or filters.</p>
                  <button className="btn-secondary" onClick={resetFilters} style={{ marginTop: '0.5rem' }}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('full_name')} style={{ width: '25%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>Employee</span>
                          <ArrowUpDown size={12} style={{ opacity: sortBy === 'full_name' ? 1 : 0.4 }} />
                        </div>
                      </th>
                      <th style={{ width: '20%', cursor: 'default' }}>Title & Department</th>
                      <th style={{ width: '15%', cursor: 'default' }}>Country</th>
                      <th onClick={() => handleSort('salary')} style={{ width: '15%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>Salary (USD)</span>
                          <ArrowUpDown size={12} style={{ opacity: sortBy === 'salary' ? 1 : 0.4 }} />
                        </div>
                      </th>
                      <th onClick={() => handleSort('hire_date')} style={{ width: '13%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>Hire Date</span>
                          <ArrowUpDown size={12} style={{ opacity: sortBy === 'hire_date' ? 1 : 0.4 }} />
                        </div>
                      </th>
                      <th style={{ width: '12%', cursor: 'default' }}>Status</th>
                      <th style={{ width: '10%', cursor: 'default', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div className="employee-name">{emp.full_name}</div>
                          <span className="employee-email">{emp.email}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: 'white' }}>{emp.job_title}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Globe size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>{emp.country}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                          {formatCurrency(emp.salary)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>{emp.hire_date}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`pill pill-${emp.status.toLowerCase().replace(' ', '-')}`}>
                            <span 
                              style={{ 
                                width: '6px', 
                                height: '6px', 
                                borderRadius: '50%', 
                                background: emp.status === 'Active' ? 'var(--success)' : emp.status === 'On Leave' ? 'var(--warning)' : 'var(--danger)'
                              }}
                            />
                            {emp.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'center' }}>
                            <button 
                              className="btn-icon edit" 
                              title="Edit Employee" 
                              onClick={() => handleEditClick(emp)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className={`btn-icon delete ${deleteConfirmId === emp.id ? 'active' : ''}`}
                              title={deleteConfirmId === emp.id ? 'Click again to confirm!' : 'Delete Employee'} 
                              onClick={() => handleDeleteClick(emp.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {!isLoadingEmployees && employees.length > 0 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing <span style={{ fontWeight: 600, color: 'white' }}>{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span style={{ fontWeight: 600, color: 'white' }}>{Math.min(pagination.page * pagination.limit, pagination.totalCount)}</span> of{' '}
                  <span style={{ fontWeight: 600, color: 'white' }}>{formatNumber(pagination.totalCount)}</span> employees
                </div>

                <div className="pagination-buttons">
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </button>
                  
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Page <span style={{ fontWeight: 600, color: 'white', margin: '0 0.25rem' }}>{pagination.page}</span> of {pagination.totalPages}
                  </div>

                  <button 
                    className="btn-secondary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

      </main>

      {/* CRUD Overlay Dialog Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add Employee Record' : 'Edit Employee Record'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            {modalErrors.length > 0 && (
              <div className="validation-error-banner">
                <div style={{ display: 'flex', gap: '0.5rem', fontWeight: 600, alignItems: 'center' }}>
                  <AlertCircle size={16} />
                  <span>Validation Failures:</span>
                </div>
                <ul>
                  {modalErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <form onSubmit={handleModalSubmit}>
              <div className="form-grid">
                
                {/* Full name */}
                <div className="form-group form-group-full">
                  <label htmlFor="fullname">Full Name</label>
                  <input 
                    type="text" 
                    id="fullname" 
                    className="styled-input" 
                    placeholder="e.g. Dinesh Kumar"
                    value={modalEmployee.full_name}
                    onChange={(e) => handleModalChange('full_name', e.target.value)}
                    required
                  />
                </div>

                {/* Email address */}
                <div className="form-group form-group-full">
                  <label htmlFor="email">Work Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    className="styled-input" 
                    placeholder="e.g. dinesh.kumar@organization.com"
                    value={modalEmployee.email}
                    onChange={(e) => handleModalChange('email', e.target.value)}
                    required
                  />
                </div>

                {/* Department Selection */}
                <div className="form-group">
                  <label htmlFor="dept">Department</label>
                  <select 
                    id="dept" 
                    className="styled-select" 
                    style={{ background: 'var(--bg-tertiary)' }}
                    value={modalEmployee.department}
                    onChange={(e) => handleModalChange('department', e.target.value)}
                    required
                  >
                    <option value="">Select Dept</option>
                    {meta.departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Cascading Job Title Selection */}
                <div className="form-group">
                  <label htmlFor="jobtitle">Job Title</label>
                  <select 
                    id="jobtitle" 
                    className="styled-select" 
                    style={{ background: 'var(--bg-tertiary)' }}
                    value={modalEmployee.job_title}
                    onChange={(e) => handleModalChange('job_title', e.target.value)}
                    disabled={!modalEmployee.department}
                    required
                  >
                    <option value="">Select Role</option>
                    {modalEmployee.department && (meta.jobTitleDeptMap[modalEmployee.department] || []).map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                {/* Country */}
                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <select 
                    id="country" 
                    className="styled-select" 
                    style={{ background: 'var(--bg-tertiary)' }}
                    value={modalEmployee.country}
                    onChange={(e) => handleModalChange('country', e.target.value)}
                    required
                  >
                    <option value="">Select Country</option>
                    {meta.countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Salary */}
                <div className="form-group">
                  <label htmlFor="salary">Annual Salary (USD)</label>
                  <input 
                    type="number" 
                    id="salary" 
                    className="styled-input" 
                    placeholder="e.g. 85000"
                    value={modalEmployee.salary}
                    onChange={(e) => handleModalChange('salary', e.target.value)}
                    min="1"
                    step="1"
                    required
                  />
                </div>

                {/* Hire Date */}
                <div className="form-group">
                  <label htmlFor="hiredate">Hire Date</label>
                  <input 
                    type="date" 
                    id="hiredate" 
                    className="styled-input" 
                    value={modalEmployee.hire_date}
                    onChange={(e) => handleModalChange('hire_date', e.target.value)}
                    required
                  />
                </div>

                {/* Status */}
                <div className="form-group">
                  <label htmlFor="status">Employment Status</label>
                  <select 
                    id="status" 
                    className="styled-select" 
                    style={{ background: 'var(--bg-tertiary)' }}
                    value={modalEmployee.status}
                    onChange={(e) => handleModalChange('status', e.target.value)}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>

              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Containers */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? <CheckCircle size={16} style={{ color: 'var(--success)' }} /> : <AlertCircle size={16} style={{ color: 'var(--danger)' }} />}
            <span>{t.message}</span>
            <button 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto', display: 'flex', alignItems: 'center' }} 
              onClick={() => removeToast(t.id)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
