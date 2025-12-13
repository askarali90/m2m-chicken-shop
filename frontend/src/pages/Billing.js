import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, CardText } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import Select from "react-select";
import "./Billing.css";

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [tenderedAmount, setTenderedAmount] = useState(0);
  const [change, setChange] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [useRedeemablePoints, setUseRedeemablePoints] = useState(false);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [tokenNumber, setTokenNumber] = useState(1);
  const [modeOfPayment, setModeOfPayment] = useState("Cash"); // default to "Cash"
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    phone: "",
    email: "",
    address: "",
  });

  
  const quickAddItems = [
    { name: '500gm WS', product: 'Chicken W Skin', qty: 0.5 },
    { name: '1kg WS', product: 'Chicken W Skin', qty: 1 },
    { name: '1.5kg WS', product: 'Chicken W Skin', qty: 1.5 },
    { name: '2kg WS', product: 'Chicken W Skin', qty: 2 },
    { name: '3kg WS', product: 'Chicken W Skin', qty: 3 },
    { name: '5kg WS', product: 'Chicken W Skin', qty: 5 },
    { name: '500gm WOS', product: 'Chicken W/O Skin', qty: 0.5 },
    { name: '1kg WOS', product: 'Chicken W/O Skin', qty: 1 },
    { name: '1.5kg WOS', product: 'Chicken W/O Skin', qty: 1.5 },
    { name: '2kg WOS', product: 'Chicken W/O Skin', qty: 2 },
    { name: '3kg WOS', product: 'Chicken W/O Skin', qty: 3 },
    { name: '5kg WOS', product: 'Chicken W/O Skin', qty: 5 },
  ];

  // Fetch products from DB
  useEffect(() => {
    axios.get("http://localhost:5000/api/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  // Fetch customers from DB
  useEffect(() => {
    axios.get("http://localhost:5000/api/customers")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Error fetching customers:", err));
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/customers");
      setCustomers(res.data);
    } catch (err) {
      console.error("Error fetching customers", err);
    }
  };

  useEffect(() => {
    let discount = 0;
    if (useRedeemablePoints && selectedCustomer) {
      discount = Math.min(selectedCustomer.redeemablePoints, totalAmount * 0.5);
      setRedeemedPoints(discount);
    } else {
      setRedeemedPoints(0);
    }
    setFinalAmount(totalAmount - discount);
  }, [useRedeemablePoints, selectedCustomer, totalAmount]);

  useEffect(() => {
    const today = new Date().toDateString();
    const savedTokenData = localStorage.getItem("tokenData");
    if (savedTokenData) {
      const { date, number } = JSON.parse(savedTokenData);
      if (date === today) {
        setTokenNumber(number + 1);
      } else {
        setTokenNumber(1);
      }
    }
  }, []);

  const updateTokenNumber = () => {
    const today = new Date().toDateString();
    setTokenNumber((prevToken) => {
      const newToken = prevToken + 1;
      localStorage.setItem("tokenData", JSON.stringify({ date: today, number: newToken }));
      return newToken;
    });
  };


  // Handle adding products to the cart
  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    const total = selectedProduct.price * quantity;
    setCart([...cart, { ...selectedProduct, quantity, kgs: quantity, total }]);
    setTotalAmount((prevTotal) => prevTotal + total);

    // Reset selection for the next product
    setSelectedProduct(null);
    document.getElementById("productDropdown").value = "";
    setQuantity(1);
  };

  const handleQuantityChange = (index, value) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item, i) => 
        i === index ? { ...item, quantity: value, kgs: value, total: item.price * value } : item
      );
      const newTotal = updatedCart.reduce((acc, item) => acc + item.total, 0);
      setTotalAmount(newTotal);
      return updatedCart;
    });
  };


  const handleQuickAdd = (productName, qty) => {
    const product = products.find(p => p.name === productName);
    if (product) {
        setSelectedProduct(product);
        setQuantity(qty);
        const total = product.price * qty;
        setCart(prevCart => [
          ...prevCart, 
          { ...product, quantity: qty,kgs: qty, total }
        ]);
        setTotalAmount((prevTotal) => prevTotal + total);
    }
  };

  // Handle removing an item from cart
  const handleRemoveItem = (id) => {
    const updatedCart = cart.filter((item) => item._id !== id);
    const newTotal = updatedCart.reduce((acc, item) => acc + item.total, 0);
    setCart(updatedCart);
    setTotalAmount(newTotal);
  };

  // Handle customer selection
  const handleCustomerSelect = (selectedOption) => {
    const customer = customers.find((c) => c.customerId === selectedOption.value.customerId);
    setSelectedCustomer(customer);
  };

  // Handle product selection
  const handleProductSelect = (selectedOption) => {
    const product = products.find((p) => p.productId === selectedOption.value.productId);
    setSelectedProduct(product);
  };

  // Handle checkout process
  const handleCheckout = () => {
    if (!selectedCustomer) {
      alert("Please select a customer before checkout.");
      return;
    }

    setShowModal(true);
  };

  // Handle tendered amount change
  // const handleTenderedAmountChange = (e) => {
  //   const amount = parseFloat(e.target.value) || 0;
  //   setTenderedAmount(amount);
  //   setChange(amount - finalAmount);
  // };
  const handleTenderedAmountChange = (e) => {
    let amount = e.target.value;
  
    // Allow empty input (backspace support)
    if (amount === "") {
      setTenderedAmount("");
      setChange(0);
      return;
    }
  
    // Convert to float only if valid number
    if (!isNaN(amount) && parseFloat(amount) >= 0) {
      setTenderedAmount(parseFloat(amount));
      setChange(parseFloat(amount) - finalAmount);
    }
  };
  

  // Final checkout process
  const processCheckout = async () => {
    if (!selectedCustomer) {
      alert("Please select a customer.");
      return;
    }

    const amountTendered = parseFloat(tenderedAmount) || 0;

    // allow zero tendered amount when modeOfPayment is Credit
    if (modeOfPayment !== "Credit" && amountTendered < finalAmount) {
      alert("Tendered amount cannot be less than the total amount!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/checkout", {
        customerId: selectedCustomer.phone,  // ✅ Send phone number as customerId
        totalAmount,
        cart,
        finalAmount,
        redeemedPoints,
        modeOfPayment,
        tenderedAmount: amountTendered
      });

      // ✅ Print Bill after checkout
      printBill(selectedCustomer, cart, totalAmount, amountTendered, change, tokenNumber);
      updateTokenNumber();

      setCart([]);
      setShowModal(false);
      setTotalAmount(0);
      setTenderedAmount(0);
      setChange(0);
      setSelectedCustomer(null);
      document.getElementById("productDropdown").value = "";
      document.getElementById("customerDropdown").value = "";
      setSelectedProduct(null);
      setUseRedeemablePoints(false);
      setRedeemedPoints(0);
      setFinalAmount(0);
    } catch (error) {
      console.error("Error processing checkout:", error);
      alert(error.response?.data?.message || "Checkout failed!");
    }
  };

  const printBill = (customer, cart, totalAmount, tenderedAmount, change, tokenNumber) => {
    const billContent = `
      <div style="font-family: Arial, sans-serif; width: 200px;">
        <h3 style="text-align: center; margin:0px; padding: 0px;">M2M Chicken Shop</h3>
        <h6 style="text-align: center; margin:0px; padding: 0px;">206A, Cutchery Street,</h6>
        <h6 style="text-align: center; margin:0px; padding: 0px;">Gobi - 638452.</h6>
        <h6 style="text-align: center; margin:0px; padding: 0px;">Ph: 9942733472/9791533472</h6>
        <h5 style="text-align: center;">Bill Estimate</h5>
        <p>${new Date().toLocaleString()}</p>
        <p>Name: ${customer.name}</p>
        <hr>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="">
              <th style="text-align: center; border-bottom: 1px solid #707070;">Qty</th>
              <th style="text-align: left; border-bottom: 1px solid #707070;">Items</th>

              <th style="text-align: right; border-bottom: 1px solid #707070;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${cart
              .map(
                (item) => `
              <tr>
                <td>${item.name} x ${item.price}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${item.total.toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <hr>
        <p><strong>Total:</strong>  <span style="text-align: right; float: right;" >₹ ${totalAmount.toFixed(2)}</span> </p>
        <p><strong>Tendered:</strong> <span style="text-align: right; float: right;" >₹ ${tenderedAmount.toFixed(2)}</span></p>
        <p><strong>Change:</strong> <span style="text-align: right; float: right;" >₹ ${change.toFixed(2)}</span></p>
        <hr>
        <h2 style="text-align: center;">Token #:M2M-${tokenNumber}</h3>
      </div>
    `;

    const printWindow = window.open("", "", "width=300,height=600");
    printWindow.document.write(billContent);
    printWindow.document.close();
    printWindow.print();
    setTimeout(() => printWindow.close(), 500);
  };

  const handleShowCustomerModal = (customer = null) => {
    setFormData(
      customer || {
        name: "",
        dob: "",
        phone: "",
        email: "",
        address: "",
      }
    );
    setShowCustomerModal(true);
  };

  const handleCloseCustomerModal = () => {
    setShowCustomerModal(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

   const validatePhoneNumber = (phone) => {
    return /^[6789]\d{9}$/.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Name and Phone Number are required!");
      return;
    }
    if (!validatePhoneNumber(formData.phone)) {
      alert("Invalid phone number! Enter a valid 10-digit Indian mobile number.");
      return;
    }

    const customerData = {
      ...formData,
      customerId: formData.phone, // Set customerId as phone number
    };

    try {
      await axios.post("http://localhost:5000/api/customers", customerData);
      fetchCustomers();
      handleCloseCustomerModal();
    } catch (err) {
      alert("Error Saving Customer. please check the customer is already saved!");
      console.error("Error saving customer", err);
    }
  };

  return (
    <div className="container-fluid mt-4">
      <h2 className="text-center">Billing POS</h2>
      <div className="billing-pos-container">
        <div className="product-section">
          <div className="mt-3">
            <a href="#" className="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover float-end" onClick={() => handleShowCustomerModal()}>Add Customer</a>
          <label>Select Customer</label>
          <Select
            options={customers.map(customer => ({
              value: customer,
              label: `${customer.name} - ${customer.phone}`
            }))}
            onChange={handleCustomerSelect}
            isSearchable
            placeholder="Search or Select Customer"
            id="customerDropdown"
          />
          
          
        </div>
        {selectedCustomer && (
          <div className="redeem-points-container">
            <h6 style={{textAlign: 'right', padding: '10px 0px'}}>Redeemable Points: {selectedCustomer.redeemablePoints.toFixed(2)}</h6>
            <Form.Check // prettier-ignore
              type="switch"
              reverse
              id="custom-switch"
              label="Use Redeemable Points"
              onChange={() => setUseRedeemablePoints(!useRedeemablePoints)}
              checked={useRedeemablePoints}
            />
          </div>
        )}

        {/* Product Selection */}
        <div className="mt-3">
          <label>Find Product</label>
          <Select
            options={products.map(product => ({
              value: product,
              label: `${product.name} - ₹${product.price}`,
              price: product.price
            }))}
            onChange={handleProductSelect}
            isSearchable
            placeholder="Search or Select Product"
            id="productDropdown"
          />
        </div>

          <div className="quick-select-container">
            {quickAddItems.map((item, index) => (
              <Button key={index} onClick={() => handleQuickAdd(item.product, item.qty)} className={item.name.includes('WS') ? 'with-skin-item' : 'without-skin-item'}>
                {item.name}
              </Button>
            ))}
          </div>

          {/* Selected Product Details */}
          {selectedProduct && (
            <div className="mt-3">
              <p><strong>Product:</strong> {selectedProduct.name}</p>
              <p><strong>Price:</strong> {selectedProduct.price}</p>
              <label>QTY</label>
              <input
                  type="number"
                  className="form-control"
                  step="0.01" // ✅ Allow decimal values
                  value={quantity}
                  onChange={(e) => {
                    let val = e.target.value;

                    // ✅ Allow empty input to support backspace
                    if (val === "") {
                      setQuantity("");
                    }
                    // ✅ Allow input like "0.25"
                    else if (/^\d*\.?\d*$/.test(val)) {
                      setQuantity(val);
                    }
                  }}
                  onBlur={() => {
                    if (quantity === "" || isNaN(quantity)) {
                      setQuantity(1); // ✅ Reset to 1 if left empty
                    } else {
                      setQuantity(parseFloat(quantity)); // ✅ Convert to float on blur
                    }
                  }}
                />


              <div className="text-center mt-3">
                <button className="btn btn-dark btn-lg" onClick={handleAddItem}>
                  + Add Item
                </button>
              </div>
            </div>
          )}

          {/* Total Amount & Checkout Button */}
          <h3 className="text-center total-amount-text">Total Amount: {totalAmount.toFixed(2)}</h3>
          <h3 className="text-center total-amount-text">Final Amount: ₹{finalAmount.toFixed(2)}</h3>
          <div className="checkout-container text-center mt-4">
            <button className="btn btn-dark btn-large px-5 py-3" onClick={handleCheckout}>
              Checkout
            </button>
          </div>
        </div>

        <div className="cart-section">
          {/* Cart Table */}
          <table className="table table-bordered mt-4">
            <thead className="table-dark">
              <tr>
                <th>QTY</th>
                <th>Product</th>
                <th>Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => (
                <tr key={index}>
                  <input
                      type="number"
                      value={item.quantity}
                      className="form-control cart-quantity"
                      step="0.01"
                      onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 1)}
                    />
                  <td>{item.name}</td>
                  <td>{item.price.toFixed(2)}</td>
                  <td>{item.total.toFixed(2)}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleRemoveItem(item._id)}>
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Checkout Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Checkout</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              <label>Total Amount</label>
              <input type="text" className="form-control" value={finalAmount.toFixed(2)} readOnly />
            </div>
            <div>
              <label>Tendered Amount</label>
              <input
                type="number"
                className="form-control"
                value={tenderedAmount}
                onChange={handleTenderedAmountChange}
              />
            </div>
            <div>
              <label>Change</label>
              <input type="text" className="form-control" value={change.toFixed(2)} readOnly />
            </div>
            <div className="mb-3">
              <label>Mode of Payment</label>
              <Form.Select
                value={modeOfPayment}
                onChange={(e) => setModeOfPayment(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Credit">Credit</option>
              </Form.Select>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={processCheckout}>Submit</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>

      {/* Modal for Adding/Editing Customers */}
      <Modal show={showCustomerModal} onHide={handleCloseCustomerModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date of Birth</Form.Label>
              <Form.Control type="date" name="dob" value={formData.dob} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone *</Form.Label>
              <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control type="text" name="address" value={formData.address} onChange={handleChange} />
            </Form.Group>
            <Button variant="primary" type="submit">
              Add Customer
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

    </div>
  );
};

export default Billing;
