import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react"; // QR Code Generator
import JsBarcode from "jsbarcode"; // Barcode Generator
import html2canvas from "html2canvas"; // Convert to Image
import "./Membership.css";
import Select from "react-select";


const Membership = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [membershipCard, setMembershipCard] = useState(null);
  const cardRef1 = useRef(null);
  const cardRef2 = useRef(null);

  // Fetch customers from the backend
  useEffect(() => {
    axios.get("http://localhost:5000/api/customers")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Error fetching customers:", err));
  }, []);

  // Handle customer selection
  const handleCustomerSelect = (e) => {
    const customer = customers.find((c) => c._id === e.target.value);
    setSelectedCustomer(customer);
  };

  // Generate Membership Cards
  const generateCard = () => {
    if (!selectedCustomer) {
      alert("Please select a customer first!");
      return;
    }

    // Generate Barcode
    setTimeout(() => {
      JsBarcode("#barcode1", selectedCustomer.customerId, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 50,
        displayValue: true,
      });

      JsBarcode("#barcode2", selectedCustomer.customerId, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 50,
        displayValue: true,
      });
    }, 200);

    setMembershipCard(selectedCustomer);
  };

  // Download Membership Card as Image
  const downloadCard = async () => {
    if (!membershipCard) return;

    const cardElements = [cardRef1.current, cardRef2.current];

    for (let i = 0; i < cardElements.length; i++) {
      const canvas = await html2canvas(cardElements[i]);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `membership_card_${i + 1}.png`;
      link.click();
    }
  };

  return (
    <div className="container-fluid mt-4">
      <h2>Membership Management</h2>

      <div className="header-container justify-content-between">      
        {/* Customer Selection */}
        <div className="select-customer-container">
          <label>Select Customer</label>
          <Select
            options={customers.map((customer) => ({
              value: customer._id,
              label: `${customer.name} - ${customer.phone}`,
            }))}
            onChange={(selectedOption) => {
              const customer = customers.find((c) => c._id === selectedOption.value);
              setSelectedCustomer(customer);
            }}
            placeholder="Select a customer"
            isClearable
          />
        </div>


        {/* Generate Card Button */}
        <button className="btn btn-dark mt-3" onClick={generateCard}>
          Generate Membership Card
        </button>
      </div>

      {/* Membership Cards UI */}
      {membershipCard && (
        <div className="card-container">
          <div className="membership-card-container">
            {/* Membership Card 1 */}
            <div className="membership-card dark" ref={cardRef1}>
              <div className="card-logo"></div>
              <h4>{membershipCard.name}</h4>
              <p>Customer ID: {membershipCard.customerId}</p>
              <svg id="barcode1"></svg>
              <div className="qr-code-container"><QRCodeCanvas value={membershipCard.customerId} size={80} /></div>
              <p className="membership-footer">Thank you for being a valued member!</p>
            </div>

            {/* Membership Card 2 */}
            <div className="membership-card light" ref={cardRef2}>
              <div className="card-logo"></div>
              <h4>{membershipCard.name}</h4>
              <p>Customer ID: {membershipCard.customerId}</p>
              <svg id="barcode2"></svg>
              <div className="qr-code-container"><QRCodeCanvas value={membershipCard.customerId} size={80} /></div>
              <p className="membership-footer">Thank you for being a valued member!</p>
            </div>
          </div>

          {/* Download Button */}
          <button className="btn btn-dark mt-3" onClick={downloadCard}>
            Download Membership Cards
          </button>
        </div>
      )}
    </div>
  );
};

export default Membership;
