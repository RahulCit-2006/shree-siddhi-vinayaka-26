/**
 * Shree Siddhi Vinayak Youth Association - Sasalmari Camp
 * Lord Ganesha Festival 2026 - Fund & Expense Management Portal
 * Features: Left Sidebar Navigation, Clean Single-View Switching, Full Correction/Edit Controls, Om Logo
 */

const DEFAULT_MEMBERS = [
  { id: 'm1', name: 'Pondu', target: 6000, paid: 0, payments: [], isAdmin: true },
  { id: 'm2', name: 'Mounesh', target: 6000, paid: 0, payments: [], isAdmin: true },
  { id: 'm3', name: 'Rahul', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm4', name: 'Chanty', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm5', name: 'Sai', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm6', name: 'Vardhan', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm7', name: 'Jairaj', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm8', name: 'Bramha', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm9', name: 'Lokesh', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm10', name: 'Vamshi', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm11', name: 'Anil', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm12', name: 'Karthik', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm13', name: 'Harshith', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm14', name: 'Sathnarayana', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm15', name: 'Dharma', target: 6000, paid: 0, payments: [], isAdmin: false },
  { id: 'm16', name: 'Prasad', target: 6000, paid: 0, payments: [], isAdmin: false }
];

// Production Firebase Cloud Configuration for Shree Siddhi Vinayak Youth Association
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDhyKfdw4pZLBg7GA9lKsg9jn2a62NdHF8",
  authDomain: "ssvya-sasalmari-2026.firebaseapp.com",
  projectId: "ssvya-sasalmari-2026",
  storageBucket: "ssvya-sasalmari-2026.firebasestorage.app",
  messagingSenderId: "8818727392",
  appId: "1:8818727392:web:f6e1c8126baadc86b83385",
  measurementId: "G-EN4SRMTKW2"
};

class AppStore {
  constructor() {
    this.STORAGE_KEY = 'ssvya_sasalmari_2026_data_v3';
    this.PIN_KEY = 'ssvya_admin_pin_v3';
    this.SESSION_KEY = 'ssvya_active_user_session';
    
    this.currentUser = null;
    this.db = null;
    this.isCloudConnected = false;
    this.unsubscribeFirestore = null;

    this.state = this.loadState();
    this.initFirebase();
  }

  getFirebaseConfig() {
    try {
      const savedConfig = localStorage.getItem('ssvya_firebase_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed && parsed.apiKey && parsed.apiKey !== "YOUR_API_KEY") {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading saved firebase config', e);
    }
    if (FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY") {
      return FIREBASE_CONFIG;
    }
    return null;
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.members && parsed.members.length > 0) {
          if (this.migrateMemberList(parsed)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }

    return {
      associationName: 'Shree Siddhi Vinayak Youth Association',
      campLocation: 'Sasalmari Camp',
      members: DEFAULT_MEMBERS,
      expenses: [],
      transfers: [],
      activityLogs: [
        {
          id: 'log_init',
          action: 'Portal Initialized',
          details: 'Shree Siddhi Vinayak Youth Association (Sasalmari Camp) 2026 Portal created for 16 committee members.',
          admin: 'System',
          timestamp: new Date().toISOString()
        }
      ],
      settings: {
        targetPerMember: 6000
      }
    };
  }

