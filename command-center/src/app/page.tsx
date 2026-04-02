"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PTOEntry } from "@/types/pto";
import { PTOCounter } from "@/components/PTOCounter";
import { DatesTab } from "@/components/DatesTab";

type Tab = "dates" | "counter";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dates");
  const [entries, setEntries] = useState<PTOEntry[]>([]);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    const { data } = await supabase
      .from("pto_dates")
      .select("*")
      .order("date", { ascending: true });

    if (data) {
      setEntries(
        data.map((row) => ({
          ...row,
          is_half_day: row.is_half_day ?? false,
        }))
      );
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">BD Command Center</h1>
      </header>

      <PTOCounter entries={entries} />

      <nav className="tabs" aria-label="Sections">
        <button
          className={`tab ${activeTab === "dates" ? "tab--active" : ""}`}
          onClick={() => setActiveTab("dates")}
        >
          Dates
        </button>
        <button
          className={`tab ${activeTab === "counter" ? "tab--active" : ""}`}
          onClick={() => setActiveTab("counter")}
        >
          Summary
        </button>
      </nav>

      <section className="tab-content">
        {activeTab === "dates" && (
          <DatesTab onEntriesChange={fetchEntries} />
        )}
        {activeTab === "counter" && (
          <div className="summary-tab">
            <PTOCounter entries={entries} />
          </div>
        )}
      </section>
    </main>
  );
}
