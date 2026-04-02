"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PTOEntry,
  PTOEntryInsert,
  ptoValue,
} from "@/types/pto";

interface DatesTabProps {
  onEntriesChange?: () => void;
}

interface FormState {
  date: string;
  note: string;
  is_half_day: boolean;
}

const emptyForm = (): FormState => ({
  date: "",
  note: "",
  is_half_day: false,
});

export function DatesTab({ onEntriesChange }: DatesTabProps) {
  const [entries, setEntries] = useState<PTOEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pto_dates")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setEntries((data ?? []).map(normalizeEntry));
    }
    setLoading(false);
  }

  function normalizeEntry(row: Record<string, unknown>): PTOEntry {
    return {
      id: row.id as string,
      date: row.date as string,
      note: row.note as string | undefined,
      // Treat missing/null as full day (false)
      is_half_day: (row.is_half_day as boolean) ?? false,
      created_at: row.created_at as string,
    };
  }

  function startEdit(entry: PTOEntry) {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      note: entry.note ?? "",
      is_half_day: entry.is_half_day,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  }

  async function handleSave() {
    if (!form.date) {
      setError("Date is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload: PTOEntryInsert = {
      date: form.date,
      note: form.note || undefined,
      is_half_day: form.is_half_day,
    };

    if (editingId) {
      const { error } = await supabase
        .from("pto_dates")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("pto_dates").insert(payload);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setEditingId(null);
    setForm(emptyForm());
    await fetchEntries();
    onEntriesChange?.();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this PTO entry?")) return;
    const { error } = await supabase
      .from("pto_dates")
      .delete()
      .eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      await fetchEntries();
      onEntriesChange?.();
    }
  }

  const isEditing = editingId !== null;

  return (
    <div className="dates-tab">
      <h2 className="section-title">PTO Dates</h2>

      {/* Add / Edit Form */}
      <div className="pto-form card">
        <h3>{isEditing ? "Edit PTO Event" : "Add PTO Event"}</h3>

        <div className="form-row">
          <label htmlFor="pto-date">Date</label>
          <input
            id="pto-date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>

        <div className="form-row">
          <label htmlFor="pto-note">Note (optional)</label>
          <input
            id="pto-note"
            type="text"
            placeholder="e.g. Doctor appointment"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        <div className="form-row toggle-row">
          <label htmlFor="pto-half-day" className="toggle-label">
            Half Day
          </label>
          <button
            id="pto-half-day"
            role="switch"
            aria-checked={form.is_half_day}
            className={`toggle ${form.is_half_day ? "toggle--on" : "toggle--off"}`}
            onClick={() =>
              setForm({ ...form, is_half_day: !form.is_half_day })
            }
          >
            <span className="toggle-thumb" />
          </button>
          {form.is_half_day && (
            <span className="half-day-hint">0.5 days will be deducted</span>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : isEditing ? "Update" : "Add"}
          </button>
          {isEditing && (
            <button className="btn btn-secondary" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Entry List */}
      {loading ? (
        <p className="loading">Loading PTO dates…</p>
      ) : entries.length === 0 ? (
        <p className="empty">No PTO dates recorded yet.</p>
      ) : (
        <ul className="pto-list">
          {entries.map((entry) => (
            <li key={entry.id} className="pto-item">
              <div className="pto-item-left">
                <span className="pto-date">
                  {formatDate(entry.date)}
                </span>
                {entry.is_half_day && (
                  <span className="half-day-badge" title="Half Day">
                    ½
                  </span>
                )}
                {entry.note && (
                  <span className="pto-note">{entry.note}</span>
                )}
              </div>
              <div className="pto-item-right">
                <span className="pto-value">
                  {ptoValue(entry) === 0.5 ? "0.5 day" : "1 day"}
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={() => startEdit(entry)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-ghost btn-danger"
                  onClick={() => handleDelete(entry.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDate(isoDate: string): string {
  // isoDate is "YYYY-MM-DD"; parse in local time to avoid UTC offset shifting the day
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
