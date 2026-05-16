import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimplifiedPipeline } from '../SimplifiedPipeline';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, animate, initial, ...props }: any) => (
            <div className={className} data-testid="motion-div" {...props}>
                {children}
            </div>
        ),
        button: ({ children, className, ...props }: any) => (
            <button className={className} {...props}>
                {children}
            </button>
        ),
    },
}));

describe('SimplifiedPipeline (Heavy Testing)', () => {
    const defaultProps = {
        currentStage: 2,
        isComplete: false,
        isConnected: true,
        aiModel: 'GPT-4',
        activeAIStage: 2,
        offsetMinutes: 60,
        onStageClick: vi.fn(),
    };

    it('renders all stages in the pipeline', () => {
        render(<SimplifiedPipeline {...defaultProps} />);
        const stageButtons = screen.getAllByRole('button');
        expect(stageButtons).toHaveLength(7);
    });

    it('displays the correct current stage name', () => {
        render(<SimplifiedPipeline {...defaultProps} currentStage={4} activeAIStage={4} />);
        // Select the one in the stage status (span), not the tooltip (div)
        const stageLabel = screen.getAllByText(/Divisional Analysis/i).find(el => el.tagName === 'SPAN');
        expect(stageLabel).toBeInTheDocument();
    });

    it('calculates progress percentage correctly', () => {
        render(<SimplifiedPipeline {...defaultProps} currentStage={2} activeAIStage={2} />);
        expect(screen.getByText('29%')).toBeInTheDocument();
    });

    it('displays 100% when isComplete is true', () => {
        render(<SimplifiedPipeline {...defaultProps} isComplete={true} />);
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('calls onStageClick when a stage button is clicked', () => {
        const onStageClick = vi.fn();
        render(<SimplifiedPipeline {...defaultProps} onStageClick={onStageClick} />);

        const stageButtons = screen.getAllByRole('button');
        fireEvent.click(stageButtons[1]);

        expect(onStageClick).toHaveBeenCalledWith(1);
    });

    it('renders correct phase labels based on offset', () => {
        const { rerender } = render(<SimplifiedPipeline {...defaultProps} currentStage={1} activeAIStage={1} offsetMinutes={240} />);
        expect(screen.getByText(/Macro/i)).toBeInTheDocument();

        rerender(<SimplifiedPipeline {...defaultProps} currentStage={1} activeAIStage={1} offsetMinutes={120} />);
        expect(screen.getByText(/Meso/i)).toBeInTheDocument();

        rerender(<SimplifiedPipeline {...defaultProps} currentStage={1} activeAIStage={1} offsetMinutes={10} />);
        expect(screen.getByText(/Micro/i)).toBeInTheDocument();
    });

    it('shows reconnected state when isConnected is false', () => {
        render(<SimplifiedPipeline {...defaultProps} isConnected={false} />);
        expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    });
});
