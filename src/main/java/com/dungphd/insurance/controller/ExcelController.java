package com.dungphd.insurance.controller;

import com.dungphd.insurance.dto.response.ApiResponse;
import com.dungphd.insurance.model.Coverage;
import com.dungphd.insurance.model.Policy;
import com.dungphd.insurance.repository.PolicyRepository;
import com.dungphd.insurance.service.PremiumCalculationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/excel")
@RequiredArgsConstructor
public class ExcelController {

    private final PremiumCalculationService premiumCalculationService;
    private final PolicyRepository policyRepository;

    /**
     * GET /excel/template - Download Excel template bảng định mức phí
     * Admin only - dùng để download, chỉnh sửa base rates, rồi upload lại
     */
    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadRateTemplate() throws IOException {
        byte[] excelBytes = premiumCalculationService.exportPremiumRateTemplate(new ArrayList<>());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"InsurancePricingMatrix_" + LocalDate.now() + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    /**
     * POST /excel/import-rates - Upload Excel để cập nhật bảng định mức phí
     * Admin only
     */
    @PostMapping("/import-rates")
    public ResponseEntity<ApiResponse<Map<String, Double>>> importBaseRates(
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("File không được để trống"));
            }

            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Chỉ chấp nhận file Excel (.xlsx, .xls)"));
            }

            Map<String, Double> importedRates = premiumCalculationService.importBaseRatesFromExcel(file);
            log.info("Admin imported {} base rates from Excel", importedRates.size());
            return ResponseEntity.ok(ApiResponse.success(importedRates,
                    "Đã cập nhật " + importedRates.size() + " tỷ lệ phí từ file Excel"));

        } catch (IOException e) {
            log.error("Failed to import base rates from Excel", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Lỗi đọc file Excel: " + e.getMessage()));
        }
    }

    /**
     * GET /excel/current-rates - Lấy bảng tỷ lệ phí hiện tại
     */
    @GetMapping("/current-rates")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getCurrentRates() {
        return ResponseEntity.ok(ApiResponse.success(
                PremiumCalculationService.BASE_RATES,
                "Bảng tỷ lệ phí bảo hiểm hiện hành"));
    }

    /**
     * POST /excel/calculate - Tính phí nhanh không cần tạo policy
     * Dùng cho calculator trên frontend (Step 3 trong BuyInsurance)
     */
    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<List<CoverageCalculationResult>>> calculatePremiums(
            @RequestBody List<CoverageCalcRequest> requests) {

        List<CoverageCalculationResult> results = requests.stream().map(req -> {
            double premium = premiumCalculationService.calculate(
                    req.coverageCode(), req.coverageType(),
                    req.limit(), req.deductible(), req.termMonths(), req.baseRate());
            return new CoverageCalculationResult(
                    req.coverageCode(), req.coverageType(),
                    req.limit(), req.deductible(), req.termMonths(),
                    PremiumCalculationService.BASE_RATES.getOrDefault(
                            req.coverageCode() != null ? req.coverageCode().toUpperCase() : "", 0.1),
                    premium);
        }).collect(Collectors.toList());

        double totalPremium = results.stream().mapToDouble(CoverageCalculationResult::premium).sum();

        return ResponseEntity.ok(ApiResponse.success(results,
                "Tổng phí bảo hiểm: $" + String.format("%.2f", totalPremium) + " USD"));
    }

    /**
     * GET /excel/policy/{policyNumber}/download - Xuất file Excel tính phí cho một policy
     */
    @GetMapping("/policy/{policyNumber}/download")
    public ResponseEntity<byte[]> downloadPolicyPremiumExcel(@PathVariable String policyNumber) {
        try {
            Policy policy = policyRepository.findByPolicyNumber(policyNumber)
                    .orElseThrow(() -> new RuntimeException("Policy not found: " + policyNumber));

            List<Coverage> allCoverages = new ArrayList<>();
            if (policy.getLocations() != null) {
                policy.getLocations().forEach(loc -> {
                    if (loc.getCoverages() != null) allCoverages.addAll(loc.getCoverages());
                });
            }

            String insuredName = (policy.getInsured() != null && policy.getInsured().getName() != null)
                    ? policy.getInsured().getName() : "N/A";

            byte[] excelBytes = premiumCalculationService.exportPolicyPremiumCalculation(
                    policyNumber, insuredName, allCoverages);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"PremiumCalc_" + policyNumber + ".xlsx\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelBytes);

        } catch (Exception e) {
            log.error("Failed to generate Excel for policy {}", policyNumber, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ========================
    // Request/Response DTOs
    // ========================

    public record CoverageCalcRequest(
            String coverageCode,
            String coverageType,
            Double limit,
            Double deductible,
            Integer termMonths,
            Double baseRate
    ) {}

    public record CoverageCalculationResult(
            String coverageCode,
            String coverageType,
            Double limit,
            Double deductible,
            Integer termMonths,
            Double appliedBaseRate,
            Double premium
    ) {}
}
