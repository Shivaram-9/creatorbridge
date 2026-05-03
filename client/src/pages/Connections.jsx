import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, firstApiError } from "../services/api.js";
import { roleBadgeClass } from "../utils/badges.js";
import ErrorBanner from "../components/ErrorBanner.jsx";

/** Generate initials */
function initials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

export default function Connections() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [inc, out, acc] = await Promise.all([
        api.connections.incoming(),
        api.connections.outgoing(),
        api.connections.accepted(),
      ]);
      const errMsg = firstApiError(inc, out, acc);
      if (errMsg) {
        setError(errMsg);
      } else {
        setIncoming(Array.isArray(inc) ? inc : []);
        setOutgoing(Array.isArray(out) ? out : []);
        setPartners(Array.isArray(acc) ? acc : []);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function accept(id) {
    setBusyId(id);
    try {
      const result = await api.connections.accept(id);
      if (result?.error) {
        setError(typeof result.error === "string" ? result.error : "Something went wrong");
      } else {
        await load();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id) {
    setBusyId(id);
    try {
      const result = await api.connections.reject(id);
      if (result?.error) {
        setError(typeof result.error === "string" ? result.error : "Something went wrong");
      } else {
        await load();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  /** Reusable user card heading with avatar */
  function UserHeading({ u }) {
    return (
      <div className="user-card__heading">
        <div className="user-card__avatar">
          {u?.avatar ? (
            <img src={u.avatar} alt="" className="user-card__avatar-img" />
          ) : (
            <span className="user-card__avatar-initials">{initials(u?.name, u?.email)}</span>
          )}
        </div>
        <div className="user-card__heading-text">
          <div className="user-card__name-row">
            <h3 className="user-card__name">{u?.name || u?.email}</h3>
            {u?.role && <span className={`badge ${roleBadgeClass(u.role)}`}>{u.role}</span>}
          </div>
          {u?.username && <p className="user-card__username">@{u.username}</p>}
        </div>
      </div>
    );
  }

  const allEmpty = incoming.length === 0 && outgoing.length === 0 && partners.length === 0;

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Connections</h1>
        <p className="subtitle">Accept requests from others and keep track of pending invites.</p>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {loading ? (
        <p className="loading-line">Loading your network</p>
      ) : allEmpty ? (
        /* ─── Hero empty state: nothing at all ─── */
        <div className="empty-state empty-state--hero" role="status">
          <div className="empty-state__illustration" aria-hidden="true">🌐</div>
          <h2 className="empty-state__title">No connections yet</h2>
          <p className="empty-state__text">
            Start exploring creators and brands on CreatorBridge. Send an Align request and build your network.
          </p>
          <div className="empty-state__action">
            <Link to="/discover" className="btn btn-primary">Explore</Link>
            <Link to="/profile" className="btn btn-secondary">Complete profile</Link>
          </div>
        </div>
      ) : (
        <>
          {/* ── Incoming ── */}
          <section className="section-block" aria-labelledby="incoming-heading">
            <h2 id="incoming-heading" className="section-title">
              Incoming requests
            </h2>
            {incoming.length === 0 ? (
              <div className="empty-state empty-state--compact" role="status">
                <div className="empty-state__illustration" aria-hidden="true">📥</div>
                <h3 className="empty-state__title">No incoming requests</h3>
                <p className="empty-state__text">When someone sends you an Align request, it will appear here.</p>
              </div>
            ) : (
              <div className="list-gap">
                {incoming.map((c) => {
                  const u = c.from;
                  const id = c._id;
                  return (
                    <article key={id} className="card user-card">
                      <div className="user-card__body">
                        <UserHeading u={u} />
                        <dl className="user-card__meta">
                          <div className="user-card__meta-row">
                            <dt>Category</dt>
                            <dd className={u?.category ? "" : "muted-pill"}>{u?.category || "Not set"}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="user-card__aside">
                        <div className="row" style={{ justifyContent: "flex-end" }}>
                          <button type="button" className="btn btn-primary btn-sm" disabled={busyId === id} onClick={() => accept(id)}>Accept</button>
                          <button type="button" className="btn btn-danger btn-sm" disabled={busyId === id} onClick={() => reject(id)}>Reject</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Outgoing ── */}
          <section className="section-block" aria-labelledby="outgoing-heading">
            <h2 id="outgoing-heading" className="section-title">
              Outgoing requests
            </h2>
            {outgoing.length === 0 ? (
              <div className="empty-state empty-state--compact" role="status">
                <div className="empty-state__illustration" aria-hidden="true">✉️</div>
                <h3 className="empty-state__title">No pending invites</h3>
                <p className="empty-state__text">
                  Discover people and tap Align — your outgoing requests will show up here until they respond.
                </p>
                <div className="empty-state__action">
                  <Link to="/discover" className="btn btn-secondary btn-sm">Go to Discover</Link>
                </div>
              </div>
            ) : (
              <div className="list-gap">
                {outgoing.map((c) => {
                  const u = c.to;
                  return (
                    <article key={c._id} className="card user-card">
                      <div className="user-card__body">
                        <UserHeading u={u} />
                        <dl className="user-card__meta">
                          <div className="user-card__meta-row">
                            <dt>Category</dt>
                            <dd className={u?.category ? "" : "muted-pill"}>{u?.category || "Not set"}</dd>
                          </div>
                          <div className="user-card__meta-row">
                            <dt>Status</dt>
                            <dd className="status-pill--pending">Awaiting their response</dd>
                          </div>
                        </dl>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Connected ── */}
          <section className="section-block" aria-labelledby="connected-heading">
            <h2 id="connected-heading" className="section-title">
              Connected
            </h2>
            {partners.length === 0 ? (
              <div className="empty-state empty-state--compact" role="status">
                <div className="empty-state__illustration" aria-hidden="true">🤝</div>
                <h3 className="empty-state__title">Your network is empty</h3>
                <p className="empty-state__text">
                  Accepted connections appear here so you can jump straight into messaging.
                </p>
                <div className="empty-state__action">
                  <Link to="/discover" className="btn btn-primary btn-sm">Explore</Link>
                </div>
              </div>
            ) : (
              <div className="list-gap">
                {partners.map((p) => {
                  const u = p.user;
                  const uid = u?._id;
                  return (
                    <article key={uid} className="card user-card">
                      <div className="user-card__body">
                        <UserHeading u={u} />
                        <dl className="user-card__meta">
                          <div className="user-card__meta-row">
                            <dt>Category</dt>
                            <dd className={u?.category ? "" : "muted-pill"}>{u?.category || "Not set"}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="user-card__aside">
                        <Link to={`/chat/${uid}`} className="btn btn-primary btn-sm">Message</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
