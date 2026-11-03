import type { AuthUser } from "@/features/user/types/user.types";
import type { TutorResponse } from "@/features/tutor/types/tutor.types";
import type { PostResponse } from "@/features/post/types/post.types";
import type { ApplicationResponse } from "@/features/application/types/application.types";
import type { TransactionResponse } from "@/features/wallet/types/wallet.types";
import type { SubjectResponse } from "@/features/subject/types/subject.types";
import type { NotificationResponse } from "@/features/notification/types/notification.types";
import type { ReviewResponse } from "@/features/review/types/review.types";
import type { ChatMessage } from "@/features/chat/types/chat.types";
import type {
  ContactInfo,
  StudentSummary,
} from "@/features/user/types/user.types";
import type {
  FeeRateConfig,
  RevenuePoint,
} from "@/features/admin/types/admin.types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const ago = (ms: number): string => new Date(Date.now() - ms).toISOString();
const ahead = (ms: number): string => new Date(Date.now() + ms).toISOString();

/** Mật khẩu của mọi tài khoản demo: 12345678 */
export const DEMO_PASSWORD = "12345678";

/** Mật khẩu đã đổi trong phiên mock (userId → password). */
export const passwords: Record<string, string> = {};

export const subjects: SubjectResponse[] = [
  {
    id: "019cef3d-54e0-7e12-85ae-da011bb1fa7d",
    name: "Toán",
    description: "Đại số, hình học, giải tích từ cấp tiểu học đến đại học",
  },
  {
    id: "019cef3d-58c8-73f5-9c26-747646e8272f",
    name: "Vật lý",
    description: "Cơ học, điện học, quang học, vật lý đại cương",
  },
  {
    id: "019cef3d-5cb0-7b92-b114-2b73bc1efde7",
    name: "Hóa học",
    description: "Hóa vô cơ, hóa hữu cơ, ôn thi THPT quốc gia",
  },
  {
    id: "019cef3d-6098-7454-98b4-058bb11f8aca",
    name: "Sinh học",
    description: "Sinh học tế bào, di truyền, tiến hóa",
  },
  {
    id: "019cef3d-6480-7ef0-ba31-b3d052567247",
    name: "Ngữ văn",
    description: "Đọc hiểu, nghị luận xã hội, nghị luận văn học",
  },
  {
    id: "019cef3d-6868-7570-a715-78c301e26fc3",
    name: "Lịch sử",
    description: "Lịch sử Việt Nam và thế giới",
  },
  {
    id: "019cef3d-6c50-714d-8caa-74914da2c88d",
    name: "Địa lý",
    description: "Địa lý tự nhiên, kinh tế - xã hội, Atlat",
  },
  {
    id: "019cef3d-7038-7158-afd2-4302a0e0fe8c",
    name: "Tiếng Anh",
    description: "Giao tiếp, ngữ pháp, từ vựng, kỹ năng tổng hợp",
  },
  {
    id: "019cef3d-7420-7780-98f8-466fcb783388",
    name: "IELTS",
    description: "Luyện thi IELTS Academic/General 4 kỹ năng",
  },
  {
    id: "019cef3d-7808-7483-8158-511aa2f5576d",
    name: "Tin học",
    description: "Tin học văn phòng, thuật toán, tư duy lập trình",
  },
  {
    id: "019cef3d-7bf0-7519-9e8f-edb503144692",
    name: "Lập trình Python",
    description: "Python cơ bản đến nâng cao, cấu trúc dữ liệu",
  },
  {
    id: "019cef3d-7fd8-7881-95f9-bf62461639ef",
    name: "Piano",
    description: "Piano cơ bản và nâng cao, nhạc lý",
  },
];

const sub = (id: string): SubjectResponse => {
  const s = subjects.find((x) => x.id === id);
  if (!s) throw new Error(`subject ${id}`);
  return { id: s.id, name: s.name };
};

