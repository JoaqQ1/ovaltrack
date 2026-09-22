package com.ovaltrack.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("api")
@Tag(name = "System", description = "Service availability endpoints")
public class PingController {

    @Operation(
        summary = "Check backend availability",
        description = "Returns the current availability status of the backend service."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Backend is available.")
    })
    @RequestMapping(method = RequestMethod.GET)
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of("status", "UP", "message", "Backend conectado correctamente"));
    }
}