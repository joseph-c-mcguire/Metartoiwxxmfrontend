import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileConverter } from '@/app/components/FileConverter';

const { convertMock, toastMock } = vi.hoisted(() => ({
  convertMock: vi.fn(),
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/utils/api', async () => {
  const actual = await vi.importActual<typeof import('@/utils/api')>('@/utils/api');
  return {
    ...actual,
    convertMetarToIwxxm: convertMock,
  };
});

vi.mock('sonner', () => ({
  toast: toastMock,
}));

describe('FileConverter actions', () => {
  beforeEach(() => {
    convertMock.mockReset();
    toastMock.success.mockReset();
    toastMock.error.mockReset();
    toastMock.info.mockReset();
    toastMock.warning.mockReset();
  });

  it('keeps convert button disabled when there is no input', () => {
    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    const convertButton = screen.getByRole('button', { name: /convert metar files to iwxxm xml/i });

    expect(convertButton).toBeDisabled();
    expect(convertMock).not.toHaveBeenCalled();
  });

  it('adds a selected file to pending queue and removes it', async () => {
    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    const file = new File(['METAR KJFK 161200Z 12012KT 10SM CLR 22/14 A3015'], 'queued.metar', {
      type: 'text/plain',
    });
    Object.defineProperty(file, 'text', {
      value: vi.fn().mockResolvedValue('METAR KJFK 161200Z 12012KT 10SM CLR 22/14 A3015'),
    });

    fireEvent.change(screen.getByLabelText('Select METAR files to upload'), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pending Files' })).toBeInTheDocument();
    });
    expect(screen.getByText('queued.metar')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove queued.metar from queue/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Pending Files' })).not.toBeInTheDocument();
    });
  });

  it('opens file picker when Enter is pressed on drop zone', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    fireEvent.keyDown(screen.getByRole('button', { name: /file drop zone/i }), {
      key: 'Enter',
    });

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('copies converted XML content through clipboard API', async () => {
    convertMock.mockResolvedValueOnce({
      results: [
        {
          name: 'manual_input_1.txt',
          source: 'manual_input_1',
          content: '<root><child>copy-me</child></root>',
          size_bytes: 32,
        },
      ],
      errors: [],
      issues: [],
      total_processed: 1,
      successful: 1,
      failed: 0,
    });

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    fireEvent.change(screen.getByLabelText(/enter metar data manually/i), {
      target: { value: 'METAR KJFK 161200Z 12012KT 10SM CLR 22/14 A3015' },
    });
    fireEvent.click(screen.getByRole('button', { name: /convert metar files to iwxxm xml/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copy manual_input_1/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('<root><child>copy-me</child></root>');
    });
  });

  it('falls back to document copy when clipboard API is unavailable', async () => {
    convertMock.mockResolvedValueOnce({
      results: [
        {
          name: 'manual_input_1.txt',
          source: 'manual_input_1',
          content: '<root><child>copy-fallback</child></root>',
          size_bytes: 40,
        },
      ],
      errors: [],
      issues: [],
      total_processed: 1,
      successful: 1,
      failed: 0,
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    const execCommandMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    fireEvent.change(screen.getByLabelText(/enter metar data manually/i), {
      target: { value: 'METAR KLAX 161200Z 25008KT 10SM FEW015 19/13 A2998' },
    });
    fireEvent.click(screen.getByRole('button', { name: /convert metar files to iwxxm xml/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copy manual_input_1/i }));

    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(toastMock.success).toHaveBeenCalledWith('Copied to clipboard');
    });
  });

  it('removes a single converted result from the list', async () => {
    convertMock.mockResolvedValueOnce({
      results: [
        {
          name: 'manual_input_1.txt',
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

    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    fireEvent.change(screen.getByLabelText(/enter metar data manually/i), {
      target: { value: 'METAR KJFK 161200Z 12012KT 10SM CLR 22/14 A3015' },
    });
    fireEvent.click(screen.getByRole('button', { name: /convert metar files to iwxxm xml/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Converted XML content for manual_input_1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /remove manual_input_1 from results/i }));

    await waitFor(() => {
      expect(screen.queryByLabelText('Converted XML content for manual_input_1')).not.toBeInTheDocument();
    });
  });
});
