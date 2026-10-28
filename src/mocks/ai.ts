import type { ApplicationResponse } from '@/features/application/types/application.types'
import { isTutorApplicant } from '@/features/application/types/application.types'
import type { TutorResponse } from '@/features/tutor/types/tutor.types'

interface Scored {
  app: ApplicationResponse
  score: number
  reason: string
}

/**
 * Chấm điểm theo quy tắc (dùng làm "AI" giả và cả fallback):
 * môn học 35, khu vực 20, lịch dạy/hình thức 15, kinh nghiệm 15, đánh giá 15.
 * Đồng điểm → ưu tiên đăng ký sớm.
 */
function scoreOne(app: ApplicationResponse): Scored | null {
  if (!isTutorApplicant(app.applicant)) {
    // Bài FIND_STUDENT: ứng viên là học viên → chấm đơn giản theo khu vực
    const sameCity = app.applicant.city === app.post.address.city
    return {
      app,
      score: sameCity ? 85 : 60,
      reason: sameCity ? 'Cùng khu vực với bạn' : 'Khác khu vực, có thể học online',
    }
  }
  const t: TutorResponse = app.applicant
  const reasons: string[] = []
  let score = 0

  if (t.subjects.some((s) => s.id === app.post.subject.id)) {
    score += 35
    reasons.push(`dạy đúng môn ${app.post.subject.name}`)
  } else {
    reasons.push('khác môn học yêu cầu')
  }

  if (t.city === app.post.address.city) {
    score += 12
    if (t.district === app.post.address.district) {
      score += 8
      reasons.push(`cùng ${t.district}`)
    } else {
      reasons.push(`cùng thành phố ${t.city}`)
    }
  }

  const mode = app.post.teachingMode
  if (t.teachingMode === 'BOTH' || t.teachingMode === mode || mode === 'BOTH') {
    score += 15
    reasons.push('hình thức dạy phù hợp')
  }

  score += Math.min(t.experienceYears, 7) * (15 / 7)
  if (t.experienceYears >= 4) reasons.push(`${t.experienceYears} năm kinh nghiệm`)

  score += (t.averageRating / 5) * 15
  if (t.averageRating >= 4.5) reasons.push(`đánh giá ${t.averageRating.toFixed(1)}★`)

  const text = reasons.slice(0, 3).join(', ')
  return { app, score: Math.round(Math.min(score, 100)), reason: text.charAt(0).toUpperCase() + text.slice(1) }
}

export function rankApplications(apps: ApplicationResponse[], top = 5): ApplicationResponse[] {
  return apps
    .filter((a) => a.status === 'PENDING')
    .map(scoreOne)
    .filter((x): x is Scored => x !== null)
    .sort((a, b) => b.score - a.score || new Date(a.app.createdAt).getTime() - new Date(b.app.createdAt).getTime())
    .slice(0, top)
    .map((x, i) => ({ ...x.app, aiScore: x.score, aiReason: x.reason, aiRank: i + 1 }))
}
