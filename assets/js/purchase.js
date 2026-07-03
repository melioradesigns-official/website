// -------------------- HELPERS --------------------
function safeStr(v) {
  return (v === undefined || v === null) ? "" : String(v).trim();
}

function decodeB64Safe(v) {
  try { return atob(safeStr(v)); } catch { return safeStr(v); }
}

function periodLabel(p) {
  const map = { "6": "6 Months" };
  return map[String(p)] || safeStr(p);
}

function nowTimestampIST() {
  // User timezone: Asia/Kolkata
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return fmt.format(d) + " IST";
}

function isValidEmail(email) {
  // pragmatic validation (avoids over-rejecting real emails)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function isValidIndiaPhone(phone) {
  // Accept: 10-digit mobile starting 6-9, or +91 / 91 prefix with optional spaces/dashes
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(normalized);
}

function normalizeIndiaPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
}

function openWhatsApp(message) {
  const phone = "917993003157"; // +91 7993003157
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function applyPackageSelectionFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const packageParam = safeStr(params.get("package")).toLowerCase();
  const periodParam = safeStr(params.get("period"));
  const packageSelect = document.getElementById("package");
  const periodSelect = document.getElementById("period");

  const packageValues = {
    bronze: "YnJvbnpl",
    silver: "c2lsdmVy",
    gold: "Z29sZA==",
  };

  if (packageSelect && packageValues[packageParam]) {
    packageSelect.value = packageValues[packageParam];
  }

  if (periodSelect && periodParam) {
    periodSelect.value = periodParam;
  }
}

applyPackageSelectionFromQuery();

// -------------------- FORM SUBMIT --------------------
document.getElementById("purchasePackageForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const companyName = safeStr(formData.get("companyName"));
  const email = safeStr(formData.get("email"));
  const contactNumberRaw = safeStr(formData.get("contactNumber"));
  const city = safeStr(formData.get("address"));
  const pkgEncoded = safeStr(formData.get("package"));
  const periodValue = safeStr(formData.get("period"));

  // -------------------- VALIDATION --------------------
  // Email
  if (!email || !isValidEmail(email)) {
    alert("Please enter a valid email address.");
    document.getElementById("email")?.focus();
    return;
  }

  // Phone (India)
  if (!contactNumberRaw || !isValidIndiaPhone(contactNumberRaw)) {
    alert("Please enter a valid 10-digit Indian mobile number (starting with 6–9).");
    document.getElementById("contactNumber")?.focus();
    return;
  }

  const contactNumber = normalizeIndiaPhone(contactNumberRaw);

  // -------------------- PACKAGE DECODE --------------------
  const pkgDecoded = decodeB64Safe(pkgEncoded);
  const pkgPretty =
    pkgDecoded.toLowerCase() === "bronze" ? "Bronze Package" :
    pkgDecoded.toLowerCase() === "silver" ? "Silver Package" :
    pkgDecoded.toLowerCase() === "gold" ? "Gold Package" :
    pkgDecoded;

  const periodPretty = periodLabel(periodValue);
  const timestamp = nowTimestampIST();

  // -------------------- MESSAGE --------------------
  const message =
`New Purchase Enquiry (Website)
Time: ${timestamp}

Package: ${pkgPretty || "N/A"}
Period: ${periodPretty || "N/A"}

Company Name: ${companyName || "N/A"}
Phone Number: ${contactNumber || "N/A"}
Email: ${email || "N/A"}
City: ${city || "N/A"}

Please contact the customer for next steps.`;

  // -------------------- OPEN WHATSAPP --------------------
  openWhatsApp(message);

  // -------------------- AUTO RESET --------------------
  // Reset after opening WhatsApp (small delay avoids edge-case where some browsers block on immediate reset)
  setTimeout(() => {
    form.reset();
    // Optional: also reset selects to defaults if needed (reset usually handles it)
    // document.getElementById("package").value = "YnJvbnpl";
    // document.getElementById("period").value = "1";
  }, 300);
});

// ===================== RAZORPAY (INTENTIONALLY REMOVED) =====================
// WhatsApp-only flow


/*

const encodedParams = atob(window.location.href.split('?')[1]);
console.log(encodedParams);
const urlParams = new URLSearchParams(encodedParams);
var package = urlParams.get('package');
var plan = urlParams.get('plan');
console.log(package,plan)

if(package && plan){
  document.getElementById('package').value = btoa(package)
  document.getElementById('period').value = plan
}

document.getElementById("purchasePackageForm").addEventListener("submit", async function(e) {
   e.preventDefault();
   console.log("Signup Form submitted");

   const formData = new FormData(e.target);
   formData.append('package', document.getElementById('package').value)
   formData.append('period', document.getElementById('period').value)
   const formDataObject = {};

   formData.forEach((value, key) => {
       formDataObject[key] = value;
   });

   console.log(formDataObject); 
   const response = await fetch('/public/api/purchasePlan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formDataObject)
    }).then((res) => res.json())
    console.log(response);
    if(response.data){
        console.log(response.data)
        let data = response.data
        // Razorpay Logic
        sessionStorage.setItem('b3JkZXJfaWQ',data.order_id);
        var options = {
          key: data.key,
          order_id: data.order_id,
          amount: data.amount,
          name: data.companyName,
          image: data.image,
          description: data.description,
          handler: function(response) {
            handleRazorpayResponse(response);
          }
        };
    
        var rzp = new Razorpay(options);
        rzp.open();

    } else {
            console.log(response.error)
            alert(response.error)
    } 

  /* const createOrder = await fetch("api/create-razorpay-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount: 10000 }) 
    })
    .then(response => response.json())
    .then(data => {
      
      sessionStorage.setItem('b3JkZXJfaWQ',data.order_id);
      var options = {
        key: data.key,
        order_id: data.order_id,
        amount: data.amount,
        name: "Chaturvedh IT Solutions",
        image: "../images/favicon/cis-favicon.png",
        description: "Chaturvedh IT solutions Product Description",
        handler: function(response) {
          handleRazorpayResponse(response);
        }
      };
  
      var rzp = new Razorpay(options);
      rzp.open();
    })
    .catch(error => {
      console.error("Error:", error);
      sessionStorage.removeItem("b3JkZXJfaWQ");
    });

    
 
  });
  
  // Define the handler function
  var handleRazorpayResponse = function(response) {
    // Response contains payment-related information
    var paymentId = response.razorpay_payment_id;
    var orderId = response.razorpay_order_id;
    var signature = response.razorpay_signature;
    
    // You can send this information to your server for verification and order processing
    // Example: Call your server API to verify the payment and process the order
    fetch('/public/api/payment/verifyPayment-and-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment_id: paymentId,
        order_id: sessionStorage.getItem('b3JkZXJfaWQ'),
        signature: signature
      })
    })
    .then(function(response) {
      sessionStorage.removeItem("b3JkZXJfaWQ");
  
      return response.json();
    })
    .then(function(data) {
      if (data.response) {
        // Payment is verified and order is processed
        // Remove the order ID from session storage
        console.log(data.response)
        alert('Payment successful! Order confirmed.');
      } else {
        // Payment verification failed
        alert('Payment verification failed. Please try again or contact support.');
      }
    })
    .catch(function(error) {
      console.error('Error verifying payment:', error);
     // alert('An error occurred while verifying the payment.');
     sessionStorage.removeItem("order_id");
    });
  };


  */
