import React, { useEffect, useRef } from "react";

/**
 * Simple Rich Text Editor Component
 * No external dependencies required!
 * Uses contentEditable for basic formatting
 */

const RichTextToolbar = ({ onFormat }) => {
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
      <button
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
        }}
      />

      <button
        type="button"
        onClick={() => onFormat("insertUnorderedList")}
        style={buttonStyle}
        onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
        onMouseLeave={(e) => (e.target.style.background = "#fff")}
        title="Bullet List">
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
      />

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

  const handleFormat = (command) => {
    document.execCommand(command, false, null);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
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

  // Keep DOM in sync only when external value changes (prevents cursor jumps)
  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastEmittedRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
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
      <RichTextToolbar onFormat={handleFormat} />

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        // initial content is set by effect; keep attribute empty to avoid resets every render
        style={{
          padding: 12,
          minHeight: minHeight,
          outline: "none",
          fontSize: 14,
          lineHeight: 1.6,
          color: "#0f172a",
          fontFamily: "inherit",
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
      `}</style>
    </div>
  );
};

export default RichTextEditor;
