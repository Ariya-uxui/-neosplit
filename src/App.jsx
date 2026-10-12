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
import GangSettings from "./screens/GangSettings";
import { db, auth } from "./firebase";
import { ref, onValue, set, remove, runTransaction, get } from "firebase/database";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

// Case/whitespace-tolerant name comparison — still useful in a couple of
// places (matching the device profile's name against a trip member's
// display name during migration/lookup), even though identity itself no
// longer depends on name matching.
const sameName = (a, b) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

const makeMemberId = () => `member-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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
  // NOTE on identity: `tripMembers` is now an array of { id, name } objects,
  // not plain name strings. `id` is permanent — generated once when a
  // member is added (or, for your own device profile, reused from
  // userProfile.id) and never changed by a rename. `name` is purely
  // display text. Every place that used to store/compare a member by name
  // (bill.paidBy, bill.sharedBy[], trip.creator, points keys, redeem
  // requests) now stores/compares that member's id instead — a rename is
  // just one field changing on one object, nothing else needs to move.
  const { trips, currentTripId, currentTrip, tripBills, tripMembers } = trip;

  // ── Gang: the persistent entity that owns rewards/points, spanning
  // every trip linked to it (unlike tripMembers, which is just this ONE
  // trip's roster for splitting bills). `currentTrip.gangId` is the link;
  // every other gang-owned thing (its member list, rewards, redeem
  // requests, milestones, points) is read from gangs/{gangId} as ONE
  // snapshot below, instead of four separate trip-scoped listeners like
  // before.
  const currentGangId = currentTrip?.gangId || null;
  const [gangData, setGangData] = useState(null);

  useEffect(() => {
    if (!authReady || !currentGangId) {
      setGangData(null);
      return;
    }
    const unsub = onValue(ref(db, `gangs/${currentGangId}`), (snap) => {
      setGangData(snap.val() || null);
    });
    return () => unsub();
  }, [authReady, currentGangId]);

  const gangName = gangData?.name || "";
  const gangCreatorId = gangData?.creatorId || "";
  // Gang membership can be a SUPERSET of this trip's members (someone can
  // be in the gang without having joined every trip under it) — this is
  // what makes the leaderboard/rewards span multiple trips rather than
  // resetting per trip.
  const gangMembers = gangData?.members
    ? Object.entries(gangData.members).map(([id, name]) => ({ id, name }))
    : [];
  const tripRewards = gangData?.rewards ? Object.values(gangData.rewards) : [];
  const tripRedeems = gangData?.redeemRequests ? Object.values(gangData.redeemRequests) : [];
  const tripMilestones = gangData?.milestones ? Object.values(gangData.milestones) : [];

  // ── All gangs (for the picker shown when creating a new trip) ──
  const [gangs, setGangs] = useState([]);
  useEffect(() => {
    if (!authReady) return;
    const unsub = onValue(ref(db, "gangs"), (snap) => {
      const data = snap.val();
      setGangs(data ? Object.values(data) : []);
    });
    return () => unsub();
  }, [authReady]);

  const [userPoints, setUserPoints] = useState(0);
  const [tripPoints, setTripPoints] = useState(0);
  // Custom Split's per-person target amounts for the trip's current
  // pending bills — set by Splitbill.jsx's Custom mode, consumed by
  // Settlement.jsx to compute real balances/transfers instead of its
  // default equal-per-bill split. Keyed by member id (not name). Cleared
  // whenever it would go stale: after settling, or when the pending-bill
  // set it was built against no longer matches (Settlement checks the
  // total itself).
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

  // ── Identity: your own permanent id ──
  // This device's own profile gets a permanent id, generated once and
  // never changed by a rename. When you're a member of a trip, that
  // trip's migration (below) links your member entry to this SAME id —
  // so renaming yourself on Profile is just one field changing on one
  // id, and every trip you're in sees it immediately, with nothing to
  // orphan.
  useEffect(() => {
    if (userProfile?.id) return;
    setUserProfile((prev) => ({
      ...prev,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id]);

  // Convenience lookup passed down to every screen: resolve a member id
  // back to its current display name. Falls back to the id itself (shows
  // *something* rather than blank) if the member was removed.
  const nameForId = (id) => tripMembers.find((m) => m.id === id)?.name || id || "";

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
    // Members are stored as a flat { key: name } map in Firebase (the key
    // is the member's permanent id once migrated — see the migration
    // effect below). We turn that into the { id, name } objects every
    // screen now works with.
    const unsubMembers = onValue(ref(db, `trips/${currentTripId}/members`), (snap) => {
      const data = snap.val();
      const members = data ? Object.entries(data).map(([id, name]) => ({ id, name })) : [];
      dispatchTrip({ type: "SET_TRIP_MEMBERS", members });
    });
    // Rewards/redeemRequests/milestones/points no longer live under the
    // trip at all — they're gang-owned now (see the gangData effect
    // above), so this effect only needs the trip doc, its bills, and its
    // own (trip-local) member roster.
    return () => { unsubTrip(); unsubBills(); unsubMembers(); };
  }, [authReady, currentTripId]);

  // ── Load points ──
  useEffect(() => {
    if (!authReady) return;
    const unsub = onValue(ref(db, "userPoints"), (snap) => {
      if (snap.val() !== null) setUserPoints(Number(snap.val()) || 0);
    });
    return () => unsub();
  }, [authReady]);

  // "tripPoints" = Reward Points — spendable, decreases when a reward
  // redemption is confirmed. Shared across EVERY trip under the current
  // gang now (not reset per trip), which is the whole point of the Gang
  // system. Separate from lifetime points (memberLifetimePoints, also
  // gang-scoped now), which only ever go up and drive Leaderboard rank +
  // Gang Reward milestone progress. Keyed by your permanent id.
  useEffect(() => {
    if (!authReady || !currentGangId || !userProfile?.id) {
      setTripPoints(0);
      return;
    }
    const unsub = onValue(ref(db, `gangs/${currentGangId}/memberPoints/${userProfile.id}`), (snap) => {
      setTripPoints(Number(snap.val()) || 0);
    });
    return () => unsub();
  }, [authReady, currentGangId, userProfile?.id]);

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
  //  1. Global XP (userPoints) — lifetime across ALL gangs/trips, drives Level.
  //  2. Gang Lifetime Points (memberLifetimePoints) — lifetime within
  //     THIS GANG (spans every trip linked to it), never decreases.
  //     Drives Leaderboard rank and the Gang Reward milestone progress.
  //  3. Gang Reward Points (memberPoints) — spendable within this gang,
  //     decreases when a reward redemption is confirmed.
  // (1) and (2) are permanent records of what was earned; only (3) is a
  // spendable balance. This is what keeps "I redeemed a reward" from
  // ever knocking someone down the leaderboard. Pools (2) and (3) are
  // gang-scoped, not trip-scoped — earning points on ANY trip under a
  // gang adds to the SAME pool, which is the whole point of Gangs.
  const addPoints = (pts) => {
    setUserPoints((prev) => {
      const updated = Math.max(0, prev + pts);
      set(ref(db, "userPoints"), updated);
      return updated;
    });
    if (currentGangId && userProfile?.id) {
      runTransaction(ref(db, `gangs/${currentGangId}/memberPoints/${userProfile.id}`), (current) => {
        return Math.max(0, (current || 0) + pts);
      });
      runTransaction(ref(db, `gangs/${currentGangId}/memberLifetimePoints/${userProfile.id}`), (current) => {
        return Math.max(0, (current || 0) + pts);
      });
    }
  };

  // ── Trip actions ──
  // `newTrip.memberList` is expected to be an array of { id, name } now
  // (CreateTrip.jsx generates an id for every member it adds, reusing
  // userProfile.id for yourself) — written straight into the trip's
  // id-keyed members map. `newTrip.gangId` is REQUIRED going forward —
  // CreateTrip.jsx always resolves one first (an existing gang the
  // person picked, or a brand-new one it just created) — so a new trip
  // never has to go through the old auto-migration path at all; that
  // path only exists for trips that were created before Gangs existed.
  const addTrip = (newTrip) => {
    if (!authReady) {
      setToast("Still connecting… try again in a second");
      return;
    }
    const id = Date.now().toString();
    const { memberList, ...rest } = newTrip;
    const tripObj = { id, ...rest };
    set(ref(db, `trips/${id}`), tripObj).catch((err) => {
      console.error("Failed to save trip:", err);
      setToast("Couldn't save trip — check your connection");
    });
    if (memberList?.length > 0) {
      const membersObj = {};
      memberList.forEach((m) => {
        if (m?.id && m?.name) membersObj[m.id] = m.name;
      });
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

  // ── Gang Rewards (owned by the GANG now, not any one trip — creator
  // here means the gang's creator, gatekept by the screens that call
  // this using gangCreatorId) ──
  const addReward = ({ name, icon, points, description }) => {
    if (!currentGangId) return;
    const id = Date.now().toString();
    const reward = {
      id, name, icon: icon || "🎁", points: Number(points) || 0,
      description: description || "",
    };
    set(ref(db, `gangs/${currentGangId}/rewards/${id}`), reward).catch((err) => {
      console.error("Failed to save reward:", err);
      setToast("Couldn't save reward");
    });
    setToast("Reward created 🎉");
  };

  // Deleting a reward only removes it from the list people can redeem
  // NEW requests against — it's safe even if people already redeemed it,
  // because every redeem request stores its own snapshot of the reward's
  // name/icon/points at the moment it was requested (see requestRedeem
  // below), never a live reference back to the reward itself. So past
  // "Pending"/"Confirmed" requests keep displaying correctly forever,
  // with nothing left dangling.
  const deleteReward = (id) => {
    if (!currentGangId) return;
    remove(ref(db, `gangs/${currentGangId}/rewards/${id}`)).catch((err) => {
      console.error("Failed to delete reward:", err);
      setToast("Couldn't delete reward");
    });
  };

  // ── Gang Reward milestones (owned by the GANG now) ──
  const addGangMilestone = ({ threshold, label, desc }) => {
    if (!currentGangId) return;
    const id = Date.now().toString();
    const milestone = {
      id, threshold: Number(threshold) || 0,
      label: label || "🎉 Milestone", desc: desc || "",
    };
    set(ref(db, `gangs/${currentGangId}/milestones/${id}`), milestone).catch((err) => {
      console.error("Failed to save milestone:", err);
      setToast("Couldn't save milestone");
    });
    setToast("Milestone added 🏆");
  };

  const deleteGangMilestone = (id) => {
    if (!currentGangId) return;
    remove(ref(db, `gangs/${currentGangId}/milestones/${id}`)).catch((err) => {
      console.error("Failed to delete milestone:", err);
    });
  };

  // Redeem requests reference the requester by id now (memberId). A
  // `memberName` is still stored alongside it — purely a display snapshot
  // of the name at the moment the request was made, never read for
  // identity/math — so Rewards/YourRedeem can show a label without every
  // screen needing a live id→name lookup.
  const requestRedeem = (reward) => {
    if (!currentGangId || !userProfile?.id) return;
    const id = Date.now().toString();
    const request = {
      id,
      memberId: userProfile.id,
      memberName: userProfile.name || "",
      rewardId: reward.id,
      rewardName: reward.name,
      icon: reward.icon,
      points: reward.points,
      status: "Pending",
      requestedAt: id,
    };
    set(ref(db, `gangs/${currentGangId}/redeemRequests/${id}`), request).catch((err) => {
      console.error("Failed to request redeem:", err);
      setToast("Couldn't send request");
    });
    setToast("Redeem requested — waiting for confirmation ⏳");
  };

  // Creator-only: deducts points from the gang's AVAILABLE pool only —
  // memberLifetimePoints (rank/milestones) is never touched here.
  const confirmRedeem = (redeemId) => {
    if (!currentGangId) return;
    const request = tripRedeems.find((r) => r.id === redeemId);
    if (!request || request.status === "Confirmed") return;
    const memberKey = request.memberId || request.memberName; // fallback for any request made before this refactor

    // Clamped at 0 — someone can file several "Pending" requests whose
    // points each individually fit their balance at request time, but
    // whose total doesn't once more than one actually gets confirmed
    // (e.g. two 80-pt requests against a 100-pt balance). Without this,
    // confirming the second one would push their balance negative
    // instead of just landing at 0.
    runTransaction(ref(db, `gangs/${currentGangId}/memberPoints/${memberKey}`), (current) => {
      return Math.max(0, (current || 0) - request.points);
    }).then(() => {
      set(ref(db, `gangs/${currentGangId}/redeemRequests/${redeemId}/status`), "Confirmed");
      setToast(`Confirmed ${request.memberName || nameForId(memberKey)}'s redeem ✓`);
    }).catch((err) => {
      console.error("Failed to confirm redeem:", err);
      setToast("Couldn't confirm redeem");
    });
  };

  // ── Expense actions ──
  // `newExpense.paidBy` / `.sharedBy` are member ids now, supplied by
  // whichever screen built the expense (AddExpense.jsx, ScanReceipt.jsx).
  const addExpense = (newExpense) => {
    if (!currentTripId) return;
    const allIds = tripMembers.map((m) => m.id);
    const sharedBy = newExpense.sharedBy?.length > 0 ? newExpense.sharedBy : allIds;
    const id = Date.now();
    const bill = {
      id,
      name: newExpense.name || "Untitled Expense",
      amount: Number(newExpense.amount) || 0,
      paidBy: newExpense.paidBy || allIds[0] || "",
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
    // Reverses whatever points this specific bill actually earned: +2
    // for being added, PLUS +10 more if it was already settled
    // (Settlement.jsx awards +10/bill on settle, via onSettleAndEarnPoints
    // in the router below). Without checking status here, deleting an
    // already-settled bill only used to undo the +2 "add" bonus — the
    // +10 settle bonus stayed, forever, which is free points on tap:
    // add a bill, settle it (+10), delete it, repeat.
    const bill = tripBills.find((b) => b.id === id);
    const wasSettled = bill?.status === "Finished";
    addPoints(wasSettled ? -12 : -2);
    remove(ref(db, `trips/${currentTripId}/bills/${id}`));
    setToast(wasSettled ? "Settled expense deleted — points reversed" : "Expense deleted");
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
  // Every member now has a permanent id. Renaming is just one field on
  // one id (editMember) — no cascade across bills/points/creator needed
  // anymore, because none of those store the name itself.
  // `explicitId`: lets a caller (AddExpense.jsx, say) generate the id
  // itself first and pass it in, so it can use that same id immediately
  // in its own local state (adding the new person straight into "Shared
  // By") instead of waiting for Firebase's realtime listener to echo the
  // write back. Returns the id that was actually used either way.
  const addMember = (name, explicitId = null) => {
    const trimmed = (name || "").trim();
    if (!trimmed || !currentTripId) return null;
    if (tripMembers.some((m) => sameName(m.name, trimmed))) {
      setToast("That name is already used");
      return null;
    }
    const id = explicitId || makeMemberId();
    set(ref(db, `trips/${currentTripId}/members/${id}`), trimmed).catch((err) => {
      console.error("Failed to add member:", err);
    });
    return id;
  };

  const editMember = (memberId, newName) => {
    const trimmed = (newName || "").trim();
    if (!trimmed || !currentTripId) return;
    const existing = tripMembers.find((m) => m.id === memberId);
    if (!existing || existing.name === trimmed) return;

    const isDuplicate = tripMembers.some(
      (m) => m.id !== memberId && sameName(m.name, trimmed)
    );
    if (isDuplicate) {
      setToast("That name is already used");
      return;
    }

    set(ref(db, `trips/${currentTripId}/members/${memberId}`), trimmed);

    // Your own device profile name is stored separately from trip
    // membership — if your trip member entry gets renamed (e.g. by
    // someone editing the list), keep your own Profile display name in
    // sync too, since it's the same id.
    if (userProfile?.id === memberId) {
      setUserProfile((prev) => ({ ...prev, name: trimmed }));
    }

    setToast(`Renamed to ${trimmed}`);
  };

  const removeMember = (memberId) => {
    if (!currentTripId) return;
    remove(ref(db, `trips/${currentTripId}/members/${memberId}`)).catch((err) => {
      console.error("Failed to remove member:", err);
    });
  };

  // Renaming yourself on the Profile screen: your profile name and your
  // trip member entry are the SAME id now, so this is just two writes to
  // the same value — no searching for a matching name, nothing to
  // orphan. If you don't have a member entry on the current trip yet
  // (e.g. you were invited but haven't been added), only your profile
  // name changes.
  const renameProfile = (newName) => {
    const trimmed = (newName || "").trim();
    if (!trimmed || !userProfile?.id) return;
    const existingMember = currentTripId ? tripMembers.find((m) => m.id === userProfile.id) : null;
    if (existingMember && existingMember.name !== trimmed) {
      editMember(userProfile.id, trimmed);
    }
    setUserProfile((prev) => ({ ...prev, name: trimmed }));
  };

  // Merges a duplicate member's ENTIRE history into another member's —
  // for the rare case where the same real person ends up with two
  // different ids (e.g. added themselves twice, or old data). Unlike
  // editMember (renaming one id), this SUMS points instead of
  // overwriting, since both ids represent real accumulated history of
  // the same person, and reassigns every bill/redeem reference from the
  // merged id to the kept id.
  const mergeMembers = (keepId, mergeId) => {
    if (!currentTripId || !keepId || !mergeId || keepId === mergeId) return;
    const tripId = currentTripId;

    remove(ref(db, `trips/${tripId}/members/${mergeId}`));

    // If the merged id was ALSO separately in the gang's own member
    // list (not just this trip's), fold that in too — otherwise the two
    // ids would still show up as two different people on the gang
    // leaderboard even after this merge.
    if (currentGangId && gangMembers.some((m) => m.id === mergeId)) {
      remove(ref(db, `gangs/${currentGangId}/members/${mergeId}`));
      if (!gangMembers.some((m) => m.id === keepId)) {
        const keptName = tripMembers.find((m) => m.id === keepId)?.name
          || gangMembers.find((m) => m.id === mergeId)?.name || "";
        if (keptName) set(ref(db, `gangs/${currentGangId}/members/${keepId}`), keptName);
      }
      if (gangCreatorId === mergeId) {
        set(ref(db, `gangs/${currentGangId}/creatorId`), keepId);
      }
    }

    if (currentTrip?.creator === mergeId) {
      set(ref(db, `trips/${tripId}/creator`), keepId);
    }
    if (userProfile?.id === mergeId) {
      setUserProfile((prev) => ({ ...prev, id: keepId }));
    }

    tripBills.forEach((bill) => {
      let changed = false;
      const updated = { ...bill };
      if (updated.paidBy === mergeId) { updated.paidBy = keepId; changed = true; }
      if (Array.isArray(updated.sharedBy) && updated.sharedBy.includes(mergeId)) {
        updated.sharedBy = Array.from(new Set(
          updated.sharedBy.map((id) => (id === mergeId ? keepId : id))
        ));
        changed = true;
      }
      if (changed) set(ref(db, `trips/${tripId}/bills/${updated.id}`), updated);
    });

    // Redeem requests live under the GANG now, not the trip.
    if (currentGangId) {
      tripRedeems.forEach((req) => {
        if ((req.memberId || req.memberName) === mergeId) {
          set(ref(db, `gangs/${currentGangId}/redeemRequests/${req.id}/memberId`), keepId);
        }
      });
    }

    // Points are the one place a merge differs from a plain reassignment
    // — add the two balances together instead of letting the second
    // write clobber the first, since both are real points earned by the
    // same person under two different ids. These pools are gang-scoped
    // now, not trip-scoped.
    const sumKey = (path) => {
      Promise.all([
        get(ref(db, `${path}/${keepId}`)),
        get(ref(db, `${path}/${mergeId}`)),
      ]).then(([keepSnap, mergeSnap]) => {
        const total = (Number(keepSnap.val()) || 0) + (Number(mergeSnap.val()) || 0);
        set(ref(db, `${path}/${keepId}`), total);
        remove(ref(db, `${path}/${mergeId}`));
      }).catch((err) => console.error(`Failed to merge ${path}:`, err));
    };
    if (currentGangId) {
      sumKey(`gangs/${currentGangId}/memberPoints`);
      sumKey(`gangs/${currentGangId}/memberLifetimePoints`);
    }

    setToast("Merged duplicate member ✓");
  };

  // ── Gang management ──
  // A Gang is the persistent entity that owns rewards/points and spans
  // every trip linked to it. `createGang` generates its id client-side
  // (same pattern as every other id in this app) so the CALLER (e.g.
  // CreateTrip.jsx) gets the id back immediately and can use it in the
  // very same action — e.g. writing it onto a brand-new trip — without
  // waiting on a round-trip to Firebase first.
  const createGang = (name, memberList = []) => {
    const trimmed = (name || "").trim();
    if (!authReady || !trimmed) return null;
    const id = `gang-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const membersObj = {};
    memberList.forEach((m) => {
      if (m?.id && m?.name) membersObj[m.id] = m.name;
    });
    const gang = {
      id,
      name: trimmed,
      creatorId: userProfile?.id || "",
      members: membersObj,
    };
    set(ref(db, `gangs/${id}`), gang).catch((err) => {
      console.error("Failed to create gang:", err);
      setToast("Couldn't create gang");
    });
    return id;
  };

  // Gang membership is independent of any one trip's roster — someone
  // can be in the gang (and show up on its leaderboard/rewards) without
  // having joined every trip under it.
  const addGangMember = (gangId, name) => {
    const trimmed = (name || "").trim();
    if (!trimmed || !gangId) return null;
    const alreadyIn = gangMembers.some((m) => sameName(m.name, trimmed));
    if (alreadyIn) {
      setToast("That name is already in this gang");
      return null;
    }
    const id = makeMemberId();
    set(ref(db, `gangs/${gangId}/members/${id}`), trimmed).catch((err) => {
      console.error("Failed to add gang member:", err);
    });
    return id;
  };

  const removeGangMember = (gangId, memberId) => {
    if (!gangId) return;
    remove(ref(db, `gangs/${gangId}/members/${memberId}`)).catch((err) => {
      console.error("Failed to remove gang member:", err);
    });
  };

  const renameGang = (gangId, newName) => {
    const trimmed = (newName || "").trim();
    if (!gangId || !trimmed) return;
    set(ref(db, `gangs/${gangId}/name`), trimmed).catch((err) => {
      console.error("Failed to rename gang:", err);
    });
    setToast("Gang renamed ✓");
  };

  // ── One-time migration: name-based identity → permanent member ids ──
  // Until now, every trip member was identified purely by their display
  // name string — bills, points, the creator field and redeem requests
  // all stored that name directly. That's the root cause behind a whole
  // family of bugs (a renamed member's history getting orphaned as a
  // "new" person being the one you already hit). This migration runs
  // ONCE per trip, the first time that trip loads under this version:
  // it gives every current member a permanent random id, then rewrites
  // every bill, points record, the creator field, and every redeem
  // request to reference that id instead of the name — preserving all
  // existing history. A flag on the trip (`migrations/memberIdsV2`)
  // makes this safe to leave running on every load; it only ever does
  // real work the first time.
  //
  // Your own device profile's id is reused as the member id for whichever
  // current member matches your profile's name — so going forward,
  // "you" on this trip and "you" on your device Profile are provably the
  // same id, and a future rename can never split them apart again.
  useEffect(() => {
    if (!authReady || !currentTripId || !currentTrip) return;
    if (!userProfile?.id) return; // wait for your own id to exist first

    const flagRef = ref(db, `trips/${currentTripId}/migrations/memberIdsV2`);
    get(flagRef).then((flagSnap) => {
      if (flagSnap.exists()) return; // already migrated

      Promise.all([
        get(ref(db, `trips/${currentTripId}/members`)),
        get(ref(db, `trips/${currentTripId}/bills`)),
        get(ref(db, `trips/${currentTripId}/memberPoints`)),
        get(ref(db, `trips/${currentTripId}/memberLifetimePoints`)),
        get(ref(db, `trips/${currentTripId}/redeemRequests`)),
      ]).then(([membersSnap, billsSnap, pointsSnap, lifetimeSnap, redeemsSnap]) => {
        const oldMembers = membersSnap.val() || {}; // { oldKey: name }
        const oldNames = Object.values(oldMembers).filter(Boolean);
        if (oldNames.length === 0) {
          // Nothing to migrate yet (empty trip) — just set the flag so
          // this doesn't keep re-checking forever.
          set(flagRef, true);
          return;
        }

        // name → new permanent id. Your own name gets your own stable
        // profile id; everyone else gets a freshly generated one.
        const nameToId = {};
        const newMembersObj = {};
        oldNames.forEach((name) => {
          if (nameToId[name]) return; // dedupe exact-duplicate name entries
          const id = sameName(name, userProfile?.name) ? userProfile.id : makeMemberId();
          nameToId[name] = id;
          newMembersObj[id] = name;
        });

        set(ref(db, `trips/${currentTripId}/members`), newMembersObj);

        if (currentTrip?.creator && nameToId[currentTrip.creator]) {
          set(ref(db, `trips/${currentTripId}/creator`), nameToId[currentTrip.creator]);
        }

        const oldBills = billsSnap.val() || {};
        Object.values(oldBills).forEach((bill) => {
          const updated = { ...bill };
          let changed = false;
          if (updated.paidBy && nameToId[updated.paidBy]) {
            updated.paidBy = nameToId[updated.paidBy];
            changed = true;
          }
          if (Array.isArray(updated.sharedBy)) {
            const mapped = updated.sharedBy.map((n) => nameToId[n] || n);
            if (mapped.some((v, i) => v !== updated.sharedBy[i])) {
              updated.sharedBy = mapped;
              changed = true;
            }
          }
          if (changed) set(ref(db, `trips/${currentTripId}/bills/${updated.id}`), updated);
        });

        const remapPointsNode = (path, snapVal) => {
          const data = snapVal || {};
          const remapped = {};
          Object.entries(data).forEach(([name, value]) => {
            const id = nameToId[name] || name;
            remapped[id] = (remapped[id] || 0) + (Number(value) || 0);
          });
          set(ref(db, path), remapped);
        };
        remapPointsNode(`trips/${currentTripId}/memberPoints`, pointsSnap.val());
        remapPointsNode(`trips/${currentTripId}/memberLifetimePoints`, lifetimeSnap.val());

        const oldRedeems = redeemsSnap.val() || {};
        Object.values(oldRedeems).forEach((req) => {
          if (req.memberId) return; // already in new shape
          const id = nameToId[req.memberName] || req.memberName;
          set(ref(db, `trips/${currentTripId}/redeemRequests/${req.id}/memberId`), id);
        });

        set(flagRef, true);
      }).catch((err) => console.error("Member-id migration failed:", err));
    }).catch((err) => console.error("Migration flag check failed:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, currentTripId, !!currentTrip, userProfile?.id]);

  // ── One-time migration: trip-owned rewards/points → Gang-owned ──
  // Before Gangs existed, every trip owned its own rewards/points, reset
  // to zero by the next trip. This runs ONCE per trip that doesn't have
  // a gangId yet: it creates a brand-new Gang (named after the trip),
  // copies that trip's existing members/rewards/redeemRequests/
  // milestones/points into it untouched, then links the trip to it. A
  // NEW trip never hits this path at all — CreateTrip.jsx always
  // resolves a gangId (existing or freshly created) before the trip is
  // even saved, same spirit as the member-id migration above.
  useEffect(() => {
    if (!authReady || !currentTripId || !currentTrip) return;
    if (currentTrip.gangId) return; // already linked to a gang

    const flagRef = ref(db, `trips/${currentTripId}/migrations/gangV1`);
    get(flagRef).then((flagSnap) => {
      if (flagSnap.exists()) return; // already migrated (gangId write just hasn't echoed back yet)

      Promise.all([
        get(ref(db, `trips/${currentTripId}/members`)),
        get(ref(db, `trips/${currentTripId}/rewards`)),
        get(ref(db, `trips/${currentTripId}/redeemRequests`)),
        get(ref(db, `trips/${currentTripId}/gangMilestones`)),
        get(ref(db, `trips/${currentTripId}/memberPoints`)),
        get(ref(db, `trips/${currentTripId}/memberLifetimePoints`)),
      ]).then(([membersSnap, rewardsSnap, redeemsSnap, milestonesSnap, pointsSnap, lifetimeSnap]) => {
        const gangId = `gang-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const gang = {
          id: gangId,
          name: currentTrip.title ? `${currentTrip.title} Gang` : "My Gang",
          creatorId: currentTrip.creator || userProfile?.id || "",
          members: membersSnap.val() || {},
          memberPoints: pointsSnap.val() || {},
          memberLifetimePoints: lifetimeSnap.val() || {},
          rewards: rewardsSnap.val() || {},
          redeemRequests: redeemsSnap.val() || {},
          milestones: milestonesSnap.val() || {},
        };
        set(ref(db, `gangs/${gangId}`), gang).then(() => {
          set(ref(db, `trips/${currentTripId}/gangId`), gangId);
          set(flagRef, true);
        });
      }).catch((err) => console.error("Gang migration failed:", err));
    }).catch((err) => console.error("Gang migration flag check failed:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, currentTripId, !!currentTrip, currentTrip?.gangId, userProfile?.id]);

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

  // Lets the current device claim "creator" status on a trip that has
  // none recorded, or whose creator id no longer matches anyone (e.g.
  // very old trips created before the creator field existed). Creator
  // now stores a member id, so claiming just needs you to already be a
  // member — if you aren't yet, this adds you first using your own
  // permanent id so you're never a second, disconnected copy of
  // yourself.
  const claimTripCreator = () => {
    if (!currentTripId || !userProfile?.id) return;
    const alreadyMember = tripMembers.some((m) => m.id === userProfile.id);
    if (!alreadyMember && userProfile.name) {
      set(ref(db, `trips/${currentTripId}/members/${userProfile.id}`), userProfile.name.trim());
    }
    set(ref(db, `trips/${currentTripId}/creator`), userProfile.id).then(() => {
      setToast(`You're now the creator of this trip ✓`);
    }).catch((err) => {
      console.error("Failed to claim creator:", err);
      setToast("Couldn't update creator");
    });
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
      case "create":          return <CreateTrip setPage={setPage} addTrip={addTrip} userProfile={userProfile} teams={teams} addTeam={addTeam} gangs={gangs} createGang={createGang} />;
      case "edittrip":        return <EditTrip setPage={setPage} currentTrip={currentTrip} tripMembers={tripMembers} tripBills={tripBills} userProfile={userProfile} updateTripDetails={updateTripDetails} addMember={addMember} removeMember={removeMember} editMember={editMember} claimTripCreator={claimTripCreator} />;
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
      case "leaderboard":     return <Leaderboard setPage={setPage} authReady={authReady} currentGangId={currentGangId} gangName={gangName} gangCreatorId={gangCreatorId} currentTrip={currentTrip} userProfile={userProfile} tripMembers={tripMembers} gangMembers={gangMembers} tripMilestones={tripMilestones} addGangMilestone={addGangMilestone} deleteGangMilestone={deleteGangMilestone} />;
      case "gangsettings":    return <GangSettings setPage={setPage} currentGangId={currentGangId} gangName={gangName} gangCreatorId={gangCreatorId} gangMembers={gangMembers} userProfile={userProfile} addGangMember={addGangMember} removeGangMember={removeGangMember} renameGang={renameGang} />;
      case "mypoints":        return <MyPoints setPage={setPage} userPoints={userPoints} tripPoints={tripPoints} currentTrip={currentTrip} gangName={gangName} />;
      case "rewardslist":     return <Rewards setPage={setPage} userPoints={tripPoints} tripRewards={tripRewards} tripRedeems={tripRedeems} currentTrip={currentTrip} gangCreatorId={gangCreatorId} userProfile={userProfile} requestRedeem={requestRedeem} confirmRedeem={confirmRedeem} deleteReward={deleteReward} setSelectedRedeem={setSelectedRedeem} />;
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