  migrateMemberList(state) {
    const removedNames = new Set(['sudhakar', 'mohan', 'ammanraju']);
    const originalMembers = state.members;
    state.members = originalMembers.filter(member => !removedNames.has(member.name.trim().toLowerCase()));

    let changed = state.members.length !== originalMembers.length;

    if (!state.members.some(member => member.name.trim().toLowerCase() === 'dharma')) {
      state.members.push({ id: 'm15', name: 'Dharma', target: 6000, paid: 0, payments: [], isAdmin: false });
      changed = true;
    }

    if (!state.members.some(member => member.name.trim().toLowerCase() === 'prasad')) {
      state.members.push({ id: 'm16', name: 'Prasad', target: 6000, paid: 0, payments: [], isAdmin: false });
      changed = true;
    }

    return changed;
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      this.syncToCloud();
    } catch (e) {
      console.error(e);
    }
  }

  initFirebase() {
    const config = this.getFirebaseConfig();
    if (typeof firebase !== 'undefined' && config && config.apiKey && config.apiKey !== "YOUR_API_KEY") {
      try {
        if (this.unsubscribeFirestore) {
          this.unsubscribeFirestore();
          this.unsubscribeFirestore = null;
        }

        if (!firebase.apps.length) {
          firebase.initializeApp(config);
        }
        this.db = firebase.firestore();
        this.isCloudConnected = true;

        this.unsubscribeFirestore = this.db.collection('ssvya_association').doc('camp_2026')
          .onSnapshot((doc) => {
            if (doc.exists) {
              const remoteData = doc.data();
              if (remoteData && remoteData.members) {
                this.state = remoteData;
                this.migrateMemberList(this.state);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
                if (window.app) window.app.render();
              }
            } else {
              // Initial push to cloud
              this.syncToCloud();
            }
            this.isCloudConnected = true;
            if (window.app) window.app.updateCloudStatus(true);
          }, (err) => {
            console.warn("Firestore snapshot error:", err);
            this.isCloudConnected = false;
            if (window.app) window.app.updateCloudStatus(false, err.message);
          });
      } catch (err) {
        console.error("Firebase init failed:", err);
        this.isCloudConnected = false;
        if (window.app) window.app.updateCloudStatus(false, err.message);
      }
    } else {
      this.isCloudConnected = false;
      if (window.app) window.app.updateCloudStatus(false);
    }
  }

  syncToCloud() {
    if (this.db && this.isCloudConnected) {
      this.db.collection('ssvya_association').doc('camp_2026').set(this.state)
        .catch(err => {
          console.error("Cloud sync error:", err);
          if (window.app) window.app.showToast("Cloud sync error: " + err.message, "info");
        });
    }
  }

  getAdminPin() {
    return localStorage.getItem(this.PIN_KEY) || '1818';
  }

  setAdminPin(newPin) {
    localStorage.setItem(this.PIN_KEY, newPin);
  }

  loginMember(memberId, password) {
    const member = this.state.members.find(m => m.id === memberId);
    if (!member) return { success: false, message: 'Member not found' };

    const cleanPass = password.trim().toLowerCase();
    const adminPin = this.getAdminPin();
    const memberName = member.name.toLowerCase();

    const isMasterAdminPin = cleanPass === adminPin;
    const isMemberPass = cleanPass === '2026' || cleanPass === memberName;

    if (member.isAdmin) {
      if (!isMasterAdminPin) {
        return { success: false, message: 'Incorrect Admin PIN!' };
      }
      this.currentUser = { ...member, activeAdmin: true };
    } else {
      if (!isMemberPass && !isMasterAdminPin) {
        return { success: false, message: 'Incorrect password!' };
      }
      this.currentUser = { ...member, activeAdmin: isMasterAdminPin };
    }

    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));
    return { success: true, user: this.currentUser };
  }

  loginMemberByUsername(username, password) {
    const member = this.state.members.find(m => m.name.toLowerCase() === username.toLowerCase());
    if (!member) return { success: false, message: 'Invalid username' };

    const cleanPass = password.trim().toLowerCase();
    const adminPin = this.getAdminPin();
    const memberName = member.name.toLowerCase();

    const isMasterAdminPin = cleanPass === adminPin;
    const isMemberPass = cleanPass === '2026' || cleanPass === memberName;

    if (member.isAdmin) {
      if (!isMasterAdminPin) {
        return { success: false, message: 'Incorrect Admin PIN!' };
      }
      this.currentUser = { ...member, activeAdmin: true };
    } else {
      if (!isMemberPass && !isMasterAdminPin) {
        return { success: false, message: 'Incorrect password!' };
      }
      this.currentUser = { ...member, activeAdmin: isMasterAdminPin };
    }

    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));
    return { success: true, user: this.currentUser };
  }

  restoreSession() {
    try {
      const saved = sessionStorage.getItem(this.SESSION_KEY);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      const member = this.state.members.find(m => m.id === parsed.id);
      if (!member) {
        sessionStorage.removeItem(this.SESSION_KEY);
        return null;
      }

      this.currentUser = {
        ...member,
        activeAdmin: Boolean(parsed.activeAdmin)
      };
      return this.currentUser;
    } catch (e) {
      sessionStorage.removeItem(this.SESSION_KEY);
      return null;
    }
  }

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  logActivity(action, details) {
    const adminName = this.currentUser ? this.currentUser.name : 'Admin';
    const log = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      action,
      details,
      admin: adminName,
      timestamp: new Date().toISOString()
    };
    if (!this.state.activityLogs) this.state.activityLogs = [];
    this.state.activityLogs.unshift(log);
    if (this.state.activityLogs.length > 120) this.state.activityLogs.pop();
    this.saveState();
  }

  // Member CRUD
  addMember(name, target = 6000, isAdmin = false) {
    const newMember = {
      id: 'm_' + Date.now(),
      name: name.trim(),
      target: Number(target) || 6000,
      paid: 0,
      payments: [],
      isAdmin: Boolean(isAdmin)
    };

    this.state.members.push(newMember);
    this.logActivity(
      `New Member Added: ${newMember.name}`,
      `Added to committee with target ₹${newMember.target.toLocaleString('en-IN')}${newMember.isAdmin ? ' (Admin)' : ''}.`
    );
    this.saveState();
    return newMember;
  }

  editMember(memberId, newName, newTarget, newIsAdmin) {
    const member = this.state.members.find(m => m.id === memberId);
    if (!member) return false;

    const oldName = member.name;
    const oldTarget = member.target;

    member.name = newName.trim();
    member.target = Number(newTarget) || 6000;
    member.isAdmin = Boolean(newIsAdmin);

    this.logActivity(
      `Member Details Updated: ${member.name}`,
      `Name: ${oldName} → ${member.name}, Target: ₹${oldTarget.toLocaleString('en-IN')} → ₹${member.target.toLocaleString('en-IN')}.`
    );
    this.saveState();
    return true;
  }

  deleteMember(memberId) {
    const index = this.state.members.findIndex(m => m.id === memberId);
    if (index === -1) return false;

    const removed = this.state.members.splice(index, 1)[0];
    this.logActivity(
      `Member Removed: ${removed.name}`,
      `Removed from committee list.`
    );
    this.saveState();
    return true;
  }

  // Payment CRUD
  addPayment(memberId, amount, mode, note) {
    const member = this.state.members.find(m => m.id === memberId);
    if (!member) return { success: false };

    const payment = {
      id: 'pay_' + Date.now(),
      amount: Number(amount),
      mode,
      note: note || '',
      recordedBy: this.currentUser ? this.currentUser.name : 'Admin',
      date: new Date().toISOString()
    };

    if (!member.payments) member.payments = [];
    member.payments.push(payment);
    member.paid = (Number(member.paid) || 0) + Number(amount);

    const isFullyPaid = member.paid >= member.target;
    this.logActivity(
      `Payment Received: ${member.name}`,
      `+₹${amount.toLocaleString('en-IN')} paid via ${mode}${note ? ` (${note})` : ''}. Total: ₹${member.paid.toLocaleString('en-IN')}/${member.target.toLocaleString('en-IN')}.`
    );

    this.saveState();
    return { success: true, isFullyPaid, memberName: member.name };
  }

  editPayment(memberId, paymentId, newAmount, newMode, newNote) {
    const member = this.state.members.find(m => m.id === memberId);
    if (!member || !member.payments) return false;

    const payment = member.payments.find(p => p.id === paymentId);
    if (!payment) return false;

    const oldAmount = Number(payment.amount) || 0;
    const oldMode = payment.mode;

    payment.amount = Number(newAmount) || 0;
    payment.mode = newMode;
    payment.note = newNote || '';

    member.paid = member.payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    this.logActivity(
      `Payment Corrected: ${member.name}`,
      `Amount changed from ₹${oldAmount.toLocaleString('en-IN')} (${oldMode}) to ₹${payment.amount.toLocaleString('en-IN')} (${newMode})${newNote ? ` - ${newNote}` : ''}.`
    );

    this.saveState();
    return true;
  }

  deletePayment(memberId, paymentId) {
    const member = this.state.members.find(m => m.id === memberId);
    if (!member || !member.payments) return false;

    const idx = member.payments.findIndex(p => p.id === paymentId);
    if (idx === -1) return false;

    const deleted = member.payments.splice(idx, 1)[0];
    member.paid = Math.max(0, (member.paid || 0) - deleted.amount);

    this.logActivity(
      `Payment Cancelled: ${member.name}`,
      `Reverted ₹${deleted.amount.toLocaleString('en-IN')} payment.`
    );

    this.saveState();
    return true;
  }

  // Expense CRUD
  addExpense(title, amount, mode, paidBy, note) {
    const expense = {
      id: 'exp_' + Date.now(),
      title: title.trim(),
      amount: Number(amount),
      mode,
      paidBy: paidBy || (this.currentUser ? this.currentUser.name : 'Admin'),
      note: note || '',
      date: new Date().toISOString()
    };

    if (!this.state.expenses) this.state.expenses = [];
    this.state.expenses.unshift(expense);

    this.logActivity(
      `Expense Logged: ${expense.title}`,
      `₹${expense.amount.toLocaleString('en-IN')} spent via ${expense.mode} by ${expense.paidBy}${note ? ` (${note})` : ''}.`
    );

    this.saveState();
    return expense;
  }

  editExpense(expenseId, newTitle, newAmount, newMode, newPaidBy, newNote) {
    const expense = this.state.expenses.find(e => e.id === expenseId);
    if (!expense) return false;

    const oldTitle = expense.title;
    const oldAmount = expense.amount;
    const oldMode = expense.mode;

    expense.title = newTitle.trim();
    expense.amount = Number(newAmount) || 0;
    expense.mode = newMode;
    expense.paidBy = newPaidBy || expense.paidBy;
    expense.note = newNote || '';

    this.logActivity(
      `Expense Corrected: ${expense.title}`,
      `Updated from "${oldTitle}" ₹${oldAmount.toLocaleString('en-IN')} (${oldMode}) → "${expense.title}" ₹${expense.amount.toLocaleString('en-IN')} (${expense.mode}).`
    );

    this.saveState();
    return true;
  }

  deleteExpense(expenseId) {
    const idx = this.state.expenses.findIndex(e => e.id === expenseId);
    if (idx === -1) return false;

    const removed = this.state.expenses.splice(idx, 1)[0];
    this.logActivity(
      `Expense Deleted: ${removed.title}`,
      `Removed ₹${removed.amount.toLocaleString('en-IN')} expense.`
    );

    this.saveState();
    return true;
  }

  // Fund Transfers
  addTransfer(direction, amount, note) {
    const transfer = {
      id: 'trf_' + Date.now(),
      direction,
      amount: Number(amount),
      note: note || '',
      performedBy: this.currentUser ? this.currentUser.name : 'Admin',
      date: new Date().toISOString()
    };

    if (!this.state.transfers) this.state.transfers = [];
    this.state.transfers.unshift(transfer);

    const desc = direction === 'UPI_TO_CASH' 
      ? `🏧 Withdrew ₹${amount.toLocaleString('en-IN')} from UPI into Cash in Hand`
      : `🏦 Deposited ₹${amount.toLocaleString('en-IN')} Cash into UPI / Bank`;

    this.logActivity(
      `Fund Transfer: ${direction === 'UPI_TO_CASH' ? 'UPI → Cash' : 'Cash → UPI'}`,
      `${desc}${note ? ` (${note})` : ''}.`
    );

    this.saveState();
    return transfer;
  }

  getMetrics() {
    let totalTarget = 0;
    let totalCollected = 0;
    let totalUpiIn = 0;
    let totalCashIn = 0;
    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;

    this.state.members.forEach(m => {
      const target = Number(m.target) || 6000;
      const paid = Number(m.paid) || 0;

      totalTarget += target;
      totalCollected += paid;

      if (paid >= target) paidCount++;
      else if (paid > 0) partialCount++;
      else pendingCount++;

      if (m.payments && Array.isArray(m.payments)) {
        m.payments.forEach(p => {
          if (p.mode === 'UPI') totalUpiIn += Number(p.amount) || 0;
          if (p.mode === 'Cash') totalCashIn += Number(p.amount) || 0;
        });
      }
    });

    let totalSpent = 0;
    let upiSpent = 0;
    let cashSpent = 0;

    (this.state.expenses || []).forEach(e => {
      const amt = Number(e.amount) || 0;
      totalSpent += amt;
      if (e.mode === 'UPI') upiSpent += amt;
      else cashSpent += amt;
    });

    let upiToCashTotal = 0;
    let cashToUpiTotal = 0;

    (this.state.transfers || []).forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.direction === 'UPI_TO_CASH') upiToCashTotal += amt;
      if (t.direction === 'CASH_TO_UPI') cashToUpiTotal += amt;
    });

    const upiBalance = Math.max(0, totalUpiIn - upiSpent - upiToCashTotal + cashToUpiTotal);
    const cashBalance = Math.max(0, totalCashIn - cashSpent + upiToCashTotal - cashToUpiTotal);
    const netBalance = totalCollected - totalSpent;
    const progressPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;

    return {
      totalTarget,
      totalCollected,
      totalSpent,
      netBalance,
      upiBalance,
      cashBalance,
      progressPercent,
      paidCount,
      partialCount,
      pendingCount,
      membersCount: this.state.members.length,
      expenseCount: (this.state.expenses || []).length
    };
  }
}

