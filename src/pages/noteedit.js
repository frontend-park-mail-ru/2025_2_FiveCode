import { htmlToElement } from "../templates.js";
import { Sidebar } from "../components/sidebar.js";

let notes = JSON.parse(localStorage.getItem("notes") || "[]");

function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

export function renderNoteEdit({ id }) {
    const page = document.createElement("div");
    page.classList.add("page");

    const sidebar = Sidebar({ user: JSON.parse(localStorage.getItem("mockCurrentUser")) });

    let note = notes.find(n => n.id == id);
    if (!note) {
    note = { id, title: "New Note", content: "" };
    notes.push(note);
    saveNotes();
    }

    const editor = htmlToElement(`
    <div class="note-editor">
        <input type="text" class="note-title" value="${note.title}" />
        <textarea class="note-content">${note.content}</textarea>
        <button class="save-btn">Save</button>
    </div>
    `);

    editor.querySelector(".save-btn").addEventListener("click", () => {
    note.title = editor.querySelector(".note-title").value;
    note.content = editor.querySelector(".note-content").value;
    saveNotes();
    window.navigate("/notes");
    });

    page.appendChild(sidebar);
    page.appendChild(editor);

return page;
}