export const users: (AuthUser & { createdAt: string })[] = [
  {
    id: "s-1",
    fullName: "Nguyễn Minh Anh",
    email: "student@demo.com",
    phone: "0901234567",
    role: "STUDENT",
    userStatus: "ACTIVE",
    gender: "FEMALE",
    dateOfBirth: "2005-03-15",
    address: { province: "Hồ Chí Minh" },
    createdAt: ago(60 * DAY),
  },
  {
    id: "s-2",
    fullName: "Trần Hoàng Nam",
    email: "nam.tran@demo.com",
    phone: "0912345678",
    role: "STUDENT",
    userStatus: "ACTIVE",
    gender: "MALE",
    dateOfBirth: "2006-07-20",
    address: { province: "Hồ Chí Minh" },
    createdAt: ago(50 * DAY),
  },
  {
    id: "s-3",
    fullName: "Lê Thảo Vy",
    email: "vy.le@demo.com",
    phone: "0987654321",
    role: "STUDENT",
    userStatus: "ACTIVE",
    gender: "FEMALE",
    dateOfBirth: "2004-11-08",
    address: { province: "Hà Nội" },
    createdAt: ago(40 * DAY),
  },
  {
    id: "t-1",
    fullName: "Trần Thị Hương",
    email: "tutor@demo.com",
    phone: "0933111222",
    role: "TUTOR",
    userStatus: "ACTIVE",
    gender: "FEMALE",
    dateOfBirth: "1995-05-10",
    address: { province: "Hồ Chí Minh" },
    createdAt: ago(90 * DAY),
  },
  {
    id: "t-2",
    fullName: "Lê Văn Khoa",
    email: "khoa.le@demo.com",
    phone: "0944222333",
    role: "TUTOR",
    userStatus: "ACTIVE",
    gender: "MALE",
    dateOfBirth: "1997-02-14",
    address: { province: "Hồ Chí Minh" },
    createdAt: ago(85 * DAY),
  },
  {
    id: "t-3",
    fullName: "Phạm Ngọc Mai",
    email: "mai.pham@demo.com",
    phone: "0955333444",
    role: "TUTOR",
    userStatus: "ACTIVE",
    gender: "FEMALE",
    dateOfBirth: "1993-09-22",
    address: { province: "Hà Nội" },
    createdAt: ago(80 * DAY),
  },
  {
    id: "t-4",
    fullName: "Nguyễn Quốc Bảo",
    email: "bao.nguyen@demo.com",
    phone: "0966444555",
    role: "TUTOR",
    userStatus: "ACTIVE",
    gender: "MALE",
    dateOfBirth: "1996-12-01",
    address: { province: "Hồ Chí Minh" },
    createdAt: ago(70 * DAY),
  },
  {
    id: "t-5",
    fullName: "Đỗ Thu Trang",
    email: "trang.do@demo.com",
    phone: "0977555666",
    role: "TUTOR",
    userStatus: "ACTIVE",
    gender: "FEMALE",
    dateOfBirth: "1994-06-30",
    address: { province: "Đà Nẵng" },
    createdAt: ago(65 * DAY),
  },
  {
    id: "t-6",
    fullName: "Võ Minh Tuấn",
    email: "tuan.vo@demo.com",
    phone: "0888666777",
    role: "TUTOR",
    userStatus: "ACTIVE",
    gender: "MALE",
    dateOfBirth: "2000-04-17",
    address: { province: "Hồ Chí Minh" },
    createdAt: ago(30 * DAY),
  },
  {
    id: "t-7",
    fullName: "Hoàng Gia Linh",
    email: "pending.tutor@demo.com",
    phone: "0899777888",
    role: "TUTOR",
    userStatus: "ACTIVE",
    gender: "FEMALE",
    dateOfBirth: "1998-08-25",
    address: { province: "Hồ Chí Minh" },
    createdAt: ago(2 * DAY),
  },
  {
    id: "t-8",
    fullName: "Bùi Anh Dũng",
    email: "rejected.tutor@demo.com",
    phone: "0866888999",
    role: "TUTOR",
    userStatus: "ACTIVE",
    gender: "MALE",
    dateOfBirth: "2001-01-05",
    address: { province: "Hồ Chí Minh" },
    createdAt: ago(10 * DAY),
  },
  {
    id: "a-1",
    fullName: "Quản trị viên",
    email: "admin@demo.com",
    phone: "0900000000",
    role: "ADMIN",
    userStatus: "ACTIVE",
    gender: "MALE",
    dateOfBirth: "1990-01-01",
    address: { province: "Hồ Chí Minh" },
    createdAt: ago(200 * DAY),
  },
];

function tutor(
  id: string,
  fullName: string,
  p: Partial<TutorResponse> &
    Pick<
      TutorResponse,
      | "subject"
      | "experienceYears"
      | "hourlyRate"
      | "averageRating"
      | "verificationStatus"
    >,
): TutorResponse {
  const user = users.find((u) => u.id === id);
  return {
    id,
    fullName,
    avatarUrl: undefined,
    bio: undefined,
    education: undefined,
    verificationNote: undefined,
    address: user ? { province: user.address.province } : undefined,
    ...p,
  };
}

