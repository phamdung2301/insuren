package com.dungphd.insurance.service.impl;

import com.dungphd.insurance.dto.response.PolicyResponse;
import com.dungphd.insurance.dto.response.report.MonthlyPremiumReportDto;
import com.dungphd.insurance.dto.response.report.PolicyStatusCountReportDto;
import com.dungphd.insurance.dto.response.report.PolicyStatusPremiumReportDto;
import com.dungphd.insurance.model.Policy;
import com.dungphd.insurance.service.PolicyService;
import com.dungphd.insurance.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final MongoTemplate mongoTemplate;
    private final PolicyService policyService;

    // 1. Policy count grouped by status (P10 Report 1)
    @Override
    public List<PolicyStatusCountReportDto> getPolicyCountByStatus() {
        GroupOperation groupOp = Aggregation.group("status").count().as("count");
        ProjectionOperation projectOp = Aggregation.project()
                .and("_id").as("status")
                .and("count").as("count");

        Aggregation agg = Aggregation.newAggregation(groupOp, projectOp);
        AggregationResults<PolicyStatusCountReportDto> results =
                mongoTemplate.aggregate(agg, Policy.class, PolicyStatusCountReportDto.class);

        return results.getMappedResults();
    }

    // 2. Total premium grouped by status (P10 Report 2)
    @Override
    public List<PolicyStatusPremiumReportDto> getTotalPremiumByStatus() {
        GroupOperation groupOp = Aggregation.group("status")
                .sum("totalPremium").as("totalPremium")
                .count().as("count");
        ProjectionOperation projectOp = Aggregation.project()
                .and("_id").as("status")
                .and("totalPremium").as("totalPremium")
                .and("count").as("count");

        Aggregation agg = Aggregation.newAggregation(groupOp, projectOp);
        AggregationResults<PolicyStatusPremiumReportDto> results =
                mongoTemplate.aggregate(agg, Policy.class, PolicyStatusPremiumReportDto.class);

        return results.getMappedResults();
    }

    // 3. Top five Policies with highest total premium (P10 Report 3)
    @Override
    public List<PolicyResponse> getTopFivePoliciesByPremium() {
        Query query = new Query()
                .with(Sort.by(Sort.Direction.DESC, "totalPremium"))
                .limit(5);

        List<Policy> topPolicies = mongoTemplate.find(query, Policy.class);

        return topPolicies.stream()
                .map(p -> policyService.getPolicyByNumber(p.getPolicyNumber()))
                .collect(Collectors.toList());
    }

    // 4. Total premium grouped by effective month (P10 Report 4)
    @Override
    public List<MonthlyPremiumReportDto> getTotalPremiumByEffectiveMonth() {
        MatchOperation matchOp = Aggregation.match(Criteria.where("effectiveDate").ne(null));
        ProjectionOperation projectOp = Aggregation.project()
                .andExpression("month(effectiveDate)").as("month")
                .andExpression("year(effectiveDate)").as("year")
                .and("totalPremium").as("totalPremium");
        GroupOperation groupOp = Aggregation.group("year", "month")
                .sum("totalPremium").as("totalPremium")
                .count().as("count");
        SortOperation sortOp = Aggregation.sort(Sort.Direction.ASC, "_id.year", "_id.month");
        ProjectionOperation finalProject = Aggregation.project()
                .and("_id.year").as("year")
                .and("_id.month").as("month")
                .and("totalPremium").as("totalPremium")
                .and("count").as("count");

        Aggregation agg = Aggregation.newAggregation(matchOp, projectOp, groupOp, sortOp, finalProject);
        AggregationResults<MonthlyPremiumReportDto> results =
                mongoTemplate.aggregate(agg, Policy.class, MonthlyPremiumReportDto.class);

        return results.getMappedResults();
    }
}
