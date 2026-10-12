// Settlement math test suite — run with: node settlement.test.js
//
// This is a standalone script, not hooked into any test framework (the
// project doesn't have one set up yet). It re-implements the EXACT same
// two functions Settlement.jsx uses — splitDeterministic() and the
// balance/transfer computation — so run it after copying any future
// change to Settlement.jsx's math over here too, to catch a regression
// before it reaches the app.
//
// What it checks, per the mentor review's Milestone 1 checklist:
//   1. Equal split with a remainder (100 THB / 3 people) — satang-exact
//   2. Payer who didn't participate in their own bill
//   3. Multi-bill netting across more than 2 people
//   4. The one invariant that must ALWAYS hold: every balance in the
//      group sums to exactly 0 — if it doesn't, money has been
//      created or destroyed somewhere, which is the worst possible bug
//      for a bill-splitting app to ship.
//   5. Non-divisible splits in general (randomised check)
//   6. Custom Split's balance math (payer credited in full, debited by
//      the fixed custom amount instead of an equal share)

// ── Copied verbatim from Settlement.jsx — keep these two in sync ──
const splitDeterministic = (amount, people) => {
  const n = people.length;
  const result = {};
  if (n === 0) return result;
  const totalCents = Math.round((Number(amount) || 0) * 100);
  const baseCents = Math.floor(totalCents / n);
  const remainderCents = totalCents - baseCents * n;
  people.forEach((person, i) => {
    const cents = baseCents + (i < remainderCents ? 1 : 0);
    result[person] = cents / 100;
  });
  return result;
};

const computeBalances = (bills, memberIds) => {
  const balances = {};
  memberIds.forEach((id) => { balances[id] = 0; });
  bills.forEach((bill) => {
    const amount = Number(bill.amount) || 0;
    const payer = bill.paidBy;
    const participants = bill.sharedBy || [];
    if (!payer || participants.length === 0) return;
    if (balances[payer] === undefined) balances[payer] = 0;
    const shares = splitDeterministic(amount, participants);
    balances[payer] += amount;
    participants.forEach((person) => {
      if (balances[person] === undefined) balances[person] = 0;
      balances[person] -= shares[person];
    });
  });
  return balances;
};

