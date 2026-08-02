import React, { useState } from 'react';
import { VisitorBookReader } from '@digital-library/ui';

interface VisitorBookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisitorBookReaderModal: React.FC<VisitorBookReaderModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Mock visitor data for the demo
  const pages = [
    {
      pageNumber: 1,
      name: 'H.L. Gokhale',
      date: '17 February 2008',
      country: 'India',
      designation: 'Chief Justice, Allahabad High Court',
    },
    {
      pageNumber: 2,
      name: 'Arthur C. Wickham',
      date: '12 October 2023',
      country: 'United Kingdom',
      designation: 'Professor of Antiquities, Oxford',
    },
    {
      pageNumber: 3,
      name: 'Prof. Elena Moretti',
      date: '08 October 2023',
      country: 'Italy',
      designation: 'Director, Digital Heritage Initiative',
    },
    {
      pageNumber: 4,
      name: 'Sir Reginald Hargreeves',
      date: '15 September 2023',
      country: 'United Kingdom',
      designation: 'Eccentric Philanthropist',
    },
    {
      pageNumber: 5,
      name: 'Dr. Zora Neale',
      date: '01 September 2023',
      country: 'USA',
      designation: 'Lead Researcher, Tech Archive',
    }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#021634',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 300,
      }}
    >
      <VisitorBookReader
        pages={pages}
        onClose={onClose}
      />
    </div>
  );
};