export const tutors: TutorResponse[] = [
  tutor("t-1", "Trần Thị Hương", {
    subject: sub("019cef3d-54e0-7e12-85ae-da011bb1fa7d"),
    experienceYears: 5,
    hourlyRate: 200_000,
    averageRating: 4.8,
    verificationStatus: "APPROVED",
    education: "Cử nhân Sư phạm Toán — ĐH Sư phạm TP.HCM",
    bio: "Giáo viên Toán – Lý với 5 năm kinh nghiệm ôn thi vào lớp 10 và THPT Quốc gia.",
    address: { province: "Hồ Chí Minh" },
  }),
  tutor("t-2", "Lê Văn Khoa", {
    subject: sub("019cef3d-7038-7158-afd2-4302a0e0fe8c"),
    experienceYears: 3,
    hourlyRate: 180_000,
    averageRating: 4.6,
    verificationStatus: "APPROVED",
    education: "Cử nhân Ngôn ngữ Anh — ĐH Ngoại thương",
    bio: "Chuyên giao tiếp và luyện thi IELTS. Dạy online linh hoạt theo lịch của học viên.",
    address: { province: "Hồ Chí Minh" },
  }),
  tutor("t-3", "Phạm Ngọc Mai", {
    subject: sub("019cef3d-5cb0-7b92-b114-2b73bc1efde7"),
    experienceYears: 7,
    hourlyRate: 250_000,
    averageRating: 4.9,
    verificationStatus: "APPROVED",
    education: "Thạc sĩ Hóa học — ĐH Quốc gia Hà Nội",
    bio: "Gần 100 học sinh đạt 8+ môn Hóa trong kỳ thi THPT.",
    address: { province: "Hà Nội" },
  }),
  tutor("t-4", "Nguyễn Quốc Bảo", {
    subject: sub("019cef3d-7808-7483-8158-511aa2f5576d"),
    experienceYears: 4,
    hourlyRate: 220_000,
    averageRating: 4.7,
    verificationStatus: "APPROVED",
    education: "Kỹ sư CNTT — ĐH Bách Khoa TP.HCM",
    bio: "Dạy lập trình Python, C++ và tư duy thuật toán.",
    address: { province: "Hồ Chí Minh" },
  }),
  tutor("t-5", "Đỗ Thu Trang", {
    subject: sub("019cef3d-7bf0-7519-9e8f-edb503144692"),
    experienceYears: 6,
    hourlyRate: 160_000,
    averageRating: 4.5,
    verificationStatus: "APPROVED",
    education: "Cử nhân Ngữ văn — ĐH Sư phạm Đà Nẵng",
    bio: "Giúp học sinh yêu văn, viết bài mạch lạc và đạt điểm cao.",
    address: { province: "Đà Nẵng" },
  }),
  tutor("t-6", "Võ Minh Tuấn", {
    subject: sub("019cef3d-54e0-7e12-85ae-da011bb1fa7d"),
    experienceYears: 2,
    hourlyRate: 120_000,
    averageRating: 4.2,
    verificationStatus: "APPROVED",
    education: "Sinh viên năm cuối Sư phạm Toán",
    bio: "Nhiệt tình, kiên nhẫn, phù hợp học sinh cần lấy lại căn bản.",
    address: { province: "Hồ Chí Minh" },
  }),
  tutor("t-7", "Hoàng Gia Linh", {
    subject: sub("019cef3d-7fd8-7881-95f9-bf62461639ef"),
    experienceYears: 3,
    hourlyRate: 200_000,
    averageRating: 0,
    verificationStatus: "PENDING",
    education: "Cử nhân Âm nhạc — Nhạc viện TP.HCM",
    bio: "Dạy piano và thanh nhạc cho mọi lứa tuổi.",
    address: { province: "Hồ Chí Minh" },
  }),
  tutor("t-8", "Bùi Anh Dũng", {
    subject: sub("019cef3d-58c8-73f5-9c26-747646e8272f"),
    experienceYears: 1,
    hourlyRate: 100_000,
    averageRating: 0,
    verificationStatus: "REJECTED",
    verificationNote:
      "Vui lòng bổ sung bằng cấp/chứng chỉ và ảnh đại diện rõ mặt rồi gửi lại.",
    bio: "Sinh viên Vật lý.",
    address: { province: "Hồ Chí Minh" },
  }),
];

