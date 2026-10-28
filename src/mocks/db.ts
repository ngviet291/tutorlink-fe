import type { AuthUser, AuthorResponse, ContactInfo, StudentSummary } from '@/features/user/types/user.types'
import type { TutorResponse } from '@/features/tutor/types/tutor.types'
import type { PostResponse } from '@/features/post/types/post.types'
import type { ApplicationResponse } from '@/features/application/types/application.types'
import type { TransactionResponse } from '@/features/wallet/types/wallet.types'
import type { ReviewResponse } from '@/features/review/types/review.types'
import type { NotificationResponse } from '@/features/notification/types/notification.types'
import type { ChatMessage } from '@/features/chat/types/chat.types'
import type { FeeRateConfig } from '@/features/admin/types/admin.types'
import type { SubjectResponse } from '@/features/subject/types/subject.types'
import { LOCKED_PHONE } from '@/shared/utils/maskContact'

const HOUR = 3600_000
const DAY = 24 * HOUR
const ago = (ms: number): string => new Date(Date.now() - ms).toISOString()
const ahead = (ms: number): string => new Date(Date.now() + ms).toISOString()

/** Mật khẩu của mọi tài khoản demo: 12345678 */
export const DEMO_PASSWORD = '12345678'

/** Mật khẩu đã đổi trong phiên mock (userId → password). */
export const passwords: Record<string, string> = {}

export const subjects: SubjectResponse[] = [
  { id: 'sub-math', name: 'Toán', usageCount: 0 },
  { id: 'sub-lit', name: 'Văn', usageCount: 0 },
  { id: 'sub-eng', name: 'Tiếng Anh', usageCount: 0 },
  { id: 'sub-phy', name: 'Vật lý', usageCount: 0 },
  { id: 'sub-chem', name: 'Hóa học', usageCount: 0 },
  { id: 'sub-bio', name: 'Sinh học', usageCount: 0 },
  { id: 'sub-it', name: 'Tin học', usageCount: 0 },
  { id: 'sub-art', name: 'Nhạc / Nghệ thuật', usageCount: 0 },
]
const sub = (id: string): { id: string; name: string } => {
  const s = subjects.find((x) => x.id === id)
  if (!s) throw new Error(`subject ${id}`)
  return { id: s.id, name: s.name }
}

/** Thông tin liên hệ thật, chỉ trả ra khi đã mở khóa. */
export const contacts: Record<string, ContactInfo> = {
  's-1': { phone: '0901234567', email: 'student@demo.com' },
  's-2': { phone: '0912345678', email: 'nam.tran@demo.com' },
  's-3': { phone: '0987654321', email: 'vy.le@demo.com' },
  't-1': { phone: '0933111222', email: 'tutor@demo.com' },
  't-2': { phone: '0944222333', email: 'khoa.le@demo.com' },
  't-3': { phone: '0955333444', email: 'mai.pham@demo.com' },
  't-4': { phone: '0966444555', email: 'bao.nguyen@demo.com' },
  't-5': { phone: '0977555666', email: 'trang.do@demo.com' },
  't-6': { phone: '0888666777', email: 'tuan.vo@demo.com' },
  't-7': { phone: '0899777888', email: 'pending.tutor@demo.com' },
  't-8': { phone: '0866888999', email: 'rejected.tutor@demo.com' },
  'a-1': { phone: '0900000000', email: 'admin@demo.com' },
}

