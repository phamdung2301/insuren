# -*- coding: utf-8 -*-
"""
Script sinh file tài liệu SRS chuẩn: SRS_Insurance_Policy_Management_System.docx
Đặc tả chi tiết các yêu cầu phần mềm của Hệ thống Quản lý Hợp đồng Bảo hiểm (InsurTech)
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from build_helpers import (
    add_styled_title, add_heading_1, add_heading_2, add_heading_3,
    add_body_paragraph, add_bullet_item, add_callout, add_table_data,
    COLOR_PRIMARY_DARK, COLOR_PRIMARY_BLUE, COLOR_TEXT_MAIN, COLOR_TEXT_MUTED,
    HEX_PRIMARY_BLUE, HEX_WARNING, HEX_CALLOUT_BG
)

def build_srs_document():
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
        title_text="TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)\nSOFTWARE REQUIREMENTS SPECIFICATION",
        subtitle_text="Hệ Thống Quản Lý Hợp Đồng Bảo Hiểm Doanh Nghiệp & Bán Lẻ Trực Tuyến (InsurTech Platform)",
        meta_info=[
            "Tên Dự án: Insurance Policy Management System",
            "Mã Tài liệu: SRS-INSUR-2026-V2.1",
            "Phiên bản: 2.1 (Full-Stack React Vite + Spring Boot 3 + MongoDB)",
            "Tiêu chuẩn áp dụng: IEEE Std 830-1998 / ISO/IEC/IEEE 29148",
            "Trạng thái: Đã Phê Duyệt Triển Khai (Approved for Implementation)",
            "Ngày ban hành: 07/10/2026"
        ]
    )

    # =========================================================================
    # MỤC 1: DẪN NHẬP & TỔNG QUAN DỰ ÁN
    # =========================================================================
    add_heading_1(doc, "1. DẪN NHẬP & TỔNG QUAN DỰ ÁN (INTRODUCTION & PROJECT SCOPE)")
    
    add_heading_2(doc, "1.1 Mục đích Tài liệu (Document Purpose)")
    add_body_paragraph(
        doc,
        "Tài liệu Đặc tả Yêu cầu Phần mềm (Software Requirements Specification - SRS) này mô tả toàn diện, chi tiết và có hệ thống toàn bộ các yêu cầu nghiệp vụ ngành bảo hiểm, yêu cầu chức năng, yêu cầu phi chức năng, kiến trúc kỹ thuật và cơ chế dữ liệu của Hệ thống Quản lý Hợp đồng Bảo hiểm (Insurance Policy Management System). Tài liệu đóng vai trò là căn cứ kỹ thuật và pháp lý chính thức cho đội ngũ Phát triển Phần mềm (Developers), Đảm bảo Chất lượng (QA/QC), Chuyên viên Thẩm định Nghiệp vụ (Underwriters) và Khách hàng nghiệm thu bàn giao hệ thống."
    )

    add_heading_2(doc, "1.2 Phạm vi Dự án (Project Scope)")
    add_body_paragraph(
        doc,
        "Hệ thống là một giải pháp chuyển đổi số toàn diện ngành InsurTech, kết hợp giữa mô hình Bán lẻ Trực tuyến (E-Commerce Insurance Portal) và Hệ thống Quản trị Hợp đồng Bảo hiểm Lõi (Core Policy Administration System):"
    )
    add_bullet_item(doc, "Cổng Thông tin Khách hàng (Customer Portal): Cung cấp trải nghiệm mua bảo hiểm tự phục vụ (Self-service E-Commerce) qua quy trình 4 bước trực quan, tự động tính phí tức thời, quản lý hồ sơ bảo hiểm cá nhân, tải chứng nhận điện tử và gửi yêu cầu điều chỉnh quyền lợi (Endorsement).", "Phân hệ Khách hàng: ")
    add_bullet_item(doc, "Cổng Quản trị & Nghiệp vụ Thẩm định (Admin & Underwriting Portal): Cung cấp công cụ quản lý toàn bộ vòng đời hợp đồng từ khởi tạo đến lưu trữ, quản lý ma trận biểu phí qua Excel, kích hoạt thanh toán tại quầy (Offline Activation), theo dõi biểu đồ thống kê thời gian thực (MongoDB Aggregation Pipeline) và kiểm thử hiệu năng chịu tải 50,000+ hợp đồng.", "Phân hệ Quản trị viên: ")

    add_heading_2(doc, "1.3 Thuật ngữ & Từ viết tắt Nghiệp vụ (Business Glossary)")
    add_table_data(
        doc,
        headers=["Thuật ngữ", "Tên tiếng Anh", "Định nghĩa & Ý nghĩa Nghiệp vụ Thực tế"],
        data_rows=[
            ["Policy", "Insurance Policy", "Hợp đồng bảo hiểm: Văn bản pháp lý ràng buộc quyền lợi và nghĩa vụ giữa Doanh nghiệp bảo hiểm và Khách hàng."],
            ["Insured", "The Insured Party", "Đối tượng được bảo hiểm: Cá nhân hoặc tổ chức được bảo hiểm về tính mạng, sức khỏe hoặc tài sản."],
            ["Location", "Insured Location", "Địa điểm rủi ro được bảo hiểm: Nhà xưởng, văn phòng, kho hàng được thẩm định rủi ro."],
            ["Coverage", "Insurance Coverage", "Quyền lợi/Hạng mục bảo hiểm cụ thể gắn với địa điểm (ví dụ: Cháy nổ, Trách nhiệm công cộng, Tai nạn lao động)."],
            ["Premium", "Insurance Premium", "Phí bảo hiểm: Số tiền khách hàng phải thanh toán để duy trì hiệu lực của hợp đồng bảo hiểm."],
            ["Deductible", "Policy Deductible", "Mức miễn bồi thường (Khấu trừ): Số tiền tổn thất mà khách hàng phải tự chịu trước khi công ty bảo hiểm chi trả."],
            ["Limit", "Coverage Limit", "Hạn mức trách nhiệm bồi thường tối đa của công ty bảo hiểm đối với một quyền lợi hoặc sự kiện bảo hiểm."],
            ["Underwriting", "Risk Underwriting", "Quy trình thẩm định và đánh giá rủi ro để quyết định chấp nhận bảo hiểm và xác định mức phí phù hợp."],
            ["Endorsement", "Policy Endorsement", "Sửa đổi bổ sung hợp đồng: Thao tác điều chỉnh quyền lợi, địa điểm khi hợp đồng đang ACTIVE, sinh ra Version mới."],
            ["Payment Due Date", "Payment Due Date", "Ngày tới hạn nộp phí: Hạn chót khách hàng phải thanh toán phí kể từ khi hợp đồng chuyển sang trạng thái BOUND."]
        ],
        col_widths=[1.2, 1.6, 4.0]
    )

    # =========================================================================
    # MỤC 2: QUYẾT ĐỊNH KIẾN TRÚC DỮ LIỆU & DOCUMENT MODELING (ADR)
    # =========================================================================
    add_heading_1(doc, "2. CÁC QUYẾT ĐỊNH KIẾN TRÚC DỮ LIỆU (ARCHITECTURE DECISION RECORDS - ADR)")
    add_body_paragraph(
        doc,
        "Để đáp ứng đồng thời yêu cầu đọc dữ liệu tốc độ cao (Read-heavy) và đảm bảo tính bất biến pháp lý của hợp đồng tài chính, hệ thống áp dụng các quyết định thiết kế mô hình dữ liệu MongoDB chuyên sâu:"
    )

    add_heading_2(doc, "2.1 ADR-01: Nhúng Thông tin Insured (Embedded vs Reference)")
    add_body_paragraph(
        doc,
        "Quyết định: Thông tin Insured (Tên, Email, Điện thoại, Địa chỉ) được nhúng trực tiếp (Embedded Document) vào bản ghi Policy tại thời điểm khởi tạo, thay vì chỉ lưu ID tham chiếu tới bảng User.",
        bold_prefix="Quyết định Kỹ thuật: "
    )
    add_body_paragraph(
        doc,
        "Lý do Nghiệp vụ Pháp lý: Trong ngành bảo hiểm, thông tin của chủ hợp đồng tại thời điểm ký kết mang tính giá trị pháp lý bất biến (Immutable Legal Snapshot). Nếu người dùng cập nhật địa chỉ cá nhân trong hồ sơ tài khoản ở tương lai, hợp đồng đã ký trong quá khứ tuyệt đối không được tự động thay đổi theo. Đồng thời, cấu trúc nhúng giúp truy vấn đọc chi tiết 1 hợp đồng không cần thực hiện toán tử $lookup (JOIN), tối ưu hóa thời gian phản hồi API.",
        bold_prefix="Giải trình Kiến trúc: "
    )

    add_heading_2(doc, "2.2 ADR-02: Mô hình Mảng Lồng 2 Cấp Location & Coverage (Nested Embedded Arrays)")
    add_body_paragraph(
        doc,
        "Quyết định: Mỗi Policy sở hữu một mảng `locations[]`, trong mỗi Location chứa một mảng con `coverages[]` đại diện cho các quyền lợi bảo hiểm tại địa điểm đó.",
        bold_prefix="Quyết định Kỹ thuật: "
    )
    add_body_paragraph(
        doc,
        "Cơ chế Cập nhật Nguyên tử (Atomic Positional Update): Để ngăn chặn rủi ro tranh chấp ghi đè dữ liệu (Concurrency Lost Update), hệ thống không thực hiện đọc toàn bộ Document lên bộ nhớ rồi ghi đè lại, mà sử dụng trực tiếp các toán tử định vị nguyên tử của MongoDB ($push, $pull, $[<identifier>]) để thao tác chính xác vào phần tử mảng cần chỉnh sửa.",
        bold_prefix="Giải trình Kiến trúc: "
    )

    add_heading_2(doc, "2.3 ADR-03: Phân tách Collection Lịch sử Phiên bản (Version Snapshots Collection)")
    add_body_paragraph(
        doc,
        "Quyết định: Khi thực hiện nghiệp vụ Endorsement (sửa đổi hợp đồng đang có hiệu lực), hệ thống tăng số phiên bản (version = version + 1), tạo một bản chụp toàn vẹn (Snapshot) lưu vào collection riêng biệt `policy_versions` và ghi log kiểm toán vào `policy_transactions`.",
        bold_prefix="Quyết định Kỹ thuật: "
    )
    add_body_paragraph(
        doc,
        "Lý do: Phòng tránh triệt để nguy cơ vượt ngưỡng kích thước tối đa 16MB của Document trong MongoDB (BSON Document Size Limit) khi một hợp đồng doanh nghiệp lớn trải qua hàng chục lần sửa đổi bổ sung trong suốt kỳ bảo hiểm. Document chính trong `policies` luôn giữ trạng thái tinh gọn cho truy vấn danh sách.",
        bold_prefix="Giải trình Kiến trúc: "
    )

    # =========================================================================
    # MỤC 3: QUY TRÌNH NGHIỆP VỤ BẢO HIỂM & VÒNG ĐỜI HỢP ĐỒNG CHUẨN
    # =========================================================================
    add_heading_1(doc, "3. VÒNG ĐỜI HỢP ĐỒNG BẢO HIỂM & MÁY TRẠNG THÁI (POLICY LIFECYCLE & STATE MACHINE)")
    add_body_paragraph(
        doc,
        "Vòng đời của một hợp đồng bảo hiểm trong hệ thống tuân thủ chặt chẽ quy trình thực tế của các tập đoàn bảo hiểm quốc tế, được hiện thực hóa qua Máy trạng thái hữu hạn (Finite State Machine):"
    )

    add_callout(
        doc,
        "Sơ đồ chuyển dịch trạng thái hợp lệ:\n"
        "1. [*] → DRAFT (Khách hàng nhập đơn, lưu nháp hoặc chuẩn bị gửi duyệt)\n"
        "2. DRAFT → QUOTED (Gửi yêu cầu báo phí, hệ thống/chuyên viên định phí)\n"
        "3. QUOTED → BOUND (Khách hàng chấp thuận báo phí, thiết lập thời hạn thanh toán)\n"
        "4. BOUND → ACTIVE (Thanh toán thành công hoặc Admin kích hoạt trực tiếp tại quầy)\n"
        "5. ACTIVE → CANCELLED (Hủy hợp đồng do yêu cầu bồi hoàn hoặc vi phạm điều khoản)\n"
        "6. ACTIVE → EXPIRED (Hết thời hạn bảo hiểm 1 năm)\n"
        "Lưu ý: Mọi yêu cầu chuyển dịch trái quy tắc (như DRAFT → ACTIVE) đều bị hệ thống chặn ở mức Service và ném mã lỗi HTTP 400 Bad Request.",
        title="MÁY TRẠNG THÁI HỢP ĐỒNG (POLICY STATE MACHINE ENGINE):",
        border_color=HEX_PRIMARY_BLUE
    )

    add_heading_2(doc, "3.1 Phân tích Chi tiết Từng Trạng thái & Điều kiện Chuyển đổi")

    add_heading_3(doc, "Trạng thái 1: DRAFT (Bản Nháp)")
    add_bullet_item(doc, "Ý nghĩa: Khách hàng đang tự khai báo thông tin đối tượng bảo hiểm, địa điểm rủi ro và các gói quyền lợi mong muốn trên giao diện mua hàng trực tuyến.", "Mô tả: ")
    add_bullet_item(doc, "Mục đích: Cho phép người dùng lưu lại tiến độ khi chưa hoàn thành hoặc chưa có đủ hồ sơ mà không làm gián đoạn trải nghiệm.", "Giá trị nghiệp vụ: ")
    add_bullet_item(doc, "Hành động kích hoạt: Khách hàng bấm 'Lưu bản nháp' (Save as Draft) tại bước cuối của quy trình mua bảo hiểm.", "Thao tác người dùng: ")

    add_heading_3(doc, "Trạng thái 2: QUOTED (Đã Báo Phí / Chờ Phê Duyệt)")
    add_bullet_item(doc, "Ý nghĩa: Hệ thống đã hoàn tất tính toán tổng phí bảo hiểm sơ bộ dựa trên định mức rủi ro của từng Coverage và xuất ra Bảng chào phí chính thức.", "Mô tả: ")
    add_bullet_item(doc, "Điều kiện chuyển từ DRAFT: Đơn bảo hiểm phải có ít nhất 1 Location hợp lệ và mỗi Location phải có ít nhất 1 Coverage với hạn mức và mức khấu trừ hợp chuẩn.", "Ràng buộc dữ liệu: ")
    add_bullet_item(doc, "Người thực hiện: Khách hàng nộp đơn xin báo giá, hoặc Chuyên viên thẩm định (Underwriter) xuất báo phí.", "Vai trò tác động: ")

    add_heading_3(doc, "Trạng thái 3: BOUND (Ràng Buộc Trách Nhiệm / Chờ Thu Phí)")
    add_bullet_item(doc, "Ý nghĩa: Khách hàng và Công ty bảo hiểm đã chính thức thỏa thuận mức phí và điều khoản. Công ty bảo hiểm cam kết giữ nguyên mức phí và quyền lợi bảo hiểm trong một khoảng thời gian chờ thanh toán.", "Mô tả: ")
    add_bullet_item(doc, "Thiết lập Ngày Tới hạn Nộp phí (Payment Due Date): Khi chuyển sang BOUND, hệ thống tự động ghi nhận thời điểm cam kết `boundDate` và thiết lập `paymentDueDate` (mặc định là 7 ngày sau, hoặc ngày do khách hàng đề xuất/quản trị viên phê duyệt).", "Ràng buộc thời gian: ")
    add_bullet_item(doc, "Nguyên tắc Hủy do Quá hạn: Nếu đến ngày `paymentDueDate` mà hợp đồng chưa được thanh toán để chuyển sang ACTIVE, hợp đồng sẽ bị hủy hiệu lực giữ chỗ và chuyển về CANCELLED hoặc DRAFT.", "Quy tắc rủi ro: ")

    add_heading_3(doc, "Trạng thái 4: ACTIVE (Đang Có Hiệu Lực)")
    add_bullet_item(doc, "Ý nghĩa: Hợp đồng đã thu đủ phí bảo hiểm và chính thức phát sinh hiệu lực bồi thường theo pháp luật.", "Mô tả: ")
    add_bullet_item(doc, "Ghi nhận Thời hạn Bảo hiểm: Hệ thống tự động thiết lập ngày bắt đầu hiệu lực `effectiveDate` (mặc định là thời điểm thanh toán thành công) và ngày đáo hạn `expirationDate` (+365 ngày).", "Thiết lập ngày tháng: ")
    add_bullet_item(doc, "Kênh kích hoạt 1 - Khách hàng Trực tuyến: Khách hàng mở mã QR / số tài khoản ngân hàng trên giao diện, bấm nút 'Giả lập đã thanh toán', hệ thống kiểm tra và chuyển trạng thái hợp đồng sang ACTIVE.", "Cơ chế kích hoạt trực tuyến: ")
    add_bullet_item(doc, "Kênh kích hoạt 2 - Quản trị viên Tại quầy (Offline Activation): Chuyên viên Admin/Kế toán tìm kiếm hợp đồng BOUND trên Dashboard và bấm nút 'Kích hoạt trực tiếp' ngay sau khi nhận tiền mặt hoặc sao kê ngân hàng thành công.", "Cơ chế kích hoạt tại quầy: ")

    add_heading_3(doc, "Trạng thái 5 & 6: CANCELLED (Đã Hủy) & EXPIRED (Đã Hết Hạn)")
    add_bullet_item(doc, "CANCELLED: Áp dụng khi hợp đồng ở trạng thái BOUND quá hạn nộp phí mà không thanh toán, hoặc hợp đồng ACTIVE có yêu cầu chấm dứt trước thời hạn.", "Hủy hợp đồng: ")
    add_bullet_item(doc, "EXPIRED: Hợp đồng đã qua ngày `expirationDate` mà không thực hiện tái tục.", "Hết hạn hợp đồng: ")

    # =========================================================================
    # MỤC 4: YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)
    # =========================================================================
    add_heading_1(doc, "4. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)")

    add_heading_2(doc, "4.1 Quản lý Xác thực & Phân quyền Tài khoản (Authentication & RBAC)")
    add_bullet_item(doc, "FR-AUTH-01: Cho phép người dùng nhập địa chỉ Gmail để yêu cầu mã OTP 6 số ngẫu nhiên phục vụ đăng nhập bảo mật không mật khẩu.", "Đăng nhập OTP Gmail: ")
    add_bullet_item(doc, "FR-AUTH-02: Xác thực mã OTP gửi về hòm thư; nếu hợp lệ, hệ thống phát hành JWT Token với thời hạn 24 giờ chứa thông tin email, họ tên và vai trò (Role).", "Phát hành JWT Token: ")
    add_bullet_item(doc, "FR-AUTH-03: Tự động phân quyền: Người dùng có email trong danh sách cấu hình `app.admin.emails` được gán quyền ROLE_ADMIN, các email khác tự động nhận quyền ROLE_USER.", "Phân quyền theo Email: ")
    add_bullet_item(doc, "FR-AUTH-04: Cung cấp chế độ Dev Login cho phép nhà phát triển và kiểm thử viên chuyển đổi nhanh chóng giữa vai trò Khách hàng (User) và Quản trị viên (Admin).", "Cơ chế Dev Switch Role: ")

    add_heading_2(doc, "4.2 Cổng Thông tin Khách hàng & Quy trình Mua Bảo hiểm Trực tuyến")
    add_bullet_item(doc, "FR-CUST-01: Màn hình Cổng thông tin (Customer Portal) hiển thị danh sách tất cả hợp đồng của người dùng đăng nhập, hỗ trợ bộ lọc nhanh theo trạng thái (DRAFT, QUOTED, BOUND, ACTIVE...).", "Quản lý Hợp đồng Cá nhân: ")
    add_bullet_item(doc, "FR-CUST-02: Quy trình mua bảo hiểm trực tuyến (E-Commerce Buy Insurance Wizard) gồm 4 bước trực quan: (1) Chọn dòng sản phẩm, (2) Khai báo Địa điểm & Đối tượng bảo hiểm, (3) Cấu hình Quyền lợi & Tính phí, (4) Tóm tắt đơn & Quyết định gửi đơn.", "Luồng Mua Bảo hiểm 4 Bước: ")
    add_bullet_item(doc, "FR-CUST-03: Cho phép người dùng lựa chọn 'Lưu bản nháp' (tạo Policy trạng thái DRAFT) hoặc 'Nộp đơn yêu cầu báo phí' (tạo Policy chuyển sang QUOTED).", "Tùy chọn Lưu nháp / Nộp đơn: ")

    add_heading_2(doc, "4.3 Quản lý Hợp đồng Cốt lõi & Thao tác Đa cấp độ (Core Policy Operations)")
    add_bullet_item(doc, "FR-POL-01: Quản lý CRUD cơ bản hợp đồng bảo hiểm (Tạo mới, Tìm kiếm nâng cao, Xem chi tiết, Cập nhật thông tin chung, Xóa mềm/Xóa cứng).", "CRUD Hợp đồng: ")
    add_bullet_item(doc, "FR-POL-02: Thêm, sửa, xóa Location trong danh sách `locations[]` của hợp đồng bảo hiểm.", "Quản lý Địa điểm: ")
    add_bullet_item(doc, "FR-POL-03: Thêm, sửa, xóa Coverage trong một Location cụ thể; tự động kích hoạt tính toán lại tổng phí hợp đồng `totalPremium` theo cơ chế nguyên tử.", "Quản lý Quyền lợi: ")
    add_bullet_item(doc, "FR-POL-04: Tìm kiếm và phân trang nâng cao: Lọc đồng thời theo số hợp đồng, trạng thái, tên khách hàng, khoảng ngày hiệu lực và khoảng mức phí.", "Bộ lọc Phức hợp: ")

    add_heading_2(doc, "4.4 Động cơ Chuyển dịch Trạng thái & Giả lập Thanh toán")
    add_bullet_item(doc, "FR-LIFE-01: Thực thi kiểm tra tính hợp lệ trước khi chuyển đổi trạng thái bằng phương thức `canTransitionTo()` trong Enum PolicyStatus.", "Thực thi State Machine: ")
    add_bullet_item(doc, "FR-LIFE-02: Khi chuyển trạng thái từ QUOTED sang BOUND, cho phép người dùng hoặc Admin chỉ định ngày tới hạn thanh toán `paymentDueDate` (mặc định 7 ngày).", "Thiết lập Payment Due Date: ")
    add_bullet_item(doc, "FR-PAY-01: Cung cấp hộp thoại (Modal) thanh toán hợp đồng cho Khách hàng: Hiển thị số tiền phí cần thanh toán, thông tin tài khoản thụ hưởng, mã chuyển khoản và mã QR thanh toán trực quan.", "Giao diện Hướng dẫn Thanh toán: ")
    add_bullet_item(doc, "FR-PAY-02: Nút giả lập 'Xác nhận đã thanh toán' cho khách hàng: Gửi yêu cầu chuyển trạng thái hợp đồng từ BOUND sang ACTIVE và ghi nhận ngày hiệu lực.", "Kích hoạt Thanh toán Khách hàng: ")
    add_bullet_item(doc, "FR-PAY-03: Nút 'Kích hoạt trực tiếp (Offline Activation)' cho Admin: Cho phép quản trị viên kích hoạt ngay lập tức hợp đồng BOUND sang ACTIVE khi xác nhận nhận tiền ngoài đời thực.", "Kích hoạt Trực tiếp Admin: ")

    add_heading_2(doc, "4.5 Động cơ Điều chỉnh Hợp đồng & Quản lý Phiên bản (Endorsement Engine)")
    add_bullet_item(doc, "FR-END-01: Cho phép gửi yêu cầu Endorsement đối với hợp đồng đang ở trạng thái ACTIVE (thêm địa điểm mới, nâng hạn mức bồi thường, điều chỉnh mức khấu trừ).", "Gửi yêu cầu Endorsement: ")
    add_bullet_item(doc, "FR-END-02: Tự động sao lưu nguyên trạng hợp đồng hiện tại vào bộ sưu tập `policy_versions` làm Snapshot bất biến trước khi áp dụng thay đổi.", "Tạo Version Snapshot: ")
    add_bullet_item(doc, "FR-END-03: Tăng chỉ số phiên bản của hợp đồng (version = version + 1) và ghi vết giao dịch đầy đủ (Actor, Timestamp, TransactionType, Description) vào `policy_transactions`.", "Ghi vết Giao dịch: ")
    add_bullet_item(doc, "FR-END-04: Giao diện so sánh lịch sử (Version History Diff): Cho phép người dùng và Admin chọn 2 phiên bản bất kỳ để xem trực quan các quyền lợi nào đã được thêm mới, sửa đổi hoặc loại bỏ.", "So sánh Phiên bản Trực quan: ")

    add_heading_2(doc, "4.6 Động cơ Định mức Phí & Tích hợp File Excel (Pricing & Excel Engine)")
    add_bullet_item(doc, "FR-CALC-01: Công thức tính phí chuẩn: Phí quyền lợi được tính dựa trên Mã quyền lợi, Hạn mức, Mức khấu trừ, Thời hạn bảo hiểm và Tỷ lệ phí cơ sở (Base Rate).", "Công thức Định phí Chuẩn: ")
    add_bullet_item(doc, "FR-CALC-02: Tải xuống file Excel bảng định mức phí mẫu (`InsurancePricingMatrix_{Date}.xlsx`) có cài sẵn công thức và danh mục tỷ lệ phí hiện hành.", "Xuất Excel Biểu phí: ")
    add_bullet_item(doc, "FR-CALC-03: Tải lên file Excel để cập nhật đồng loạt bảng tỷ lệ phí cơ sở (Base Rates) trong bộ nhớ hệ thống mà không cần biên dịch lại mã nguồn.", "Nhập Excel Cập nhật Biểu phí: ")
    add_bullet_item(doc, "FR-CALC-04: Xuất bảng kê chi tiết tính phí bảo hiểm của từng hợp đồng ra định dạng file Excel chuyên nghiệp (`PremiumCalc_{PolicyNumber}.xlsx`) có đầy đủ chữ ký số và con dấu số hóa.", "Xuất Bảng kê Phí Hợp đồng: ")
    add_bullet_item(doc, "FR-CALC-05: API tính phí nhanh `/excel/calculate`: Hỗ trợ giao diện Web tính thử phí ngay lập tức mà không cần tạo trước bản ghi hợp đồng trong cơ sở dữ liệu.", "Tính phí Thử nghiệm Real-time: ")

    add_heading_2(doc, "4.7 Báo cáo Thống kê Chuyên sâu (MongoDB Aggregation Reports)")
    add_bullet_item(doc, "FR-REP-01: Báo cáo Số lượng Hợp đồng theo Trạng thái (Nhóm theo status, đếm tổng số lượng bản ghi).", "Báo cáo 1: Số lượng theo Status")
    add_bullet_item(doc, "FR-REP-02: Báo cáo Doanh số Phí Bảo hiểm theo Trạng thái (Tổng giá trị totalPremium theo từng trạng thái).", "Báo cáo 2: Doanh số theo Status")
    add_bullet_item(doc, "FR-REP-03: Báo cáo Top 5 Hợp đồng Bảo hiểm có Doanh số Cao nhất.", "Báo cáo 3: Top 5 Hợp đồng Lớn")
    add_bullet_item(doc, "FR-REP-04: Báo cáo Tổng phí Bảo hiểm phân bổ theo Tháng Hiệu lực (Sử dụng toán tử `$month` trên trường `effectiveDate`).", "Báo cáo 4: Doanh thu theo Tháng")

    add_heading_2(doc, "4.8 Thử nghiệm Hiệu năng 50,000 Bản ghi & Đánh Chỉ mục (Benchmark & Indexing)")
    add_bullet_item(doc, "FR-BENCH-01: Cho phép kích hoạt tác vụ chạy ngầm sinh tự động 50,000 bản ghi Policy ngẫu nhiên chuẩn cấu trúc MongoDB.", "Sinh 50,000 Hợp đồng Giả lập: ")
    add_bullet_item(doc, "FR-BENCH-02: Thực thi kiểm thử so sánh hiệu năng của 3 câu truy vấn trọng yếu trước và sau khi đánh chỉ mục Compound Index.", "Thực thi Benchmark So sánh: ")
    add_bullet_item(doc, "FR-BENCH-03: Trích xuất và lập bảng phân tích các chỉ số vận hành chi tiết của MongoDB: `winningPlan`, `totalDocsExamined`, `totalKeysExamined`, `nReturned`, `executionTimeMillis`.", "Báo cáo Chỉ số Execution Plan: ")

    # =========================================================================
    # MỤC 5: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)
    # =========================================================================
    add_heading_1(doc, "5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)")
    add_table_data(
        doc,
        headers=["Mã NFR", "Hạng mục Yêu cầu", "Tiêu chuẩn Kỹ thuật & Biện pháp Đảm bảo"],
        data_rows=[
            ["NFR-PERF-01", "Thời gian phản hồi API", "95% các yêu cầu truy vấn thông thường phải phản hồi trong thời gian dưới 100ms. Đối với truy vấn tìm kiếm trên tập dữ liệu 50,000 hợp đồng có Index, thời gian phản hồi tối đa không vượt quá 200ms."],
            ["NFR-CONC-01", "Chống Ghi đè Đồng thời (Lost Updates)", "Áp dụng cơ chế Khóa Lạc quan (Optimistic Locking) thông qua trường `@Version` trong Spring Data MongoDB và các toán tử cập nhật định vị nguyên tử ($push, $pull). Đảm bảo không xảy ra hiện tượng mất dữ liệu khi 2 quản trị viên cùng thao tác."],
            ["NFR-SECU-01", "Bảo mật Xác thực & Dữ liệu", "Mật khẩu người dùng được băm bằng thuật toán BCrypt với độ mạnh salt = 10. Mã OTP có thời hạn hiệu lực chính xác 300 giây (5 phút). Access Token JWT được ký bằng khóa bí mật HMAC-SHA256."],
            ["NFR-SECU-02", "Kiểm soát Truy cập Phân quyền (RBAC)", "Toàn bộ các API quản trị (`/policies`, `/excel/import-rates`, `/benchmark`) được bảo vệ nghiêm ngặt bằng Spring Security PreAuthorize; chặn tuyệt đối hành vi người dùng thường gọi API quản trị."],
            ["NFR-DATA-01", "Tính Toàn vẹn Dữ liệu Tài chính", "Phí bảo hiểm được làm tròn chuẩn 2 chữ số thập phân (USD). Bản ghi Snapshot trong `policy_versions` được thiết lập quyền chỉ đọc (Read-only), ngăn chặn hành vi sửa đổi lịch sử hợp đồng."],
            ["NFR-USAB-01", "Trải nghiệm Người dùng (UX/UI)", "Giao diện xây dựng theo chuẩn hiện đại InsurTech: Hỗ trợ thanh tiến trình vòng đời trực quan (Stepper), cảnh báo tương tác tức thời (Toast notifications), modal thanh toán QR thân thiện trên thiết bị di động."]
        ],
        col_widths=[1.1, 1.8, 3.9]
    )

    # =========================================================================
    # MỤC 6: BẢNG ĐẶC TẢ BỀ MẶT RESTful API (API SPECIFICATIONS)
    # =========================================================================
    add_heading_1(doc, "6. ĐẶC TẢ BỀ MẶT RESTful API (API SURFACE SPECIFICATIONS)")
    add_body_paragraph(
        doc,
        "Dưới đây là danh mục toàn bộ các Endpoint RESTful API của hệ thống Backend Spring Boot 3:"
    )

    add_table_data(
        doc,
        headers=["Method", "Đường dẫn Endpoint", "Mô tả Chức năng Nghiệp vụ", "Quyền Hạn"],
        data_rows=[
            ["POST", "/auth/login", "Đăng nhập tài khoản bằng Email/OTP hoặc Dev Login; trả về JWT", "Public"],
            ["GET", "/auth/me", "Lấy thông tin tài khoản và danh sách quyền từ Access Token", "Authenticated"],
            ["POST", "/policies", "Tạo mới một hợp đồng bảo hiểm (Hỗ trợ DRAFT hoặc QUOTED)", "Authenticated"],
            ["GET", "/policies", "Tìm kiếm, lọc nâng cao theo trạng thái/tên/ngày và phân trang hợp đồng", "Authenticated"],
            ["GET", "/policies/{policyNumber}", "Xem chi tiết đầy đủ một hợp đồng bảo hiểm", "Authenticated"],
            ["PUT", "/policies/{policyNumber}", "Cập nhật thông tin chung của hợp đồng bảo hiểm", "Admin / Staff"],
            ["DELETE", "/policies/{policyNumber}", "Xóa hợp đồng bảo hiểm khỏi hệ thống", "Admin"],
            ["POST", "/policies/{policyNumber}/locations", "Thêm một địa điểm rủi ro (Location) vào hợp đồng", "Authenticated"],
            ["PUT", "/policies/{policyNumber}/locations/{locId}", "Cập nhật thông tin địa chỉ của một Location", "Authenticated"],
            ["DELETE", "/policies/{policyNumber}/locations/{locId}", "Xóa Location và toàn bộ Coverages trực thuộc", "Authenticated"],
            ["POST", "/policies/{policyNumber}/locations/{locId}/coverages", "Thêm quyền lợi bảo hiểm (Coverage) vào Location; tự động tính lại tổng phí", "Authenticated"],
            ["PUT", "/policies/{policyNumber}/locations/{locId}/coverages/{code}", "Cập nhật hạn mức, mức khấu trừ và phí của Coverage", "Authenticated"],
            ["DELETE", "/policies/{policyNumber}/locations/{locId}/coverages/{code}", "Xóa quyền lợi bảo hiểm khỏi Location; tự động giảm tổng phí", "Authenticated"],
            ["POST", "/policies/{policyNumber}/status-transitions", "Thực hiện chuyển đổi trạng thái vòng đời (State Transition)", "Authenticated"],
            ["POST", "/policies/{policyNumber}/endorsements", "Yêu cầu sửa đổi hợp đồng ACTIVE; sinh Version mới và Snapshot", "Authenticated"],
            ["GET", "/policies/{policyNumber}/history", "Truy vấn danh sách lịch sử các giao dịch kiểm toán (Transactions)", "Authenticated"],
            ["GET", "/policies/{policyNumber}/versions", "Truy vấn danh sách các phiên bản Snapshot của hợp đồng", "Authenticated"],
            ["GET", "/policies/{policyNumber}/versions/{v}", "Xem nội dung chi tiết snapshot một phiên bản cũ cụ thể", "Authenticated"],
            ["GET", "/excel/template", "Tải xuống file Excel bảng định mức biểu phí bảo hiểm", "Admin"],
            ["POST", "/excel/import-rates", "Tải lên file Excel cập nhật lại toàn bộ bảng tỷ lệ phí cơ sở", "Admin"],
            ["POST", "/excel/calculate", "Tính phí bảo hiểm tức thời (cho máy tính phí trên Web)", "Public / Auth"],
            ["GET", "/excel/policy/{policyNumber}/download", "Xuất file Excel bảng kê chi tiết tính phí bảo hiểm của hợp đồng", "Authenticated"],
            ["GET", "/reports/policy-count-by-status", "Báo cáo thống kê số lượng hợp đồng theo từng trạng thái", "Admin / Manager"],
            ["GET", "/reports/total-premium-by-status", "Báo cáo tổng giá trị phí bảo hiểm theo từng trạng thái", "Admin / Manager"],
            ["GET", "/reports/top-premium-policies", "Báo cáo Top 5 hợp đồng bảo hiểm có doanh số phí lớn nhất", "Admin / Manager"],
            ["GET", "/reports/premium-by-effective-month", "Báo cáo doanh số phí bảo hiểm phân bổ theo từng tháng", "Admin / Manager"],
            ["POST", "/benchmark/generate-50k", "Kích hoạt tác vụ sinh 50,000 bản ghi Policy ngẫu nhiên vào MongoDB", "Admin"],
            ["GET", "/benchmark/run", "Chạy kịch bản đo lường hiệu năng 3 câu truy vấn và lập báo cáo", "Admin"]
        ],
        col_widths=[0.8, 2.7, 2.4, 0.9]
    )

    # =========================================================================
    # MỤC 7: CƠ SỞ DỮ LIỆU & SCHEMAS (MONGODB SCHEMAS)
    # =========================================================================
    add_heading_1(doc, "7. THIẾT KẾ CƠ SỞ DỮ LIỆU (MONGODB DATA MODEL SPECIFICATIONS)")

    add_heading_2(doc, "7.1 Cấu trúc Document Hợp đồng Chính (`policies` Collection)")
    add_body_paragraph(
        doc,
        "Dưới đây là mẫu tài liệu BSON chuẩn biểu diễn một bản ghi hợp đồng bảo hiểm trong MongoDB:"
    )
    add_callout(
        doc,
        "{\n"
        '  "_id": "ObjectId(\'651a2b3c4d5e6f7a8b9c0d1e\')",\n'
        '  "policyNumber": "POL-2026-8899",\n'
        '  "status": "BOUND",\n'
        '  "version": 1,\n'
        '  "insured": {\n'
        '    "name": "Công ty TNHH Giải Pháp Công Nghệ Alpha",\n'
        '    "email": "contact@alpha-tech.vn",\n'
        '    "phone": "0901234567",\n'
        '    "address": "Tầng 5, Tòa nhà Bitexco, Quận 1, TP.HCM"\n'
        '  },\n'
        '  "locations": [\n'
        '    {\n'
        '      "locationId": "LOC-01",\n'
        '      "address": "Kho hàng Tân Bình, TP.HCM",\n'
        '      "coverages": [\n'
        '        {\n'
        '          "coverageCode": "PROP_FIRE",\n'
        '          "coverageName": "Bảo hiểm Cháy nổ Nhà xưởng",\n'
        '          "coverageType": "PROPERTY",\n'
        '          "limit": 5000000.0,\n'
        '          "deductible": 10000.0,\n'
        '          "termMonths": 12,\n'
        '          "premium": 3500.0\n'
        '        }\n'
        '      ]\n'
        '    }\n'
        '  ],\n'
        '  "totalPremium": 3500.0,\n'
        '  "boundDate": "2026-10-07T10:00:00Z",\n'
        '  "paymentDueDate": "2026-10-14T23:59:59Z",\n'
        '  "effectiveDate": null,\n'
        '  "expirationDate": null,\n'
        '  "@version": 1,\n'
        '  "createdAt": "2026-10-07T09:30:00Z",\n'
        '  "updatedAt": "2026-10-07T10:00:00Z"\n'
        "}",
        title="MẪU JSON DOCUMENT BỘ SƯU TẬP POLICIES:",
        border_color=HEX_PRIMARY_BLUE
    )

    add_heading_2(doc, "7.2 Cấu trúc Snapshot Phiên bản (`policy_versions` Collection)")
    add_bullet_item(doc, "`policyNumber`: Mã hợp đồng liên kết (Khóa ngoại logic).")
    add_bullet_item(doc, "`version`: Số hiệu phiên bản tại thời điểm sao lưu (1, 2, 3...).")
    add_bullet_item(doc, "`snapshot`: Chứa toàn bộ nội dung của đối tượng Policy đầy đủ trước khi diễn ra đợt Endorsement.")
    add_bullet_item(doc, "`createdAt`: Thời điểm tạo bản snapshot.")

    add_heading_2(doc, "7.3 Cấu trúc Sổ Nhật ký Giao dịch (`policy_transactions` Collection)")
    add_bullet_item(doc, "`policyNumber`: Mã hợp đồng xảy ra giao dịch.")
    add_bullet_item(doc, "`version`: Phiên bản hợp đồng tương ứng.")
    add_bullet_item(doc, "`transactionType`: Loại hình giao dịch (CREATE_POLICY, UPDATE_POLICY, STATUS_TRANSITION, ENDORSEMENT, CANCEL_POLICY...).")
    add_bullet_item(doc, "`actor`: Người thực hiện hành động (Email người dùng hoặc 'System').")
    add_bullet_item(doc, "`description`: Diễn giải chi tiết nội dung thay đổi hoặc lý do chuyển dịch trạng thái.")
    add_bullet_item(doc, "`timestamp`: Thời điểm ghi nhận giao dịch.")

    # =========================================================================
    # MỤC 8: TIÊU CHUẨN KIỂM THỬ VÀ NGHIỆM THU (ACCEPTANCE CRITERIA)
    # =========================================================================
    add_heading_1(doc, "8. TIÊU CHUẨN NGHIỆM THU HỆ THỐNG (SYSTEM ACCEPTANCE CRITERIA)")
    add_table_data(
        doc,
        headers=["Mã AC", "Nội dung Kiểm thử Nghiệm thu", "Kết quả Mong đợi Bắt buộc"],
        data_rows=[
            ["AC-01", "Kiểm thử State Machine Chuyển trạng thái", "100% các chuyển dịch hợp lệ (DRAFT->QUOTED->BOUND->ACTIVE) thực hiện thành công. 100% các chuyển dịch vi phạm quy tắc bị từ chối với HTTP 400."],
            ["AC-02", "Kiểm thử Thiết lập Hạn nộp phí khi BOUND", "Khi hợp đồng chuyển sang BOUND, trường `boundDate` và `paymentDueDate` được tự động ghi nhận chính xác theo thời gian thực."],
            ["AC-03", "Kiểm thử Kích hoạt Thanh toán 2 Kênh", "Khách hàng bấm giả lập thanh toán -> Hợp đồng chuyển sang ACTIVE và tự động sinh ngày hiệu lực 365 ngày. Admin kích hoạt offline tại quầy -> Chuyển sang ACTIVE ngay lập tức."],
            ["AC-04", "Kiểm thử Endorsement & Snapshot", "Khi hợp đồng ACTIVE được Endorsement, chỉ số version tăng thêm 1; bản snapshot của phiên bản cũ được lưu toàn vẹn vào `policy_versions`."],
            ["AC-05", "Kiểm thử Tích hợp Excel Biểu phí", "Tải xuống template Excel hợp chuẩn. Tải lên file Excel cập nhật thành công bảng base rates. Xuất file kê tính phí hợp đồng đầy đủ định dạng."],
            ["AC-06", "Kiểm thử Báo cáo Aggregation Pipeline", "4 báo cáo thống kê thực thi thành công trên MongoDB, hiển thị biểu đồ chính xác trên giao diện Admin Dashboard."],
            ["AC-07", "Kiểm thử Hiệu năng 50,000 Bản ghi", "Tác vụ sinh 50,000 policies chạy ổn định. Câu truy vấn lọc và sắp xếp sau khi đánh Compound Index giảm thời gian thực thi đáng kể và chuyển sang sử dụng IXSCAN."]
        ],
        col_widths=[0.9, 2.7, 3.2]
    )

    output_path = "d:/Insurance/docs/SRS_Insurance_Policy_Management_System.docx"
    doc.save(output_path)
    
    # Đồng thời lưu một bản đè vào thư mục gốc nếu không bị khóa bởi Word
    try:
        doc.save("d:/Insurance/SRS_Insurance_Policy_Management_System.docx")
    except PermissionError:
        print("Note: Root file is currently opened in Word, saved to docs/ successfully.")
    print(f"SRS Document successfully created at: {output_path}")

if __name__ == "__main__":
    build_srs_document()
