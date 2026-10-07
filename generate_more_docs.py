# -*- coding: utf-8 -*-
"""
Script sinh thêm các tài liệu .docx chuyên nghiệp cho dự án:
1. API_Specification_and_Integration_Guide.docx (Tài liệu Đặc tả API RESTful & Hướng dẫn Tích hợp)
2. Database_Design_and_Data_Dictionary.docx (Tài liệu Thiết kế Cơ sở Dữ liệu MongoDB & Từ điển Dữ liệu)
3. System_Deployment_and_Operations_Guide.docx (Tài liệu Hướng dẫn Cài đặt, Triển khai & Vận hành)
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

# =============================================================================
# 1. TÀI LIỆU ĐẶC TẢ API (API_Specification_and_Integration_Guide.docx)
# =============================================================================
def build_api_document():
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    add_styled_title(
        doc,
        title_text="TÀI LIỆU ĐẶC TẢ RESTful API & HƯỚNG DẪN TÍCH HỢP\nAPI SPECIFICATION & INTEGRATION GUIDE",
        subtitle_text="Đặc Tả Toàn Diện Các Giao Diện Lập Trình Ứng Dụng (RESTful APIs) - Insurance Policy Management System",
        meta_info=[
            "Tên Dự án: Insurance Policy Management System",
            "Mã Tài liệu: API-INSUR-2026-V2.1",
            "Loại Tài liệu: API Specification & Developer Guide (.docx)",
            "Tiêu chuẩn: OpenAPI 3.0 / RESTful Architecture",
            "Ngày ban hành: 07/10/2026"
        ]
    )

    add_heading_1(doc, "1. TỔNG QUAN KIẾN TRÚC API (API ARCHITECTURE OVERVIEW)")
    add_body_paragraph(doc, "Hệ thống Backend Spring Boot 3 cung cấp bề mặt API RESTful toàn diện, tuân thủ nghiêm ngặt các nguyên tắc chuẩn của kiến trúc REST:")
    add_bullet_item(doc, "Định dạng dữ liệu: 100% dữ liệu trao đổi qua HTTP Request Body và Response Body sử dụng chuẩn JSON (application/json), ngoại trừ các endpoint xuất/nhập Excel sử dụng multipart/form-data và octet-stream.")
    add_bullet_item(doc, "Cơ chế Xác thực: Sử dụng JSON Web Token (JWT) theo chuẩn Bearer Token trong Header: `Authorization: Bearer <token>`.")
    add_bullet_item(doc, "Quy chuẩn Phản hồi chuẩn (ApiResponse Wrapper): Tất cả API trả về cấu trúc đồng nhất gồm `success` (boolean), `message` (string), `data` (object/array), `errors` (array).")

    add_callout(
        doc,
        "{\n"
        '  "success": true,\n'
        '  "message": "Policy status transitioned successfully",\n'
        '  "data": { ... },\n'
        '  "timestamp": "2026-10-07T10:00:00Z"\n'
        "}",
        title="CẤU TRÚC PHẢN HỒI CHUẨN APIRESPONSE:",
        border_color=HEX_PRIMARY_BLUE
    )

    add_heading_1(doc, "2. DANH MỤC CHI TIẾT CÁC NHÓM API ENDPOINTS")

    # Nhóm Auth
    add_heading_2(doc, "2.1 Nhóm API Xác thực & Người dùng (/auth, /user)")
    add_table_data(
        doc,
        headers=["Method", "Endpoint", "Mô tả Nghiệp vụ", "Quyền", "Tham số chính"],
        data_rows=[
            ["POST", "/auth/login", "Đăng nhập bằng Email/OTP hoặc Dev Login; trả về JWT", "Public", "Body: { email, fullName, role }"],
            ["GET", "/auth/me", "Lấy thông tin tài khoản và danh sách quyền từ Access Token", "Authenticated", "Header: Authorization Bearer"],
            ["GET", "/user/profile", "Xem thông tin chi tiết hồ sơ cá nhân của người dùng", "Authenticated", "Header: Authorization Bearer"],
            ["PUT", "/user/profile", "Cập nhật họ tên, số điện thoại, địa chỉ thường trú", "Authenticated", "Body: UserProfileDto"]
        ],
        col_widths=[0.8, 1.8, 2.3, 1.0, 1.5]
    )

    # Nhóm Policy Core
    add_heading_2(doc, "2.2 Nhóm API Quản lý Hợp đồng Cốt lõi (/policies)")
    add_table_data(
        doc,
        headers=["Method", "Endpoint", "Mô tả Nghiệp vụ", "Quyền", "Tham số chính"],
        data_rows=[
            ["POST", "/policies", "Khởi tạo hợp đồng mới (DRAFT hoặc QUOTED)", "Authenticated", "Body: CreatePolicyRequest"],
            ["GET", "/policies", "Tìm kiếm, lọc kết hợp và phân trang hợp đồng", "Authenticated", "Query: status, insuredName, page, size, min/maxPremium"],
            ["GET", "/policies/{policyNumber}", "Xem chi tiết toàn bộ một hợp đồng bảo hiểm", "Authenticated", "Path: policyNumber"],
            ["PUT", "/policies/{policyNumber}", "Cập nhật thông tin chung của hợp đồng", "Admin/Staff", "Body: UpdatePolicyRequest"],
            ["DELETE", "/policies/{policyNumber}", "Xóa hợp đồng bảo hiểm khỏi hệ thống", "Admin", "Path: policyNumber"]
        ],
        col_widths=[0.8, 2.0, 2.1, 1.0, 1.5]
    )

    # Nhóm Locations & Coverages
    add_heading_2(doc, "2.3 Nhóm API Quản lý Địa điểm & Quyền lợi (/policies/{id}/...)")
    add_table_data(
        doc,
        headers=["Method", "Endpoint", "Mô tả Nghiệp vụ", "Quyền", "Tham số chính"],
        data_rows=[
            ["POST", "/policies/{id}/locations", "Thêm Location mới vào hợp đồng", "Authenticated", "Body: LocationDto (address)"],
            ["PUT", "/policies/{id}/locations/{locId}", "Cập nhật thông tin địa chỉ Location", "Authenticated", "Path: locId, Body: LocationDto"],
            ["DELETE", "/policies/{id}/locations/{locId}", "Xóa Location và các Coverages trực thuộc", "Authenticated", "Path: locId"],
            ["POST", "/policies/{id}/locations/{locId}/coverages", "Thêm Coverage vào Location; tự động tính lại tổng phí", "Authenticated", "Body: CoverageDto (limit, deductible, premium)"],
            ["PUT", "/policies/{id}/locations/{locId}/coverages/{code}", "Chỉnh sửa Coverage; cập nhật tổng phí", "Authenticated", "Path: code, Body: CoverageDto"],
            ["DELETE", "/policies/{id}/locations/{locId}/coverages/{code}", "Xóa Coverage khỏi Location; giảm tổng phí", "Authenticated", "Path: code"]
        ],
        col_widths=[0.8, 2.4, 2.0, 1.0, 1.2]
    )

    # Nhóm Lifecycle & Endorsement
    add_heading_2(doc, "2.4 Nhóm API Vòng đời & Quản lý Phiên bản (/policies/{id}/...)")
    add_table_data(
        doc,
        headers=["Method", "Endpoint", "Mô tả Nghiệp vụ", "Quyền", "Tham số chính"],
        data_rows=[
            ["POST", "/policies/{id}/status-transitions", "Chuyển trạng thái vòng đời (State Transition: QUOTED, BOUND, ACTIVE...)", "Authenticated", "Body: { targetStatus, reason, paymentDueDate }"],
            ["POST", "/policies/{id}/endorsements", "Sửa đổi hợp đồng ACTIVE; sinh Version mới và Snapshot", "Authenticated", "Body: EndorsementRequest"],
            ["GET", "/policies/{id}/history", "Truy vấn lịch sử các giao dịch kiểm toán (Transactions)", "Authenticated", "Path: policyNumber"],
            ["GET", "/policies/{id}/versions", "Truy vấn danh sách các phiên bản Snapshot của hợp đồng", "Authenticated", "Path: policyNumber"],
            ["GET", "/policies/{id}/versions/{v}", "Xem nội dung snapshot một phiên bản cũ cụ thể", "Authenticated", "Path: version number"]
        ],
        col_widths=[0.8, 2.3, 2.1, 1.0, 1.2]
    )

    # Nhóm Excel & Benchmark & Reports
    add_heading_2(doc, "2.5 Nhóm API Excel, Báo cáo & Benchmark (/excel, /reports, /benchmark)")
    add_table_data(
        doc,
        headers=["Method", "Endpoint", "Mô tả Nghiệp vụ", "Quyền", "Tham số chính"],
        data_rows=[
            ["GET", "/excel/template", "Tải xuống file Excel template ma trận định mức biểu phí", "Admin", "Response: File .xlsx download"],
            ["POST", "/excel/import-rates", "Tải lên file Excel cập nhật lại toàn bộ bảng tỷ lệ phí cơ sở", "Admin", "Form: file (MultipartFile)"],
            ["POST", "/excel/calculate", "Tính thử phí bảo hiểm tức thời (cho máy tính phí Web)", "Public/Auth", "Body: List<CoverageCalcRequest>"],
            ["GET", "/excel/policy/{id}/download", "Xuất file Excel bảng kê chi tiết tính phí bảo hiểm của hợp đồng", "Authenticated", "Response: File .xlsx download"],
            ["GET", "/reports/policy-count-by-status", "Báo cáo thống kê số lượng hợp đồng theo từng trạng thái", "Admin", "Aggregation Pipeline"],
            ["GET", "/reports/total-premium-by-status", "Báo cáo tổng giá trị phí bảo hiểm theo từng trạng thái", "Admin", "Aggregation Pipeline"],
            ["GET", "/reports/top-premium-policies", "Báo cáo Top 5 hợp đồng bảo hiểm có phí cao nhất", "Admin", "Aggregation Pipeline"],
            ["GET", "/reports/premium-by-effective-month", "Báo cáo tổng phí bảo hiểm phân bổ theo từng tháng", "Admin", "Aggregation Pipeline"],
            ["POST", "/benchmark/generate-50k", "Sinh 50,000 bản ghi Policy ngẫu nhiên vào MongoDB", "Admin", "Async batch insert"],
            ["GET", "/benchmark/run", "Chạy kịch bản đo lường hiệu năng 3 truy vấn trước/sau đánh index", "Admin", "Metrics extraction"]
        ],
        col_widths=[0.8, 2.2, 2.2, 1.0, 1.2]
    )

    doc.save("d:/Insurance/docs/API_Specification_and_Integration_Guide.docx")
    doc.save("d:/Insurance/API_Specification_and_Integration_Guide.docx")
    print("API Specification Document created successfully!")

# =============================================================================
# 2. TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU (Database_Design_and_Data_Dictionary.docx)
# =============================================================================
def build_database_document():
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    add_styled_title(
        doc,
        title_text="TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU & TỪ ĐIỂN DỮ LIỆU\nDATABASE DESIGN & DATA DICTIONARY SPECIFICATION",
        subtitle_text="Mô Hình Tài Liệu BSON MongoDB, Thiết Kế Chỉ Mục & Toàn Vẹn Dữ Liệu - Insurance System",
        meta_info=[
            "Tên Dự án: Insurance Policy Management System",
            "Mã Tài liệu: DB-INSUR-2026-V2.1",
            "Loại Tài liệu: Database Architecture & Data Dictionary (.docx)",
            "Hệ Quản trị CSDL: MongoDB 6.0+ (NoSQL Document Store)",
            "Ngày ban hành: 07/10/2026"
        ]
    )

    add_heading_1(doc, "1. TỔNG QUAN KIẾN TRÚC CƠ SỞ DỮ LIỆU MONGODB")
    add_body_paragraph(doc, "Cơ sở dữ liệu của hệ thống mang tên `insurance_db`, được thiết kế theo mô hình Document-Oriented NoSQL của MongoDB:")
    add_bullet_item(doc, "Collection `policies`: Lưu trữ toàn bộ thông tin hợp đồng hiện hành, nhúng mảng địa điểm rủi ro `locations[]` và mảng quyền lợi `coverages[]`.")
    add_bullet_item(doc, "Collection `policy_versions`: Lưu trữ các bản Snapshot bất biến của hợp đồng trước mỗi đợt Endorsement.")
    add_bullet_item(doc, "Collection `policy_transactions`: Lưu trữ nhật ký kiểm toán giao dịch (Audit Log) theo thời gian thực.")
    add_bullet_item(doc, "Collection `users`: Lưu trữ thông tin tài khoản người dùng, email, họ tên và danh sách vai trò (roles).")

    add_heading_1(doc, "2. TỪ ĐIỂN DỮ LIỆU CHI TIẾT (DATA DICTIONARY)")

    add_heading_2(doc, "2.1 Bảng Từ điển Dữ liệu: Collection `policies`")
    add_table_data(
        doc,
        headers=["Tên Trường (Field)", "Kiểu Dữ liệu", "Bắt buộc", "Mô tả Ý nghĩa & Ràng buộc Nghiệp vụ"],
        data_rows=[
            ["_id", "ObjectId", "Có", "Khóa chính duy nhất do MongoDB tự động sinh."],
            ["policyNumber", "String", "Có", "Mã hợp đồng bảo hiểm duy nhất (Đánh Unique Index, ví dụ: POL-2026-8899)."],
            ["status", "String (Enum)", "Có", "Trạng thái hợp đồng: DRAFT, QUOTED, BOUND, ACTIVE, CANCELLED, EXPIRED."],
            ["version", "Integer", "Có", "Số hiệu phiên bản của hợp đồng (Mặc định = 1, tăng khi có Endorsement)."],
            ["insured.name", "String", "Có", "Họ và tên khách hàng hoặc tên tổ chức được bảo hiểm."],
            ["insured.email", "String", "Có", "Địa chỉ email liên hệ chính thức của chủ hợp đồng."],
            ["insured.phone", "String", "Không", "Số điện thoại liên hệ của chủ hợp đồng."],
            ["insured.address", "String", "Không", "Địa chỉ pháp lý của đối tượng được bảo hiểm."],
            ["locations", "Array[Object]", "Có", "Mảng danh sách các địa điểm rủi ro được bảo hiểm."],
            ["locations.locationId", "String", "Có", "Mã định danh địa điểm trong hợp đồng (ví dụ: LOC-01)."],
            ["locations.address", "String", "Có", "Địa chỉ thực tế của địa điểm được bảo hiểm."],
            ["locations.coverages", "Array[Object]", "Có", "Mảng các quyền lợi bảo hiểm gắn với địa điểm."],
            ["coverages.coverageCode", "String", "Có", "Mã quyền lợi (PROP_FIRE, GEN_LIAB, WORK_COMP...)."],
            ["coverages.coverageName", "String", "Có", "Tên diễn giải quyền lợi bảo hiểm."],
            ["coverages.limit", "Double", "Có", "Hạn mức trách nhiệm bồi thường tối đa (USD)."],
            ["coverages.deductible", "Double", "Có", "Mức miễn thường / khấu trừ khách hàng tự chịu (USD)."],
            ["coverages.premium", "Double", "Có", "Số tiền phí bảo hiểm của riêng quyền lợi này (USD)."],
            ["totalPremium", "Double", "Có", "Tổng phí bảo hiểm của toàn bộ hợp đồng (Tự động đồng bộ nguyên tử)."],
            ["boundDate", "ISODate", "Không", "Thời điểm chuyển sang trạng thái BOUND."],
            ["paymentDueDate", "ISODate", "Không", "Hạn chót thanh toán phí bảo hiểm (mặc định boundDate + 7 ngày)."],
            ["effectiveDate", "ISODate", "Không", "Ngày bắt đầu có hiệu lực bồi thường (sau khi thanh toán ACTIVE)."],
            ["expirationDate", "ISODate", "Không", "Ngày hết hạn hợp đồng bảo hiểm (mặc định effectiveDate + 365 ngày)."],
            ["@version", "Long", "Có", "Trường phiên bản phục vụ Khóa Lạc quan (Optimistic Locking)."],
            ["createdAt", "ISODate", "Có", "Thời điểm bản ghi được khởi tạo trong hệ thống."],
            ["updatedAt", "ISODate", "Có", "Thời điểm cập nhật bản ghi gần nhất."]
        ],
        col_widths=[1.5, 1.1, 0.7, 4.1]
    )

    add_heading_2(doc, "2.2 Chiến lược Đánh Chỉ mục (MongoDB Indexing Strategy)")
    add_bullet_item(doc, "`{ policyNumber: 1 }`: Unique Index, đảm bảo tính duy nhất và tăng tốc truy vấn chi tiết O(1).")
    add_bullet_item(doc, "`{ status: 1, effectiveDate: 1 }`: Compound Index, tối ưu hóa truy vấn danh sách hợp đồng ACTIVE và sắp xếp theo ngày hiệu lực.")
    add_bullet_item(doc, "`{ \"insured.email\": 1 }`: Single Field Index, tối ưu cho Cổng thông tin khách hàng (Customer Portal) khi lọc hợp đồng của một người dùng.")
    add_bullet_item(doc, "`{ \"policy_versions.policyNumber\": 1, version: 1 }`: Compound Index trên collection version.")
    add_bullet_item(doc, "`{ \"policy_transactions.policyNumber\": 1, timestamp: -1 }`: Compound Index hỗ trợ phân trang lịch sử giao dịch.")

    doc.save("d:/Insurance/docs/Database_Design_and_Data_Dictionary.docx")
    doc.save("d:/Insurance/Database_Design_and_Data_Dictionary.docx")
    print("Database Design Document created successfully!")

# =============================================================================
# 3. TÀI LIỆU HƯỚNG DẪN TRIỂN KHAI & VẬN HÀNH (System_Deployment_and_Operations_Guide.docx)
# =============================================================================
def build_deployment_document():
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    add_styled_title(
        doc,
        title_text="TÀI LIỆU HƯỚNG DẪN CÀI ĐẶT, TRIỂN KHAI & VẬN HÀNH\nSYSTEM DEPLOYMENT & OPERATIONS GUIDE",
        subtitle_text="Quy Trình Triển Khai Môi Trường, Cấu Hình Tham Số & Kịch Bản Vận Hành Hệ Thống Web",
        meta_info=[
            "Tên Dự án: Insurance Policy Management System",
            "Mã Tài liệu: OPS-INSUR-2026-V2.1",
            "Loại Tài liệu: Deployment & Operations Manual (.docx)",
            "Môi trường: Local Dev / Staging / Production",
            "Ngày ban hành: 07/10/2026"
        ]
    )

    add_heading_1(doc, "1. YÊU CẦU MÔI TRƯỜNG & HẠ TẦNG KỸ THUẬT")
    add_bullet_item(doc, "Hệ điều hành hỗ trợ: Windows 10/11, macOS (Apple Silicon / Intel), Ubuntu Linux 20.04/22.04 LTS.")
    add_bullet_item(doc, "Java Runtime: Java JDK 17 LTS (khuyến nghị Eclipse Temurin JDK 17 hoặc OpenJDK 17).")
    add_bullet_item(doc, "Node.js Environment: Node.js 18.x hoặc 20.x LTS, npm phiên bản 9.x+.")
    add_bullet_item(doc, "Hệ quản trị CSDL: MongoDB Community Server 6.0 hoặc MongoDB Atlas Cloud Cluster.")

    add_heading_1(doc, "2. BƯỚC KHỞI TẠO & CẤU HÌNH HỆ THỐNG")
    add_heading_2(doc, "2.1 Cấu hình Backend (`application.properties`)")
    add_callout(
        doc,
        "spring.data.mongodb.uri=mongodb://localhost:27017/insurance_db\n"
        "server.port=8080\n"
        "app.jwt.secret=9a3f8c7e2b1d4a6f8c0e2b4d6f8a1c3e5a7b9d1f3e5a7b9c1d3e5f7a9b1c3d5e\n"
        "app.jwt.expiration-ms=86400000\n"
        "app.admin.emails=dungphdse@gmail.com,admin@insurtech.vn\n"
        "spring.mail.host=smtp.gmail.com\n"
        "spring.mail.port=587\n"
        "spring.mail.username=your-email@gmail.com\n"
        "spring.mail.password=your-app-password\n"
        "spring.mail.properties.mail.smtp.auth=true\n"
        "spring.mail.properties.mail.smtp.starttls.enable=true",
        title="THIẾT LẬP THAM SỐ TRONG SRC/MAIN/RESOURCES/APPLICATION.PROPERTIES:",
        border_color=HEX_PRIMARY_BLUE
    )

    add_heading_2(doc, "2.2 Lệnh Khởi chạy Backend Spring Boot")
    add_bullet_item(doc, "Mở Terminal tại thư mục `d:/Insurance`:")
    add_bullet_item(doc, "Chạy lệnh Maven Wrapper: `./mvnw spring-boot:run` (hoặc `mvn spring-boot:run`).")
    add_bullet_item(doc, "Kiểm tra log: Đảm bảo dòng log 'Started InsuranceApplication in X.XXX seconds' xuất hiện. Backend sẵn sàng tại `http://localhost:8080`.")

    add_heading_2(doc, "2.3 Lệnh Khởi chạy Frontend React Vite")
    add_bullet_item(doc, "Mở Terminal tại thư mục `d:/Insurance/frontend`:")
    add_bullet_item(doc, "Cài đặt thư viện: `npm install` (chỉ thực hiện trong lần khởi tạo đầu tiên).")
    add_bullet_item(doc, "Khởi động Dev Server: `npm run dev`.")
    add_bullet_item(doc, "Truy cập trình duyệt: Mở địa chỉ `http://localhost:5173` để bắt đầu trải nghiệm.")

    add_heading_1(doc, "3. KỊCH BẢN KIỂM THỬ NGHIỆM THU HOẠT ĐỘNG (ACCEPTANCE WALKTHROUGH)")
    add_bullet_item(doc, "Bước 1 (Đăng nhập): Mở `http://localhost:5173/login`, bấm 'Khách hàng (User)' để nhận JWT Token vai trò ROLE_USER.")
    add_bullet_item(doc, "Bước 2 (Mua bảo hiểm): Vào mục 'Mua Bảo hiểm', nhập thông tin 4 bước, bấm 'Lưu bản nháp' (tạo DRAFT).")
    add_bullet_item(doc, "Bước 3 (Báo phí): Vào 'Cổng thông tin', mở hợp đồng vừa tạo, bấm 'Yêu cầu Báo phí' (chuyển sang QUOTED).")
    add_bullet_item(doc, "Bước 4 (Ràng buộc): Bấm 'Chấp thuận Báo giá (Bind)' -> Hệ thống ghi nhận `boundDate` và `paymentDueDate` (chuyển sang BOUND).")
    add_bullet_item(doc, "Bước 5 (Thanh toán): Bấm 'Thanh toán Phí' -> Popup mã QR ngân hàng mở ra -> Bấm 'Giả lập đã thanh toán' -> Chuyển sang ACTIVE, hiển thị thời hạn 365 ngày.")
    add_bullet_item(doc, "Bước 6 (Quản trị): Đăng xuất, chọn 'Quản trị viên (Admin)' -> Vào Dashboard kiểm tra biểu đồ Aggregation và tải template Excel.")

    doc.save("d:/Insurance/docs/System_Deployment_and_Operations_Guide.docx")
    doc.save("d:/Insurance/System_Deployment_and_Operations_Guide.docx")
    print("Deployment Document created successfully!")

if __name__ == "__main__":
    build_api_document()
    build_database_document()
    build_deployment_document()
