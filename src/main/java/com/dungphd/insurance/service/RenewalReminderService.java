package com.dungphd.insurance.service;

import com.dungphd.insurance.dto.response.PolicyResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * RenewalReminderService - Nhắc hợp đồng sắp hết hạn.
 *
 * Chạy theo lịch (cron cấu hình qua property). Mặc định TẮT
 * (app.renewal.reminder-enabled=false) vì chưa có cấu hình mail thật:
 * khi bật, service chỉ GHI LOG danh sách cần nhắc thay vì gửi mail thật.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RenewalReminderService {

    private final PolicyService policyService;

    @Value("${app.renewal.reminder-enabled:false}")
    private boolean reminderEnabled;

    @Value("${app.renewal.reminder-days:30}")
    private int reminderDays;

    @Scheduled(cron = "${app.renewal.reminder-cron:0 0 8 * * *}")
    public void checkExpiringPolicies() {
        if (!reminderEnabled) {
            log.debug("Renewal reminder is disabled (app.renewal.reminder-enabled=false). Skipping check.");
            return;
        }

        List<PolicyResponse> expiring = policyService.getExpiringPolicies(reminderDays);
        if (expiring.isEmpty()) {
            log.info("Renewal reminder: no policies expiring within {} days.", reminderDays);
            return;
        }

        log.warn("Renewal reminder: {} policies expiring within {} days (mail chưa cấu hình - chỉ ghi log):",
                expiring.size(), reminderDays);
        for (PolicyResponse p : expiring) {
            log.warn("  - {} | {} | hết hạn: {} | email: {}",
                    p.getPolicyNumber(),
                    p.getInsured() != null ? p.getInsured().getName() : "N/A",
                    p.getExpirationDate(),
                    p.getInsured() != null ? p.getInsured().getEmail() : "N/A");
        }
    }
}