const store = new AppStore();

class AppUI {
  constructor() {
    this.currentView = 'dashboard';
    this.memberFilter = 'ALL';
    this.searchQuery = '';
    this.selectedMemberForDetail = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateCloudStatus(store.isCloudConnected);

    const existing = store.restoreSession();
    if (existing) {
      this.showMainApp();
    } else {
      this.showLoginGate();
    }
  }

  populateLoginDropdown() {
    // No longer needed - username is entered as text
  }

  showLoginGate() {
    store.currentUser = null;
    sessionStorage.removeItem(store.SESSION_KEY);
    const gate = document.getElementById('loginGateScreen');
    const main = document.getElementById('mainAppContent');
    if (gate) gate.style.display = 'flex';
    if (main) main.style.display = 'none';
    
    // Clear login form
    const usernameInput = document.getElementById('loginUsernameInput');
    const passInput = document.getElementById('loginPasswordInput');
    const errBox = document.getElementById('loginErrorMsg');
    if (usernameInput) usernameInput.value = '';
    if (passInput) passInput.value = '';
    if (errBox) errBox.style.display = 'none';
  }

  showMainApp() {
    const gate = document.getElementById('loginGateScreen');
    const main = document.getElementById('mainAppContent');
    if (gate) gate.style.display = 'none';
    if (main) main.style.display = 'flex';

    this.switchView(this.currentView);
    this.render();
  }

