import React from 'react';

const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="main-content">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{title}</h1>
        </div>

        <div className="card">
          <div className="card-header">Coming Soon</div>
          <p>{description}</p>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            This module will be implemented in the next phase. The framework is ready for feature development.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