export const users: (AuthUser & { createdAt: string })[] = [
  { id: 's-1', fullName: 'Nguyễn Minh Anh', email: 'student@demo.com', phone: '0901234567', role: 'STUDENT', status: 'ACTIVE', address: { city: 'Hồ Chí Minh', district: 'Quận 1' }, createdAt: ago(60 * DAY) },
  { id: 's-2', fullName: 'Trần Hoàng Nam', email: 'nam.tran@demo.com', phone: '0912345678', role: 'STUDENT', status: 'ACTIVE', address: { city: 'Hồ Chí Minh', district: 'Quận 3' }, createdAt: ago(50 * DAY) },
  { id: 's-3', fullName: 'Lê Thảo Vy', email: 'vy.le@demo.com', phone: '0987654321', role: 'STUDENT', status: 'ACTIVE', address: { city: 'Hà Nội', district: 'Cầu Giấy' }, createdAt: ago(40 * DAY) },
  { id: 't-1', fullName: 'Trần Thị Hương', email: 'tutor@demo.com', phone: '0933111222', role: 'TUTOR', status: 'ACTIVE', profileStatus: 'APPROVED', address: { city: 'Hồ Chí Minh', district: 'Quận 1' }, createdAt: ago(90 * DAY) },
  { id: 't-2', fullName: 'Lê Văn Khoa', email: 'khoa.le@demo.com', phone: '0944222333', role: 'TUTOR', status: 'ACTIVE', profileStatus: 'APPROVED', createdAt: ago(85 * DAY) },
  { id: 't-3', fullName: 'Phạm Ngọc Mai', email: 'mai.pham@demo.com', phone: '0955333444', role: 'TUTOR', status: 'ACTIVE', profileStatus: 'APPROVED', createdAt: ago(80 * DAY) },
  { id: 't-4', fullName: 'Nguyễn Quốc Bảo', email: 'bao.nguyen@demo.com', phone: '0966444555', role: 'TUTOR', status: 'ACTIVE', profileStatus: 'APPROVED', createdAt: ago(70 * DAY) },
  { id: 't-5', fullName: 'Đỗ Thu Trang', email: 'trang.do@demo.com', phone: '0977555666', role: 'TUTOR', status: 'ACTIVE', profileStatus: 'APPROVED', createdAt: ago(65 * DAY) },
  { id: 't-6', fullName: 'Võ Minh Tuấn', email: 'tuan.vo@demo.com', phone: '0888666777', role: 'TUTOR', status: 'ACTIVE', profileStatus: 'APPROVED', createdAt: ago(30 * DAY) },
  { id: 't-7', fullName: 'Hoàng Gia Linh', email: 'pending.tutor@demo.com', phone: '0899777888', role: 'TUTOR', status: 'ACTIVE', profileStatus: 'PENDING', createdAt: ago(2 * DAY) },
  { id: 't-8', fullName: 'Bùi Anh Dũng', email: 'rejected.tutor@demo.com', phone: '0866888999', role: 'TUTOR', status: 'ACTIVE', profileStatus: 'REJECTED', createdAt: ago(10 * DAY) },
  { id: 'a-1', fullName: 'Quản trị viên', email: 'admin@demo.com', phone: '0900000000', role: 'ADMIN', status: 'ACTIVE', createdAt: ago(200 * DAY) },
]

function tutor(
  id: string,
  fullName: string,
  p: Partial<TutorResponse> & Pick<TutorResponse, 'subjects' | 'experienceYears' | 'hourlyRate' | 'averageRating' | 'profileStatus'>,
): TutorResponse {
  return {
    id,
    fullName,
    maskedPhone: LOCKED_PHONE,
    certificates: [],
    teachingMode: 'BOTH',
    educationLevels: ['SECONDARY', 'HIGH_SCHOOL'],
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    reviewCount: 0,
    schedule: [
      { day: 'MON', from: '18:00', to: '21:00' },
      { day: 'WED', from: '18:00', to: '21:00' },
      { day: 'SAT', from: '08:00', to: '17:00' },
    ],
    ...p,
  }
}

