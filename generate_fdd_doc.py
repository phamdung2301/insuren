# -*- coding: utf-8 -*-
"""
Script sinh file tài liệu thứ hai: FDD_System_Workflow_and_Feature_Specification.docx
Tài liệu Thiết kế Luồng Hoạt động & Danh mục Chức năng Hệ thống (Functional Design Document - FDD)
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from build_helpers import (
    add_styled_title, add_heading_1, add_heading_2, add_heading_3,
    add_body_paragraph, add_bullet_item, add_callout, add_table_data,
    COLOR_PRIMARY_DARK, COLOR_PRIMARY_BLUE, COLOR_TEXT_MAIN, COLOR_TEXT_MUTED,
    HEX_PRIMARY_BLUE, HEX_WARNING, HEX_SUCCESS, HEX_CALLOUT_BG
)

def build_fdd_document():
    doc = docx.Document()
    
    # Thiết lập lề trang chuẩn A4
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # =========================================================================
    # TIÊU ĐỀ TÀI LIỆU & THÔNG TIN DỰ ÁN
    # =========================================================================
    add_styled_title(
        doc,
        title_text="TÀI LIỆU ĐẶC TẢ LUỒNG HOẠT ĐỘNG & DANH MỤC CHỨC NĂNG\nFUNCTIONAL DESIGN & WORKFLOW SPECIFICATION (FDD)",
        subtitle_text="Kiến Trúc Hoạt Động, Quy Trình Nghiệp Vụ & Ma Trận Tính Năng Hệ Thống Quản Lý Hợp Đồng Bảo Hiểm",
        meta_info=[
            "Tên Dự án: Insurance Policy Management System",
            "Mã Tài liệu: FDD-INSUR-2026-V2.1",
            "Loại Tài liệu: Functional Design Document (FDD) / System Workflow Specification",
            "Mục tiêu: Tài liệu Bàn giao Kỹ thuật & Hướng dẫn Vận hành Nghiệp vụ Web",
            "Trạng thái: Đã Phê Duyệt Triển Khai (Official Project Baseline)",
            "Ngày ban hành: 07/10/2026"
        ]
    )

    # =========================================================================
    # PHẦN 1: TỔNG QUAN KIẾN TRÚC TOÀN DIỆN DỰ ÁN WEB
    # =========================================================================
    add_heading_1(doc, "1. TỔNG QUAN KIẾN TRÚC TOÀN DIỆN HỆ THỐNG WEB (SYSTEM ARCHITECTURE)")
    
    add_heading_2(doc, "1.1 Mục tiêu Tài liệu (Document Purpose)")
    add_body_paragraph(
        doc,
        "Tài liệu Đặc tả Luồng Hoạt động và Danh mục Chức năng (Functional Design Document - FDD) này được lập ra nhằm mô tả chi tiết cách thức vận hành thực tế của hệ thống web, kết nối trực tiếp giữa lý thuyết yêu cầu nghiệp vụ ngành bảo hiểm và việc thực thi mã nguồn. Tài liệu cung cấp bản đồ luồng hoạt động từng bước (Activity Flows), sơ đồ hành trình người dùng (User Journeys), ma trận phân quyền (Role Matrix), danh mục tính năng chi tiết (Traceability Matrix) và hướng dẫn triển khai vận hành toàn diện."
    )

    add_heading_2(doc, "1.2 Mô hình Kiến trúc Kỹ thuật 3 Tầng (3-Tier Web Architecture)")
    add_bullet_item(doc, "Tầng Giao diện Người dùng (Presentation Layer - Frontend): Xây dựng bằng React 18+ với công cụ đóng gói siêu tốc Vite, thư viện định tuyến React Router v6, hệ thống quản lý state client Zustand/React Context, thư viện đồ thị trực quan hóa Recharts, Axios HTTP Client tích hợp bộ đón chặn JWT Interceptor, và giao diện người dùng hiện đại thiết kế riêng cho lĩnh vực InsurTech.", "Tầng Client: ")
    add_bullet_item(doc, "Tầng Dịch vụ & Xử lý Nghiệp vụ (Application Layer - Backend): Xây dựng bằng ngôn ngữ Java 17 LTS trên nền tảng framework Spring Boot 3.x. Sử dụng Spring Security 6 với bộ lọc JWT Filter để quản lý phiên phi trạng thái (Stateless Authentication), động cơ kiểm tra máy trạng thái (State Machine Engine), dịch vụ tính toán định mức phí bảo hiểm tự động, tích hợp bộ xử lý file Excel Apache POI và JavaMailSender gửi mã OTP qua Gmail SMTP.", "Tầng Server: ")
    add_bullet_item(doc, "Tầng Lưu trữ & Cơ sở Dữ liệu (Persistence Layer - Database): Sử dụng hệ quản trị cơ sở dữ liệu phi quan hệ MongoDB 6.0+ kết hợp Spring Data MongoDB và MongoTemplate. Ứng dụng mô hình tài liệu lồng ghép (Document Modeling with Positional Operators) tối ưu cho việc đọc nhanh và cập nhật nguyên tử, kết hợp bộ chỉ mục phức hợp (Compound Indexing) hỗ trợ quy mô 50,000+ hợp đồng bảo hiểm.", "Tầng Cơ sở dữ liệu: ")

    # =========================================================================
    # PHẦN 2: ĐẶC TẢ CHI TIẾT CÁC LUỒNG HOẠT ĐỘNG CHÍNH (SYSTEM WORKFLOWS)
    # =========================================================================
    add_heading_1(doc, "2. ĐẶC TẢ CHI TIẾT CÁC LUỒNG HOẠT ĐỘNG HỆ THỐNG (SYSTEM ACTIVITY FLOWS)")

    # -------------------------------------------------------------------------
    # LUỒNG 1: XÁC THỰC & ĐĂNG NHẬP
    # -------------------------------------------------------------------------
    add_heading_2(doc, "2.1 Luồng 1: Xác thực, Đăng nhập & Phân quyền Tài khoản (Authentication Flow)")
    add_body_paragraph(
        doc,
        "Luồng xác thực bảo đảm an toàn truy cập thông qua cơ chế mật khẩu một lần (Passwordless OTP) gửi về hòm thư Gmail của khách hàng, kết hợp cơ chế chuyển đổi vai trò nhanh dành cho môi trường phát triển (Dev Login):"
    )
    add_bullet_item(doc, "Người dùng truy cập trang Đăng nhập (/login), nhập địa chỉ Gmail hợp lệ và bấm nút 'Gửi mã OTP'.", "Bước 1 - Yêu cầu OTP: ")
    add_bullet_item(doc, "Backend nhận yêu cầu, sinh ngẫu nhiên mã số bảo mật 6 chữ số, lưu vào bộ nhớ đệm Cache với thời gian sống (TTL) 300 giây (5 phút), và kích hoạt Spring Mail Sender gửi email chứa mã OTP về hộp thư của người dùng.", "Bước 2 - Sinh mã & Gửi thư: ")
    add_bullet_item(doc, "Người dùng kiểm tra hòm thư, nhập mã OTP vào giao diện Web và nhấn 'Xác thực & Đăng nhập'.", "Bước 3 - Nhập mã OTP: ")
    add_bullet_item(doc, "Backend đối soát mã OTP. Nếu chính xác, hệ thống kiểm tra email: nếu thuộc danh sách cấu hình `app.admin.emails` sẽ cấp vai trò `ROLE_ADMIN`, ngược lại cấp vai trò `ROLE_USER`. Tạo người dùng mới trong MongoDB nếu chưa tồn tại (Upsert User).", "Bước 4 - Phân quyền & Tạo Token: ")
    add_bullet_item(doc, "Backend phát hành JSON Web Token (JWT) có hiệu lực 24 giờ. Frontend lưu JWT vào localStorage và tự động chuyển hướng: Khách hàng chuyển đến Customer Portal (/portal), Quản trị viên chuyển đến Admin Dashboard (/admin).", "Bước 5 - Lưu trữ & Chuyển hướng: ")
    add_bullet_item(doc, "Tính năng Dev Quick Switch: Trên màn hình Login có sẵn 2 nút chọn nhanh 'Khách hàng (User)' và 'Quản trị viên (Admin)' giúp kiểm thử viên đăng nhập tức thời mà không cần chờ email thực tế.", "Chế độ Dev Tiện lợi: ")

    # -------------------------------------------------------------------------
    # LUỒNG 2: MUA BẢO HIỂM TRỰC TUYẾN
    # -------------------------------------------------------------------------
    add_heading_2(doc, "2.2 Luồng 2: Quy trình Mua Bảo hiểm Trực tuyến (E-Commerce Buy Insurance Flow)")
    add_body_paragraph(
        doc,
        "Quy trình mua bảo hiểm được thiết kế chuẩn E-Commerce 4 bước tối ưu hóa tỷ lệ chuyển đổi, cho phép khách hàng tự khai báo và chủ động lựa chọn lưu bản nháp hoặc nộp đơn xin báo phí:"
    )
    add_bullet_item(doc, "Khách hàng chọn gói bảo hiểm mong muốn từ danh mục (ví dụ: Bảo hiểm Tài sản Cháy nổ - Property Damage, Bảo hiểm Trách nhiệm Công cộng - General Liability, Bảo hiểm Tai nạn Lao động - Workers Compensation).", "Bước 1 - Lựa chọn Sản phẩm: ")
    add_bullet_item(doc, "Hệ thống tự động điền sẵn thông tin khách hàng từ hồ sơ cá nhân. Khách hàng khai báo thêm một hoặc nhiều địa điểm cần bảo vệ (Location Address) kèm mô tả rủi ro.", "Bước 2 - Khai báo Địa điểm & Đối tượng: ")
    add_bullet_item(doc, "Tại mỗi địa điểm, khách hàng chọn các quyền lợi (Coverages), nhập hạn mức bồi thường (Limit) và mức tự chịu bồi thường (Deductible). Hệ thống gọi API `/excel/calculate` tính toán tức thời mức phí bảo hiểm tương ứng theo ma trận tỷ lệ phí.", "Bước 3 - Cấu hình Quyền lợi & Tính phí Real-time: ")
    add_bullet_item(doc, "Giao diện tổng hợp bảng kê chi tiết toàn bộ địa điểm, quyền lợi và tổng phí bảo hiểm ước tính. Khách hàng có 2 sự lựa chọn quyết định:", "Bước 4 - Tóm tắt Đơn & Quyết định: ")
    add_bullet_item(doc, "Tùy chọn A - 'Lưu Bản Nháp (Save as Draft)': Hệ thống tạo mới hợp đồng ở trạng thái DRAFT. Hợp đồng này được lưu trữ an toàn trong tài khoản của khách hàng, cho phép chỉnh sửa bổ sung bất cứ lúc nào trước khi chính thức nộp đơn.", "   • Nhánh 4A (Lưu DRAFT): ")
    add_bullet_item(doc, "Tùy chọn B - 'Nộp Đơn Yêu Cầu Báo Phí (Submit for Quote)': Hệ thống tạo mới hợp đồng và lập tức kích hoạt tính năng báo phí, đưa hợp đồng sang trạng thái QUOTED để chuyển đến khâu thẩm định chính thức.", "   • Nhánh 4B (Nộp QUOTED): ")

    # -------------------------------------------------------------------------
    # LUỒNG 3: VÒNG ĐỜI HỢP ĐỒNG & THANH TOÁN
    # -------------------------------------------------------------------------
    add_heading_2(doc, "2.3 Luồng 3: Quy trình Quản lý Vòng đời Hợp đồng & Thanh toán (Lifecycle & Payment Flow)")
    add_body_paragraph(
        doc,
        "Đây là luồng cốt lõi của hệ thống quản lý bảo hiểm, phản ánh đầy đủ nghiệp vụ thẩm định, ràng buộc cam kết phí và thanh toán phí bảo hiểm theo đúng chuẩn quốc tế:"
    )

    add_callout(
        doc,
        "QUY TẮC PHÂN LUỒNG QUYỀN HẠN & NGHIỆP VỤ GIỮA USER VÀ ADMIN:\n"
        "• DRAFT → QUOTED: Khách hàng hoặc Admin nộp đơn xin phê duyệt báo giá.\n"
        "• QUOTED → BOUND: Khách hàng đồng thuận mức phí hoặc Admin phê duyệt mức báo giá. Hệ thống tự động ghi nhận thời điểm cam kết giữ chỗ `boundDate` và thiết lập ngày tới hạn thanh toán `paymentDueDate` (mặc định 7 ngày hoặc do khách hàng đề xuất/quản trị viên ấn định).\n"
        "• BOUND → ACTIVE (Thanh toán & Kích hoạt):\n"
        "   + Role USER (Khách hàng): Khách hàng bấm 'Thanh toán phí bảo hiểm', hệ thống hiển thị Popup/Modal chứa thông tin tài khoản ngân hàng, số tiền phí (`totalPremium`) và mã QR chuyển khoản (VietQR format). Khách hàng bấm nút giả lập 'Xác nhận đã thanh toán', hệ thống kiểm tra và chuyển hợp đồng sang ACTIVE.\n"
        "   + Role ADMIN (Kích hoạt tại quầy): Admin có thể tìm kiếm hợp đồng đang ở trạng thái BOUND và bấm nút 'Kích hoạt trực tiếp (Offline Activation)' ngay lập tức khi khách hàng nộp tiền mặt hoặc sao kê quầy thành công.\n"
        "• Khi chuyển sang ACTIVE: Hệ thống tự động cập nhật ngày bắt đầu hiệu lực `effectiveDate` và ngày đáo hạn `expirationDate` (+365 ngày).",
        title="ĐẶC TẢ NGHIỆP VỤ CHUYỂN TRẠNG THÁI VÀ THANH TOÁN:",
        border_color=HEX_PRIMARY_BLUE
    )

    add_bullet_item(doc, "Hợp đồng vừa được khởi tạo từ form mua hàng trực tuyến. Khách hàng có thể tiếp tục bổ sung thông tin hoặc điều chỉnh hạn mức bồi thường.", "Giai đoạn 1 - Khởi tạo DRAFT: ")
    add_bullet_item(doc, "Khách hàng bấm 'Yêu cầu Báo phí'. Backend kiểm tra tính toàn vẹn (tối thiểu 1 địa điểm, 1 quyền lợi), chạy công thức tính phí và chuyển trạng thái sang QUOTED.", "Giai đoạn 2 - Phê duyệt Báo phí (QUOTED): ")
    add_bullet_item(doc, "Khách hàng đồng ý mức phí chào bán và nhấn 'Chấp thuận Báo giá (Bind Policy)' hoặc Admin thực hiện. Hệ thống chuyển sang BOUND, xác lập ngày `boundDate` và hạn nộp phí `paymentDueDate` (7 ngày). Trong khoảng thời gian này, doanh nghiệp bảo hiểm cam kết không thay đổi mức phí.", "Giai đoạn 3 - Gắn kết Ràng buộc (BOUND): ")
    add_bullet_item(doc, "Thanh toán thành công qua mã QR hoặc kích hoạt trực tiếp từ Admin. Hệ thống xác lập `effectiveDate = Now` và `expirationDate = Now + 365 ngày`. Hợp đồng chính thức có hiệu lực bồi thường theo pháp luật.", "Giai đoạn 4 - Kích hoạt Phát hành (ACTIVE): ")
    add_bullet_item(doc, "Nếu đến hạn `paymentDueDate` mà không ghi nhận thanh toán, hợp đồng tự động hủy bỏ vị thế giữ chỗ (chuyển CANCELLED hoặc quay lại DRAFT). Khi hết 365 ngày hiệu lực, hợp đồng chuyển sang EXPIRED.", "Giai đoạn 5 - Hủy bỏ hoặc Đáo hạn (CANCELLED / EXPIRED): ")

    # -------------------------------------------------------------------------
    # LUỒNG 4: ĐIỀU CHỈNH HỢP ĐỒNG & LỊCH SỬ PHIÊN BẢN
    # -------------------------------------------------------------------------
    add_heading_2(doc, "2.4 Luồng 4: Quy trình Điều chỉnh Hợp đồng & Quản lý Phiên bản (Endorsement Flow)")
    add_body_paragraph(
        doc,
        "Khi một hợp đồng bảo hiểm doanh nghiệp đang trong thời hạn có hiệu lực (ACTIVE), doanh nghiệp khách hàng có thể mở rộng cơ sở sản xuất, mua thêm máy móc hoặc điều chỉnh hạn mức bảo hiểm:"
    )
    add_bullet_item(doc, "Người dùng hoặc Quản trị viên truy cập màn hình Chi tiết Hợp đồng (/policies/{id}), chuyển sang tab 'Điều chỉnh Hợp đồng (Endorsement)'.", "Bước 1 - Khởi tạo Yêu cầu: ")
    add_bullet_item(doc, "Người dùng thực hiện thay đổi: thêm địa chỉ nhà xưởng mới, nâng hạn mức bồi thường của quyền lợi hiện hữu, hoặc nhập lý do điều chỉnh.", "Bước 2 - Khai báo Nội dung Sửa đổi: ")
    add_bullet_item(doc, "Backend kích hoạt động cơ Endorsement (`/policies/{id}/endorsements`): Chụp toàn bộ nội dung của phiên bản hiện tại (ví dụ: Version 1) lưu thành bản Snapshot bất biến vào collection `policy_versions`.", "Bước 3 - Lưu trữ Bản chụp Snapshot: ")
    add_bullet_item(doc, "Tăng chỉ số phiên bản trong hợp đồng chính (version = version + 1 = Version 2), cập nhật các quyền lợi mới và tính toán lại tổng phí bảo hiểm `totalPremium`.", "Bước 4 - Cập nhật Phiên bản Mới: ")
    add_bullet_item(doc, "Ghi nhận một bản ghi giao dịch mới vào collection `policy_transactions` với loại giao dịch `ENDORSEMENT`, thời gian thực và người thực hiện.", "Bước 5 - Ghi vết Kiểm toán: ")
    add_bullet_item(doc, "Trên giao diện Web, người dùng có thể mở bảng so sánh lịch sử (Version History Diff) để xem đối chiếu song song giữa Phiên bản 1 và Phiên bản 2, làm nổi bật các trường dữ liệu vừa thay đổi.", "Bước 6 - So sánh Trực quan (Diff UI): ")

    # -------------------------------------------------------------------------
    # LUỒNG 5: QUẢN TRỊ BIỂU PHÍ QUA FILE EXCEL
    # -------------------------------------------------------------------------
    add_heading_2(doc, "2.5 Luồng 5: Quy trình Quản trị Ma trận Biểu phí qua Excel (Pricing Matrix Flow)")
    add_body_paragraph(
        doc,
        "Hệ thống tích hợp sâu với định dạng Microsoft Excel (.xlsx) thông qua thư viện Apache POI, cho phép Chuyên viên Định phí (Actuary) quản trị ma trận tỷ lệ phí linh hoạt mà không cần lập trình lại:"
    )
    add_bullet_item(doc, "Admin truy cập Dashboard, nhấn 'Tải mẫu Excel Biểu phí' (GET `/excel/template`). Hệ thống xuất file `InsurancePricingMatrix_{Date}.xlsx` chứa danh mục tất cả mã quyền lợi (PROP_FIRE, GEN_LIAB, WORK_COMP...) và tỷ lệ phí cơ sở hiện hành.", "Bước 1 - Tải File Mẫu Biểu phí: ")
    add_bullet_item(doc, "Chuyên viên định phí mở file Excel trên máy tính cá nhân, điều chỉnh các con số tỷ lệ phí theo chính sách kinh doanh mới và lưu lại file.", "Bước 2 - Chỉnh sửa Tỷ lệ Phí: ")
    add_bullet_item(doc, "Admin chọn file Excel vừa sửa và nhấn 'Tải lên Cập nhật' (POST `/excel/import-rates`). Backend đọc các ô dữ liệu, xác thực định dạng số và cập nhật đồng loạt bộ nhớ `PremiumCalculationService.BASE_RATES`.", "Bước 3 - Cập nhật Hệ thống: ")
    add_bullet_item(doc, "Trên từng hợp đồng cụ thể, người dùng hoặc Admin có thể bấm nút 'Xuất Bảng kê Phí Excel' (GET `/excel/policy/{id}/download`) để tải về file `PremiumCalc_{PolicyNumber}.xlsx` phục vụ thanh quyết toán và in ấn kẹp hồ sơ pháp lý.", "Bước 4 - Xuất Bảng kê Phí Hợp đồng: ")

    # -------------------------------------------------------------------------
    # LUỒNG 6: BÁO CÁO AGGREGATION & BENCHMARK DỮ LIỆU LỚN
    # -------------------------------------------------------------------------
    add_heading_2(doc, "2.6 Luồng 6: Báo cáo Thống kê & Thử nghiệm Hiệu năng 50k Bản ghi (Analytics & Benchmark)")
    add_bullet_item(doc, "Admin truy cập Admin Dashboard: Hệ thống tự động gọi 4 API Aggregation Pipeline để kết xuất 4 biểu đồ trực quan (Biểu đồ tròn số lượng theo trạng thái, Biểu đồ cột doanh số phí theo trạng thái, Bảng xếp hạng Top 5 hợp đồng lớn nhất, Biểu đồ đường doanh thu lũy kế theo từng tháng).", "Báo cáo Thống kê Thời gian thực: ")
    add_bullet_item(doc, "Admin truy cập màn hình Benchmark (/benchmark): Nhấn 'Sinh 50,000 Hợp đồng Giả lập' (POST `/benchmark/generate-50k`). Backend sử dụng tác vụ nền sinh dữ liệu đa dạng ngẫu nhiên và lưu theo khối (Batch Insertion) vào MongoDB.", "Khởi tạo Dữ liệu Thử tải 50k: ")
    add_bullet_item(doc, "Admin nhấn 'Chạy Thử nghiệm Hiệu năng' (GET `/benchmark/run`). Hệ thống chạy 3 câu truy vấn trọng yếu, thu thập và hiển thị bảng so sánh Execution Plan: chứng minh việc đánh chỉ mục Compound Index ({ status: 1, effectiveDate: 1 }) giúp câu truy vấn chuyển từ COLLSCAN (quét toàn bộ 50,000 bản ghi) sang IXSCAN (chỉ quét các index keys hợp lệ), giảm thời gian từ hàng nghìn mili-giây xuống dưới 50 mili-giây.", "Đo lường & Phân tích Chỉ mục: ")

    # =========================================================================
    # PHẦN 3: BẢNG MA TRẬN PHÂN QUYỀN NGƯỜI DÙNG
    # =========================================================================
    add_heading_1(doc, "3. BẢNG MA TRẬN PHÂN QUYỀN NGƯỜI DÙNG (ROLE & PERMISSION MATRIX)")
    add_body_paragraph(
        doc,
        "Dưới đây là ma trận phân quyền chi tiết giữa Khách hàng (ROLE_USER) và Quản trị viên/Chuyên viên Thẩm định (ROLE_ADMIN) trên từng chức năng và nút bấm trong hệ thống:"
    )

    add_table_data(
        doc,
        headers=["Mã Chức Năng", "Tên Thao tác / Chức năng Hệ thống", "Khách hàng (User)", "Quản trị viên (Admin)", "Ghi chú Nghiệp vụ Phân quyền"],
        data_rows=[
            ["AUTH-01", "Đăng nhập OTP qua Gmail & Dev Login", "Cho phép", "Cho phép", "Admin tự động nhận diện nếu email thuộc cấu hình"],
            ["CUST-01", "Xem danh sách hợp đồng cá nhân trên Portal", "Cho phép", "Cho phép", "User chỉ thấy hợp đồng của chính mình"],
            ["BUY-01", "Thực hiện mua bảo hiểm (Lưu DRAFT / Nộp QUOTED)", "Cho phép", "Cho phép", "Hỗ trợ khách hàng tự phục vụ"],
            ["POL-01", "Xem chi tiết hợp đồng bảo hiểm", "Cho phép", "Cho phép", "User chỉ xem hợp đồng của mình, Admin xem tất cả"],
            ["POL-02", "Chỉnh sửa thông tin chung hợp đồng", "Bị chặn", "Cho phép", "Chỉ Admin/Underwriter mới có quyền sửa đổi"],
            ["POL-03", "Xóa hợp đồng bảo hiểm", "Bị chặn", "Cho phép", "Xóa dữ liệu đòi hỏi quyền quản trị cấp cao"],
            ["TRANS-01", "Chuyển trạng thái từ DRAFT sang QUOTED", "Cho phép", "Cho phép", "Yêu cầu báo phí từ đơn hợp lệ"],
            ["TRANS-02", "Chuyển trạng thái từ QUOTED sang BOUND", "Cho phép", "Cho phép", "Khách hàng chốt mua hoặc Admin phê duyệt"],
            ["PAY-01", "Mở Popup mã QR & Giả lập Đã thanh toán (ACTIVE)", "Cho phép", "Cho phép", "Kênh kích hoạt trực tuyến của khách hàng"],
            ["PAY-02", "Kích hoạt trực tiếp tại quầy (Offline Active to ACTIVE)", "Bị chặn", "Cho phép", "Dành cho Admin khi nhận tiền mặt/sao kê quầy"],
            ["END-01", "Yêu cầu Endorsement & Tạo Version mới", "Cho phép", "Cho phép", "Áp dụng khi hợp đồng đang ACTIVE"],
            ["HIST-01", "Xem lịch sử Snapshot & So sánh Diff các phiên bản", "Cho phép", "Cho phép", "Minh bạch hóa thông tin hợp đồng tài chính"],
            ["EXCEL-01", "Tải xuống bảng tính phí cá nhân của Policy", "Cho phép", "Cho phép", "Phục vụ thanh quyết toán của khách hàng"],
            ["EXCEL-02", "Tải Template & Tải lên cập nhật Ma trận Biểu phí", "Bị chặn", "Cho phép", "Chỉ Admin/Chuyên viên định phí được quản trị"],
            ["REP-01", "Xem 4 Báo cáo Thống kê Doanh số Aggregation", "Bị chặn", "Cho phép", "Báo cáo kinh doanh nội bộ của công ty"],
            ["BENCH-01", "Sinh 50,000 bản ghi & Chạy Benchmark Indexing", "Bị chặn", "Cho phép", "Công cụ kỹ thuật dành riêng cho quản trị viên"]
        ],
        col_widths=[1.0, 2.3, 1.1, 1.1, 1.7]
    )

    # =========================================================================
    # PHẦN 4: DANH MỤC PHÂN RÃ CHỨC NĂNG HỆ THỐNG TOÀN DIỆN
    # =========================================================================
    add_heading_1(doc, "4. DANH MỤC PHÂN RÃ CHỨC NĂNG HỆ THỐNG (SYSTEM FEATURE BREAKDOWN & TRACEABILITY MATRIX)")
    add_body_paragraph(
        doc,
        "Dưới đây là bảng phân rã chi tiết toàn bộ các tính năng của hệ thống web, liên kết chặt chẽ giữa Giao diện Người dùng (Frontend Component) và Giao diện Lập trình Ứng dụng (Backend REST API):"
    )

    add_table_data(
        doc,
        headers=["Mã Tính Năng", "Tên Tính Năng", "Mô tả Nghiệp vụ", "Màn hình Frontend", "API Backend Phụ Trách", "Input / Output"],
        data_rows=[
            ["FEAT-01", "Xác thực OTP Gmail", "Gửi mã số 6 chữ số về hòm thư điện tử để đăng nhập", "Login.jsx", "POST /auth/login\nGET /auth/me", "In: email, otp\nOut: JWT token, user info"],
            ["FEAT-02", "Dev Role Switch", "Chuyển nhanh quyền User/Admin ngay tại màn hình Login", "Login.jsx", "POST /auth/login (mock)", "In: role string\nOut: JWT token corresponding"],
            ["FEAT-03", "Cổng Hợp đồng Khách hàng", "Hiển thị danh sách thẻ hợp đồng cá nhân kèm bộ lọc trạng thái", "CustomerPortal.jsx", "GET /policies", "In: user email, status filter\nOut: List of PolicyResponse"],
            ["FEAT-04", "Wizard Mua Bảo hiểm 4 Bước", "Quy trình khai báo và tính phí mua bảo hiểm trực tuyến", "BuyInsurance.jsx", "POST /excel/calculate\nPOST /policies", "In: Form data 4 steps\nOut: Policy created (Draft/Quoted)"],
            ["FEAT-05", "Lưu Nháp / Nộp Báo phí", "Nút bấm linh hoạt lưu đơn nháp hoặc gửi duyệt báo phí", "BuyInsurance.jsx", "POST /policies", "In: status='DRAFT' or 'QUOTED'\nOut: PolicyResponse"],
            ["FEAT-06", "Chi tiết Hợp đồng Đa phân hệ", "Xem toàn diện thông tin Insured, Locations, Coverages và Timeline", "PolicyDetail.jsx", "GET /policies/{policyNumber}", "In: policyNumber\nOut: Detailed PolicyResponse"],
            ["FEAT-07", "Quản lý Địa điểm & Quyền lợi", "Thêm, sửa, xóa Location và Coverage trực tiếp trên giao diện", "PolicyDetail.jsx", "POST/PUT/DELETE /policies/{id}/locations\nPOST/PUT/DELETE /coverages", "In: LocationDto, CoverageDto\nOut: PolicyResponse updated"],
            ["FEAT-08", "Thanh Tiến trình Vòng đời", "Stepper trực quan hóa 6 trạng thái vòng đời của hợp đồng", "PolicyDetail.jsx", "POST /policies/{id}/status-transitions", "In: targetStatus, reason\nOut: PolicyResponse status changed"],
            ["FEAT-09", "Modal Thanh toán QR & Giả lập", "Hiển thị mã QR ngân hàng, cho phép bấm 'Giả lập đã thanh toán'", "PolicyDetail.jsx", "POST /policies/{id}/status-transitions", "In: targetStatus='ACTIVE'\nOut: PolicyResponse with effectiveDate"],
            ["FEAT-10", "Kích hoạt Trực tiếp Admin", "Admin bấm kích hoạt hợp đồng BOUND sang ACTIVE tại quầy", "PolicyDetail.jsx\nAdminDashboard.jsx", "POST /policies/{id}/status-transitions", "In: targetStatus='ACTIVE'\nOut: PolicyResponse with effectiveDate"],
            ["FEAT-11", "Động cơ Endorsement", "Gửi yêu cầu điều chỉnh quyền lợi của hợp đồng ACTIVE", "PolicyDetail.jsx", "POST /policies/{id}/endorsements", "In: EndorsementRequest\nOut: New Policy version created"],
            ["FEAT-12", "So sánh Phiên bản Trực quan", "Màn hình so sánh đối chiếu Diff giữa 2 phiên bản cũ và mới", "PolicyDetail.jsx", "GET /policies/{id}/versions\nGET /policies/{id}/versions/{v}", "In: version number\nOut: Snapshot diff comparison"],
            ["FEAT-13", "Quản trị Biểu phí qua Excel", "Tải xuống template biểu phí và tải lên cập nhật Base Rates", "AdminDashboard.jsx", "GET /excel/template\nPOST /excel/import-rates", "In: File .xlsx\nOut: Map<String, Double> rates updated"],
            ["FEAT-14", "Xuất Bảng kê Phí Hợp đồng", "Tải file Excel kê chi tiết phí bảo hiểm của hợp đồng", "PolicyDetail.jsx", "GET /excel/policy/{id}/download", "In: policyNumber\nOut: Binary file .xlsx attachment"],
            ["FEAT-15", "Biểu đồ Báo cáo Aggregation", "Trực quan hóa 4 báo cáo thống kê chuyên sâu qua đồ thị Recharts", "AdminDashboard.jsx", "GET /reports/* (4 endpoints)", "In: none\nOut: Aggregated data lists for charts"],
            ["FEAT-16", "Thử nghiệm Hiệu năng 50k", "Sinh 50,000 policies và hiển thị bảng so sánh Execution Plan", "BenchmarkView.jsx", "POST /benchmark/generate-50k\nGET /benchmark/run", "In: none\nOut: BenchmarkReportResponse"]
        ],
        col_widths=[0.9, 1.6, 2.0, 1.2, 1.5, 1.4]
    )

    # =========================================================================
    # PHẦN 5: HƯỚNG DẪN CÀI ĐẶT, CẤU HÌNH & VẬN HÀNH
    # =========================================================================
    add_heading_1(doc, "5. HƯỚNG DẪN CÀI ĐẶT, CẤU HÌNH & VẬN HÀNH DỰ ÁN (SETUP & OPERATIONS GUIDE)")

    add_heading_2(doc, "5.1 Yêu cầu Môi trường Kỹ thuật (System Prerequisites)")
    add_bullet_item(doc, "Java Development Kit (JDK): Phiên bản 17 LTS trở lên (ví dụ: Eclipse Temurin 17 hoặc Oracle JDK 17).")
    add_bullet_item(doc, "Node.js & Trình quản lý gói: Node.js phiên bản 18+ hoặc 20+ LTS, npm phiên bản 9+.")
    add_bullet_item(doc, "Cơ sở dữ liệu MongoDB: MongoDB Community hoặc Enterprise phiên bản 6.0 trở lên, chạy mặc định tại cổng 27017.")
    add_bullet_item(doc, "Trình duyệt Web hiện đại: Google Chrome, Microsoft Edge, Mozilla Firefox hoặc Safari bản cập nhật mới nhất.")

    add_heading_2(doc, "5.2 Cấu hình Tham số Hệ thống (`application.properties`)")
    add_callout(
        doc,
        "# Cấu hình MongoDB Connection\n"
        "spring.data.mongodb.uri=mongodb://localhost:27017/insurance_db\n\n"
        "# Cấu hình Cổng máy chủ Backend\n"
        "server.port=8080\n\n"
        "# Cấu hình Bảo mật JWT Secret & Expiration\n"
        "app.jwt.secret=9a3f8c7e2b1d4a6f8c0e2b4d6f8a1c3e5a7b9d1f3e5a7b9c1d3e5f7a9b1c3d5e\n"
        "app.jwt.expiration-ms=86400000\n\n"
        "# Danh sách Email tự động nhận quyền Admin (ROLE_ADMIN)\n"
        "app.admin.emails=dungphdse@gmail.com,admin@insurtech.vn\n\n"
        "# Cấu hình Spring Boot Starter Mail (Gmail SMTP)\n"
        "spring.mail.host=smtp.gmail.com\n"
        "spring.mail.port=587\n"
        "spring.mail.username=your-email@gmail.com\n"
        "spring.mail.password=your-app-password\n"
        "spring.mail.properties.mail.smtp.auth=true\n"
        "spring.mail.properties.mail.smtp.starttls.enable=true",
        title="NỘI DUNG TỆP CẤU HÌNH MẪU (APPLICATION.PROPERTIES):",
        border_color=HEX_PRIMARY_BLUE
    )

    add_heading_2(doc, "5.3 Hướng dẫn Lệnh Khởi chạy Hệ thống (Run Commands)")
    add_bullet_item(doc, "Khởi chạy dịch vụ Cơ sở dữ liệu: Đảm bảo MongoDB Daemon đang chạy (`mongod` hoặc qua Windows Service).", "Bước 1 - Khởi động MongoDB: ")
    add_bullet_item(doc, "Biên dịch và chạy Backend: Mở cửa sổ dòng lệnh tại thư mục gốc `d:/Insurance`, chạy lệnh: `./mvnw spring-boot:run` (hoặc `mvn spring-boot:run`). Máy chủ Backend sẽ lắng nghe tại `http://localhost:8080`.", "Bước 2 - Khởi động Backend: ")
    add_bullet_item(doc, "Cài đặt phụ thuộc & Chạy Frontend: Mở cửa sổ dòng lệnh thứ hai tại `d:/Insurance/frontend`, chạy lệnh `npm install` (lần đầu) và sau đó chạy `npm run dev`. Giao diện Web sẽ sẵn sàng tại `http://localhost:5173`.", "Bước 3 - Khởi động Frontend: ")

    add_heading_2(doc, "5.4 Kịch bản Kiểm thử Vận hành Mẫu (End-to-End Walkthrough Scenario)")
    add_bullet_item(doc, "Truy cập `http://localhost:5173/login`, bấm nút 'Khách hàng (User)' để đăng nhập nhanh với quyền ROLE_USER.", "Bước Kịch bản 1: ")
    add_bullet_item(doc, "Truy cập menu 'Mua Bảo hiểm' (/buy), tiến hành điền form 4 bước, tại bước cuối bấm 'Lưu bản nháp' để tạo hợp đồng trạng thái DRAFT.", "Bước Kịch bản 2: ")
    add_bullet_item(doc, "Truy cập 'Cổng thông tin' (/portal), bấm vào hợp đồng vừa tạo để mở trang Chi tiết (/policies/{id}).", "Bước Kịch bản 3: ")
    add_bullet_item(doc, "Bấm 'Yêu cầu Báo phí' -> Hợp đồng chuyển sang QUOTED.", "Bước Kịch bản 4: ")
    add_bullet_item(doc, "Bấm 'Chấp thuận Báo giá (Bind)' -> Chọn hạn nộp phí (ví dụ: 7 ngày) -> Hợp đồng chuyển sang BOUND.", "Bước Kịch bản 5: ")
    add_bullet_item(doc, "Bấm 'Thanh toán Phí' -> Hộp thoại mã QR ngân hàng mở ra -> Bấm 'Giả lập đã thanh toán' -> Hợp đồng chuyển sang ACTIVE, thời hạn bảo hiểm 365 ngày hiển thị đầy đủ.", "Bước Kịch bản 6: ")
    add_bullet_item(doc, "Đăng xuất, bấm nút 'Quản trị viên (Admin)' để đăng nhập lại -> Truy cập Dashboard (/admin) xem các biểu đồ thống kê thời gian thực và quản trị biểu phí Excel.", "Bước Kịch bản 7: ")

    output_path = "d:/Insurance/docs/FDD_System_Workflow_and_Feature_Specification.docx"
    doc.save(output_path)
    try:
        doc.save("d:/Insurance/FDD_System_Workflow_and_Feature_Specification.docx")
    except PermissionError:
        print("Note: Root file is currently opened in Word, saved to docs/ successfully.")
    print(f"FDD Document successfully created at: {output_path}")

if __name__ == "__main__":
    build_fdd_document()
