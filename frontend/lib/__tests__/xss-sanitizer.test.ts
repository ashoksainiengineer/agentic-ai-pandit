/**
 * 🔱 EXHAUSTIVE XSS SANITIZER TESTS
 * Industry-standard security testing for HTML/XSS sanitization.
 */
import { describe, it, expect } from 'vitest';
import { sanitizeAIContent } from '../xss-sanitizer.js';

describe('XSS Sanitizer - sanitizeAIContent', () => {
    // ═══════════════════════════════════════════════════════════════════
    // BASIC FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════════

    it('should return empty string for falsy input', () => {
        expect(sanitizeAIContent('')).toBe('');
        expect(sanitizeAIContent(null as any)).toBe('');
        expect(sanitizeAIContent(undefined as any)).toBe('');
    });

    it('should pass through plain text unchanged', () => {
        expect(sanitizeAIContent('Hello world')).toBe('Hello world');
        expect(sanitizeAIContent('Normal text here')).toBe('Normal text here');
    });

    it('should preserve markdown', () => {
        expect(sanitizeAIContent('**bold** and *italic*')).toBe('**bold** and *italic*');
        expect(sanitizeAIContent('# Heading')).toBe('# Heading');
        expect(sanitizeAIContent('- list item')).toBe('- list item');
    });

    // ═══════════════════════════════════════════════════════════════════
    // XSS ATTACK VECTORS
    // ═══════════════════════════════════════════════════════════════════

    it('should escape <script> tags', () => {
        const input = '<script>alert("XSS")</script>';
        const output = sanitizeAIContent(input);
        expect(output).not.toContain('<script');
        expect(output).toContain('&lt;script&gt;');
    });

    it('should escape nested script tags', () => {
        const input = '<scr<script>ipt>alert(1)</scr</script>ipt>';
        const output = sanitizeAIContent(input);
        expect(output).not.toContain('<script');
    });

    it('should escape <img> onerror injection', () => {
        const input = '<img src=x onerror=alert(1)>';
        const output = sanitizeAIContent(input);
        expect(output).not.toContain('<img');
        expect(output).toContain('&lt;img');
    });

    it('should escape <iframe> injection', () => {
        const input = '<iframe src="https://evil.com"></iframe>';
        const output = sanitizeAIContent(input);
        expect(output).not.toContain('<iframe');
    });

    it('should escape event handler attributes', () => {
        const input = '<div onmouseover="steal()">hover me</div>';
        const output = sanitizeAIContent(input);
        expect(output).not.toContain('<div');
        expect(output).toContain('&lt;div');
    });

    it('should escape <a> with javascript: protocol', () => {
        const input = '<a href="javascript:alert(1)">click</a>';
        const output = sanitizeAIContent(input);
        expect(output).not.toContain('<a ');
    });

    it('should escape <svg> onload', () => {
        const input = '<svg onload=alert(1)>';
        const output = sanitizeAIContent(input);
        expect(output).not.toContain('<svg');
    });

    it('should escape <body> onload', () => {
        const input = '<body onload=alert(1)>';
        const output = sanitizeAIContent(input);
        expect(output).not.toContain('<body');
    });

    it('should escape HTML entities in angle brackets', () => {
        const input = '1 < 2 and 3 > 2';
        const output = sanitizeAIContent(input);
        expect(output).toBe('1 &lt; 2 and 3 &gt; 2');
    });

    // ═══════════════════════════════════════════════════════════════════
    // UNICODE / SPECIAL CHARACTERS
    // ═══════════════════════════════════════════════════════════════════

    it('should handle Hindi/Devanagari text', () => {
        expect(sanitizeAIContent('नमस्ते दुनिया')).toBe('नमस्ते दुनिया');
    });

    it('should handle emojis', () => {
        expect(sanitizeAIContent('🌟 Great result! 🎯')).toBe('🌟 Great result! 🎯');
    });

    it('should handle mixed XSS + Unicode', () => {
        const input = '<script>alert("हैक")</script>';
        const output = sanitizeAIContent(input);
        expect(output).not.toContain('<script');
    });
});
