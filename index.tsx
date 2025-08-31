/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import React from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPE DEFINITIONS ---
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
}

interface CategoryConfig {
    name: string;
    color: string;
    icon: string;
}

const CATEGORIES_CONFIG: CategoryConfig[] = [
    { name: "Food", color: "#ffc107", icon: "las la-utensils" },
    { name: "Transport", color: "#17a2b8", icon: "las la-bus" },
    { name: "Entertainment", color: "#6f42c1", icon: "las la-film" },
    { name: "Utilities", color: "#fd7e14", icon: "las la-bolt" },
    { name: "Shopping", color: "#20c997", icon: "las la-shopping-bag" },
    { name: "Rent", color: "#e83e8c", icon: "las la-home" },
    { name: "Health", color: "#dc3545", icon: "las la-heartbeat" },
    { name: "Other", color: "#6c757d", icon: "las la-ellipsis-h" },
];

const categoryConfigMap = Object.fromEntries(CATEGORIES_CONFIG.map(c => [c.name, c]));


// --- HELPER FUNCTIONS ---
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  // Add timezone offset to prevent date from shifting
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// --- REACT COMPONENTS ---

const ExpenseEditModal = ({ isOpen, onClose, onSave, expense }: { isOpen: boolean, onClose: () => void, onSave: (expense: Expense) => void, expense: Expense | null }) => {
    const [description, setDescription] = React.useState('');
    const [amount, setAmount] = React.useState('');
    const [category, setCategory] = React.useState('');
    const [date, setDate] = React.useState('');
    const modalRef = React.useRef<HTMLFormElement>(null);

    React.useEffect(() => {
        if (expense) {
            setDescription(expense.description);
            setAmount(expense.amount.toString());
            setCategory(expense.category);
            setDate(expense.date);
        }
    }, [expense]);

    React.useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (expense) {
             onSave({ ...expense, description, amount: parseFloat(amount), category, date });
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    if (!isOpen || !expense) return null;

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <form className="modal-content" ref={modalRef} onSubmit={handleSave} role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
                <div className="modal-header">
                    <h2 id="edit-modal-title" className="card-title"><i className="las la-pen"></i> Edit Expense</h2>
                    <button type="button" onClick={onClose} className="btn-icon" aria-label="Close"><i className="las la-times"></i></button>
                </div>
                <div className="modal-body expense-form">
                     <div className="form-group">
                        <label htmlFor="edit-description">Description</label>
                        <input id="edit-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-amount">Amount ($)</label>
                        <input id="edit-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0.01" step="0.01" required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-category">Category</label>
                         <CategorySelect value={category} onChange={setCategory} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-date">Date</label>
                        <input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                      </div>
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn">Cancel</button>
                    <button type="submit" className="btn btn-primary"><i className="las la-save"></i> Save Changes</button>
                </div>
            </form>
        </div>
    );
};


const BudgetEditModal = ({ isOpen, onClose, onSave, currentBudget }: { isOpen: boolean, onClose: () => void, onSave: (newBudget: number) => void, currentBudget: number }) => {
    const [tempBudget, setTempBudget] = React.useState(currentBudget.toString());
    const modalRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setTempBudget(currentBudget.toString());
    }, [isOpen, currentBudget]);

    React.useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleSave = () => {
        onSave(parseFloat(tempBudget) || 0);
    };
    
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const budgetValue = parseFloat(tempBudget) || 0;
    const sliderMax = Math.max(2000, currentBudget * 2);

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="modal-header">
                    <h2 id="modal-title" className="card-title"><i className="las la-coins"></i> Edit Monthly Budget</h2>
                    <button onClick={onClose} className="btn-icon" aria-label="Close"><i className="las la-times"></i></button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label htmlFor="budget-input">Budget Amount ($)</label>
                        <input
                            id="budget-input"
                            type="number"
                            value={tempBudget}
                            onChange={(e) => setTempBudget(e.target.value)}
                            placeholder="e.g., 1000"
                            min="0"
                            step="50"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="budget-slider">Budget Slider</label>
                        <input
                            id="budget-slider"
                            type="range"
                            min="0"
                            max={sliderMax}
                            step="50"
                            value={budgetValue}
                            onChange={(e) => setTempBudget(e.target.value)}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary"><i className="las la-save"></i> Save Budget</button>
                </div>
            </div>
        </div>
    );
};

