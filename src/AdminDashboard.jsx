import React, { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";
import { supabase } from "./supabase.js";

const nav = [
  ["overview", "Overview"],
  ["users", "Users"],
  ["visitors", "Web Visitors"],
  ["games", "FLAMES Games"],
  ["questions", "Questions"],
  ["feedback", "Feedback"]
];

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function isToday(value) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState("overview");
  const [range, setRange] = useState(7);
  const [profiles, setProfiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [matches, setMatches] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      const result = await supabase.auth.getUser();
      const user = result && result.data ? result.data.user : null;

      if (!active) return;

      if (!user) {
        setChecking(false);
        return;
      }

      const adminResult = await supabase
        .from("flames_admin_users")
        .select("user_id,role")
        .eq("user_id", user.id)
        .single();

      if (!active) return;

      if (adminResult.error || !adminResult.data) {
        setError("This account does not have admin access.");
        setChecking(false);
        return;
      }

      setAdmin({ user: user, role: adminResult.data.role });
      setChecking(false);
    }

    checkAdmin();

    return function cleanup() {
      active = false;
    };
  }, []);

  async function loadData() {
    if (!admin) return;

    setRefreshing(true);
    setError("");

    const results = await Promise.all([
      supabase.from("flames_profiles").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("flames_analytics_events").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("flames_matches").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("flames_games").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("flames_feedback").select("*").order("created_at", { ascending: false }).limit(100)
    ]);

    const failed = results.find(function (result) {
      return result && result.error;
    });

    if (failed) {
      setError(failed.error.message || "Unable to load admin data.");
      setRefreshing(false);
      return;
    }

    setProfiles(results[0].data || []);
    setEvents(results[1].data || []);
    setMatches(results[2].data || []);
    setQuestions(results[3].data || []);
    setFeedback(results[4].data || []);
    setRefreshing(false);
  }

  useEffect(function () {
    loadData();
  }, [admin]);

  const metrics = useMemo(function () {
    const uniqueVisitors = new Set(
      events.map(function (event) { return event.visitor_id; }).filter(Boolean)
    );

    const activeToday = new Set(
      events.filter(function (event) { return isToday(event.created_at); })
        .map(function (event) { return event.visitor_id || event.session_id; })
        .filter(Boolean)
    );

    return {
      users: profiles.length,
      uniqueVisitors: uniqueVisitors.size,
      activeToday: activeToday.size,
      games: matches.length,
      gamesToday: matches.filter(function (match) { return isToday(match.created_at); }).length,
      questions: questions.length,
      questionsToday: questions.filter(function (question) { return isToday(question.created_at); }).length,
      newUsersToday: profiles.filter(function (profile) { return isToday(profile.created_at); }).length,
      openFeedback: feedback.filter(function (item) { return item.status !== "resolved"; }).length
    };
  }, [profiles, events, matches, questions, feedback]);

  const timeline = useMemo(function () {
    const rows = [];

    for (let i = range - 1; i >= 0; i -= 1) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const dayVisitors = new Set(
        events.filter(function (event) {
          const time = new Date(event.created_at);
          return time >= start && time < end && event.visitor_id;
        }).map(function (event) {
          return event.visitor_id;
        })
      );

      rows.push({
        day: start,
        visitors: dayVisitors.size
      });
    }

    return rows;
  }, [events, range]);

  const maxVisitors = Math.max(
    1,
    ...timeline.map(function (item) { return item.visitors; })
  );

  function filteredRows(rows, fields) {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter(function (row) {
      return fields.some(function (field) {
        return String(row[field] == null ? "" : row[field]).toLowerCase().includes(needle);
      });
    });
  }

  if (checking) {
    return <div className="admin-empty">Checking admin access...</div>;
  }

  if (!admin) {
    return (
      <div className="admin-empty">
        <strong>{error || "Admin access required."}</strong>
        <div style={{ marginTop: 8 }}>
          Sign in with the administrator account, then open /admin.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className={"admin-sidebar" + (menuOpen ? " open" : "")}>
        <div className="admin-brand">FLAMES <span>ADMIN</span></div>

        <nav className="admin-nav">
          {nav.map(function (item) {
            return (
              <button
                key={item[0]}
                className={page === item[0] ? "active" : ""}
                onClick={function () {
                  setPage(item[0]);
                  setMenuOpen(false);
                }}
              >
                {item[1]}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-foot">
          Role: {admin.role}
          <br />
          Supabase Auth + RLS
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-top">
          <div>
            <button
              className="admin-btn admin-mobile-toggle"
              onClick={function () { setMenuOpen(!menuOpen); }}
            >
              Menu
            </button>
            <div className="admin-kicker">FLAMES CONTROL CENTER</div>
            <h1 className="admin-title">
              {nav.find(function (item) { return item[0] === page; })?.[1] || "Overview"}
            </h1>
          </div>

          <div className="admin-top-actions">
            <select
              className="admin-select"
              value={range}
              onChange={function (event) { setRange(Number(event.target.value)); }}
            >
              <option value="1">Today</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
            </select>
            <button className="admin-btn" onClick={loadData} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {error ? <div className="admin-card admin-error">{error}</div> : null}

        {page === "overview" ? (
          <>
            <section className="admin-grid">
              <Metric label="Real Users" value={metrics.users} note="registered accounts" />
              <Metric label="Web Unique IDs" value={metrics.uniqueVisitors} note="unique visitor IDs" />
              <Metric label="Active Today" value={metrics.activeToday} note="visitor/session activity" />
              <Metric label="Games Played" value={metrics.games} note="saved FLAMES matches" />
              <Metric label="Games Today" value={metrics.gamesToday} note="today" />
              <Metric label="Questions" value={metrics.questions} note="created games" />
              <Metric label="New Users Today" value={metrics.newUsersToday} note="signups" />
              <Metric label="Open Feedback" value={metrics.openFeedback} note="needs review" />
            </section>

            <section className="admin-two">
              <div className="admin-card">
                <div className="admin-card-head">
                  <h3>Visitor activity</h3>
                  <span className="legend">{range} day window</span>
                </div>

                <div className="chart">
                  {timeline.map(function (item) {
                    const height = Math.max(4, (item.visitors / maxVisitors) * 160);
                    return (
                      <div className="bar-wrap" key={item.day.toISOString()}>
                        <div style={{ width: "100%" }}>
                          <div className="bar" style={{ height: height }} />
                          <div className="bar-label">
                            {item.day.toLocaleDateString([], { weekday: "narrow" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="admin-card">
                <h3>Current totals</h3>
                <div className="admin-list">
                  <StatRow label="Classic / Secret matches" value={matches.length} />
                  <StatRow label="Questions created" value={questions.length} />
                  <StatRow label="Feedback received" value={feedback.length} />
                  <StatRow label="Tracked events" value={events.length} />
                </div>
              </div>
            </section>
          </>
        ) : null}

        {page === "users" ? (
          <AdminTable
            title="Registered users"
            rows={filteredRows(profiles, ["username", "display_name", "id"])}
            columns={[
              ["username", "Username"],
              ["display_name", "Name"],
              ["id", "User ID"],
              ["created_at", "Joined"],
              ["last_active_date", "Last Active"]
            ]}
          />
        ) : null}

        {page === "visitors" ? (
          <AdminTable
            title="Web visitor activity"
            rows={filteredRows(events, ["visitor_id", "session_id", "event_name", "path", "device_type"])}
            columns={[
              ["event_name", "Event"],
              ["visitor_id", "Web ID"],
              ["session_id", "Session"],
              ["path", "Path"],
              ["device_type", "Device"],
              ["created_at", "Time"]
            ]}
          />
        ) : null}

        {page === "games" ? (
          <AdminTable
            title="FLAMES matches"
            rows={filteredRows(matches, ["name_a", "name_b", "result_key"])}
            columns={[
              ["name_a", "Name A"],
              ["name_b", "Name B"],
              ["result_key", "Result"],
              ["percent", "%"],
              ["secret_mode", "Mode"],
              ["created_at", "Played"]
            ]}
          />
        ) : null}

        {page === "questions" ? (
          <AdminTable
            title="Created questions"
            rows={filteredRows(questions, ["title", "prompt", "kind"])}
            columns={[
              ["title", "Title"],
              ["kind", "Type"],
              ["prompt", "Prompt"],
              ["created_at", "Created"],
              ["expires_at", "Expires"]
            ]}
          />
        ) : null}

        {page === "feedback" ? (
          <AdminTable
            title="Feedback inbox"
            rows={filteredRows(feedback, ["category", "rating", "message", "status"])}
            columns={[
              ["rating", "Rating"],
              ["category", "Category"],
              ["message", "Message"],
              ["status", "Status"],
              ["created_at", "Received"]
            ]}
          />
        ) : null}
      </main>
    </div>
  );
}

function Metric({ label, value, note }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{formatNumber(value)}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="admin-row">
      <div>
        <strong>{label}</strong>
      </div>
      <span className="pill">{formatNumber(value)}</span>
    </div>
  );
}

function AdminTable({ title, rows, columns }) {
  return (
    <div className="admin-card admin-table-card">
      <div className="admin-toolbar">
        <h3>{title}</h3>
      </div>

      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map(function (column) {
                  return <th key={column[0]}>{column[1]}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map(function (row, index) {
                return (
                  <tr key={row.id || index}>
                    {columns.map(function (column) {
                      return (
                        <td key={column[0]}>
                          {column[0] === "created_at" || column[0] === "expires_at" || column[0] === "last_active_date"
                            ? formatTime(row[column[0]])
                            : column[0] === "secret_mode"
                              ? (row[column[0]] ? "Secret Crush" : "Classic")
                              : String(row[column[0]] == null ? "—" : row[column[0]])}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty">No matching records.</div>
      )}
    </div>
  );
}
