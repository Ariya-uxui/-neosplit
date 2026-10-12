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

// Lines that are header/footer noise, never an actual priced item — these
// get skipped entirely so they can't be mistaken for a line item (this is
// what previously caused the receipt's date/time to show up as a fake
// 20-baht "item": nothing told the parser the date line wasn't one).
const SKIP_LINE = [
  /^ใบเสร็จ/i,              // "receipt (abbreviated)" header
  /^ใบกำกับภาษี/i,          // tax invoice header
  /^tax\s*inv/i,
  /^วันที่/i,                // date line
  /^เวลา\s*:/i,             // time label
  /^ออเดอร์/i,              // order id
  /^เลขที่/i,                // "No.:" reference number lines
  /^สาขา/i,                 // branch name
  /^คิว\s*:/i,              // queue number
  /^ทั้งหมด/i,              // grand total
  /^ยอดรวม/i,
  /^รวม(ทั้งหมด)?\b/i,
  /^sub\s*total/i,
  /^total\b/i,
  /^vat\b/i,
  /^vatable\b/i,            // pre-VAT subtotal line
  /^ภาษี/i,
  /^service\s*charge/i,
  /^ค่าบริการ/i,
  /^ส่วนลด/i,                // discount
  /^discount\b/i,
  /^ต้องการใบเสร็จ/i,       // "ask staff for a full receipt" footer
  /^\*+/,                  // starred footnotes
  /^T\d+$/i,               // table/queue number, e.g. "T32"
  /^[-–—]/,                // indented option lines under an item (Hot/Iced, Sweetness, …)
  // Payment / change
  /^(k\s*plus|qr[-\s]?kplus)/i,
  /^change\b/i,
  /^เงินทอน/i,
  /^cash\b/i,
  /^card\b/i,
  /^amount\b/i,             // "Amount Ex. VAT", "Amount VAT Included", …
  /^จำนวนเงิน/i,
  /^จำนวนทั้งหมด/i,          // "total pieces" line
  // Membership / loyalty points — never priced items
  /^member\b/i,
  /^(previous\s+)?point\b/i,
  // Receipt metadata / staff / contact info
  /^staff\b/i,
  /^พนักงาน/i,
  /^cashier\b/i,
  /^เครื่อง/i,
  /^pos\s*no/i,
  /^ref\s*id/i,
  /^register\s*no/i,
  /^tel\s*:/i,
  /^โทรศัพท์/i,
  /^tax\s*id/i,
  /^เลขที่ผู้เสียภาษี/i,
  /^ประเภท\s*:/i,            // "Type: Takeaway" line
  /^sale\s*type/i,
  /^customer\s*:/i,
  /^ลูกค้า/i,
  // Footer courtesies
  /^thank\s*you/i,
  /^for\s*inquiries/i,
  /^please\s*call/i,
  /^สแกน\s*qr/i,
  /^scan\s*qr/i,
  // Bare date/time stamp lines with no label at all (order-open /
  // order-close timestamps on bar & restaurant tabs), e.g. "10-10-2569
  // 23:38" — without this, the trailing minutes/seconds can get mistaken
  // for a price by Pass 1 below.
  /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/,
  // "Transfer" confirmation lines and the currency-prefixed amount
  // printed right under it (e.g. "โอนเงิน" / "฿240.00" / "$240.00") —
  // this is the same total shown again for the payment receipt, not a
  // priced item. Belt-and-braces alongside the hasLetter fix below,
  // which already stops a bare "฿240.00" from looking like it has a
  // letter in it.
  /^โอนเงิน/i,
  /^(transfer|payment)\b/i,
  /^[฿$]\s*[\d,]+\.\d{1,2}$/,
  // A receipt's own column headers ("สินค้า / Qty / ราคารวม" — Item /
  // Qty / Total Price) printed once above the item table. Exact-match
  // only, so a real item that happens to start with one of these words
  // is never accidentally skipped.
  /^สินค้า$/i,
  /^qty$/i,
  /^ราคารวม$/i,
];

const isSkipLine = (line) => SKIP_LINE.some((re) => re.test(line));

