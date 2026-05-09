import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  status: string;
  isDocumentVerified: boolean;
  created_at: string;
  business_type?: string;
  rating?: number;
}

const UsersPage: React.FC = () => {
  const { token } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('A');
  const [documentFilter, setDocumentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const documentVerified = documentFilter === 'verified' ? true : documentFilter === 'unverified' ? false : true;
      
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_PORT_ADMIN}/admin/v1/users?status=${statusFilter}&documentVerified=${documentVerified}&page=${currentPage}&limit=${itemsPerPage}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVendors(data);
        // Calculate total pages based on response
        setTotalPages(Math.ceil(50 / itemsPerPage)); // Mock total count
      }
    } catch (error) {
      toast.error("Failed to fetch vendors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [currentPage, statusFilter, documentFilter]);

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDocumentFilter = documentFilter === 'all' || 
                                 (documentFilter === 'verified' && vendor.isDocumentVerified) ||
                                 (documentFilter === 'unverified' && !vendor.isDocumentVerified);
    
    return matchesSearch && matchesDocumentFilter;
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status: string) => {
    return status === 'A' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getDocumentBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge variant="outline" className="border-green-300 text-green-700">
        <FileText className="w-3 h-3 mr-1" />
        Verified
      </Badge>
    ) : (
      <Badge variant="outline" className="border-orange-300 text-orange-700">
        <FileText className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-sm text-gray-600">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors Management</h1>
          <p className="text-muted-foreground">Manage vendor accounts, verification status, and business details</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            Total: {filteredVendors.length}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Active</SelectItem>
                <SelectItem value="I">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={documentFilter} onValueChange={setDocumentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Document Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Pending Verification</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchVendors}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  {vendor.name}
                </CardTitle>
                {getStatusBadge(vendor.status)}
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                ID: {vendor.id} • {vendor.business_type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 truncate">{vendor.email}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{vendor.phone}</span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <p>{vendor.address}</p>
                    <p>{vendor.city}, {vendor.state}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {getDocumentBadge(vendor.isDocumentVerified)}
                  {vendor.rating && (
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-yellow-600">★</span>
                      <span className="text-sm text-gray-600">{vendor.rating}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-muted-foreground">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredVendors.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || documentFilter !== 'all' ? 
                'No vendors match your current filters.' : 
                'No vendors available.'
              }
            </p>
            {(searchTerm || documentFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setDocumentFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filteredVendors.length > 0 && totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredVendors.length)} of {filteredVendors.length} vendors
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UsersPage;