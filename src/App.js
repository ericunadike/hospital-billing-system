import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2, Upload, Download, Share2, Printer, User, Hash, Settings, Edit, Save, X, Wifi, WifiOff, Lock, Eye, EyeOff, Moon, Sun, History, Menu, List, Database, FileText, Clipboard, Heart, CheckCircle, Zap, Star, TrendingUp, Sparkles, Bell, LogOut, LogIn, UserCircle, Grid, CreditCard, BarChart3, Image, UserPlus } from 'lucide-react';

const HospitalBillingSystem = () => {
  // System configuration
  const [systemConfig, setSystemConfig] = useState({
    hospitalName: 'Lagos General Hospital',
    hospitalAddress: 'Victoria Island, Lagos',
    hospitalPhone: '+234 123 456 7890',
    hospitalLogo: null,
    tagline: 'Your Health, Our Priority',
    quickAccessServices: [1, 2, 3, 4, 5, 6],
    adminPassword: 'admin123'
  });

  // UI State
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showFeedback, setShowFeedback] = useState({ visible: false, message: '', type: '', x: 0, y: 0 });

  // User authentication state
  const [user, setUser] = useState(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [userProfileImage, setUserProfileImage] = useState(null);

  // Initial services
  const initialServices = [
    { id: 1, name: 'General Consultation', price: 5000, category: 'Consultation' },
    { id: 2, name: 'Blood Test - Full Panel', price: 15000, category: 'Laboratory' },
    { id: 3, name: 'X-Ray Chest', price: 8000, category: 'Radiology' },
    { id: 4, name: 'Paracetamol 500mg', price: 200, category: 'Medication' },
    { id: 5, name: 'Private Ward (per day)', price: 25000, category: 'Accommodation' },
    { id: 6, name: 'Surgery - Appendectomy', price: 150000, category: 'Procedure' },
    { id: 7, name: 'ECG', price: 3000, category: 'Diagnostic' },
    { id: 8, name: 'Insulin Injection', price: 1500, category: 'Medication' }
  ];

  const [services, setServices] = useState(initialServices);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    id: '',
    phone: ''
  });
  const [discount, setDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showServiceManager, setShowServiceManager] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    category: ''
  });
  const [quickAdd, setQuickAdd] = useState({
    name: '',
    price: '',
    category: 'Medication'
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbStatus, setDbStatus] = useState('loading');
  
  // Transaction states
  const [savedTransactions, setSavedTransactions] = useState([]);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [searchTransaction, setSearchTransaction] = useState('');
  
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const dbRef = useRef(null);
  const sidebarRef = useRef(null);
  const userMenuRef = useRef(null);
  const categories = ['Consultation', 'Laboratory', 'Radiology', 'Medication', 'Accommodation', 'Procedure', 'Diagnostic', 'Emergency', 'Therapy', 'Surgery'];

  const subtotal = selectedServices.reduce((sum, service) => sum + (service.price * service.quantity), 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  // Add Enter key login functionality
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter' && showLoginDialog) {
        handleLogin();
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [showLoginDialog, loginUsername, loginPassword]);

  // Click outside sidebar to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target) && 
          !event.target.closest('.menu-icon-button')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, showUserMenu]);

  // Show feedback message with position
  const showFeedbackMessage = (message, type = 'success', event = null) => {
    let x = window.innerWidth / 2;
    let y = 100;
    
    if (event) {
      const rect = event.target.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top - 10;
    }
    
    setShowFeedback({ visible: true, message, type, x, y });
    setTimeout(() => setShowFeedback({ visible: false, message: '', type: '', x: 0, y: 0 }), 3000);
  };

  const initializeDB = useCallback(async () => {
    try {
      const request = indexedDB.open('HospitalBillingDB', 3);
      
      request.onerror = () => {
        console.error('Database failed to open');
        setDbStatus('error');
      };
      
      request.onsuccess = () => {
        dbRef.current = request.result;
        setDbStatus('ready');
        loadServicesFromDB();
        loadTransactionsFromDB();
        loadConfigFromDB();
        loadUsersFromDB();
      };
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        if (!db.objectStoreNames.contains('services')) {
          const servicesStore = db.createObjectStore('services', { keyPath: 'id' });
          servicesStore.createIndex('name', 'name', { unique: false });
          servicesStore.createIndex('category', 'category', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
          transactionsStore.createIndex('date', 'date', { unique: false });
          transactionsStore.createIndex('patientId', 'patientId', { unique: false });
          transactionsStore.createIndex('patientName', 'patientName', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'username' });
          usersStore.createIndex('username', 'username', { unique: true });
        }
      };
    } catch (error) {
      console.error('Error initializing database:', error);
      setDbStatus('error');
    }
  }, []);

  // IndexedDB Setup
  useEffect(() => {
    initializeDB();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initializeDB]);

  const loadServicesFromDB = async () => {
    try {
      const transaction = dbRef.current.transaction(['services'], 'readonly');
      const store = transaction.objectStore('services');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const savedServices = request.result;
        if (savedServices.length > 0) {
          setServices(savedServices);
        } else {
          saveServicesToDB(initialServices);
        }
        setDbStatus('ready');
      };
      
      request.onerror = () => {
        console.error('Error loading services from database');
        setDbStatus('error');
      };
    } catch (error) {
      console.error('Error loading services:', error);
      setDbStatus('error');
    }
  };

  const loadTransactionsFromDB = async () => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const request = store.getAll();
      
      request.onsuccess = () => {
        setSavedTransactions(request.result.reverse());
      };
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadConfigFromDB = async () => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction(['config'], 'readonly');
      const store = transaction.objectStore('config');
      const request = store.get('systemConfig');
      
      request.onsuccess = () => {
        if (request.result) {
          setSystemConfig(request.result.value);
        }
      };
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadUsersFromDB = async () => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();
      
      request.onsuccess = () => {
        setUsers(request.result);
      };
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const saveConfigToDB = async (config) => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction(['config'], 'readwrite');
      const store = transaction.objectStore('config');
      await store.put({ key: 'systemConfig', value: config });
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const saveServicesToDB = async (servicesToSave) => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction(['services'], 'readwrite');
      const store = transaction.objectStore('services');
      
      await store.clear();
      
      servicesToSave.forEach(service => {
        store.add(service);
      });
      
      transaction.oncomplete = () => {
        console.log('Services saved to database');
      };
      
      transaction.onerror = () => {
        console.error('Error saving services to database');
      };
    } catch (error) {
      console.error('Error saving services:', error);
    }
  };

  const saveUserToDB = async (userData) => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      await store.put(userData);
      
      loadUsersFromDB();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const saveTransactionToDB = async (transactionData) => {
    if (!dbRef.current) return null;
    
    try {
      const transaction = dbRef.current.transaction(['transactions'], 'readwrite');
      const store = transaction.objectStore('transactions');
      
      const transactionRecord = {
        ...transactionData,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        patientName: patientInfo.name || 'Walk-in Patient'
      };
      
      const request = store.add(transactionRecord);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          loadTransactionsFromDB();
          resolve(request.result);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error saving transaction:', error);
      return null;
    }
  };

  const authenticateUser = () => {
    if (passwordAttempt === systemConfig.adminPassword) {
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
      setPasswordAttempt('');
      
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      alert('Incorrect password. Access denied.');
      setPasswordAttempt('');
    }
  };

  const requireAuth = (action) => {
    if (isAuthenticated) {
      action();
    } else {
      setPendingAction(() => action);
      setShowPasswordDialog(true);
    }
  };

  // User authentication functions
  const handleLogin = () => {
    const user = users.find(u => u.username === loginUsername && u.password === loginPassword);
    if (user) {
      setUser(user);
      setEditUsername(user.username);
      setUserProfileImage(user.profileImage || null);
      setShowLoginDialog(false);
      setLoginUsername('');
      setLoginPassword('');
      showFeedbackMessage(`Welcome back, ${user.username}!`, 'success');
    } else {
      alert('Invalid username or password');
    }
  };

  const handleRegister = () => {
    if (registerPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (users.some(u => u.username === registerUsername)) {
      alert('Username already exists');
      return;
    }
    
    const newUser = {
      username: registerUsername,
      password: registerPassword,
      createdAt: new Date().toISOString()
    };
    
    saveUserToDB(newUser);
    setUser(newUser);
    setEditUsername(newUser.username);
    setShowRegisterDialog(false);
    setRegisterUsername('');
    setRegisterPassword('');
    setConfirmPassword('');
    showFeedbackMessage(`Account created for ${newUser.username}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    showFeedbackMessage('Logged out successfully', 'success');
  };

  const handleProfileUpdate = () => {
    if (!editUsername.trim()) {
      alert('Username cannot be empty');
      return;
    }
    
    const updatedUser = {
      ...user,
      username: editUsername,
      profileImage: userProfileImage
    };
    
    saveUserToDB(updatedUser);
    setUser(updatedUser);
    setShowEditProfile(false);
    showFeedbackMessage('Profile updated successfully!', 'success');
  };

  const handleProfileImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Profile image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUserProfileImage(e.target.result);
      showFeedbackMessage('Profile image updated!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = savedTransactions.filter(transaction =>
    transaction.patientName.toLowerCase().includes(searchTransaction.toLowerCase()) ||
    (transaction.patientInfo?.id || '').toLowerCase().includes(searchTransaction.toLowerCase())
  );

  const addService = (service, event) => {
    const existing = selectedServices.find(s => s.id === service.id);
    if (existing) {
      setSelectedServices(selectedServices.map(s =>
        s.id === service.id ? { ...s, quantity: s.quantity + 1 } : s
      ));
    } else {
      setSelectedServices([...selectedServices, { ...service, quantity: 1 }]);
    }
    setSearchTerm('');
    showFeedbackMessage(`Added ${service.name}! ✨`, 'success', event);
  };

  const addQuickService = (event) => {
    if (!quickAdd.name || !quickAdd.price) {
      alert('Please enter both name and price');
      return;
    }
    
    const customService = {
      id: `custom-${Date.now()}`,
      name: quickAdd.name,
      price: Number(quickAdd.price),
      category: quickAdd.category,
      isCustom: true,
      quantity: 1
    };
    
    setSelectedServices([...selectedServices, customService]);
    setQuickAdd({ name: '', price: '', category: 'Medication' });
    showFeedbackMessage(`Quick add successful! 🚀`, 'success', event);
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeService(id);
    } else {
      setSelectedServices(selectedServices.map(s =>
        s.id === id ? { ...s, quantity } : s
      ));
    }
  };

  const removeService = (id, event) => {
    setSelectedServices(selectedServices.filter(s => s.id !== id));
    showFeedbackMessage('Service removed! 🗑️', 'success', event);
  };

  const generateInvoiceNumber = () => {
    return `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const saveCurrentTransaction = async (event) => {
    if (selectedServices.length === 0) {
      alert('Please add services to save the transaction');
      return;
    }

    const transactionData = {
      id: currentTransactionId || Date.now(),
      invoiceNumber: generateInvoiceNumber(),
      patientInfo,
      services: selectedServices,
      subtotal,
      discount,
      discountAmount,
      total,
      status: 'saved'
    };

    if (currentTransactionId) {
      const updatedTransactions = savedTransactions.map(t => 
        t.id === currentTransactionId ? transactionData : t
      );
      setSavedTransactions(updatedTransactions);
    } else {
      setCurrentTransactionId(transactionData.id);
      await saveTransactionToDB(transactionData);
    }

    showFeedbackMessage('Transaction saved! 💾', 'success', event);
  };

  const loadTransaction = (transaction, event) => {
    setPatientInfo(transaction.patientInfo);
    setSelectedServices(transaction.services);
    setDiscount(transaction.discount);
    setCurrentTransactionId(transaction.id);
    showFeedbackMessage('Transaction loaded! 📋', 'success', event);
  };

  const clearCurrentTransaction = (event) => {
    setPatientInfo({ name: '', id: '', phone: '' });
    setSelectedServices([]);
    setDiscount(0);
    setCurrentTransactionId(null);
    showFeedbackMessage('Ready for new transaction! 🆕', 'success', event);
  };

  const addNewService = async (event) => {
    if (!newService.name || !newService.price || !newService.category) {
      alert('Please fill all fields');
      return;
    }
    
    const service = {
      id: Date.now(),
      name: newService.name,
      price: Number(newService.price),
      category: newService.category
    };
    
    const updatedServices = [...services, service];
    setServices(updatedServices);
    await saveServicesToDB(updatedServices);
    
    setNewService({ name: '', price: '', category: '' });
    showFeedbackMessage('New service added! 🎉', 'success', event);
  };

  const deleteService = async (id, event) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const updatedServices = services.filter(s => s.id !== id);
      setServices(updatedServices);
      setSelectedServices(selectedServices.filter(s => s.id !== id));
      await saveServicesToDB(updatedServices);
      showFeedbackMessage('Service deleted! 🗑️', 'success', event);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      
      try {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('service'));
        const priceIndex = headers.findIndex(h => h.includes('price') || h.includes('cost'));
        const categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('type'));
        
        if (nameIndex === -1 || priceIndex === -1) {
          alert('CSV must contain at least "name" and "price" columns');
          return;
        }
        
        const newServices = [];
        const existingNames = services.map(s => s.name.toLowerCase());
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim());
          if (values.length < 2) continue;
          
          const serviceName = values[nameIndex]?.replace(/"/g, '');
          const servicePrice = parseFloat(values[priceIndex]?.replace(/"/g, ''));
          const serviceCategory = categoryIndex >= 0 ? values[categoryIndex]?.replace(/"/g, '') : 'General';
          
          if (serviceName && !isNaN(servicePrice) && !existingNames.includes(serviceName.toLowerCase())) {
            newServices.push({
              id: Date.now() + i,
              name: serviceName,
              price: servicePrice,
              category: serviceCategory || 'General'
            });
          }
        }
        
        if (newServices.length > 0) {
          const updatedServices = [...services, ...newServices];
          setServices(updatedServices);
          await saveServicesToDB(updatedServices);
          showFeedbackMessage(`Successfully imported ${newServices.length} services! 📊`, 'success', event);
        } else {
          alert('No new services found in the file (duplicates were skipped)');
        }
      } catch (error) {
        alert('Error parsing file. Please ensure it is a valid CSV format.');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newConfig = { ...systemConfig, hospitalLogo: e.target.result };
      setSystemConfig(newConfig);
      saveConfigToDB(newConfig);
      showFeedbackMessage('Logo updated! 🏥', 'success', event);
    };
    reader.readAsDataURL(file);
  };

  const exportServices = (event) => {
    const csvContent = [
      'Name,Price,Category',
      ...services.map(s => `"${s.name}",${s.price},"${s.category}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hospital_services.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showFeedbackMessage('Services exported! 📤', 'success', event);
  };

  const generateReceipt = async (event) => {
    if (selectedServices.length === 0) {
      alert('Please add services before generating a receipt');
      return;
    }
    
    const receiptData = {
      invoiceNumber: generateInvoiceNumber(),
      patientInfo,
      services: selectedServices,
      subtotal,
      discount,
      discountAmount,
      total,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      status: 'completed'
    };
    
    await saveTransactionToDB(receiptData);
    setShowReceipt(true);
    showFeedbackMessage('Receipt generated! 🧾', 'success', event);
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    const receiptContent = document.getElementById('receipt-content').innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
            .text-center { text-align: center; }
            .text-sm { font-size: 12px; }
            .font-bold { font-weight: bold; }
            .mb-4 { margin-bottom: 16px; }
            .py-3 { padding: 12px 0; }
            .border-t, .border-b { border-top: 1px solid #000; border-bottom: 1px solid #000; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .pt-2 { padding-top: 8px; }
            .service-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .service-table th { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
            .service-table td { padding: 8px; border-bottom: 1px solid #eee; }
            .service-table th:nth-child(2), .service-table td:nth-child(2) { text-align: center; }
            .service-table th:nth-child(3), .service-table td:nth-child(3) { text-align: right; }
            .logo-img { max-height: 80px; width: auto; margin: 0 auto; display: block; }
          </style>
        </head>
        <body>
          ${receiptContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const shareReceipt = () => {
    const receiptText = `
${systemConfig.hospitalName}
${systemConfig.hospitalAddress}
Tel: ${systemConfig.hospitalPhone}

Invoice #: ${generateInvoiceNumber()}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Patient: ${patientInfo.name || 'Walk-in Patient'}
ID: ${patientInfo.id || 'N/A'}
Phone: ${patientInfo.phone || 'N/A'}

SERVICES:
${selectedServices.map(s => `${s.name} x${s.quantity} - ${formatCurrency(s.price * s.quantity)}`).join('\n')}

Subtotal: ${formatCurrency(subtotal)}
${discount > 0 ? `Discount (${discount}%): -${formatCurrency(discountAmount)}` : ''}
TOTAL: ${formatCurrency(total)}

${systemConfig.tagline}
    `;

    if (navigator.share) {
      navigator.share({
        title: `Receipt from ${systemConfig.hospitalName}`,
        text: receiptText,
        url: window.location.href,
      })
      .catch(() => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(receiptText)}`;
        window.open(whatsappUrl, '_blank');
      });
    } else {
      const shareOptions = document.createElement('div');
      shareOptions.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000;">
          <h3>Share Receipt</h3>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button onclick="window.open('https://wa.me/?text=${encodeURIComponent(receiptText)}', '_blank'); this.parentElement.parentElement.parentElement.remove();" style="padding: 10px 15px; background: #25D366; color: white; border: none; border-radius: 4px; cursor: pointer;">WhatsApp</button>
            <button onclick="window.open('mailto:?subject=Receipt from ${systemConfig.hospitalName}&body=${encodeURIComponent(receiptText)}', '_blank'); this.parentElement.parentElement.parentElement.remove();" style="padding: 10px 15px; background: #0066CC; color: white; border: none; border-radius: 4px; cursor: pointer;">Email</button>
            <button onclick="this.parentElement.parentElement.parentElement.remove();" style="padding: 10px 15px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
          </div>
        </div>
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;" onclick="this.parentElement.remove();"></div>
      `;
      document.body.appendChild(shareOptions);
    }
  };

  const downloadReceipt = () => {
    const receiptHTML = document.getElementById('receipt-content').innerHTML;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${generateInvoiceNumber()}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
            .text-center { text-align: center; }
            .text-sm { font-size: 12px; }
            .font-bold { font-weight: bold; }
            .mb-4 { margin-bottom: 16px; }
            .py-3 { padding: 12px 0; }
            .border-t, .border-b { border-top: 1px solid #000; border-bottom: 1px solid #000; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .pt-2 { padding-top: 8px; }
            .service-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .service-table th { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
            .service-table td { padding: 8px; border-bottom: 1px solid #eee; }
            .service-table th:nth-child(2), .service-table td:nth-child(2) { text-align: center; }
            .service-table th:nth-child(3), .service-table td:nth-child(3) { text-align: right; }
            .logo-img { max-height: 80px; width: auto; margin: 0 auto; display: block; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${receiptHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Fixed: Updated handleSidebarAction to ensure all menu items work
  const handleSidebarAction = (action, event) => {
    switch(action) {
      case 'manageServices':
        requireAuth(() => setShowServiceManager(true));
        break;
      case 'importCSV':
        requireAuth(() => fileInputRef.current?.click());
        break;
      case 'exportServices':
        exportServices(event);
        break;
      case 'transactionHistory':
        requireAuth(() => setShowTransactionHistory(true));
        break;
      case 'systemSettings':
        requireAuth(() => setShowSettings(true));
        break;
      default:
        break;
    }
    setSidebarOpen(false);
  };

  // Theme classes
  const themeClasses = darkMode 
    ? 'dark bg-[#0d1117] text-[#f0f6fc]' 
    : 'bg-[#ffffff] text-[#24292f]';
    
  const cardClasses = darkMode 
    ? 'bg-[#161b22] border-[#30363d] shadow-xl' 
    : 'bg-white border-[#d0d7de] shadow-sm';
    
  const inputClasses = darkMode 
    ? 'bg-[#0d1117] border-[#30363d] text-[#f0f6fc] placeholder-[#7d8590] focus:border-[#1f6feb] focus:ring-[#1f6feb]' 
    : 'bg-[#ffffff] border-[#d0d7de] text-[#24292f] placeholder-[#656d76] focus:border-[#0969da] focus:ring-[#0969da]';

  const quickAccessServices = services.filter(s => systemConfig.quickAccessServices.includes(s.id));

  // Custom minimalistic menu icon component
  const MenuIcon = () => (
    <div className="flex flex-col space-y-1 w-5 h-5 justify-center">
      <div className="w-full h-0.5 bg-current"></div>
      <div className="w-full h-0.5 bg-current"></div>
      <div className="w-3/4 h-0.5 bg-current ml-auto"></div>
    </div>
  );

  // If user is not logged in, show login page
  if (!user) {
    return (
      <div className={`min-h-screen ${themeClasses} transition-all duration-300 flex items-center justify-center p-4`}>
        {/* Animated Feedback Notification */}
        {showFeedback.visible && (
          <div 
            className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ left: showFeedback.x, top: showFeedback.y }}
          >
            <div className={`px-4 py-2 rounded-lg shadow-lg transform transition-all duration-500 animate-bounce ${
              showFeedback.type === 'success' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
            }`}>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">{showFeedback.message}</span>
              </div>
            </div>
          </div>
        )}

        {/* Login Page */}
        <div className={`rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl flex ${darkMode ? 'bg-[#161b22] border border-[#30363d]' : 'bg-white border border-[#d0d7de]'}`}>
          {/* Left Side - Branding */}
          <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 flex-col justify-between text-white">
            <div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold mb-4">{systemConfig.hospitalName}</h1>
              <p className="text-blue-100">{systemConfig.tagline}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Secure Authentication</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Easy Billing System</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full md:w-3/5 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
              <p className={`${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>Sign in to your account</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputClasses}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputClasses} pr-14`}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-3.5 transition-colors ${
                      darkMode ? 'text-[#7d8590] hover:text-[#f0f6fc]' : 'text-[#656d76] hover:text-[#24292f]'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium hover:scale-105"
              >
                Sign In
              </button>
              
              <div className="text-center">
                <button
                  onClick={() => {
                    setShowLoginDialog(false);
                    setShowRegisterDialog(true);
                  }}
                  className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  Don't have an account? Register now
                </button>
              </div>
            </div>

            <div className={`mt-8 pt-6 border-t text-center ${darkMode ? 'border-[#30363d] text-[#7d8590]' : 'border-[#d0d7de] text-[#656d76]'}`}>
              <p className="text-sm">© 2023 {systemConfig.hospitalName}. All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Register Dialog */}
        {showRegisterDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`${cardClasses} rounded-2xl max-w-md w-full p-8 border shadow-2xl`}>
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">Create Account</h2>
              <p className={`text-sm text-center mb-8 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                Create a new user account
              </p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${inputClasses}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Choose a password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${inputClasses} pr-14`}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-3.5 transition-colors ${
                        darkMode ? 'text-[#7d8590] hover:text-[#f0f6fc]' : 'text-[#656d76] hover:text-[#24292f]'
                      }`}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${inputClasses}`}
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowRegisterDialog(false);
                    setRegisterUsername('');
                    setRegisterPassword('');
                    setConfirmPassword('');
                  }}
                  className={`flex-1 px-6 py-3 border rounded-xl transition-all hover:scale-105 ${
                    darkMode ? 'border-[#30363d] hover:bg-[#21262d]' : 'border-[#d0d7de] hover:bg-[#f3f4f6]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegister}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium hover:scale-105"
                  disabled={!registerUsername || !registerPassword || registerPassword !== confirmPassword}
                >
                  Register
                </button>
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setShowRegisterDialog(false);
                    setShowLoginDialog(true);
                  }}
                  className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  Already have an account? Login
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses} transition-all duration-300 flex relative`}>
      {/* Animated Feedback Notification */}
      {showFeedback.visible && (
        <div 
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: showFeedback.x, top: showFeedback.y }}
        >
          <div className={`px-4 py-2 rounded-lg shadow-lg transform transition-all duration-500 animate-bounce ${
            showFeedback.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">{showFeedback.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 h-16 ${darkMode ? 'bg-[#0d1117] border-b border-[#30363d]' : 'bg-white border-b border-[#d0d7de]'} shadow-md flex items-center justify-between px-4`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`menu-icon-button p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              darkMode 
                ? 'text-[#f0f6fc] hover:bg-[#21262d]' 
                : 'text-[#24292f] hover:bg-[#f6f8fa]'
            }`}
          >
            <MenuIcon />
          </button>
          
          <div className="flex items-center space-x-3">
            {systemConfig.hospitalLogo ? (
              <img src={systemConfig.hospitalLogo} alt="Logo" className="w-10 h-10 object-contain rounded-full ring-2 ring-blue-500/20" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                H
              </div>
            )}
            <div>
              <h3 className="font-semibold text-sm">{systemConfig.hospitalName}</h3>
              <p className={`text-xs ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>{systemConfig.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${darkMode ? 'bg-[#0d1117] border-r border-[#30363d]' : 'bg-[#f6f8fa] border-r border-[#d0d7de]'} shadow-xl rounded-tr-3xl`}
        style={{ top: '4rem', height: 'calc(100vh - 4rem)' }} // Fixed: Align with search section
      >
        <div className="flex-1 overflow-y-auto p-4 pt-6">
          <nav className="space-y-2">
            <button
              onClick={(e) => handleSidebarAction('manageServices', e)}
              className={`menu-item group flex items-center w-full p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                darkMode 
                  ? 'text-[#f0f6fc] hover:bg-[#21262d] hover:text-white' 
                  : 'text-[#24292f] hover:bg-[#f3f4f6] hover:text-[#0969da]'
              }`}
            >
              <List className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              <span>Manage Services</span>
              <Zap className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button
              onClick={(e) => handleSidebarAction('importCSV', e)}
              className={`menu-item group flex items-center w-full p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                darkMode 
                  ? 'text-[#f0f6fc] hover:bg-[#21262d] hover:text-white' 
                  : 'text-[#24292f] hover:bg-[#f3f4f6] hover:text-[#0969da]'
              }`}
            >
              <Download className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              <span>Import CSV</span>
              <Star className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button
              onClick={(e) => handleSidebarAction('exportServices', e)}
              className={`menu-item group flex items-center w-full p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                darkMode 
                  ? 'text-[#f0f6fc] hover:bg-[#21262d] hover:text-white' 
                  : 'text-[#24292f] hover:bg-[#f3f4f6] hover:text-[#0969da]'
              }`}
            >
              <Upload className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              <span>Export Services</span>
              <TrendingUp className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button
              onClick={(e) => handleSidebarAction('transactionHistory', e)}
              className={`menu-item group flex items-center w-full p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                darkMode 
                  ? 'text-[#f0f6fc] hover:bg-[#21262d] hover:text-white' 
                  : 'text-[#24292f] hover:bg-[#f3f4f6] hover:text-[#0969da]'
              }`}
            >
              <History className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              <span>Transaction History</span>
              <Bell className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button
              onClick={(e) => handleSidebarAction('systemSettings', e)}
              className={`menu-item group flex items-center w-full p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                darkMode 
                  ? 'text-[#f0f6fc] hover:bg-[#21262d] hover:text-white' 
                  : 'text-[#24292f] hover:bg-[#f3f4f6] hover:text-[#0969da]'
              }`}
            >
              <Settings className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              <span>System Settings</span>
              <Sparkles className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </nav>
          
          <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`menu-item group flex items-center w-full p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                darkMode 
                  ? 'text-[#f0f6fc] hover:bg-[#21262d] hover:text-white' 
                  : 'text-[#24292f] hover:bg-[#f3f4f6] hover:text-[#0969da]'
              }`}
            >
              {darkMode ? (
                <>
                  <Sun className="w-5 h-5 mr-3 transition-transform group-hover:rotate-90" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 mr-3 transition-transform group-hover:rotate-12" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            
            <button
              onClick={(e) => clearCurrentTransaction(e)}
              className={`menu-item group flex items-center w-full p-3 rounded-lg text-sm font-medium transition-all duration-200 mt-2 ${
                darkMode 
                  ? 'text-[#f85149] hover:bg-[#21262d]' 
                  : 'text-[#cf222e] hover:bg-[#f3f4f6]'
              }`}
            >
              <X className="w-5 h-5 mr-3 transition-transform group-hover:rotate-90" />
              <span>Clear Transaction</span>
            </button>
          </div>
          
          {/* Status indicators at bottom */}
          <div className={`mt-8 p-4 rounded-lg ${darkMode ? 'bg-[#21262d]' : 'bg-[#f3f4f6]'}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className={`${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>Connection</span>
                <div className={`flex items-center space-x-1 ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={`${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>Database</span>
                <div className={`flex items-center space-x-1 ${
                  dbStatus === 'ready' ? 'text-green-500' :
                  dbStatus === 'loading' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  <Database className="w-3 h-3" />
                  <span className="capitalize">{dbStatus}</span>
                </div>
              </div>
              
              {savedTransactions.length > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className={`${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>Transactions</span>
                  <span className="text-blue-500">{savedTransactions.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User profile at bottom */}
        <div className="p-4 border-t border-[#30363d]">
          <div className="flex items-center space-x-3">
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600"
              >
                {userProfileImage ? (
                  <img src={userProfileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-6 h-6" />
                )}
              </button>
              
              {showUserMenu && (
                <div className={`absolute bottom-full left-0 transform -translate-y-2 mb-2 w-48 rounded-lg shadow-xl z-50 ${
                  darkMode ? 'bg-[#161b22] border border-[#30363d]' : 'bg-white border border-[#d0d7de]'
                }`}>
                  <div className="p-4 border-b border-[#30363d]">
                    <p className="font-medium">{user.username}</p>
                    <p className={`text-sm ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>Hospital Staff</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowEditProfile(true);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                        darkMode ? 'hover:bg-[#21262d]' : 'hover:bg-[#f3f4f6]'
                      }`}
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                        darkMode ? 'hover:bg-[#21262d] text-red-500' : 'hover:bg-[#f3f4f6] text-red-600'
                      }`}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{user.username}</p>
              <p className={`text-xs ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>Hospital Staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'} mt-16`}>
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <header className={`${cardClasses} rounded-xl p-6 mb-6 border relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            
            {/* Patient Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative group">
                <User className={`absolute left-3 top-3 h-5 w-5 transition-colors ${
                  darkMode ? 'text-[#7d8590] group-focus-within:text-[#1f6feb]' : 'text-[#656d76] group-focus-within:text-[#0969da]'
                }`} />
                <input
                  type="text"
                  placeholder="Patient Name"
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-opacity-20 ${inputClasses}`}
                />
              </div>
              <div className="relative group">
                <Hash className={`absolute left-3 top-3 h-5 w-5 transition-colors ${
                  darkMode ? 'text-[#7d8590] group-focus-within:text-[#1f6feb]' : 'text-[#656d76] group-focus-within:text-[#0969da]'
                }`} />
                <input
                  type="text"
                  placeholder="Patient ID"
                  value={patientInfo.id}
                  onChange={(e) => setPatientInfo({...patientInfo, id: e.target.value})}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-opacity-20 ${inputClasses}`}
                />
              </div>
              <input
                type="text"
                placeholder="Phone Number"
                value={patientInfo.phone}
                onChange={(e) => setPatientInfo({...patientInfo, phone: e.target.value})}
                className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-opacity-20 ${inputClasses}`}
              />
            </div>

            {/* Search Bar */}
            <div className="relative group">
              <Search className={`absolute left-4 top-4 h-5 w-5 transition-colors ${
                darkMode ? 'text-[#7d8590] group-focus-within:text-[#1f6feb]' : 'text-[#656d76] group-focus-within:text-[#0969da]'
              }`} />
              <input
                type="text"
                placeholder="Search for services (e.g., blood test, consultation, medication...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 border rounded-xl text-lg transition-all duration-200 focus:ring-2 focus:ring-opacity-20 focus:scale-[1.02] ${inputClasses}`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-4 top-4 p-1 rounded-full transition-colors ${
                    darkMode ? 'text-[#7d8590] hover:text-[#f0f6fc]' : 'text-[#656d76] hover:text-[#24292f]'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Services */}
            <div className="space-y-6">
              {/* Search Results */}
              {searchTerm && (
                <div className={`${cardClasses} rounded-xl p-6 border`}>
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Search className="w-5 h-5 mr-2 text-blue-500" />
                    Search Results ({filteredServices.length}):
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredServices.map(service => (
                      <div
                        key={service.id}
                        className={`group flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] border ${
                          darkMode 
                            ? 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] hover:border-[#1f6feb]' 
                            : 'bg-[#f6f8fa] hover:bg-white border-[#d0d7de] hover:border-[#0969da] hover:shadow-md'
                        }`}
                        onClick={(e) => addService(service, e)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className={`text-sm ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>{service.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">{formatCurrency(service.price)}</p>
                          <Plus className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                        </div>
                      </div>
                    ))}
                    {filteredServices.length === 0 && (
                      <p className={`text-center py-8 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>No services found</p>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Access */}
              <div className={`${cardClasses} rounded-xl p-6 border`}>
                <h3 className="font-semibold mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                  Quick Access:
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {quickAccessServices.slice(0, 6).map(service => (
                    <button
                      key={service.id}
                      onClick={(e) => addService(service, e)}
                      className={`group p-4 text-left rounded-lg transition-all duration-200 hover:scale-105 border ${
                        darkMode 
                          ? 'bg-gradient-to-br from-[#0d1117] to-[#21262d] hover:from-[#21262d] hover:to-[#30363d] border-[#30363d]' 
                          : 'bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200'
                      }`}
                    >
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-xs text-blue-600 font-semibold">{formatCurrency(service.price)}</p>
                      <div className="flex justify-end mt-2">
                        <Plus className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Current Bill */}
            <div className={`${cardClasses} rounded-xl p-6 border`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Current Bill
                </h3>
                <div className="flex items-center space-x-2">
                  {currentTransactionId && (
                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                      Saved
                    </span>
                  )}
                </div>
              </div>
              
              {/* Quick Add Section */}
              <div className={`rounded-xl p-5 mb-6 border ${
                darkMode 
                  ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-800/30' 
                  : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
              }`}>
                <h4 className="font-medium text-green-600 mb-2 flex items-center">
                  <Plus className="w-4 h-4 mr-1" />
                  Quick Add Line Item
                </h4>
                <p className={`text-sm mb-4 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                  Add custom services like "Pharmacy Drugs" with total price
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Service name"
                    value={quickAdd.name}
                    onChange={(e) => setQuickAdd({...quickAdd, name: e.target.value})}
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all ${
                      darkMode ? 'bg-[#0d1117] border-[#30363d] text-white' : 'bg-white border-green-300 text-gray-900'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Price (₦)"
                    value={quickAdd.price}
                    onChange={(e) => setQuickAdd({...quickAdd, price: e.target.value})}
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all ${
                      darkMode ? 'bg-[#0d1117] border-[#30363d] text-white' : 'bg-white border-green-300 text-gray-900'
                    }`}
                  />
                  <select
                    value={quickAdd.category}
                    onChange={(e) => setQuickAdd({...quickAdd, category: e.target.value})}
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all ${
                      darkMode ? 'bg-[#0d1117] border-[#30363d] text-white' : 'bg-white border-green-300 text-gray-900'
                    }`}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={(e) => addQuickService(e)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center text-sm font-medium hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>
              
              {/* Bill Items */}
              {selectedServices.length === 0 ? (
                <div className={`text-center py-12 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                  <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No services added yet</p>
                  <p className="text-sm">Search and add services or use Quick Add above</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedServices.map(service => (
                    <div key={service.id} className={`group flex items-center justify-between py-4 px-4 rounded-lg border-l-4 border-blue-500 transition-all hover:scale-[1.01] ${
                      darkMode ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium truncate">{service.name}</p>
                          {service.isCustom && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                          {formatCurrency(service.price)} {service.isCustom ? 'total' : 'each'}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {!service.isCustom && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(service.id, service.quantity - 1)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                                darkMode ? 'bg-[#21262d] hover:bg-[#30363d] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                              }`}
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium text-lg">{service.quantity}</span>
                            <button
                              onClick={() => updateQuantity(service.id, service.quantity + 1)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                                darkMode ? 'bg-[#21262d] hover:bg-[#30363d] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                              }`}
                            >
                              +
                            </button>
                          </div>
                        )}
                        
                        <div className="text-right min-w-0">
                          <p className="font-bold text-lg text-blue-600">{formatCurrency(service.price * service.quantity)}</p>
                        </div>
                        
                        <button
                          onClick={(e) => removeService(service.id, e)}
                          className="text-red-500 hover:text-red-700 p-1 transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Totals Section */}
                  <div className={`mt-6 p-5 rounded-xl border ${
                    darkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d                    border-[#d0d7de]'
                  }`}>
                    <div className="flex items-center space-x-4 mb-4">
                      <label className="text-sm font-medium">Discount (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
                        className={`w-20 px-3 py-2 border rounded-lg ${inputClasses}`}
                      />
                    </div>
                    
                    <div className={`space-y-3 pt-4 border-t ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount ({discount}%):</span>
                          <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      
                      <div className={`flex justify-between font-bold text-2xl pt-3 border-t ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                        <span>Total:</span>
                        <span className="text-blue-600">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-6">
                    <button
                      onClick={(e) => saveCurrentTransaction(e)}
                      className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 font-medium shadow-lg hover:shadow-xl"
                      title="Save Transaction"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={(e) => generateReceipt(e)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center font-medium text-lg shadow-lg hover:shadow-xl"
                    >
                      <Printer className="w-6 h-6 mr-2" />
                      Generate Receipt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Service Manager Modal */}
          {showServiceManager && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className={`${cardClasses} rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border shadow-2xl`}>
                <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                  <h2 className="text-2xl font-bold flex items-center">
                    <List className="w-7 h-7 mr-3 text-blue-500" />
                    Service Manager
                  </h2>
                  <button
                    onClick={() => setShowServiceManager(false)}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${
                      darkMode ? 'text-[#7d8590] hover:text-white hover:bg-[#21262d]' : 'text-[#656d76] hover:text-black hover:bg-[#f3f4f6]'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Add New Service Form */}
                    <div className={`${cardClasses} p-6 rounded-xl border`}>
                      <h3 className="font-semibold mb-4 flex items-center">
                        <Plus className="w-5 h-5 mr-2 text-green-500" />
                        Add New Service
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="Service Name"
                          value={newService.name}
                          onChange={(e) => setNewService({...newService, name: e.target.value})}
                          className={`px-4 py-3 border rounded-lg ${inputClasses}`}
                        />
                        <input
                          type="number"
                          placeholder="Price (₦)"
                          value={newService.price}
                          onChange={(e) => setNewService({...newService, price: e.target.value})}
                          className={`px-4 py-3 border rounded-lg ${inputClasses}`}
                        />
                        <select
                          value={newService.category}
                          onChange={(e) => setNewService({...newService, category: e.target.value})}
                          className={`px-4 py-3 border rounded-lg ${inputClasses}`}
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={(e) => addNewService(e)}
                        className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium hover:scale-105"
                        disabled={!newService.name || !newService.price || !newService.category}
                      >
                        Add Service
                      </button>
                    </div>

                    {/* Services List */}
                    <div className={`${cardClasses} rounded-xl border`}>
                      <div className="p-6 border-b ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}">
                        <h3 className="font-semibold mb-2">All Services ({services.length})</h3>
                        <p className={`text-sm ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>Manage your hospital services</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className={`${darkMode ? 'bg-[#21262d]' : 'bg-gray-50'}`}>
                            <tr>
                              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-[#f0f6fc]' : 'text-gray-500'}`}>Name</th>
                              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-[#f0f6fc]' : 'text-gray-500'}`}>Category</th>
                              <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-[#f0f6fc]' : 'text-gray-500'}`}>Price</th>
                              <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-[#f0f6fc]' : 'text-gray-500'}`}>Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {services.map((service) => (
                              <tr key={service.id} className={`${darkMode ? 'bg-[#0d1117] hover:bg-[#21262d]' : 'bg-white hover:bg-gray-50'}`}>
                                <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-[#f0f6fc]' : 'text-gray-900'}`}>
                                  <div className="flex items-center">
                                    <div className="ml-4">
                                      <div className="text-sm font-medium">{service.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-[#7d8590]' : 'text-gray-500'}`}>
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {service.category}
                                  </span>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${darkMode ? 'text-[#f0f6fc]' : 'text-gray-900'}`}>
                                  {formatCurrency(service.price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                  <button
                                    onClick={(e) => deleteService(service.id, e)}
                                    className={`ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md transition-colors`}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction History Modal */}
          {showTransactionHistory && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className={`${cardClasses} rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border shadow-2xl`}>
                <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                  <h2 className="text-2xl font-bold flex items-center">
                    <History className="w-7 h-7 mr-3 text-purple-500" />
                    Transaction History
                  </h2>
                  <button
                    onClick={() => setShowTransactionHistory(false)}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${
                      darkMode ? 'text-[#7d8590] hover:text-white hover:bg-[#21262d]' : 'text-[#656d76] hover:text-black hover:bg-[#f3f4f6]'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transactions by patient name or ID..."
                      value={searchTransaction}
                      onChange={(e) => setSearchTransaction(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl ${inputClasses} focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    {filteredTransactions.length === 0 ? (
                      <div className="text-center py-12">
                        <Clipboard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium text-gray-900 dark:text-gray-300">No transactions found</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Try searching or create a new transaction</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredTransactions.map((transaction) => (
                          <div key={transaction.id} className={`${cardClasses} rounded-lg border p-6 cursor-pointer hover:shadow-md transition-shadow`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                    {transaction.invoiceNumber}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {transaction.patientName}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  <span>ID: {transaction.patientInfo?.id || 'N/A'}</span>
                                  <span>{new Date(transaction.date).toLocaleDateString()}</span>
                                  <span className="text-green-600 font-medium">{formatCurrency(transaction.total)}</span>
                                </div>
                                <div className="flex space-x-2 text-xs text-gray-400">
                                  {transaction.services.slice(0, 2).map(service => (
                                    <span key={service.id} className="bg-gray-100 px-2 py-1 rounded dark:bg-gray-700">
                                      {service.name}
                                    </span>
                                  ))}
                                  {transaction.services.length > 2 && (
                                    <span>...</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  loadTransaction(transaction, e);
                                  setShowTransactionHistory(false);
                                }}
                                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                              >
                                Load
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Modal */}
          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className={`${cardClasses} rounded-2xl max-w-md w-full p-8 border shadow-2xl`}>
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">System Settings</h2>
                <p className={`text-sm text-center mb-8 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                  Configure hospital information
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Hospital Name</label>
                    <input
                      type="text"
                      value={systemConfig.hospitalName}
                      onChange={(e) => setSystemConfig({...systemConfig, hospitalName: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-xl ${inputClasses}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <input
                      type="text"
                      value={systemConfig.hospitalAddress}
                      onChange={(e) => setSystemConfig({...systemConfig, hospitalAddress: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-xl ${inputClasses}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={systemConfig.hospitalPhone}
                      onChange={(e) => setSystemConfig({...systemConfig, hospitalPhone: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-xl ${inputClasses}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Tagline</label>
                    <input
                      type="text"
                      value={systemConfig.tagline}
                      onChange={(e) => setSystemConfig({...systemConfig, tagline: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-xl ${inputClasses}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Hospital Logo</label>
                    <div className="flex items-center space-x-4">
                      {systemConfig.hospitalLogo ? (
                        <img src={systemConfig.hospitalLogo} alt="Logo" className="w-20 h-20 object-cover rounded-lg" />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                          No Logo
                        </div>
                      )}
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium"
                      >
                        <Image className="w-4 h-4 mr-2" />
                        {systemConfig.hospitalLogo ? 'Change Logo' : 'Upload Logo'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-6">
                  <button
                    onClick={() => {
                      saveConfigToDB(systemConfig);
                      setShowSettings(false);
                      showFeedbackMessage('Settings saved successfully!', 'success');
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium hover:scale-105"
                  >
                    Save Settings
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className={`flex-1 px-6 py-3 border rounded-xl transition-all hover:scale-105 ${
                      darkMode ? 'border-[#30363d] hover:bg-[#21262d]' : 'border-[#d0d7de] hover:bg-[#f3f4f6]'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile Modal */}
          {showEditProfile && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className={`${cardClasses} rounded-2xl max-w-md w-full p-8 border shadow-2xl`}>
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                    <User className="w-8 h-8" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">Edit Profile</h2>
                <p className={`text-sm text-center mb-8 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                  Update your profile information
                </p>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputClasses}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Profile Picture</label>
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        {userProfileImage ? (
                          <img src={userProfileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-10 h-10 text-white" />
                        )}
                      </div>
                      <button
                        onClick={() => profileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium"
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Change Photo
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowEditProfile(false)}
                    className={`flex-1 px-6 py-3 border rounded-xl transition-all hover:scale-105 ${
                      darkMode ? 'border-[#30363d] hover:bg-[#21262d]' : 'border-[#d0d7de] hover:bg-[#f3f4f6]'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileUpdate}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium hover:scale-105"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Receipt Modal */}
          {showReceipt && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className={`${cardClasses} rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border shadow-2xl`}>
                <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                  <h2 className="text-2xl font-bold flex items-center">
                    <Printer className="w-7 h-7 mr-3 text-green-500" />
                    Receipt
                  </h2>
                  <button
                    onClick={() => setShowReceipt(false)}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${
                      darkMode ? 'text-[#7d8590] hover:text-white hover:bg-[#21262d]' : 'text-[#656d76] hover:text-black hover:bg-[#f3f4f6]'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div id="receipt-content" className="text-center print:text-black">
                    {/* Hospital Header with Logo - Fixed */}
                    <div className="mb-6">
                      {systemConfig.hospitalLogo && (
                        <div className="flex justify-center mb-4 print:mb-2">
                          <img src={systemConfig.hospitalLogo} alt="Hospital Logo" className="logo-img h-20 object-contain print:h-16" />
                        </div>
                      )}
                      <h2 className="text-2xl font-bold mb-2 print:text-xl">{systemConfig.hospitalName}</h2>
                      <p className={`text-sm mb-1 print:text-xs ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>{systemConfig.hospitalAddress}</p>
                      <p className={`text-sm mb-6 print:text-xs ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>Tel: {systemConfig.hospitalPhone}</p>
                    </div>
                    
                    <div className={`border-t border-b py-4 mb-6 print:border-black print:py-2 ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                      <p className={`text-sm print:text-xs ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>Invoice #: {generateInvoiceNumber()}</p>
                      <p className={`text-sm print:text-xs ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                        {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {/* Patient Information */}
                    <div className="text-left mb-6 print:mb-4">
                      <p className="font-bold mb-2 print:mb-1">Patient Information</p>
                      <div className="space-y-1 text-sm print:text-xs">
                        <p>Name: {patientInfo.name || 'Walk-in Patient'}</p>
                        <p>ID: {patientInfo.id || 'N/A'}</p>
                        <p>Phone: {patientInfo.phone || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {/* Services List with proper alignment - Fixed */}
                    <div className="text-left mb-6 print:mb-4">
                      <p className={`font-bold border-b pb-2 mb-3 print:mb-2 print:border-black ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>Services</p>
                      <table className="w-full service-table print:border-black">
                        <thead className="print:border-b print:border-black">
                          <tr>
                            <th className="text-left py-2 print:py-1">Service</th>
                            <th className="text-center py-2 print:py-1">Qty</th>
                            <th className="text-right py-2 print:py-1">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="print:border-b print:border-black">
                          {selectedServices.map((service, index) => (
                            <tr key={index} className="border-b border-gray-200 print:border-black last:border-b-0">
                              <td className="py-2 align-top print:py-1">
                                <p className="font-medium text-sm print:text-xs">{service.name}</p>
                                {service.isCustom && (
                                  <p className="text-xs text-green-600 print:text-xs">(Custom)</p>
                                )}
                              </td>
                              <td className="text-center py-2 print:py-1 print:text-xs">
                                {service.isCustom ? '1' : service.quantity}
                              </td>
                              <td className="text-right py-2 font-medium print:py-1 print:text-xs">
                                {formatCurrency(service.price * (service.quantity || 1))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Totals - Fixed alignment */}
                    <div className={`text-left border-t pt-4 print:border-black print:pt-2 ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                      <div className="space-y-2 text-sm print:text-xs">
                        <div className="flex justify-between print:justify-between">
                          <p>Subtotal:</p>
                          <p className="font-medium">{formatCurrency(subtotal)}</p>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-green-600 print:text-green-800">
                            <p>Discount ({discount}%):</p>
                            <p className="font-medium">-{formatCurrency(discountAmount)}</p>
                          </div>
                        )}
                        <div className={`flex justify-between font-bold text-xl border-t pt-2 mt-2 print:text-lg print:border-black print:pt-1 print:mt-1 ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                          <p>TOTAL:</p>
                          <p className="text-green-600 print:text-green-800">{formatCurrency(total)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className={`mt-8 text-center text-xs print:text-xs print:mt-4 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                      <p className="font-medium">{systemConfig.tagline}</p>
                      <p className="mt-2">Thank you for choosing {systemConfig.hospitalName}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-6 border-t flex justify-center space-x-4 print:hidden ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                  <button
                    onClick={printReceipt}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium hover:scale-105"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </button>
                  <button
                    onClick={shareReceipt}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium hover:scale-105"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </button>
                  <button
                    onClick={downloadReceipt}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium hover:scale-105"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            type="file"
            ref={logoInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <input
            type="file"
            ref={profileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleProfileImageUpload}
          />
        </div>
      </div>
    </div>
  );
};

export default HospitalBillingSystem;
