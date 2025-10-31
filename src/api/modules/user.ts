import service from '../request'

export interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

export const userApi = {
  getList: (page = 1, limit = 10) =>
    service.get<{ data: User[]; total: number }>(
      '/users',
      { params: { page, limit } }
    ),

  getById: (id: number) => service.get<User>(`/users/${id}`),

  create: (data: Omit<User, 'id' | 'createdAt'>) =>
    service.post<User>('/users', data),

  update: (id: number, data: Partial<User>) =>
    service.put<User>(`/users/${id}`, data),

  delete: (id: number) => service.delete(`/users/${id}`)
}
