import { expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('steps through the demo and shows the agent holding clean stock', () => {
  render(<App />);
  const next = screen.getByRole('button', { name: /Next/ });
  for (let i = 0; i < 5; i++) fireEvent.click(next);

  expect(screen.getByText(/PKG-003 reaches Shop 2/)).toBeDefined();
  expect(screen.getByText('HOLD FOR INSPECTION')).toBeDefined();
  expect(screen.getByText(/Investigate/)).toBeDefined();
});
