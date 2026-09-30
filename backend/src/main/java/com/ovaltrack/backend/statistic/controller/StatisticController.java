package com.ovaltrack.backend.statistic.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.statistic.business.StatisticService;
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
        @ApiResponse(responseCode = "404", description = "Match not found.")
    })
    @GetMapping("/match/{matchId}")
    public ResponseEntity<PeriodStatisticDTO> getMatchPeriodStatistics(
            @PathVariable UUID matchId,
            @RequestParam(required = false, defaultValue = "1") Integer period) {
        return ResponseEntity.ok(statisticService.calculatePeriodStatistics(matchId, period));
    }
}
