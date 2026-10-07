package com.dungphd.insurance.service;

import com.dungphd.insurance.model.Coverage;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("PremiumCalculationService & Excel In/Out Matrix Tests")
class PremiumCalculationServiceTest {

    private PremiumCalculationService calculationService;

    @BeforeEach
    void setUp() {
        calculationService = new PremiumCalculationService();
    }

    @Test
    @DisplayName("Calculate Property Coverage standard 12 months with deductible")
    void testCalculate_PropertyStandard() {
        Coverage coverage = Coverage.builder()
                .coverageCode("PROPERTY")
                .coverageType("STANDARD")
                .limit(1_000_000.0)
                .deductible(5_000.0) // 0.5% deductible -> no discount threshold
                .termMonths(12)
                .build();

        double premium = calculationService.calculate(coverage);
        // Base rate PROPERTY = 0.075% -> 1,000,000 * 0.075 / 100 = 750.0
        assertEquals(750.0, premium, 0.01);
    }

    @Test
    @DisplayName("Calculate with Deductible Discount >= 1% and >= 2%")
    void testCalculate_DeductibleDiscount() {
        Coverage coverage = Coverage.builder()
                .coverageCode("PROPERTY")
                .coverageType("STANDARD")
                .limit(100_000.0)
                .deductible(2_000.0) // 2% deductible -> 15% discount (factor 0.85)
                .termMonths(12)
                .build();

        double premium = calculationService.calculate(coverage);
        // 100,000 * 0.075% = 75.0 * 0.85 = 63.75
        assertEquals(63.75, premium, 0.01);
    }

    @Test
    @DisplayName("Calculate with Multi-Year Term Factor and Enhanced Type Factor")
    void testCalculate_MultiYearEnhanced() {
        Coverage coverage = Coverage.builder()
                .coverageCode("GL")
                .coverageType("ENHANCED") // 1.25
                .limit(500_000.0)
                .deductible(1_000.0)
                .termMonths(24) // 1.85
                .build();

        double premium = calculationService.calculate(coverage);
        // GL rate = 0.12% -> 500,000 * 0.0012 = 600.0 * 1.85 * 1.25 = 1387.5
        assertEquals(1387.5, premium, 0.01);
    }

    @Test
    @DisplayName("Generate Excel rate template with valid sheets and structure")
    void testExportPremiumRateTemplate() throws IOException {
        byte[] excelBytes = calculationService.exportPremiumRateTemplate(List.of());
        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(excelBytes))) {
            assertNotNull(workbook.getSheet("Bảng Định Mức Phí"));
            assertNotNull(workbook.getSheet("Tính Toán Premium"));
            assertNotNull(workbook.getSheet("Hướng Dẫn"));
        }
    }

    @Test
    @DisplayName("Export policy premium calculation Excel breakdown")
    void testExportPolicyPremiumCalculation() throws IOException {
        Coverage cov = Coverage.builder()
                .coverageCode("PROPERTY")
                .coverageName("Tài sản Cháy nổ")
                .coverageType("STANDARD")
                .limit(2_000_000.0)
                .deductible(10_000.0)
                .termMonths(12)
                .premium(1500.0)
                .build();

        byte[] excelBytes = calculationService.exportPolicyPremiumCalculation(
                "POL-2026-TEST", "Công Ty TNHH Mẫu", List.of(cov));

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(excelBytes))) {
            assertEquals(1, workbook.getNumberOfSheets());
        }
    }

    @Test
    @DisplayName("Import modified base rates from Excel matrix file")
    void testImportBaseRatesFromExcel() throws IOException {
        // First export template
        byte[] templateBytes = calculationService.exportPremiumRateTemplate(List.of());

        MockMultipartFile file = new MockMultipartFile(
                "file", "matrix.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                templateBytes);

        Map<String, Double> imported = calculationService.importBaseRatesFromExcel(file);
        assertNotNull(imported);
        assertTrue(imported.containsKey("PROPERTY"));
        assertTrue(imported.containsKey("GL"));
    }
}
