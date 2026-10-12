import "./App.css";
import React, { useState, useEffect, useReducer, useRef } from "react";
import Home from "./screens/Home";
import CreateTrip from "./screens/Createtrip";
import EditTrip from "./screens/EditTrip";
import TripDetail from "./screens/Tripdetail";
import Bills from "./screens/Bills";
import BillHistory from "./screens/Billhistory";
import BillDetail from "./screens/Billdetail";
import Rewards from "./screens/Rewards";
import CreateReward from "./screens/CreateReward";
import Profile from "./screens/Profile";
import Settlement from "./screens/Settlement";
import Pay from "./screens/Pay";
import ThankYou from "./screens/Thankyou";
import AddExpense from "./screens/Addexpense";
import ScanReceipt from "./screens/ScanReceipt";
import Leaderboard from "./screens/Leaderboard";
import MyPoints from "./screens/Mypoints";
import YourRedeem from "./screens/YourRedeem";
import SplitBill from "./screens/Splitbill";
import SplitCalculator from "./screens/Splitcalculator";
import Splash from "./screens/Splash";
import EditExpense from "./screens/Editexpense";
import Navbar from "./components/Navbar";
import ExportSummary from "./screens/ExportSummary";
import LandingPage from "./screens/LandingPage";
import { db, auth } from "./firebase";
import { ref, onValue, set, remove, runTransaction, get } from "firebase/database";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

// Case/whitespace-tolerant name comparison. The rename cascade below
// used to require an exact string match between your Profile name and a
// trip member entry — a stray space or different capitalization (easy
// to end up with when two different screens/people typed the "same"
// name independently) silently skipped the whole cascade, leaving your
// old name's bills/points orphaned as what looked like a second person.
const sameName = (a, b) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

const normalizeBill = (bill) => {
  const sharedBy = Array.isArray(bill.sharedBy) ? bill.sharedBy : [];
  const peopleCount = sharedBy.length || Number(bill.pax) || Number(bill.people) || 1;
  return {
    ...bill,
    id: bill.id || Date.now(),
    name: bill.name || bill.title || "Untitled",
    title: bill.title || bill.name || "Untitled",
    amount: Number(bill.amount) || 0,
    paidBy: bill.paidBy || "",
    category: bill.category || "Other",
    sharedBy,
    pax: peopleCount,
    people: peopleCount,
    status: bill.status || "Pending",
    date: bill.date || "Recently added",
  };
};

// Screens reachable directly from the bottom tab bar. Switching between
// these resets the in-app back-stack to just that one screen (see setPage
// below) — otherwise hopping Home → Bills → Split → Profile → Ranks would
// pile up a 5-deep history that Back has to climb back down through.
const TAB_ROOTS = new Set(["home", "receipt", "splitbill", "leaderboard", "trophy", "profile"]);

// Which screen to restore on load. The URL hash covers a normal browser
// reload, but an installed PWA reopened from its home-screen icon always
// launches at manifest.json's fixed start_url — no hash at all — which is
// exactly what made reopening the app always land back on Home/Splash
// even though the trip itself was never actually gone (currentTripId was
// always fine in localStorage; only the *page* wasn't). This falls back
// to the page we last wrote to localStorage whenever there's no hash.
const getRestoredPage = () => {
  if (window.location.hash) return window.location.hash.slice(1);
  try {
    return localStorage.getItem("lastPage") || "";
  } catch {
    return "";
  }
};

// ── UI reducer ──
const initialUiState = {
  page: "splash",
  toast: "",
  editingExpense: null,
  selectedBill: null,
  selectedRedeem: null,
  showLanding: false,
};

function uiReducer(state, action) {
  switch (action.type) {
    case "NAVIGATE":
      return { ...state, page: action.page };
    case "SET_TOAST":
      return { ...state, toast: action.message };
    case "SET_SELECTED_BILL":
      return { ...state, selectedBill: action.bill };
    case "SET_SELECTED_REDEEM":
      return { ...state, selectedRedeem: action.redeem };
    case "SET_EDITING_EXPENSE":
      return { ...state, editingExpense: action.expense };
    case "ENTER_APP":
      return { ...state, showLanding: false };
    default:
      return state;
  }
}

// ── Trip reducer ──
const initialTripState = {
  trips: [],
  currentTripId: null,
  currentTrip: null,
  tripBills: [],
  tripMembers: [],
  tripRewards: [],
  tripRedeems: [],
  tripMilestones: [],
};

