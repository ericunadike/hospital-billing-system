import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, Upload, Download, Share2, Printer, User, Hash, Settings, Edit, Save, X, Wifi, WifiOff, Lock, Eye, EyeOff, Moon, Sun, History, Menu, List, Database, FileText, Clipboard, Heart, CheckCircle, Zap, Star, TrendingUp, Sparkles, Bell } from 'lucide-react';

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
  const dbRef = useRef(null);
  const categories = ['Consultation', 'Laboratory', 'Radiology', 'Medication', 'Accommodation', 'Procedure', 'Diagnostic', 'Emergency', 'Therapy', 'Surgery'];

  const subtotal = selectedServices.reduce((sum, service) => sum + (service.price * service.quantity), 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

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

  // IndexedDB Setup
  useEffect(() => {
    initializeDB();
    
    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initializeDB]);

  const initializeDB = async () => {
    try {
      const request = indexedDB.open('HospitalBillingDB', 2);
      
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
      };
    } catch (error) {
      console.error('Error initializing database:', error);
      setDbStatus('error');
    }
  };

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
      };
      
      request.onerror = () => {
        console.error('Error loading services from database');
      };
    } catch (error) {
      console.error('Error loading services:', error);
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
    const receiptData = {
      invoiceNumber: generateInvoiceNumber(),
      patientInfo,
      services: selectedServices.filter(s => !s.isCustom),
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
${selectedServices.filter(s => !s.isCustom).map(s => `${s.name} x${s.quantity} - ${formatCurrency(s.price * s.quantity)}`).join('\n')}

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
        // Fallback to WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(receiptText)}`;
        window.open(whatsappUrl, '_blank');
      });
    } else {
      // Show share options
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
    // Create a simple HTML version for PDF conversion
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

  // Theme classes with GitHub-inspired design
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

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${darkMode ? 'bg-[#0d1117] border-r border-[#30363d]' : 'bg-[#f6f8fa] border-r border-[#d0d7de]'} shadow-xl`}>
        
        <div className={`p-6 border-b ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
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
        
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            <button
              onClick={() => {
                requireAuth(() => setShowServiceManager(true));
                setSidebarOpen(false);
              }}
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
              onClick={() => {
                requireAuth(() => fileInputRef.current?.click());
                setSidebarOpen(false);
              }}
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
              onClick={(e) => {
                exportServices(e);
                setSidebarOpen(false);
              }}
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
              onClick={() => {
                setShowTransactionHistory(true);
                setSidebarOpen(false);
              }}
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
              onClick={() => {
                requireAuth(() => setShowSettings(true));
                setSidebarOpen(false);
              }}
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
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <header className={`${cardClasses} rounded-xl p-6 mb-6 border relative overflow-hidden`}>
            {/* Gradient background accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {/* Single modern sidebar toggle */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                    darkMode 
                      ? 'bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc]' 
                      : 'bg-[#f6f8fa] hover:bg-[#f3f4f6] text-[#24292f] hover:shadow-md'
                  }`}
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                {systemConfig.hospitalLogo && (
                  <img src={systemConfig.hospitalLogo} alt="Logo" className="w-12 h-12 object-contain rounded-xl" />
                )}
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {systemConfig.hospitalName}
                  </h1>
                  <p className={`text-sm ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>{systemConfig.tagline}</p>
                </div>
              </div>
            </div>
            
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

            {/* Enhanced Search Bar */}
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

              {/* Enhanced Quick Access */}
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

            {/* Right Column - Enhanced Current Bill */}
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
                  <button
                    onClick={(e) => saveCurrentTransaction(e)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode ? 'hover:bg-[#21262d]' : 'hover:bg-[#f3f4f6]'
                    }`}
                    title="Save Transaction"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Enhanced Quick Add Section */}
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

                  {/* Enhanced Totals Section */}
                  <div className={`mt-6 p-5 rounded-xl border ${
                    darkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d7de]'
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

                  {/* Enhanced Action Buttons */}
                  <div className="flex space-x-3 pt-6">
                    <button
                      onClick={(e) => generateReceipt(e)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center font-medium text-lg shadow-lg hover:shadow-xl"
                    >
                      <Printer className="w-6 h-6 mr-2" />
                      Generate Receipt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Service Manager Modal */}
          {showServiceManager && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className={`${cardClasses} rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border shadow-2xl`}>
                <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                  <h2 className="text-2xl font-bold flex items-center">
                    <List className="w-7 h-7 mr-3 text-blue-500" />
                    Service Management
                  </h2>
                  <button
                    onClick={() => setShowServiceManager(false)}
                    className={`p-2 rounded-lg transition-colors hover:scale-110 ${
                      darkMode ? 'text-[#7d8590] hover:text-white hover:bg-[#21262d]' : 'text-[#656d76] hover:text-black hover:bg-[#f3f4f6]'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Add New Service Section */}
                  <div className={`rounded-xl p-6 mb-8 border ${
                    darkMode 
                      ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/30' 
                      : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                  }`}>
                    <h3 className="font-bold mb-4 flex items-center text-blue-600">
                      <Plus className="w-6 h-6 mr-2" />
                      Add New Service
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="text"
                        placeholder="Service Name"
                        value={newService.name}
                        onChange={(e) => setNewService({...newService, name: e.target.value})}
                        className={`px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputClasses}`}
                      />
                      <input
                        type="number"
                        placeholder="Price (₦)"
                        value={newService.price}
                        onChange={(e) => setNewService({...newService, price: e.target.value})}
                        className={`px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputClasses}`}
                      />
                      <select
                        value={newService.category}
                        onChange={(e) => setNewService({...newService, category: e.target.value})}
                        className={`px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputClasses}`}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button
                        onClick={(e) => addNewService(e)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center font-medium hover:scale-105"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Service
                      </button>
                    </div>
                  </div>

                  {/* Current Services List */}
                  <div className={`border rounded-xl overflow-hidden ${cardClasses}`}>
                    <div className={`p-6 border-b ${darkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d7de]'}`}>
                      <h3 className="font-bold text-lg flex items-center">
                        Current Services ({services.length})
                        <span className={`ml-3 text-sm font-normal ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                          Click edit to modify or delete to remove
                        </span>
                      </h3>
                    </div>
                    
                    <div className="divide-y max-h-96 overflow-y-auto">
                      {services.map(service => (
                        <div key={service.id} className={`p-5 flex items-center justify-between transition-colors ${
                          darkMode ? 'hover:bg-[#0d1117] divide-[#30363d]' : 'hover:bg-[#f6f8fa] divide-[#d0d7de]'
                        }`}>
                          {editingService && editingService.originalId === service.id ? (
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 mr-4">
                              <input
                                type="text"
                                value={editingService.name}
                                onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputClasses}`}
                              />
                              <input
                                type="number"
                                value={editingService.price}
                                onChange={(e) => setEditingService({...editingService, price: e.target.value})}
                                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputClasses}`}
                              />
                              <select
                                value={editingService.category}
                                onChange={(e) => setEditingService({...editingService, category: e.target.value})}
                                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputClasses}`}
                              >
                                {categories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="flex-1">
                              <p className="font-semibold text-lg">{service.name}</p>
                              <p className={`text-sm ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                                {service.category} • {formatCurrency(service.price)}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3">
                            {editingService && editingService.originalId === service.id ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    if (!editingService.name || !editingService.price || !editingService.category) {
                                      alert('Please fill all fields');
                                      return;
                                    }
                                    
                                    const updatedServices = services.map(s => 
                                      s.id === editingService.originalId ? {
                                        id: editingService.originalId,
                                        name: editingService.name,
                                        price: Number(editingService.price),
                                        category: editingService.category
                                      } : s
                                    );
                                    
                                    setServices(updatedServices);
                                    saveServicesToDB(updatedServices);
                                    
                                    setEditingService(null);
                                    showFeedbackMessage('Service updated! 💾', 'success', e);
                                  }}
                                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all hover:scale-110"
                                  title="Save"
                                >
                                  <Save className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setEditingService(null)}
                                  className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                    darkMode ? 'text-[#7d8590] hover:text-white hover:bg-[#21262d]' : 'text-[#656d76] hover:text-black hover:bg-gray-100'
                                  }`}
                                  title="Cancel"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingService({
                                    ...service,
                                    originalId: service.id
                                  })}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all hover:scale-110"
                                  title="Edit"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={(e) => deleteService(service.id, e)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all hover:scale-110"
                                  title="Delete"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CSV Import Instructions */}
                  <div className={`mt-8 rounded-xl p-6 border ${
                    darkMode 
                      ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-800/30' 
                      : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                  }`}>
                    <h4 className="font-bold text-yellow-600 mb-3 flex items-center text-lg">
                      <FileText className="w-5 h-5 mr-2" />
                      CSV Import Guide
                    </h4>
                    <p className={`text-sm mb-3 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      Your CSV file should have these column headers:
                    </p>
                    <ul className={`text-sm list-disc list-inside space-y-1 mb-4 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      <li><strong>Name</strong> or <strong>Service</strong> - The service name</li>
                      <li><strong>Price</strong> or <strong>Cost</strong> - The price in numbers</li>
                      <li><strong>Category</strong> or <strong>Type</strong> - Optional category</li>
                    </ul>
                    <div className={`text-xs font-mono p-3 rounded-lg ${
                      darkMode ? 'bg-black/30 text-yellow-200' : 'bg-white/70 text-yellow-800'
                    }`}>
                      Name,Price,Category<br/>
                      "Blood Test",15000,"Laboratory"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Transaction History Modal */}
          {showTransactionHistory && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className={`${cardClasses} rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border shadow-2xl`}>
                <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                  <h2 className="text-2xl font-bold flex items-center">
                    <History className="w-7 h-7 mr-3 text-purple-500" />
                    Transaction History
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className={`absolute left-3 top-3 h-4 w-4 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`} />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTransaction}
                        onChange={(e) => setSearchTransaction(e.target.value)}
                        className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${inputClasses}`}
                      />
                    </div>
                    <button
                      onClick={() => setShowTransactionHistory(false)}
                      className={`p-2 rounded-lg transition-all hover:scale-110 ${
                        darkMode ? 'text-[#7d8590] hover:text-white hover:bg-[#21262d]' : 'text-[#656d76] hover:text-black hover:bg-[#f3f4f6]'
                      }`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {filteredTransactions.length === 0 ? (
                    <div className={`text-center py-16 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                      <History className="w-20 h-20 mx-auto mb-6 opacity-30" />
                      <p className="text-xl font-medium mb-2">No transactions found</p>
                      <p>Your transaction history will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTransactions.map(transaction => (
                        <div key={transaction.id} className={`group p-6 rounded-xl border transition-all hover:scale-[1.02] ${
                          darkMode ? 'bg-[#0d1117] border-[#30363d] hover:border-purple-500/50' : 'bg-[#f6f8fa] border-[#d0d7de] hover:border-purple-400 hover:shadow-md'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-bold text-lg">{transaction.patientName}</p>
                              <p className={`text-sm ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                                {new Date(transaction.date).toLocaleDateString()} • 
                                {transaction.patientInfo?.id && ` ID: ${transaction.patientInfo.id}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-2xl text-purple-600">{formatCurrency(transaction.total)}</p>
                              <p className={`text-xs ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>{transaction.invoiceNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={`text-sm ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                              {transaction.services.length} services • <span className="capitalize">{transaction.status}</span>
                            </p>
                            <div className="flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  loadTransaction(transaction, e);
                                  setShowTransactionHistory(false);
                                }}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Load
                              </button>
                              <button
                                onClick={() => {
                                  setPatientInfo(transaction.patientInfo || {});
                                  setSelectedServices(transaction.services || []);
                                  setDiscount(transaction.discount || 0);
                                  setCurrentTransactionId(transaction.id);
                                  setShowReceipt(true);
                                  setShowTransactionHistory(false);
                                }}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                <Printer className="w-4 h-4 mr-2" />
                                Receipt
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Settings Modal */}
          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className={`${cardClasses} rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border shadow-2xl`}>
                <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                  <h2 className="text-2xl font-bold flex items-center">
                    <Settings className="w-7 h-7 mr-3 text-indigo-500" />
                    System Settings
                  </h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${
                      darkMode ? 'text-[#7d8590] hover:text-white hover:bg-[#21262d]' : 'text-[#656d76] hover:text-black hover:bg-[#f3f4f6]'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-8">
                    {/* Hospital Information */}
                    <div className={`p-6 rounded-xl border ${
                      darkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d7de]'
                    }`}>
                      <h3 className="font-bold text-lg mb-4 flex items-center text-indigo-600">
                        <Database className="w-5 h-5 mr-2" />
                        Hospital Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Hospital Name</label>
                          <input
                            type="text"
                            value={systemConfig.hospitalName}
                            onChange={(e) => setSystemConfig({...systemConfig, hospitalName: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputClasses}`}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Address</label>
                            <input
                              type="text"
                              value={systemConfig.hospitalAddress}
                              onChange={(e) => setSystemConfig({...systemConfig, hospitalAddress: e.target.value})}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputClasses}`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Phone Number</label>
                            <input
                              type="text"
                              value={systemConfig.hospitalPhone}
                              onChange={(e) => setSystemConfig({...systemConfig, hospitalPhone: e.target.value})}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputClasses}`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Tagline</label>
                          <input
                            type="text"
                            value={systemConfig.tagline}
                            onChange={(e) => setSystemConfig({...systemConfig, tagline: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputClasses}`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Hospital Logo</label>
                          <div className="flex items-center space-x-4">
                            {systemConfig.hospitalLogo && (
                              <img src={systemConfig.hospitalLogo} alt="Hospital Logo" className="w-20 h-20 object-contain rounded-xl border-2 border-indigo-200" />
                            )}
                            <button
                              onClick={() => logoInputRef.current?.click()}
                              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {systemConfig.hospitalLogo ? 'Change Logo' : 'Upload Logo'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Access Services */}
                    <div className={`p-6 rounded-xl border ${
                      darkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d7de]'
                    }`}>
                      <h3 className="font-bold text-lg mb-4 flex items-center text-blue-600">
                        <Zap className="w-5 h-5 mr-2" />
                        Quick Access Services
                      </h3>
                      <p className={`text-sm mb-4 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                        Select up to 6 services to show in the quick access panel
                      </p>
                      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                        {services.map(service => (
                          <label key={service.id} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            darkMode ? 'hover:bg-[#21262d]' : 'hover:bg-white'
                          }`}>
                            <input
                              type="checkbox"
                              checked={systemConfig.quickAccessServices.includes(service.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (systemConfig.quickAccessServices.length < 6) {
                                    setSystemConfig({
                                      ...systemConfig,
                                      quickAccessServices: [...systemConfig.quickAccessServices, service.id]
                                    });
                                  } else {
                                    alert('Maximum of 6 quick access services allowed');
                                  }
                                } else {
                                  setSystemConfig({
                                    ...systemConfig,
                                    quickAccessServices: systemConfig.quickAccessServices.filter(id => id !== service.id)
                                  });
                                }
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            <span className="flex-1">
                              <p className="font-medium">{service.name}</p>
                              <p className={`text-sm ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                                {service.category} • {formatCurrency(service.price)}
                              </p>
                            </span>
                            {systemConfig.quickAccessServices.includes(service.id) && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </label>
                        ))}
                      </div>
                      <p className={`text-xs mt-3 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                        Selected: {systemConfig.quickAccessServices.length}/6 services
                      </p>
                    </div>

                    {/* Security Settings */}
                    <div className={`p-6 rounded-xl border ${
                      darkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d7de]'
                    }`}>
                      <h3 className="font-bold text-lg mb-4 flex items-center text-red-600">
                        <Lock className="w-5 h-5 mr-2" />
                        Security Settings
                      </h3>
                      <div>
                        <label className="block text-sm font-medium mb-2">Admin Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={systemConfig.adminPassword}
                            onChange={(e) => setSystemConfig({...systemConfig, adminPassword: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${inputClasses} pr-12`}
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-3 top-3.5 transition-colors ${
                              darkMode ? 'text-[#7d8590] hover:text-[#f0f6fc]' : 'text-[#656d76] hover:text-[#24292f]'
                            }`}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                          Required for accessing sensitive features
                        </p>
                      </div>
                    </div>

                    {/* Data Management */}
                    <div className={`p-6 rounded-xl border ${
                      darkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d7de]'
                    }`}>
                      <h3 className="font-bold text-lg mb-4 flex items-center text-orange-600">
                        <Clipboard className="w-5 h-5 mr-2" />
                        Data Management
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={(e) => {
                            if (window.confirm('Reset all services to defaults? This cannot be undone.')) {
                              setServices(initialServices);
                              saveServicesToDB(initialServices);
                              showFeedbackMessage('Services reset! 🔄', 'success', e);
                            }
                          }}
                          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all font-medium"
                        >
                          <History className="w-4 h-4 mr-2" />
                          Reset Services
                        </button>
                        <button
                          onClick={(e) => {
                            if (window.confirm('Clear ALL transaction history? This cannot be undone.')) {
                              setSavedTransactions([]);
                              if (dbRef.current) {
                                const transaction = dbRef.current.transaction(['transactions'], 'readwrite');
                                const store = transaction.objectStore('transactions');
                                store.clear();
                              }
                              showFeedbackMessage('History cleared! 🗑️', 'success', e);
                            }
                          }}
                          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all font-medium"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear History
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-6 border-t flex justify-end space-x-4 ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                  <button
                    onClick={() => setShowSettings(false)}
                    className={`px-6 py-3 border rounded-xl transition-all hover:scale-105 ${
                      darkMode ? 'border-[#30363d] hover:bg-[#21262d]' : 'border-[#d0d7de] hover:bg-[#f3f4f6]'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      saveConfigToDB(systemConfig);
                      setShowSettings(false);
                      showFeedbackMessage('Settings saved! 💾', 'success', e);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium hover:scale-105"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Receipt Modal */}
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
                  <div id="receipt-content" className="text-center">
                    {/* Hospital Header */}
                    {systemConfig.hospitalLogo && (
                      <div className="flex justify-center mb-4">
                        <img src={systemConfig.hospitalLogo} alt="Hospital Logo" className="h-20 object-contain" />
                      </div>
                    )}
                    <h2 className="text-2xl font-bold mb-2">{systemConfig.hospitalName}</h2>
                    <p className={`text-sm mb-1 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>{systemConfig.hospitalAddress}</p>
                    <p className={`text-sm mb-6 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>Tel: {systemConfig.hospitalPhone}</p>
                    
                    <div className={`border-t border-b py-4 mb-6 ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                      <p className={`text-sm ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>Invoice #: {generateInvoiceNumber()}</p>
                      <p className={`text-sm ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                        {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {/* Patient Information */}
                    <div className="text-left mb-6">
                      <p className="font-bold mb-2">Patient Information</p>
                      <div className="space-y-1 text-sm">
                        <p>Name: {patientInfo.name || 'Walk-in Patient'}</p>
                        <p>ID: {patientInfo.id || 'N/A'}</p>
                        <p>Phone: {patientInfo.phone || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {/* Services List */}
                    <div className="text-left mb-6">
                      <p className={`font-bold border-b pb-2 mb-3 ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>Services</p>
                      <div className="space-y-2">
                        {selectedServices.map((service, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 text-sm">
                            <div className="col-span-6">
                              <p className="font-medium">{service.name}</p>
                              {service.isCustom && (
                                <p className="text-xs text-green-600">(Custom)</p>
                              )}
                            </div>
                            <div className="col-span-3 text-center">
                              <p>{service.isCustom ? '1' : `x${service.quantity}`}</p>
                            </div>
                            <div className="col-span-3 text-right">
                              <p className="font-medium">{formatCurrency(service.price * (service.quantity || 1))}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Totals */}
                    <div className={`text-left border-t pt-4 ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <p>Subtotal:</p>
                          <p>{formatCurrency(subtotal)}</p>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <p>Discount ({discount}%):</p>
                            <p>-{formatCurrency(discountAmount)}</p>
                          </div>
                        )}
                        <div className={`flex justify-between font-bold text-xl border-t pt-2 mt-2 ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
                          <p>TOTAL:</p>
                          <p className="text-green-600">{formatCurrency(total)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className={`mt-8 text-center text-xs ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                      <p className="font-medium">{systemConfig.tagline}</p>
                      <p className="mt-2">Thank you for choosing {systemConfig.hospitalName}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-6 border-t flex justify-center space-x-4 ${darkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'}`}>
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

          {/* Enhanced Password Dialog */}
          {showPasswordDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className={`${cardClasses} rounded-2xl max-w-md w-full p-8 border shadow-2xl`}>
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">Admin Authentication</h2>
                <p className={`text-sm text-center mb-8 ${darkMode ? 'text-[#7d8590]' : 'text-[#656d76]'}`}>
                  Enter admin password to access protected features
                </p>
                <div className="relative mb-6">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    value={passwordAttempt}
                    onChange={(e) => setPasswordAttempt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && authenticateUser()}
                    className={`w-full px-4 py-4 ${inputClasses} rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent pr-14 transition-all`}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-4 transition-colors ${
                      darkMode ? 'text-[#7d8590] hover:text-[#f0f6fc]' : 'text-[#656d76] hover:text-[#24292f]'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowPasswordDialog(false);
                      setPasswordAttempt('');
                      setPendingAction(null);
                    }}
                    className={`flex-1 px-6 py-3 border rounded-xl transition-all hover:scale-105 ${
                      darkMode ? 'border-[#30363d] hover:bg-[#21262d]' : 'border-[#d0d7de] hover:bg-[#f3f4f6]'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={authenticateUser}
                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all font-medium hover:scale-105"
                  >
                    Authenticate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls"
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
        </div>
      </div>
    </div>
  );
};

export default HospitalBillingSystem;