export const tutors: TutorResponse[] = [
  tutor('t-1', 'Trần Thị Hương', {
    subjects: [sub('sub-math'), sub('sub-phy')], experienceYears: 5, hourlyRate: 200000, averageRating: 4.8, reviewCount: 3,
    profileStatus: 'APPROVED', education: 'Cử nhân Sư phạm Toán — ĐH Sư phạm TP.HCM', district: 'Quận 1',
    bio: 'Giáo viên Toán – Lý với 5 năm kinh nghiệm ôn thi vào lớp 10 và THPT Quốc gia. Phương pháp rõ ràng, bám sát đề thi thực tế.',
    certificates: [{ id: 'c1', name: 'Chứng chỉ nghiệp vụ sư phạm', issuer: 'ĐH Sư phạm TP.HCM', year: 2019 }, { id: 'c2', name: 'IELTS 7.0', issuer: 'British Council', year: 2021 }],
    createdAt: ago(90 * DAY),
  }),
  tutor('t-2', 'Lê Văn Khoa', {
    subjects: [sub('sub-eng')], experienceYears: 3, hourlyRate: 180000, averageRating: 4.6, reviewCount: 2, profileStatus: 'APPROVED',
    education: 'Cử nhân Ngôn ngữ Anh — ĐH Ngoại thương', teachingMode: 'ONLINE', district: 'Quận 3', educationLevels: ['HIGH_SCHOOL', 'UNIVERSITY'],
    bio: 'Chuyên giao tiếp và luyện thi IELTS. Dạy online linh hoạt theo lịch của học viên.',
    certificates: [{ id: 'c3', name: 'IELTS 8.0', issuer: 'IDP', year: 2022 }], createdAt: ago(85 * DAY),
  }),
  tutor('t-3', 'Phạm Ngọc Mai', {
    subjects: [sub('sub-chem'), sub('sub-bio')], experienceYears: 7, hourlyRate: 250000, averageRating: 4.9, reviewCount: 2, profileStatus: 'APPROVED',
    education: 'Thạc sĩ Hóa học — ĐH Quốc gia Hà Nội', teachingMode: 'OFFLINE', city: 'Hà Nội', district: 'Cầu Giấy', educationLevels: ['HIGH_SCHOOL'],
    bio: 'Gần 100 học sinh đạt 8+ môn Hóa trong kỳ thi THPT. Giáo án chia theo chuyên đề, có kiểm tra định kỳ.',
    certificates: [{ id: 'c4', name: 'Giáo viên giỏi cấp thành phố', issuer: 'Sở GD&ĐT Hà Nội', year: 2020 }], createdAt: ago(80 * DAY),
  }),
  tutor('t-4', 'Nguyễn Quốc Bảo', {
    subjects: [sub('sub-it'), sub('sub-math')], experienceYears: 4, hourlyRate: 220000, averageRating: 4.7, reviewCount: 1, profileStatus: 'APPROVED',
    education: 'Kỹ sư CNTT — ĐH Bách Khoa TP.HCM', district: 'Thủ Đức', educationLevels: ['SECONDARY', 'HIGH_SCHOOL', 'UNIVERSITY'],
    bio: 'Dạy lập trình Python, C++ và tư duy thuật toán cho học sinh từ THCS đến đại học.', createdAt: ago(70 * DAY),
  }),
  tutor('t-5', 'Đỗ Thu Trang', {
    subjects: [sub('sub-lit')], experienceYears: 6, hourlyRate: 160000, averageRating: 4.5, reviewCount: 1, profileStatus: 'APPROVED',
    education: 'Cử nhân Ngữ văn — ĐH Sư phạm Đà Nẵng', city: 'Đà Nẵng', district: 'Hải Châu', educationLevels: ['SECONDARY', 'HIGH_SCHOOL'],
    bio: 'Giúp học sinh yêu văn, viết bài mạch lạc và đạt điểm cao các kỳ thi.', createdAt: ago(65 * DAY),
  }),
  tutor('t-6', 'Võ Minh Tuấn', {
    subjects: [sub('sub-math')], experienceYears: 2, hourlyRate: 120000, averageRating: 4.2, reviewCount: 0, profileStatus: 'APPROVED',
    education: 'Sinh viên năm cuối Sư phạm Toán', district: 'Quận 7', educationLevels: ['PRIMARY', 'SECONDARY'],
    bio: 'Nhiệt tình, kiên nhẫn, phù hợp học sinh cần lấy lại căn bản.', createdAt: ago(30 * DAY),
  }),
  tutor('t-7', 'Hoàng Gia Linh', {
    subjects: [sub('sub-art')], experienceYears: 3, hourlyRate: 200000, averageRating: 0, profileStatus: 'PENDING',
    education: 'Cử nhân Âm nhạc — Nhạc viện TP.HCM', bio: 'Dạy piano và thanh nhạc cho mọi lứa tuổi.', educationLevels: ['PRIMARY', 'SECONDARY'], createdAt: ago(2 * DAY),
    certificates: [{ id: 'c5', name: 'ABRSM Grade 8 Piano', issuer: 'ABRSM', year: 2018 }],
  }),
  tutor('t-8', 'Bùi Anh Dũng', {
    subjects: [sub('sub-phy')], experienceYears: 1, hourlyRate: 100000, averageRating: 0, profileStatus: 'REJECTED',
    reviewNote: 'Vui lòng bổ sung bằng cấp/chứng chỉ và ảnh đại diện rõ mặt rồi gửi lại.', bio: 'Sinh viên Vật lý.', createdAt: ago(10 * DAY),
  }),
]

