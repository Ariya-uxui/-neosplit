import "./App.css";
import React, { useState, useEffect } from "react";
import Home from "./screens/home";         // ✅ lowercase — ตรงกับ home.js
import CreateTrip from "./screens/createtrip";
import TripDetail from "./screens/tripdetail";
import Bills from "./screens/bills";
import BillHistory from "./screens/billhistory";
import Rewards from "./screens/rewards";
import Profile from "./screens/profile";
import Navbar from "./components/Navbar";     // ✅ Navbar.js — uppercase N
import Settlement from "./screens/settlement";
import Pay from "./screens/pay";
import ThankYou from "./screens/thankyou";
import AddExpense from "./screens/addexpense";
import Leaderboard from "./screens/leaderboard";
import MyPoints from "./screens/mypoints";
import YourRedeem from "./screens/YourRedeem";
import SplitBill from "./screens/splitbill";
import SplitCalculator from "./screens/splitcalculator";
import Splash from "./screens/Splash";        // ✅ Splash.js — uppercase S
import EditExpense from "./screens/editexpense";
import BillDetail from "./screens/billdetail";


const normalizeBill = (bill) => {
  const sharedBy = Array.isArray(bill.sharedBy) ? bill.sharedBy : [];
  const peopleCount =
    sharedBy.length || Number(bill.pax) || Number(bill.people) || 1;

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
  const tripMembers = ["NongTaeyoung", "Malikab", "Ariya"];

  const [page, setPage] = useState("splash");
  const [toast, setToast] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);

  const [tripBills, setTripBills] = useState(() => {
    const savedBills = localStorage.getItem("tripBills");
    const initialBills = savedBills
      ? JSON.parse(savedBills)
      : [
          {
            id: 1,
            name: "Lunch at Fuji",
            amount: 1250,
            paidBy: "NongTaeyoung",
            pax: 4,
            category: "Food",
            date: "10/11/2024",
            status: "Pending",
            sharedBy: ["NongTaeyoung", "Malikab", "Ariya", "Johnny"],
          },
          {
            id: 2,
            name: "Concert Ticket",
            amount: 6900,
            paidBy: "Malikab",
            pax: 3,
            category: "Ticket",
            date: "09/11/2024",
            status: "Pending",
            sharedBy: ["NongTaeyoung", "Malikab", "Ariya"],
          },
          {
            id: 3,
            name: "Grab",
            amount: 250,
            paidBy: "Malikab",
            pax: 3,
            category: "Transport",
            date: "25/05/2024",
            status: "Pending",
            sharedBy: ["NongTaeyoung", "Malikab", "Ariya"],
          },
        ];
    return initialBills.map(normalizeBill);
  });

  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem("neosplitProfile");
    return savedProfile
      ? JSON.parse(savedProfile)
      : {
          name: "NongTaeyoung",
          selectedBias: "Taeyong",
          profileImage:
            "https://i.pinimg.com/736x/0b/11/d4/0b11d44290e5c34a8ebf40c4d58bde8f.jpg",
        };
  });

  const [trips, setTrips] = useState(() => {
    const savedTrips = localStorage.getItem("trips");
    return savedTrips
      ? JSON.parse(savedTrips)
      : [
          {
            id: 1,
            title: "NCT127 Bangkok Concert",
            members: 3,
            total: "8150",
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem("neosplitProfile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("tripBills", JSON.stringify(tripBills));
  }, [tripBills]);

  useEffect(() => {
    localStorage.setItem("trips", JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  const addExpense = (newExpense) => {
    const sharedBy =
      newExpense.sharedBy && newExpense.sharedBy.length > 0
        ? newExpense.sharedBy
        : tripMembers;

    const normalizedExpense = {
      id: Date.now(),
      name: newExpense.name || "Untitled Expense",
      amount: Number(newExpense.amount) || 0,
      paidBy: newExpense.paidBy || tripMembers[0],
      pax: sharedBy.length,
      category: newExpense.category || "Other",
      date: newExpense.date || new Date().toLocaleDateString("en-GB"),
      status: "Pending",
      sharedBy: sharedBy,
    };

    setTripBills((prev) => [...prev, normalizedExpense]);
    setToast("Expense added successfully");
  };

  const markBillAsSettled = (billId) => {
    setTripBills((prev) =>
      prev.map((bill) =>
        bill.id === billId ? { ...bill, status: "Finished" } : bill
      )
    );
    setSelectedBill((prev) =>
      prev && prev.id === billId ? { ...prev, status: "Finished" } : prev
    );
    setToast("Bill marked as settled");
  };

  const deleteExpense = (id) => {
    setTripBills((prev) => prev.filter((bill) => bill.id !== id));
    setToast("Expense deleted");
  };

  const startEditExpense = (expense) => {
    setEditingExpense(expense);
    setPage("editexpense");
  };

  const updateExpense = (updatedExpense) => {
    setTripBills((prev) =>
      prev.map((bill) =>
        bill.id === updatedExpense.id ? updatedExpense : bill
      )
    );
    setToast("Expense updated");
    setEditingExpense(null);
    setPage("tripdetail");
  };

  const addTrip = (newTrip) => {
    setTrips((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...newTrip,
      },
    ]);
  };

  const settleAllBills = () => {
    setTripBills((prev) =>
      prev.map((bill) => ({ ...bill, status: "Finished" }))
    );
    setSelectedBill(null);
    setToast("All bills settled 🎉");
  };

  const renderPage = () => {
    if (page === "splash") return <Splash setPage={setPage} />;

    if (page === "home") {
      return (
        <Home
          setPage={setPage}
          tripBills={tripBills}
          tripMembers={tripMembers}
          userProfile={userProfile}
          trips={trips}
        />
      );
    }

    if (page === "create") {
      return <CreateTrip setPage={setPage} addTrip={addTrip} />;
    }

    if (page === "tripdetail") {
      return (
        <TripDetail
          setPage={setPage}
          tripBills={tripBills}
          deleteExpense={deleteExpense}
          startEditExpense={startEditExpense}
        />
      );
    }

    if (page === "addexpense") {
      return (
        <AddExpense
          setPage={setPage}
          addExpense={addExpense}
          tripMembers={tripMembers}
        />
      );
    }

    if (page === "editexpense") {
      return (
        <EditExpense
          setPage={setPage}
          editingExpense={editingExpense}
          updateExpense={updateExpense}
          tripMembers={tripMembers}
        />
      );
    }

    if (page === "receipt") {
      return (
        <Bills
          setPage={setPage}
          tripBills={tripBills}
          setSelectedBill={setSelectedBill}
          userProfile={userProfile}
        />
      );
    }

    if (page === "billhistory") {
      return (
        <BillHistory
          setPage={setPage}
          tripBills={tripBills}
          setSelectedBill={setSelectedBill}
        />
      );
    }

    if (page === "billdetail") {
      return (
        <BillDetail
          setPage={setPage}
          selectedBill={selectedBill}
          markBillAsSettled={markBillAsSettled}
        />
      );
    }

    if (page === "settlement") {
      return (
        <Settlement
          setPage={setPage}
          tripBills={tripBills}
          tripMembers={tripMembers}
          settleAllBills={settleAllBills}
          selectedBill={selectedBill}
        />
      );
    }

    if (page === "splitbill") {
      return <SplitBill setPage={setPage} tripBills={tripBills} />;
    }

    if (page === "splitcalculator") {
      return (
        <SplitCalculator
          setPage={setPage}
          selectedBill={selectedBill}
        />
      );
    }

    if (page === "profile") {
      return (
        <Profile
          setPage={setPage}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
        />
      );
    }

    if (page === "trophy")      return <Leaderboard setPage={setPage} />;
    if (page === "leaderboard") return <Leaderboard setPage={setPage} />;
    if (page === "mypoints")    return <MyPoints setPage={setPage} />;
    if (page === "rewardslist") return <Rewards setPage={setPage} />;
    if (page === "yourredeem")  return <YourRedeem setPage={setPage} />;
    if (page === "pay")         return <Pay setPage={setPage} />;
    if (page === "thankyou")    return <ThankYou setPage={setPage} />;

    return null;
  };

  return (
    <div className="app-bg">
      <div className="phone-shell">
        <div className="phone-frame">
          <div className="phone-notch" />
          {renderPage()}
          {toast && <div className="toast">{toast}</div>}
          {page !== "splash" && <Navbar setPage={setPage} page={page} />}
        </div>
      </div>
    </div>
  );
}

export default App;