const author = (
  userId: string,
): {
  id: string;
  fullName: string;
  avatarUrl?: string;
  role: "STUDENT" | "TUTOR" | "ADMIN";
} => {
  const u = users.find((x) => x.id === userId);
  if (!u) throw new Error(`user ${userId}`);
  return {
    id: u.id,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    role: u.role,
  };
};

interface PostSeed {
  id: string;
  title: string;
  content: string;
  type: PostResponse["type"];
  status: PostResponse["status"];
  by: string;
  subject: string;
  level: PostResponse["educationLevel"];
  mode: PostResponse["teachingMode"];
  province: string;
  min: number;
  max: number;
  spw: number;
  dur: number;
  deadlineDays: number;
  createdAgo: number;
}

const postSeeds: PostSeed[] = [
  {
    id: "p-1",
    title: "Cần gia sư Toán 9 ôn thi vào lớp 10",
    content:
      "Con đang học lớp 9, cần củng cố đại số và hình học, luyện đề thi vào 10.",
    type: "FIND_TUTOR",
    status: "PUBLISHED",
    by: "s-1",
    subject: "019cef3d-54e0-7e12-85ae-da011bb1fa7d",
    level: "SECONDARY",
    mode: "OFFLINE",
    province: "Hồ Chí Minh",
    min: 2_500_000,
    max: 3_500_000,
    spw: 3,
    dur: 90,
    deadlineDays: 10,
    createdAgo: 5 * DAY,
  },
  {
    id: "p-2",
    title: "Tìm gia sư Tiếng Anh giao tiếp lớp 11 (online)",
    content:
      "Em muốn cải thiện phản xạ giao tiếp và phát âm, học online buổi tối.",
    type: "FIND_TUTOR",
    status: "PUBLISHED",
    by: "s-2",
    subject: "019cef3d-7038-7158-afd2-4302a0e0fe8c",
    level: "HIGH_SCHOOL",
    mode: "ONLINE",
    province: "Hồ Chí Minh",
    min: 2_000_000,
    max: 3_000_000,
    spw: 2,
    dur: 60,
    deadlineDays: 7,
    createdAgo: 3 * DAY,
  },
  {
    id: "p-3",
    title: "Gia sư Hóa 12 luyện thi đại học tại Hà Nội",
    content: "Cần giáo viên Hóa có kinh nghiệm luyện thi khối A, B.",
    type: "FIND_TUTOR",
    status: "PUBLISHED",
    by: "s-3",
    subject: "019cef3d-5cb0-7b92-b114-2b73bc1efde7",
    level: "HIGH_SCHOOL",
    mode: "OFFLINE",
    province: "Hà Nội",
    min: 3_000_000,
    max: 4_500_000,
    spw: 2,
    dur: 120,
    deadlineDays: 14,
    createdAgo: 2 * DAY,
  },
  {
    id: "p-4",
    title: "Tìm gia sư Tin học cho học sinh THCS",
    content: "Học Scratch và Python cơ bản.",
    type: "FIND_TUTOR",
    status: "DRAFT",
    by: "s-1",
    subject: "019cef3d-7808-7483-8158-511aa2f5576d",
    level: "SECONDARY",
    mode: "BOTH",
    province: "Hồ Chí Minh",
    min: 1_500_000,
    max: 2_500_000,
    spw: 2,
    dur: 90,
    deadlineDays: 20,
    createdAgo: 1 * DAY,
  },
  {
    id: "p-5",
    title: "Cần gia sư Văn lớp 8",
    content: "Cần cô giáo dạy Văn giúp con viết bài tốt hơn.",
    type: "FIND_TUTOR",
    status: "CLOSED",
    by: "s-2",
    subject: "019cef3d-7bf0-7519-9e8f-edb503144692",
    level: "SECONDARY",
    mode: "ONLINE",
    province: "Đà Nẵng",
    min: 1_200_000,
    max: 1_800_000,
    spw: 2,
    dur: 90,
    deadlineDays: -5,
    createdAgo: 30 * DAY,
  },
  {
    id: "p-6",
    title: "Gia sư Toán – Lý THPT nhận thêm học viên khu vực TP.HCM",
    content:
      "Mình có 5 năm kinh nghiệm, còn trống lịch tối thứ 2, 4 và cả ngày thứ 7.",
    type: "FIND_STUDENT",
    status: "PUBLISHED",
    by: "t-1",
    subject: "019cef3d-54e0-7e12-85ae-da011bb1fa7d",
    level: "HIGH_SCHOOL",
    mode: "BOTH",
    province: "Hồ Chí Minh",
    min: 2_400_000,
    max: 4_000_000,
    spw: 3,
    dur: 90,
    deadlineDays: 15,
    createdAgo: 4 * DAY,
  },
  {
    id: "p-7",
    title: "Nhận dạy Hóa – Sinh luyện thi THPT tại Hà Nội",
    content:
      "Dạy theo chuyên đề, có tài liệu riêng. Nhận nhóm nhỏ 1–3 học sinh.",
    type: "FIND_STUDENT",
    status: "PUBLISHED",
    by: "t-3",
    subject: "019cef3d-5cb0-7b92-b114-2b73bc1efde7",
    level: "HIGH_SCHOOL",
    mode: "OFFLINE",
    province: "Hà Nội",
    min: 3_000_000,
    max: 5_000_000,
    spw: 2,
    dur: 120,
    deadlineDays: 25,
    createdAgo: 6 * DAY,
  },
  {
    id: "p-8",
    title: "Cần gia sư Tiếng Anh cho bé lớp 3",
    content: "Bé cần làm quen tiếng Anh qua trò chơi, giao tiếp cơ bản.",
    type: "FIND_TUTOR",
    status: "PUBLISHED",
    by: "s-3",
    subject: "019cef3d-7038-7158-afd2-4302a0e0fe8c",
    level: "PRIMARY",
    mode: "OFFLINE",
    province: "Hồ Chí Minh",
    min: 1_500_000,
    max: 2_200_000,
    spw: 2,
    dur: 60,
    deadlineDays: 9,
    createdAgo: 1 * DAY,
  },
  {
    id: "p-9",
    title: "Dạy lập trình Python cho học sinh THPT",
    content: "Lộ trình từ cơ bản đến thuật toán, phù hợp đội tuyển Tin học.",
    type: "FIND_STUDENT",
    status: "PUBLISHED",
    by: "t-4",
    subject: "019cef3d-7808-7483-8158-511aa2f5576d",
    level: "HIGH_SCHOOL",
    mode: "BOTH",
    province: "Hồ Chí Minh",
    min: 2_500_000,
    max: 4_000_000,
    spw: 2,
    dur: 90,
    deadlineDays: 18,
    createdAgo: 8 * DAY,
  },
  {
    id: "p-10",
    title: "Cần gia sư Vật lý lớp 10",
    content: "Củng cố cơ học và nhiệt học.",
    type: "FIND_TUTOR",
    status: "CLOSED",
    by: "s-3",
    subject: "019cef3d-58c8-73f5-9c26-747646e8272f",
    level: "HIGH_SCHOOL",
    mode: "BOTH",
    province: "Hồ Chí Minh",
    min: 1_800_000,
    max: 2_600_000,
    spw: 2,
    dur: 90,
    deadlineDays: -8,
    createdAgo: 20 * DAY,
  },
  {
    id: "p-11",
    title: "Gia sư Toán lớp 7 tại Quận 3",
    content:
      "Con mất căn bản phần phân số và tỉ lệ thức, cần gia sư kiên nhẫn.",
    type: "FIND_TUTOR",
    status: "PUBLISHED",
    by: "s-2",
    subject: "019cef3d-54e0-7e12-85ae-da011bb1fa7d",
    level: "SECONDARY",
    mode: "OFFLINE",
    province: "Hồ Chí Minh",
    min: 2_000_000,
    max: 3_000_000,
    spw: 2,
    dur: 90,
    deadlineDays: 6,
    createdAgo: 6 * DAY,
  },
  // THÊM POST MỚI CHO USER s-1
  {
    id: "p-test-1",
    title: "Tìm gia sư Toán lớp 10 tại Quận 7",
    content:
      "Mình cần tìm một bạn sinh viên hoặc giáo viên có kinh nghiệm dạy Toán lớp 10. Cháu nhà học lực trung bình khá, cần gia sư kiên nhẫn, bám sát chương trình trên trường và hướng dẫn làm bài tập về nhà.",
    type: "FIND_TUTOR",
    postStatus: "PUBLISHED",
    by: "s-1",
    subject: "019cef3d-54e0-7e12-85ae-da011bb1fa7d", // Toán
    level: "HIGH_SCHOOL",
    mode: "OFFLINE",
    province: "Hồ Chí Minh",
    min: 100_000,
    max: 150_000,
    spw: 3,
    dur: 90,
    deadlineDays: 8,
    createdAgo: 0.5 * DAY,
  },
];

