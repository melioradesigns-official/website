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

    */
 
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