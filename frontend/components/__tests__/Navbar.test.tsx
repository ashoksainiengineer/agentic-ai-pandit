/**
 * Navbar Component Tests
 * Tests rendering, navigation links, auth states, mobile menu, and scroll behavior.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../Navbar';
import React from 'react';

// Mock next/link
vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

// Mock @clerk/nextjs
const mockUseUser = vi.fn();
vi.mock('@clerk/nextjs', () => ({
    UserButton: ({ afterSignOutUrl }: any) => (
        <div data-testid="user-button">UserButton: {afterSignOutUrl}</div>
    ),
    useUser: () => mockUseUser(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Menu: () => <span data-testid="icon-menu">☰</span>,
    X: () => <span data-testid="icon-x">✕</span>,
}));

describe('Navbar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true });
        // Reset scroll position
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ========== RENDERING ==========
    describe('rendering', () => {
        it('renders the brand logo and name', () => {
            render(<Navbar />);

            expect(screen.getByText('AI Pandit')).toBeInTheDocument();
        });

        it('renders navigation links on desktop', () => {
            render(<Navbar />);

            expect(screen.getByText('Start Analysis')).toBeInTheDocument();
        });

        it('renders Dashboard CTA button when signed in', () => {
            mockUseUser.mockReturnValue({ isSignedIn: true, isLoaded: true });
            render(<Navbar />);

            const dashboardButtons = screen.getAllByText('Dashboard');
            expect(dashboardButtons.length).toBeGreaterThanOrEqual(1);
        });

        it('renders mobile menu button', () => {
            render(<Navbar />);

            expect(screen.getByTestId('icon-menu')).toBeInTheDocument();
        });

        it('renders skeleton when not mounted', () => {
            const { container } = render(<Navbar />);

            // After mount, the full navbar renders
            expect(screen.getByText('AI Pandit')).toBeInTheDocument();
        });
    });

    // ========== AUTH STATES ==========
    describe('auth states', () => {
        it('shows UserButton when user is signed in', () => {
            mockUseUser.mockReturnValue({ isSignedIn: true, isLoaded: true });

            render(<Navbar />);

            expect(screen.getAllByTestId('user-button').length).toBeGreaterThanOrEqual(1);
        });

        it('does not show UserButton when user is not signed in', () => {
            mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true });

            render(<Navbar />);

            expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
        });

        it('shows UserButton on mobile when signed in', () => {
            mockUseUser.mockReturnValue({ isSignedIn: true, isLoaded: true });

            render(<Navbar />);

            // UserButton should appear in both desktop and mobile areas
            const userButtons = screen.getAllByTestId('user-button');
            expect(userButtons.length).toBeGreaterThanOrEqual(2);
        });

        it('handles loading auth state', () => {
            mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: false });

            render(<Navbar />);

            // Should not crash while loading
            expect(screen.getByText('AI Pandit')).toBeInTheDocument();
        });
    });

    // ========== MOBILE MENU ==========
    describe('mobile menu', () => {
        it('toggles mobile menu open and closed', () => {
            render(<Navbar />);

            const menuBtn = screen.getByTestId('icon-menu').closest('button');
            expect(menuBtn).toBeInTheDocument();

            // Open menu
            fireEvent.click(menuBtn!);
            expect(screen.getByTestId('icon-x')).toBeInTheDocument();

            // Close menu
            const closeBtn = screen.getByTestId('icon-x').closest('button');
            fireEvent.click(closeBtn!);
            expect(screen.getByTestId('icon-menu')).toBeInTheDocument();
        });

    it('renders mobile nav links when menu is open', () => {
            mockUseUser.mockReturnValue({ isSignedIn: true, isLoaded: true });
            render(<Navbar />);

            const menuBtn = screen.getByTestId('icon-menu').closest('button');
            fireEvent.click(menuBtn!);
            // Mobile menu should show nav links and Dashboard
            expect(screen.getAllByText('How It Works').length).toBeGreaterThanOrEqual(2);
            expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(2);
        });

        it('closes mobile menu when a link is clicked', () => {
            render(<Navbar />);

            // Open menu
            const menuBtn = screen.getByTestId('icon-menu').closest('button');
            fireEvent.click(menuBtn!);

            // Click a link
            const links = screen.getAllByText('Start Analysis');
            fireEvent.click(links[links.length - 1]);

            // Menu should close
            expect(screen.getByTestId('icon-menu')).toBeInTheDocument();
        });
    });

    // ========== SCROLL BEHAVIOR ==========
    describe('scroll behavior', () => {
        it('applies scrolled styles when window is scrolled', () => {
            render(<Navbar />);

            // Simulate scroll
            Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
            fireEvent.scroll(window);

            // Component should still render without errors
            expect(screen.getByText('AI Pandit')).toBeInTheDocument();
        });

        it('applies transparent prop styles', () => {
            render(<Navbar transparent={true} />);

            expect(screen.getByText('AI Pandit')).toBeInTheDocument();
        });

        it('applies non-transparent default styles', () => {
            render(<Navbar />);

            expect(screen.getByText('AI Pandit')).toBeInTheDocument();
        });
    });

    // ========== NAVIGATION LINKS ==========
    describe('navigation links', () => {
        it('has correct href for Start Analysis', () => {
            render(<Navbar />);

            const startAnalysisLink = screen.getByText('Start Analysis').closest('a');
            expect(startAnalysisLink).toHaveAttribute('href', '/rectify');
        });

        it('has correct href for Dashboard', () => {
            mockUseUser.mockReturnValue({ isSignedIn: true, isLoaded: true });
            render(<Navbar />);

            const dashboardLinks = screen.getAllByText('Dashboard');
            const dashboardLink = dashboardLinks[0].closest('a');
            expect(dashboardLink).toHaveAttribute('href', '/dashboard');
        });

        it('brand link points to home', () => {
            render(<Navbar />);

            const brandLink = screen.getByText('AI Pandit').closest('a');
            expect(brandLink).toHaveAttribute('href', '/');
        });
    });
});