export const posts: PostResponse[] = postSeeds.map((s) => ({
  id: s.id,
  title: s.title,
  content: s.content,
  type: s.type,
  status: s.status,
  author: author(s.by),
  subject: sub(s.subject),
  educationLevel: s.level,
  teachingMode: s.mode,
  address: { province: s.province },
  minBudget: s.min,
  maxBudget: s.max,
  sessionsPerWeek: s.spw,
  durationMinutes: s.dur,
  deadline: ahead(s.deadlineDays * DAY),
  createdAt: ago(s.createdAgo),
}));

const postRef = (id: string): PostResponse => {
  const p = posts.find((x) => x.id === id);
  if (!p) throw new Error(`post ${id}`);
  return p;
};

const tutorRef = (id: string): TutorResponse => {
  const t = tutors.find((x) => x.id === id);
  if (!t) throw new Error(`tutor ${id}`);
  return t;
};

const studentRef = (id: string) => {
  const u = users.find((x) => x.id === id);
  if (!u) throw new Error(`student ${id}`);
  return u;
};

export const mockPosts: PostResponse[] = [
  {
    id: "01a1a213-5bae-7e1f-bbeb-ed7c592a5e4a",
    title: "Tìm gia sư Toán lớp 10 tại Quận 7",
    content:
      "Mình cần tìm một bạn sinh viên hoặc giáo viên có kinh nghiệm dạy Toán lớp 10. Cháu nhà học lực trung bình khá, cần gia sư kiên nhẫn, bám sát chương trình trên trường và hướng dẫn làm bài tập về nhà.",
    type: "FIND_TUTOR",
    postStatus: "PUBLISHED",
    subject: {
      id: "019cef3d-54e0-7e12-85ae-da011bb1fa7d",
      name: "Toán",
    },
    educationLevel: "HIGH_SCHOOL",
    teachingMode: "OFFLINE",
    address: {
      province: "Hồ Chí Minh",
    },
    minBudget: 100_000,
    maxBudget: 150_000,
    sessionsPerWeek: 3,
    durationMinutes: 90,
    deadline: "2026-11-11T23:59:59Z",
    author: {
      id: "019d4764-2a40-7a87-b0d2-dcba8c64189b",
      fullName: "Phạm Anh Tâm",
      avatarUrl:
        "https://res.cloudinary.com/tutorlink-demo/image/upload/avatars/student1.jpg",
      role: "STUDENT",
    },
    createdAt: "2026-11-03T10:00:00Z",
  },
];

