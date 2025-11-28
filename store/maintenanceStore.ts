import { create } from 'zustand';

type MaintenanceStatus = 'new' | 'under_review' | 'in_progress' | 'waiting_vendor' | 'resolved' | 'cancelled';
type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';
type MaintenanceCategory = 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'general';

export interface MaintenanceActivity {
  id: string;
  timestamp: string;
  message: string;
  actor: 'tenant' | 'landlord' | 'system';
}

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  property: string;
  unit: string;
  category: MaintenanceCategory;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  availability: string;
  permissionToEnter: boolean;
  attachments: { uri: string; type: string }[];
  status: MaintenanceStatus;
  vendor?: string;
  resolutionNotes?: string;
  activity: MaintenanceActivity[];
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceStore {
  requests: MaintenanceRequest[];
  selectedRequest?: MaintenanceRequest;
  addRequest: (input: Omit<MaintenanceRequest, 'id' | 'status' | 'activity' | 'createdAt' | 'updatedAt'>) => string;
  updateRequestStatus: (id: string, status: MaintenanceStatus, actor?: 'tenant' | 'landlord' | 'system') => void;
  assignVendor: (id: string, vendor: string) => void;
  addResolutionNotes: (id: string, notes: string) => void;
  selectRequest: (id?: string) => void;
}

const generateId = () => {
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `MR-${new Date().getFullYear()}${(new Date().getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${random}`;
};

const timestamp = () => new Date().toISOString();

const seedRequests: MaintenanceRequest[] = [
  {
    id: 'MR-202411-1001',
    tenantId: 'tenant-001',
    tenantName: 'John Doe',
    property: '123 Main St',
    unit: 'Unit 4B',
    category: 'plumbing',
    title: 'Leaky Faucet in Kitchen',
    description: 'Water dripping nonstop from the kitchen sink faucet. Tried tightening but no luck.',
    urgency: 'medium',
    availability: '2024-11-25T15:00:00.000Z',
    permissionToEnter: true,
    attachments: [],
    status: 'in_progress',
    vendor: 'FlowPro Plumbing',
    resolutionNotes: '',
    activity: [
      {
        id: 'act-1',
        timestamp: timestamp(),
        message: 'Request created by tenant.',
        actor: 'tenant',
      },
      {
        id: 'act-2',
        timestamp: timestamp(),
        message: 'Status changed to In Progress.',
        actor: 'landlord',
      },
    ],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'MR-202411-1002',
    tenantId: 'tenant-002',
    tenantName: 'Emily Clark',
    property: '101 Maple Rd',
    unit: 'Apt 3C',
    category: 'hvac',
    title: 'Heater not working',
    description: 'Heater blowing cold air even when set to heat mode.',
    urgency: 'high',
    availability: '2024-11-27T17:00:00.000Z',
    permissionToEnter: false,
    attachments: [],
    status: 'new',
    activity: [
      {
        id: 'act-3',
        timestamp: timestamp(),
        message: 'Request created by tenant.',
        actor: 'tenant',
      },
    ],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
];

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  requests: seedRequests,
  selectedRequest: undefined,

  addRequest: (input) => {
    const newRequest: MaintenanceRequest = {
      ...input,
      id: generateId(),
      status: 'under_review',
      activity: [
        {
          id: `act-${Date.now()}`,
          timestamp: timestamp(),
          message: 'Request submitted and is under review.',
          actor: 'system',
        },
      ],
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };

    set((state) => ({
      requests: [newRequest, ...state.requests],
      selectedRequest: newRequest,
    }));

    return newRequest.id;
  },

  updateRequestStatus: (id, status, actor = 'landlord') => {
    set((state) => {
      const updatedRequests = state.requests.map((req) =>
        req.id === id
          ? {
              ...req,
              status,
              updatedAt: timestamp(),
              activity: [
                ...req.activity,
                {
                  id: `act-${Date.now()}`,
                  timestamp: timestamp(),
                  message: `Status updated to ${status.replace('_', ' ')}`,
                  actor,
                },
              ],
            }
          : req,
      );
      return {
        requests: updatedRequests,
        selectedRequest: state.selectedRequest?.id === id ? updatedRequests.find((req) => req.id === id) : state.selectedRequest,
      };
    });
  },

  assignVendor: (id, vendor) => {
    set((state) => {
      const updatedRequests = state.requests.map((req) =>
        req.id === id
          ? {
              ...req,
              vendor,
              updatedAt: timestamp(),
              activity: [
                ...req.activity,
                {
                  id: `act-${Date.now()}`,
                  timestamp: timestamp(),
                  message: `Vendor assigned: ${vendor}`,
                  actor: 'landlord',
                },
              ],
            }
          : req,
      );
      return {
        requests: updatedRequests,
        selectedRequest: state.selectedRequest?.id === id ? updatedRequests.find((req) => req.id === id) : state.selectedRequest,
      };
    });
  },

  addResolutionNotes: (id, notes) => {
    set((state) => {
      const updatedRequests = state.requests.map((req) =>
        req.id === id
          ? {
              ...req,
              resolutionNotes: notes,
              updatedAt: timestamp(),
              activity: [
                ...req.activity,
                {
                  id: `act-${Date.now()}`,
                  timestamp: timestamp(),
                  message: 'Resolution notes updated.',
                  actor: 'landlord',
                },
              ],
            }
          : req,
      );
      return {
        requests: updatedRequests,
        selectedRequest: state.selectedRequest?.id === id ? updatedRequests.find((req) => req.id === id) : state.selectedRequest,
      };
    });
  },

  selectRequest: (id) => {
    if (!id) {
      set({ selectedRequest: undefined });
      return;
    }
    const request = get().requests.find((req) => req.id === id);
    set({ selectedRequest: request });
  },
}));

