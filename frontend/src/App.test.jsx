// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import App from './App.jsx';

// Mock standard fetch API responses
const mockMetaResponse = {
  countries: ['United States', 'Germany'],
  departments: ['Engineering', 'Marketing'],
  jobTitles: ['Software Engineer', 'Marketing Manager'],
  jobTitleDeptMap: {
    Engineering: ['Software Engineer'],
    Marketing: ['Marketing Manager']
  }
};

const mockInsightsResponse = {
  global: { headcount: 2, totalBudget: 180000, avgSalary: 90000 },
  countries: [
    { country: 'United States', headcount: 1, min_salary: 100000, max_salary: 100000, avg_salary: 100000, total_salary: 100000 },
    { country: 'Germany', headcount: 1, min_salary: 80000, max_salary: 80000, avg_salary: 80000, total_salary: 80000 }
  ],
  departments: [
    { department: 'Engineering', headcount: 1, min_salary: 100000, max_salary: 100000, avg_salary: 100000, total_salary: 100000 },
    { department: 'Marketing', headcount: 1, min_salary: 80000, max_salary: 80000, avg_salary: 80000, total_salary: 80000 }
  ],
  statuses: [
    { status: 'Active', headcount: 2 }
  ]
};

const mockJobTitleInsightsResponse = [
  { job_title: 'Software Engineer', headcount: 1, min_salary: 100000, max_salary: 100000, avg_salary: 100000 }
];

describe('Vite React Frontend TDD Component Suite', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('/meta')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetaResponse)
        });
      }
      if (url.includes('/insights/salary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockInsightsResponse)
        });
      }
      if (url.includes('/insights/job-titles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockJobTitleInsightsResponse)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ employees: [], pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 1 } })
      });
    }));
  });

  it('should render the CompVantage navigation and sidebar', async () => {
    render(<App />);

    expect(screen.getByText('CompVantage')).toBeDefined();
    expect(screen.getByText('Salary Insights')).toBeDefined();
    expect(screen.getByText('Employee Directory')).toBeDefined();
  });

  it('should display global KPI metric cards with mock data', async () => {
    render(<App />);

    await waitFor(() => {
      // Total Headcount (global headcount is 2)
      expect(screen.getAllByText('2')[0]).toBeDefined();
      // Annual Payroll Budget (global totalBudget is 180,000)
      expect(screen.getAllByText('$180,000')[0]).toBeDefined();
      // Average Salary (global avgSalary is 90,000)
      expect(screen.getAllByText('$90,000')[0]).toBeDefined();
    });
  });
});
