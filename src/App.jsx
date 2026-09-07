import "./App.css";
import React, { useState, useEffect, useReducer } from "react";
import Home from "./screens/Home";
import CreateTrip from "./screens/Createtrip";
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
import { ref, onValue, set, remove, runTransaction } from "firebase/database";
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
// Groups the screens-and-modals state that used to be five separate
// useState calls (page, toast, editingExpense, selectedBill, showLanding).
// These all change together as the user navigates, so one reducer keeps
// each transition atomic and easy to follow in one place.
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
// Groups everything loaded from/about the active trip (trips list,
// currentTripId, currentTrip, tripBills, tripMembers) — previously five
// separate useState calls that always changed in step with each other
// (e.g. deleting the active trip has to reset four of them at once).
const initialTripState = {
  trips: [],
  currentTripId: null,
  currentTrip: null,
  tripBills: [],
  tripMembers: [],
  tripRewards: [],
  tripRedeems: [],
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
    case "CLEAR_CURRENT_TRIP":
      return { ...state, currentTripId: null, currentTrip: null, tripBills: [], tripMembers: [], tripRewards: [], tripRedeems: [] };
    default:
      return state;
  }
}

function App() {
  const [ui, dispatchUi] = useReducer(uiReducer, initialUiState);
  const { page, toast, editingExpense, selectedBill, selectedRedeem, showLanding } = ui;

  const [trip, dispatchTrip] = useReducer(tripReducer, initialTripState);
  const { trips, currentTripId, currentTrip, tripBills, tripMembers, tripRewards, tripRedeems } = trip;

  const [userPoints, setUserPoints] = useState(0);
  const [tripPoints, setTripPoints] = useState(0);
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

  // ── Thin wrappers so every screen keeps calling setPage/setToast/etc.
  // exactly as before — only the storage underneath changed. ──
  const setPage = (p) => dispatchUi({ type: "NAVIGATE", page: p });
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
  // This is invisible to the user — no login screen, just a background
  // device identity so the database can reject requests with no auth token.
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
    return () => { unsubTrip(); unsubBills(); unsubMembers(); unsubRewards(); unsubRedeems(); };
  }, [authReady, currentTripId]);

  // ── Load points ──
  // "userPoints" is GLOBAL lifetime XP — drives the Level shown in My
  // Points, and only ever goes up (redeeming a reward never lowers it).
  useEffect(() => {
    if (!authReady) return;
    const unsub = onValue(ref(db, "userPoints"), (snap) => {
      if (snap.val() !== null) setUserPoints(Number(snap.val()) || 0);
    });
    return () => unsub();
  }, [authReady]);

  // "tripPoints" is scoped to the ACTIVE trip — this is the currency the
  // Leaderboard ranks by and Rewards spends. Separate pool per trip.
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
  // Every point-earning action credits BOTH pools: global XP (permanent,
  // for Level) and this trip's shared point pool (spendable, for that
  // trip's Leaderboard/Rewards). The trip-scoped write uses a transaction
  // since multiple members can earn points around the same time.
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
    }
  };

  // ── Trip actions ──
  const addTrip = (newTrip) => {
    if (!authReady) {
      setToast("Still connecting… try again in a second");
      return;
    }
    const id = Date.now().toString();
    const trip = { id, ...newTrip };
    set(ref(db, `trips/${id}`), trip).catch((err) => {
      console.error("Failed to save trip:", err);
      setToast("Couldn't save trip — check your connection");
    });
    // save members under trip
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

  // Any member can request — this just files a Pending request.
  // Points are NOT deducted until the trip creator confirms it below.
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

  // Creator-only: deducts points from the trip's shared pool and marks
  // the request Confirmed. This never touches global XP — redeeming a
  // reward spends the trip's points, it doesn't lower anyone's Level.
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

    const newMembers = tripMembers.map((m) => (m === oldName ? trimmed : m));
    const membersObj = {};
    newMembers.forEach((m, i) => { membersObj[i] = m; });
    set(ref(db, `trips/${currentTripId}/members`), membersObj);

    // Cascade the rename into existing bills so past bills don't keep
    // pointing at a name that no longer exists in the trip.
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
        set(ref(db, `trips/${currentTripId}/bills/${updated.id}`), updated);
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
      case "home":            return <Home {...p} userProfile={userProfile} trips={trips} currentTripId={currentTripId} selectTrip={selectTrip} deleteTrip={deleteTrip} />;
      case "create":          return <CreateTrip setPage={setPage} addTrip={addTrip} userProfile={userProfile} />;
      case "tripdetail":      return <TripDetail {...p} deleteExpense={deleteExpense} startEditExpense={startEditExpense} deleteTrip={deleteTrip} currentTrip={currentTrip} currentTripId={currentTripId} getInviteLink={getInviteLink} />;
      case "addexpense":      return <AddExpense {...p} addExpense={addExpense} addMember={addMember} removeMember={removeMember} editMember={editMember} />;
      case "editexpense":     return <EditExpense {...p} editingExpense={editingExpense} updateExpense={updateExpense} />;
      case "receipt":         return <Bills {...p} setSelectedBill={setSelectedBill} />;
      case "billhistory":     return <BillHistory {...p} setSelectedBill={setSelectedBill} />;
      case "billdetail":      return <BillDetail {...p} selectedBill={selectedBill} startEditExpense={startEditExpense} />;
      case "settlement":      return <Settlement {...p} settleAllBills={settleAllBills} selectedBill={selectedBill} onSettleAndEarnPoints={addPoints} />;
      case "splitbill":       return <SplitBill setPage={setPage} tripBills={tripBills} tripMembers={tripMembers} setSelectedBill={setSelectedBill} />;
      case "splitcalculator": return <SplitCalculator setPage={setPage} selectedBill={selectedBill} />;
      case "profile":         return <Profile setPage={setPage} userProfile={userProfile} setUserProfile={setUserProfile} theme={theme} setTheme={setTheme} />;
      case "trophy":
      case "leaderboard":     return <Leaderboard setPage={setPage} currentTripId={currentTripId} currentTrip={currentTrip} userProfile={userProfile} tripMembers={tripMembers} />;
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