import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileConverter } from '@/app/components/FileConverter';

const { convertMock } = vi.hoisted(() => ({
  convertMock: vi.fn(),
}));

vi.mock('@/utils/api', async () => {
  const actual = await vi.importActual<typeof import('@/utils/api')>('@/utils/api');
  return {
    ...actual,
    convertMetarToIwxxm: convertMock,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('FileConverter XML prettify controls', () => {
  it('renders a Prettify button for each XML result and prettifies selected output', async () => {
    convertMock.mockResolvedValueOnce({
      results: [
        {
          name: 'manual_input_1',
          source: 'manual_input_1',
          content: '<root><child>one</child></root>',
          size_bytes: 30,
        },
        {
          name: 'manual_input_2',
          source: 'manual_input_2',
          content: '<root><child>two</child></root>',
          size_bytes: 30,
        },
      ],
      errors: [],
      issues: [],
      total_processed: 2,
      successful: 2,
      failed: 0,
    });

    render(
      <FileConverter
        onLogout={vi.fn()}
        userEmail="test@example.com"
        accessToken="test-token"
      />,
    );

    expect(screen.getByRole('link', { name: 'Swagger UI' })).toHaveAttribute(
      'href',
      'https://metar-to-iwxxm-api.onrender.com/docs',
    );
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/joseph-c-mcguire/metar-to-IWXXM/issues',
    );
    expect(screen.getByRole('link', { name: 'Joseph.c.mcg@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:Joseph.c.mcg@gmail.com',
    );

    fireEvent.change(screen.getByLabelText(/enter metar data manually/i), {
      target: {
        value: 'METAR KJFK 161200Z 12012KT 10SM CLR 22/14 A3015\nMETAR KLAX 161200Z 25008KT 10SM FEW015 19/13 A2998',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /convert metar files to iwxxm xml/i }));

    await waitFor(() => {
      expect(convertMock).toHaveBeenCalledTimes(1);
    });

    const prettifyButtons = await screen.findAllByRole('button', {
      name: /Prettify .* XML/i,
    });
    expect(prettifyButtons).toHaveLength(2);

    const firstResultRegion = screen.getByLabelText('Converted XML content for manual_input_1');
    const secondResultRegion = screen.getByLabelText('Converted XML content for manual_input_2');

    expect(firstResultRegion.textContent).toContain('<root><child>one</child></root>');
    expect(secondResultRegion.textContent).toContain('<root><child>two</child></root>');

    fireEvent.click(prettifyButtons[0]);

    await waitFor(() => {
      expect(firstResultRegion.textContent).toContain('\n  <child>one</child>\n');
    });
    expect(secondResultRegion.textContent).toContain('<root><child>two</child></root>');
  });

  it('clears converted history when Clear is clicked', async () => {
    convertMock.mockResolvedValueOnce({
      results: [
        {
          name: 'manual_input_1',
          source: 'manual_input_1',
          content: '<root><child>one</child></root>',
          size_bytes: 30,
        },
      ],
      errors: [],
      issues: [],
      total_processed: 1,
      successful: 1,
      failed: 0,
    });

    render(
      <FileConverter
        onLogout={vi.fn()}
        userEmail="test@example.com"
        accessToken="test-token"
      />,
    );

    fireEvent.change(screen.getByLabelText(/enter metar data manually/i), {
      target: {
        value: 'METAR KJFK 161200Z 12012KT 10SM CLR 22/14 A3015',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /convert metar files to iwxxm xml/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Converted XML content for manual_input_1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear all pending files and manual input/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Results' })).not.toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Converted XML content for manual_input_1')).not.toBeInTheDocument();
  });
});
