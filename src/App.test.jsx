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
  expect(screen.getByText('Step 1 / 8')).toBeDefined();
  fireEvent.keyDown(document.body, { key: ' ' });
  expect(screen.getByText('Step 2 / 8')).toBeDefined();
});

test('clicking a "Based on" source shows the text of the law or standard', () => {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <App />
    </MemoryRouter>,
  );
  const next = screen.getByRole('button', { name: /Next/ });
  for (let i = 0; i < 5; i++) fireEvent.click(next);

  fireEvent.click(screen.getAllByRole('button', { name: /Codex CXC 8-1976 §5\.3/ })[0]);
  expect(screen.getByText(/should be identified and sorted immediately/)).toBeDefined();
  expect(screen.getByText('International standard')).toBeDefined();
  expect(screen.getByRole('link', { name: /Open the source/ })).toBeDefined();
});

test('a pass recorded in the form releases held stock, and nothing is released without it', () => {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <App />
    </MemoryRouter>,
  );
  const next = screen.getByRole('button', { name: /Next/ });
  for (let i = 0; i < 8; i++) fireEvent.click(next);
  expect(screen.getByText('Step 8 / 8')).toBeDefined();
  expect(screen.queryByText('RELEASE')).toBeNull();

  fireEvent.change(screen.getByLabelText('Inspect'), { target: { value: 'location:wholesale-b' } });
  fireEvent.change(screen.getByLabelText('Result'), { target: { value: 'clear' } });
  fireEvent.click(screen.getByRole('button', { name: 'Record inspection' }));

  expect(screen.getByText('RELEASE')).toBeDefined();
  expect(screen.getByText(/PKG-003, PKG-004/)).toBeDefined();
});
