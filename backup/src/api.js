// frontend/src/api.js
const BASE = "http://localhost:8000";

export const sendChat = async (message, history = [], officerId = "AK10234") => {
  const resp = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, officer_id: officerId, history })
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
  // Returns: { response, tool_calls, agent_chain, needs_hitl }
};

export const fetchNotifications = async (officerId = "AK10234") => {
  const resp = await fetch(`${BASE}/api/notifications?officer_id=${officerId}`);
  return (await resp.json()).notifications;
};

export const submitApproval = async (actionId, decision, reason = "") => {
  await fetch(`${BASE}/api/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action_id: actionId, officer_id: "AK10234",
      decision, reason
    })
  });
};

export const fetchAuditLog = async (limit = 100) => {
  const resp = await fetch(`${BASE}/api/audit?limit=${limit}`);
  return (await resp.json()).logs;
};