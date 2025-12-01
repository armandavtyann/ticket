'use client';

import { useState, useEffect, useCallback, useRef, useMemo, useTransition } from 'react';
import { Table, Button, Space, message, Tag, Modal, Form, Input, Select, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ticketApi, jobApi } from '@/lib/api';
import { Ticket } from '@/types/api.types';
import { useSocket } from '@/hooks/useSocket';
import JobProgressBanner from '@/components/JobProgressBanner';
import { useRouter } from 'next/navigation';
import { getIdempotencyKey } from '@/utils/idempotency';

const { TextArea } = Input;

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const completedJobIdsRef = useRef<Set<string>>(new Set()); // Track completed jobs to prevent duplicate messages
  const canceledJobIdsRef = useRef<Set<string>>(new Set()); // Track canceled jobs to prevent duplicate messages
  const failedJobIdsRef = useRef<Set<string>>(new Set()); // Track failed jobs to prevent duplicate messages
  const hiddenJobIdsRef = useRef<Set<string>>(new Set()); // Track jobs that should be hidden (completed/failed/canceled)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  const loadTickets = useCallback(async (page: number = 1, limit?: number) => {
    setLoading(true);
    try {
      const pageSize = limit || pagination.limit;
      const data = await ticketApi.getAll(page, pageSize);
      
      startTransition(() => {
        setTickets(data.tickets);
        setPagination(data.pagination);
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load tickets';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, startTransition]);

  useEffect(() => {
    loadTickets(1);
  }, []); // Only load on mount

  useEffect(() => {
    setSelectedRowKeys([]);
  }, [pagination.page, pagination.limit]);

  const handleCreate = () => {
    setEditingTicket(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    form.setFieldsValue({
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await ticketApi.delete(id);
      message.success('Ticket deleted successfully');
      loadTickets(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete ticket');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingTicket) {
        await ticketApi.update(editingTicket.id, values);
        message.success('Ticket updated successfully');
      } else {
        await ticketApi.create(values);
        message.success('Ticket created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      loadTickets(pagination.page, pagination.limit);
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation errors
        return;
      }
      message.error(error.response?.data?.error || 'Failed to save ticket');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingTicket(null);
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select tickets to delete');
      return;
    }

    const ticketCount = selectedRowKeys.length;
    
    if (ticketCount > 1000) {
      message.warning(`You are about to delete ${ticketCount} tickets. This may take a while.`);
    }
    
    const ticketIds = [...selectedRowKeys];
    const userId = 'user-1';

    try {
      const idempotencyKey = await getIdempotencyKey(userId, 'bulk-delete', { ticketIds });

      const job = await jobApi.create({
        type: 'bulk-delete',
        payload: { ticketIds },
        idempotencyKey,
      });

      if (job.message === 'Job already exists') {
        message.info('Bulk delete job already exists - showing existing job progress');
      } else {
        message.success(`Bulk delete job started - Deleting ${ticketCount} tickets`);
      }

      const jobData = {
        id: job.id,
        status: job.status || 'queued',
        progress: job.progress || 0,
      };
      
      completedJobIdsRef.current.delete(job.id);
      canceledJobIdsRef.current.delete(job.id);
      failedJobIdsRef.current.delete(job.id);
      hiddenJobIdsRef.current.delete(job.id);
      
      setCurrentJob(jobData);
      setSelectedRowKeys([]);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to start bulk delete');
    }
  };

  const handleSocketEvent = useCallback((event: string, data: any) => {
    if (hiddenJobIdsRef.current.has(data.jobId)) {
      return;
    }

    if (event === 'jobs:progress') {
      const progressValue = Math.round(data.progress || 0);
      setCurrentJob((prev: any) => {
        // Don't show if job is already hidden
        if (hiddenJobIdsRef.current.has(data.jobId)) {
          return null;
        }

        if (prev && prev.id && data.jobId === prev.id) {
          const newStatus = data.status || prev.status;
          const newProgress = progressValue;
          
          // If job is completed or succeeded, hide the banner immediately
          if (newStatus === 'completed' || newStatus === 'succeeded') {
            hiddenJobIdsRef.current.add(data.jobId);
            loadTickets(pagination.page, pagination.limit);
            return null;
          }
          
          return { 
            ...prev, 
            progress: newProgress, 
            status: newStatus 
          };
        }
        // If no current job but we got progress, create one (fallback)
        if (data.jobId && (!prev || !prev.id) && !hiddenJobIdsRef.current.has(data.jobId)) {
          return {
            id: data.jobId,
            status: data.status || 'running',
            progress: progressValue,
          };
        }
        return prev;
      });
    } else if (event === 'jobs:completed' || event === 'jobs:succeeded') {
      if (completedJobIdsRef.current.has(data.jobId)) {
        return;
      }
      completedJobIdsRef.current.add(data.jobId);
      hiddenJobIdsRef.current.add(data.jobId);
      message.success('Bulk delete completed');
      setCurrentJob((prev: any) => {
        if (prev && data.jobId === prev.id) {
          loadTickets(pagination.page, pagination.limit);
          return null;
        }
        return prev;
      });
    } else if (event === 'jobs:failed') {
      if (failedJobIdsRef.current.has(data.jobId)) {
        return;
      }
      failedJobIdsRef.current.add(data.jobId);
      hiddenJobIdsRef.current.add(data.jobId);
      message.error('Bulk delete failed');
      setCurrentJob((prev: any) => {
        if (prev && data.jobId === prev.id) {
          return null;
        }
        return prev;
      });
    } else if (event === 'jobs:canceled') {
      if (canceledJobIdsRef.current.has(data.jobId)) {
        return;
      }
      canceledJobIdsRef.current.add(data.jobId);
      hiddenJobIdsRef.current.add(data.jobId);
      message.info('Bulk delete canceled');
      setCurrentJob((prev: any) => {
        if (prev && data.jobId === prev.id) {
          return null;
        }
        return prev;
      });
    } else if (event === 'jobs:created') {
      if (data.jobId && !hiddenJobIdsRef.current.has(data.jobId)) {
        setCurrentJob((prev: any) => prev?.id === data.jobId ? { ...prev, ...data } : prev);
      }
    }
  }, [loadTickets, pagination.page, pagination.limit]);

  useSocket('user-1', handleSocketEvent);

  const columns = useMemo(() => [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          open: 'blue',
          'in-progress': 'orange',
          resolved: 'green',
          closed: 'default',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Ticket) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete ticket"
            description="Are you sure you want to delete this ticket?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], []);

  const handleSelectionChange = useCallback((keys: React.Key[]) => {
    startTransition(() => {
      setSelectedRowKeys(keys as string[]);
    });
  }, [startTransition]);

  const rowSelection = useMemo(() => ({
    selectedRowKeys,
    onChange: handleSelectionChange,
    preserveSelectedRowKeys: true,
    type: 'checkbox' as const,
    checkStrictly: false,
  }), [selectedRowKeys, handleSelectionChange]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Support Tickets</h1>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Create Ticket
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={handleBulkDelete}
            disabled={selectedRowKeys.length === 0 || !!currentJob}
          >
            Delete Selected ({selectedRowKeys.length})
          </Button>
          <Button onClick={() => router.push('/jobs')}>Job Center</Button>
        </Space>
      </div>

      {currentJob && currentJob.id && !hiddenJobIdsRef.current.has(currentJob.id) && (
        <div key={currentJob.id}>
          <JobProgressBanner job={currentJob} />
        </div>
      )}

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={tickets}
        rowKey="id"
        loading={loading || isPending}
        scroll={{ 
          y: 600, 
          x: 'max-content',
          scrollToFirstRowOnChange: true,
        }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['20', '100', '1000', '5000'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tickets`,
          onChange: (page: number, pageSize?: number) => {
            loadTickets(page, pageSize);
          },
          onShowSizeChange: (current: number, size: number) => {
            loadTickets(1, size);
          },
        }}
        size="small"
        virtual={false}
        rowClassName={() => 'ticket-row'}
        components={{
          body: {
            row: (props: any) => <tr {...props} />,
          },
        }}
      />

      <Modal
        title={editingTicket ? 'Edit Ticket' : 'Create Ticket'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={editingTicket ? 'Update' : 'Create'}
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'open',
          }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter ticket title' }]}
          >
            <Input placeholder="Enter ticket title" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              rows={4}
              placeholder="Enter ticket description"
            />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="open">Open</Select.Option>
              <Select.Option value="in-progress">In Progress</Select.Option>
              <Select.Option value="resolved">Resolved</Select.Option>
              <Select.Option value="closed">Closed</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

