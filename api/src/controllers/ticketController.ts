import { Request, Response } from 'express';
import { ticketService } from '../services/ticketService';
import { AuthRequest } from '../types/auth.types';

export const ticketController = {
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await ticketService.findAll(page, limit);
      res.json({
        tickets: result.tickets.map(ticket => ticket.toJSON()),
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const ticket = await ticketService.findById(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      res.json(ticket.toJSON());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { title, description, status } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      const ticket = await ticketService.create({ title, description, status });
      res.status(201).json(ticket.toJSON());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { title, description, status } = req.body;
      const ticket = await ticketService.update(req.params.id, { title, description, status });
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      res.json(ticket.toJSON());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await ticketService.softDelete(req.params.id);
      res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};