function tripReducer(state, action) {
  switch (action.type) {
    case "SET_TRIPS":
      return { ...state, trips: action.trips };
    case "REMOVE_TRIP_FROM_LIST":
      return { ...state, trips: state.trips.filter((t) => t.id !== action.id) };
    case "SET_CURRENT_TRIP_ID":
      return { ...state, currentTripId: action.id };
    case "SET_CURRENT_TRIP":
      return { ...state, currentTrip: action.trip };
    case "SET_TRIP_BILLS":
      return { ...state, tripBills: action.bills };
    case "SET_TRIP_MEMBERS":
      return { ...state, tripMembers: action.members };
    case "SET_TRIP_REWARDS":
      return { ...state, tripRewards: action.rewards };
    case "SET_TRIP_REDEEMS":
      return { ...state, tripRedeems: action.redeems };
    case "SET_TRIP_MILESTONES":
      return { ...state, tripMilestones: action.milestones };
    case "CLEAR_CURRENT_TRIP":
      return { ...state, currentTripId: null, currentTrip: null, tripBills: [], tripMembers: [], tripRewards: [], tripRedeems: [], tripMilestones: [] };
    default:
      return state;
  }
}

function App() {
  // Reload should land back on the screen you were on, not always
  // splash — restore the initial page from the URL hash if one exists.
  const [ui, dispatchUi] = useReducer(uiReducer, initialUiState, (init) => {
    const restoredPage = getRestoredPage();
    return restoredPage ? { ...init, page: restoredPage } : init;
  });
  const { page, toast, editingExpense, selectedBill, selectedRedeem, showLanding } = ui;

  const [trip, dispatchTrip] = useReducer(tripReducer, initialTripState);
  const { trips, currentTripId, currentTrip, tripBills, tripMembers, tripRewards, tripRedeems, tripMilestones } = trip;

  const [userPoints, setUserPoints] = useState(0);
  const [tripPoints, setTripPoints] = useState(0);
  // Custom Split's per-person target amounts for the trip's current
  // pending bills — set by Splitbill.jsx's Custom mode, consumed by
  // Settlement.jsx to compute real balances/transfers instead of its
  // default equal-per-bill split. Cleared whenever it would go stale:
  // after settling, or when the pending-bill set it was built against
  // no longer matches (Settlement checks the total itself).
  const [customSplit, setCustomSplit] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem("neosplitTheme") || "neon";
    } catch {
      return "neon";
    }
  });

  const setTheme = (t) => {
    setThemeState(t);
    try {
      localStorage.setItem("neosplitTheme", t);
    } catch {}
  };

  // ── In-app navigation stack + Back button handling ──
  // We keep our OWN list of screens visited (independent of how many
  // real browser history entries exist) and guard the browser's Back
  // button with exactly ONE pushed history entry. Each Back press is
  // caught by that guard, pops one screen off our stack, then re-arms
  // the guard so the *next* Back press is caught too — so Back always
  // walks backwards through the screens you actually visited (Edit →
  // Bill → Trip → Home), however many steps deep, using only one real
  // history entry the whole time. Only once the stack is back down to
  // a single screen (a tab's root — nothing left to undo) do we skip
  // re-arming, so that Back finally exits the app, same as pressing it
  // on a fresh tab would feel on a native app.
  const navStackRef = useRef([getRestoredPage() || "splash"]);

  const armGuard = () => {
    window.history.pushState(
      { guard: true },
      "",
      window.location.pathname + window.location.search + window.location.hash
    );
  };

  useEffect(() => {
    armGuard();

    const handlePopState = () => {
      const stack = navStackRef.current;
      if (stack.length > 1) {
        const newStack = stack.slice(0, -1);
        navStackRef.current = newStack;
        const prevPage = newStack[newStack.length - 1];
        dispatchUi({ type: "NAVIGATE", page: prevPage });
        window.history.replaceState({ guard: true }, "", `#${prevPage}`);
        try { localStorage.setItem("lastPage", prevPage); } catch {}
        armGuard(); // catch the next Back press too
      }
      // else: already at a tab root with nothing left to pop — let this
      // Back press actually leave the app instead of re-arming the guard.
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tapping a bottom-tab icon (Home/Bills/Split/Ranks/Profile) resets the
  // stack to just that screen, so switching tabs never piles up history;
  // anything else (opening a bill, editing an expense, etc.) pushes onto
  // whatever screen you were already on, so Back can unwind it in order.
  const setPage = (p) => {
    const stack = navStackRef.current;
    if (TAB_ROOTS.has(p)) {
      navStackRef.current = [p];
    } else if (stack[stack.length - 1] !== p) {
      navStackRef.current = [...stack, p];
    }
    dispatchUi({ type: "NAVIGATE", page: p });
    // Keep the URL hash in sync (covers a normal browser reload) without
    // adding a separate browser history entry — the guard above is the
    // only one. Also mirrored to localStorage for when there's no hash
    // to read at all (an installed PWA reopened from its home-screen
    // icon always starts at the fixed start_url, no hash included).
    window.history.replaceState({ guard: true }, "", `#${p}`);
    try { localStorage.setItem("lastPage", p); } catch {}
  };
  const setToast = (message) => dispatchUi({ type: "SET_TOAST", message });
  const setSelectedBill = (bill) => dispatchUi({ type: "SET_SELECTED_BILL", bill });
  const setSelectedRedeem = (redeem) => dispatchUi({ type: "SET_SELECTED_REDEEM", redeem });
  const setEditingExpense = (expense) => dispatchUi({ type: "SET_EDITING_EXPENSE", expense });

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("neosplitProfile");
      return saved
        ? JSON.parse(saved)
        : { name: "NongTaeyoung", selectedBias: "Taeyong", profileImage: "https://i.pinimg.com/736x/0b/11/d4/0b11d44290e5c34a8ebf40c4d58bde8f.jpg" };
    } catch {
      return { name: "NongTaeyoung", selectedBias: "Taeyong", profileImage: "" };
    }
  });

  // ── Identity, phase 1 ──
  // Today a person is identified ONLY by matching display-name strings
  // (userProfile.name === a trip member, bill.paidBy === a name, …) — the
  // exact design the "NongTaeyoung became a second person called Toey"
  // bug comes from: rename the string anywhere it isn't an exact match
  // and the old history gets orphaned instead of following you. A real
  // fix needs a stable ID on every trip member, which touches most
  // screens — this step only adds the one piece that's safe to add
  // alone: a permanent ID for THIS device's own profile, generated once
  // and never changed by a rename. Nothing reads it yet; it's here so
  // the next phase (giving trip members the same treatment) has a
  // stable anchor to work from instead of improvising one later.
  useEffect(() => {
    if (userProfile?.id) return;
    setUserProfile((prev) => ({
      ...prev,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id]);

  // ── Teams ──
  // A "Team" here is deliberately lightweight: just a saved member list
  // you can reuse when creating a new trip, so you don't retype the same
  // gang's names every time. It does NOT own rewards/points/leaderboard —
  // those stay trip-scoped. A heavier "Team owns everything across
  // multiple trips" model is a real future option, but not built yet;
  // this is the safe, additive first step toward it.
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!authReady) return;
    const unsub = onValue(ref(db, "teams"), (snap) => {
      const data = snap.val();
      setTeams(data ? Object.values(data) : []);
    });
    return () => unsub();
  }, [authReady]);

  const addTeam = ({ name, memberList }) => {
    if (!authReady || !name?.trim() || !memberList?.length) return;
    const id = Date.now().toString();
    set(ref(db, `teams/${id}`), { id, name: name.trim(), memberList }).catch((err) => {
      console.error("Failed to save team:", err);
      setToast("Couldn't save team");
    });
    setToast(`Saved "${name.trim()}" as a team ✓`);
  };

  // ── Check invite link on load ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitedTripId = params.get("trip");
    if (invitedTripId) {
      dispatchTrip({ type: "SET_CURRENT_TRIP_ID", id: invitedTripId });
      localStorage.setItem("lastTripId", invitedTripId);
      window.history.replaceState({}, "", window.location.pathname);
    } else {
      const saved = localStorage.getItem("lastTripId");
      if (saved) dispatchTrip({ type: "SET_CURRENT_TRIP_ID", id: saved });
    }
  }, []);

  // ── Sign in anonymously so Firebase rules can require auth ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthReady(true);
      } else {
        signInAnonymously(auth).catch((err) => {
          console.error("Anonymous sign-in failed:", err);
        });
      }
    });
    return () => unsub();
  }, []);

  // ── Load all trips list ──
  useEffect(() => {
    if (!authReady) return;
    const unsub = onValue(ref(db, "trips"), (snap) => {
      const data = snap.val();
      dispatchTrip({ type: "SET_TRIPS", trips: data ? Object.values(data) : [] });
    });
    return () => unsub();
  }, [authReady]);

  // ── Load current trip data when tripId changes ──
  useEffect(() => {
    if (!authReady || !currentTripId) return;
    const unsubTrip = onValue(ref(db, `trips/${currentTripId}`), (snap) => {
      const data = snap.val();
      if (data) dispatchTrip({ type: "SET_CURRENT_TRIP", trip: data });
    });
    const unsubBills = onValue(ref(db, `trips/${currentTripId}/bills`), (snap) => {
      const data = snap.val();
      dispatchTrip({ type: "SET_TRIP_BILLS", bills: data ? Object.values(data).map(normalizeBill) : [] });
    });
    const unsubMembers = onValue(ref(db, `trips/${currentTripId}/members`), (snap) => {
      const data = snap.val();
      dispatchTrip({ type: "SET_TRIP_MEMBERS", members: data ? Object.values(data) : [] });
    });
    const unsubRewards = onValue(ref(db, `trips/${currentTripId}/rewards`), (snap) => {
      const data = snap.val();
      dispatchTrip({ type: "SET_TRIP_REWARDS", rewards: data ? Object.values(data) : [] });
    });
    const unsubRedeems = onValue(ref(db, `trips/${currentTripId}/redeemRequests`), (snap) => {
      const data = snap.val();
      dispatchTrip({ type: "SET_TRIP_REDEEMS", redeems: data ? Object.values(data) : [] });
    });
    const unsubMilestones = onValue(ref(db, `trips/${currentTripId}/gangMilestones`), (snap) => {
      const data = snap.val();
      dispatchTrip({ type: "SET_TRIP_MILESTONES", milestones: data ? Object.values(data) : [] });
    });
    return () => { unsubTrip(); unsubBills(); unsubMembers(); unsubRewards(); unsubRedeems(); unsubMilestones(); };
  }, [authReady, currentTripId]);

  // ── Load points ──
  useEffect(() => {
    if (!authReady) return;
    const unsub = onValue(ref(db, "userPoints"), (snap) => {
      if (snap.val() !== null) setUserPoints(Number(snap.val()) || 0);
    });
    return () => unsub();
  }, [authReady]);

  // "tripPoints" = Available Points for THIS trip — spendable, decreases
  // when a reward redemption is confirmed. Separate from lifetime points,
  // which live at memberLifetimePoints and only ever go up (read directly
  // by Leaderboard.jsx for ranking + Gang Reward milestone progress).
  useEffect(() => {
    if (!authReady || !currentTripId || !userProfile?.name) {
      setTripPoints(0);
      return;
    }
    const unsub = onValue(ref(db, `trips/${currentTripId}/memberPoints/${userProfile.name}`), (snap) => {
      setTripPoints(Number(snap.val()) || 0);
    });
    return () => unsub();
  }, [authReady, currentTripId, userProfile?.name]);

  useEffect(() => {
    localStorage.setItem("neosplitProfile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Points ──
  // Every point-earning action credits THREE pools now:
  //  1. Global XP (userPoints) — lifetime across all trips, drives Level.
  //  2. Trip Lifetime Points (memberLifetimePoints) — lifetime within
  //     THIS trip, never decreases. Drives Leaderboard rank and the Gang
  //     Reward milestone progress.
  //  3. Trip Available Points (memberPoints) — spendable within this
  //     trip, decreases when a reward redemption is confirmed.
  // (1) and (2) are permanent records of what was earned; only (3) is a
  // spendable balance. This is what keeps "I redeemed a reward" from
  // ever knocking someone down the leaderboard.
  const addPoints = (pts) => {
    setUserPoints((prev) => {
      const updated = Math.max(0, prev + pts);
      set(ref(db, "userPoints"), updated);
      return updated;
    });
    if (currentTripId && userProfile?.name) {
      runTransaction(ref(db, `trips/${currentTripId}/memberPoints/${userProfile.name}`), (current) => {
        return Math.max(0, (current || 0) + pts);
      });
      runTransaction(ref(db, `trips/${currentTripId}/memberLifetimePoints/${userProfile.name}`), (current) => {
        return Math.max(0, (current || 0) + pts);
      });
    }
  };

  // ── Trip actions ──
  const addTrip = (newTrip) => {
    if (!authReady) {
      setToast("Still connecting… try again in a second");
      return;
    }
    const id = Date.now().toString();
    const tripObj = { id, ...newTrip };
    set(ref(db, `trips/${id}`), tripObj).catch((err) => {
      console.error("Failed to save trip:", err);
      setToast("Couldn't save trip — check your connection");
    });
    if (newTrip.memberList?.length > 0) {
      const membersObj = {};
      newTrip.memberList.forEach((m, i) => { membersObj[i] = m; });
      set(ref(db, `trips/${id}/members`), membersObj).catch((err) => {
        console.error("Failed to save trip members:", err);
      });
    }
    dispatchTrip({ type: "SET_CURRENT_TRIP_ID", id });
    localStorage.setItem("lastTripId", id);
    setToast("Trip created! 🚀");
  };

  const deleteTrip = (id) => {
    remove(ref(db, `trips/${id}`));
    dispatchTrip({ type: "REMOVE_TRIP_FROM_LIST", id });
    if (currentTripId === id) {
      dispatchTrip({ type: "CLEAR_CURRENT_TRIP" });
      localStorage.removeItem("lastTripId");
    }
    setToast("Trip deleted");
  };

  const selectTrip = (id) => {
    dispatchTrip({ type: "SET_CURRENT_TRIP_ID", id });
    localStorage.setItem("lastTripId", id);
    setPage("tripdetail");
  };

  // ── Gang Rewards (per-trip, creator-only creation) ──
  const addReward = ({ name, icon, points, description }) => {
    if (!currentTripId) return;
    const id = Date.now().toString();
    const reward = {
      id, name, icon: icon || "🎁", points: Number(points) || 0,
      description: description || "",
    };
    set(ref(db, `trips/${currentTripId}/rewards/${id}`), reward).catch((err) => {
      console.error("Failed to save reward:", err);
      setToast("Couldn't save reward");
    });
    setToast("Reward created 🎉");
  };

  // ── Gang Reward milestones (per-trip, creator-only) ──
  const addGangMilestone = ({ threshold, label, desc }) => {
    if (!currentTripId) return;
    const id = Date.now().toString();
    const milestone = {
      id, threshold: Number(threshold) || 0,
      label: label || "🎉 Milestone", desc: desc || "",
    };
    set(ref(db, `trips/${currentTripId}/gangMilestones/${id}`), milestone).catch((err) => {
      console.error("Failed to save milestone:", err);
      setToast("Couldn't save milestone");
    });
    setToast("Milestone added 🏆");
  };

  const deleteGangMilestone = (id) => {
    if (!currentTripId) return;
    remove(ref(db, `trips/${currentTripId}/gangMilestones/${id}`)).catch((err) => {
      console.error("Failed to delete milestone:", err);
    });
  };

  const requestRedeem = (reward) => {
    if (!currentTripId || !userProfile?.name) return;
    const id = Date.now().toString();
    const request = {
      id,
      memberName: userProfile.name,
      rewardId: reward.id,
      rewardName: reward.name,
      icon: reward.icon,
      points: reward.points,
      status: "Pending",
      requestedAt: id,
    };
    set(ref(db, `trips/${currentTripId}/redeemRequests/${id}`), request).catch((err) => {
      console.error("Failed to request redeem:", err);
      setToast("Couldn't send request");
    });
    setToast("Redeem requested — waiting for confirmation ⏳");
  };

  // Creator-only: deducts points from the trip's AVAILABLE pool only —
  // memberLifetimePoints (rank/milestones) is never touched here.
  const confirmRedeem = (redeemId) => {
    if (!currentTripId) return;
    const request = tripRedeems.find((r) => r.id === redeemId);
    if (!request || request.status === "Confirmed") return;

    runTransaction(ref(db, `trips/${currentTripId}/memberPoints/${request.memberName}`), (current) => {
      return (current || 0) - request.points;
    }).then(() => {
      set(ref(db, `trips/${currentTripId}/redeemRequests/${redeemId}/status`), "Confirmed");
      setToast(`Confirmed ${request.memberName}'s redeem ✓`);
    }).catch((err) => {
      console.error("Failed to confirm redeem:", err);
      setToast("Couldn't confirm redeem");
    });
  };

  // ── Expense actions ──
  const addExpense = (newExpense) => {
    if (!currentTripId) return;
    const sharedBy = newExpense.sharedBy?.length > 0 ? newExpense.sharedBy : tripMembers;
    const id = Date.now();
    const bill = {
      id,
      name: newExpense.name || "Untitled Expense",
      amount: Number(newExpense.amount) || 0,
      paidBy: newExpense.paidBy || tripMembers[0],
      pax: sharedBy.length,
      category: newExpense.category || "Other",
      date: newExpense.date || new Date().toLocaleDateString("en-GB"),
      status: "Pending",
      sharedBy,
    };
    set(ref(db, `trips/${currentTripId}/bills/${id}`), bill);
    addPoints(2);
    setToast("Expense added ✓ +2 pts");
  };

  const deleteExpense = (id) => {
    if (!currentTripId) return;
    // Reverses the +2 pts that bill earned when it was added — without
    // this, add → delete → add → delete farms free points forever.
    addPoints(-2);
    remove(ref(db, `trips/${currentTripId}/bills/${id}`));
    setToast("Expense deleted");
  };

  const startEditExpense = (expense) => {
    setEditingExpense(expense);
    setPage("editexpense");
  };

  const updateExpense = (updated) => {
    if (!currentTripId) return;
    set(ref(db, `trips/${currentTripId}/bills/${updated.id}`), updated);
    setToast("Expense updated ✓");
    setEditingExpense(null);
    setPage("tripdetail");
  };

  // `billIds` scopes which bills actually get marked Finished — without
  // it, pressing "Complete Split" while looking at just ONE bill (from
  // Bill Detail, or a "Select Bills" split) used to mark EVERY pending
  // bill in the whole trip as settled, not just the one(s) on screen.
  // Every bill still has to be written back (Firebase replaces the
  // whole `bills` node), so untouched bills are written unchanged.
  const settleAllBills = (billIds = null) => {
    if (!currentTripId) return;
    const targetIds = billIds && billIds.length > 0
      ? new Set(billIds)
      : new Set(tripBills.filter((b) => b.status !== "Finished").map((b) => b.id));
    const obj = {};
    tripBills.forEach((b) => {
      obj[b.id] = targetIds.has(b.id) ? { ...b, status: "Finished" } : b;
    });
    set(ref(db, `trips/${currentTripId}/bills`), obj);
    setSelectedBill(null);
    setCustomSplit(null);
  };

  // ── Member actions ──
  const addMember = (name) => {
    const trimmed = name.trim();
    if (!trimmed || tripMembers.includes(trimmed)) return;
    const newMembers = [...tripMembers, trimmed];
    const membersObj = {};
    newMembers.forEach((m, i) => { membersObj[i] = m; });
    if (currentTripId) set(ref(db, `trips/${currentTripId}/members`), membersObj);
  };

  const editMember = (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || !currentTripId) return;

    const isDuplicate = tripMembers.some(
      (m) => !sameName(m, oldName) && sameName(m, trimmed)
    );
    if (isDuplicate) {
      setToast("That name is already used");
      return;
    }

    const tripId = currentTripId;
    const newMembers = tripMembers.map((m) => (m === oldName ? trimmed : m));
    const membersObj = {};
    newMembers.forEach((m, i) => { membersObj[i] = m; });
    set(ref(db, `trips/${tripId}/members`), membersObj);

    // Trip creator is also stored as a plain name, separate from the
    // members list — if the creator renames themself, they'd otherwise
    // silently lose creator-only controls (Edit Milestones, Create
    // Reward, Confirm Redeem, Reset Leaderboard) on this trip.
    if (currentTrip?.creator === oldName) {
      set(ref(db, `trips/${tripId}/creator`), trimmed);
    }

    // Your own device profile name is stored separately from trip
    // membership — if you rename yourself as a member, keep it in sync
    // too, or the app stops recognizing you as "You" (Leaderboard
    // highlight, isCreator checks) on this trip.
    if (userProfile?.name === oldName) {
      setUserProfile((prev) => ({ ...prev, name: trimmed }));
    }

    tripBills.forEach((bill) => {
      let changed = false;
      const updated = { ...bill };
      if (updated.paidBy === oldName) {
        updated.paidBy = trimmed;
        changed = true;
      }
      if (Array.isArray(updated.sharedBy) && updated.sharedBy.includes(oldName)) {
        updated.sharedBy = updated.sharedBy.map((n) => (n === oldName ? trimmed : n));
        changed = true;
      }
      if (changed) {
        set(ref(db, `trips/${tripId}/bills/${updated.id}`), updated);
      }
    });

    // Firebase has no atomic "rename a key" operation — a rename is a
    // read-then-write-then-delete. Points are name-keyed today (not
    // member IDs), so without this cascade a rename would silently
    // orphan the old name's history and start the new name back at
    // zero — exactly the "renaming creates a new person" bug this
    // exists to prevent.
    const moveKey = (path) => {
      get(ref(db, `${path}/${oldName}`)).then((snap) => {
        if (snap.exists()) {
          set(ref(db, `${path}/${trimmed}`), snap.val());
          remove(ref(db, `${path}/${oldName}`));
        }
      }).catch((err) => console.error(`Failed to move ${path}:`, err));
    };
    moveKey(`trips/${tripId}/memberPoints`);
    moveKey(`trips/${tripId}/memberLifetimePoints`);

    // Redeem requests reference the member by name in a field, not as
    // a key — just patch that field on any request that matches.
    tripRedeems.forEach((req) => {
      if (req.memberName === oldName) {
        set(ref(db, `trips/${tripId}/redeemRequests/${req.id}/memberName`), trimmed);
      }
    });

    setToast(`Renamed to ${trimmed}`);
  };

  const removeMember = (name) => {
    const newMembers = tripMembers.filter((m) => m !== name);
    const membersObj = {};
    newMembers.forEach((m, i) => { membersObj[i] = m; });
    if (currentTripId) set(ref(db, `trips/${currentTripId}/members`), membersObj);
  };

  // Renaming yourself on the Profile screen used to be completely
  // disconnected from everything else — your profile name would change,
  // but any trip you're already a member of still had your OLD name in
  // its member list, bills (paidBy/sharedBy), creator field and points,
  // so nothing looked "linked". This reuses the exact same cascading
  // rename as editMember (above) for the currently active trip, so
  // saving a new name on Profile instantly (via Firebase's realtime
  // listeners — no refresh needed) renames you everywhere that trip
  // already references you. It still always updates the profile name
  // itself even with no active trip, since editMember requires one.
  const renameProfile = (newName) => {
    const trimmed = (newName || "").trim();
    if (!trimmed) return;
    const oldName = userProfile?.name;
    // Match tolerantly (sameName), but cascade using the member entry's
    // OWN exact string — editMember reads/writes Firebase keys by that
    // exact string, so passing the possibly-differently-cased profile
    // name through here instead would just recreate the same bug.
    const existingMember = currentTripId ? tripMembers.find((m) => sameName(m, oldName)) : null;
    if (existingMember && !sameName(existingMember, trimmed)) {
      editMember(existingMember, trimmed);
    }
    setUserProfile((prev) => ({ ...prev, name: trimmed }));
  };

  // Merges a duplicate member's ENTIRE history into another member's.
  // Unlike editMember (a forward-looking rename of one name to another),
  // this SUMS points instead of overwriting — both names represent real
  // accumulated history of the same person, so neither side should be
  // discarded. Used by the one-time cleanup below, and reusable later
  // from a screen if another duplicate like this ever turns up again.
  const mergeMembers = (keepName, mergeName) => {
    if (!currentTripId || !keepName || !mergeName || sameName(keepName, mergeName)) return;
    const tripId = currentTripId;

    const newMembers = tripMembers.filter((m) => !sameName(m, mergeName));
    if (!newMembers.some((m) => sameName(m, keepName))) newMembers.push(keepName);
    const membersObj = {};
    newMembers.forEach((m, i) => { membersObj[i] = m; });
    set(ref(db, `trips/${tripId}/members`), membersObj);

    if (sameName(currentTrip?.creator, mergeName)) {
      set(ref(db, `trips/${tripId}/creator`), keepName);
    }
    if (sameName(userProfile?.name, mergeName)) {
      setUserProfile((prev) => ({ ...prev, name: keepName }));
    }

    tripBills.forEach((bill) => {
      let changed = false;
      const updated = { ...bill };
      if (sameName(updated.paidBy, mergeName)) { updated.paidBy = keepName; changed = true; }
      if (Array.isArray(updated.sharedBy) && updated.sharedBy.some((n) => sameName(n, mergeName))) {
        updated.sharedBy = Array.from(new Set(
          updated.sharedBy.map((n) => (sameName(n, mergeName) ? keepName : n))
        ));
        changed = true;
      }
      if (changed) set(ref(db, `trips/${tripId}/bills/${updated.id}`), updated);
    });

    tripRedeems.forEach((req) => {
      if (sameName(req.memberName, mergeName)) {
        set(ref(db, `trips/${tripId}/redeemRequests/${req.id}/memberName`), keepName);
      }
    });

    // Points are the one place a merge differs from a plain rename — add
    // the two balances together instead of letting the second write
    // clobber the first, since both are real points earned by the same
    // person under two different names.
    const sumKey = (path) => {
      Promise.all([
        get(ref(db, `${path}/${keepName}`)),
        get(ref(db, `${path}/${mergeName}`)),
      ]).then(([keepSnap, mergeSnap]) => {
        const total = (Number(keepSnap.val()) || 0) + (Number(mergeSnap.val()) || 0);
        set(ref(db, `${path}/${keepName}`), total);
        remove(ref(db, `${path}/${mergeName}`));
      }).catch((err) => console.error(`Failed to merge ${path}:`, err));
    };
    sumKey(`trips/${tripId}/memberPoints`);
    sumKey(`trips/${tripId}/memberLifetimePoints`);

    setToast(`Merged ${mergeName} into ${keepName} ✓`);
  };

  // ── One-time cleanup for a known duplicate ──
  // "NongTaeyoung" (an old name) and "Toey" (the same person's current
  // name) ended up as two separate member entries with separate point
  // histories — exactly the bug the Identity work above exists to catch
  // earlier next time. This merges that specific pair, once, the first
  // time a trip is loaded with both names still in its member list. A
  // flag on the trip stops it from ever running a second time (so it's
  // safe even if this effect re-fires on every reload).
  useEffect(() => {
    if (!authReady || !currentTripId) return;
    if (!tripMembers.some((m) => sameName(m, "NongTaeyoung"))) return;
    if (!tripMembers.some((m) => sameName(m, "Toey"))) return;
    const flagRef = ref(db, `trips/${currentTripId}/migrations/mergedNongTaeyoungIntoToey`);
    get(flagRef).then((snap) => {
      if (snap.exists()) return;
      mergeMembers("Toey", "NongTaeyoung");
      set(flagRef, true);
    }).catch((err) => console.error("Merge check failed:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, currentTripId, tripMembers]);

  // ── Edit Trip ──
  const updateTripDetails = ({ title, date, location }) => {
    if (!currentTripId) return;
    if (title !== undefined) set(ref(db, `trips/${currentTripId}/title`), title);
    if (date !== undefined) set(ref(db, `trips/${currentTripId}/date`), date);
    if (location !== undefined) set(ref(db, `trips/${currentTripId}/location`), location);
    setToast("Trip updated ✓");
  };

  // Opened from Home's ••• menu on any trip card, not just the active
  // one — so it first makes that trip active, then navigates to the
  // edit screen (which always edits whatever trip is currently active).
  const openEditTrip = (id) => {
    dispatchTrip({ type: "SET_CURRENT_TRIP_ID", id });
    localStorage.setItem("lastTripId", id);
    setPage("edittrip");
  };

  // ── Invite link ──
  const getInviteLink = () => {
    if (!currentTripId) return "";
    return `${window.location.origin}?trip=${currentTripId}`;
  };

  // ── Router ──
  const renderPage = () => {
    const p = { setPage, tripBills, tripMembers };
    switch (page) {
      case "splash":          return <Splash setPage={setPage} />;
      case "home":            return <Home {...p} userProfile={userProfile} trips={trips} currentTripId={currentTripId} selectTrip={selectTrip} deleteTrip={deleteTrip} openEditTrip={openEditTrip} />;
      case "create":          return <CreateTrip setPage={setPage} addTrip={addTrip} userProfile={userProfile} teams={teams} addTeam={addTeam} />;
      case "edittrip":        return <EditTrip setPage={setPage} currentTrip={currentTrip} tripMembers={tripMembers} tripBills={tripBills} updateTripDetails={updateTripDetails} addMember={addMember} removeMember={removeMember} editMember={editMember} />;
      case "tripdetail":      return <TripDetail {...p} deleteExpense={deleteExpense} startEditExpense={startEditExpense} deleteTrip={deleteTrip} currentTrip={currentTrip} currentTripId={currentTripId} getInviteLink={getInviteLink} />;
      case "addexpense":      return <AddExpense {...p} addExpense={addExpense} addMember={addMember} removeMember={removeMember} editMember={editMember} />;
      case "scanreceipt":     return <ScanReceipt {...p} addExpense={addExpense} userProfile={userProfile} />;
      case "editexpense":     return <EditExpense {...p} editingExpense={editingExpense} updateExpense={updateExpense} />;
      case "receipt":         return <Bills {...p} setSelectedBill={setSelectedBill} />;
      case "billhistory":     return <BillHistory {...p} setSelectedBill={setSelectedBill} />;
      case "billdetail":      return <BillDetail {...p} selectedBill={selectedBill} startEditExpense={startEditExpense} />;
      case "settlement":      return <Settlement {...p} settleAllBills={settleAllBills} selectedBill={selectedBill} onSettleAndEarnPoints={addPoints} userProfile={userProfile} customSplit={customSplit} />;
      case "splitbill":       return <SplitBill setPage={setPage} tripBills={tripBills} tripMembers={tripMembers} setSelectedBill={setSelectedBill} customSplit={customSplit} setCustomSplit={setCustomSplit} />;
      case "splitcalculator": return <SplitCalculator setPage={setPage} selectedBill={selectedBill} />;
      case "profile":         return <Profile setPage={setPage} userProfile={userProfile} setUserProfile={setUserProfile} renameProfile={renameProfile} theme={theme} setTheme={setTheme} />;
      case "trophy":
      case "leaderboard":     return <Leaderboard setPage={setPage} authReady={authReady} currentTripId={currentTripId} currentTrip={currentTrip} userProfile={userProfile} tripMembers={tripMembers} tripMilestones={tripMilestones} addGangMilestone={addGangMilestone} deleteGangMilestone={deleteGangMilestone} />;
      case "mypoints":        return <MyPoints setPage={setPage} userPoints={userPoints} />;
      case "rewardslist":     return <Rewards setPage={setPage} userPoints={tripPoints} tripRewards={tripRewards} tripRedeems={tripRedeems} currentTrip={currentTrip} userProfile={userProfile} requestRedeem={requestRedeem} confirmRedeem={confirmRedeem} setSelectedRedeem={setSelectedRedeem} />;
      case "createreward":    return <CreateReward setPage={setPage} addReward={addReward} />;
      case "yourredeem":      return <YourRedeem setPage={setPage} selectedRedeem={selectedRedeem} />;
      case "pay":             return <Pay setPage={setPage} pointsEarned={userPoints} tripBills={tripBills} tripMembers={tripMembers} />;
      case "exportsummary":   return <ExportSummary setPage={setPage} tripBills={tripBills} tripMembers={tripMembers} userProfile={userProfile} />;
      case "thankyou":        return <ThankYou setPage={setPage} userProfile={userProfile} pointsEarned={userPoints} />;
      default:                return null;
    }
  };

  return (
    <div className="app-bg" data-theme={theme}>
      {showLanding ? (
        <LandingPage onEnter={() => dispatchUi({ type: "ENTER_APP" })} />
      ) : (
        <div className="phone-shell">
          <div className="phone-frame">
            <div className="phone-notch" />
            {renderPage()}
            {toast && <div className="toast">{toast}</div>}
            {page !== "splash" && <Navbar page={page} setPage={setPage} />}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;