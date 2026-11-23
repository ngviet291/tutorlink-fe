export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_DOCS: Record<
  "guide" | "fee" | "privacy" | "terms",
  LegalDoc
> = {
  guide: {
    title: "Hướng dẫn sử dụng",
    intro:
      "TutorLink giúp học viên và gia sư tìm thấy nhau. Dưới đây là các bước cơ bản cho từng vai trò.",
    sections: [
      {
        heading: "Dành cho học viên",
        bullets: [
          "Đăng ký tài khoản học viên và đăng nhập.",
          'Chọn "Đăng bài mới", mô tả môn học, cấp học, hình thức học, khu vực, ngân sách và lịch học mong muốn.',
          "Xem danh sách gia sư ứng tuyển ở trang chi tiết bài đăng. Hệ thống có gợi ý AI Top 5 để tham khảo, bạn luôn là người quyết định.",
          "Chọn gia sư phù hợp. Bài đăng sẽ chuyển sang trạng thái đã đóng.",
          "Sau khi gia sư thanh toán phí nhận lớp, thông tin liên hệ và chat được mở khóa để hai bên trao đổi.",
          "Kết thúc lớp, bạn có thể đánh giá gia sư.",
        ],
      },
      {
        heading: "Dành cho gia sư",
        bullets: [
          "Đăng ký tài khoản gia sư, hoàn thiện hồ sơ giảng dạy và tải chứng chỉ. Hồ sơ cần được quản trị viên duyệt trước khi công khai.",
          'Vào "Tìm Lớp" để xem các lớp đang cần gia sư và ứng tuyển.',
          "Khi được học viên chọn, thanh toán phí nhận lớp từ ví để mở khóa thông tin liên hệ.",
          'Nạp tiền vào ví tại mục "Ví của tôi".',
        ],
      },
      {
        heading: "Cần hỗ trợ?",
        paragraphs: [
          "Liên hệ tutorlink.n3@gmail.com hoặc nhắn qua mục Tin nhắn khi bạn đã đăng nhập.",
        ],
      },
    ],
  },
  fee: {
    title: "Quy định phí nhận lớp",
    intro:
      "Phí nhận lớp là khoản phí gia sư trả cho nền tảng khi được học viên chọn. Học viên không mất phí.",
    sections: [
      {
        heading: "1. Ai trả phí, khi nào",
        bullets: [
          "Chỉ gia sư trả phí, và chỉ khi được học viên chọn cho một lớp cụ thể.",
          "Đăng ký tài khoản, đăng hồ sơ và ứng tuyển không mất phí.",
        ],
      },
      {
        heading: "2. Cách tính phí",
        paragraphs: [
          "Phí được tính theo tỉ lệ phần trăm trên ngân sách của bài đăng, theo tỉ lệ hệ thống áp dụng tại thời điểm thanh toán. Số tiền chính xác được hiển thị cho gia sư trước khi xác nhận thanh toán.",
        ],
      },
      {
        heading: "3. Ví và thanh toán",
        bullets: [
          "Phí được trừ trực tiếp từ ví của gia sư. Ví được nạp bằng chuyển khoản VietQR.",
          "Ví chỉ dùng để nạp tiền và trả phí nhận lớp, không hỗ trợ rút tiền.",
          "Mỗi giao dịch đều có trong lịch sử ví để bạn đối chiếu.",
        ],
      },
      {
        heading: "4. Mở khóa liên hệ",
        paragraphs: [
          "Sau khi thanh toán phí, thông tin liên hệ và kênh chat giữa hai bên được mở khóa.",
        ],
      },
      {
        heading: "5. Học phí",
        paragraphs: [
          "Học phí hằng tháng do học viên và gia sư tự thỏa thuận và thanh toán ngoài hệ thống. TutorLink không thu hộ học phí.",
        ],
      },
      {
        heading: "6. Hoàn phí",
        paragraphs: [
          "Trường hợp phát sinh sự cố hoặc tranh chấp, gia sư có thể gửi yêu cầu để quản trị viên xem xét. Việc hoàn phí do quản trị viên quyết định dựa trên từng trường hợp.",
        ],
      },
    ],
  },
  privacy: {
    title: "Chính sách bảo mật",
    intro:
      "TutorLink tôn trọng quyền riêng tư của bạn. Chính sách này mô tả dữ liệu chúng tôi thu thập và cách sử dụng.",
    sections: [
      {
        heading: "1. Dữ liệu chúng tôi thu thập",
        bullets: [
          "Thông tin tài khoản: họ tên, email, số điện thoại, ảnh đại diện, địa chỉ (tỉnh/thành, phường/xã).",
          "Hồ sơ gia sư: môn dạy, kinh nghiệm, học phí mong muốn, lịch dạy, chứng chỉ bạn tải lên.",
          "Nội dung bạn tạo: bài đăng, tin nhắn, đánh giá, khiếu nại.",
          "Giao dịch ví: lịch sử nạp tiền và thanh toán phí nhận lớp (chúng tôi không lưu số thẻ hay thông tin tài khoản ngân hàng của bạn).",
          "Dữ liệu sử dụng: các tìm kiếm và thao tác cơ bản trên hệ thống để cải thiện chất lượng gợi ý.",
        ],
      },
      {
        heading: "2. Mục đích sử dụng",
        bullets: [
          "Vận hành nền tảng và kết nối học viên với gia sư.",
          "Gợi ý gia sư và bài đăng phù hợp, bao gồm xử lý bằng các mô hình AI.",
          "Xác minh hồ sơ gia sư, xử lý khiếu nại và phòng chống gian lận.",
          "Gửi thông báo liên quan đến tài khoản và hoạt động của bạn.",
        ],
      },
      {
        heading: "3. Chia sẻ thông tin",
        bullets: [
          "Email và số điện thoại của bạn được ẩn với người dùng khác. Thông tin liên hệ chỉ được mở giữa hai bên của một lớp sau khi gia sư thanh toán phí nhận lớp.",
          "Chúng tôi không bán dữ liệu cá nhân của bạn.",
          "Dữ liệu có thể được xử lý bởi các đối tác kỹ thuật cần thiết để vận hành (lưu trữ ảnh, gửi email, cổng thanh toán, dịch vụ AI) theo mục đích đã nêu.",
        ],
      },
      {
        heading: "4. Bảo mật",
        paragraphs: [
          "Mật khẩu được mã hóa, phiên đăng nhập dùng token có thời hạn. Không có hệ thống nào an toàn tuyệt đối, hãy giữ kín mật khẩu của bạn.",
        ],
      },
      {
        heading: "5. Quyền của bạn",
        paragraphs: [
          "Bạn có thể xem và chỉnh sửa thông tin trong trang Tài khoản, và liên hệ tutorlink.n3@gmail.com để yêu cầu xóa tài khoản hoặc dữ liệu.",
        ],
      },
    ],
  },
  terms: {
    title: "Điều khoản dịch vụ",
    intro:
      "Khi đăng ký và sử dụng TutorLink, bạn đồng ý với các điều khoản dưới đây.",
    sections: [
      {
        heading: "1. Vai trò của TutorLink",
        paragraphs: [
          "TutorLink là nền tảng kết nối học viên và gia sư. Chúng tôi không phải bên dạy học, không đảm bảo kết quả học tập, và không là một bên trong thỏa thuận học phí giữa hai bên.",
        ],
      },
      {
        heading: "2. Tài khoản",
        bullets: [
          "Bạn cung cấp thông tin chính xác và chịu trách nhiệm về hoạt động trên tài khoản của mình.",
          "Mỗi người dùng một tài khoản. Không chia sẻ mật khẩu cho người khác.",
          "Hồ sơ gia sư cần được quản trị viên duyệt trước khi công khai. Hồ sơ hoặc chứng chỉ sai sự thật sẽ bị từ chối hoặc khóa.",
        ],
      },
      {
        heading: "3. Nội dung và hành vi",
        bullets: [
          "Không đăng nội dung sai sự thật, lừa đảo, xúc phạm hoặc vi phạm pháp luật.",
          "Không lợi dụng thông tin liên hệ của người khác ngoài mục đích học tập, giảng dạy.",
          "Quản trị viên có quyền gỡ bài đăng hoặc khóa tài khoản vi phạm, và sẽ thông báo lý do khi gỡ bài.",
        ],
      },
      {
        heading: "4. Phí và thanh toán",
        paragraphs: [
          "Gia sư trả phí nhận lớp theo Quy định phí nhận lớp. Học phí do hai bên tự thỏa thuận ngoài hệ thống.",
        ],
      },
      {
        heading: "5. Đánh giá và khiếu nại",
        paragraphs: [
          "Người dùng được đánh giá sau khi lớp học kết thúc. Đánh giá cần trung thực. Bạn có thể khiếu nại đánh giá không phù hợp để quản trị viên xem xét.",
        ],
      },
      {
        heading: "6. Giới hạn trách nhiệm",
        paragraphs: [
          "Gợi ý AI chỉ mang tính tham khảo. TutorLink không chịu trách nhiệm về các thỏa thuận và giao dịch phát sinh ngoài hệ thống giữa học viên và gia sư.",
        ],
      },
      {
        heading: "7. Thay đổi điều khoản",
        paragraphs: [
          "Chúng tôi có thể cập nhật điều khoản và sẽ thông báo trên hệ thống. Tiếp tục sử dụng nghĩa là bạn đồng ý với bản cập nhật.",
        ],
      },
    ],
  },
};
