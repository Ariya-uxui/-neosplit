import "./App.css";
import React, { useState, useEffect, useReducer } from "react";
import Home from "./screens/Home";
import CreateTrip from "./screens/Createtrip";
import TripDetail from "./screens/Tripdetail";
import Bills from "./screens/Bills";
import BillHistory from "./screens/Billhistory";
import BillDetail from "./screens/Billdetail";
import Rewards from "./screens/Rewards";
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
import { ref, onValue, set, remove } from "firebase/database";
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
  showLanding: true,
};

function uiReducer(state, action) {
  switch (action.type) {
    case "NAVIGATE":
      return { ...state, page: action.page };
    case "SET_TOAST":
      return { ...state, toast: action.message };
    case "SET_SELECTED_BILL":
      return { ...state, selectedBill: action.bill };
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
    case "CLEAR_CURRENT_TRIP":
      return { ...state, currentTripId: null, currentTrip: null, tripBills: [], tripMembers: [] };
    default:
      return state;
  }
}

function App() {
  const [ui, dispatchUi] = useReducer(uiReducer, initialUiState);
  const { page, toast, editingExpense, selectedBill, showLanding } = ui;

  const [trip, dispatchTrip] = useReducer(tripReducer, initialTripState);
  const { trips, currentTripId, currentTrip, tripBills, tripMembers } = trip;

  const [userPoints, setUserPoints] = useState(0);
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

  useEffect(() => {
    localStorage.setItem("neosplitProfile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Points ──
  const addPoints = (pts) => {
    setUserPoints((prev) => {
      const updated = prev + pts;
      set(ref(db, "userPoints"), updated);
      return updated;
    });
  };

  const spendPoints = (pts) => {
    setUserPoints((prev) => {
      const updated = Math.max(0, prev - pts);
      set(ref(db, "userPoints"), updated);
      return updated;
    });
  };

  // ── Trip actions ──
  const addTrip = (newTrip) => {
    const id = Date.now().toString();
    const trip = { id, ...newTrip };
    set(ref(db, `trips/${id}`), trip);
    // save members under trip
    if (newTrip.memberList?.length > 0) {
      const membersObj = {};
      newTrip.memberList.forEach((m, i) => { membersObj[i] = m; });
      set(ref(db, `trips/${id}/members`), membersObj);
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
    addPoints(5);
    setToast("Expense added ✓ +5 pts");
  };

  const markBillAsSettled = (billId) => {
    if (!currentTripId) return;
    const bill = tripBills.find((b) => b.id === billId);
    if (bill) set(ref(db, `trips/${currentTripId}/bills/${billId}`), { ...bill, status: "Finished" });
    if (selectedBill?.id === billId) {
      setSelectedBill({ ...selectedBill, status: "Finished" });
    }
    setToast("Bill settled ✅");
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
      case "create":          return <CreateTrip setPage={setPage} addTrip={addTrip} />;
      case "tripdetail":      return <TripDetail {...p} deleteExpense={deleteExpense} startEditExpense={startEditExpense} deleteTrip={deleteTrip} currentTrip={currentTrip} currentTripId={currentTripId} getInviteLink={getInviteLink} />;
      case "addexpense":      return <AddExpense {...p} addExpense={addExpense} addMember={addMember} removeMember={removeMember} editMember={editMember} />;
      case "editexpense":     return <EditExpense {...p} editingExpense={editingExpense} updateExpense={updateExpense} />;
      case "receipt":         return <Bills {...p} setSelectedBill={setSelectedBill} />;
      case "billhistory":     return <BillHistory {...p} setSelectedBill={setSelectedBill} />;
      case "billdetail":      return <BillDetail {...p} selectedBill={selectedBill} markBillAsSettled={markBillAsSettled} />;
      case "settlement":      return <Settlement {...p} settleAllBills={settleAllBills} selectedBill={selectedBill} onSettleAndEarnPoints={addPoints} />;
      case "splitbill":       return <SplitBill setPage={setPage} tripBills={tripBills} tripMembers={tripMembers} setSelectedBill={setSelectedBill} />;
      case "splitcalculator": return <SplitCalculator setPage={setPage} selectedBill={selectedBill} />;
      case "profile":         return <Profile setPage={setPage} userProfile={userProfile} setUserProfile={setUserProfile} theme={theme} setTheme={setTheme} />;
      case "trophy":
      case "leaderboard":     return <Leaderboard setPage={setPage} userPoints={userPoints} userProfile={userProfile} tripMembers={tripMembers} />;
      case "mypoints":        return <MyPoints setPage={setPage} userPoints={userPoints} />;
      case "rewardslist":     return <Rewards setPage={setPage} userPoints={userPoints} onRedeem={spendPoints} />;
      case "yourredeem":      return <YourRedeem setPage={setPage} />;
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