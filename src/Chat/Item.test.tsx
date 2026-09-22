import type { ReactElement } from 'react';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { fireEvent, render, screen } from '@testing-library/react';

import { standaloneTheme } from '../standalone-theme';
import Item from './Item';

// Item's styled() components read theme.shell.* — rendering it without a
// theme carrying those tokens throws, the same way it would in a host that
// forgot to pass one. A ThemeProvider is required here, not optional.
const theme = createTheme(standaloneTheme);

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('Item', () => {
  it('renders the seeded conversation', () => {
    renderWithTheme(<Item />);

    expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    expect(
      screen.getByText('Checking whether the boiler loop is still reporting.'),
    ).toBeInTheDocument();
  });

  it('does not show a profile line when none is given', () => {
    renderWithTheme(<Item />);

    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  });

  it('shows the profile the host passes', () => {
    renderWithTheme(<Item userProfile={{ role: 'operator', tenantName: 'Acme Plant 4' }} />);

    expect(screen.getByText('Signed in as operator · Acme Plant 4')).toBeInTheDocument();
  });

  it('sends a message and clears the draft', () => {
    renderWithTheme(<Item />);

    const input = screen.getByLabelText('Message');
    fireEvent.change(input, { target: { value: 'Restarting the compressor.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(screen.getByText('Restarting the compressor.')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('disables send while the draft is empty', () => {
    renderWithTheme(<Item />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });
});