// A line with no letters at all (Thai or Latin) is metadata by definition
// — a tax ID, a queue number, a bare quantity, a timestamp — never an
// item's name. Real item names always have letters in every sample
// receipt seen so far, so this is what keeps reference numbers from
// being read as "items" with no name.
//
// The Thai ranges below are deliberately split to exclude ฿ (the Baht
// sign, U+0E3F) and the Thai digits ๐-๙ (U+0E50-0E59) — a single
// "ก-๙" range looks like "Thai letters" but actually spans every
// codepoint in between, Baht sign included, which previously let a
// payment line like "฿240.00" pass as if it had a letter in it.
const hasLetter = (s) => /[a-zA-Zก-ฮะ-ฺเ-๎]/.test(s);

// A real item price always prints with cents (e.g. "70.00", "1,800.00")
// on every receipt format seen so far — requiring the decimal point is
// what tells a genuine price apart from a bare reference number (a tax
// ID, a queue number, a timestamp fragment, an item quantity), which are
// usually several plain digits with no decimal at all.
const PRICE_ONLY = /^[\d,]+\.\d{1,2}$/;
const PRICE_AT_END = /([\d,]+\.\d{1,2})\s*$/;
// Some receipts print a price with a comma instead of a dot for the
// decimal point (e.g. "120,00" instead of "120.00" — either a genuine
// printer setting or an OCR misread of "." as ","). Only matches a
// single comma followed by exactly 2 digits with no dot anywhere, so it
// never collides with "," used as a thousands separator (e.g. "1,800.00"
// already has its own dot and is handled by PRICE_ONLY above).
const COMMA_DECIMAL_ONLY = /^\d+,\d{2}$/;
// An item's quantity column — a short bare integer, e.g. "5", "12".
const QTY_ONLY = /^\d{1,3}$/;

// Reads a price-only line in either format above, or returns null if the
// line isn't a clean price at all.
const priceValue = (line) => {
  if (!line) return null;
  if (PRICE_ONLY.test(line)) return Number(line.replace(/,/g, ""));
  if (COMMA_DECIMAL_ONLY.test(line)) return Number(line.replace(",", "."));
  return null;
};

const cleanName = (raw) =>
  raw.replace(/^x\s*\d+\s*/i, "").trim().replace(/[-–—:.]+$/, "").trim();

// Heuristic line-item parser — Thai receipts vary a lot, so this stays
// deliberately simple and everything stays reviewable/editable/deletable
// next, since OCR misreads are expected, not exceptional. It tries three
// layouts in order, since different receipt printers (and how Vision
// groups text into lines) produce different raw-text shapes for what
// looks like the same printed row — the first one that finds anything
// wins, since a given receipt only ever uses one of these:
//  1. Name and price on the same text line ("Latte          70.00").
//  2. Name, quantity, unit price and line total each on their own line,
//     four lines per item ("VODKA" / "5" / "360.00" / "1,800.00") — common
//     on bar/restaurant tabs with a qty & unit-price column. The line
//     total (not the unit price) is used as the item's price, per
//     "ราคาคือราคารวมทั้งหมด". A wrapped second half of a long name
//     sometimes lands as its own line right after the price columns
//     instead of before them (e.g. "GOOSE)" after "VODKA (GREY"'s
//     prices) — that gets folded back onto the name it belongs to.
//  3. Anything left over — name-only and price-only lines paired up
//     positionally, in the order they appeared. Last resort, for
//     receipts that don't cleanly match either layout above.
// Pulls the grand-total amount straight off the receipt's own "Total /
// รวม / ยอดรวม" line, independent of whatever the item parser below finds.
// Used two ways: (1) inside parseReceiptText, so that number is never
// mistaken for a line item itself, and (2) by the Review screen, to show
// a "your items add up to X but the receipt says Y" check BEFORE saving
// — exactly the kind of gap that let a single misread item slip through
// unnoticed in the past. Returns null if no total line is found at all
// (an unusual receipt layout, or OCR missed it), in which case no
// validation banner is shown rather than a false alarm.
const detectReceiptTotal = (text) => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const totalLine = lines.find((l) =>
    /^(ทั้งหมด|ยอดรวม|รวม(ทั้งหมด)?|grand\s*total|net\s*total|total)\b/i.test(l)
  );
  const m = totalLine && totalLine.match(PRICE_AT_END);
  return m ? Number(m[1].replace(/,/g, "")) : null;
};