  // View switching (only 1 tab shown at a time)
  switchView(viewName) {
    this.currentView = viewName;

    // Hide all view sections
    document.querySelectorAll('.app-view-container').forEach(el => {
      el.style.display = 'none';
    });

    // Show only the selected view
    const activeSection = document.getElementById(
      viewName === 'dashboard' ? 'viewDashboard' :
      viewName === 'contributors' ? 'viewContributors' :
      viewName === 'expenses' ? 'viewExpenses' :
      viewName === 'funds' ? 'viewFunds' : 'viewActivity'
    );
    if (activeSection) {
      activeSection.style.display = 'block';
    }

    // Update active state on left sidebar buttons
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
      btn.classList.remove('active', 'bg-gradient-to-r', 'from-gold-500/20', 'to-saffron-500/20', 'border-gold-500/40', 'text-gold-400');
    });

    const activeBtn = document.getElementById(`navBtn-${viewName}`);
    if (activeBtn) {
      activeBtn.classList.add('active', 'bg-gradient-to-r', 'from-gold-500/20', 'to-saffron-500/20', 'border-gold-500/40', 'text-gold-400');
    }

    window.scrollTo(0, 0);
  }

  toggleMobileMenu() {
    const drawer = document.getElementById('mobileMenuDrawer');
    if (drawer) {
      drawer.classList.toggle('hidden');
    }
  }

  handleMemberLogin(e) {
    if (e) e.preventDefault();
    const usernameInput = document.getElementById('loginUsernameInput');
    const passInput = document.getElementById('loginPasswordInput');
    const errBox = document.getElementById('loginErrorMsg');

    const username = usernameInput ? usernameInput.value.trim() : '';
    const pass = passInput ? passInput.value : '';

    // Clear old session completely
    store.currentUser = null;
    sessionStorage.removeItem(store.SESSION_KEY);

    const res = store.loginMemberByUsername(username, pass);
    if (res.success) {
      if (errBox) errBox.style.display = 'none';
      if (passInput) passInput.value = '';
      if (usernameInput) usernameInput.value = '';
      
      // Ensure store.currentUser is set with fresh member data
      store.currentUser = res.user;
      
      this.showMainApp();
      this.showToast(`🙏 Welcome ${res.user.name}!`, 'success');
      this.triggerConfetti();
    } else {
      if (errBox) {
        errBox.textContent = res.message;
        errBox.style.display = 'block';
      }
    }
  }

  logout() {
    store.logout();
    this.showLoginGate();
    this.showToast('Logged out securely.', 'info');
  }

  // Add / Edit Member Modals
  openAddMemberModal() {
    if (!store.currentUser || !store.currentUser.activeAdmin) return;
    const nameInput = document.getElementById('inputNewMemberName');
    const targetInput = document.getElementById('inputNewMemberTarget');
    const adminCheck = document.getElementById('inputNewMemberIsAdmin');
    const modal = document.getElementById('modalAddMember');

    if (nameInput) nameInput.value = '';
    if (targetInput) targetInput.value = 6000;
    if (adminCheck) adminCheck.checked = false;

    if (modal) modal.style.display = 'flex';
  }

  handleAddMember(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('inputNewMemberName');
    const targetInput = document.getElementById('inputNewMemberTarget');
    const adminCheck = document.getElementById('inputNewMemberIsAdmin');

    const name = nameInput ? nameInput.value.trim() : '';
    const target = targetInput ? Number(targetInput.value) : 6000;
    const isAdmin = adminCheck ? adminCheck.checked : false;

    if (!name) {
      alert('Please enter member name');
      return;
    }

    store.addMember(name, target, isAdmin);
    document.getElementById('modalAddMember').style.display = 'none';
    this.render();
    this.showToast(`Member ${name} added!`, 'success');
  }

  openEditMemberModal(memberId) {
    if (!store.currentUser || !store.currentUser.activeAdmin) return;
    const member = store.state.members.find(m => m.id === memberId);
    if (!member) return;

    document.getElementById('editMemberId').value = member.id;
    document.getElementById('editMemberNameInput').value = member.name;
    document.getElementById('editMemberTargetInput').value = member.target || 6000;
    document.getElementById('editMemberIsAdminInput').checked = Boolean(member.isAdmin);

    document.getElementById('modalMemberDetail').style.display = 'none';
    document.getElementById('modalEditMember').style.display = 'flex';
  }

  handleSaveEditMember(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('editMemberId').value;
    const name = document.getElementById('editMemberNameInput').value;
    const target = document.getElementById('editMemberTargetInput').value;
    const isAdmin = document.getElementById('editMemberIsAdminInput').checked;

    if (!name) {
      alert('Please enter a valid name');
      return;
    }

    store.editMember(id, name, target, isAdmin);
    document.getElementById('modalEditMember').style.display = 'none';
    this.render();
    this.showToast(`Member details updated!`, 'success');
  }

  // Fund Transfers
  openTransferModal() {
    if (!store.currentUser || !store.currentUser.activeAdmin) return;
    const amtInput = document.getElementById('transferAmountInput');
    const noteInput = document.getElementById('transferNoteInput');
    const modal = document.getElementById('modalTransferFunds');

    if (amtInput) amtInput.value = '';
    if (noteInput) noteInput.value = '';
    if (modal) modal.style.display = 'flex';
  }

  handleTransferFunds(e) {
    if (e) e.preventDefault();
    const dirSelect = document.getElementById('transferDirectionSelect');
    const amtInput = document.getElementById('transferAmountInput');
    const noteInput = document.getElementById('transferNoteInput');

    const dir = dirSelect ? dirSelect.value : 'UPI_TO_CASH';
    const amount = amtInput ? Number(amtInput.value) : 0;
    const note = noteInput ? noteInput.value.trim() : '';

    if (!amount || amount <= 0) {
      alert('Please enter a valid transfer amount');
      return;
    }

    store.addTransfer(dir, amount, note);
    document.getElementById('modalTransferFunds').style.display = 'none';
    this.render();
    this.showToast(`Transfer of ₹${amount.toLocaleString('en-IN')} completed!`, 'success');
  }

  // Add / Edit Payment Modals
  openAddPaymentModal(preselectedMemberId = null) {
    if (!store.currentUser || !store.currentUser.activeAdmin) return;
    const select = document.getElementById('paymentMemberSelect');
    const amtInput = document.getElementById('paymentAmountInput');
    const noteInput = document.getElementById('paymentNoteInput');
    const modal = document.getElementById('modalAddPayment');

    if (select) {
      select.innerHTML = store.state.members.map(m => {
        const remaining = Math.max(0, m.target - (m.paid || 0));
        return `<option value="${m.id}" ${m.id === preselectedMemberId ? 'selected' : ''}>
          ${m.name} (${remaining === 0 ? 'Fully Paid' : `Balance: ₹${remaining.toLocaleString('en-IN')}`})
        </option>`;
      }).join('');
    }

    if (amtInput) amtInput.value = '';
    if (noteInput) noteInput.value = '';
    this.updateMemberPaymentReminder();

    if (modal) modal.style.display = 'flex';
  }

  updateMemberPaymentReminder() {
    const select = document.getElementById('paymentMemberSelect');
    const reminder = document.getElementById('memberTargetReminder');
    const amtInput = document.getElementById('paymentAmountInput');

    if (!select || !reminder) return;
    const member = store.state.members.find(m => m.id === select.value);
    if (member) {
      const remaining = Math.max(0, member.target - (member.paid || 0));
      reminder.innerHTML = `Target: <strong>₹${member.target.toLocaleString('en-IN')}</strong> | Paid: <strong>₹${(member.paid || 0).toLocaleString('en-IN')}</strong> | Balance: <strong class="text-rose-400">₹${remaining.toLocaleString('en-IN')}</strong>`;
      if (remaining > 0 && amtInput && !amtInput.value) {
        amtInput.value = remaining;
      }
    }
  }

  handleRecordPayment(e) {
    if (e) e.preventDefault();
    const select = document.getElementById('paymentMemberSelect');
    const amtInput = document.getElementById('paymentAmountInput');
    const noteInput = document.getElementById('paymentNoteInput');
    const modeRadio = document.querySelector('input[name="paymentMode"]:checked');

    const memberId = select ? select.value : null;
    const amount = amtInput ? Number(amtInput.value) : 0;
    const mode = modeRadio ? modeRadio.value : 'UPI';
    const note = noteInput ? noteInput.value.trim() : '';

    if (!amount || amount <= 0) {
      alert('Please enter valid amount');
      return;
    }

    const res = store.addPayment(memberId, amount, mode, note);
    if (res.success) {
      document.getElementById('modalAddPayment').style.display = 'none';
      this.render();
      this.showToast(`Payment of ₹${amount.toLocaleString('en-IN')} recorded for ${res.memberName}!`, 'success');
      if (res.isFullyPaid) this.triggerConfetti();
    }
  }

  openEditPaymentModal(memberId, paymentId) {
    if (!store.currentUser || !store.currentUser.activeAdmin) return;
    const member = store.state.members.find(m => m.id === memberId);
    if (!member || !member.payments) return;
    const payment = member.payments.find(p => p.id === paymentId);
    if (!payment) return;

    document.getElementById('editPaymentMemberId').value = memberId;
    document.getElementById('editPaymentId').value = paymentId;
    document.getElementById('editPaymentMemberName').value = member.name;
    document.getElementById('editPaymentAmountInput').value = payment.amount;
    document.getElementById('editPaymentNoteInput').value = payment.note || '';

    if (payment.mode === 'Cash') {
      document.getElementById('editPaymentModeCash').checked = true;
    } else {
      document.getElementById('editPaymentModeUpi').checked = true;
    }

    document.getElementById('modalMemberDetail').style.display = 'none';
    document.getElementById('modalEditPayment').style.display = 'flex';
  }

  handleSaveEditPayment(e) {
    if (e) e.preventDefault();
    const memberId = document.getElementById('editPaymentMemberId').value;
    const paymentId = document.getElementById('editPaymentId').value;
    const amount = Number(document.getElementById('editPaymentAmountInput').value) || 0;
    const note = document.getElementById('editPaymentNoteInput').value.trim();
    const modeRadio = document.querySelector('input[name="editPaymentMode"]:checked');
    const mode = modeRadio ? modeRadio.value : 'UPI';

    if (!amount || amount <= 0) {
      alert('Please enter valid payment amount');
      return;
    }

    store.editPayment(memberId, paymentId, amount, mode, note);
    document.getElementById('modalEditPayment').style.display = 'none';
    this.render();
    this.showMemberDetail(memberId);
    this.showToast('Payment corrected!', 'success');
  }

  // Add / Edit Expense Modals
  openAddExpenseModal() {
    if (!store.currentUser || !store.currentUser.activeAdmin) return;
    const titleInput = document.getElementById('expenseTitleInput');
    const amtInput = document.getElementById('expenseAmountInput');
    const noteInput = document.getElementById('expenseNoteInput');
    const paidBySelect = document.getElementById('expensePaidBySelect');
    const modal = document.getElementById('modalAddExpense');

    if (titleInput) titleInput.value = '';
    if (amtInput) amtInput.value = '';
    if (noteInput) noteInput.value = '';
    if (paidBySelect && store.currentUser) paidBySelect.value = store.currentUser.name;

    if (modal) modal.style.display = 'flex';
  }

  handleAddExpense(e) {
    if (e) e.preventDefault();
    const titleInput = document.getElementById('expenseTitleInput');
    const amtInput = document.getElementById('expenseAmountInput');
    const modeSelect = document.getElementById('expenseModeSelect');
    const paidBySelect = document.getElementById('expensePaidBySelect');
    const noteInput = document.getElementById('expenseNoteInput');

    const title = titleInput ? titleInput.value.trim() : '';
    const amount = amtInput ? Number(amtInput.value) : 0;
    const mode = modeSelect ? modeSelect.value : 'Cash';
    const paidBy = paidBySelect ? paidBySelect.value : 'Pondu';
    const note = noteInput ? noteInput.value.trim() : '';

    if (!title || !amount || amount <= 0) {
      alert('Please enter expense title and amount');
      return;
    }

    store.addExpense(title, amount, mode, paidBy, note);
    document.getElementById('modalAddExpense').style.display = 'none';
    this.render();
    this.showToast(`Expense of ₹${amount.toLocaleString('en-IN')} logged!`, 'success');
  }

  openEditExpenseModal(expenseId) {
    if (!store.currentUser || !store.currentUser.activeAdmin) return;
    const expense = store.state.expenses.find(e => e.id === expenseId);
    if (!expense) return;

    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('editExpenseTitleInput').value = expense.title;
    document.getElementById('editExpenseAmountInput').value = expense.amount;
    document.getElementById('editExpenseModeSelect').value = expense.mode || 'Cash';
    document.getElementById('editExpensePaidBySelect').value = expense.paidBy || 'Pondu';
    document.getElementById('editExpenseNoteInput').value = expense.note || '';

    document.getElementById('modalEditExpense').style.display = 'flex';
  }

  handleSaveEditExpense(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('editExpenseId').value;
    const title = document.getElementById('editExpenseTitleInput').value.trim();
    const amount = Number(document.getElementById('editExpenseAmountInput').value) || 0;
    const mode = document.getElementById('editExpenseModeSelect').value;
    const paidBy = document.getElementById('editExpensePaidBySelect').value;
    const note = document.getElementById('editExpenseNoteInput').value.trim();

    if (!title || !amount || amount <= 0) {
      alert('Please enter a valid expense title and amount');
      return;
    }

    store.editExpense(id, title, amount, mode, paidBy, note);
    document.getElementById('modalEditExpense').style.display = 'none';
    this.render();
    this.showToast(`Expense updated!`, 'success');
  }

  // Member Detail Modal
  showMemberDetail(memberId) {
    const member = store.state.members.find(m => m.id === memberId);
    if (!member) return;
    this.selectedMemberForDetail = member;

    const remaining = Math.max(0, member.target - (member.paid || 0));
    const isPaid = (member.paid || 0) >= member.target;
    const isPartial = (member.paid || 0) > 0 && !isPaid;

    const nameEl = document.getElementById('modalMemberName');
    const targetEl = document.getElementById('modalMemberTarget');
    const paidEl = document.getElementById('modalMemberPaid');
    const balanceEl = document.getElementById('modalMemberBalance');
    const badgeEl = document.getElementById('modalMemberStatusBadge');
    const listEl = document.getElementById('modalMemberPaymentsList');
    const quickPayBtn = document.getElementById('btnMemberQuickPay');
    const deleteMemberBtn = document.getElementById('btnDeleteMember');
    const editMemberBtn = document.getElementById('btnOpenEditMember');
    const modal = document.getElementById('modalMemberDetail');

    if (nameEl) nameEl.textContent = member.name + (member.isAdmin ? ' (Admin)' : '');
    if (targetEl) targetEl.textContent = `₹${member.target.toLocaleString('en-IN')}`;
    if (paidEl) paidEl.textContent = `₹${(member.paid || 0).toLocaleString('en-IN')}`;
    if (balanceEl) balanceEl.textContent = `₹${remaining.toLocaleString('en-IN')}`;

    if (badgeEl) {
      if (isPaid) {
        badgeEl.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30';
        badgeEl.textContent = 'Paid in Full (₹6,000)';
      } else if (isPartial) {
        badgeEl.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30';
        badgeEl.textContent = `Partial (Rem: ₹${remaining.toLocaleString('en-IN')})`;
      } else {
        badgeEl.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-rose-950/60 text-rose-300 border border-rose-500/30';
        badgeEl.textContent = 'Pending (₹6,000)';
      }
    }

    const isAdmin = Boolean(store.currentUser && store.currentUser.activeAdmin);

    if (listEl) {
      if (member.payments && member.payments.length > 0) {
        listEl.innerHTML = member.payments.map(p => `
          <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <div>
              <div class="font-bold text-emerald-400 flex items-center gap-1.5">
                <span>₹${p.amount.toLocaleString('en-IN')}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-neutral-300 font-normal">${p.mode}</span>
              </div>
              <div class="text-[11px] text-neutral-400 mt-0.5">
                ${new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                ${p.note ? ` • <em>${p.note}</em>` : ''}
              </div>
            </div>
            ${isAdmin ? `
              <div class="flex items-center gap-1">
                <button onclick="window.app.openEditPaymentModal('${member.id}', '${p.id}')" class="text-gold-400 hover:text-gold-300 p-1.5 rounded bg-white/5 text-xs cursor-pointer" title="Edit payment">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="window.app.deletePayment('${member.id}', '${p.id}')" class="text-rose-400 hover:text-rose-300 p-1.5 rounded bg-white/5 text-xs cursor-pointer" title="Delete payment">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ` : ''}
          </div>
        `).join('');
      } else {
        listEl.innerHTML = `<div class="text-xs text-neutral-400 text-center py-4 bg-white/[0.02] rounded-xl border border-dashed border-white/10">No payments recorded yet</div>`;
      }
    }

    if (editMemberBtn) {
      if (isAdmin) {
        editMemberBtn.style.display = 'inline-block';
        editMemberBtn.onclick = () => this.openEditMemberModal(member.id);
      } else {
        editMemberBtn.style.display = 'none';
      }
    }

    if (quickPayBtn) {
      if (isAdmin) {
        quickPayBtn.style.display = 'block';
        quickPayBtn.onclick = () => {
          modal.style.display = 'none';
          this.openAddPaymentModal(member.id);
        };
      } else {
        quickPayBtn.style.display = 'none';
      }
    }

    if (deleteMemberBtn) {
      if (isAdmin && store.state.members.length > 1) {
        deleteMemberBtn.style.display = 'block';
        deleteMemberBtn.onclick = () => {
          if (confirm(`Are you sure you want to remove ${member.name} from the committee?`)) {
            store.deleteMember(member.id);
            modal.style.display = 'none';
            this.render();
            this.showToast(`Member ${member.name} removed`, 'info');
          }
        };
      } else {
        deleteMemberBtn.style.display = 'none';
      }
    }

    if (modal) modal.style.display = 'flex';
  }

  deletePayment(memberId, paymentId) {
    if (!store.currentUser || !store.currentUser.activeAdmin) return;
    if (confirm('Are you sure you want to delete this payment?')) {
      store.deletePayment(memberId, paymentId);
      this.showMemberDetail(memberId);
      this.render();
      this.showToast('Payment deleted', 'info');
    }
  }

  deleteExpense(expenseId) {
    if (!store.currentUser || !store.currentUser.activeAdmin) return;
    if (confirm('Are you sure you want to delete this expense?')) {
      store.deleteExpense(expenseId);
      this.render();
      this.showToast('Expense deleted', 'info');
    }
  }

  openWhatsAppModal() {
    const m = store.getMetrics();
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const fullyPaidMembers = store.state.members.filter(mem => (mem.paid || 0) >= mem.target).map(mem => mem.name);
    const partialMembers = store.state.members.filter(mem => (mem.paid || 0) > 0 && (mem.paid || 0) < mem.target).map(mem => `${mem.name} (Paid ₹${mem.paid})`);
    const pendingMembers = store.state.members.filter(mem => !(mem.paid || 0)).map(mem => mem.name);

    let message = `🚩 *SHREE SIDDHI VINAYAK YOUTH ASSOCIATION* 🚩\n`;
    message += `📍 *Sasalmari Camp • Fund Update 2026*\n`;
    message += `📅 *Date:* ${today}\n`;
    message += `------------------------------------\n`;
    message += `🎯 *Total Target:* ₹${m.totalTarget.toLocaleString('en-IN')} (${m.membersCount} × ₹6,000)\n`;
    message += `💰 *Total Collected:* ₹${m.totalCollected.toLocaleString('en-IN')} (${m.progressPercent}%)\n`;
    message += `💸 *Total Spent:* ₹${m.totalSpent.toLocaleString('en-IN')}\n`;
    message += `🏦 *Net Balance:* ₹${m.netBalance.toLocaleString('en-IN')}\n`;
    message += `📱 *UPI Pool:* ₹${m.upiBalance.toLocaleString('en-IN')} | 💵 *Cash Pool:* ₹${m.cashBalance.toLocaleString('en-IN')}\n`;
    message += `------------------------------------\n`;
    message += `✅ *Paid in Full (${fullyPaidMembers.length}/${m.membersCount}):*\n`;
    message += fullyPaidMembers.length > 0 ? `${fullyPaidMembers.join(', ')}\n\n` : `None yet\n\n`;

    if (partialMembers.length > 0) {
      message += `⏳ *Partial Payments (${partialMembers.length}):*\n${partialMembers.join('\n')}\n\n`;
    }

    if (pendingMembers.length > 0) {
      message += `❌ *Pending Contributions (${pendingMembers.length}):*\n${pendingMembers.join(', ')}\n\n`;
    }

    message += `------------------------------------\n`;
    message += `🙏 *Ganapathi Bappa Morya!* Please clear remaining contributions soon.`;

    const textarea = document.getElementById('textareaWhatsApp');
    const directLink = document.getElementById('btnDirectWhatsAppLink');
    const modal = document.getElementById('modalWhatsAppShare');

    if (textarea) textarea.value = message;
    if (directLink) directLink.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    if (modal) modal.style.display = 'flex';
  }

  copyWhatsAppText() {
    const textarea = document.getElementById('textareaWhatsApp');
    const copyBtnText = document.getElementById('copyBtnText');
    if (!textarea) return;

    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      if (copyBtnText) copyBtnText.textContent = 'Copied to Clipboard!';
      this.showToast('WhatsApp summary copied!', 'success');
      setTimeout(() => {
        if (copyBtnText) copyBtnText.textContent = 'Copy to Clipboard';
      }, 2500);
    });
  }

  openCloudModal() {
    const modal = document.getElementById('modalCloudSync');
    if (modal) {
      modal.style.display = 'flex';
      this.updateCloudStatus(store.isCloudConnected);
    }
  }

  updateCloudStatus(isConnected, errMessage = '') {
    const mobileBadge = document.getElementById('mobileCloudBadge');
    const desktopBadge = document.getElementById('desktopCloudBadge');
    const modalBadge = document.getElementById('modalCloudStatusBadge');
    const configInput = document.getElementById('inputFirebaseConfigText');

    if (mobileBadge) {
      mobileBadge.innerHTML = isConnected
        ? `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span class="text-emerald-300">Live</span>`
        : `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span class="text-amber-300">Local</span>`;
      mobileBadge.className = isConnected
        ? "cloud-status-indicator px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5 cursor-pointer"
        : "cloud-status-indicator px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer";
    }

    if (desktopBadge) {
      desktopBadge.innerHTML = isConnected
        ? `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span class="text-emerald-300">Live Cloud Synced</span>`
        : `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span class="text-amber-300">Offline / Local Mode</span>`;
      desktopBadge.className = isConnected
        ? "cloud-status-indicator mt-2 w-full py-1.5 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
        : "cloud-status-indicator mt-2 w-full py-1.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-[11px] font-semibold text-amber-300 flex items-center justify-center gap-2 transition-all cursor-pointer";
    }

    if (modalBadge) {
      modalBadge.innerHTML = isConnected
        ? `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span class="text-emerald-300">Connected (Realtime Live)</span>`
        : `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span class="text-amber-300">Offline / Not Connected</span>`;
      modalBadge.className = isConnected
        ? "text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"
        : "text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5";
    }

    if (configInput && !configInput.value.trim()) {
      const existing = store.getFirebaseConfig();
      if (existing) {
        configInput.value = JSON.stringify(existing, null, 2);
      }
    }
  }

  handleSaveFirebaseConfig() {
    const input = document.getElementById('inputFirebaseConfigText');
    if (!input || !input.value.trim()) {
      alert('Please paste your Firebase configuration snippet or JSON.');
      return;
    }

    let configText = input.value.trim();
    let configObj = null;

    try {
      configObj = JSON.parse(configText);
    } catch (e) {
      try {
        const cleanJS = configText.replace(/const\s+firebaseConfig\s*=\s*/g, '').replace(/let\s+firebaseConfig\s*=\s*/g, '').replace(/var\s+firebaseConfig\s*=\s*/g, '').replace(/;$/, '');
        configObj = new Function(`return (${cleanJS});`)();
      } catch (err) {
        alert('Invalid configuration format. Please paste valid JSON or the firebaseConfig snippet.');
        return;
      }
    }

    if (!configObj || !configObj.apiKey) {
      alert('Configuration must include an apiKey and projectId.');
      return;
    }

    localStorage.setItem('ssvya_firebase_config', JSON.stringify(configObj));
    store.initFirebase();
    this.updateCloudStatus(store.isCloudConnected);
    this.showToast('Firebase credentials saved! Connecting to Central Cloud...', 'success');
  }

  handleDisconnectFirebase() {
    if (confirm('Disconnect from Central Cloud Database and switch to Local Storage?')) {
      localStorage.removeItem('ssvya_firebase_config');
      store.isCloudConnected = false;
      if (store.unsubscribeFirestore) {
        store.unsubscribeFirestore();
        store.unsubscribeFirestore = null;
      }
      const input = document.getElementById('inputFirebaseConfigText');
      if (input) input.value = '';
      this.updateCloudStatus(false);
      this.showToast('Cloud disconnected. Switched to offline local storage.', 'info');
    }
  }

  handleSaveNewPin() {
    const input = document.getElementById('inputNewAdminPin');
    const newPin = input ? input.value.trim() : '';
    if (newPin.length < 4) {
      alert('PIN must be at least 4 digits');
      return;
    }
    store.setAdminPin(newPin);
    if (input) input.value = '';
    this.showToast('Admin PIN updated!', 'success');
  }

  exportDataJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.state, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `ssvya_sasalmari_backup_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.showToast('Backup file downloaded to your device!', 'success');
  }

  importDataJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.members && Array.isArray(imported.members)) {
          store.state = imported;
          store.saveState();
          this.render();
          document.getElementById('modalCloudSync').style.display = 'none';
          this.showToast('Data restored successfully!', 'success');
        } else {
          alert('Invalid backup format');
        }
      } catch (err) {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  }

  resetData() {
    if (!store.currentUser || !store.currentUser.activeAdmin) return;
    if (confirm('Are you sure you want to reset all data back to default?')) {
      localStorage.removeItem(store.STORAGE_KEY);
      store.state = store.loadState();
      store.saveState();
      this.render();
      document.getElementById('modalCloudSync').style.display = 'none';
      this.showToast('Data reset to default', 'info');
    }
  }

  clearActivityLogs() {
    if (!store.currentUser || !store.currentUser.activeAdmin) return;
    if (confirm('Clear the activity history?')) {
      store.state.activityLogs = [];
      store.saveState();
      this.render();
      this.showToast('Activity logs cleared', 'info');
    }
  }

  bindEvents() {
    const searchInput = document.getElementById('inputSearchMember');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderMembers();
      });
    }

    document.querySelectorAll('.member-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.member-filter-btn').forEach(b => {
          b.classList.remove('active', 'bg-white/10', 'text-white');
          b.classList.add('bg-white/5');
        });
        const target = e.currentTarget;
        target.classList.add('active', 'bg-white/10', 'text-white');
        this.memberFilter = target.getAttribute('data-filter');
        this.renderMembers();
      });
    });
  }

  render() {
    this.updateUserHeader();
    this.updateCloudStatus(store.isCloudConnected);
    this.renderMetrics();
    this.renderMembers();
    this.renderExpenses();
    this.renderActivityLogs();
  }

  updateUserHeader() {
    const user = store.currentUser;
    if (!user) return;

    const navName = document.getElementById('navLoggedUser');
    const navBadge = document.getElementById('navUserBadge');
    const banner = document.getElementById('adminModeBanner');
    
    const adminTransferWrap = document.getElementById('adminTransferBtnWrap');
    const adminAddMemberWrap = document.getElementById('adminAddMemberBtnWrap');
    const adminRecordPayWrap = document.getElementById('adminRecordPayBtnWrap');
    const adminExpenseWrap = document.getElementById('adminExpenseBtnWrap');
    const clearLogsBtn = document.getElementById('btnClearActivityLogs');
    const resetDataBtn = document.getElementById('btnResetData');

    if (navName) navName.textContent = user.name;
    if (navBadge) {
      navBadge.textContent = user.activeAdmin ? 'Admin' : 'Member';
      navBadge.className = user.activeAdmin 
        ? 'text-[9px] px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30 font-bold'
        : 'text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-semibold';
    }

    if (user.activeAdmin) {
      if (banner) banner.style.display = 'block';
      if (adminTransferWrap) adminTransferWrap.style.display = 'block';
      if (adminAddMemberWrap) adminAddMemberWrap.style.display = 'block';
      if (adminRecordPayWrap) adminRecordPayWrap.style.display = 'block';
      if (adminExpenseWrap) adminExpenseWrap.style.display = 'block';
      if (clearLogsBtn) clearLogsBtn.style.display = 'inline-block';
      if (resetDataBtn) resetDataBtn.style.display = 'inline-block';
    } else {
      if (banner) banner.style.display = 'none';
      if (adminTransferWrap) adminTransferWrap.style.display = 'none';
      if (adminAddMemberWrap) adminAddMemberWrap.style.display = 'none';
      if (adminRecordPayWrap) adminRecordPayWrap.style.display = 'none';
      if (adminExpenseWrap) adminExpenseWrap.style.display = 'none';
      if (clearLogsBtn) clearLogsBtn.style.display = 'none';
      if (resetDataBtn) resetDataBtn.style.display = 'none';
    }

    ['expenses', 'funds', 'activity'].forEach(view => {
      const navButton = document.getElementById(`navBtn-${view}`);
      if (navButton) navButton.style.display = '';
    });
  }

  renderMetrics() {
    const m = store.getMetrics();

    const targetEl = document.getElementById('statTotalTarget');
    const targetSub = document.getElementById('statTargetSub');
    const colEl = document.getElementById('statTotalCollected');
    const colSub = document.getElementById('statCollectedSub');
    const spentEl = document.getElementById('statTotalSpent');
    const spentSub = document.getElementById('statSpentSub');
    const spentHead = document.getElementById('statTotalSpentHeading');
    const netEl = document.getElementById('statNetBalance');
    const progText = document.getElementById('progressBarPercent');
    const progFill = document.getElementById('progressBarFill');
    const upiEl = document.getElementById('statUpiTotal');
    const cashEl = document.getElementById('statCashTotal');
    const combinedEl = document.getElementById('statCombinedNet');
    
    const sidebarMemBadge = document.getElementById('sidebarMemberCountBadge');
    const sidebarExpBadge = document.getElementById('sidebarExpenseCountBadge');
    const filterAllCount = document.getElementById('countFilterAll');

    // Dashboard quick summary boxes
    const dashPaid = document.getElementById('dashCountPaid');
    const dashPartial = document.getElementById('dashCountPartial');
    const dashPending = document.getElementById('dashCountPending');
    const dashUpi = document.getElementById('dashUpiBal');
    const dashCash = document.getElementById('dashCashBal');

    if (targetEl) targetEl.textContent = `₹${m.totalTarget.toLocaleString('en-IN')}`;
    if (targetSub) targetSub.textContent = `${m.membersCount} members × ₹6,000`;
    if (colEl) colEl.textContent = `₹${m.totalCollected.toLocaleString('en-IN')}`;
    if (colSub) colSub.textContent = `${m.progressPercent}% achieved`;
    if (spentEl) spentEl.textContent = `₹${m.totalSpent.toLocaleString('en-IN')}`;
    if (spentSub) spentSub.textContent = `${m.expenseCount} bills logged`;
    if (spentHead) spentHead.textContent = `₹${m.totalSpent.toLocaleString('en-IN')}`;

    if (netEl) {
      netEl.textContent = `₹${m.netBalance.toLocaleString('en-IN')}`;
      netEl.className = m.netBalance < 0 
        ? 'text-lg sm:text-xl font-black text-rose-400 font-heading' 
        : 'text-lg sm:text-xl font-black text-gold-400 font-heading';
    }

    if (progText) progText.textContent = `${m.progressPercent}% (₹${m.totalCollected.toLocaleString('en-IN')} / ₹${m.totalTarget.toLocaleString('en-IN')})`;
    if (progFill) progFill.style.width = `${m.progressPercent}%`;

    if (upiEl) upiEl.textContent = `₹${m.upiBalance.toLocaleString('en-IN')}`;
    if (cashEl) cashEl.textContent = `₹${m.cashBalance.toLocaleString('en-IN')}`;
    if (combinedEl) combinedEl.textContent = `₹${m.netBalance.toLocaleString('en-IN')} (UPI: ₹${m.upiBalance.toLocaleString('en-IN')} + Cash: ₹${m.cashBalance.toLocaleString('en-IN')})`;

    if (sidebarMemBadge) sidebarMemBadge.textContent = m.membersCount;
    if (sidebarExpBadge) sidebarExpBadge.textContent = m.expenseCount;
    if (filterAllCount) filterAllCount.textContent = m.membersCount;

    if (dashPaid) dashPaid.textContent = m.paidCount;
    if (dashPartial) dashPartial.textContent = m.partialCount;
    if (dashPending) dashPending.textContent = m.pendingCount;
    if (dashUpi) dashUpi.textContent = `₹${m.upiBalance.toLocaleString('en-IN')}`;
    if (dashCash) dashCash.textContent = `₹${m.cashBalance.toLocaleString('en-IN')}`;
  }

  getMemberMetrics(member) {
    const paid = Number(member.paid) || 0;
    const target = Number(member.target) || 6000;
    const payments = member.payments || [];
    const upiBalance = payments.filter(p => p.mode === 'UPI').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalTarget: target,
      totalCollected: paid,
      totalSpent: 0,
      netBalance: paid,
      upiBalance,
      cashBalance: Math.max(0, paid - upiBalance),
      progressPercent: target ? Math.min(100, Math.round((paid / target) * 100)) : 0,
      paidCount: paid >= target ? 1 : 0,
      partialCount: paid > 0 && paid < target ? 1 : 0,
      pendingCount: paid === 0 ? 1 : 0,
      membersCount: 1,
      expenseCount: 0
    };
  }

  renderMembers() {
    const grid = document.getElementById('membersGrid');
    if (!grid) return;

    const isAdmin = Boolean(store.currentUser && store.currentUser.activeAdmin);
    const currentMember = store.currentUser && !store.currentUser.activeAdmin
      ? {
          id: store.currentUser.id,
          name: store.currentUser.name || 'Member',
          target: Number(store.currentUser.target) || 6000,
          paid: Number(store.currentUser.paid) || 0,
          isAdmin: false,
          payments: Array.isArray(store.currentUser.payments) ? store.currentUser.payments : []
        }
      : null;

    let list = store.state.members;

    if (this.searchQuery) {
      list = list.filter(m => m.name.toLowerCase().includes(this.searchQuery));
    }

    if (this.memberFilter === 'PAID') {
      list = list.filter(m => (m.paid || 0) >= m.target);
    } else if (this.memberFilter === 'PARTIAL') {
      list = list.filter(m => (m.paid || 0) > 0 && (m.paid || 0) < m.target);
    } else if (this.memberFilter === 'PENDING') {
      list = list.filter(m => !(m.paid || 0));
    }

    const currentMemberSummary = currentMember ? (() => {
      const paid = Number(currentMember.paid) || 0;
      const target = Number(currentMember.target) || 6000;
      const remaining = Math.max(0, target - paid);
      const isPaid = paid >= target;
      const isPartial = paid > 0 && !isPaid;
      const badgeClass = isPaid
        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
        : isPartial
          ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
          : 'bg-rose-950/60 text-rose-300 border border-rose-500/30';
      const statusLabel = isPaid ? 'Paid in Full' : isPartial ? `Partial • Remaining ₹${remaining.toLocaleString('en-IN')}` : 'Pending';

      return `
        <div class="col-span-full rounded-2xl border border-gold-500/30 bg-gradient-to-r from-gold-500/10 to-emerald-500/10 p-4 mb-3">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div class="text-[10px] uppercase tracking-[0.2em] text-gold-300 font-bold">Your contribution</div>
              <h3 class="text-lg font-black text-white mt-1">${currentMember.name}</h3>
            </div>
            <span class="text-[11px] px-2.5 py-1 rounded-full font-bold ${badgeClass}">${statusLabel}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 mt-3 text-center">
            <div class="bg-black/30 rounded-xl p-2.5 border border-white/5">
              <div class="text-[10px] text-neutral-400">Target</div>
              <div class="text-sm font-black text-white">₹${target.toLocaleString('en-IN')}</div>
            </div>
            <div class="bg-black/30 rounded-xl p-2.5 border border-white/5">
              <div class="text-[10px] text-neutral-400">Paid</div>
              <div class="text-sm font-black text-emerald-400">₹${paid.toLocaleString('en-IN')}</div>
            </div>
            <div class="bg-black/30 rounded-xl p-2.5 border border-white/5">
              <div class="text-[10px] text-neutral-400">Balance</div>
              <div class="text-sm font-black ${remaining > 0 ? 'text-rose-400' : 'text-neutral-300'}">₹${remaining.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      `;
    })() : '';

    if (list.length === 0) {
      grid.innerHTML = `
        ${currentMemberSummary}
        <div class="col-span-full py-10 text-center text-neutral-400 bg-black/30 border border-dashed border-white/10 rounded-2xl">
          <i class="fa-solid fa-user-xmark text-2xl text-neutral-500 mb-2"></i>
          <p class="text-xs">No committee members found</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = `
      ${currentMemberSummary}
      ${list.map(m => {
        const paid = Number(m.paid) || 0;
        const target = Number(m.target) || 6000;
        const remaining = Math.max(0, target - paid);
        const isPaid = paid >= target;
        const isPartial = paid > 0 && !isPaid;
        const progress = Math.min(100, Math.round((paid / target) * 100));

        let badgeHtml = '';
        if (isPaid) {
          badgeHtml = `<span class="badge-paid px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
            <i class="fa-solid fa-check"></i> Paid
          </span>`;
        } else if (isPartial) {
          badgeHtml = `<span class="badge-partial px-2 py-0.5 rounded-full text-[10px] font-bold">
            Partial (Rem: ₹${remaining.toLocaleString('en-IN')})
          </span>`;
        } else {
          badgeHtml = `<span class="badge-pending px-2 py-0.5 rounded-full text-[10px] font-bold">
            Pending
          </span>`;
        }

        const lastPayment = m.payments && m.payments.length > 0 ? m.payments[m.payments.length - 1] : null;

        return `
          <div class="festive-card rounded-2xl p-4 flex flex-col justify-between space-y-3 cursor-pointer group" onclick="window.app.showMemberDetail('${m.id}')">
            
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr ${isPaid ? 'from-emerald-600 to-teal-400' : isPartial ? 'from-amber-600 to-yellow-400' : 'from-rose-700 to-orange-500'} flex items-center justify-center text-white text-xs font-black shadow-md font-heading">
                  ${m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white group-hover:text-gold-300 transition-all flex items-center gap-1.5 font-heading">
                    <span>${m.name}</span>
                    ${m.isAdmin ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-gold-500/20 text-gold-300 border border-gold-500/30 font-semibold">Admin</span>` : ''}
                  </h4>
                  <div class="text-[10px] text-neutral-400">Target: ₹${target.toLocaleString('en-IN')}</div>
                </div>
              </div>
              ${badgeHtml}
            </div>

            <div class="space-y-1 bg-black/40 p-2 rounded-xl border border-white/5">
              <div class="flex justify-between text-[11px] font-semibold">
                <span class="text-emerald-400">Paid: ₹${paid.toLocaleString('en-IN')}</span>
                <span class="${remaining > 0 ? 'text-rose-400' : 'text-neutral-400'}">
                  ${remaining > 0 ? `Bal: ₹${remaining.toLocaleString('en-IN')}` : 'Settled'}
                </span>
              </div>
              <div class="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r ${isPaid ? 'from-emerald-500 to-teal-400' : 'from-saffron-500 to-amber-400'} rounded-full transition-all duration-500" style="width: ${progress}%"></div>
              </div>
            </div>

            <div class="flex items-center justify-between text-[10px] text-neutral-400 pt-0.5 border-t border-white/5">
              <span>
                ${lastPayment ? `<i class="fa-solid fa-clock-rotate-left mr-1 text-[9px]"></i>₹${lastPayment.amount} (${lastPayment.mode})` : 'No payments yet'}
              </span>

              ${isAdmin ? `
                <button onclick="event.stopPropagation(); window.app.openAddPaymentModal('${m.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-bold border border-emerald-500/30 text-[10px] flex items-center gap-1 transition-all cursor-pointer">
                  <i class="fa-solid fa-plus text-[9px]"></i> Pay
                </button>
              ` : `
                <span class="text-gold-400/80 text-[10px] font-medium flex items-center gap-1">
                  View <i class="fa-solid fa-chevron-right text-[8px]"></i>
                </span>
              `}
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  renderExpenses() {
    const listContainer = document.getElementById('expensesList');
    if (!listContainer) return;

    const list = store.state.expenses || [];

    if (list.length === 0) {
      listContainer.innerHTML = `
        <div class="py-12 text-center text-neutral-400 bg-black/30 border border-dashed border-white/10 rounded-2xl">
          <i class="fa-solid fa-receipt text-3xl text-neutral-500 mb-2"></i>
          <p class="text-xs font-semibold">No expenses recorded yet</p>
          ${store.currentUser && store.currentUser.activeAdmin ? `
            <button onclick="window.app.openAddExpenseModal()" class="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all">
              + Add First Expense
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    const isAdmin = Boolean(store.currentUser && store.currentUser.activeAdmin);

    listContainer.innerHTML = list.map(e => {
      return `
        <div class="festive-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div class="flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400 text-base shrink-0">
              <i class="fa-solid fa-receipt"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-white font-heading">${e.title}</h4>
                <span class="text-[10px] px-2 py-0.2 rounded-full ${e.mode === 'Cash' ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30' : 'bg-purple-950/60 text-purple-300 border border-purple-500/30'} font-semibold">${e.mode}</span>
              </div>
              <p class="text-xs text-neutral-400 mt-0.5">${e.note || 'No bill note attached'}</p>
              <div class="text-[10px] text-neutral-400 mt-1 flex items-center gap-2">
                <span>Paid by: <strong class="text-amber-300">${e.paidBy}</strong></span>
                <span>•</span>
                <span>${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
            <div class="text-right">
              <div class="text-base font-black text-rose-400 font-heading">₹${Number(e.amount).toLocaleString('en-IN')}</div>
            </div>
            ${isAdmin ? `
              <div class="flex items-center gap-1.5">
                <button onclick="window.app.openEditExpenseModal('${e.id}')" class="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gold-400 border border-white/10 text-xs transition-all cursor-pointer" title="Edit Expense">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="window.app.deleteExpense('${e.id}')" class="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/20 text-xs transition-all cursor-pointer" title="Delete Expense">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ` : ''}
          </div>

        </div>
      `;
    }).join('');
  }

  renderActivityLogs() {
    const container = document.getElementById('activityLogsContainer');
    if (!container) return;

    const logs = store.state.activityLogs || [];
    if (logs.length === 0) {
      container.innerHTML = `<div class="text-center py-8 text-xs text-neutral-400">No activity logged yet</div>`;
      return;
    }

    container.innerHTML = logs.map(l => `
      <div class="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-3 text-xs">
        <div class="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
          <i class="fa-solid fa-bolt"></i>
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <strong class="text-white font-bold text-xs">${l.action}</strong>
            <span class="text-[10px] text-neutral-400">${new Date(l.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p class="text-neutral-300 text-xs mt-0.5">${l.details}</p>
          <div class="text-[10px] text-amber-300/70 mt-1">Logged by: <strong>${l.admin}</strong></div>
        </div>
      </div>
    `).join('');
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    const bgClass = type === 'success' 
      ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200' 
      : 'bg-neutral-900/95 border-amber-500/40 text-amber-200';
    toast.className = `${bgClass} border px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-auto animate-scaleUp`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-info text-amber-400'}"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }
}

function initApp() {
  window.app = new AppUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}