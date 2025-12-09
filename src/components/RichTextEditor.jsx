import React, { useEffect, useRef } from "react";

/**
 * Simple Rich Text Editor Component
 * No external dependencies required!
 * Uses contentEditable for basic formatting
 */

const RichTextToolbar = ({ onFormat, onInsertBullet }) => {
  const buttonStyle = {
    padding: "6px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s",
  };

  const buttonHoverStyle = {
    background: "#f1f5f9",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: "8px 12px",
        background: "#f8fafc",
        borderRadius: "10px 10px 0 0",
        borderBottom: "1px solid #e5e7eb",
        flexWrap: "wrap",
      }}>
      {/* <button
        type="button"
        onClick={() => onFormat("bold")}
        style={{ ...buttonStyle, fontWeight: "bold" }}
        onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
        onMouseLeave={(e) => (e.target.style.background = "#fff")}
        title="Bold (Ctrl+B)">
        <strong>B</strong>
      </button>

      <button
        type="button"
        onClick={() => onFormat("italic")}
        style={{ ...buttonStyle, fontStyle: "italic" }}
        onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
        onMouseLeave={(e) => (e.target.style.background = "#fff")}
        title="Italic (Ctrl+I)">
        <em>I</em>
      </button>

      <button
        type="button"
        onClick={() => onFormat("underline")}
        style={{ ...buttonStyle, textDecoration: "underline" }}
        onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
        onMouseLeave={(e) => (e.target.style.background = "#fff")}
        title="Underline (Ctrl+U)">
        U
      </button>

      <div
        style={{
          width: 1,
          background: "#cbd5e1",
          margin: "0 4px",
          alignSelf: "stretch",
        }} */}
      {/* /> */}

      <button
        type="button"
        onClick={onInsertBullet}
        style={{ ...buttonStyle, fontWeight: 600 }}
        onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
        onMouseLeave={(e) => (e.target.style.background = "#fff")}
        title="Insert Bullet at Cursor (Ctrl+Shift+8)">
        • Insert Bullet
      </button>

      {/* <button
        type="button"
        onClick={() => onFormat("insertUnorderedList")}
        style={buttonStyle}
        onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
        onMouseLeave={(e) => (e.target.style.background = "#fff")}
        title="Convert to Bullet List">
        • List
      </button>

      <button
        type="button"
        onClick={() => onFormat("insertOrderedList")}
        style={buttonStyle}
        onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
        onMouseLeave={(e) => (e.target.style.background = "#fff")}
        title="Numbered List">
        1. List
      </button>

      <div
        style={{
          width: 1,
          background: "#cbd5e1",
          margin: "0 4px",
          alignSelf: "stretch",
        }}
      /> */}

      {/* <button
        type="button"
        onClick={() => onFormat("removeFormat")}
        style={{ ...buttonStyle, color: "#dc2626" }}
        onMouseEnter={(e) => (e.target.style.background = "#fef2f2")}
        onMouseLeave={(e) => (e.target.style.background = "#fff")}
        title="Clear Formatting">
        ✕ Clear
      </button> */}
    </div>
  );
};

