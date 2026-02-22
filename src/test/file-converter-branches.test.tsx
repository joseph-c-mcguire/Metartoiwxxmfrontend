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

vi.mock('@/app/components/UserPreferencesDialog', () => ({
  UserPreferencesDialog: ({ isOpen, onPreferencesSaved }: { isOpen: boolean; onPreferencesSaved: () => void }) => (
    isOpen ? <button onClick={onPreferencesSaved}>Save Preferences Mock</button> : null
  ),
}));

describe('FileConverter uncovered branches', () => {
  beforeEach(() => {
    localStorage.clear();
    convertMock.mockReset();
    toastMock.success.mockReset();
    toastMock.error.mockReset();
    toastMock.info.mockReset();
    toastMock.warning.mockReset();
  });

  it('loads preferences from localStorage and applies them on mount', async () => {
    localStorage.setItem(
      'metar_converter_preferences',
      JSON.stringify({
        bulletinIdExample: 'SBBB01',
        issuingCenter: 'KDEN',
        iwxxmVersion: '2023-1',
        validateOutput: false,
        validationLevel: 'basic',
        stopOnError: true,
      }),
    );

    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    fireEvent.click(screen.getByRole('button', { name: /expand parameters/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Bulletin ID')).toHaveValue('SBBB01');
    });
    expect(screen.getByLabelText('IWXXM Version')).toHaveValue('2023-1');
    expect(screen.getByLabelText('Validation Level')).toHaveValue('basic');
    expect(screen.getByLabelText('Validate Output')).not.toBeChecked();
    expect(screen.getByLabelText('Stop on First Error')).toBeChecked();
  });

  it('reloads preferences when preferences dialog save callback is triggered', async () => {
    localStorage.setItem(
      'metar_converter_preferences',
      JSON.stringify({
        bulletinIdExample: 'SAAA00',
        issuingCenter: 'KWBC',
      }),
    );

    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    fireEvent.click(screen.getByRole('button', { name: /open user preferences/i }));

    localStorage.setItem(
      'metar_converter_preferences',
      JSON.stringify({
        bulletinIdExample: 'SCCC02',
        issuingCenter: 'KSEA',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save Preferences Mock' }));

    fireEvent.click(screen.getByRole('button', { name: /expand parameters/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Bulletin ID')).toHaveValue('SCCC02');
    });
    expect(toastMock.info).toHaveBeenCalledWith('Conversion parameters updated from preferences');
  });

  it('handles malformed preferences JSON on load and save callbacks', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('metar_converter_preferences', '{invalid-json');

    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading preferences:',
        expect.any(Error),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /open user preferences/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Preferences Mock' }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error reloading preferences:',
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles file read failures and shows an error toast', async () => {
    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    const unreadable = new File(['ignored'], 'broken.metar', { type: 'text/plain' });
    Object.defineProperty(unreadable, 'text', {
      value: vi.fn().mockRejectedValue(new Error('boom')),
    });

    fireEvent.change(screen.getByLabelText('Select METAR files to upload'), {
      target: { files: [unreadable] },
    });

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Failed to read broken.metar');
    });
  });

  it('toggles drag-over styling and parameter collapse state', () => {
    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    const dropZone = screen.getByRole('button', { name: /file drop zone/i });
    fireEvent.dragOver(dropZone);
    expect(dropZone.className).toContain('border-blue-500');

    fireEvent.dragLeave(dropZone);
    expect(dropZone.className).toContain('border-gray-300');

    const toggleParams = screen.getByRole('button', { name: /expand parameters/i });
    fireEvent.click(toggleParams);
    expect(screen.getByRole('button', { name: /collapse parameters/i })).toBeInTheDocument();
  });

  it('handles dropped files and sends queued files to conversion API', async () => {
    convertMock.mockResolvedValueOnce({
      results: [
        {
          name: 'dropped.metar',
          source: 'dropped.metar',
          content: '<root><ok>true</ok></root>',
          size_bytes: 24,
        },
      ],
      errors: [],
      issues: [],
      total_processed: 1,
      successful: 1,
      failed: 0,
    });

    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    const dropped = new File(['METAR KSFO 161200Z 30010KT 10SM CLR 15/08 A3012'], 'dropped.metar', {
      type: 'text/plain',
    });
    Object.defineProperty(dropped, 'text', {
      value: vi.fn().mockResolvedValue('METAR KSFO 161200Z 30010KT 10SM CLR 15/08 A3012'),
    });

    const dropZone = screen.getByRole('button', { name: /file drop zone/i });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [dropped] },
    });

    await waitFor(() => {
      expect(screen.getByText('dropped.metar')).toBeInTheDocument();
    });

    const convertButton = screen.getByRole('button', { name: /convert metar files to iwxxm xml/i });
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(convertMock).toHaveBeenCalledWith(expect.objectContaining({ files: [dropped] }));
    });
  });

  it('handles warning-only issues and generic conversion exceptions', async () => {
    convertMock.mockResolvedValueOnce({
      results: [],
      errors: [],
      issues: [
        { source: 'manual_input_1', message: 'Warn', severity: 'warning', layer: 'schema' },
      ],
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
      expect(toastMock.warning).toHaveBeenCalledWith('Conversion completed with 1 warning(s)');
    });

    convertMock.mockRejectedValueOnce(new Error('Network down'));
    fireEvent.change(screen.getByLabelText(/enter metar data manually/i), {
      target: { value: 'METAR KLAX 161200Z 25008KT 10SM FEW015 19/13 A2998' },
    });
    fireEvent.click(screen.getByRole('button', { name: /convert metar files to iwxxm xml/i }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        'Unable to reach backend conversion API',
        expect.objectContaining({ description: 'Network down' }),
      );
    });
  });

  it('covers download single, zip download, and clipboard rejection fallback paths', async () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURLMock = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURLMock,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURLMock,
      configurable: true,
    });
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    convertMock.mockResolvedValueOnce({
      results: [
        {
          name: 'manual_input_1.txt',
          source: 'manual_input_1',
          content: '<root><child>one</child></root>',
          size_bytes: 30,
        },
        {
          name: 'manual_input_2.metar',
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

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('clipboard denied')),
      },
      configurable: true,
    });
    const execCommandMock = vi.fn().mockReturnValue(false);
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    fireEvent.change(screen.getByLabelText(/enter metar data manually/i), {
      target: {
        value:
          'METAR KJFK 161200Z 12012KT 10SM CLR 22/14 A3015\nMETAR KLAX 161200Z 25008KT 10SM FEW015 19/13 A2998',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /convert metar files to iwxxm xml/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /download manual_input_1/i }));
    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith('File downloaded');
    });

    fireEvent.click(screen.getByRole('button', { name: /download all 2 converted files as zip/i }));
    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith('All files downloaded as ZIP');
    });

    fireEvent.click(screen.getByRole('button', { name: /copy manual_input_1/i }));
    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(toastMock.error).toHaveBeenCalledWith('Failed to copy. Please copy manually.');
    });

    anchorClickSpy.mockRestore();
  });

  it('handles fallback copy exceptions and prettify failures', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    convertMock.mockResolvedValueOnce({
      results: [
        {
          name: 'manual_input_1',
          source: 'manual_input_1',
          content: '<root><broken></root>',
          size_bytes: 22,
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
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn(() => {
        throw new Error('copy crashed');
      }),
      configurable: true,
    });

    render(<FileConverter onLogout={vi.fn()} userEmail="test@example.com" accessToken="token" />);

    fireEvent.change(screen.getByLabelText(/enter metar data manually/i), {
      target: { value: 'METAR EGLL 161200Z 21012KT 9999 SCT020 14/09 Q1018' },
    });
    fireEvent.click(screen.getByRole('button', { name: /convert metar files to iwxxm xml/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copy manual_input_1/i }));
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Copy failed:', expect.any(Error));
      expect(toastMock.error).toHaveBeenCalledWith('Failed to copy. Please copy manually.');
    });

    fireEvent.click(screen.getByRole('button', { name: /prettify manual_input_1 xml/i }));
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        'Unable to prettify manual_input_1',
        expect.objectContaining({ description: 'The XML appears to be invalid or malformed.' }),
      );
    });

    const stalePrettifyButton = screen.getByRole('button', { name: /prettify manual_input_1 xml/i });
    fireEvent.click(screen.getByRole('button', { name: /clear all pending files and manual input/i }));
    fireEvent.click(stalePrettifyButton);

    consoleErrorSpy.mockRestore();
  });
});