export const allPosts: PostResponse[] = [
  ...posts,
  ...mockPosts,
];

function app(
  id: string,
  postId: string,
  tutorId: string,
  studentId: string,
  status: ApplicationResponse["applicationStatus"],
  createdAgo: number,
  message?: string,
): ApplicationResponse {
  return {
    id,
    post: postRef(postId),
    tutor: tutorRef(tutorId),
    student: studentRef(studentId) as any,
    applicationStatus: status,
    message,
    appliedAt: ago(createdAgo),
    paid: status === "PAID",
  };
}

export const applications: ApplicationResponse[] = [
  app(
    "ap-1",
    "p-1",
    "t-1",
    "s-1",
    "PENDING",
    4 * DAY,
    "Em đã dạy nhiều học sinh lớp 9 đỗ trường chuyên.",
  ),
  app(
    "ap-2",
    "p-1",
    "t-2",
    "s-1",
    "PENDING",
    3.5 * DAY,
    "Mình dạy Anh nhưng cũng có thể hỗ trợ Toán cơ bản.",
  ),
  app(
    "ap-3",
    "p-1",
    "t-3",
    "s-1",
    "PENDING",
    4.5 * DAY,
    "Có kinh nghiệm luyện thi 10 nhiều năm.",
  ),
  app(
    "ap-4",
    "p-1",
    "t-4",
    "s-1",
    "PENDING",
    3 * DAY,
    "Mình dạy Toán tư duy và Tin, sẵn sàng đến tận nhà.",
  ),
  app("ap-5", "p-1", "t-5", "s-1", "PENDING", 2 * DAY),
  app(
    "ap-6",
    "p-1",
    "t-6",
    "s-1",
    "PENDING",
    1 * DAY,
    "Mình nhiệt tình, giá hợp lý cho gia đình.",
  ),
  app(
    "ap-7",
    "p-2",
    "t-2",
    "s-2",
    "PENDING",
    2 * DAY,
    "Mình chuyên giao tiếp, học online linh hoạt.",
  ),
  app("ap-8", "p-3", "t-3", "s-3", "PENDING", 1.5 * DAY),
  app("ap-9", "p-5", "t-5", "s-2", "PAID", 25 * DAY),
  app("ap-10", "p-10", "t-1", "s-3", "PAID", 15 * DAY),
  app("ap-11", "p-11", "t-1", "s-2", "ACCEPTED", 2 * HOUR),
];

