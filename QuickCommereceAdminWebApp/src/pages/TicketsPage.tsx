"use client"

import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Paperclip,
  Save,
  Search,
  Ticket,
  Trash2,
  TriangleAlert,
  User,
} from "lucide-react"
import { formatDate, formatDateTime } from "@/lib/admin-display"

interface TicketData {
  id: number
  ticket_number: string
  vendor_id: string
  agent_id: string | null
  category: string
  priority: "low" | "medium" | "high" | "urgent"
  subject: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  resolution_notes: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
}

interface AttachmentData {
  id: number
  ticket_number: string
  filename: string
  created_at: string
}

const TICKETS_PER_PAGE = 10

const getStatusClass = (status: string) =>
  ({
    open: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-slate-50 text-slate-600 border-slate-200",
  }[status] ?? "bg-slate-50 text-slate-600 border-slate-200")

const getPriorityClass = (priority: string) =>
  ({
    low: "bg-slate-50 text-slate-600 border-slate-200",
    medium: "bg-blue-50 text-blue-700 border-blue-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    urgent: "bg-red-50 text-red-700 border-red-200",
  }[priority] ?? "bg-slate-50 text-slate-600 border-slate-200")

const formatStatus = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editStatus, setEditStatus] = useState("")
  const [editAgentId, setEditAgentId] = useState("")
  const [editResolutionNotes, setEditResolutionNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<AttachmentData[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiFetch("/tickets/tickets")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch tickets")
      }

      setTickets(data.data)
      setTotalCount(data.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchTickets()
  }, [])

  const fetchAttachments = async (ticketNumber: string) => {
    setAttachmentsLoading(true)
    try {
      const response = await apiFetch(`/tickets/tickets/${ticketNumber}/attachments`)
      const data = await response.json()
      setAttachments(data.success ? data.data : [])
    } catch {
      setAttachments([])
    } finally {
      setAttachmentsLoading(false)
    }
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        ticket.ticket_number.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.vendor_id.toLowerCase().includes(query)

      return matchesSearch && (statusFilter === "all" || ticket.status === statusFilter) && (priorityFilter === "all" || ticket.priority === priorityFilter)
    })
  }, [tickets, searchQuery, statusFilter, priorityFilter])

  const totalPages = Math.ceil(filteredTickets.length / TICKETS_PER_PAGE)

  const paginatedTickets = useMemo(() => {
    return filteredTickets.slice((currentPage - 1) * TICKETS_PER_PAGE, currentPage * TICKETS_PER_PAGE)
  }, [filteredTickets, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, priorityFilter])

  const stats = useMemo(
    () => [
      { label: "Total Tickets", value: totalCount },
      { label: "Open", value: tickets.filter((ticket) => ticket.status === "open").length },
      { label: "In Progress", value: tickets.filter((ticket) => ticket.status === "in_progress").length },
      { label: "Resolved", value: tickets.filter((ticket) => ticket.status === "resolved").length },
    ],
    [tickets, totalCount],
  )

  const handleTicketClick = (ticket: TicketData) => {
    setSelectedTicket(ticket)
    setEditStatus(ticket.status)
    setEditAgentId(ticket.agent_id ?? "")
    setEditResolutionNotes(ticket.resolution_notes ?? "")
    setSaveError(null)
    setIsDeleteConfirm(false)
    setAttachments([])
    setIsModalOpen(true)
    void fetchAttachments(ticket.ticket_number)
  }

  const handleSave = async () => {
    if (!selectedTicket) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const response = await apiFetch(`/tickets/tickets/${selectedTicket.ticket_number}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: editStatus,
          agent_id: editAgentId || null,
          resolution_notes: editResolutionNotes || null,
        }),
      })
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Update failed")
      }

      setIsModalOpen(false)
      setSelectedTicket(null)
      await fetchTickets()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTicket) return

    setIsDeleting(true)
    try {
      const response = await apiFetch(`/tickets/tickets/${selectedTicket.ticket_number}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Delete failed")
      }

      setIsModalOpen(false)
      setSelectedTicket(null)
      await fetchTickets()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete")
      setIsDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Support Tickets" description="Manage and respond to vendor support requests." />

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              {loading ? <Skeleton className="mt-2 h-6 w-12" /> : <p className="mt-1 text-2xl font-semibold">{stat.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ticket number, subject, or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Ticket", "Subject", "Category", "Vendor", "Priority", "Status", "Created"].map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Array.from({ length: 7 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState
                        icon={Ticket}
                        title="No tickets found"
                        description="Try adjusting your search or filter settings."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handleTicketClick(ticket)}>
                      <TableCell className="text-xs font-medium">{ticket.ticket_number}</TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="text-sm font-medium truncate">{ticket.subject}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{ticket.description}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.category}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {ticket.vendor_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] capitalize ${getPriorityClass(ticket.priority)}`}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${getStatusClass(ticket.status)}`}>
                          {formatStatus(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs">{formatDate(ticket.created_at)}</p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            setIsDeleteConfirm(false)
            setSaveError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 border-b px-6 pb-4 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-base font-semibold">{selectedTicket?.ticket_number}</DialogTitle>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{selectedTicket?.subject}</p>
              </div>
              <Badge variant="outline" className={`text-xs capitalize ${getPriorityClass(selectedTicket?.priority ?? "low")}`}>
                {selectedTicket?.priority}
              </Badge>
            </div>
          </DialogHeader>

          {selectedTicket ? (
            <Tabs defaultValue="details" className="flex flex-1 flex-col overflow-hidden">
              <TabsList className="mx-6 mb-1 mt-3 w-fit">
                <TabsTrigger value="details" className="text-xs">
                  Details
                </TabsTrigger>
                <TabsTrigger value="update" className="text-xs">
                  Update
                </TabsTrigger>
                <TabsTrigger value="attachments" className="text-xs">
                  <Paperclip className="mr-1 h-3 w-3" />
                  Attachments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6">
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="outline" className={`text-xs ${getStatusClass(selectedTicket.status)}`}>
                      {formatStatus(selectedTicket.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Category</p>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{selectedTicket.category}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Vendor ID</p>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{selectedTicket.vendor_id}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Agent ID</p>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{selectedTicket.agent_id ?? "-"}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs">{formatDateTime(selectedTicket.created_at)}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs">{formatDateTime(selectedTicket.updated_at)}</span>
                    </div>
                  </div>
                  {selectedTicket.closed_at ? (
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs text-muted-foreground">Closed At</p>
                      <span className="text-xs">{formatDateTime(selectedTicket.closed_at)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                  <div className="rounded-lg bg-muted/40 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedTicket.description}</p>
                  </div>
                </div>

                {selectedTicket.resolution_notes ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Resolution Notes</p>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-800">{selectedTicket.resolution_notes}</p>
                    </div>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="update" className="mt-0 flex-1 overflow-y-auto px-6 pb-4">
                {!isDeleteConfirm ? (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Agent ID</label>
                      <Input value={editAgentId} onChange={(e) => setEditAgentId(e.target.value)} placeholder="Assign agent ID..." className="h-9 text-sm" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Resolution Notes</label>
                      <Textarea
                        value={editResolutionNotes}
                        onChange={(e) => setEditResolutionNotes(e.target.value)}
                        placeholder="Add resolution notes..."
                        className="min-h-[100px] resize-none text-sm"
                        rows={4}
                      />
                    </div>

                    {saveError ? (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{saveError}</AlertDescription>
                      </Alert>
                    ) : null}

                    <DialogFooter className="flex-row justify-between pt-2 sm:justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setIsDeleteConfirm(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Ticket
                      </Button>
                      <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                      <TriangleAlert className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Delete {selectedTicket.ticket_number}?</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        This will permanently remove the ticket and all its attachments. This cannot be undone.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsDeleteConfirm(false)} disabled={isDeleting}>
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Yes, Delete
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="attachments" className="mt-0 flex-1 overflow-y-auto px-6 pb-6">
                <div className="space-y-2 pt-2">
                  {attachmentsLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((index) => (
                        <Skeleton key={index} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Paperclip className="h-7 w-7" />
                      <p className="text-sm">No attachments</p>
                    </div>
                  ) : (
                    attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-muted">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{attachment.filename}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(attachment.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
