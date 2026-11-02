import type { ApplicationResponse } from '@/features/application/types/application.types'

interface Scored {
  app: ApplicationResponse
  score: number
  reason: string
}

/**
 * Chấm điểm theo quy tắc:
 * môn học 35, khu vực 20, kinh nghiệm 25, đánh giá 20.
 */
function scoreOne(app: ApplicationResponse): Scored {
  const t = app.tutor
  const reasons: string[] = []
  let score = 0

  if (t.subject?.id === app.post.subject.id) {
    score += 35
    reasons.push(`dạy đúng môn ${app.post.subject.name}`)
  } else {
    reasons.push('khác môn học yêu cầu')
  }

  if (t.address?.province === app.post.address.province) {
    score += 20
    reasons.push(`cùng khu vực ${app.post.address.province}`)
  }

  score += Math.min(t.experienceYears, 7) * (25 / 7)
  if (t.experienceYears >= 4) reasons.push(`${t.experienceYears} năm kinh nghiệm`)

  score += (t.averageRating / 5) * 20
  if (t.averageRating >= 4.5) reasons.push(`đánh giá ${t.averageRating.toFixed(1)}★`)

  const text = reasons.slice(0, 3).join(', ')
  return { app, score: Math.round(Math.min(score, 100)), reason: text.charAt(0).toUpperCase() + text.slice(1) }
}

export function rankApplications(apps: ApplicationResponse[], top = 5): (ApplicationResponse & { aiScore: number; aiReason: string; aiRank: number })[] {
  return apps
    .filter((a) => a.applicationStatus === 'PENDING')
    .map(scoreOne)
    .sort((a, b) => b.score - a.score || new Date(a.app.appliedAt).getTime() - new Date(b.app.appliedAt).getTime())
    .slice(0, top)
    .map((x, i) => ({ ...x.app, aiScore: x.score, aiReason: x.reason, aiRank: i + 1 }))
}
