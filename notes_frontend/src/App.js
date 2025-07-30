import React, { useState, useEffect } from "react";
import "./App.css";
import "./index.css";
import "./NotesApp.css";

// Color palette
const COLORS = {
  primary: "#1976D2",
  accent: "#FFC107",
  secondary: "#424242"
};

// API base URL (must be set in .env, fallback is '/api')
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "/api";

// PUBLIC_INTERFACE
function App() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", content: "" });

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    filterNotes();
    // eslint-disable-next-line
  }, [searchTerm, notes]);

  // PUBLIC_INTERFACE
  const fetchNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/notes`);
      if (!res.ok) throw new Error("Failed to load notes");
      const data = await res.json();
      setNotes(data);
      setFilteredNotes(data);
    } catch (err) {
      setError("Could not fetch notes");
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const handleSelect = (id) => {
    if (selectedId === id && editMode) return;
    setSelectedId(id);
    setEditMode(false);
    const note = notes.find((n) => n.id === id);
    if (note) setForm({ title: note.title, content: note.content });
  };

  // PUBLIC_INTERFACE
  const handleNewNote = () => {
    setForm({ title: "", content: "" });
    setSelectedId(null);
    setEditMode(true);
  };

  // PUBLIC_INTERFACE
  const handleEdit = () => setEditMode(true);

  // PUBLIC_INTERFACE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setSelectedId(null);
      setForm({ title: "", content: "" });
      setEditMode(false);
    } catch (err) {
      setError("Could not delete note");
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // PUBLIC_INTERFACE
  const filterNotes = () => {
    if (!searchTerm.trim()) {
      setFilteredNotes(notes);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredNotes(
        notes.filter(
          (n) =>
            n.title.toLowerCase().includes(term) ||
            n.content.toLowerCase().includes(term)
        )
      );
    }
  };

  // PUBLIC_INTERFACE
  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // PUBLIC_INTERFACE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let res, data;
      if (selectedId && editMode) {
        // Update note
        res = await fetch(`${API_BASE_URL}/notes/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to update note");
        data = await res.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === selectedId ? data : n))
        );
        setForm({ title: data.title, content: data.content });
        setSelectedId(data.id);
      } else if (!selectedId) {
        // Create note
        res = await fetch(`${API_BASE_URL}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to create note");
        data = await res.json();
        setNotes((prev) => [data, ...prev]);
        setForm({ title: data.title, content: data.content });
        setSelectedId(data.id);
      }
      setEditMode(false);
    } catch (err) {
      setError(err.message || "Could not save note.");
    } finally {
      setLoading(false);
    }
  };

  // UI helpers
  const currentNote = notes.find((n) => n.id === selectedId);

  return (
    <div className="notes-app-root" style={{ background: "#fafbfb", minHeight: "100vh" }}>
      <div className="notes-header" style={{
        background: COLORS.primary,
        color: "#fff",
        padding: "1rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem", letterSpacing: "1px", fontWeight: 600 }}>Notes</h1>
        <button
          className="header-new-btn"
          style={{
            background: COLORS.accent,
            color: COLORS.secondary,
            border: "none",
            borderRadius: 6,
            padding: "0.5rem 1.2rem",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(50,50,80,0.06)"
          }}
          title="Create a new note"
          onClick={handleNewNote}
        >
          + New Note
        </button>
      </div>
      <div className="notes-main-container">
        {/* Sidebar */}
        <aside className="notes-sidebar">
          <div style={{ padding: "1rem" }}>
            <input
              className="search-input"
              type="search"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search notes…"
              style={{
                fontFamily: "inherit",
                width: "100%",
                border: "1px solid #e0e0e0",
                padding: "0.6rem 0.5rem",
                borderRadius: 5,
                fontSize: "1rem",
                marginBottom: "1.3rem",
                background: "#fff"
              }}
            />
            <div className="sidebar-list-container">
              {loading && notes.length === 0 ? (
                <div style={{ textAlign: "center", padding: ".8rem", color: COLORS.primary }}>
                  Loading…
                </div>
              ) : filteredNotes.length === 0 ? (
                <div style={{ textAlign: "center", padding: ".8rem", color: COLORS.secondary }}>
                  No notes found.
                </div>
              ) : (
                <ul className="sidebar-notes-list">
                  {filteredNotes.map((note) => (
                    <li
                      key={note.id}
                      className={`sidebar-note-item${
                        selectedId === note.id ? " selected" : ""
                      }`}
                      style={{
                        background: selectedId === note.id ? "#f0f7fc" : "#fff",
                        borderLeft: `4px solid ${
                          selectedId === note.id ? COLORS.primary : "transparent"
                        }`,
                      }}
                      onClick={() => handleSelect(note.id)}
                    >
                      <div style={{
                        fontWeight: 600,
                        fontSize: "1.07rem",
                        marginBottom: "2px",
                        color: COLORS.secondary,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap"
                      }}>
                        {note.title}
                      </div>
                      <div style={{
                        fontSize: ".88rem",
                        color: "#757575",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        minHeight: "18px"
                      }}>
                        {note.content.split('\n')[0]}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
        {/* Main Panel */}
        <main className="notes-main-panel" tabIndex={0}>
          {error && (
            <div className="error-msg" style={{ color: "#c62828", margin: "1rem 0 0.5rem 0" }}>
              {error}
            </div>
          )}
          {loading && notes.length > 0 && (
            <div style={{ textAlign: "center", padding: "1rem", color: COLORS.primary }}>
              Loading…
            </div>
          )}
          {!editMode && selectedId && currentNote && (
            <div className="note-view-container">
              <h2 style={{ marginTop: 0, color: COLORS.primary }}>{currentNote.title}</h2>
              <pre
                style={{
                  background: "#f7fafd",
                  minHeight: "100px",
                  border: "1px solid #e0e0e0",
                  padding: "1rem",
                  borderRadius: 8,
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  color: COLORS.secondary,
                  whiteSpace: "pre-wrap"
                }}
              >
                {currentNote.content}
              </pre>
              <div className="note-view-btns">
                <button
                  className="edit-btn"
                  style={buttonStyle(COLORS.primary, "#fff", "solid")}
                  onClick={handleEdit}
                  aria-label="Edit note"
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  style={buttonStyle("#fff", COLORS.secondary, "outline")}
                  onClick={() => handleDelete(currentNote.id)}
                  aria-label="Delete note"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
          {(editMode || !selectedId) && (
            <form
              className="note-form-container"
              onSubmit={handleSubmit}
              autoComplete="off"
              style={{
                marginTop: "2.5rem",
                padding: "2rem 2.5rem",
                borderRadius: 12,
                background: "#fff",
                boxShadow: "0 3px 14px -6px #1976D22d",
                maxWidth: 620,
                marginLeft: "auto",
                marginRight: "auto"
              }}
              aria-label="Note form"
            >
              <h2 style={{ color: COLORS.primary, fontSize: "1.3rem", margin: "0 0 1rem 0" }}>
                {editMode && selectedId
                  ? "Edit Note"
                  : editMode && !selectedId
                  ? "New Note"
                  : ""}
              </h2>
              <input
                type="text"
                name="title"
                placeholder="Title"
                className="note-title-input"
                required
                value={form.title}
                disabled={loading}
                onChange={handleInputChange}
                style={inputStyle()}
                maxLength={100}
              />
              <textarea
                name="content"
                placeholder="Your note…"
                rows={8}
                className="note-content-input"
                required
                value={form.content}
                disabled={loading}
                onChange={handleInputChange}
                style={textareaStyle()}
                maxLength={2000}
              ></textarea>
              <div style={{ display: "flex", alignItems: "center", marginTop: "1.7rem" }}>
                <button
                  type="submit"
                  style={buttonStyle(COLORS.primary, "#fff")}
                  disabled={loading || !form.title.trim() || !form.content.trim()}
                >
                  {selectedId && editMode ? "Save" : "Create"}
                </button>
                {selectedId && (
                  <button
                    type="button"
                    style={buttonStyle("#fff", COLORS.secondary, "outline")}
                    onClick={() => {
                      setEditMode(false);
                      setForm({
                        title: currentNote ? currentNote.title : "",
                        content: currentNote ? currentNote.content : "",
                      });
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
          {!selectedId && !editMode && (
            <div className="empty-state-desc" style={{
              textAlign: "center",
              color: "#bdbdbd",
              marginTop: "4rem",
              fontSize: "1.18rem"
            }}>
              Select a note to view or create a new note.
            </div>
          )}
        </main>
      </div>
      {/* Footer */}
      <footer style={{
        background: "#fafafa",
        padding: "1.1rem",
        textAlign: "center",
        borderTop: "1px solid #ececec",
        marginTop: "auto",
        fontSize: ".93rem",
        color: "#9e9e9e"
      }}>
        Notes app &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// Button styles helper
function buttonStyle(bg, txt, type = "filled") {
  if (type === "outline") {
    return {
      background: "#fff",
      color: txt,
      border: `1.5px solid ${txt}`,
      borderRadius: 5,
      padding: "0.49rem 1.7rem",
      marginRight: "0.7rem",
      fontSize: "1rem",
      fontWeight: 500,
      cursor: "pointer",
      minWidth: 90,
      transition: "all 0.17s"
    };
  }
  return {
    background: bg,
    color: txt,
    border: "none",
    borderRadius: 5,
    padding: "0.49rem 1.7rem",
    marginRight: "0.7rem",
    fontSize: "1rem",
    fontWeight: 500,
    cursor: "pointer",
    minWidth: 90,
    boxShadow: "0 2px 5px rgba(25, 118, 210, 0.08)",
    transition: "all 0.15s"
  };
}
function inputStyle() {
  return {
    fontSize: "1.09rem",
    width: "100%",
    marginBottom: "1.3rem",
    padding: "0.85rem 0.7rem",
    border: "1px solid #e0e0e0",
    borderRadius: 5,
    color: "#333",
    boxSizing: "border-box",
    background: "#f8f9fa",
  };
}
function textareaStyle() {
  return {
    fontSize: "1.07rem",
    width: "100%",
    minHeight: "120px",
    padding: "0.85rem 0.7rem",
    border: "1px solid #e0e0e0",
    borderRadius: 5,
    color: "#333",
    background: "#f8f9fa",
    boxSizing: "border-box"
  };
}

export default App;