const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Start typing...",
  minHeight = 150,
}) => {
  const editorRef = useRef(null);
  const lastEmittedRef = useRef("");

  // Save cursor position
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
      };
    }
    return null;
  };

  // Restore cursor position
  const restoreCursorPosition = (savedPosition) => {
    if (!savedPosition || !editorRef.current) return;
    
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      
      // Try to restore position, fallback to end if nodes changed
      if (savedPosition.startContainer && savedPosition.startContainer.parentNode) {
        range.setStart(savedPosition.startContainer, savedPosition.startOffset);
        range.setEnd(savedPosition.endContainer || savedPosition.startContainer, savedPosition.endOffset || savedPosition.startOffset);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback: place cursor at end
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (e) {
      // If restoration fails, place cursor at end
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // Insert bullet point at cursor position
  const insertBulletAtCursor = () => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // Check if we're at the start of a line (beginning of element or after <br>)
    let isAtLineStart = false;
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    
    if (startContainer.nodeType === Node.TEXT_NODE) {
      // Check if we're at the start of text node
      if (startOffset === 0) {
        // Check if previous sibling is <br> or we're first child
        const prevSibling = startContainer.previousSibling;
        if (!prevSibling || prevSibling.nodeName === "BR") {
          isAtLineStart = true;
        }
      } else {
        // Check if all text before cursor is whitespace
        const textBefore = startContainer.textContent.substring(0, startOffset);
        if (textBefore.trim() === "") {
          const prevSibling = startContainer.previousSibling;
          if (!prevSibling || prevSibling.nodeName === "BR") {
            isAtLineStart = true;
          }
        }
      }
    } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
      // If container is an element, check if it's empty or starts with <br>
      if (startContainer.childNodes.length === 0 || 
          (startContainer.childNodes[0] && startContainer.childNodes[0].nodeName === "BR")) {
        isAtLineStart = true;
      }
    }
    
    // If editor is empty, just insert bullet
    if (editorRef.current.textContent.trim() === "") {
      isAtLineStart = true;
    }
    
    const bullet = document.createTextNode("• ");
    
    if (isAtLineStart) {
      // Insert bullet directly at cursor
      range.insertNode(bullet);
    } else {
      // Insert line break and bullet for new line
      const lineBreak = document.createElement("br");
      range.insertNode(lineBreak);
      range.insertNode(bullet);
    }
    
    // Move cursor after bullet
    range.setStartAfter(bullet);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Trigger onChange
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleFormat = (command) => {
    const savedPos = saveCursorPosition();
    document.execCommand(command, false, null);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      // Restore cursor after a brief delay to allow DOM update
      setTimeout(() => restoreCursorPosition(savedPos), 0);
    }
  };

  const handleInput = (e) => {
    const html = e.currentTarget.innerHTML;
    lastEmittedRef.current = html;
    onChange(html);
  };

  const handlePaste = (e) => {
    // Prevent pasting formatted content, paste as plain text
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleKeyDown = (e) => {
    // Ctrl+Shift+8 or Ctrl+Shift+B for bullet
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "8" || e.key === "B")) {
      e.preventDefault();
      insertBulletAtCursor();
      return;
    }

    // Handle Enter key in lists to create new list items
    if (e.key === "Enter") {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        
        // Check if we're in a list item
        let node = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
        while (node && node !== editorRef.current) {
          if (node.tagName === "LI") {
            // We're in a list, let default behavior handle it
            return;
          }
          node = node.parentNode;
        }
      }
    }

    // Standard keyboard shortcuts
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      if (e.key === "b") {
        e.preventDefault();
        handleFormat("bold");
        return;
      }
      if (e.key === "i") {
        e.preventDefault();
        handleFormat("italic");
        return;
      }
      if (e.key === "u") {
        e.preventDefault();
        handleFormat("underline");
        return;
      }
    }
  };

  // Keep DOM in sync only when external value changes (prevents cursor jumps)
  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastEmittedRef.current && editorRef.current.innerHTML !== value) {
      const savedPos = saveCursorPosition();
      editorRef.current.innerHTML = value || "";
      // Restore cursor after DOM update
      setTimeout(() => restoreCursorPosition(savedPos), 0);
    }
  }, [value]);

  return (
    <div
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: 10,
        overflow: "hidden",
        background: "#fff",
      }}>
      <RichTextToolbar onFormat={handleFormat} onInsertBullet={insertBulletAtCursor} />

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        // initial content is set by effect; keep attribute empty to avoid resets every render
        style={{
          padding: 12,
          minHeight: minHeight,
          outline: "none",
          fontSize: 14,
          lineHeight: 1.6,
          color: "#0f172a",
          fontFamily: "inherit",
          whiteSpace: "pre-wrap", // Preserve whitespace and allow wrapping
          wordBreak: "break-word", // Break long words
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contentEditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          font-style: italic;
        }
        
        [contentEditable] strong,
        [contentEditable] b {
          font-weight: 700;
        }
        
        [contentEditable] em,
        [contentEditable] i {
          font-style: italic;
        }
        
        [contentEditable] u {
          text-decoration: underline;
        }
        
        [contentEditable] ul {
          margin: 8px 0;
          padding-left: 24px;
          list-style-type: disc;
        }
        
        [contentEditable] ol {
          margin: 8px 0;
          padding-left: 24px;
          list-style-type: decimal;
        }
        
        [contentEditable] li {
          margin: 4px 0;
        }
        
        [contentEditable] {
          cursor: text;
        }
        
        [contentEditable]:focus {
          outline: 2px solid #3b82f6;
          outline-offset: -2px;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