// VAT, service charge and discount lines are deliberately excluded from
// the item parser above (SKIP_LINE) so they're never mistaken for a food
// item — but that used to mean they were thrown away entirely, which is
// exactly why a receipt's items never added up to its printed total.
// This pulls each one's own amount off its own labeled line, the same
// way detectReceiptTotal does, so Review can show them and the bill's
// actual amount can include them instead of silently undercounting.
const detectAmountByLabel = (text, labelRegex) => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const line = lines.find((l) => labelRegex.test(l));
  const m = line && line.match(PRICE_AT_END);
  return m ? Number(m[1].replace(/,/g, "")) : null;
};
const VAT_LABEL = /^(vat\b|vatable\b|ภาษี)/i;
const SERVICE_CHARGE_LABEL = /^(service\s*charge|ค่าบริการ)/i;
const DISCOUNT_LABEL = /^(discount\b|ส่วนลด)/i;

const parseReceiptText = (text) => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items = [];

  // The grand total's own amount (when it's on the same line as its
  // label) gets excluded from ever being mistaken for an item's price.
  const usedTotal = detectReceiptTotal(text);

  // Pass 1: same-line "name ... price".
  lines.forEach((line, i) => {
    if (isSkipLine(line)) return;
    const match = line.match(PRICE_AT_END);
    if (!match) return;
    const amount = Number(match[1].replace(/,/g, ""));
    const name = cleanName(line.slice(0, match.index));
    if (name && hasLetter(name) && amount > 0 && amount !== usedTotal) {
      items.push({ id: `item-${i}-${Date.now()}`, name, amount });
    }
  });

  // Pass 2: structured blocks where each item's name, quantity and price
  // are on their own lines rather than sharing one line with Pass 1.
  // Two layouts are tried at each position, since receipts differ on
  // whether they print a separate unit-price column:
  //  - 4 lines: name / qty / unit price / line total (bar & restaurant
  //    tabs with a visible unit-price column, e.g. "VODKA"/"5"/"360.00"/
  //    "1,800.00").
  //  - 3 lines: name / qty / line total only, no unit-price column (a
  //    simpler item/qty/total table) — the same line total either way.
  if (items.length === 0) {
    const tryBlock = (start) => {
      const nameLine = lines[start];
      if (!nameLine || isSkipLine(nameLine) || !hasLetter(nameLine) || PRICE_ONLY.test(nameLine)) return null;
      const qty = lines[start + 1];
      if (!qty || !QTY_ONLY.test(qty)) return null;

      const unit = lines[start + 2];
      const total4 = lines[start + 3];
      const totalFromUnit = priceValue(unit);
      const totalFromTotal4 = priceValue(total4);
      if (totalFromUnit != null && totalFromTotal4 != null) {
        return { name: cleanName(nameLine), amount: totalFromTotal4, consumed: 4 };
      }

      const total3 = priceValue(lines[start + 2]);
      if (total3 != null) {
        return { name: cleanName(nameLine), amount: total3, consumed: 3 };
      }

      return null;
    };

    let i = 0;
    while (i < lines.length) {
      const block = tryBlock(i);
      if (!block) {
        i += 1;
        continue;
      }
      const { consumed, ...item } = block;
      items.push({ id: `item-${i}-${Date.now()}`, ...item });
      i += consumed;

      const next = lines[i];
      if (next && !isSkipLine(next) && hasLetter(next) && priceValue(next) == null && !tryBlock(i)) {
        items[items.length - 1].name = cleanName(`${items[items.length - 1].name} ${next}`);
        i += 1;
      }
    }
  }

  // Pass 3: last resort — pair up leftover name-only and price-only
  // lines positionally, in the order they appeared.
  if (items.length === 0) {
    const leftoverNames = [];
    const leftoverPrices = [];
    lines.forEach((line, i) => {
      if (isSkipLine(line)) return;
      const value = priceValue(line);
      if (value != null) {
        if (value > 0 && value !== usedTotal) leftoverPrices.push({ i, value });
        return;
      }
      if (!hasLetter(line)) return; // bare numbers that aren't a clean price — never a name
      const name = cleanName(line);
      if (name) leftoverNames.push({ i, value: name });
    });
    const count = Math.min(leftoverNames.length, leftoverPrices.length);
    for (let k = 0; k < count; k++) {
      items.push({ id: `item-${leftoverNames[k].i}-${Date.now()}`, name: leftoverNames[k].value, amount: leftoverPrices[k].value });
    }
  }

  return items;
};

