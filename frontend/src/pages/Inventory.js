import React, { useState, useEffect } from "react";
import axios from "axios";

const Inventory = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  const [purchases, setPurchases] = useState([]);
  const [utilizations, setUtilizations] = useState([]);
  const [liveWeight, setLiveWeight] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [discount, setDiscount] = useState("");

  const [cleanedWeight, setCleanedWeight] = useState("");
  const [inventoryRecords, setInventoryRecords] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  const correctPassword = "M2M@2024";
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = inventoryRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(inventoryRecords.length / recordsPerPage)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("inventoryAuthenticated");
    if (isAuthenticated === "true") {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      axios.get("http://localhost:5000/api/inventory")
        .then(res => setInventoryRecords(res.data))
        .catch(err => console.error("Error fetching inventory records:", err));

        ;

    }
  }, [authenticated]);

  const handleLoadInventory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/inventory");
      setInventoryRecords(res.data);
      setShowTable(true);
      setCurrentPage(1); // reset to first page
    } catch (err) {
      console.error("Error fetching inventory records:", err);
    }
  };


  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (isUnlocking) return;

    if (passwordInput === correctPassword) {
      setIsUnlocking(true);
      setTimeout(() => {
        setAuthenticated(true);
        localStorage.setItem("inventoryAuthenticated", "true");
        setIsUnlocking(false);
      }, 1000);
    } else {
      alert("Incorrect Password");
      setPasswordInput("");
    }
  };

  const handleAddPurchase = () => {
    if (!liveWeight || !pricePerKg) return;
    const entry = {
      date: new Date().toISOString().split("T")[0],
      liveWeight: parseFloat(liveWeight),
      pricePerKg: parseFloat(pricePerKg),
      discount: parseFloat(discount || 0),
    };
    setPurchases([...purchases, entry]);
    setLiveWeight("");
    setPricePerKg("");
    setDiscount("");
  };

  const handleAddUtilization = () => {
    if (!cleanedWeight) return;
    const entry = {
      date: new Date().toISOString().split("T")[0],
      cleanedWeight: parseFloat(cleanedWeight),
    };
    setUtilizations([...utilizations, entry]);
    setCleanedWeight("");
  };

  const totalPurchased = purchases.reduce((sum, p) => sum + p.liveWeight, 0);
  const totalUtilized = utilizations.reduce((sum, u) => sum + u.cleanedWeight, 0);
  const remaining = totalPurchased - totalUtilized;

  const handleSaveInventory = async () => {
    try {
      await axios.post("http://localhost:5000/api/inventory/save", {
        date: new Date(),
        purchases,
        utilizations,
        totalPurchased,
        totalUtilized,
        remaining,
      });
      alert("Inventory saved successfully!");
    } catch (err) {
      console.error("Error saving inventory:", err);
      alert("Failed to save inventory.");
    }
  };

  if (!authenticated) {
    return (
      <div className="container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <h2>{isUnlocking ? "Unlocking..." : "Enter Password to Access Inventory"}</h2>
        {isUnlocking ? (
          <div className="spinner-border text-dark mt-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="mt-3" style={{ width: "300px" }}>
            <input
              type="password"
              className="form-control mb-2"
              placeholder="Enter Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-dark w-100">Unlock</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h2>Inventory Management</h2>
        <button className="btn btn-outline-danger" onClick={() => {
          setAuthenticated(false);
          localStorage.removeItem("inventoryAuthenticated");
        }}>
          Logout
        </button>
      </div>

      {/* Purchase Entry */}
      <div className="mt-4">
        <h4>Purchase Entry</h4>
        <div className="row g-2">
          <div className="col-md-3">
            <input type="number" className="form-control" placeholder="Live Weight (kg)" value={liveWeight} onChange={e => setLiveWeight(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input type="number" className="form-control" placeholder="Price per kg" value={pricePerKg} onChange={e => setPricePerKg(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input type="number" className="form-control" placeholder="Discount (%) per kg" value={discount} onChange={e => setDiscount(e.target.value)} />
          </div>
          <div className="col-md-3">
            <button className="btn btn-dark w-100" onClick={handleAddPurchase}>Add Purchase</button>
          </div>
        </div>

        <table className="table table-bordered table-striped mt-3">
          <thead className="table-dark">
            <tr>
              <th>Date</th>
              <th>Live Weight (kg)</th>
              <th>Price/kg</th>
              <th>Discount (%)</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p, i) => {
            const cost = (p.pricePerKg - p.discount) * p.liveWeight;
            
            return (
                <tr key={i}>
                <td>{p.date}</td>
                <td>{p.liveWeight}</td>
                <td>₹{p.pricePerKg}</td>
                <td>₹{p.discount}</td>
                <td>₹{cost.toFixed(2)}</td>
                </tr>
            );
            })}

          </tbody>
        </table>
      </div>

      {/* Utilization Entry */}
      <div className="mt-5">
        <h4>Utilization Entry</h4>
        <div className="row g-2">
          <div className="col-md-4">
            <input type="number" className="form-control" placeholder="Cleaned Weight (kg)" value={cleanedWeight} onChange={e => setCleanedWeight(e.target.value)} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-dark w-100" onClick={handleAddUtilization}>Add Utilization</button>
          </div>
        </div>

        <table className="table table-bordered mt-3">
          <thead className="table-dark">
            <tr>
              <th>Date</th>
              <th>Cleaned Weight (kg)</th>
            </tr>
          </thead>
          <tbody>
            {utilizations.map((u, i) => (
              <tr key={i}>
                <td>{u.date}</td>
                <td>{u.cleanedWeight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="alert alert-info mt-4">
        <h5>Total Purchased: {totalPurchased.toFixed(2)} kg</h5>
        <h5>Total Utilized: {totalUtilized.toFixed(2)} kg</h5>
        <h5>Remaining Stock: {remaining.toFixed(2)} kg</h5>
      </div>

      <div className="text-center mt-3">
        <button className="btn btn-success px-5 py-2" onClick={handleSaveInventory}>
          Save Inventory
        </button>
      </div>
{/* 
      <div className="mt-5">
         <button className="btn btn-success" onClick={handleLoadInventory}>
            Load Inventory Records
          </button>
      <h4>Saved Inventory Records</h4>
      <table className="table table-bordered table-striped">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Total Purchased (kg)</th>
            <th>Total Utilized (kg)</th>
            <th>Remaining (kg)</th>
          </tr>
        </thead>
        <tbody>
          {inventoryRecords.length > 0 ? (
            inventoryRecords.map((record, i) => (
              <tr key={i}>
                <td>{record.date}</td>
                <td>{record.totalPurchased.toFixed(2)}</td>
                <td>{record.totalUtilized.toFixed(2)}</td>
                <td>{record.remaining.toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">No inventory records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div> */}
    <div className="mt-4">
    <button className="btn btn-success" onClick={handleLoadInventory}>
      Load Inventory Records
    </button>

    {showTable && (
      <>
        <table className="table table-bordered table-striped mt-3">
          <thead className="table-dark">
            <tr>
              <th>Date</th>
              <th>Total Purchased (kg)</th>
              <th>Total Utilized (kg)</th>
              <th>Remaining (kg)</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((record, i) => (
              <tr key={i}>
                <td>{record.date}</td>
                <td>{record.totalPurchased.toFixed(2)}</td>
                <td>{record.totalUtilized.toFixed(2)}</td>
                <td>{record.remaining.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="d-flex justify-content-between align-items-center">
          <button
            className="btn btn-outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            className="btn btn-outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </>
    )}
  </div>

    </div>
  );
};

export default Inventory;
