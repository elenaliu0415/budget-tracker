const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
  target.result.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
  db = target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
  // TODO: this function should save a transaction object to indexedDB so that
  // it can be synced with the database when the user goes back online.
}

function checkDatabase() {
  // TODO: this function should check for any saved transactions and post them
  // all to the database. Delete the transactions from IndexedDB if the post
  // request is successful.
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

// listen for app coming back online
window.addEventListener("online", checkDatabase);
