import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileConverter } from '@/app/components/FileConverter';
import { ConversionApiError } from '@/utils/api';

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

describe('FileConverter validation issues panel', () => {
  it('shows detailed validation issues after a successful conversion with issues', async () => {
    convertMock.mockResolvedValueOnce({
      results: [],
      errors: ['Validation completed with errors'],
      issues: [
        {
          source: 'manual_input_1',
          message: 'Unknown station identifier',
          hint: 'Check ICAO station code',
          code: 'STATION_UNKNOWN',
          severity: 'error',
          layer: 'icao_opmet',
        },
      ],
      total_processed: 1,
      successful: 0,
      failed: 1,
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
        value: 'METAR XXXX 161200Z 12012KT 10SM CLR 22/14 A3015',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /convert metar files to iwxxm xml/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Validation and Conversion Issues' }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Validation completed with errors')).toBeInTheDocument();
    expect(screen.getByText(/manual_input_1/i)).toBeInTheDocument();
    expect(screen.getByText(/Unknown station identifier/i)).toBeInTheDocument();
    expect(screen.getByText(/Layer: icao_opmet/i)).toBeInTheDocument();
    expect(screen.getByText(/Code: STATION_UNKNOWN/i)).toBeInTheDocument();
  });

  it('shows HTTP status and backend errors for non-2xx conversion failures', async () => {
    convertMock.mockRejectedValueOnce(
      new ConversionApiError('HTTP 422', ['Invalid METAR syntax'], [], 422),
    );

    render(
      <FileConverter
        onLogout={vi.fn()}
        userEmail="test@example.com"
        accessToken="test-token"
      />,
    );

    fireEvent.change(screen.getByLabelText(/enter metar data manually/i), {
      target: {
        value: 'BROKEN METAR INPUT',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /convert metar files to iwxxm xml/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Validation and Conversion Issues' }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('HTTP status: 422')).toBeInTheDocument();
    expect(screen.getByText('Invalid METAR syntax')).toBeInTheDocument();
  });
});
