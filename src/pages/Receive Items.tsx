import { useState, useEffect} from "react";
import { useLocation ,useNavigate} from "react-router-dom";
import { format } from "date-fns";
import Header from "../components/Header";
// import { useToast } from "@/hooks/use-toast";
import Footer from "../components/Footer";
import "../styles/receiveitems.css";
import PageContainer from "../components/PageContainer";
import { Search, Eye, CheckCircle, Clock, XCircle } from "lucide-react";
import Table from "../components/Table";
import Searchbar from "../components/Searchbar";
import ButtonWithGradient from "../components/ButtonWithGradient";
import SectionHeading from "../components/SectionHeading";
import ApproveBtn from '../components/Approvebtn';
import RejectButton from '../components/Rejectbtn';
import DropInput from "../components/DropInput";
import DateInput from "../components/DateInput";

interface RequestItem {
  id: string;
  requestId?: string;
  outlet: string;
  items: string;
  quantity: number;
  priority: string;
  requestedBy?: string;
  status: string;
  date: string;
  time: string;
  receivedDate?: string;
  receivedTime?: string;
}

interface ReceiveItemsProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}

const ReceiveItems: React.FC<ReceiveItemsProps> = ({ sidebarCollapsed = false, toggleSidebar }) => {
  const navigate = useNavigate();
  
  // Initial mock data for received items
  const initialReceivedItems = [
    { id: 1, department: "Department 1", items: "Item 1", quantity: 10, status: "Pending" },
    { id: 2, department: "Department 2", items: "Item 2", quantity: 20, status: "Processing" },
    { id: 3, department: "Department 3", items: "Item 3", quantity: 30, status: "Completed" }
  ];

  const [receivedItems, setReceivedItems] = useState(() => {
    const savedItems = localStorage.getItem("receivedItems");
    try {
      return savedItems ? JSON.parse(savedItems) : initialReceivedItems;
    } catch (error) {
      console.error("Error loading received items:", error);
      return initialReceivedItems;
    }
  });

  const [requestedItems, setRequestedItems] = useState<RequestItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch('http://localhost:3001/api/receive_items')
      .then(res => res.json())
      .then(data => setRequestedItems(data))
      .catch(() => setRequestedItems([]));
  }, []);

  // Filter and paginate requests
  const sortedItems = [...requestedItems].sort((a, b) => {
    // First try to sort by date if available
    if (a.date && b.date) {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      // If dates are the same, sort by ID in descending order
      if (dateDiff === 0) {
        return b.id.localeCompare(a.id);
      }
      return dateDiff;
    }
    // Fall back to sorting by ID in descending order
    return b.id.localeCompare(a.id);
  });
  
  const filteredItems = sortedItems.filter((item) => {
    const matchesSearch =
      item.requestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.outlet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.items?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      item.status?.toLowerCase() === statusFilter.toLowerCase();

    // Date filter
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(item.date) >= new Date(dateFrom);
    }
    if (dateTo) {
      matchesDate = matchesDate && new Date(item.date) <= new Date(dateTo);
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleStatusUpdate = async (itemId: string, newStatus: string) => {
    try {
      // Find the item to get its requestId before updating
      const itemToUpdate = requestedItems.find(item => item.id === itemId);
      
      if (!itemToUpdate) return;

      // Prepare the update data
      const updateData: any = { 
        status: newStatus 
      };

      // Only update receivedDate and receivedTime when approving/rejecting
      if (newStatus !== 'Pending') {
        updateData.receivedDate = format(new Date(), 'yyyy-MM-dd');
        updateData.receivedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      // Update the receive_items table
      await fetch(`http://localhost:3001/api/receive_items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      // Also update the corresponding cssd_requests table if requestId exists
      if (itemToUpdate.requestId) {
        await fetch(`http://localhost:3001/api/cssd_requests/${itemToUpdate.requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
      }

      // Update the local state to reflect the change immediately
      const updatedItems = requestedItems.map(item => 
        item.id === itemId 
          ? { ...item, status: newStatus, ...updateData }
          : item
      );
      
      setRequestedItems(updatedItems);
      
      // Show success message
      alert(`Request ${newStatus.toLowerCase()} successfully!`);
      
      // Force a refresh of the data to ensure consistency
      const res = await fetch('http://localhost:3001/api/receive_items');
      const updatedReceiveItems = await res.json();
      setRequestedItems(updatedReceiveItems);
      
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <>
      <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator/>
      <PageContainer>
        <SectionHeading title="Receive Items" subtitle="Manage received requests and update status" className="receiveitems-heading w-100" />
        
        <div className="card">
          {/* <div className="card-header"> */}
            {/* <h2 className="card-title">Previous Requests</h2> */}
          {/* </div> */}
          <div className="card-content">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <DropInput
                  label="Status"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                />
                <DateInput
                  label="From Date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
                <DateInput
                  label="To Date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>
              <div className="relative flex-1 max-w-md ml-auto">
                <Searchbar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {filteredItems.length > 0 ? (
              <Table
                columns={[
                  { key: 'requestId', header: 'Request ID' },
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
                        // For array items, sum up quantities
                        const items = JSON.parse(item.items);
                        if (Array.isArray(items)) {
                          return items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0);
                        }
                      } catch (e) {
                        // If not a valid JSON, use the quantity as is
                        return item.quantity;
                      }
                      return item.quantity;
                    }
                  },
                  { key: 'priority', header: 'Priority' },
                  { key: 'status', header: 'Status' },
                  { key: 'receivedDate', header: 'Received Date' },
                  { key: 'receivedTime', header: 'Received Time' },
                  {
                    key: 'actions',
                    header: 'Approval',
                    render: (item: any) => (
                      item.status === 'Approved' ? (
                        <span style={{ color: 'green', fontWeight: 600 }}>Approved</span>
                      ) : item.status === 'Rejected' ? (
                        <span style={{ color: 'red', fontWeight: 600 }}>Rejected</span>
                      ) : (
                        <div className="flex gap-2">
                          <ApproveBtn
                            onClick={() => handleStatusUpdate(item.id, 'Approved')}
                            className="button-gradient"
                            size={12}
                          />
                          <RejectButton
                            onClick={() => handleStatusUpdate(item.id, 'Rejected')}
                            className="button-gradient"
                            size={12}
                          />
                        </div>
                      )
                    )
                  }
                ]}
                data={filteredItems}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No requests found matching your criteria.
              </div>
            )}

          </div>
        </div>
      </PageContainer>
      <Footer />
    </>
  );
};

export default ReceiveItems;