const author = (userId: string): AuthorResponse => {
  const u = users.find((x) => x.id === userId)
  if (!u) throw new Error(`user ${userId}`)
  return { id: u.id, fullName: u.fullName, avatarUrl: u.avatarUrl, role: u.role, maskedPhone: LOCKED_PHONE }
}

interface PostSeed {
  id: string; title: string; content: string; type: PostResponse['type']; status: PostResponse['status']
  by: string; subject: string; level: PostResponse['educationLevel']; mode: PostResponse['teachingMode']
  city: string; district: string; min: number; max: number; spw: number; dur: number; deadlineDays: number; createdAgo: number
}

const postSeeds: PostSeed[] = [
  { id: 'p-1', title: 'Cần gia sư Toán 9 ôn thi vào lớp 10', content: 'Con đang học lớp 9, cần củng cố đại số và hình học, luyện đề thi vào 10. Ưu tiên gia sư có kinh nghiệm luyện thi, dạy tại nhà khu vực Quận 1.', type: 'FIND_TUTOR', status: 'PUBLISHED', by: 's-1', subject: 'sub-math', level: 'SECONDARY', mode: 'OFFLINE', city: 'Hồ Chí Minh', district: 'Quận 1', min: 2500000, max: 3500000, spw: 3, dur: 90, deadlineDays: 10, createdAgo: 5 * DAY },
  { id: 'p-2', title: 'Tìm gia sư Tiếng Anh giao tiếp lớp 11 (online)', content: 'Em muốn cải thiện phản xạ giao tiếp và phát âm, học online buổi tối. Có thể học thử một buổi.', type: 'FIND_TUTOR', status: 'PUBLISHED', by: 's-2', subject: 'sub-eng', level: 'HIGH_SCHOOL', mode: 'ONLINE', city: 'Hồ Chí Minh', district: 'Quận 3', min: 2000000, max: 3000000, spw: 2, dur: 60, deadlineDays: 7, createdAgo: 3 * DAY },
  { id: 'p-3', title: 'Gia sư Hóa 12 luyện thi đại học tại Cầu Giấy', content: 'Cần giáo viên Hóa có kinh nghiệm luyện thi khối A, B. Học 2 buổi/tuần.', type: 'FIND_TUTOR', status: 'PUBLISHED', by: 's-3', subject: 'sub-chem', level: 'HIGH_SCHOOL', mode: 'OFFLINE', city: 'Hà Nội', district: 'Cầu Giấy', min: 3000000, max: 4500000, spw: 2, dur: 120, deadlineDays: 14, createdAgo: 2 * DAY },
  { id: 'p-4', title: 'Tìm gia sư Tin học cho học sinh THCS', content: 'Bản nháp: học Scratch và Python cơ bản.', type: 'FIND_TUTOR', status: 'DRAFT', by: 's-1', subject: 'sub-it', level: 'SECONDARY', mode: 'BOTH', city: 'Hồ Chí Minh', district: 'Quận 1', min: 1500000, max: 2500000, spw: 2, dur: 90, deadlineDays: 20, createdAgo: 1 * DAY },
  { id: 'p-5', title: 'Cần gia sư Văn lớp 8', content: 'Cần cô giáo dạy Văn giúp con viết bài tốt hơn.', type: 'FIND_TUTOR', status: 'CLOSED', by: 's-2', subject: 'sub-lit', level: 'SECONDARY', mode: 'ONLINE', city: 'Đà Nẵng', district: 'Hải Châu', min: 1200000, max: 1800000, spw: 2, dur: 90, deadlineDays: -5, createdAgo: 30 * DAY },
  { id: 'p-6', title: 'Gia sư Toán – Lý THPT nhận thêm học viên khu vực TP.HCM', content: 'Mình có 5 năm kinh nghiệm, còn trống lịch tối thứ 2, 4 và cả ngày thứ 7. Nhận học viên lớp 10–12.', type: 'FIND_STUDENT', status: 'PUBLISHED', by: 't-1', subject: 'sub-math', level: 'HIGH_SCHOOL', mode: 'BOTH', city: 'Hồ Chí Minh', district: 'Quận 1', min: 2400000, max: 4000000, spw: 3, dur: 90, deadlineDays: 15, createdAgo: 4 * DAY },
  { id: 'p-7', title: 'Nhận dạy Hóa – Sinh luyện thi THPT tại Hà Nội', content: 'Dạy theo chuyên đề, có tài liệu riêng. Nhận nhóm nhỏ 1–3 học sinh.', type: 'FIND_STUDENT', status: 'PUBLISHED', by: 't-3', subject: 'sub-chem', level: 'HIGH_SCHOOL', mode: 'OFFLINE', city: 'Hà Nội', district: 'Cầu Giấy', min: 3000000, max: 5000000, spw: 2, dur: 120, deadlineDays: 25, createdAgo: 6 * DAY },
  { id: 'p-8', title: 'Cần gia sư Tiếng Anh cho bé lớp 3', content: 'Bé cần làm quen tiếng Anh qua trò chơi, giao tiếp cơ bản. Ưu tiên gia sư nhẹ nhàng, kiên nhẫn.', type: 'FIND_TUTOR', status: 'PUBLISHED', by: 's-3', subject: 'sub-eng', level: 'PRIMARY', mode: 'OFFLINE', city: 'Hồ Chí Minh', district: 'Thủ Đức', min: 1500000, max: 2200000, spw: 2, dur: 60, deadlineDays: 9, createdAgo: 1 * DAY },
  { id: 'p-9', title: 'Dạy lập trình Python cho học sinh THPT', content: 'Lộ trình từ cơ bản đến thuật toán, phù hợp đội tuyển Tin học.', type: 'FIND_STUDENT', status: 'PUBLISHED', by: 't-4', subject: 'sub-it', level: 'HIGH_SCHOOL', mode: 'BOTH', city: 'Hồ Chí Minh', district: 'Thủ Đức', min: 2500000, max: 4000000, spw: 2, dur: 90, deadlineDays: 18, createdAgo: 8 * DAY },
  { id: 'p-10', title: 'Cần gia sư Vật lý lớp 10', content: 'Củng cố cơ học và nhiệt học.', type: 'FIND_TUTOR', status: 'CLOSED', by: 's-3', subject: 'sub-phy', level: 'HIGH_SCHOOL', mode: 'BOTH', city: 'Hồ Chí Minh', district: 'Quận 7', min: 1800000, max: 2600000, spw: 2, dur: 90, deadlineDays: -8, createdAgo: 20 * DAY },
  { id: 'p-11', title: 'Gia sư Toán lớp 7 tại Quận 3', content: 'Con mất căn bản phần phân số và tỉ lệ thức, cần gia sư kiên nhẫn.', type: 'FIND_TUTOR', status: 'PUBLISHED', by: 's-2', subject: 'sub-math', level: 'SECONDARY', mode: 'OFFLINE', city: 'Hồ Chí Minh', district: 'Quận 3', min: 2000000, max: 3000000, spw: 2, dur: 90, deadlineDays: 6, createdAgo: 6 * DAY },
]

