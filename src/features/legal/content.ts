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

export type LegalLang = "vi" | "en";
export type LegalKey = "guide" | "fee" | "privacy" | "terms";

export const LEGAL_DOCS: Record<LegalKey, Record<LegalLang, LegalDoc>> = {
  guide: {
    vi: {
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
    en: {
      title: "User Guide",
      intro:
        "TutorLink helps students and tutors find each other. Below are the basic steps for each role.",
      sections: [
        {
          heading: "For students",
          bullets: [
            "Sign up for a student account and log in.",
            'Choose "Create new post" and describe the subject, education level, learning format, area, budget and preferred schedule.',
            "View the tutors who applied on the post detail page. The system offers AI Top 5 suggestions for reference, but you always make the decision.",
            "Choose a suitable tutor. The post will be marked as closed.",
            "Once the tutor pays the placement fee, contact details and chat are unlocked so both sides can communicate.",
            "When the class ends, you can review the tutor.",
          ],
        },
        {
          heading: "For tutors",
          bullets: [
            "Sign up for a tutor account, complete your teaching profile and upload your certificates. Your profile must be approved by an admin before it becomes public.",
            'Go to "Find Classes" to browse classes that need tutors and apply.',
            "When a student selects you, pay the placement fee from your wallet to unlock contact details.",
            'Top up your wallet under "My wallet".',
          ],
        },
        {
          heading: "Need help?",
          paragraphs: [
            "Contact tutorlink.n3@gmail.com or send a message via the Messages section once you are logged in.",
          ],
        },
      ],
    },
  },
  fee: {
    vi: {
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
    en: {
      title: "Placement Fee Policy",
      intro:
        "The placement fee is the fee a tutor pays the platform when selected by a student. Students pay nothing.",
      sections: [
        {
          heading: "1. Who pays, and when",
          bullets: [
            "Only tutors pay, and only when a student selects them for a specific class.",
            "Creating an account, posting a profile and applying are free of charge.",
          ],
        },
        {
          heading: "2. How the fee is calculated",
          paragraphs: [
            "The fee is a percentage of the post's budget, using the rate the system applies at the time of payment. The exact amount is shown to the tutor before payment is confirmed.",
          ],
        },
        {
          heading: "3. Wallet and payment",
          bullets: [
            "The fee is deducted directly from the tutor's wallet. The wallet is topped up by VietQR bank transfer.",
            "The wallet is only for topping up and paying placement fees. Withdrawals are not supported.",
            "Every transaction appears in your wallet history so you can check it.",
          ],
        },
        {
          heading: "4. Unlocking contact",
          paragraphs: [
            "After the fee is paid, contact details and the chat channel between both parties are unlocked.",
          ],
        },
        {
          heading: "5. Tuition",
          paragraphs: [
            "Monthly tuition is agreed and paid directly between the student and the tutor, outside the system. TutorLink does not collect tuition on anyone's behalf.",
          ],
        },
        {
          heading: "6. Fee refunds",
          paragraphs: [
            "In case of an incident or dispute, the tutor may submit a request for an admin to review. Refunds are decided by an admin on a case-by-case basis.",
          ],
        },
      ],
    },
  },
  privacy: {
    vi: {
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
    en: {
      title: "Privacy Policy",
      intro:
        "TutorLink respects your privacy. This policy describes the data we collect and how we use it.",
      sections: [
        {
          heading: "1. Data we collect",
          bullets: [
            "Account information: full name, email, phone number, profile photo, address (province/city, ward/commune).",
            "Tutor profile: subjects taught, experience, desired tuition, teaching schedule, and certificates you upload.",
            "Content you create: posts, messages, reviews and complaints.",
            "Wallet transactions: history of top-ups and placement fee payments (we do not store your card number or bank account details).",
            "Usage data: searches and basic actions in the system, used to improve the quality of suggestions.",
          ],
        },
        {
          heading: "2. How we use it",
          bullets: [
            "To operate the platform and connect students with tutors.",
            "To suggest suitable tutors and posts, including processing by AI models.",
            "To verify tutor profiles, handle complaints and prevent fraud.",
            "To send notifications related to your account and activity.",
          ],
        },
        {
          heading: "3. Sharing information",
          bullets: [
            "Your email and phone number are hidden from other users. Contact details are only unlocked between the two parties of a class after the tutor pays the placement fee.",
            "We do not sell your personal data.",
            "Data may be processed by technical partners needed to run the service (image storage, email delivery, payment gateway, AI services) for the purposes stated above.",
          ],
        },
        {
          heading: "4. Security",
          paragraphs: [
            "Passwords are encrypted and sessions use time-limited tokens. No system is perfectly secure, so please keep your password private.",
          ],
        },
        {
          heading: "5. Your rights",
          paragraphs: [
            "You can view and edit your information on the Account page, and contact tutorlink.n3@gmail.com to request deletion of your account or data.",
          ],
        },
      ],
    },
  },
  terms: {
    vi: {
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
    en: {
      title: "Terms of Service",
      intro:
        "By registering for and using TutorLink, you agree to the terms below.",
      sections: [
        {
          heading: "1. The role of TutorLink",
          paragraphs: [
            "TutorLink is a platform that connects students and tutors. We are not a teaching party, we do not guarantee learning outcomes, and we are not a party to the tuition agreement between the two sides.",
          ],
        },
        {
          heading: "2. Accounts",
          bullets: [
            "You provide accurate information and are responsible for activity on your account.",
            "One account per user. Do not share your password with others.",
            "Tutor profiles must be approved by an admin before going public. Profiles or certificates that are false will be rejected or locked.",
          ],
        },
        {
          heading: "3. Content and conduct",
          bullets: [
            "Do not post false, fraudulent or offensive content, or content that violates the law.",
            "Do not misuse other people's contact details for any purpose other than learning and teaching.",
            "Admins may remove posts or lock accounts that violate these terms, and will state the reason when a post is removed.",
          ],
        },
        {
          heading: "4. Fees and payment",
          paragraphs: [
            "Tutors pay the placement fee in accordance with the Placement Fee Policy. Tuition is agreed between the two sides outside the system.",
          ],
        },
        {
          heading: "5. Reviews and complaints",
          paragraphs: [
            "Users may leave a review after a class ends. Reviews must be honest. You may file a complaint about an inappropriate review for an admin to review.",
          ],
        },
        {
          heading: "6. Limitation of liability",
          paragraphs: [
            "AI suggestions are for reference only. TutorLink is not responsible for agreements and transactions made outside the system between students and tutors.",
          ],
        },
        {
          heading: "7. Changes to the terms",
          paragraphs: [
            "We may update these terms and will announce it in the system. Continuing to use the service means you accept the update.",
          ],
        },
      ],
    },
  },
};
