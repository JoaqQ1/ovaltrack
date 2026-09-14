package com.ovaltrack.backend.user.presenter;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.user.business.UserContextService;
import com.ovaltrack.backend.user.domain.dto.UserContextDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/me")
@Tag(name = "User Context", description = "Contextual information and club membership for the currently authenticated user")
public class UserContextPresenter {

    private final UserContextService userContextService;

    public UserContextPresenter(UserContextService userContextService) {
        this.userContextService = userContextService;
    }

    @Operation(summary = "Get current authenticated user context", description = "Returns identity, person details, assigned club, and active divisions for the authenticated user.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User context returned successfully."),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid token."),
            @ApiResponse(responseCode = "404", description = "User not found.")
    })
    @GetMapping
    public ResponseEntity<UserContextDTO> getMe(Authentication authentication) {
        return ResponseEntity.ok(userContextService.getUserContext(authentication));
    }
}
