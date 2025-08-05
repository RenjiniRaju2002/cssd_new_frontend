import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Header from "../components/Header";
// import { useToast } from "@/hooks/use-toast";
import Footer from "../components/Footer";
import "../styles/requestmanagement.css";
import PageContainer from "../components/PageContainer";
import { Plus, Filter, Trash2, Search, Package } from "lucide-react";
import Table from "../components/Table";
import Searchbar from "../components/Searchbar";
import ButtonWithGradient from "../components/ButtonWithGradient";
import SectionHeading from "../components/SectionHeading";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import Stepper from '../components/Stepper';
import Input from "../components/Input";
import DropInput from "../components/DropInput";
import DateInput from "../components/DateInput";
import Breadcrumb from "../components/Breadcrumb";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";
import { apiGet, apiPost, apiPut, apiDelete } from '../api';

interface Request {
  id: string;
  department: string;
  items: string;
  quantity: number;
  priority: string;
  status: string;
  date: string;
  time: string;
}

interface RequestManagementProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}
const  RequestManagement : React.FC< RequestManagementProps > = ({ sidebarCollapsed = false, toggleSidebar }) => {
  const navigate = useNavigate();
  const [showCreateKit, setShowCreateKit] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [requestedBy, setRequestedBy] = useState("");
  const [itemInput, setItemInput] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [kitSearchTerm, setKitSearchTerm] = useState("");
  const [kitName, setKitName] = useState("");
  const [kitDepartment, setKitDepartment] = useState("");
  const [kitPriority, setKitPriority] = useState("");
  const [kitRequestedBy, setKitRequestedBy] = useState("");
  const [kitItemName, setKitItemName] = useState("");
  const [kitItemQuantity, setKitItemQuantity] = useState("");
  const [kitItems, setKitItems] = useState<any[]>([]);
  const [createdKits, setCreatedKits] = useState<any[]>([]);
  const [selectedKit, setSelectedKit] = useState<any>(null);
  const [showKitDetails, setShowKitDetails] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Check if form has unsaved data
  const hasUnsavedData = () => {
    return (
      selectedDepartment !== "" ||
      selectedPriority !== "" ||
      selectedDate !== undefined ||
      requestedBy !== "" ||
      itemInput !== "" ||
      itemQuantity !== "" ||
      pendingItems.length > 0 ||
      kitName !== "" ||
      kitDepartment !== "" ||
      kitPriority !== "" ||
      kitRequestedBy !== "" ||
      kitItemName !== "" ||
      kitItemQuantity !== "" ||
      kitItems.length > 0
    );
  };

  // Add beforeunload event listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedData()) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedDepartment, selectedPriority, selectedDate, requestedBy, itemInput, itemQuantity, pendingItems, kitName, kitDepartment, kitPriority, kitRequestedBy, kitItemName, kitItemQuantity, kitItems]);

  // Custom hook to handle navigation warnings
  useEffect(() => {
    const handleNavigation = (e: PopStateEvent) => {
      if (hasUnsavedData()) {
        const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave this page?");
        if (!confirmed) {
          e.preventDefault();
          window.history.pushState(null, '', window.location.pathname);
        }
      }
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [selectedDepartment, selectedPriority, selectedDate, requestedBy, itemInput, itemQuantity, pendingItems, kitName, kitDepartment, kitPriority, kitRequestedBy, kitItemName, kitItemQuantity, kitItems]);

  // Function to validate form fields with toast notifications
  const validateFormFields = (): boolean => {
    const errors: {field: string; message: string}[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Field validations
    if (!selectedDepartment) {
      errors.push({field: 'outlet', message: 'Please select an outlet from the dropdown'});
    }
    
    if (!selectedPriority) {
      errors.push({field: 'priority', message: 'Please select a priority level'});
    }
    
    if (!itemInput?.trim()) {
      errors.push({field: 'item', message: 'Please enter an item/kit name'});
    }
    
    if (!itemQuantity) {
      errors.push({field: 'quantity', message: 'Please enter a quantity'});
    } else if (isNaN(Number(itemQuantity)) || Number(itemQuantity) <= 0) {
      errors.push({field: 'quantity', message: 'Quantity must be a positive number'});
    }
    
    if (!selectedDate) {
      errors.push({field: 'date', message: 'Please select a required date'});
    } else {
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      if (selected < today) {
        errors.push({field: 'date', message: 'Date cannot be in the past'});
      }
    }
    
    // If there are errors, show them and return false
    if (errors.length > 0) {
      // Group errors by field for better display
      const errorMessages = errors.map(e => e.message);
      const uniqueMessages = [...new Set(errorMessages)];
      
      // Show toast with all error messages
      toast.error(
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Please fix the following issues:</div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {uniqueMessages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>,
        { 
          position: "top-right",
          autoClose: 6000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { maxWidth: '500px' }
        }
      );
      
      // Focus on first error field if possible
      if (errors[0]) {
        const firstErrorField = errors[0].field;
        const inputElement = document.querySelector(`[name="${firstErrorField}"]`);
        if (inputElement) {
          (inputElement as HTMLElement).focus();
        }
      }
      
      return false;
    }
    
    return true;
  };

  // Function to validate kit form fields
  const validateKitFormFields = () => {
    const missingFields = [];
    
    if (!kitName) missingFields.push("Kit Name");
    if (!kitDepartment) missingFields.push("Outlet");
    if (!kitPriority) missingFields.push("Priority");
    if (!kitItemName) missingFields.push("Item/Kit");
    if (!kitItemQuantity) missingFields.push("Quantity");
    
    if (missingFields.length > 0) {
      alert(`Please enter the following required fields: ${missingFields.join(", ")}`);
      return false;
    }
    return true;
  };

  // Fetch requests from database
  // useEffect(() => {
  //   fetch('http://localhost:3001/api/cssd_requests')
  //     .then(res => res.json())
  //     .then(data => setRequests(data))
  //     .catch(() => setRequests([]));
  // }, []);
  const fetchRequests = async () => {
    try {
      const data = await apiGet('/cssd_requests');
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    }
  };

  // Fetch created kits from database
  useEffect(() => {
    fetchRequests();
  }, []);

  // Fetch created kits from database
  useEffect(() => {
    const fetchCreatedKits = async () => {
      try {
        const data = await apiGet('/createdKits');
        // Sort kits by ID in descending order to show most recent first
        const sortedKits = [...data].sort((a, b) => {
          // Extract numeric parts from IDs (e.g., KIT007 -> 7, KIT010 -> 10)
          const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
          return numB - numA; // Sort in descending order (newest first)
        });
        
        setCreatedKits(sortedKits);
      } catch (error) {
        console.error('Error fetching created kits:', error);
        setCreatedKits([]);
      }
    };
    
    fetchCreatedKits();
  }, []);

  // Save kits to localStorage whenever they change
  // useEffect(() => {
  //   localStorage.setItem('cssd_kits', JSON.stringify(createdKits));
  // }, [createdKits]);

  // Sort requests in descending order by ID to show most recent first
  const sortedRequests = [...requests].sort((a, b) => b.id.localeCompare(a.id));
  const filteredRequests = sortedRequests.filter((req) => {
    const matchesSearch =
      req.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.items?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      req.status?.toLowerCase() === filterStatus.toLowerCase();

    const matchesPriority =
      filterPriority === "all" ||
      req.priority?.toLowerCase() === filterPriority.toLowerCase();

    const matchesDateRange =
      (!fromDate || req.date >= fromDate) &&
      (!toDate || req.date <= toDate);

    return matchesSearch && matchesStatus && matchesPriority && matchesDateRange;
  });

  // Handlers
  const addItemToList = () => {
    if (!validateFormFields()) {
      return;
    }

    const newItem = {
      department: selectedDepartment,
      priority: selectedPriority,
      requestedBy: requestedBy,
      item: itemInput,
      quantity: itemQuantity,
      date: format(selectedDate || new Date(), 'yyyy-MM-dd')
    };

    setPendingItems([...pendingItems, newItem]);
    
    // Clear item input fields
    setItemInput('');
    setItemQuantity('');
    
    // Show success message
    toast.success('Item added to request list!', { autoClose: 2000 });
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    // Optionally handle form submission for new request
  };

  // Function to clear form data
  const clearFormData = () => {
    setSelectedDepartment("");
    setSelectedPriority("");
    setRequestedBy("");
    setItemInput("");
    setItemQuantity("");
    setSelectedDate(undefined);
    setPendingItems([]);
  };

  // Function to clear kit form data
  const clearKitFormData = () => {
    setKitName("");
    setKitDepartment("");
    setKitPriority("");
    setKitRequestedBy("");
    setKitItemName("");
    setKitItemQuantity("");
    setKitItems([]);
  };

  const handleSaveRequest = async () => {
    // Validate required fields
    if (!selectedDepartment) { alert('Please select an Outlet'); return; }
    if (!selectedPriority) { alert('Please select a Priority'); return; }
    if (!selectedDate) { alert('Please select a Required Date'); return; }
    if (pendingItems.length === 0) { alert('Please add at least one item to the request'); return; }
    
    // Validate each item in pendingItems
    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      if (!item.department) { alert(`Item ${i + 1}: Please select an Outlet`); return; }
      if (!item.priority) { alert(`Item ${i + 1}: Please select a Priority`); return; }
      if (!item.item) { alert(`Item ${i + 1}: Please enter an Item/Kit`); return; }
      if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) { 
        alert(`Item ${i + 1}: Please enter a valid Quantity (must be a positive number)`); 
        return; 
      }
    }

    try {
      // Create an array of items with their quantities
      const itemsWithQuantities = pendingItems.map(item => ({
        name: item.item,
        quantity: Number(item.quantity)
      }));
      
      const department = pendingItems[0].department;
      const priority = pendingItems[0].priority;
      const requestedBy = pendingItems[0].requestedBy || 'System';
      
      // Prepare data for MSSQL database
      const newRequestData = {
        department,
        items: itemsWithQuantities.map(item => `${item.name} (${item.quantity})`).join(', '),
        quantity: itemsWithQuantities.reduce((sum, item) => sum + item.quantity, 0),
        priority,
        requestedBy,
        status: "Requested"
      };
      
      // POST to API for cssd_requests using the API utility
      const createdRequest = await apiPost('/cssd_requests', newRequestData);

      // Create corresponding entry in receive_items table
      const receiveItemData = {
        itemName: newRequestData.items,
        quantity: newRequestData.quantity,
        supplier: 'System', // Default supplier
        batchNumber: `BATCH-${Date.now()}`, // Generate batch number
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        status: 'Received',
        addedBy: newRequestData.requestedBy
      };

      // POST to API for receive_items
      await apiPost('/receive_items', receiveItemData);

      // Show success toast
      toast.success('Request created successfully and added to receive items!', { 
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Clear form and close modal
      clearFormData();
      setShowCreateKit(false);
      
      // Refresh requests using the API utility
      const updatedRequests = await apiGet('/cssd_requests');
      setRequests(updatedRequests);
      
      // Find and select the newly created request
      const newRequestItem = updatedRequests.find((req: any) => 
        req.department === department && 
        req.items === newRequestData.items &&
        req.priority === priority
      );
      if (newRequestItem) {
        setSelectedRequest(newRequestItem);
        setShowRequestDetails(true);
      }
      
    } catch (error) {
      console.error('Error saving request:', error);
      toast.error('Failed to save request. Please try again.', {
        position: "top-right",
        autoClose: 3000
      });
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      // Delete from API
      await apiDelete(`/cssd_requests/${id}`);
      
      // Update local state
      setRequests(requests.filter((req: { id: string }) => req.id !== id));
      
      toast.success('Request deleted successfully!', {
        position: "top-right",
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request. Please try again.', {
        position: "top-right",
        autoClose: 3000
      });
    }
  };

  const handleCreateKit = (e: React.FormEvent) => {
    e.preventDefault();
      setShowCreateKit(false);
    // Optionally handle kit creation logic
  };

  const handleAddKitItem = () => {
    // Validate required fields
    if (!kitItemName || kitItemName.trim() === '') {
      alert('Please enter an item name');
      return;
    }
    
    if (!kitItemQuantity || isNaN(Number(kitItemQuantity)) || Number(kitItemQuantity) <= 0) {
      alert('Please enter a valid quantity (must be a positive number)');
      return;
    }
    
    if (!kitDepartment) {
      alert('Please select a department');
      return;
    }
    
    if (!kitPriority) {
      alert('Please select a priority level');
      return;
    }
    
    // Add the item to kitItems as an object with name and quantity
    setKitItems([
      ...kitItems,
      {
        name: kitItemName.trim(),
        quantity: Number(kitItemQuantity)
      }
    ]);
    
    // Clear the item input fields
    setKitItemName("");
    setKitItemQuantity("");
  };

  const handleSaveKit = async () => {
    if (!kitName || !kitDepartment || !kitPriority || kitItems.length === 0) {
      alert('Please fill in all required fields and add at least one item');
      return;
    }
    
    // Generate a new kit ID
    const newKitId = `KIT${(createdKits.length + 1).toString().padStart(3, "0")}`;
    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    
    // Create new kit object with items as array of objects
    const newKit = {
      id: newKitId,
      name: kitName,
      department: kitDepartment,
      items: JSON.stringify(kitItems), // Store items as JSON string
      quantity: kitItems.reduce((sum, item) => sum + item.quantity, 0),
      priority: kitPriority,
      requestedBy: kitRequestedBy,
      status: "Active",
      date: currentDate,
      time: currentTime,
      createdAt: new Date().toISOString()
    };
    
          // POST to API for createdKits
      await fetch('http://localhost:3001/api/createdKits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newKit)
    });

    // Create corresponding entry in receive_items for kit
    const receiveItemId = `REC${(requests.length + createdKits.length + 1).toString().padStart(3, "0")}`;
    const newReceiveItem = {
      id: receiveItemId,
      requestId: newKitId,
      department: kitDepartment,
      items: JSON.stringify(kitItems), // Store items as JSON string
      quantity: kitItems.reduce((sum, item) => sum + item.quantity, 0),
      priority: kitPriority,
      requestedBy: kitRequestedBy,
      status: "Pending",
      date: currentDate,
      time: currentTime,
      receivedDate: currentDate,
      receivedTime: currentTime
    };

          // POST to API for receive_items
      await fetch('http://localhost:3001/api/receive_items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReceiveItem)
    });
    
    // Fetch updated kits
    const res = await axios.get('http://localhost:3001/api/createdKits');
    const updated = await res.data;
    setCreatedKits(updated);
    // Reset form and close modal
    setShowCreateKit(false);
    clearKitFormData();
  };

  const handleViewKit = (kit: any) => {
    setSelectedKit(kit);
    setShowKitDetails(true);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const updatedRequests = requests.map((req) =>
      req.id === id ? { ...req, status: newStatus } : req
    );
    setRequests(updatedRequests);

    // POST to API
    await axios.put(`http://localhost:3001/api/cssd_requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    // Show toast message when status is updated to 'Completed'
    if (newStatus === 'Completed') {
      toast.success('Sterilization completed successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleAddRequestItem = () => {
    if (!selectedDepartment) {
      alert('Please enter Outlet');
      // departmentRef.current?.focus(); // This line was not in the original file, so it's removed.
      return;
    }
    if (!selectedPriority) {
      alert('Please enter Priority');
      // priorityRef.current?.focus(); // This line was not in the original file, so it's removed.
      return;
    }
    if (!itemInput) {
      alert('Please enter Item/Kit');
      // itemInputRef.current?.focus(); // This line was not in the original file, so it's removed.
      return;
    }
    if (!itemQuantity) {
      alert('Please enter Quantity');
      // itemQuantityRef.current?.focus(); // This line was not in the original file, so it's removed.
      return;
    }
    if (!selectedDate) {
      alert('Please enter Required Date');
      // dateInputRef.current?.focus(); // This line was not in the original file, so it's removed.
      return;
    }
    addItemToList();
  };
  return (
    <>
    <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator />
    {/* <div className="request-management"> */}
    <PageContainer>
      
      {/* <div className="page-header">
        <h1 className="page-title">Request Management</h1>
       
      </div> */}
       <SectionHeading title="Request Management" subtitle="Create and manage sterilization requests" className="requestmanagement-heading w-100" />
       {/* <Stepper currentStep={currentStep} steps={stepLabels} /> */}
       <Breadcrumb steps={[{ label: 'Add Request' }, { label: 'Review Request' }]}
       activeStep={currentStep} onStepClick={setCurrentStep}/>

      {/* Step 1: Add Request and Package Kits */}
      {currentStep === 0 && (
        <div className="mb-4">
          <div className="card mb-4">
            {/* Add Request Card content (move all content from the Add Request card here, remove flex/minWidth) */}
            <div className="card-header" >
              <h2 className="card-title flex items-center" style={{ fontWeight: 400, fontSize: '1rem' }}>
                Add Request
              </h2>
            </div>
            <div className="card-content">
              <form onSubmit={handleSaveRequest}>
                <div style={{display:"flex",gap:'10px'}}>
                    <div style={{flex:1}}>
                      {/* <label className="form-label">Outlet <span style={{color: 'red'}}>*</span></label> */}
                      <DropInput
                        label="Outlet"
                        value={selectedDepartment}
                        onChange={e => setSelectedDepartment(e.target.value)}
                        error={!selectedDepartment}
                        options={[
                          { label: "Select outlet", value: "" },
                          { label: "Cardiology", value: "Cardiology" },
                          { label: "Neurology", value: "Neurology" },
                          { label: "Orthopedics", value: "Orthopedics" },
                          { label: "Pediatrics", value: "Pediatrics" },
                          { label: "Oncology", value: "Oncology" },
                          { label: "Gynecology", value: "Gynecology" },
                          { label: "General Surgery", value: "General Surgery" },
                          { label: "ENT", value: "ENT" },
                          { label: "Ophthalmology", value: "Ophthalmology" },
                          { label: "Urology", value: "Urology" },
                          { label: "Dermatology", value: "Dermatology" },
                          { label: "Emergency Department", value: "Emergency Department" },
                          { label: "Intensive Care Unit", value: "Intensive Care Unit" },
                          { label: "Operating Room", value: "Operating Room" },
                          { label: "Radiology", value: "Radiology" },
                          { label: "Laboratory", value: "Laboratory" },
                          { label: "Pharmacy", value: "Pharmacy" },
                          { label: "Physical Therapy", value: "Physical Therapy" },
                          { label: "Outpatient Clinic", value: "Outpatient Clinic" }
                        ]}
                      />
                    </div>
                    <div style={{flex:1}}>
                      {/* <label className="form-label">Priority <span style={{color: 'red'}}>*</span></label> */}
                      <DropInput
                        name="priority"
                        label="Priority"
                        value={selectedPriority}
                        onChange={e => setSelectedPriority(e.target.value)}
                        error={!selectedPriority}
                        options={[
                          { label: "Select priority", value: "" },
                          { label: "High", value: "High" },
                          { label: "Medium", value: "Medium" },
                          { label: "Low", value: "Low" }
                        ]}
                      />
                    </div>
                 
                    <div style={{flex:1}}>
                      <Input
                        name="item"
                        label="Item /Kit"
                        type="text"
                        placeholder="Add item name"
                        value={itemInput}
                        onChange={(e) => setItemInput(e.target.value)}
                        error={!itemInput}
                        required
                      />
                    </div>  
                      <div style={{flex:1}}>
                          <Input
                            name="quantity"
                            label="Quantity"
                            type="number"
                            placeholder="Enter quantity"
                            // min={1}
                            value={itemQuantity}
                            onChange={(e) => setItemQuantity(e.target.value)}
                            error={!itemQuantity}
                            required
                          />
                      </div>
                      <div style={{flex:1}}>
                        {/* <label className="form-label">Required Date <span style={{color: 'red'}}></span></label> */}
                        <DateInput
                          name="date"
                          label="Required date"
                          // type="date"
                          // className="form-input"
                          value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
                          min={new Date().toISOString().split('T')[0]}
                          error={!selectedDate}
                          // required
                        />
                      </div>
                </div>
                {/* </div> */}
               

                  <ButtonWithGradient
                  // className='button-gradient w-15 mt-2'
                
                  text="Add Request"
                  onClick={addItemToList}
                  disabled={!itemInput || !itemQuantity}
                  
                  type="button"
                />
              </form>
              {pendingItems.length > 0 && (
                <div className="mt-6">
                  <Table
                    columns={[
                      { key: 'department', header: 'Department' },
                      { key: 'priority', header: 'Priority' },
                      { 
                        key: 'items', 
                        header: 'Items',
                        render: (item) => {
                          // For pending items, we have direct access to the item data
                          if (item.item) {
                            return `${item.item} (${item.quantity})`;
                          }
                          // For saved requests with JSON string
                          try {
                            const items = JSON.parse(item.items);
                            if (Array.isArray(items)) {
                              return items.map((i: any) => `${i.name} (${i.quantity})`).join(', ');
                            }
                          } catch (e) {
                            return item.items || '';
                          }
                          return item.items || '';
                        }
                      },
                      { 
                        key: 'quantity', 
                        header: 'Quantity',
                        render: (item) => {
                          // For pending items
                          if (item.quantity !== undefined) {
                            return item.quantity;
                          }
                          // For saved requests with JSON string
                          try {
                            const items = JSON.parse(item.items);
                            if (Array.isArray(items)) {
                              return items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0);
                            }
                          } catch (e) {
                            return item.quantity || 0;
                          }
                          return item.quantity || 0;
                        }
                      },
                      { 
                        key: 'date', 
                        header: 'Date',
                        render: (item) => item.date || format(new Date(), 'yyyy-MM-dd')
                      }
                    ]}
                    data={pendingItems}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={clearFormData}
                    >
                      Clear All
                    </button>
                    <ButtonWithGradient
                      type="button"
                      className="button-gradient"
                      onClick={handleSaveRequest}
                    >
                      Save Request
                    </ButtonWithGradient>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="card mb-4">
            {/* Package Kits Card content (move all content from the Package Kits card here, remove flex/minWidth) */}
            <div className="card-header flex items-center justify-between">
              <h2 className="card-title flex items-center" style={{ fontWeight: 600, fontSize: '1.2rem' }}>
                Package Kits
              </h2>
              <ButtonWithGradient 
                className="button-gradient" 
                onClick={() => setShowCreateKit(true)}
              >
                Create Kit
              </ButtonWithGradient>
            </div>
            <div className="card-content">
              <div className="flex justify-end" >
                <div className="search ml-auto ">
                  <Searchbar value={kitSearchTerm} onChange={e => setKitSearchTerm(e.target.value)} />
                </div>
              </div>
              {createdKits.length > 0 ? (
                <Table
                  columns={[
                    { 
                      key: 'id', 
                      header: 'Kit ID',
                      render: (kit) => kit.id || 'N/A'
                    },
                    { 
                      key: 'name', 
                      header: 'Kit Name',
                      render: (kit) => kit.name || 'N/A'
                    },
                    { 
                      key: 'department', 
                      header: 'Department',
                      render: (kit) => kit.department || kit.Department || 'N/A'
                    },
                    { 
                      key: 'items', 
                      header: 'Items',
                      render: (kit) => {
                        try {
                          const items = typeof kit.items === 'string' ? JSON.parse(kit.items) : kit.items;
                          if (Array.isArray(items)) {
                            return (
                              <div>
                                {items.map((item: any, index: number) => (
                                  <div key={index}>
                                    {item.name || item.item} ({item.quantity || 1})
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return kit.items || 'N/A';
                        } catch (e) {
                          return kit.items || 'N/A';
                        }
                      }
                    },
                    { 
                      key: 'quantity', 
                      header: 'Quantity',
                      render: (kit) => {
                        try {
                          const items = typeof kit.items === 'string' ? JSON.parse(kit.items) : kit.items;
                          if (Array.isArray(items)) {
                            return items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
                          }
                          return kit.quantity || 0;
                        } catch (e) {
                          return kit.quantity || 0;
                        }
                      }
                    },
                    { 
                      key: 'priority', 
                      header: 'Priority',
                      render: (kit) => (kit.priority || kit.Priority || 'N/A').toString()
                    },
                    { 
                      key: 'status', 
                      header: 'Status',
                      render: (kit) => kit.status || 'Active'
                    },
                    {
                      key: 'actions',
                      header: 'Actions',
                      render: (kit: any) => (
                        <button
                          onClick={() => handleViewKit(kit)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FontAwesomeIcon icon={faEye} style={{ color: '#2196f3', fontSize: 16 }} />
                        </button>
                      )
                    }
                  ]}
                  data={createdKits.filter((kit: any) => {
                    const searchTerm = kitSearchTerm.toLowerCase();
                    const kitDepartment = (kit.department || kit.Department || '').toString().toLowerCase();
                    const kitPriority = (kit.priority || kit.Priority || '').toString().toLowerCase();
                    
                    return (
                      kit.name?.toLowerCase().includes(searchTerm) ||
                      kit.id?.toLowerCase().includes(searchTerm) ||
                      kitDepartment.includes(searchTerm) ||
                      kitPriority.includes(searchTerm)
                    );
                  })}
                />
              ) : (
                <div className="text-center text-gray-500 mt-4">No kits found</div>
              )}
            </div>
          </div>
          <div className="flex justify-content-end gap-2 mt-2">
            <ButtonWithGradient
              type="button"
              className="button-gradient"
              onClick={() => setCurrentStep(1)}
            >
              Next
            </ButtonWithGradient>
          </div>
        </div>
      )}

      {/* Step 2: Review & Approve Request Approval Review */}
      {currentStep === 1 && (
        <>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Previous Requests</h2>
            </div>
            <div className="card-content">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2 flex-wrap">
                  {/* Date Range Filters */}
                  <div className="flex flex-col">
                    
                    <DateInput
                      label="From Date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      width="180px"
                      max={toDate || format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="flex flex-col">
                    
                    <DateInput
                      label="To Date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      width="180px"
                      min={fromDate}
                      max={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  
                  <DropInput
                    label="Status"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "requested", label: "Requested" },
                      {value:"Rejected",label:"Rejected"},
                      { value: "Approved", label: "Approved" }
                    ]}
                  />
                  <DropInput
                    label="Priority"
                    value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}
                    options={[
                      { value: "all", label: "All Priorities" },
                      { value: "high", label: "High" },
                      { value: "medium", label: "Medium" },
                      { value: "low", label: "Low" }
                    ]}
                  />
                </div>
                <div className="relative flex-1 max-w-md ml-auto">
                  <Searchbar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <Table
                columns={[
                  { key: 'id', header: 'Request ID' },
                  { key: 'department', header: 'Department' },
                  { 
                    key: 'items', 
                    header: 'Items',
                    render: (item: any) => {
                      try {
                        // Try to parse items as JSON array
                        const items = JSON.parse(item.items);
                        if (Array.isArray(items)) {
                          return items.map((i: any) => `${i.name} (${i.quantity})`).join(', ');
                        }
                      } catch (e) {
                        // If not a valid JSON, display as is
                        return item.items;
                      }
                      return item.items;
                    }
                  },
                  { 
                    key: 'quantity', 
                    header: 'Quantity',
                    render: (item: any) => {
                      try {
                        const items = JSON.parse(item.items);
                        if (Array.isArray(items)) {
                          return items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0);
                        }
                      } catch (e) {
                        return item.quantity || 0;
                      }
                      return item.quantity || 0;
                    }
                  },
                  { 
                    key: 'priority', 
                    header: 'Priority',
                    render: (item: any) => item.priority.charAt(0).toUpperCase() + item.priority.slice(1).toLowerCase()
                  },
                  { 
                    key: 'status', 
                    header: 'Status',
                    render: (item: any) => (
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status.toLowerCase() === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status.toLowerCase() === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    )
                  },
                  { key: 'date', header: 'Date' },
                  { key: 'time', header: 'Time' },
                ]}
                data={filteredRequests}
              />
              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No requests found matching your criteria.
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-content-end gap-2 mt-2">
            <ButtonWithGradient
              type="button"
              className="button-gradient"
              onClick={() => setCurrentStep(0)}
            >
              Back
            </ButtonWithGradient>
            <ButtonWithGradient
              type="button"
              className={`button-gradient ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => currentStep < 1 && setCurrentStep(1)}
              disabled={currentStep === 1}
            >
              Next
            </ButtonWithGradient>
          </div>
        </>
      )}

      {/* Create Kit Dialog */}
      {showCreateKit && (
        <div className="dialog-overlay">
          <div className="dialog-content" style={{ maxWidth: '800px', width: '80%', minHeight: '600px', boxShadow: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="card" style={{ boxShadow: 'none', width: '100%' }}>
              <div className="card-header flex items-center justify-between">
                <h2 className="card-title">Create Package Kit</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 bg-white rounded-full w-8 h-8 flex items-center justify-center"
                  onClick={() => setShowCreateKit(false)}
                  style={{ border: '1px solid #e5e7eb', boxShadow: 'none' }}
                >
                  ×
                </button>
              </div>
              <div className="card-content">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Input
                        name="kitName"
                        label="Kit Name"
                        value={kitName} 
                        onChange={e => setKitName(e.target.value)}
                        placeholder="Enter kit name" 
                        required 
                      />
                    </div>
                    <div>
                      <DropInput
                        name="kitDepartment"
                        label="Outlet"
                        value={kitDepartment}
                        onChange={e => setKitDepartment(e.target.value)}
                        options={[
                          { label: "Select outlet", value: "" },
                          { label: "OR-2", value: "OR-2" },
                          { label: "Cardiology", value: "Cardiology" },
                          { label: "Neurology", value: "Neurology" },
                          { label: "Orthopedics", value: "Orthopedics" },
                          { label: "Pediatrics", value: "Pediatrics" },
                          { label: "Oncology", value: "Oncology" },
                          { label: "Gynecology", value: "Gynecology" },
                          { label: "General Surgery", value: "General Surgery" },
                          { label: "ENT", value: "ENT" },
                          { label: "Ophthalmology", value: "Ophthalmology" },
                          { label: "Urology", value: "Urology" },
                          { label: "Dermatology", value: "Dermatology" },
                          { label: "Emergency Department", value: "Emergency Department" },
                          { label: "Intensive Care Unit", value: "Intensive Care Unit" },
                          { label: "Operating Room", value: "Operating Room" },
                          { label: "Radiology", value: "Radiology" },
                          { label: "Laboratory", value: "Laboratory" },
                          { label: "Pharmacy", value: "Pharmacy" },
                          { label: "Physical Therapy", value: "Physical Therapy" },
                          { label: "Outpatient Clinic", value: "Outpatient Clinic" }
                        ]}
                        width="100%"
                      />
                    </div>
                    <div>
                      <DropInput
                        name="kitPriority"
                        label="Priority"
                        value={kitPriority}
                        onChange={e => setKitPriority(e.target.value)}
                        options={[
                          { label: "Select priority", value: "" },
                          { label: "High", value: "High" },
                          { label: "Medium", value: "Medium" },
                          { label: "Low", value: "Low" }
                        ]}
                        width="100%"
                      />
                    </div>
                   
                    <div>
                      <Input
                        label="Item/Kit"
                        value={kitItemName}
                        onChange={e => setKitItemName(e.target.value)}
                        placeholder="Add item name" 
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Quantity"
                        type="number"
                        value={kitItemQuantity}
                        onChange={e => setKitItemQuantity(e.target.value)}
                        placeholder="Enter quantity" 
                        required
                      />
                    </div>
                  </div>
                  <ButtonWithGradient
                    type="button"
                    onClick={handleAddKitItem}
                    disabled={!kitItemName || !kitItemQuantity || !kitDepartment || !kitPriority}
                  >
                    Add Item
                  </ButtonWithGradient>
                </form>
                
                {kitItems.length > 0 && (
                  <div className="mt-6">
                   
                    <Table
                      columns={[
                        { key: 'name', header: 'Item' },
                        { key: 'quantity', header: 'Quantity' },
                        { key: 'priority', header: 'Priority' },
                        { key: 'department', header: 'Department' }
                      ]}
                      data={kitItems}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-secondary bg-white"
                        style={{ border: '1px solid #e5e7eb', boxShadow: 'none' }}
                        onClick={clearKitFormData}
                      >
                        Clear All
                      </button>
                      <ButtonWithGradient
                        type="button"
                        className="button-gradient"
                        onClick={handleSaveKit}
                        disabled={!kitName || kitItems.length === 0}
                      >
                        Save Kit
                      </ButtonWithGradient>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kit Details Dialog */}
      {showKitDetails && selectedKit && (
        <div className="dialog-overlay">
          <div className="dialog-content" style={{ maxWidth: '600px', width: '70%', boxShadow: 'none' }}>
            <div className="card" style={{ border: 'none', boxShadow: 'none' }}>
              <div className="card-header flex items-center justify-between" style={{ 
                borderBottom: '1px solid #f0f0f0', 
                padding: '12px 16px',
                background: '#f9f9f9'
              }}>
                <h2 className="card-title" style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#333', 
                  margin: 0,
                  fontFamily: "'Poppins', sans-serif"
                }}>Kit Details</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowKitDetails(false)}
                  style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
              <div className="card-content" style={{ padding: '16px' }}>
                <div className="grid grid-cols-2 gap-4 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#5a5a5a', margin: '0 0 4px 0' }}>Kit ID</p>
                    <p style={{ fontSize: '13px', color: '#333', margin: 0, fontWeight: 500 }}>{selectedKit.id || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#5a5a5a', margin: '0 0 4px 0' }}>Kit Name</p>
                    <p style={{ fontSize: '13px', color: '#333', margin: 0, fontWeight: 500 }}>{selectedKit.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#5a5a5a', margin: '0 0 4px 0' }}>Department</p>
                    <p style={{ fontSize: '13px', color: '#333', margin: 0, fontWeight: 500 }}>
                      {selectedKit.department || selectedKit.Department || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#5a5a5a', margin: '0 0 4px 0' }}>Priority</p>
                    <p style={{ 
                      fontSize: '13px', 
                      color: (selectedKit.priority || selectedKit.Priority)?.toLowerCase?.() === 'high' ? '#dc2626' : 
                            (selectedKit.priority || selectedKit.Priority)?.toLowerCase?.() === 'medium' ? '#f59e0b' : '#10b981',
                      margin: 0, 
                      fontWeight: 500,
                      textTransform: 'capitalize'
                    }}>
                      {((selectedKit.priority || selectedKit.Priority || 'N/A') as string).toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p style={{ fontSize: '12px', color: '#5a5a5a', margin: '0 0 8px 0', fontWeight: 600 }}>Items</p>
                  {(() => {
                    try {
                      // Try to parse items if they're in JSON format
                      const items = typeof selectedKit.items === 'string' 
                        ? JSON.parse(selectedKit.items)
                        : selectedKit.items;
                      
                      if (Array.isArray(items)) {
                        return (
                          <div style={{ fontSize: '13px', color: '#1f2937' }}>
                            {items.map((item: any, index: number) => (
                              <div key={index}>
                                {item.name || item.item} ({item.quantity || 1})
                              </div>
                            ))}
                          </div>
                        );
                      }
                      
                      // If items is a string but not JSON, try to split by comma
                      if (typeof selectedKit.items === 'string') {
                        return (
                          <div style={{ fontSize: '13px', color: '#1f2937' }}>
                            {selectedKit.items.split(',').map((item: string, index: number) => (
                              <div key={index}>
                                {item.trim()} {selectedKit.quantity ? `(${selectedKit.quantity})` : ''}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      
                      // Fallback to displaying raw items
                      return <div style={{ fontSize: '13px', color: '#1f2937' }}>{JSON.stringify(selectedKit.items)}</div>;
                      
                    } catch (e) {
                      // If parsing fails, display the raw items
                      return (
                        <div style={{ fontSize: '13px', color: '#1f2937' }}>
                          {typeof selectedKit.items === 'string' 
                            ? selectedKit.items 
                            : JSON.stringify(selectedKit.items)}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
    {/* </div> */}
    <Footer/>
    <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default RequestManagement;
