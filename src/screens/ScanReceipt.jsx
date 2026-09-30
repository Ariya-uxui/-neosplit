import React, { useState, useRef } from "react";
import "../App.css";

// Resize/compress in the browser before upload — a raw phone photo can be
// 5-10MB, which blows past Vercel's serverless request-size limit once
// base64-encoded (~33% bigger). 1600px / JPEG 0.75 is plenty for OCR.
const resizeImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        resolve({ dataUrl, base64: dataUrl.split(",")[1] });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Heuristic line-item parser — Thai receipts vary a lot, so this is
// deliberately simple: any line ending in a number is treated as
// "<name> <price>". Everything gets reviewed/editable/deletable next,
// since OCR misreads (especially Thai text) are expected, not exceptional.
const parseReceiptText = (text) => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const priceAtEnd = /([\d,]+\.\d{1,2}|\d{2,})\s*$/;
  const items = [];
  lines.forEach((line, i) => {
    const match = line.match(priceAtEnd);
    if (!match) return;
    const amount = Number(match[1].replace(/,/g, ""));
    const name = line.slice(0, match.index).trim().replace(/[-–—:.]+$/, "").trim();
    if (!name || !amount || amount <= 0) return;
    items.push({ id: `item-${i}-${Date.now()}`, name, amount });
  });
  return items;
};

