import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const vi = {
  nav: {
    home: 'Trang chủ',
    findTutor: 'Tìm Gia Sư',
    findClass: 'Tìm Lớp',
    tutorCorner: 'Góc Gia Sư',
    studentCorner: 'Góc Học Sinh',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
  },
  common: {
    retry: 'Thử lại',
    cancel: 'Hủy',
    save: 'Lưu',
    confirm: 'Xác nhận',
    loading: 'Đang tải...',
    empty: 'Không có dữ liệu',
    error: 'Đã có lỗi xảy ra',
    viewAll: 'Xem tất cả',
  },
  contact: {
    locked: 'Thông tin liên hệ sẽ mở sau khi thanh toán phí nhận lớp',
  },
  tuition: {
    note: 'Học phí thực tế hằng tháng do hai bên tự thỏa thuận ngoài hệ thống TutorLink.',
  },
}

const en = {
  nav: {
    home: 'Home',
    findTutor: 'Find Tutors',
    findClass: 'Find Classes',
    tutorCorner: 'Tutor Corner',
    studentCorner: 'Student Corner',
    login: 'Log in',
    register: 'Sign up',
    logout: 'Log out',
  },
  common: {
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    confirm: 'Confirm',
    loading: 'Loading...',
    empty: 'No data',
    error: 'Something went wrong',
    viewAll: 'View all',
  },
  contact: {
    locked: 'Contact details unlock after the enrollment fee is paid',
  },
  tuition: {
    note: 'Monthly tuition is agreed between both parties outside TutorLink.',
  },
}

void i18n.use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en } },
  lng: 'vi',
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
})

export default i18n
