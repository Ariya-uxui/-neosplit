import "./App.css";
import React, { useState, useEffect, useReducer } from "react";
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
    const hashPage = window.location.hash ? window.location.hash.slice(1) : "";
    return hashPage ? { ...init, page: hashPage } : init;
  });
  const { page, toast, editingExpense, selectedBill, selectedRedeem, showLanding } = ui;

  const [trip, dispatchTrip] = useReducer(tripReducer, initialTripState);
  const { trips, currentTripId, currentTrip, tripBills, tripMembers, tripRewards, tripRedeems, tripMilestones } = trip;

  const [userPoints, setUserPoints] = useState(0);
  const [tripPoints, setTripPoints] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  // This device's anonymous Firebase auth ID — the key used to track
  // "which trips belong to me" (see myTripIds below), separate from
  // userProfile.name (which is just a display name people can share).
  const [myUid, setMyUid] = useState(null);
  // IDs of trips this device has created, joined via invite link, or
  // opened before. Home only shows trips in this list, so someone who
  // installs the app fresh sees an empty "Your Trips" instead of every
  // trip that's ever been made in the database.
  const [myTripIds, setMyTripIds] = useState([]);
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

  // Every navigation pushes a real browser history entry (via the URL
  // hash) — this is what makes the Back button move *within* the app
  // instead of leaving it, and what lets a reload restore the right
  // screen (see the lazy useReducer init above).
  const setPage = (p) => {
    dispatchUi({ type: "NAVIGATE", page: p });
    const hash = `#${p}`;
    if (window.location.hash !== hash) {
      window.history.pushState({ page: p }, "", hash);
    }
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

  // ── Back/Forward buttons navigate within the app ──
  // Without this, the browser (or Android's hardware Back button, once
  // wrapped as a native app) would just leave NeoSplit entirely instead
  // of stepping back to the previous screen.
  useEffect(() => {
    const handlePopState = (e) => {
      const p = e.state?.page || (window.location.hash ? window.location.hash.slice(1) : "home");
      dispatchUi({ type: "NAVIGATE", page: p });
    };
    window.addEventListener("popstate", handlePopState);

    // Normalize the very first history entry to match whatever page we
    // actually started on (replace, not push — this isn't a new visit).
    const startPage = window.location.hash ? window.location.hash.slice(1) : "splash";
    window.history.replaceState({ page: startPage }, "", `#${startPage}`);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
        setMyUid(user.uid);
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

  // ── "Which trips are mine" list ──
  // Drives what Home shows under "Your Trips". Lives at userTrips/{myUid}
  // rather than on the trip itself, since several people share one trip.
  useEffect(() => {
    if (!authReady || !myUid) return;
    const unsub = onValue(ref(db, `userTrips/${myUid}`), (snap) => {
      const data = snap.val();
      setMyTripIds(data ? Object.keys(data) : []);
    });
    return () => unsub();
  }, [authReady, myUid]);

  // ── Load current trip data when tripId changes ──
  useEffect(() => {
    if (!authReady || !currentTripId) return;
    const unsubTrip = onValue(ref(db, `trips/${currentTripId}`), (snap) => {
      const data = snap.val();
      if (data) {
        dispatchTrip({ type: "SET_CURRENT_TRIP", trip: data });
        // Opening a trip — whether you created it, followed an invite
        // link to it, or it's one you used before — marks it as yours,
        // so it keeps showing on your Home screen going forward.
        if (myUid) set(ref(db, `userTrips/${myUid}/${currentTripId}`), true);
      }
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
  }, [authReady, currentTripId, myUid]);

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
      const updated = prev + pts;
      set(ref(db, "userPoints"), updated);
      return updated;
    });
    if (currentTripId && userProfile?.name) {
      runTransaction(ref(db, `trips/${currentTripId}/memberPoints/${userProfile.name}`), (current) => {
        return (current || 0) + pts;
      });
      runTransaction(ref(db, `trips/${currentTripId}/memberLifetimePoints/${userProfile.name}`), (current) => {
        return (current || 0) + pts;
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
    // Mark it as yours right away, so it's not briefly missing from
    // Home while the view-triggered grant (above) catches up.
    if (myUid) set(ref(db, `userTrips/${myUid}/${id}`), true);
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

  const settleAllBills = () => {
    if (!currentTripId) return;
    const obj = {};
    tripBills.forEach((b) => { obj[b.id] = { ...b, status: "Finished" }; });
    set(ref(db, `trips/${currentTripId}/bills`), obj);
    setSelectedBill(null);
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
      (m) => m !== oldName && m.toLowerCase() === trimmed.toLowerCase()
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

  // ── Edit Trip ──
  const updateTripDetails = ({ title, date, location }) => {
    if (!currentTripId) return;
    if (title !== undefined) set(ref(db, `trips/${currentTripId}/title`), title);
    if (date !== undefined) set(ref(db, `trips/${currentTripId}/date`), date);
    if (location !== undefined) set(ref(db, `trips/${currentTripId}/location`), location);
    setToast("Trip updated ✓");
  };

  // Lets the current profile claim creator status on the active trip —
  // recovery path for a trip whose stored "creator" field never matched
  // (an older trip from before auto-add-yourself existed, or a rename
  // that happened before the cascading-rename fix). Also adds you as a
  // member if you aren't one, since a trip's creator should be in it.
  const claimTripCreator = () => {
    if (!currentTripId || !userProfile?.name) return;
    const trimmed = userProfile.name.trim();
    set(ref(db, `trips/${currentTripId}/creator`), trimmed);
    if (!tripMembers.includes(trimmed)) {
      const newMembers = [...tripMembers, trimmed];
      const membersObj = {};
      newMembers.forEach((m, i) => { membersObj[i] = m; });
      set(ref(db, `trips/${currentTripId}/members`), membersObj);
    }
    setToast(`You're now this trip's creator ✓`);
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
    // Home only shows trips this device has created, joined, or opened
    // before — not every trip anyone has ever made (see myTripIds).
    const myTrips = trips.filter((t) => myTripIds.includes(t.id));
    switch (page) {
      case "splash":          return <Splash setPage={setPage} />;
      case "home":            return <Home {...p} userProfile={userProfile} trips={myTrips} currentTripId={currentTripId} selectTrip={selectTrip} deleteTrip={deleteTrip} openEditTrip={openEditTrip} />;
      case "create":          return <CreateTrip setPage={setPage} addTrip={addTrip} userProfile={userProfile} teams={teams} addTeam={addTeam} />;
      case "edittrip":        return <EditTrip setPage={setPage} currentTrip={currentTrip} tripMembers={tripMembers} tripBills={tripBills} userProfile={userProfile} updateTripDetails={updateTripDetails} addMember={addMember} removeMember={removeMember} editMember={editMember} claimTripCreator={claimTripCreator} />;
      case "tripdetail":      return <TripDetail {...p} deleteExpense={deleteExpense} startEditExpense={startEditExpense} deleteTrip={deleteTrip} currentTrip={currentTrip} currentTripId={currentTripId} getInviteLink={getInviteLink} />;
      case "addexpense":      return <AddExpense {...p} addExpense={addExpense} addMember={addMember} removeMember={removeMember} editMember={editMember} />;
      case "scanreceipt":     return <ScanReceipt {...p} addExpense={addExpense} userProfile={userProfile} />;
      case "editexpense":     return <EditExpense {...p} editingExpense={editingExpense} updateExpense={updateExpense} />;
      case "receipt":         return <Bills {...p} setSelectedBill={setSelectedBill} />;
      case "billhistory":     return <BillHistory {...p} setSelectedBill={setSelectedBill} />;
      case "billdetail":      return <BillDetail {...p} selectedBill={selectedBill} startEditExpense={startEditExpense} />;
      case "settlement":      return <Settlement {...p} settleAllBills={settleAllBills} selectedBill={selectedBill} onSettleAndEarnPoints={addPoints} />;
      case "splitbill":       return <SplitBill setPage={setPage} tripBills={tripBills} tripMembers={tripMembers} setSelectedBill={setSelectedBill} />;
      case "splitcalculator": return <SplitCalculator setPage={setPage} selectedBill={selectedBill} />;
      case "profile":         return <Profile setPage={setPage} userProfile={userProfile} setUserProfile={setUserProfile} theme={theme} setTheme={setTheme} />;
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