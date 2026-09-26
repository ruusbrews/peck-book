import { expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('admin route still steps through the demo and shows the agent holding clean stock', () => {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <App />
    </MemoryRouter>,
  );
  const next = screen.getByRole('button', { name: /Next/ });
  for (let i = 0; i < 5; i++) fireEvent.click(next);

  expect(screen.getByText(/PKG-003 reaches Shop 2/)).toBeDefined();
  expect(screen.getByText('HOLD FOR INSPECTION')).toBeDefined();
  expect(screen.getByText(/Investigate/)).toBeDefined();
});

test('default route renders the worker scan flow', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByText(/Scan a shipment barcode/i)).toBeDefined();
});
