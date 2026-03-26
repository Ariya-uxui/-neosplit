import "./App.css";
import React, { useState, useEffect } from "react";
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
import { db } from "./firebase";
import { ref, onValue, set, remove } from "firebase/database";
 
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
 
function App() {
  const [page, setPage] = useState("splash");
  const [toast, setToast] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
 
  // ── Active trip state ──
  const [currentTripId, setCurrentTripId] = useState(null);
  const [trips, setTrips] = useState([]);
  const [tripBills, setTripBills] = useState([]);
  const [tripMembers, setTripMembers] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
 
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
      setCurrentTripId(invitedTripId);
      localStorage.setItem("lastTripId", invitedTripId);
      window.history.replaceState({}, "", window.location.pathname);
    } else {
      const saved = localStorage.getItem("lastTripId");
      if (saved) setCurrentTripId(saved);
    }
  }, []);
 
  // ── Load all trips list ──
  useEffect(() => {
    const unsub = onValue(ref(db, "trips"), (snap) => {
      const data = snap.val();
      setTrips(data ? Object.values(data) : []);
    });
    return () => unsub();
  }, []);
 
  // ── Load current trip data when tripId changes ──
  useEffect(() => {
    if (!currentTripId) return;
    const unsubTrip = onValue(ref(db, `trips/${currentTripId}`), (snap) => {
      const data = snap.val();
      if (data) setCurrentTrip(data);
    });
    const unsubBills = onValue(ref(db, `trips/${currentTripId}/bills`), (snap) => {
      const data = snap.val();
      setTripBills(data ? Object.values(data).map(normalizeBill) : []);
    });
    const unsubMembers = onValue(ref(db, `trips/${currentTripId}/members`), (snap) => {
      const data = snap.val();
      setTripMembers(data ? Object.values(data) : []);
    });
    return () => { unsubTrip(); unsubBills(); unsubMembers(); };
  }, [currentTripId]);
 
  // ── Load points ──
  useEffect(() => {
    const unsub = onValue(ref(db, "userPoints"), (snap) => {
      if (snap.val() !== null) setUserPoints(Number(snap.val()) || 0);
    });
    return () => unsub();
  }, []);
 
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
    setCurrentTripId(id);
    localStorage.setItem("lastTripId", id);
    setToast("Trip created! 🚀");
  };
 
  const deleteTrip = (id) => {
    remove(ref(db, `trips/${id}`));
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (currentTripId === id) {
      setCurrentTripId(null);
      setTripBills([]);
      setTripMembers([]);
      localStorage.removeItem("lastTripId");
    }
    setToast("Trip deleted");
  };
 
  const selectTrip = (id) => {
    setCurrentTripId(id);
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
    setSelectedBill((prev) => (prev?.id === billId ? { ...prev, status: "Finished" } : prev));
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
      case "addexpense":      return <AddExpense {...p} addExpense={addExpense} addMember={addMember} removeMember={removeMember} />;
      case "editexpense":     return <EditExpense {...p} editingExpense={editingExpense} updateExpense={updateExpense} />;
      case "receipt":         return <Bills {...p} setSelectedBill={setSelectedBill} />;
      case "billhistory":     return <BillHistory {...p} setSelectedBill={setSelectedBill} />;
      case "billdetail":      return <BillDetail {...p} selectedBill={selectedBill} markBillAsSettled={markBillAsSettled} />;
      case "settlement":      return <Settlement {...p} settleAllBills={settleAllBills} selectedBill={selectedBill} onSettleAndEarnPoints={addPoints} />;
      case "splitbill":       return <SplitBill setPage={setPage} tripBills={tripBills} tripMembers={tripMembers} setSelectedBill={setSelectedBill} />;
      case "splitcalculator": return <SplitCalculator setPage={setPage} selectedBill={selectedBill} />;
      case "profile":         return <Profile setPage={setPage} userProfile={userProfile} setUserProfile={setUserProfile} />;
      case "trophy":
      case "leaderboard":     return <Leaderboard setPage={setPage} userPoints={userPoints} userProfile={userProfile} />;
      case "mypoints":        return <MyPoints setPage={setPage} userPoints={userPoints} />;
      case "rewardslist":     return <Rewards setPage={setPage} userPoints={userPoints} onRedeem={spendPoints} />;
      case "yourredeem":      return <YourRedeem setPage={setPage} />;
      case "pay":             return <Pay setPage={setPage} pointsEarned={userPoints} />;
      case "exportsummary":   return <ExportSummary setPage={setPage} tripBills={tripBills} tripMembers={tripMembers} userProfile={userProfile} />;
      case "thankyou":        return <ThankYou setPage={setPage} userProfile={userProfile} pointsEarned={userPoints} />;
      default:                return null;
    }
  };
 
  return (
    <div className="app-bg">
      {showLanding ? (
        <LandingPage onEnter={() => setShowLanding(false)} />
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