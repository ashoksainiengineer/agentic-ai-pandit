import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import BirthDataForm from './BirthDataForm';

const defaultProps = {
  birthData: { fullName: 'Test', dateOfBirth: '1990-01-01', tentativeTime: '12:00', birthPlace: 'Mumbai', gender: 'male' } as any,
  offsetConfig: { description: 'test', preset: '1hour' } as any,
  spouseData: {} as any,
  onUpdateBirthData: () => {},
  onUpdateOffset: () => {},
  onUpdateSpouse: () => {},
};

describe('BirthDataForm', () => {
  it('renders without crashing', () => {
    const { container } = render(<BirthDataForm {...defaultProps} />);
    expect(container).toBeTruthy();
  });
});