export const posts: PostResponse[] = postSeeds.map((s) => ({
  id: s.id, title: s.title, content: s.content, type: s.type, status: s.status,
  author: author(s.by), subject: sub(s.subject), educationLevel: s.level, teachingMode: s.mode,
  address: { city: s.city, district: s.district }, minBudget: s.min, maxBudget: s.max,
  sessionsPerWeek: s.spw, durationMinutes: s.dur, deadline: ahead(s.deadlineDays * DAY), createdAt: ago(s.createdAgo),
}))

const postRef = (id: string): PostResponse => {
  const p = posts.find((x) => x.id === id)
  if (!p) throw new Error(`post ${id}`)
  return p
}
const tutorRef = (id: string): TutorResponse => {
  const t = tutors.find((x) => x.id === id)
  if (!t) throw new Error(`tutor ${id}`)
  return t
}
export const studentSummary = (id: string): StudentSummary => {
  const u = users.find((x) => x.id === id)
  if (!u) throw new Error(`student ${id}`)
  return { id: u.id, fullName: u.fullName, avatarUrl: u.avatarUrl, city: u.address?.city }
}

function app(
  id: string, postId: string, applicantId: string, status: ApplicationResponse['status'], createdAgo: number,
  extra: Partial<ApplicationResponse> = {}, message?: string,
): ApplicationResponse {
  const isTutor = applicantId.startsWith('t-')
  return {
    id, post: postRef(postId), applicant: isTutor ? tutorRef(applicantId) : studentSummary(applicantId),
    status, message, createdAt: ago(createdAgo), ...extra,
  }
}