/** Thông tin liên hệ (chỉ lộ sau khi thanh toán phí nhận lớp). */
export const contacts: Record<string, ContactInfo> = Object.fromEntries(
  users.map((u) => [u.id, { phone: u.phone, email: u.email }]),
);

export const chatMessages: ChatMessage[] = [
  {
    id: "m-1",
    applicationId: "ap-10",
    senderId: "t-1",
    content: "Chào em, cô là gia sư Vật lý. Em muốn bắt đầu học vào ngày nào?",
    createdAt: ago(14 * DAY),
  },
  {
    id: "m-2",
    applicationId: "ap-10",
    senderId: "s-3",
    content: "Dạ em chào cô, em rảnh tối thứ 3 và thứ 5 ạ.",
    createdAt: ago(14 * DAY - 20 * 60_000),
  },
  {
    id: "m-3",
    applicationId: "ap-9",
    senderId: "s-2",
    content: "Chào cô, mình thống nhất học online qua Google Meet nhé.",
    createdAt: ago(24 * DAY),
  },
];

/** userId → danh sách tutorId yêu thích */
export const favorites: Record<string, string[]> = { "s-1": ["t-1", "t-3"] };

export const studentSummary = (id: string): StudentSummary => {
  const u = users.find((x) => x.id === id);
  return { id, fullName: u?.fullName ?? "Học viên", avatarUrl: u?.avatarUrl };
};

export const reviews: ReviewResponse[] = [
  {
    id: "r-ap-10-seed",
    tutorId: "t-1",
    rating: 5,
    comment: "Cô dạy dễ hiểu, kiên nhẫn. Điểm Vật lý của em tăng rõ rệt.",
    student: studentSummary("s-3"),
    createdAt: ago(10 * DAY),
    complaintStatus: "NONE",
  },
  {
    id: "r-ap-9-seed",
    tutorId: "t-5",
    rating: 4,
    comment: "Cô dạy Văn hay, bài giảng có chiều sâu.",
    student: studentSummary("s-2"),
    createdAt: ago(20 * DAY),
    complaintStatus: "NONE",
  },
  {
    id: "r-seed-1",
    tutorId: "t-1",
    rating: 2,
    comment: "Buổi học đầu hơi nhanh, em chưa theo kịp.",
    student: studentSummary("s-2"),
    createdAt: ago(6 * DAY),
    complaintStatus: "OPEN",
    complaintReason:
      "Đánh giá không phản ánh đúng; học viên chỉ học thử một buổi và không phản hồi lại.",
  },
  {
    id: "r-seed-2",
    tutorId: "t-3",
    rating: 5,
    comment: "Cô Mai giảng Hóa rất rõ, có nhiều mẹo làm bài.",
    student: studentSummary("s-1"),
    createdAt: ago(30 * DAY),
    complaintStatus: "NONE",
  },
  {
    id: "r-seed-3",
    tutorId: "t-2",
    rating: 5,
    comment: "Anh Khoa dạy giao tiếp rất tự nhiên.",
    student: studentSummary("s-1"),
    createdAt: ago(18 * DAY),
    complaintStatus: "NONE",
  },
];

/** Doanh thu phí nhận lớp theo tháng (đơn vị VND), tháng cuối cùng được cộng thêm giao dịch mới. */
export const revenueHistory: RevenuePoint[] = [
  { label: "T5", revenue: 1_200_000 },
  { label: "T6", revenue: 1_800_000 },
  { label: "T7", revenue: 1_500_000 },
  { label: "T8", revenue: 2_400_000 },
  { label: "T9", revenue: 3_100_000 },
  { label: "T10", revenue: 0 },
];

