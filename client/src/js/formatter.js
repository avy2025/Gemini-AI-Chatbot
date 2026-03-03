/**
 * formatter.js
 * Safely converts raw AI/user text into rich HTML.
 * Security: All plain text is set via textContent — never innerHTML on raw input.
 *           Only constructed DOM elements are inserted, preventing XSS.
 */

/**
 * Escapes HTML special characters in a string.
 * Used as a last-resort safety measure inside code blocks.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Adds a "Copy" button to a code block wrapper element.
 * @param {HTMLElement} wrapper - The container element for the code block
 * @param {string} codeText - The raw code text to copy
 */
function addCopyButton(wrapper, codeText) {
    const btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.textContent = 'Copy';

    btn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(codeText);
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
        } catch {
            // Fallback for browsers without clipboard API
            const textarea = document.createElement('textarea');
            textarea.value = codeText;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
        }
        // Reset button label after 2 seconds
        setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
        }, 2000);
    });

    wrapper.appendChild(btn);
}

/**
 * Parses a single text segment (no code blocks) for inline code and URLs.
 * Returns a DocumentFragment containing safe DOM nodes.
 * @param {string} text
 * @returns {DocumentFragment}
 */
function parseInlineFormatting(text) {
    const fragment = document.createDocumentFragment();

    // Regex: matches inline `code` or a URL pattern
    const inlinePattern = /(`[^`]+`)|((https?:\/\/|www\.)[^\s<>"'{}|\\^`\[\]]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = inlinePattern.exec(text)) !== null) {
        // Append any plain text before this match
        if (match.index > lastIndex) {
            fragment.appendChild(
                document.createTextNode(text.slice(lastIndex, match.index))
            );
        }

        if (match[1]) {
            // Inline code: strip surrounding backticks
            const code = document.createElement('code');
            code.className = 'inline-code';
            code.textContent = match[1].slice(1, -1);
            fragment.appendChild(code);
        } else if (match[2]) {
            // URL: build a safe anchor element
            const rawUrl = match[2];
            const href = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
            const anchor = document.createElement('a');
            anchor.href = href;
            anchor.textContent = rawUrl;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.className = 'chat-link';
            fragment.appendChild(anchor);
        }

        lastIndex = inlinePattern.lastIndex;
    }

    // Append any remaining plain text
    if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    return fragment;
}

/**
 * Main formatter function.
 * Splits text on triple-backtick code blocks, then processes
 * each segment for inline code and URLs.
 *
 * @param {string} rawText - The raw message text from the AI or user
 * @returns {DocumentFragment} - A safe DOM fragment ready to append
 */
export function formatMessage(rawText) {
    const fragment = document.createDocumentFragment();

    // Split on fenced code blocks: ```[lang]\n...\n```
    // Capture group 1 = optional language hint, group 2 = code body
    const codeBlockPattern = /```([^\n`]*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockPattern.exec(rawText)) !== null) {
        // Process text before the code block
        if (match.index > lastIndex) {
            const textBefore = rawText.slice(lastIndex, match.index);
            fragment.appendChild(parseInlineFormatting(textBefore));
        }

        const lang = match[1].trim();
        const codeText = match[2];

        // Build code block: wrapper > header(lang + copy btn) + pre > code
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';

        const header = document.createElement('div');
        header.className = 'code-block-header';

        const langLabel = document.createElement('span');
        langLabel.className = 'code-lang';
        langLabel.textContent = lang || 'code';
        header.appendChild(langLabel);

        addCopyButton(header, codeText);
        wrapper.appendChild(header);

        const pre = document.createElement('pre');
        const code = document.createElement('code');
        // Use innerHTML with escapeHtml — the ONLY place we use innerHTML,
        // and only with escaped content, so XSS is prevented.
        code.innerHTML = escapeHtml(codeText);
        if (lang) code.className = `language-${lang}`;
        pre.appendChild(code);
        wrapper.appendChild(pre);

        fragment.appendChild(wrapper);
        lastIndex = codeBlockPattern.lastIndex;
    }

    // Process any remaining text after last code block
    if (lastIndex < rawText.length) {
        fragment.appendChild(parseInlineFormatting(rawText.slice(lastIndex)));
    }

    return fragment;
}