export const applications: ApplicationResponse[] = [
  app('ap-1', 'p-1', 't-1', 'PENDING', 4 * DAY, {}, 'Em đã dạy nhiều học sinh lớp 9 đỗ trường chuyên, có thể học thử buổi đầu.'),
  app('ap-2', 'p-1', 't-2', 'PENDING', 3.5 * DAY, {}, 'Mình dạy Anh nhưng cũng có thể hỗ trợ Toán cơ bản.'),
  app('ap-3', 'p-1', 't-3', 'PENDING', 4.5 * DAY, {}, 'Có kinh nghiệm luyện thi 10 nhiều năm.'),
  app('ap-4', 'p-1', 't-4', 'PENDING', 3 * DAY, {}, 'Mình dạy Toán tư duy và Tin, sẵn sàng đến tận nhà.'),
  app('ap-5', 'p-1', 't-5', 'PENDING', 2 * DAY),
  app('ap-6', 'p-1', 't-6', 'PENDING', 1 * DAY, {}, 'Mình nhiệt tình, giá hợp lý cho gia đình.'),
  app('ap-7', 'p-2', 't-2', 'PENDING', 2 * DAY, {}, 'Mình chuyên giao tiếp, học online linh hoạt.'),
  app('ap-8', 'p-3', 't-3', 'PENDING', 1.5 * DAY),
  app('ap-9', 'p-5', 't-5', 'ACCEPTED', 25 * DAY, { paid: true }),
  app('ap-10', 'p-10', 't-1', 'ACCEPTED', 15 * DAY, { paid: true }),
  app('ap-11', 'p-11', 't-1', 'ACCEPTED', 2 * HOUR, { awaitingPayment: true, payDeadline: ahead(22 * HOUR) }),
  app('ap-12', 'p-6', 's-2', 'PENDING', 1 * DAY, {}, 'Em học lớp 11, muốn ôn Toán – Lý, học tối thứ 2 và 4 được ạ.'),
]

export const wallets: Record<string, number> = { 't-1': 300000, 't-5': 100000, 't-3': 0 }

