"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiFetch } from "@/lib/api-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, ChevronRight, RefreshCw, Search, Users } from "lucide-react"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/admin-display"

interface Address {
  city: string | null
  state: string | null
  country: string | null
  landmark: string | null
  latitude: string | null
  longitude: string | null
  address_id: string | null
  is_default: number | null
  postal_code: string | null
  phone_number: string | null
  address_line1: string | null
  address_line2: string | null
}

interface Customer {
  customer_id: string | null
  name: string | null
  email: string | null
  phone: string | null
  status: string | null
  isActive: number | null
  created_at: string | null
  addresses: Address[] | null
}

const getInitials = (name: string | null | undefined) => {
  if (!name || typeof name !== "string" || name.trim() === "") {
    return "??"
  }

  return name
    .trim()
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function CustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiFetch("/users")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch customers")
      }

      setCustomers(data.result)
      setTotalCount(data.totalCustomersCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchCustomers()
  }, [])

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return customers.filter((customer) => {
      const name = (customer.name ?? "").toLowerCase()
      const email = (customer.email ?? "").toLowerCase()
      const phone = (customer.phone ?? "").toLowerCase()
      const customerId = (customer.customer_id ?? "").toLowerCase()

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        customerId.includes(query)
      )
    })
  }, [customers, searchTerm])

  if (loading) {
    return <LoadingSpinner message="Loading customers..." />
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Unable to Load Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchCustomers} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Customers"
        description="Browse customers and open individual profiles."
        meta={<span>{totalCount} total customers</span>}
        actions={
          <Button variant="outline" onClick={fetchCustomers}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, phone, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description={searchTerm ? "No customers match your current search." : "No customers are available right now."}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, index) => (
                    <TableRow
                      key={`${customer.customer_id ?? customer.email ?? "customer"}-${index}`}
                      className="group cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => {
                        if (customer.customer_id) {
                          navigate(`/users/profile/${customer.customer_id}`)
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{customer.name || "Unknown Customer"}</p>
                            <p className="text-xs text-muted-foreground">{customer.customer_id || "No customer ID"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{customer.email || "-"}</p>
                          <p className="text-xs text-muted-foreground">{customer.phone || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={customer.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}
                        >
                          {customer.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{customer.created_at ? formatDate(customer.created_at) : "-"}</TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
