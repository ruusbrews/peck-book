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
  fireEvent.click(screen.getByRole('link', { name: 'Open admin agent demo' }));
  expect(screen.getByRole('heading', { name: 'PeckTag Agent' })).toBeDefined();
});

test('admin inspector panel records a live inspection result', () => {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <App />
    </MemoryRouter>,
  );
  const next = screen.getByRole('button', { name: /Next/ });
  for (let i = 0; i < 5; i++) fireEvent.click(next);

  fireEvent.change(screen.getByLabelText('Inspect'), { target: { value: 'package:PKG-003' } });
  fireEvent.change(screen.getByLabelText('Result'), { target: { value: 'fail' } });
  fireEvent.change(screen.getByLabelText('Inspector'), { target: { value: 'Inspector 7' } });
  fireEvent.click(screen.getByRole('button', { name: 'Record inspection' }));

  expect(screen.getByText(/Manual inspection of PKG-003: fail/)).toBeDefined();
  expect(screen.getByText('WITHDRAW')).toBeDefined();
});

test('typing a space in the inspector note does not advance the demo', () => {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <App />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: /Next/ }));
  const note = screen.getByLabelText('Note');
  fireEvent.keyDown(note, { key: ' ' });
  expect(screen.getByText('Step 1 / 11')).toBeDefined();
  fireEvent.keyDown(document.body, { key: ' ' });
  expect(screen.getByText('Step 2 / 11')).toBeDefined();
});