function ScanReceipt({ setPage, tripMembers = [], userProfile, addExpense }) {
  const [stage, setStage] = useState("capture"); // capture | processing | review | assign | confirm
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [assignments, setAssignments] = useState({}); // { itemId: [names] }
  const [paidBy, setPaidBy] = useState(userProfile?.name || tripMembers[0] || "");
  const fileInputCamera = useRef(null);
  const fileInputGallery = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setError("");
    setStage("processing");
    try {
      const { base64 } = await resizeImage(file);
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR failed");
      const parsed = parseReceiptText(data.text || "");
      if (parsed.length === 0) {
        setError("Couldn't find any line items — you can add them manually below.");
      }
      setItems(parsed);
      // Default every item to shared by everyone — quicker to uncheck
      // the odd person out than to check everyone in, for a typical
      // group meal where most items are shared.
      const initialAssignments = {};
      parsed.forEach((it) => { initialAssignments[it.id] = [...tripMembers]; });
      setAssignments(initialAssignments);
      setStage("review");
    } catch (err) {
      console.error(err);
      setError("Something went wrong reading the receipt. Try again, or add items manually.");
      setItems([]);
      setAssignments({});
      setStage("review");
    }
  };

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addBlankItem = () => {
    const id = `item-manual-${Date.now()}`;
    setItems((prev) => [...prev, { id, name: "", amount: 0 }]);
    setAssignments((prev) => ({ ...prev, [id]: [...tripMembers] }));
  };

  const toggleAssignment = (itemId, member) => {
    setAssignments((prev) => {
      const current = prev[itemId] || [];
      const next = current.includes(member)
        ? current.filter((m) => m !== member)
        : [...current, member];
      return { ...prev, [itemId]: next };
    });
  };

  // Group items that share the exact same set of members into one bill
  // each — this is what keeps a 3-item receipt from becoming 3 separate
  // bills when everyone actually shared everything.
  const groupedBills = React.useMemo(() => {
    const groups = {};
    items.forEach((it) => {
      const members = (assignments[it.id] || []).slice().sort();
      if (members.length === 0 || !it.name.trim() || !it.amount) return;
      const key = members.join("|");
      if (!groups[key]) groups[key] = { members, items: [], total: 0 };
      groups[key].items.push(it);
      groups[key].total += Number(it.amount) || 0;
    });
    return Object.values(groups);
  }, [items, assignments]);

  const handleConfirm = () => {
    groupedBills.forEach((group) => {
      addExpense({
        name: group.items.length > 1
          ? `Scanned: ${group.items.map((i) => i.name).join(", ")}`
          : group.items[0].name,
        amount: group.total,
        paidBy,
        category: "Food",
        sharedBy: group.members,
        status: "Pending",
        date: new Date().toLocaleDateString("en-GB"),
      });
    });
    setPage("receipt");
  };

  return (
    <div className="ns-screen">
      <div className="ns-page-header">
        <button className="ns-back-btn" onClick={() => setPage("addexpense")}>‹</button>
        <span className="ns-title">Scan Receipt</span>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Capture ── */}
      {stage === "capture" && (
        <>
          <div className="ns-card" style={{ textAlign: "center", padding: 32, marginBottom: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🧾</div>
            <div style={{ fontWeight: 700, color: "var(--ns-text)", marginBottom: 6 }}>
              Scan a receipt
            </div>
            <div style={{ fontSize: 13, color: "var(--ns-muted)" }}>
              We'll read the items, then you assign who's sharing what.
            </div>
          </div>

          <input
            ref={fileInputCamera}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFile}
          />
          <input
            ref={fileInputGallery}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFile}
          />

          <button className="ns-btn ns-btn-primary" onClick={() => fileInputCamera.current?.click()}>
            📷 Take Photo
          </button>
          <button className="ns-btn ns-btn-dark" style={{ marginTop: 10 }} onClick={() => fileInputGallery.current?.click()}>
            🖼️ Choose from Gallery
          </button>
          <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setPage("addexpense")}>
            ← Back
          </button>
        </>
      )}

      {/* ── Processing ── */}
      {stage === "processing" && (
        <div className="ns-card" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>⏳</div>
          <div style={{ fontWeight: 700, color: "var(--ns-text)" }}>Reading your receipt…</div>
          <div style={{ fontSize: 12, color: "var(--ns-muted)", marginTop: 6 }}>This takes a few seconds</div>
        </div>
      )}

      {/* ── Review Items ── */}
      {stage === "review" && (
        <>
          {error && (
            <div style={{ padding: "12px 16px", marginBottom: 14, background: "color-mix(in srgb, var(--ns-y) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--ns-y) 25%, transparent)", borderRadius: 12, fontSize: 12, color: "var(--ns-text)" }}>
              ⚠️ {error}
            </div>
          )}
          <div className="ns-section-label">Review Items</div>
          <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 12, marginTop: -8 }}>
            Thai receipts (VAT, service charge, faint print) don't always read perfectly — fix anything wrong before continuing.
          </div>

          {items.map((it) => (
            <div key={it.id} className="ns-card" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <input
                className="ns-input"
                style={{ flex: 1, marginBottom: 0 }}
                value={it.name}
                placeholder="Item name"
                onChange={(e) => updateItem(it.id, "name", e.target.value)}
              />
              <input
                className="ns-input"
                type="number"
                style={{ width: 90, marginBottom: 0, textAlign: "right" }}
                value={it.amount}
                placeholder="0"
                onChange={(e) => updateItem(it.id, "amount", Number(e.target.value))}
              />
              <button
                type="button"
                onClick={() => removeItem(it.id)}
                style={{ background: "none", border: "none", color: "var(--ns-r)", fontSize: 18, cursor: "pointer", padding: 4, flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          ))}

          <button className="ns-btn ns-btn-dark" style={{ marginBottom: 14 }} onClick={addBlankItem}>
            + Add Item
          </button>

          <button
            className="ns-btn ns-btn-primary"
            disabled={items.length === 0}
            style={{ opacity: items.length === 0 ? 0.5 : 1 }}
            onClick={() => setStage("assign")}
          >
            Assign Members →
          </button>
          <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setStage("capture")}>
            ← Rescan
          </button>
        </>
      )}

      {/* ── Assign Members ── */}
      {stage === "assign" && (
        <>
          <div className="ns-section-label">Assign Members</div>
          <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 12, marginTop: -8 }}>
            Tap to toggle who's sharing each item — everyone's selected by default.
          </div>

          {items.map((it) => (
            <div key={it.id} className="ns-card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ns-text)" }}>{it.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-y)" }}>{Number(it.amount).toFixed(2)} THB</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {tripMembers.map((m) => {
                  const active = (assignments[it.id] || []).includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleAssignment(it.id, m)}
                      style={{
                        padding: "6px 12px", borderRadius: 100, cursor: "pointer",
                        border: `1px solid ${active ? "color-mix(in srgb, var(--ns-g) 40%, transparent)" : "var(--ns-border)"}`,
                        background: active ? "color-mix(in srgb, var(--ns-g) 10%, transparent)" : "var(--ns-card2)",
                        color: active ? "var(--ns-g)" : "var(--ns-muted)",
                        fontSize: 12, fontWeight: 600,
                      }}
                    >
                      {active ? "✓ " : ""}{m}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button className="ns-btn ns-btn-primary" style={{ marginTop: 4 }} onClick={() => setStage("confirm")}>
            Continue →
          </button>
          <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setStage("review")}>
            ← Back to Items
          </button>
        </>
      )}

      {/* ── Confirm ── */}
      {stage === "confirm" && (
        <>
          <div className="ns-card" style={{ marginBottom: 14 }}>
            <label className="ns-input-label">Paid By</label>
            <select className="ns-input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} style={{ marginBottom: 0 }}>
              {tripMembers.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="ns-section-label">
            {groupedBills.length} bill{groupedBills.length !== 1 ? "s" : ""} will be created
          </div>
          <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 12, marginTop: -8 }}>
            Items shared by the exact same people are combined into one bill.
          </div>

          {groupedBills.length === 0 ? (
            <div className="ns-card" style={{ textAlign: "center", padding: 24, color: "var(--ns-muted)" }}>
              Nothing to save — go back and assign at least one member to an item.
            </div>
          ) : (
            groupedBills.map((group, i) => (
              <div key={i} className="ns-card" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ns-text)" }}>
                    {group.items.map((it) => it.name).join(", ")}
                  </span>
                  <span style={{ fontFamily: "var(--ns-syne)", fontSize: 15, fontWeight: 800, color: "var(--ns-g)" }}>
                    {group.total.toFixed(2)} THB
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--ns-muted)" }}>{group.members.join(" · ")}</div>
              </div>
            ))
          )}

          <button
            className="ns-btn ns-btn-primary"
            disabled={groupedBills.length === 0}
            style={{ opacity: groupedBills.length === 0 ? 0.5 : 1, marginTop: 4 }}
            onClick={handleConfirm}
          >
            🎉 Confirm & Save
          </button>
          <button className="ns-btn ns-btn-ghost" style={{ marginTop: 10 }} onClick={() => setStage("assign")}>
            ← Back
          </button>
        </>
      )}
    </div>
  );
}

export default ScanReceipt;