const Header = ({ budget, onEdit, theme, setTheme }: { budget: number, onEdit: () => void, theme: string, setTheme: (t: string) => void }) => {
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <header className="app-header">
            <h1><i className="las la-wallet"></i> Hylton's Personal Budget Tracker</h1>
            <div className="header-controls">
                <div className="budget-setter">
                    <span className="budget-label">Monthly Budget:</span>
                    <div className="budget-display">
                        <span className="budget-value">${budget.toFixed(2)}</span>
                        <button onClick={onEdit} className="btn-icon btn-edit" aria-label="Edit Budget"><i className="las la-pen"></i></button>
                    </div>
                </div>
                 <button onClick={toggleTheme} className="btn-icon theme-toggle" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                    <i className={theme === 'light' ? 'las la-moon' : 'las la-sun'}></i>
                </button>
            </div>
        </header>
    );
};

const BudgetProgressBar = ({ total, budget }: { total: number; budget: number }) => {
    const percentage = budget > 0 ? (total / budget) * 100 : 0;
    const cappedPercentage = Math.min(percentage, 100);

    let progressBarClass = 'normal';
    if (percentage > 90) {
        progressBarClass = 'danger';
    } else if (percentage > 70) {
        progressBarClass = 'warning';
    }

    return (
        <div className="progress-bar-container">
            <div className="progress-bar-info">
                <span>Spent: ${total.toFixed(2)}</span>
                <span>Budget: ${budget.toFixed(2)}</span>
            </div>
            <div className="progress-bar" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
                <div
                    className={`progress-bar-fill ${progressBarClass}`}
                    style={{ width: `${cappedPercentage}%` }}
                />
            </div>
            <div className="progress-bar-percentage">
                 {percentage > 100 && <span className="over-budget-indicator"><i className="las la-exclamation-triangle"></i> Over Budget!</span>}
                <span>{percentage.toFixed(1)}% Used</span>
            </div>
        </div>
    );
};