const computeTransfers = (balances) => {
  const creditors = [];
  const debtors = [];
  Object.entries(balances).forEach(([name, balance]) => {
    const rounded = Number(balance.toFixed(2));
    if (rounded > 0.01) creditors.push({ name, amount: rounded });
    else if (rounded < -0.01) debtors.push({ name, amount: Math.abs(rounded) });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0, j = 0;
  const cCopy = creditors.map((c) => ({ ...c }));
  const dCopy = debtors.map((d) => ({ ...d }));
  while (i < dCopy.length && j < cCopy.length) {
    const d = dCopy[i], c = cCopy[j];
    const amt = Math.min(d.amount, c.amount);
    transfers.push({ from: d.name, to: c.name, amount: Number(amt.toFixed(2)) });
    d.amount = Number((d.amount - amt).toFixed(2));
    c.amount = Number((c.amount - amt).toFixed(2));
    if (d.amount <= 0.01) i++;
    if (c.amount <= 0.01) j++;
  }
  return transfers;
};

const sumBalances = (balances) =>
  Object.values(balances).reduce((s, v) => s + v, 0);

// ── Tiny test runner ──
let passed = 0, failed = 0;
const EPS = 0.005;
const close = (a, b, eps = EPS) => Math.abs(a - b) < eps;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
    failed++;
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("Settlement math — test suite\n");

// ── 1. Equal split with remainder: 100.00 / 3 people ──
console.log("1. splitDeterministic — remainder handling");
test("100.00 / 3 people sums to exactly 100.00 (satang-exact)", () => {
  const shares = splitDeterministic(100, ["a", "b", "c"]);
  const total = Object.values(shares).reduce((s, v) => s + v, 0);
  assert(close(total, 100, 0.0001), `expected 100, got ${total}`);
});
test("100.00 / 3 people: first person gets the extra satang, deterministically", () => {
  const shares = splitDeterministic(100, ["a", "b", "c"]);
  assert(close(shares.a, 33.34), `expected a=33.34, got ${shares.a}`);
  assert(close(shares.b, 33.33), `expected b=33.33, got ${shares.b}`);
  assert(close(shares.c, 33.33), `expected c=33.33, got ${shares.c}`);
});
test("same inputs always split the same way (deterministic, not random)", () => {
  const run1 = splitDeterministic(100, ["a", "b", "c"]);
  const run2 = splitDeterministic(100, ["a", "b", "c"]);
  assert(JSON.stringify(run1) === JSON.stringify(run2), "two runs differed");
});
test("0 people returns an empty split, not a crash", () => {
  const shares = splitDeterministic(100, []);
  assert(Object.keys(shares).length === 0, "expected empty object");
});

// ── 2. Payer not participating in their own bill ──
console.log("\n2. Payer who didn't participate in their own bill");
test("payer gets full credit even when excluded from sharedBy", () => {
  // Gim pays for Pin and Fu's dinner, but didn't eat themself.
  const bills = [
    { amount: 300, paidBy: "gim", sharedBy: ["pin", "fu"] },
  ];
  const balances = computeBalances(bills, ["gim", "pin", "fu"]);
  assert(close(balances.gim, 300), `expected gim=+300, got ${balances.gim}`);
  assert(close(balances.pin, -150), `expected pin=-150, got ${balances.pin}`);
  assert(close(balances.fu, -150), `expected fu=-150, got ${balances.fu}`);
  assert(close(sumBalances(balances), 0), `balances must sum to 0, got ${sumBalances(balances)}`);
});

// ── 3. Multi-bill netting across more than 2 people ──
console.log("\n3. Multi-bill netting (the \"why doesn't Gim pay Pie directly\" case)");
test("4 people, 3 bills — nets down to the minimum number of transfers", () => {
  const bills = [
    { amount: 400, paidBy: "gim", sharedBy: ["gim", "pin", "fu", "pie"] }, // each owes 100
    { amount: 200, paidBy: "pin", sharedBy: ["pin", "fu"] },                // each owes 100
    { amount: 100, paidBy: "fu",  sharedBy: ["fu", "pie"] },                // each owes 50
  ];
  const balances = computeBalances(bills, ["gim", "pin", "fu", "pie"]);
  // gim: +400 (paid) - 100 (own share) = +300
  // pin: -100 (bill1 share) +200 (paid bill2) -100 (bill2 own share) = 0
  // fu:  -100 (bill1) -100 (bill2 share) +100 (paid bill3) -50 (bill3 own share) = -150
  // pie: -100 (bill1) -50 (bill3 share) = -150
  assert(close(balances.gim, 300), `gim: expected +300, got ${balances.gim}`);
  assert(close(balances.pin, 0), `pin: expected 0, got ${balances.pin}`);
  assert(close(balances.fu, -150), `fu: expected -150, got ${balances.fu}`);
  assert(close(balances.pie, -150), `pie: expected -150, got ${balances.pie}`);
  assert(close(sumBalances(balances), 0), `balances must sum to 0, got ${sumBalances(balances)}`);

  const transfers = computeTransfers(balances);
  // Only fu and pie owe money, only gim is owed — minimum transfer count
  // is 2 (fu->gim, pie->gim), NOT 3 just because there were 3 bills.
  assert(transfers.length === 2, `expected 2 transfers, got ${transfers.length}`);
  const totalTransferred = transfers.reduce((s, t) => s + t.amount, 0);
  assert(close(totalTransferred, 300), `expected 300 total transferred, got ${totalTransferred}`);
});

// ── 4. The core invariant, checked against randomised scenarios ──
console.log("\n4. Invariant: balances always sum to exactly 0");
test("randomised bills (50 runs) never break the zero-sum invariant", () => {
  const people = ["a", "b", "c", "d", "e"];
  for (let run = 0; run < 50; run++) {
    const billCount = 1 + Math.floor(Math.random() * 6);
    const bills = [];
    for (let i = 0; i < billCount; i++) {
      const amount = Math.round(Math.random() * 100000) / 100; // random satang amount
      const payer = people[Math.floor(Math.random() * people.length)];
      const participantCount = 1 + Math.floor(Math.random() * people.length);
      const sharedBy = [...people].sort(() => Math.random() - 0.5).slice(0, participantCount);
      bills.push({ amount, paidBy: payer, sharedBy });
    }
    const balances = computeBalances(bills, people);
    const total = sumBalances(balances);
    assert(close(total, 0, 0.01), `run ${run}: balances summed to ${total}, not 0 (bills: ${JSON.stringify(bills)})`);
  }
});

// ── 5. Custom Split's balance math ──
console.log("\n5. Custom Split — fixed per-person amounts instead of equal shares");
test("payer still credited in full; everyone debited by their FIXED custom amount, not an equal share", () => {
  const bills = [
    { amount: 300, paidBy: "gim", sharedBy: ["gim", "pin", "fu"] },
    { amount: 150, paidBy: "pin", sharedBy: ["pin", "fu"] },
  ];
  const customSplit = { gim: 100, pin: 200, fu: 150 }; // sums to 450 = pendingTotal
  const pendingTotal = bills.reduce((s, b) => s + b.amount, 0);
  assert(close(pendingTotal, 450), `sanity: pendingTotal should be 450, got ${pendingTotal}`);

  const balances = {};
  ["gim", "pin", "fu"].forEach((id) => { balances[id] = 0; });
  bills.forEach((bill) => { balances[bill.paidBy] += bill.amount; });
  Object.keys(balances).forEach((id) => { balances[id] -= customSplit[id] || 0; });

  // gim paid 300, owes custom 100 -> +200
  // pin paid 150, owes custom 200 -> -50
  // fu paid 0, owes custom 150 -> -150
  assert(close(balances.gim, 200), `gim: expected +200, got ${balances.gim}`);
  assert(close(balances.pin, -50), `pin: expected -50, got ${balances.pin}`);
  assert(close(balances.fu, -150), `fu: expected -150, got ${balances.fu}`);
  assert(close(sumBalances(balances), 0), `balances must sum to 0, got ${sumBalances(balances)}`);
});
test("a stale Custom Split (doesn't match pending total) must be rejected, not silently applied", () => {
  // Mirrors Settlement.jsx's `customApplies` guard — this is a behavioral
  // spec, not a math check: if the assigned total no longer matches the
  // real pending total (a bill was added/deleted/settled since Custom
  // Split was set), it must NOT be used.
  const pendingTotal = 500;
  const customSplit = { gim: 100, pin: 200, fu: 150 }; // sums to 450, not 500
  const customTotal = Object.values(customSplit).reduce((s, v) => s + v, 0);
  const customApplies = Math.abs(customTotal - pendingTotal) < 0.01;
  assert(customApplies === false, "a 50 THB gap must NOT be treated as fully assigned");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);