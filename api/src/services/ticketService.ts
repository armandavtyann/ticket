import Ticket from '../models/Ticket';
import { CreateTicketData, UpdateTicketData } from '../types/ticket.types';

export const ticketService = {
  async findAll(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where: { deletedAt: null },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      tickets,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  },

  async findById(id: string) {
    return Ticket.findOne({
      where: { id, deletedAt: null },
    });
  },

  async create(data: CreateTicketData) {
    return Ticket.create({
      title: data.title,
      description: data.description,
      status: data.status || 'open',
    });
  },

  async update(id: string, data: UpdateTicketData) {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    return ticket.update(data);
  },

  async softDelete(id: string) {
    const ticket = await Ticket.findByPk(id);
    if (!ticket || ticket.deletedAt) {
      throw new Error('Ticket not found or already deleted');
    }
    
    return ticket.update({
      deletedAt: new Date(),
    });
  },

};

