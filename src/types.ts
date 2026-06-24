export interface UserProfile {
  uid: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    pixiv?: string;
    facebook?: string;
    email?: string;
    custom?: string;
  };
  portfolioVisible: boolean;
}

export interface Commission {
  id: string;
  userId: string;
  title: string;
  clientName: string;
  description: string;
  price: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  deadline: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  projectId: string; // empty string or valid commission ID
  title: string;
  completed: boolean;
  dueDate: string;
  createdAt: string;
}

export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  imageUrl: string;
  description: string;
  visible: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  freelancerId: string;
  clientName: string;
  clientEmail: string;
  title: string;
  description: string;
  budget: number;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
