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
import { ref, onValue, set } from "firebase/database";
 
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
  const [tripMembers, setTripMembers] = useState(["NongTaeyoung", "Malikab", "Ariya"]);
  const [page, setPage] = useState("splash");
  const [toast, setToast] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [tripBills, setTripBills] = useState([]);
  const [trips, setTrips] = useState([]);
 
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
 
  // ── Firebase listeners (โหลดข้อมูลจาก Firebase real-time) ──
  useEffect(() => {
    const unsub = onValue(ref(db, "tripBills"), (snap) => {
      const data = snap.val();
      setTripBills(data ? Object.values(data).map(normalizeBill) : [
        { id: 1, name: "Lunch at Fuji", amount: 1250, paidBy: "NongTaeyoung", pax: 4, category: "Food", date: "10/11/2024", status: "Pending", sharedBy: ["NongTaeyoung", "Malikab", "Ariya", "Johnny"] },
        { id: 2, name: "Concert Ticket", amount: 6900, paidBy: "Malikab", pax: 3, category: "Ticket", date: "09/11/2024", status: "Pending", sharedBy: ["NongTaeyoung", "Malikab", "Ariya"] },
        { id: 3, name: "Grab", amount: 250, paidBy: "Malikab", pax: 3, category: "Transport", date: "25/05/2024", status: "Pending", sharedBy: ["NongTaeyoung", "Malikab", "Ariya"] },
      ].map(normalizeBill));
    });
    return () => unsub();
  }, []);
 
  useEffect(() => {
    const unsub = onValue(ref(db, "trips"), (snap) => {
      const data = snap.val();
      setTrips(data ? Object.values(data) : [{ id: 1, title: "NCT127 Bangkok Concert", members: 3, total: "8150" }]);
    });
    return () => unsub();
  }, []);
 
  useEffect(() => {
    const unsub = onValue(ref(db, "tripMembers"), (snap) => {
      const data = snap.val();
      if (data) setTripMembers(data);
    });
    return () => unsub();
  }, []);
 
  useEffect(() => {
    const unsub = onValue(ref(db, "userPoints"), (snap) => {
      const data = snap.val();
      if (data !== null) setUserPoints(Number(data) || 0);
    });
    return () => unsub();
  }, []);
 
  // ── Firebase writers (บันทึกเมื่อข้อมูลเปลี่ยน) ──
  useEffect(() => {
    if (tripBills.length === 0) return;
    const obj = {};
    tripBills.forEach((b) => { obj[b.id] = b; });
    set(ref(db, "tripBills"), obj);
  }, [tripBills]);
 
  useEffect(() => {
    if (trips.length === 0) return;
    const obj = {};
    trips.forEach((t) => { obj[t.id] = t; });
    set(ref(db, "trips"), obj);
  }, [trips]);
 
  useEffect(() => {
    if (tripMembers.length === 0) return;
    set(ref(db, "tripMembers"), tripMembers);
  }, [tripMembers]);
 
  // userProfile ยังเก็บใน localStorage (ข้อมูลส่วนตัว ไม่ต้อง sync)
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
 
  // ── Expense actions ──
  const addExpense = (newExpense) => {
    const sharedBy = newExpense.sharedBy?.length > 0 ? newExpense.sharedBy : tripMembers;
    setTripBills((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newExpense.name || "Untitled Expense",
        amount: Number(newExpense.amount) || 0,
        paidBy: newExpense.paidBy || tripMembers[0],
        pax: sharedBy.length,
        category: newExpense.category || "Other",
        date: newExpense.date || new Date().toLocaleDateString("en-GB"),
        status: "Pending",
        sharedBy,
      },
    ]);
    addPoints(5);
    setToast("Expense added ✓ +5 pts");
  };
 
  const markBillAsSettled = (billId) => {
    setTripBills((prev) => prev.map((b) => (b.id === billId ? { ...b, status: "Finished" } : b)));
    setSelectedBill((prev) => (prev?.id === billId ? { ...prev, status: "Finished" } : prev));
    setToast("Bill settled ✅");
  };
 
  const deleteExpense = (id) => {
    setTripBills((prev) => prev.filter((b) => b.id !== id));
    setToast("Expense deleted");
  };
 
  const startEditExpense = (expense) => {
    setEditingExpense(expense);
    setPage("editexpense");
  };
 
  const updateExpense = (updated) => {
    setTripBills((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setToast("Expense updated ✓");
    setEditingExpense(null);
    setPage("tripdetail");
  };
 
  const settleAllBills = () => {
    setTripBills((prev) => prev.map((b) => ({ ...b, status: "Finished" })));
    setSelectedBill(null);
  };
 
  // ── Member actions ──
  const addMember = (name) => {
    const trimmed = name.trim();
    if (!trimmed || tripMembers.includes(trimmed)) return;
    setTripMembers((prev) => [...prev, trimmed]);
  };
 
  const removeMember = (name) => {
    setTripMembers((prev) => prev.filter((m) => m !== name));
  };
 
  // ── Trip actions ──
  const addTrip = (newTrip) => {
    setTrips((prev) => [...prev, { id: Date.now(), ...newTrip }]);
  };
 
  const deleteTrip = (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setToast("Trip deleted");
  };
 
  // ── Router ──
  const renderPage = () => {
    const p = { setPage, tripBills, tripMembers };
    switch (page) {
      case "splash":          return <Splash setPage={setPage} />;
      case "home":            return <Home {...p} userProfile={userProfile} trips={trips} deleteTrip={deleteTrip} />;
      case "create":          return <CreateTrip setPage={setPage} addTrip={addTrip} />;
      case "tripdetail":      return <TripDetail {...p} deleteExpense={deleteExpense} startEditExpense={startEditExpense} deleteTrip={deleteTrip} trips={trips} />;
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