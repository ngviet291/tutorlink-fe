import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { subjectService } from '../service/subject.service'
import type { SubjectPayload } from '../types/subject.types'

export function useSubjects() {
  return useQuery({ queryKey: queryKeys.subjects.all, queryFn: subjectService.getSubjects, staleTime: 5 * 60_000 })
}

export function useSubjectMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.subjects.all })
  return {
    create: useMutation({ mutationFn: (p: SubjectPayload) => subjectService.createSubject(p), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (v: { id: string; payload: SubjectPayload }) => subjectService.updateSubject(v.id, v.payload), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => subjectService.deleteSubject(id), onSuccess: invalidate }),
  }
}
