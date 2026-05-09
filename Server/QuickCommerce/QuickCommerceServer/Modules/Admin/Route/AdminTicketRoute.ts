import { Router } from 'express';
import * as serviceRecordController from '../Controller/AdminTicketController';
import { authenticateAdminToken } from '../Middleware/AdminTokenAuthenticator';

const router = Router();
router.use(authenticateAdminToken);

// ── Primary routes (new frontend: GET /admin/v1/tickets) ──────────────────
// Get all service records with optional filters
router.get('/', serviceRecordController.getAllTickets);

// Get ticket statistics
router.get('/stats', serviceRecordController.getTicketStatistics);

// ── Legacy alias routes (old frontend: GET /admin/v1/tickets/tickets) ─────
// These mirror the primary routes to avoid breaking old cached JS bundles
router.get('/tickets', serviceRecordController.getAllTickets);
router.get('/tickets/stats', serviceRecordController.getTicketStatistics);
router.patch('/tickets/:ticket_number', serviceRecordController.updateTicket);
router.delete('/tickets/:ticket_number', serviceRecordController.deleteTicket);
router.post('/tickets/:ticket_number/attachments', serviceRecordController.addTicketAttachment);
router.get('/tickets/:ticket_number/attachments', serviceRecordController.getTicketAttachments);
router.get('/tickets/:ticket_number', serviceRecordController.getTicketByNumber);

// ── Parameterised routes ──────────────────────────────────────────────────
// Update a service record (status, agent_id, resolution_notes)
router.patch('/:ticket_number', serviceRecordController.updateTicket);

// Delete a service record
router.delete('/:ticket_number', serviceRecordController.deleteTicket);

// Add / get attachments
router.post('/:ticket_number/attachments', serviceRecordController.addTicketAttachment);
router.get('/:ticket_number/attachments', serviceRecordController.getTicketAttachments);

// Get a specific service record by ticket number — MUST be last
router.get('/:ticket_number', serviceRecordController.getTicketByNumber);

export default router;