export const transactions: (TransactionResponse & { tutorId: string; tutorName: string })[] = [
  { id: 'tx-1', type: 'TOP_UP', amount: 500000, status: 'SUCCESS', createdAt: ago(20 * DAY), tutorId: 't-1', tutorName: 'Trần Thị Hương' },
  { id: 'tx-2', type: 'ENROLLMENT_FEE', amount: 200000, status: 'SUCCESS', applicationId: 'ap-10', createdAt: ago(15 * DAY), tutorId: 't-1', tutorName: 'Trần Thị Hương' },
  { id: 'tx-3', type: 'TOP_UP', amount: 1000000, status: 'FAILED', createdAt: ago(9 * DAY), tutorId: 't-1', tutorName: 'Trần Thị Hương' },
  { id: 'tx-4', type: 'TOP_UP', amount: 400000, status: 'SUCCESS', createdAt: ago(26 * DAY), tutorId: 't-5', tutorName: 'Đỗ Thu Trang' },
  { id: 'tx-5', type: 'ENROLLMENT_FEE', amount: 300000, status: 'SUCCESS', applicationId: 'ap-9', createdAt: ago(25 * DAY), tutorId: 't-5', tutorName: 'Đỗ Thu Trang' },
  { id: 'tx-6', type: 'TOP_UP', amount: 200000, status: 'PENDING', createdAt: ago(3 * HOUR), tutorId: 't-3', tutorName: 'Phạm Ngọc Mai' },
]

const student = (id: string): StudentSummary => studentSummary(id)

export const reviews: ReviewResponse[] = [
  { id: 'r-1', tutorId: 't-1', rating: 5, comment: 'Cô dạy rất dễ hiểu, con tiến bộ rõ rệt sau 2 tháng.', student: student('s-3'), createdAt: ago(10 * DAY), complaintStatus: 'NONE' },
  { id: 'r-2', tutorId: 't-1', rating: 5, comment: 'Giáo án bài bản, đúng giờ, nhiệt tình.', student: student('s-2'), createdAt: ago(30 * DAY), complaintStatus: 'NONE' },
  { id: 'r-3', tutorId: 't-1', rating: 2, comment: 'Lịch dạy hay thay đổi, bài tập hơi nhiều.', student: student('s-1'), createdAt: ago(40 * DAY), complaintStatus: 'OPEN', complaintReason: 'Lịch dạy đều do phụ huynh yêu cầu đổi nhiều lần; đánh giá không phản ánh đúng chất lượng giảng dạy.' },
  { id: 'r-4', tutorId: 't-2', rating: 5, comment: 'Phát âm chuẩn, giao tiếp tự nhiên.', student: student('s-1'), createdAt: ago(12 * DAY), complaintStatus: 'NONE' },
  { id: 'r-5', tutorId: 't-2', rating: 4, comment: 'Dạy tốt nhưng đôi lúc hơi nhanh.', student: student('s-3'), createdAt: ago(25 * DAY), complaintStatus: 'NONE' },
  { id: 'r-6', tutorId: 't-3', rating: 5, comment: 'Điểm Hóa tăng từ 6 lên 8.5.', student: student('s-2'), createdAt: ago(18 * DAY), complaintStatus: 'NONE' },
  { id: 'r-7', tutorId: 't-3', rating: 5, comment: 'Cô rất tâm huyết.', student: student('s-1'), createdAt: ago(35 * DAY), complaintStatus: 'RESOLVED', complaintReason: 'Nội dung đánh giá chứa thông tin cá nhân.', complaintDecision: 'KEPT', complaintDecisionNote: 'Đã kiểm tra, đánh giá hợp lệ nên giữ nguyên.' },
  { id: 'r-8', tutorId: 't-4', rating: 5, comment: 'Giỏi và thân thiện.', student: student('s-3'), createdAt: ago(22 * DAY), complaintStatus: 'NONE' },
  { id: 'r-9', tutorId: 't-5', rating: 4, comment: 'Con thích học Văn hơn rồi.', student: student('s-2'), createdAt: ago(8 * DAY), complaintStatus: 'NONE' },
]

