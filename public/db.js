const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

const budgetVersion = 1;
let db;

// Create a new db request for a "budget" database.
const request = indexedDB.open("BudgetDB", budgetVersion);

request.onerror = function (e) {
  console.log(e.target);
  console.log(`Woops! ${e.target.errorCode}`);
};

request.onupgradeneeded = function (e) {
  console.log("Upgrade needed in IndexDB");

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("BudgetStore", { autoIncrement: true });
  }
};

request.onsuccess = function (e) {
  console.log("success");
  db = e.target.result;

  // Check if app is online before reading from db
  if (navigator.onLine) {
    console.log("Backend online! 🗄️");
    checkDatabase();
  }
};

function checkDatabase() {
  console.log("check db invoked");
  const transaction = db.transaction(["BudgetStore"], "readonly");
  const store = transaction.objectStore("BudgetStore");
  const getAll = store.getAll();

  getAll.onsuccess = async function () {
    if (getAll.result.length === 0) {
      return;
    }
    const response = await fetch("/api/transaction/bulk", {
      method: "POST",
      body: JSON.stringify(getAll.result),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
    });
    const dbTransactions = await response.json();
    if (dbTransactions.length > 0) {
      const delTxn = db.transaction(["BudgetStore"], "readwrite");
      const currentStore = delTxn.objectStore("BudgetStore");
      currentStore.clear();
      console.log("Clearing store 🧹");
    }
  };
}

function saveRecord(record) {
  console.log("Save record invoked");
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  const store = transaction.objectStore("BudgetStore");
  store.add(record);
}

// Listen for app coming back online
window.addEventListener("online", checkDatabase);
