//index.js

const token = localStorage.getItem("token");
let currentPage = 1;
let limit = localStorage.getItem("expenseLimit") || 10;
limit = parseInt(limit);

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
  const limitSelect = document.getElementById("limitSelect");
  if (limitSelect) limitSelect.value = limit;

  if (limitSelect) {
    limitSelect.addEventListener("change", () => {
      limit = parseInt(limitSelect.value);
      localStorage.setItem("expenseLimit", limit);
      currentPage = 1;
      fetchExpensesWithPagination(currentPage);
    });
  }

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
        document.getElementById('downloadexpense').style.display = 'inline';
      }
    })
    .catch(err => console.log(err));
    
        // Load paginated expenses
        fetchExpensesWithPagination(currentPage);
  })
  
  function displayOnScreen(expenseItem) {
      const expenseList = document.getElementById('expenseList');
      const li = document.createElement('li');
      li.id = expenseItem.description;
      li.textContent = `${expenseItem.amount} - ${expenseItem.category} - ${expenseItem.description}`;
  
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete Expense';
  
      li.appendChild(deleteButton);

      deleteButton.addEventListener("click", () => {
        fetch(`/expense/delete/${expenseItem.id}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(() => {
            // Remove the deleted item from the screen
            expenseList.removeChild(li);
      
            // Check how many items remain on the current page
            const remainingItems = expenseList.children.length;
      
            if (remainingItems === 0 && currentPage > 1) {
              currentPage--; // Go to previous page if current page is empty and not the first page
            }
      
            fetchExpensesWithPagination(currentPage); // Reload expenses
          })
          .catch(err => console.log(err));
      });      

      expenseList.appendChild(li);
  }

  function fetchExpensesWithPagination(page = 1) {
    fetch(`/expense/get?page=${page}&limit=${limit}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        const expenseList = document.getElementById('expenseList');
        expenseList.innerHTML = ''; // Clear old expenses
        data.expenses.forEach(expenseItem => displayOnScreen(expenseItem));
        renderPagination(data.totalExpenses, page);
    })
    .catch(err => console.log(err));
}

function renderPagination(totalExpenses, page) {
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = ''; // Clear existing buttons

  const totalPages = Math.ceil(totalExpenses / limit);

  for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.disabled = i === page;
      btn.addEventListener('click', () => {
          currentPage = i;
          fetchExpensesWithPagination(i);
      });
      paginationContainer.appendChild(btn);
  }
}

  document.getElementById("buyPremiumBtn").addEventListener("click", async () => {
    console.log("premium button clicked");
    try {
      const res = await fetch("/payment/create-order", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
  
      const data=await res.json();
      const paymentSessionId = data.paymentSessionId;
      
      const cashfree = Cashfree({
        mode: "sandbox", // Set to 'production' when you're ready for live payments
      });
      
      let checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: "_self",
    };
    await cashfree.checkout(checkoutOptions);
  } catch(err){
    console.log("Error:",err);
  }
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
        li.textContent = `${user.username}: ₹${user.totalExpense}`;
        leaderboardList.appendChild(li);
      });
    })
    .catch(err => console.error("Error fetching leaderboard:", err));
  });
  
  function downloadExpenses() {
    const token = localStorage.getItem('token');
  
    axios.get('http://localhost:3000/user/download', { headers: { "Authorization": token } })
      .then((response) => {
        if (response.status === 201) {
          const a = document.createElement("a");
          a.href = response.data.fileUrl;
          a.download = 'myexpense.csv';
          a.click();
        } else {
          throw new Error(response.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to download file');
      });
  }
  
  // Filter Expenses Function
function filterExpenses() {
  const filterRange = document.getElementById('filterRange').value;

  if (!filterRange) return;

  fetch(`/expense/filter?range=${filterRange}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      const expenseList = document.getElementById('expenseList');
      expenseList.innerHTML = ''; // Clear current list
      data.forEach(expense => displayOnScreen(expense));
    })
    .catch(err => console.error("Error fetching filtered expenses:", err));
}

// Show filter dropdown for premium users
window.addEventListener("DOMContentLoaded", () => {
  fetch("/user/status", {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.isPremium) {
        document.getElementById("filterContainer").style.display = "block";
      }
    })
    .catch(err => console.log(err));
});
