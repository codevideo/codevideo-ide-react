import React from 'react';
import { render } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { MouseOverlay } from '../MouseOverlay';

describe('MouseOverlay', () => {
  it('draws nothing when hidden but keeps tracking the target position', () => {
    // Checkpoints, step mode and showing the cursor again all rely on the
    // position still being tracked while the cursor isn't drawn.
    const onCurrentPositionChange = jest.fn();
    const { queryByTestId } = render(<Theme><MouseOverlay mode="step" mouseVisible={false}
      targetMousePosition={{ x: 40, y: 60 }} maximumAnimationDuration={1000}
      onCurrentPositionChange={onCurrentPositionChange} /></Theme>);

    expect(queryByTestId('mouse-overlay')).toBeNull();
    expect(onCurrentPositionChange).toHaveBeenLastCalledWith({ x: 40, y: 60 });
  });

  it('draws the cursor at the target position when visible', () => {
    const { getByTestId } = render(<Theme><MouseOverlay mode="step" mouseVisible
      targetMousePosition={{ x: 40, y: 60 }} maximumAnimationDuration={1000} /></Theme>);

    expect(getByTestId('mouse-overlay').style.transform).toContain('translate(40px, 60px)');
  });
});