export const wallets: Record<string, number> = {
  "t-1": 300_000,
  "t-5": 100_000,
  "t-3": 0,
};

export const transactions: TransactionResponse[] = [
  {
    id: "tx-1",
    transactionType: "TOP_UP",
    amount: 500_000,
    transactionStatus: "SUCCESS",
    tutorId: "t-1",
    createdAt: ago(20 * DAY),
  },
  {
    id: "tx-2",
    transactionType: "COMMISSION",
    amount: 200_000,
    transactionStatus: "SUCCESS",
    applicationId: "ap-10",
    tutorId: "t-1",
    createdAt: ago(15 * DAY),
  },
  {
    id: "tx-3",
    transactionType: "TOP_UP",
    amount: 1_000_000,
    transactionStatus: "FAILED",
    createdAt: ago(9 * DAY),
  },
  {
    id: "tx-4",
    transactionType: "TOP_UP",
    amount: 400_000,
    transactionStatus: "SUCCESS",
    createdAt: ago(26 * DAY),
  },
  {
    id: "tx-5",
    transactionType: "COMMISSION",
    amount: 300_000,
    transactionStatus: "SUCCESS",
    applicationId: "ap-9",
    tutorId: "t-5",
    createdAt: ago(25 * DAY),
  },
  {
    id: "tx-6",
    transactionType: "TOP_UP",
    amount: 200_000,
    transactionStatus: "PENDING",
    createdAt: ago(3 * HOUR),
  },
];

export const notifications: Record<string, NotificationResponse[]> = {
  "s-1": [
    {
      id: "n-1",
      notificationType: "APPLICATION",
      title: "Có 6 lượt ứng tuyển mới",
      content:
        'Bài "Cần gia sư Toán 9 ôn thi vào lớp 10" đã có 6 gia sư đăng ký.',
      isRead: false,
      createdAt: ago(1 * HOUR),
    },
    {
      id: "n-2",
      notificationType: "SYSTEM",
      title: "Bài đăng đã được đăng công khai",
      content: "Bài viết của bạn đang hiển thị với mọi người.",
      isRead: true,
      createdAt: ago(5 * DAY),
    },
  ],
  "t-1": [
    {
      id: "n-3",
      notificationType: "APPLICATION",
      title: "Bạn được chọn nhận lớp!",
      content:
        'Trần Hoàng Nam đã chọn bạn cho bài "Gia sư Toán lớp 7 tại Quận 3".',
      isRead: false,
      createdAt: ago(2 * HOUR),
    },
    {
      id: "n-4",
      notificationType: "SYSTEM",
      title: "Hồ sơ gia sư đã được duyệt",
      content: "Bạn có thể đăng ký nhận lớp ngay bây giờ.",
      isRead: true,
      createdAt: ago(88 * DAY),
    },
    {
      id: "n-5",
      notificationType: "PAYMENT",
      title: "Thanh toán phí nhận lớp thành công",
      content: "Thông tin liên hệ và kênh chat đã được mở.",
      isRead: true,
      createdAt: ago(15 * DAY),
    },
  ],
  "a-1": [
    {
      id: "n-6",
      notificationType: "SYSTEM",
      title: "Hồ sơ gia sư mới chờ duyệt",
      content: "Hoàng Gia Linh vừa gửi hồ sơ giảng dạy.",
      isRead: false,
      createdAt: ago(2 * DAY),
    },
  ],
};

export const feeRates: FeeRateConfig[] = [
  {
    id: "fr-1",
    rate: 0.15,
    effectiveFrom: "2025-01-01",
    createdBy: "Quản trị viên",
    active: false,
  },
  {
    id: "fr-2",
    rate: 0.2,
    effectiveFrom: "2025-06-01",
    createdBy: "Quản trị viên",
    active: true,
  },
];

export function recountSubjectUsage(): void {
  for (const s of subjects) {
    const inPosts = posts.filter((p) => p.subject.id === s.id).length;
    const inTutors = tutors.filter((t) => t.subject?.id === s.id).length;
    s.usageCount = inPosts + inTutors;
  }
}
recountSubjectUsage();

export const nextId = (() => {
  let n = 1000;
  return (prefix: string): string => `${prefix}-${++n}`;
})();
