import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Job {
  id: string
  name: string
  type: string
  status: string
  progress: number
  priority: number
  execution_time?: number
}

export const useJobStore = defineStore('job', () => {
  const jobs = ref<Job[]>([])

  const addJob = (job: Job) => {
    const existing = jobs.value.find(j => j.id === job.id)
    if (!existing) {
      jobs.value.push(job)
    }
  }

  const updateJob = (jobId: string, updates: Partial<Job>) => {
    const job = jobs.value.find(j => j.id === jobId)
    if (job) {
      Object.assign(job, updates)
    }
  }

  const removeJob = (jobId: string) => {
    jobs.value = jobs.value.filter(j => j.id !== jobId)
  }

  return {
    jobs,
    addJob,
    updateJob,
    removeJob
  }
})