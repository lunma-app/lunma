import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import Harness from './EditableLabel.test.harness.svelte';

describe('EditableLabel', () => {
  test('renders a static label when not editing', () => {
    const { getByTestId, queryByTestId } = render(Harness, {
      props: { value: 'Docs', editing: false },
    });
    expect(getByTestId('editable-label-text').textContent).toBe('Docs');
    expect(queryByTestId('editable-label-input')).toBeNull();
  });

  test('shows an input seeded with the value, focused and selected, when editing', async () => {
    const { getByTestId } = render(Harness, { props: { value: 'Docs', editing: true } });
    const input = getByTestId('editable-label-input') as HTMLInputElement;
    expect(input.value).toBe('Docs');
    // Focus is scheduled in a microtask on the edit transition.
    await tick();
    await Promise.resolve();
    expect(document.activeElement).toBe(input);
  });

  test('commits the trimmed value on Enter', async () => {
    let committed: string | undefined;
    const { getByTestId } = render(Harness, {
      props: {
        value: 'Docs',
        editing: true,
        oncommit: (n: string) => {
          committed = n;
        },
      },
    });
    const input = getByTestId('editable-label-input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '  Reference  ' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(committed).toBe('Reference');
  });

  test('commits on blur', async () => {
    let committed: string | undefined;
    const { getByTestId } = render(Harness, {
      props: {
        value: 'Docs',
        editing: true,
        oncommit: (n: string) => {
          committed = n;
        },
      },
    });
    const input = getByTestId('editable-label-input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'Reference' } });
    await fireEvent.blur(input);
    expect(committed).toBe('Reference');
  });

  test('cancels on Escape', async () => {
    let committed: string | undefined;
    let cancelled = false;
    const { getByTestId } = render(Harness, {
      props: {
        value: 'Docs',
        editing: true,
        oncommit: (n: string) => {
          committed = n;
        },
        oncancel: () => {
          cancelled = true;
        },
      },
    });
    const input = getByTestId('editable-label-input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'changed' } });
    await fireEvent.keyDown(input, { key: 'Escape' });
    expect(cancelled).toBe(true);
    expect(committed).toBeUndefined();
  });

  test('an empty commit cancels by default', async () => {
    let committed: string | undefined;
    let cancelled = false;
    const { getByTestId } = render(Harness, {
      props: {
        value: 'Docs',
        editing: true,
        oncommit: (n: string) => {
          committed = n;
        },
        oncancel: () => {
          cancelled = true;
        },
      },
    });
    const input = getByTestId('editable-label-input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '   ' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(cancelled).toBe(true);
    expect(committed).toBeUndefined();
  });

  test('an empty commit emits an empty string when allowEmpty is set', async () => {
    let committed: string | undefined;
    const { getByTestId } = render(Harness, {
      props: {
        value: 'Docs',
        editing: true,
        allowEmpty: true,
        oncommit: (n: string) => {
          committed = n;
        },
      },
    });
    const input = getByTestId('editable-label-input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '  ' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(committed).toBe('');
  });
});