export const notifications: Record<string, NotificationResponse[]> = {
  's-1': [
    { id: 'n-1', type: 'NEW_APPLICATION', title: 'Có 6 lượt ứng tuyển mới', body: 'Bài "Cần gia sư Toán 9 ôn thi vào lớp 10" đã có 6 gia sư đăng ký. Xem gợi ý AI Top 5.', read: false, createdAt: ago(1 * HOUR), link: '/post/p-1' },
    { id: 'n-2', type: 'POST_PUBLISHED', title: 'Bài đăng đã được đăng công khai', body: 'Bài viết của bạn đang hiển thị với mọi người.', read: true, createdAt: ago(5 * DAY), link: '/post/p-1' },
  ],
  't-1': [
    { id: 'n-3', type: 'SELECTED', title: 'Bạn được chọn nhận lớp!', body: 'Trần Hoàng Nam đã chọn bạn cho bài "Gia sư Toán lớp 7 tại Quận 3". Thanh toán phí nhận lớp trong 22 giờ để mở khóa liên hệ.', read: false, createdAt: ago(2 * HOUR), link: '/applications/mine' },
    { id: 'n-4', type: 'PROFILE_REVIEWED', title: 'Hồ sơ gia sư đã được duyệt', body: 'Bạn có thể đăng ký nhận lớp ngay bây giờ.', read: true, createdAt: ago(88 * DAY) },
    { id: 'n-5', type: 'PAYMENT_SUCCESS', title: 'Thanh toán phí nhận lớp thành công', body: 'Thông tin liên hệ và kênh chat đã được mở.', read: true, createdAt: ago(15 * DAY), link: '/chat/ap-10' },
  ],
  'a-1': [
    { id: 'n-6', type: 'REGISTERED', title: 'Hồ sơ gia sư mới chờ duyệt', body: 'Hoàng Gia Linh vừa gửi hồ sơ giảng dạy.', read: false, createdAt: ago(2 * DAY), link: '/admin/tutor-review' },
  ],
}

export const chatMessages: ChatMessage[] = [
  { id: 'm-1', applicationId: 'ap-10', senderId: 's-3', content: 'Chào cô, em xin phép xác nhận lịch học thứ 3 và thứ 6 ạ.', createdAt: ago(14 * DAY) },
  { id: 'm-2', applicationId: 'ap-10', senderId: 't-1', content: 'Chào em, cô đồng ý nhé. Buổi đầu cô sẽ kiểm tra đầu vào.', createdAt: ago(14 * DAY - 10 * 60000) },
  { id: 'm-3', applicationId: 'ap-9', senderId: 't-5', content: 'Chào phụ huynh, cô gửi lịch học thử ạ.', createdAt: ago(24 * DAY) },
]

export const feeRates: FeeRateConfig[] = [
  { id: 'fr-1', rate: 0.15, effectiveFrom: '2025-01-01', createdBy: 'Quản trị viên', active: false },
  { id: 'fr-2', rate: 0.2, effectiveFrom: '2025-06-01', createdBy: 'Quản trị viên', active: true },
]

export const favorites: Record<string, string[]> = { 's-1': ['t-3', 't-1'] }

/** Số liệu thống kê tĩnh cho demo (phần doanh thu quá khứ). */
export const revenueHistory: { label: string; revenue: number }[] = [
  { label: 'T5', revenue: 2_400_000 },
  { label: 'T6', revenue: 3_100_000 },
  { label: 'T7', revenue: 2_800_000 },
  { label: 'T8', revenue: 4_200_000 },
  { label: 'T9', revenue: 5_000_000 },
  { label: 'T10', revenue: 6_300_000 },
]

export function recountSubjectUsage(): void {
  for (const s of subjects) {
    const inPosts = posts.filter((p) => p.subject.id === s.id).length
    const inTutors = tutors.filter((t) => t.subjects.some((x) => x.id === s.id)).length
    s.usageCount = inPosts + inTutors
  }
}
recountSubjectUsage()

export const nextId = (() => {
  let n = 1000
  return (prefix: string): string => `${prefix}-${++n}`
})()