const Summary = ({ total, budget }: { total: number; budget: number }) => {
  const remaining = budget - total;
  const remainingColor = remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)';

  return (
    <div className="summary-card card">
      <h2 className="card-title">Summary</h2>
      <div className="summary-metrics">
        <div className="metric">
          <span className="metric-label">Total Spent</span>
          <span className="metric-value">${total.toFixed(2)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Remaining Budget</span>
          <span className="metric-value" style={{ color: remainingColor }}>
            ${remaining.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

const CategoryChart = ({ expenses }: { expenses: Expense[] }) => {
    const totalSpent = React.useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);

    const categoryTotals = React.useMemo(() => {
        if (!totalSpent) return [];
        const totals = expenses.reduce((acc: { [key: string]: number }, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});

        return Object.entries(totals)
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: (amount / totalSpent) * 100,
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [expenses, totalSpent]);

    if (expenses.length === 0) {
        return (
            <div className="chart-card card">
                <h2 className="card-title">Spending by Category</h2>
                <div className="empty-state">
                    <i className="las la-chart-pie"></i>
                    <p>No expense data to display.</p>
                </div>
            </div>
        );
    }
    
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercentage = 0;

    return (
        <div className="chart-card card">
            <h2 className="card-title">Spending by Category</h2>
            <div className="chart-container">
                <svg width="200" height="200" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={radius} fill="transparent" stroke="var(--color-surface-secondary)" strokeWidth="25" />
                    {categoryTotals.map((item) => {
                        const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -accumulatedPercentage / 100 * circumference;
                        accumulatedPercentage += item.percentage;
                        return (
                            <circle
                                key={item.category}
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="transparent"
                                stroke={categoryConfigMap[item.category]?.color || "#6c757d"}
                                strokeWidth="25"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                transform="rotate(-90 100 100)"
                            />
                        );
                    })}
                     <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight="bold" fill="var(--color-text-primary)">
                        ${totalSpent.toFixed(0)}
                    </text>
                </svg>
                <ul className="chart-legend">
                    {categoryTotals.map((item) => (
                        <li key={item.category} className="legend-item">
                            <span className="legend-color-key" style={{ backgroundColor: categoryConfigMap[item.category]?.color || "#6c757d" }}></span>
                            <span className="legend-label">{item.category}</span>
                            <span className="legend-percentage">{item.percentage.toFixed(1)}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const TrendChart = ({ expenses }: { expenses: Expense[] }) => {
    const trendData = React.useMemo(() => {
        const data: { [key: string]: number } = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            data[date.toISOString().split('T')[0]] = 0;
        }

        expenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const userTimezoneOffset = expenseDate.getTimezoneOffset() * 60000;
            const correctedDate = new Date(expenseDate.getTime() + userTimezoneOffset);
            const key = correctedDate.toISOString().split('T')[0];

            if (key in data) {
                data[key] += expense.amount;
            }
        });

        return Object.entries(data).map(([date, amount]) => ({
            date,
            amount,
            label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));
    }, [expenses]);

    if (expenses.length === 0) {
        return (
            <div className="chart-card card">
                <h2 className="card-title">Spending Trend (Last 7 Days)</h2>
                <div className="empty-state">
                    <i className="las la-chart-bar"></i>
                    <p>No recent expenses to show.</p>
                </div>
            </div>
        );
    }
    
    const maxAmount = Math.max(...trendData.map(d => d.amount), 1);
    const chartHeight = 150;
    const barWidth = 30;
    const gap = 15;

    return (
        <div className="chart-card card">
            <h2 className="card-title">Spending Trend (Last 7 Days)</h2>
            <div className="trend-chart-container">
                <svg width={trendData.length * (barWidth + gap)} height={chartHeight + 30} aria-label="Bar chart showing spending over the last 7 days">
                    {trendData.map((d, i) => {
                        const barHeight = (d.amount / maxAmount) * chartHeight;
                        return (
                            <g key={d.date} transform={`translate(${i * (barWidth + gap)}, 0)`}>
                                <rect className="trend-chart-bar" y={chartHeight - barHeight} width={barWidth} height={barHeight} rx="4">
                                   <title>{`${d.label}: $${d.amount.toFixed(2)}`}</title>
                                </rect>
                                <text x={barWidth / 2} y={chartHeight + 20} textAnchor="middle" fontSize="12" fill="var(--color-text-secondary)">
                                    {d.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

const CategorySelect = ({
    value,
    onChange,
    placeholder = "Select...",
    multiple = false,
}: {
    value: string | string[];
    onChange: (value: any) => void;
    placeholder?: string;
    multiple?: boolean;
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (categoryName: string) => {
        if (multiple) {
            const currentValue = Array.isArray(value) ? value : [];
            const newSelection = currentValue.includes(categoryName)
                ? currentValue.filter(c => c !== categoryName)
                : [...currentValue, categoryName];
            onChange(newSelection);
        } else {
            onChange(categoryName);
            setIsOpen(false);
        }
    };

    const displayValue = () => {
        if (multiple) {
            const selected = Array.isArray(value) ? value : [];
            if (selected.length === 0) return <span className="placeholder">{placeholder}</span>;
            return (
                <div className="selected-categories-container">
                    {selected.map(catName => {
                        const config = categoryConfigMap[catName];
                        if (!config) return null;
                        return (
                            <span key={catName} className="category-tag-sm" style={{ backgroundColor: config.color }}>
                                <i className={config.icon}></i> {config.name}
                            </span>
                        );
                    })}
                </div>
            );
        }
        const config = typeof value === 'string' ? categoryConfigMap[value] : null;
        if (!config) return <span className="placeholder">{placeholder}</span>;
        return (
            <div className="category-label">
                <i className={config.icon} style={{ color: config.color }}></i> {config.name}
            </div>
        );
    };

    return (
        <div className="category-select-container" ref={containerRef}>
            <button type="button" className="category-select-button" onClick={() => setIsOpen(!isOpen)} aria-haspopup="listbox" aria-expanded={isOpen}>
                {displayValue()}
                <i className={`las la-angle-down dropdown-arrow ${isOpen ? 'open' : ''}`}></i>
            </button>
            {isOpen && (
                <ul className="category-select-dropdown" role="listbox">
                    {CATEGORIES_CONFIG.map(config => (
                        <li
                            key={config.name}
                            className="category-select-item"
                            onClick={() => handleSelect(config.name)}
                            role="option"
                            aria-selected={multiple ? (value as string[]).includes(config.name) : value === config.name}
                        >
                            {multiple && (
                                <input
                                    type="checkbox"
                                    checked={(value as string[]).includes(config.name)}
                                    readOnly
                                />
                            )}
                            <div className="category-label">
                                <i className={config.icon} style={{ color: config.color }}></i> {config.name}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


const ExpenseForm = ({ addExpense }: { addExpense: (expense: Omit<Expense, 'id'>) => void }) => {
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [category, setCategory] = React.useState(CATEGORIES_CONFIG[0].name);
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || parseFloat(amount) <= 0) {
      alert("Please fill in all fields with valid values.");
      return;
    }
    addExpense({
      description,
      amount: parseFloat(amount),
      category,
      date,
    });
    // Reset form
    setDescription('');
    setAmount('');
    setCategory(CATEGORIES_CONFIG[0].name);
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="form-card card">
       <h2 className="card-title"><i className="las la-plus-circle"></i> Add New Expense</h2>
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Coffee" required />
          </div>
          <div className="form-group">
            <label htmlFor="amount">Amount ($)</label>
            <input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="0.01" step="0.01" required />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
             <CategorySelect value={category} onChange={setCategory} />
          </div>
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary"><i className="las la-plus-circle"></i> Add Expense</button>
        </form>
    </div>
  );
};

const Filters = ({ filters, setFilters, deleteExpenses, selectedIds, onReset, onExportCsv, onExportJson }: { filters: any; setFilters: any; deleteExpenses: (ids: string[]) => void; selectedIds: Set<string>; onReset: () => void; onExportCsv: () => void; onExportJson: () => void; }) => {
    return (
        <div className="filters-card card">
            <h2 className="card-title"><i className="las la-filter"></i> Filters & Actions</h2>
            <div className="filter-controls">
                <div className="form-group">
                    <label htmlFor="text-filter">Description</label>
                    <input id="text-filter" type="text" placeholder="Search..." value={filters.text} onChange={e => setFilters({ ...filters, text: e.target.value })} />
                </div>
                <div className="form-group">
                    <label htmlFor="category-filter">Category</label>
                    <CategorySelect
                        value={filters.categories}
                        onChange={cats => setFilters({...filters, categories: cats})}
                        multiple={true}
                        placeholder="All Categories"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="start-date">Start Date</label>
                    <input id="start-date" type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })}/>
                </div>
                <div className="form-group">
                    <label htmlFor="end-date">End Date</label>
                    <input id="end-date" type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })}/>
                </div>
            </div>
            <div className="filter-actions">
                <button onClick={onReset} className="btn"><i className="las la-undo"></i> Reset Filters</button>
                <div className="action-buttons-group">
                    <button onClick={onExportCsv} className="btn"><i className="las la-file-csv"></i> Export CSV</button>
                    <button onClick={onExportJson} className="btn"><i className="las la-file-code"></i> Export JSON</button>
                    {selectedIds.size > 0 && (
                        <button onClick={() => deleteExpenses(Array.from(selectedIds))} className="btn btn-danger">
                            <i className="las la-trash"></i> Delete ({selectedIds.size}) Selected
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ExpenseList = ({ expenses, deleteExpenses, selectedIds, setSelectedIds, onEdit }: { expenses: Expense[]; deleteExpenses: (ids: string[]) => void; selectedIds: Set<string>; setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>; onEdit: (expense: Expense) => void; }) => {
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(expenses.map(exp => exp.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  return (
    <div className="list-card card">
      <h2 className="card-title">Expense History</h2>
      <div className="expense-list">
        {expenses.length === 0 ? (
          <div className="empty-state">
            <i className="las la-receipt"></i>
            <p>No expenses match your current filters.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" onChange={handleSelectAll} checked={expenses.length > 0 && selectedIds.size === expenses.length} aria-label="Select all expenses"/></th>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id} className={selectedIds.has(expense.id) ? 'selected' : ''}>
                  <td><input type="checkbox" checked={selectedIds.has(expense.id)} onChange={() => handleSelectOne(expense.id)}/></td>
                  <td>{expense.description}</td>
                  <td>
                    <span 
                      className="category-tag" 
                      style={{backgroundColor: categoryConfigMap[expense.category]?.color || '#6c757d'}}
                    >
                      <i className={categoryConfigMap[expense.category]?.icon}></i> {expense.category}
                    </span>
                  </td>
                  <td>{formatDate(expense.date)}</td>
                  <td className="amount-cell">${expense.amount.toFixed(2)}</td>
                  <td className="action-cell">
                    <button onClick={() => onEdit(expense)} className="btn-icon" aria-label={`Edit ${expense.description}`}>
                      <i className="las la-pen"></i>
                    </button>
                    <button onClick={() => deleteExpenses([expense.id])} className="btn-icon btn-danger" aria-label={`Delete ${expense.description}`}>
                      <i className="las la-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const Chatbot = ({ expenses, addExpense }: { expenses: Omit<Expense, 'id'>[], addExpense: (expense: Omit<Expense, 'id'>) => void }) => {
    const [messages, setMessages] = React.useState<ChatMessage[]>([
        { role: 'system', text: "Hello! Ask about your spending or add expenses (e.g., 'spent 15 on lunch and 30 for gas')." }
    ]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const expenseData = JSON.stringify(expenses, null, 2);
        
        const validCategories = CATEGORIES_CONFIG.map(c => c.name);
        const today = new Date().toISOString().split('T')[0];

        const systemInstruction = `You are a dual-function personal finance assistant. Your capabilities are:
1.  **Expense Entry:** Parse user messages to create an array of new expense entries. Find all valid expenses mentioned.
2.  **Answering Questions:** Analyze provided JSON expense data to answer questions about spending.

**Instructions:**
- First, determine the user's intent: Are they trying to add one or more expenses ('EXPENSE_ENTRY') or ask a question ('QUESTION')?
- If the intent is unclear, classify it as 'UNCLEAR'.
- Today's date is ${today}. Use this for relative dates like 'today' or 'yesterday'.
- Valid expense categories are: [${validCategories.join(', ')}]. If the user provides a category not on this list, map it to the closest valid one or 'Other'.
- Respond ONLY in the specified JSON format.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                intent: { type: Type.STRING, enum: ["QUESTION", "EXPENSE_ENTRY", "UNCLEAR"], description: "The user's primary intent." },
                expenses: {
                    type: Type.ARRAY,
                    nullable: true,
                    description: "An array of expense objects parsed from the user's message.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            amount: { type: Type.NUMBER, description: "The numeric amount of the expense." },
                            description: { type: Type.STRING, description: "A brief description of the expense." },
                            category: { type: Type.STRING, enum: validCategories, description: "The category of the expense from the provided list." },
                            date: { type: Type.STRING, description: "The date of the expense in YYYY-MM-DD format." }
                        },
                        required: ["amount", "description", "category", "date"]
                    }
                },
                answer: { type: Type.STRING, nullable: true, description: "A concise, helpful answer if the intent is 'QUESTION'." },
                clarification: { type: Type.STRING, nullable: true, description: "A question to ask the user if details are incomplete or the intent is unclear." }
            },
            required: ["intent"]
        };
        
        const prompt = `Based on the rules and the data below, process the user's request.

Current Filtered Expense Data (for Q&A):
${expenseData}

User's Request:
"${input}"`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema,
                }
            });

            const parsedResponse = JSON.parse(response.text);
            
            switch (parsedResponse.intent) {
                case 'EXPENSE_ENTRY':
                    if (parsedResponse.expenses && parsedResponse.expenses.length > 0) {
                        let confirmationText = `Added ${parsedResponse.expenses.length} expense(s):`;
                        parsedResponse.expenses.forEach((expense: Omit<Expense, 'id'>) => {
                            addExpense(expense);
                            confirmationText += `\n- ✅ ${expense.description} | ${expense.category} | $${expense.amount.toFixed(2)}`;
                        });
                        setMessages(prev => [...prev, { role: 'system', text: confirmationText.replace(/\n/g, '<br />') }]);
                    } else {
                        const clarification = parsedResponse.clarification || "I couldn't add that expense. Please provide an amount, description, and category.";
                        setMessages(prev => [...prev, { role: 'model', text: clarification }]);
                    }
                    break;
                case 'QUESTION':
                    const answer = parsedResponse.answer || "I found an answer, but it's empty.";
                    setMessages(prev => [...prev, { role: 'model', text: answer }]);
                    break;
                case 'UNCLEAR':
                default:
                    const clarification = parsedResponse.clarification || "I'm not sure how to help. You can ask about your spending or tell me to add an expense.";
                    setMessages(prev => [...prev, { role: 'model', text: clarification }]);
                    break;
            }

        } catch (error) {
            console.error("Gemini API Error:", error);
            const errorMessage: ChatMessage = { role: 'system', text: "Sorry, I had trouble understanding that. Please check your API key and try rephrasing." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chatbot-card card">
            <h2 className="card-title"><i className="las la-robot"></i> AI Budget Assistant</h2>
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                        <p dangerouslySetInnerHTML={{ __html: msg.text }}></p>
                    </div>
                ))}
                {isLoading && (
                    <div className="chat-message model">
                        <div className="loading-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask or add an expense..."
                    disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading} className="btn btn-primary"><i className="las la-paper-plane"></i></button>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
const App = () => {
  const [expenses, setExpenses] = React.useState<Expense[]>(() => {
    try {
      const savedExpenses = localStorage.getItem('expenses');
      return savedExpenses ? JSON.parse(savedExpenses) : [];
    } catch (e) { return []; }
  });

  const [budget, setBudget] = React.useState(() => {
    try {
      const savedBudget = localStorage.getItem('budget');
      return savedBudget ? parseFloat(savedBudget) : 1000;
    } catch (e) { return 1000; }
  });

  const [filters, setFilters] = React.useState({ text: '', categories: [] as string[], startDate: '', endDate: '' });
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isBudgetModalOpen, setIsBudgetModalOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);

  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  React.useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  React.useEffect(() => {
    localStorage.setItem('budget', budget.toString());
  }, [budget]);

  React.useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.className = theme === 'dark' ? 'dark-mode' : '';
  }, [theme]);

  const addExpense = React.useCallback((newExpense: Omit<Expense, 'id'>) => {
    const expenseWithId = { ...newExpense, id: `${Date.now()}-${Math.random()}` };
    setExpenses(prev => [expenseWithId, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const deleteExpenses = React.useCallback((ids: string[]) => {
    if (window.confirm(`Are you sure you want to delete ${ids.length} expense(s)?`)) {
      setExpenses(prev => prev.filter(exp => !ids.includes(exp.id)));
      setSelectedIds(new Set()); // Clear selection after deletion
    }
  }, []);
  
   const handleUpdateExpense = React.useCallback((updatedExpense: Expense) => {
        setExpenses(prev => prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setEditingExpense(null);
    }, []);

  const resetFilters = React.useCallback(() => {
    setFilters({ text: '', categories: [], startDate: '', endDate: '' });
  }, []);
  
  const handleSaveBudget = React.useCallback((newBudget: number) => {
    setBudget(newBudget);
    setIsBudgetModalOpen(false);
  }, []);

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      if (startDate) startDate.setHours(0,0,0,0);
      if (endDate) endDate.setHours(23,59,59,999);

      const textMatch = exp.description.toLowerCase().includes(filters.text.toLowerCase());
      const categoryMatch = filters.categories.length === 0 || filters.categories.includes(exp.category);
      const startDateMatch = !startDate || expDate >= startDate;
      const endDateMatch = !endDate || expDate <= endDate;
      
      return textMatch && categoryMatch && startDateMatch && endDateMatch;
    });
  }, [expenses, filters]);
  
  const triggerDownload = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };
  
  const handleExportCsv = React.useCallback(() => {
      const headers = ['id', 'description', 'amount', 'category', 'date'];
      const csvRows = [
          headers.join(','),
          ...filteredExpenses.map(exp => 
              [
                  exp.id,
                  `"${exp.description.replace(/"/g, '""')}"`, // Handle quotes in description
                  exp.amount,
                  exp.category,
                  exp.date
              ].join(',')
          )
      ];
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, `expenses-${new Date().toISOString().split('T')[0]}.csv`);
  }, [filteredExpenses]);

  const handleExportJson = React.useCallback(() => {
      const jsonString = JSON.stringify(filteredExpenses, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      triggerDownload(blob, `expenses-${new Date().toISOString().split('T')[0]}.json`);
  }, [filteredExpenses]);

  const totalSpent = React.useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const isFiltered = filters.text || filters.categories.length > 0 || filters.startDate || filters.endDate;

  const memoizedFilteredExpenses = React.useMemo(() => filteredExpenses.map(({id, ...rest}) => rest), [filteredExpenses]);

  return (
    <>
      <Header budget={budget} onEdit={() => setIsBudgetModalOpen(true)} theme={theme} setTheme={setTheme} />
      <BudgetProgressBar total={totalSpent} budget={budget} />
      <main className="app-container">
        <div className="dashboard-column">
          <div className="dashboard-header">
            <div className="dashboard-header-title">
              <h2>Dashboard</h2>
              {isFiltered && <span className="filter-indicator">Filtered Results</span>}
            </div>
            {isFiltered && <button onClick={resetFilters} className="btn btn-secondary"><i className="las la-times-circle"></i> Clear Filters</button>}
          </div>
          <Summary total={totalSpent} budget={budget} />
          <div className="charts-container">
            <CategoryChart expenses={filteredExpenses} />
            <TrendChart expenses={filteredExpenses} />
          </div>
          <ExpenseForm addExpense={addExpense} />
          <Filters 
            filters={filters} 
            setFilters={setFilters} 
            deleteExpenses={deleteExpenses} 
            selectedIds={selectedIds}
            onReset={resetFilters}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
          />
          <ExpenseList 
            expenses={filteredExpenses} 
            deleteExpenses={deleteExpenses} 
            selectedIds={selectedIds} 
            setSelectedIds={setSelectedIds}
            onEdit={setEditingExpense}
           />
        </div>
        <div className="chatbot-column">
            <Chatbot expenses={memoizedFilteredExpenses} addExpense={addExpense} />
        </div>
      </main>
      <BudgetEditModal 
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        currentBudget={budget}
      />
      
      <ExpenseEditModal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={handleUpdateExpense}
          expense={editingExpense}
      />
      
    </>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}