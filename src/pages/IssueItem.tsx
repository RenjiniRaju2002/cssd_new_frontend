import { useState, useEffect } from "react";
import "../styles/IssueItem.css";
import { Search, Send, Clock, CheckCircle } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ButtonWithGradient from "../components/ButtonWithGradient";
// import Inputtype from "../components/Inputtype";
import DropInput from "../components/DropInput";
import Input from "../components/Input";
import Searchbar from "../components/Searchbar";
import Table from "../components/Table";
import PageContainer from "../components/PageContainer";
import Cards from "../components/Cards";
import SectionHeading from "../components/SectionHeading";
import Pagination from "../components/Pagination";
import Stepper from "../components/Stepper";
import Breadcrumb from "../components/Breadcrumb";
import DateInput from "../components/DateInput";

interface AvailableItem {
  id: string;
  department: string;
  items: string;
  quantity: number;
  status: string;
  readyTime: string;
  sterilizationId?: string;
  machine?: string;
  process?: string;
}

interface IssueItemProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}

const IssueItem: React.FC<IssueItemProps> = ({ sidebarCollapsed = false, toggleSidebar }) => {
  const [issuedItems, setIssuedItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [requestIds, setRequestIds] = useState<string[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availablePage, setAvailablePage] = useState(1);
  const [availableRowsPerPage, setAvailableRowsPerPage] = useState(5);
  const [currentStep, setCurrentStep] = useState(0);
  

  // Fetch issued items from backend
  const fetchIssuedItems = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/issueItems');
      if (response.ok) {
        const data = await response.json();
        setIssuedItems(data);
      } else {
        console.error('Failed to fetch issued items');
        setError('Failed to load issued items');
      }
    } catch (error) {
      console.error('Error fetching issued items:', error);
      setError('Network error while loading issued items');
    }
  };

  // Fetch request IDs from backend
  const fetchRequestIds = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/cssd_requests');
      if (response.ok) {
        const requests = await response.json();
        setAllRequests(requests);
        const filtered = requests
          .filter((r: any) => r.status === "Requested" || r.status === "In Progress")
          .map((r: any) => r.id);
        setRequestIds(filtered);
      } else {
        console.error('Failed to fetch requests');
        setError('Failed to load requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Network error while loading requests');
    }
  };

  // Save available items to database
  const saveAvailableItems = async (items: AvailableItem[]) => {
    try {
      // Clear existing available items
      const existingItems = await fetch('http://localhost:3001/api/availableItems');
      const existingData = await existingItems.json();
      
      // Delete all existing items
      for (const item of existingData) {
        await fetch(`http://localhost:3001/api/availableItems/${item.id}`, {
          method: 'DELETE'
        });
      }
      
      // Remove duplicates from items array before saving
      const uniqueItems = items.filter((item: AvailableItem, index: number, self: AvailableItem[]) => 
        index === self.findIndex((t: AvailableItem) => t.id === item.id)
      );
      
      // Add new items
      for (const item of uniqueItems) {
        await fetch('http://localhost:3001/api/availableItems', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });
      }
      
      console.log('Available items saved to database (deduplicated)');
    } catch (error) {
      console.error('Error saving available items:', error);
      setError('Failed to save available items to database');
    }
  };

  // Fetch available items from database
  const fetchAvailableItemsFromDB = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/availableItems');
      if (response.ok) {
        const data = await response.json();
        setAvailableItems(data);
        console.log('Available items loaded from database:', data);
      } else {
        console.error('Failed to fetch available items from database');
      }
    } catch (error) {
      console.error('Error fetching available items from database:', error);
    }
  };

  // Refresh available items - sync missing items from sterilization processes
  const refreshAvailableItems = async () => {
    try {
      setError("");
      
      // Get current available items from database
      const currentItemsResponse = await fetch('http://localhost:3001/api/availableItems');
      const currentItems = await currentItemsResponse.json();
      const currentItemIds = currentItems.map((item: any) => item.id);
      
      // Fetch completed sterilization processes
      const sterilizationResponse = await fetch('http://localhost:3001/api/sterilizationProcesses');
      const sterilizationData = await sterilizationResponse.json();
      const completedProcesses = sterilizationData.filter((p: any) => p.status === "Completed");
      
      // Fetch original requests to get item details
      const requestsResponse = await fetch('http://localhost:3001/api/cssd_requests');
      const requestsData = await requestsResponse.json();
      
      console.log('Refreshed completed sterilization processes:', completedProcesses);
      
      // Find missing items (completed processes that are not in available items)
      const missingProcesses = completedProcesses.filter((process: any) => !currentItemIds.includes(process.itemId));
      
      if (missingProcesses.length > 0) {
        console.log('Adding missing items:', missingProcesses);
        
        // Add missing items to database
        for (const process of missingProcesses) {
          const originalRequest = requestsData.find((req: any) => req.id === process.itemId);
          
          const newItem = {
            id: process.itemId,
            department: originalRequest?.department || process.machine || "",
            items: originalRequest?.items || process.process || "Sterilized Item",
            quantity: originalRequest?.quantity || 1,
            status: "Sterilized",
            readyTime: process.endTime || new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
            sterilizationId: process.id,
            machine: process.machine,
            process: process.process,
          };
          
          await fetch('http://localhost:3001/api/availableItems', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem),
          });
        }
        
        // Refresh the available items from database
        await fetchAvailableItemsFromDB();
        alert(`Added ${missingProcesses.length} new item(s) to available items!`);
      } else {
        alert('No new items to add. All completed sterilization processes are already in available items.');
      }
    } catch (error) {
      console.error('Error refreshing available items:', error);
      setError('Failed to refresh available items');
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchIssuedItems();
    fetchRequestIds();
    fetchAvailableItemsFromDB();
  }, []);

  // Load available items from database on component mount
  useEffect(() => {
    fetchAvailableItemsFromDB();
  }, []);

  const handleIssueItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRequestId) {
      alert('Please select the Request ID');
      return;
    }
    if (!selectedOutlet) {
      alert('Please select the Department/Outlet');
      return;
    }
    
    setLoading(true);
    setError("");
    
    // First check if it's an available item (completed sterilization)
    let itemToIssue = availableItems.find((item) => item.id === selectedRequestId);
    
    // If not found in available items, it might be a request ID that needs to be fetched from the database
    if (!itemToIssue) {
      try {
        // Fetch the request details from the database
        const response = await fetch(`http://localhost:3001/api/cssd_requests/${selectedRequestId}`);
        if (response.ok) {
          const requestData = await response.json();
          itemToIssue = {
            id: requestData.id,
            department: requestData.department || "",
            items: requestData.items || "Requested Item",
            quantity: requestData.quantity || 1,
            status: "Requested",
            readyTime: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
          };
        } else {
          setError("Selected item not found in database");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching request details:', error);
        setError("Failed to fetch item details from database");
        setLoading(false);
        return;
      }
    }

    const newIssue = {
      id: `ISS${String(issuedItems.length + 1).padStart(3, "0")}`,
      requestId: itemToIssue.id,
      department: selectedOutlet,
      items: itemToIssue.items,
      quantity: itemToIssue.quantity,
      issuedTime: new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      }),
      issuedDate: new Date().toISOString().split("T")[0],
      status: itemToIssue.status === "Sterilized" ? "Issued" : "Issued (Non-Sterilized)",
    };

    try {
      // Save to backend
      const response = await fetch('http://localhost:3001/api/issueItems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIssue),
      });

      if (response.ok) {
        // Update local state
        setIssuedItems(prev => [...prev, newIssue]);
        setAvailableItems(prev => prev.filter(item => item.id !== selectedRequestId));
    setSelectedRequestId("");
    setSelectedOutlet("");
        
        // Remove the issued item from available items in database
        try {
          await fetch(`http://localhost:3001/api/availableItems/${selectedRequestId}`, {
            method: 'DELETE'
          });
        } catch (error) {
          console.error('Error removing item from available items:', error);
        }
        
        // Refresh data
        fetchIssuedItems();
        fetchRequestIds();
        setCurrentStep(1); // Go to Issue History after issuing
      } else {
        setError('Failed to save issued item');
      }
    } catch (error) {
      console.error('Error saving issued item:', error);
      setError('Network error while saving issued item');
    } finally {
      setLoading(false);
    }
  };

  // Filter available items and requests by date range
  const getFilteredItems = () => {
    if (!fromDate && !toDate) {
      return {
        available: availableItems,
        requests: allRequests.filter(r => r.status === "Requested" || r.status === "In Progress")
      };
    }
    
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    
    const filterByDate = (item) => {
      const itemDate = new Date(item.date || item.receivedDate);
      
      if (from && to) {
        return itemDate >= from && itemDate <= to;
      } else if (from) {
        return itemDate >= from;
      } else if (to) {
        return itemDate <= to;
      }
      return true;
    };
    
    return {
      available: availableItems.filter(filterByDate),
      requests: allRequests.filter(r => 
        (r.status === "Requested" || r.status === "In Progress") && 
        filterByDate(r)
      )
    };
  };

  const { available: filteredAvailableItems, requests: filteredRequests } = getFilteredItems();
  
  // Get unique request IDs from both available items and direct requests
  const requestOptions = [
    { label: "Select sterilized item to issue", value: "" },
    ...Array.from(new Set([
      ...filteredAvailableItems.map(item => item.id), 
      ...filteredRequests.map(r => r.id)
    ])).map(id => {
      const item = filteredAvailableItems.find(i => i.id === id);
      const request = filteredRequests.find(r => r.id === id);
      if (item) {
        return {
          label: `${id} - ${item.items} (${item.quantity}) [Sterilized]`,
          value: id
        };
      } else if (request) {
        return {
          label: `${id} - ${request.items} (${request.quantity}) [${request.status}]`,
          value: id
        };
      }
      return null;
    }).filter(Boolean)
  ];

  const filteredIssuedItems = issuedItems.filter(
    (item: any) =>
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Table columns for issued items
  const columns = [
    { key: "id", header: "Issue ID" },
    { key: "requestId", header: "Request ID" },
    { key: "department", header: "Department" },
    { key: "items", header: "Items" },
    { key: "quantity", header: "Qty" },
    { key: "issuedTime", header: "Time" },
    { key: "issuedDate", header: "Date" },
    { key: "status", header: "Status", render: (row: any) => (
      <span className={`status-badge status-${row.status.toLowerCase()}`}>{row.status}</span>
    ) },
  ];

  // Summary values
  const availableCount = availableItems.length;
  const today = new Date().toISOString().split("T")[0];
  const issuedTodayCount = issuedItems.filter((item: any) => item.issuedDate === today).length;
  const totalIssuedCount = issuedItems.length;

  const availableTotalPages = Math.max(1, Math.ceil(availableItems.length / availableRowsPerPage));
  const paginatedAvailableItems = availableItems.slice(
    (availablePage - 1) * availableRowsPerPage,
    availablePage * availableRowsPerPage
  );

  return (
    <>
      <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator/>
      <PageContainer>
      <SectionHeading 
          title={currentStep === 0 ? "Issue Item" : "Issue History"}
          subtitle={currentStep === 0 ? "Issue sterilized items to departments and outlets" : "View all issued items"}
          className="Issueitem-heading w-100" 
        />
         <Breadcrumb steps={[{ label: 'Issue Items' }, { label: 'Issue History' }]}
       activeStep={currentStep} onStepClick={setCurrentStep}/>
        {error && (
          <div className="error-message" style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}
        {currentStep === 0 && (
          <>
         <div className="grid2 grid-cols-3 md:grid-cols-3 gap-6 mb-6">
          <Cards title="Available" subtitle={availableCount} />
          <Cards title="Issued Today" subtitle={issuedTodayCount} />
          <Cards title="Total Issued" subtitle={totalIssuedCount} />
         </div>
            {/* Make the issue card full width */}
            <div style={{ width: '100%' }}>
              <div className="issue-card" style={{ width: '100%' }}>
            <div className="issue-card-header">
                  Issue Items
        </div>
            <div className="issue-card-content">
              <form onSubmit={handleIssueItem} className="form-grid">
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '400px' }}>
                    <div style={{ flex: 1 }}>
                      <DateInput
                        label="From Date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        style={{ width: '100%' }}
                        inputStyle={{ padding: '6px 8px', fontSize: '14px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <DateInput
                        label="To Date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        min={fromDate}
                        style={{ width: '100%' }}
                        inputStyle={{ padding: '6px 8px', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                  
                  <DropInput
                    label="Request ID"
                    value={selectedRequestId}
                    onChange={(e) => setSelectedRequestId(e.target.value)}
                    width={'250px'}
                    options={requestOptions}
                  />
                  <DropInput 
                    label="Outlet" 
                    value={selectedOutlet}
                    onChange={(e) => setSelectedOutlet(e.target.value)}
                    width={'200px'}
                    options={[
                      {label:'Operating Room 1',value:'OR-1'},
                      {label:'Operating Room 2',value:'OR-2'},
                      {label:'ICU',value:'ICU'},
                    ]}
                  />
                  <Input 
                    label="Issue Time" 
                    type="text" 
                    value={new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })} 
                    width={'150px'}
                  />
                  <Input 
                    type="text" 
                    label="Issue Date" 
                    value={new Date().toISOString().split("T")[0]} 
                    width={'150px'}
                  />
                  <div style={{ display: 'flex', alignContent:'center',alignItems:'center'}}>
                    <ButtonWithGradient
                      type="submit"
                      className="button-gradient"
                      disabled={!selectedRequestId || !selectedOutlet || loading}
                    >
                      {loading ? "Issuing..." : "Issue Item"}
                    </ButtonWithGradient>
                  </div>
                </div>
              </form>
            </div>
          </div>
            </div>
            <div className="flex justify-content-end gap-2 mt-4">
              <ButtonWithGradient 
                type="button" 
                className={`button-gradient ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 0}
              >
                Back
              </ButtonWithGradient>
              <ButtonWithGradient 
                type="button" 
                className={`button-gradient ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => currentStep < 1 && setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1}
              >
                Next
              </ButtonWithGradient>
            </div>
          </>
        )}
        {currentStep === 1 && (
          <>
        <div className="issue-table">
          <div className="issue-table-header">
             Issue History
            <div className="search-container">
              <Searchbar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="issue-table-content">
            <Table columns={columns} data={filteredIssuedItems} />
          </div>
        </div>
            <div className="flex justify-content-end gap-2 mt-4">
              <ButtonWithGradient 
                type="button" 
                className={`button-gradient ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 0}
              >
                Back
              </ButtonWithGradient>
              <ButtonWithGradient 
                type="button" 
                className={`button-gradient ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => currentStep < 1 && setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1}
              >
                Next
              </ButtonWithGradient>
            </div>
          </>
        )}
      </PageContainer>
      <Footer />
    </>
  );
};

export default IssueItem;
