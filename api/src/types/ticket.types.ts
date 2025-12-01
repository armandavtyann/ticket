export interface CreateTicketData {
  title: string;
  description?: string;
  status: string;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: string;
}

export interface TicketPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
