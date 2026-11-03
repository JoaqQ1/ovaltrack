package com.ovaltrack.backend.statistic.controller;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.statistic.business.StatisticService;
import com.ovaltrack.backend.statistic.domain.dto.DivisionStatisticsDTO;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("statistics")
@Tag(name = "Statistics", description = "Query match and period statistics")
@RequiredArgsConstructor
public class StatisticController {

    private final StatisticService statisticService;

    @Operation(
        summary = "Get period statistics for a match",
        description = "Returns calculated statistics for a specific period of a match."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Statistics returned successfully."),
        @ApiResponse(responseCode = "403", description = "The user has no access to the division of the match."),
        @ApiResponse(responseCode = "404", description = "Match not found.")
    })
    @GetMapping("/match/{matchId}")
    @PreAuthorize("hasAnyRole('ADMIN_CLUB', 'COACH_ANALYST', 'ADMIN_OVALTRACK')")
    public ResponseEntity<PeriodStatisticDTO> getMatchPeriodStatistics(
            @PathVariable UUID matchId,
            @RequestParam(required = false, defaultValue = "1") Integer period,
            Authentication authentication) {
        return ResponseEntity.ok(statisticService.calculatePeriodStatistics(matchId, period, authentication));
    }

    @Operation(
        summary = "Get statistics of the finished matches of a division",
        description = "Returns the full-match statistics of every FINISHED match of the division whose date is within [from, to]. "
            + "Coaches/analysts only access divisions they are associated with; club admins, divisions of their own club."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Statistics returned successfully."),
        @ApiResponse(responseCode = "400", description = "Invalid date range."),
        @ApiResponse(responseCode = "403", description = "The user has no access to the division."),
        @ApiResponse(responseCode = "404", description = "Division not found.")
    })
    @GetMapping("/division/{divisionId}")
    @PreAuthorize("hasAnyRole('ADMIN_CLUB', 'COACH_ANALYST', 'ADMIN_OVALTRACK')")
    public ResponseEntity<DivisionStatisticsDTO> getDivisionStatistics(
            @PathVariable UUID divisionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication authentication) {
        return ResponseEntity.ok(statisticService.calculateDivisionStatistics(divisionId, from, to, authentication));
    }
}