function ScanReceipt({ setPage, tripMembers = [], userProfile, addExpense }) {
  const [stage, setStage] = useState("capture"); // capture | processing | review | assign | confirm
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [rawText, setRawText] = useState(""); // last OCR output, shown in a debug box below so it can be read/screenshotted straight off the phone — no DevTools needed
  const [assignments, setAssignments] = useState({}); // { itemId: [memberIds] }
  // The receipt's own printed "Total" line, read independently of the
  // item list — lets Review flag "your items don't add up to the
  // receipt's total" before you save, instead of only noticing a missed
  // or misread item later in Settlement.
  const [detectedTotal, setDetectedTotal] = useState(null);
  // VAT / service charge / discount, auto-detected from the receipt but
  // editable — these apply to the WHOLE receipt, not any one item, so
  // they're tracked separately and distributed proportionally across
  // each resulting bill when saving (see groupedBills below).
  const [extraCharges, setExtraCharges] = useState({ vat: 0, service: 0, discount: 0 });
  // tripMembers is [{id, name}] — paidBy/assignments store ids now, not
  // names, so this is the one place display names get resolved.
  const nameOf = (id) => tripMembers.find((m) => m.id === id)?.name || id || "";
  const [paidBy, setPaidBy] = useState(userProfile?.id || tripMembers[0]?.id || "");
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
      // Kept in state (shown in a collapsible debug box below) so the raw
      // OCR text can just be read/screenshotted directly off the phone —
      // no DevTools or computer needed to see what Vision actually read.
      setRawText(data.text || "");
      const parsed = parseReceiptText(data.text || "");
      setDetectedTotal(detectReceiptTotal(data.text || ""));
      setExtraCharges({
        vat: detectAmountByLabel(data.text || "", VAT_LABEL) || 0,
        service: detectAmountByLabel(data.text || "", SERVICE_CHARGE_LABEL) || 0,
        discount: detectAmountByLabel(data.text || "", DISCOUNT_LABEL) || 0,
      });
      if (parsed.length === 0) {
        setError("Couldn't find any line items — you can add them manually below.");
      }
      setItems(parsed);
      // Default every item to shared by everyone — quicker to uncheck
      // the odd person out than to check everyone in, for a typical
      // group meal where most items are shared.
      const initialAssignments = {};
      const allMemberIds = tripMembers.map((m) => m.id);
      parsed.forEach((it) => { initialAssignments[it.id] = [...allMemberIds]; });
      setAssignments(initialAssignments);
      setStage("review");
    } catch (err) {
      console.error(err);
      setError("Something went wrong reading the receipt. Try again, or add items manually.");
      setItems([]);
      setAssignments({});
      setRawText("");
      setDetectedTotal(null);
      setExtraCharges({ vat: 0, service: 0, discount: 0 });
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
    setAssignments((prev) => ({ ...prev, [id]: tripMembers.map((m) => m.id) }));
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
  // bills when everyone actually shared everything. Each group's
  // `rawTotal` is just its own items; `total` additionally folds in its
  // proportional share of VAT/service charge/discount (see
  // netExtraCharge below), which is the amount actually saved as the
  // bill.
  const netExtraCharge =
    (Number(extraCharges.vat) || 0) +
    (Number(extraCharges.service) || 0) -
    (Number(extraCharges.discount) || 0);

  // Items get silently left out of groupedBills below when they have no
  // name, no positive amount (zero, blank, or an accidental negative
  // from the number input), or nobody assigned — this is exactly the
  // kind of silent data loss "deleting all members from an item" or
  // "zero-amount item" torture-testing turns up, so Confirm surfaces
  // WHICH items were skipped and why, instead of the item just vanishing
  // with no trace.
  const skippedItems = React.useMemo(() => {
    return items
      .map((it) => {
        const members = assignments[it.id] || [];
        if (!it.name || !it.name.trim()) return { item: it, reason: "no name" };
        if (!(Number(it.amount) > 0)) return { item: it, reason: "no amount" };
        if (members.length === 0) return { item: it, reason: "no one assigned" };
        return null;
      })
      .filter(Boolean);
  }, [items, assignments]);

  const groupedBills = React.useMemo(() => {
    const groups = {};
    items.forEach((it) => {
      const members = (assignments[it.id] || []).slice().sort();
      // Require a strictly positive amount (not just "truthy") so a
      // mistyped negative number never quietly reduces a shared bill's
      // total instead of being caught here.
      if (members.length === 0 || !it.name.trim() || !(Number(it.amount) > 0)) return;
      const key = members.join("|");
      if (!groups[key]) groups[key] = { members, items: [], rawTotal: 0 };
      groups[key].items.push(it);
      groups[key].rawTotal += Number(it.amount) || 0;
    });
    const allGroups = Object.values(groups);
    // Distribute VAT/service charge/discount across groups in proportion
    // to how much each group actually ordered — a group that ordered
    // 80% of the items' value carries 80% of the VAT/service charge too,
    // rather than splitting those charges equally regardless of who
    // ordered what.
    const itemsSum = allGroups.reduce((s, g) => s + g.rawTotal, 0);
    allGroups.forEach((g) => {
      const share = itemsSum > 0 ? g.rawTotal / itemsSum : 0;
      g.total = Number((g.rawTotal + share * netExtraCharge).toFixed(2));
    });
    return allGroups;
  }, [items, assignments, netExtraCharge]);

  const handleConfirm = () => {
    groupedBills.forEach((group) => {
      const isMultiItem = group.items.length > 1;
      addExpense({
        // A short, stable title instead of every item's name stitched
        // together (which could run to "Scanned: SINGHA BOTTLE,
        // Brooklyn Lager, Vodka..." and overflow everywhere it's shown).
        // The real item names aren't lost — they're kept on `items`
        // below for a future itemized Bill Detail view.
        name: isMultiItem ? `Scanned Receipt (${group.items.length} items)` : group.items[0].name,
        amount: group.total,
        paidBy,
        category: "Food",
        sharedBy: group.members,
        status: "Pending",
        date: new Date().toLocaleDateString("en-GB"),
        // Kept for a drill-down item breakdown in Bill Detail — the real
        // item names/amounts aren't lost just because the bill itself is
        // saved under one combined name+amount. If this group carries a
        // share of VAT/service charge/discount, that share is appended
        // as its own line so the breakdown still sums to the bill's
        // total exactly, instead of leaving an unexplained gap.
        items: [
          ...group.items.map((i) => ({ name: i.name, amount: Number(i.amount) || 0 })),
          ...(Math.abs(group.total - group.rawTotal) > 0.004
            ? [{ name: "VAT / Service Charge / Discount", amount: Number((group.total - group.rawTotal).toFixed(2)) }]
            : []),
        ],
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
                min="0"
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

          {/* ── Extra Charges — VAT, service charge, discount. Auto-read
              off the receipt when found; always editable in case OCR
              missed one or got the amount wrong. These apply to the
              WHOLE receipt, so unlike items above they're not assigned
              to specific people here — they get split across the bills
              below in proportion to what each group actually ordered. ── */}
          <div className="ns-section-label">Extra Charges</div>
          <div className="ns-card" style={{ marginBottom: 14 }}>
            {[
              { key: "vat", label: "VAT", icon: "🧾" },
              { key: "service", label: "Service Charge", icon: "🛎️" },
              { key: "discount", label: "Discount", icon: "🏷️ −" },
            ].map((row, i) => (
              <div key={row.key} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: i > 0 ? "10px 0 0" : "0 0 10px",
                borderTop: i > 0 ? "1px solid var(--ns-border)" : "none",
              }}>
                <span style={{ fontSize: 13, flex: 1, color: "var(--ns-text2)" }}>{row.icon} {row.label}</span>
                <input
                  type="number"
                  value={extraCharges[row.key] || ""}
                  placeholder="0"
                  onChange={(e) => setExtraCharges((prev) => ({ ...prev, [row.key]: Number(e.target.value) }))}
                  style={{
                    width: 90, padding: "6px 8px", borderRadius: 10, textAlign: "right",
                    background: "var(--ns-card2)", border: "1px solid var(--ns-border)",
                    color: "var(--ns-text)", fontFamily: "var(--ns-syne)", fontWeight: 700, fontSize: 13,
                  }}
                />
              </div>
            ))}
            <div style={{ fontSize: 11, color: "var(--ns-muted)", marginTop: 10 }}>
              Split across the bills below in proportion to what each group ordered.
            </div>
          </div>

          {/* ── Total check — compares items + VAT + service charge −
              discount against the receipt's OWN printed total, live as
              you edit anything above, so a missed or misread item gets
              caught here instead of surfacing later as a wrong
              Settlement. A small gap can still be normal (a rounding
              difference), so this informs rather than blocks — it never
              disables Continue. ── */}
          {items.length > 0 && detectedTotal != null && (() => {
            const itemsSum = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
            const adjustedSum = Number((itemsSum + netExtraCharge).toFixed(2));
            const diff = Number((detectedTotal - adjustedSum).toFixed(2));
            const matches = Math.abs(diff) < 1;
            return (
              <div className="ns-card" style={{
                marginBottom: 14,
                border: `1px solid ${matches ? "color-mix(in srgb, var(--ns-g) 25%, transparent)" : "color-mix(in srgb, var(--ns-y) 30%, transparent)"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: matches ? 0 : 6 }}>
                  <span style={{ fontSize: 12, color: "var(--ns-muted)" }}>
                    {matches ? "✓ Matches the receipt total" : "⚠️ Doesn't match the receipt total"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ns-text)" }}>
                    {adjustedSum.toFixed(2)} / {detectedTotal.toFixed(2)} THB
                  </span>
                </div>
                {!matches && (
                  <div style={{ fontSize: 11, color: "var(--ns-muted)" }}>
                    {diff > 0
                      ? `Receipt total is ${diff.toFixed(2)} THB higher — check for a missed item or a VAT/service charge amount that's off.`
                      : `${Math.abs(diff).toFixed(2)} THB more than the receipt total — check for a misread or duplicated item.`}
                  </div>
                )}
              </div>
            );
          })()}

          {rawText && (
            <details className="ns-card" style={{ marginBottom: 14, padding: 14 }}>
              <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--ns-muted)" }}>
                🔍 Debug: show raw scanned text
              </summary>
              <pre style={{
                marginTop: 10, fontSize: 11, color: "var(--ns-text)", whiteSpace: "pre-wrap",
                wordBreak: "break-word", maxHeight: 260, overflowY: "auto",
                background: "var(--ns-card2)", borderRadius: 8, padding: 10,
              }}>
                {rawText}
              </pre>
            </details>
          )}

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
                  const active = (assignments[it.id] || []).includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAssignment(it.id, m.id)}
                      style={{
                        padding: "6px 12px", borderRadius: 100, cursor: "pointer",
                        border: `1px solid ${active ? "color-mix(in srgb, var(--ns-g) 40%, transparent)" : "var(--ns-border)"}`,
                        background: active ? "color-mix(in srgb, var(--ns-g) 10%, transparent)" : "var(--ns-card2)",
                        color: active ? "var(--ns-g)" : "var(--ns-muted)",
                        fontSize: 12, fontWeight: 600,
                      }}
                    >
                      {active ? "✓ " : ""}{m.name}
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
              {tripMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="ns-section-label">
            {groupedBills.length} bill{groupedBills.length !== 1 ? "s" : ""} will be created
          </div>
          <div style={{ fontSize: 12, color: "var(--ns-muted)", marginBottom: 12, marginTop: -8 }}>
            Items shared by the exact same people are combined into one bill.
            {netExtraCharge !== 0 && " Each bill's amount includes its share of VAT/service charge/discount."}
          </div>

          {/* Anything dropped from the bills below gets named here instead
              of just disappearing — a blank/zero amount, no name, or
              nobody assigned to split it. */}
          {skippedItems.length > 0 && (
            <div className="ns-card" style={{
              marginBottom: 14, border: "1px solid color-mix(in srgb, var(--ns-r) 25%, transparent)",
              background: "color-mix(in srgb, var(--ns-r) 6%, transparent)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ns-r)", marginBottom: 6 }}>
                ⚠️ {skippedItems.length} item{skippedItems.length !== 1 ? "s" : ""} won't be saved
              </div>
              {skippedItems.map(({ item, reason }) => (
                <div key={item.id} style={{ fontSize: 12, color: "var(--ns-muted)" }}>
                  {item.name?.trim() || "(unnamed item)"} — {reason}
                </div>
              ))}
            </div>
          )}

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
                <div style={{ fontSize: 12, color: "var(--ns-muted)" }}>{group.members.map(nameOf).join(" · ")}</div>
                {netExtraCharge !== 0 && (
                  <div style={{ fontSize: 11, color: "var(--ns-muted)", marginTop: 2 }}>
                    incl. {(group.total - group.rawTotal).toFixed(2)} THB of VAT/service/discount
                  </div>
                )}
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