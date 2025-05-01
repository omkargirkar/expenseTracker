//index.js

const token = localStorage.getItem("token");

// const cashfree = Cashfree({
//     mode: "sandbox"
// });

function handleAddExpense(event) {
    event.preventDefault();
    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;

    const expense = { amount, description, category };

    fetch('/expense/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
         },
        body: JSON.stringify(expense)
    })
        .then(res => res.json())
        .then(data => displayOnScreen(data))
        .catch(err => console.log(err));

    event.target.reset();
}

window.addEventListener("DOMContentLoaded", () => {
  //Check premium status
  fetch("/user/status", {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.isPremium) {
        document.getElementById("premiumMessage").textContent = "You are a premium user now";
        document.getElementById("buyPremiumBtn").style.display = "none";
        document.getElementById("showLeaderboardBtn").style.display = "inline";
      }
    })
    .catch(err => console.log(err));
    
    //Load existing expenses
    fetch("/expense/get",{
        headers: {
            'Authorization': `Bearer ${token}`
          }
    })
      .then(res => res.json())
      .then(data => {
        data.forEach(expenseItem => displayOnScreen(expenseItem));
      })
      .catch(err => console.log(err));
  })
  
  function displayOnScreen(expenseItem) {
      const expenseList = document.getElementById('expenseList');
      const li = document.createElement('li');
      li.id = expenseItem.description;
      li.textContent = `${expenseItem.amount} - ${expenseItem.category} - ${expenseItem.description}`;
  
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete Expense';
  
      li.appendChild(deleteButton);

      deleteButton.addEventListener("click", ()=>{
        fetch(`/expense/delete/${expenseItem.id}`,{
            method:"DELETE",
            headers: {
                'Authorization': `Bearer ${token}`
              }
        })
        .then(()=>expenseList.removeChild(li))
        .catch(err=>console.log(err));
      });

      expenseList.appendChild(li);
  }

  document.getElementById("buyPremiumBtn").addEventListener("click", () => {
    // Send a request to your backend to get the payment session ID
  
    fetch("/payment/create-order", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.payment_session_id) {
        // Initialize the Cashfree SDK with sandbox mode
        const cashfree = Cashfree({
          mode: "sandbox", // Set to 'production' when you're ready for live payments
        });
  
        const checkoutOptions = {
          paymentSessionId: data.payment_session_id, // Pass the payment session ID from backend
          redirectTarget: "_self" // The payment page will open in the same window
        };
  
        // Open Cashfree payment gateway
        cashfree.checkout(checkoutOptions).then(result => {
          if (result.error) {
            alert(result.error.message); // Handle any error
          } else if (result.redirect) {
            console.log("Redirecting to Cashfree payment page...");
          }
        });
      } else {
        console.error("Failed to retrieve payment session ID");
      }
    })
    .catch(error => console.error("Error with the payment request:", error));
  });
  
  document.getElementById("showLeaderboardBtn").addEventListener("click", () => {
    fetch("/premium/leaderboard", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      const leaderboardList = document.getElementById("leaderboardList");
      leaderboardList.innerHTML = ""; // Clear old data
      data.forEach(user => {
        const li = document.createElement("li");
        li.textContent = `${user.username}: ₹${user.total_expense}`;
        leaderboardList.appendChild(li);
      });
    })
    .catch(err => console.error("Error fetching leaderboard:", err));
  });
  