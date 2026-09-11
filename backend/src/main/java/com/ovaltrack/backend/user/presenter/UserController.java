package com.ovaltrack.backend.user.presenter;

import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.domain.dto.UserResponseDTO;
import com.ovaltrack.backend.user.domain.dto.UserRoleUpdateDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("user")
@Tag(name = "Users", description = "Query, update, and manage users and role assignments")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@Operation(summary = "List all users in the system", description = "Returns every user registered in the system.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Users returned successfully.")
	})
	@GetMapping
	public ResponseEntity<Object> findAllUsers() {
		return ResponseEntity.ok(userService.findAllUsers());
	}

	@Operation(summary = "Find a specific user by ID", description = "Returns the user identified by the userId path parameter.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "User found."),
			@ApiResponse(responseCode = "404", description = "The ID does not belong to any user.")
	})
	@GetMapping("/{userId}")
	public ResponseEntity<Object> findUserById(@PathVariable UUID userId) {
		User user = userService.findUserById(userId);
		return (user != null) ? ResponseEntity.ok(user)
				: ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
	}

	@Operation(summary = "Save a user", description = "Creates a user in the system.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "User created successfully."),
			@ApiResponse(responseCode = "409", description = "Business conflict or data integrity violation.")
	})
	@PostMapping
	public ResponseEntity<Object> saveUser(@RequestBody User user) {
		try {
			return ResponseEntity.ok(userService.saveUser(user));
		} catch (BusinessException anError) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
		} catch (DataIntegrityViolationException anError) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar usuario");
		}
	}

	@Operation(summary = "Update user role", description = "Assigns or changes a user role. Restricted to Club Administrator (ADMIN_CLUB) or OvalTrack Super-Admin (ADMIN_OVALTRACK).", requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "New role to assign to the user.", required = true, content = @Content(schema = @Schema(implementation = UserRoleUpdateDTO.class))))
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "User role updated successfully.", content = @Content(schema = @Schema(implementation = UserResponseDTO.class))),
			@ApiResponse(responseCode = "400", description = "Invalid role data provided."),
			@ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid authentication token."),
			@ApiResponse(responseCode = "403", description = "Forbidden - Caller does not have permissions to manage roles."),
			@ApiResponse(responseCode = "404", description = "Target user not found."),
			@ApiResponse(responseCode = "409", description = "Business conflict (e.g. assigning ADMIN_OVALTRACK or self-demotion).")
	})
	@PatchMapping("/{userId}/role")
	@PreAuthorize("hasAnyRole('ADMIN_CLUB', 'ADMIN_OVALTRACK')")
	public ResponseEntity<Object> updateUserRole(
			@PathVariable UUID userId,
			@Valid @RequestBody UserRoleUpdateDTO request,
			BindingResult bindingResult,
			Authentication authentication) {
		if (bindingResult.hasErrors()) {
			String message = bindingResult.getFieldError() != null
					? bindingResult.getFieldError().getDefaultMessage()
					: "Datos inválidos";
			return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of("message", message));
		}
		try {
			UserResponseDTO updatedUser = userService.updateUserRole(userId, request.role(), authentication);
			return ResponseEntity.ok(updatedUser);
		} catch (EntityNotFoundException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Map.of("message", e.getMessage()));
		} catch (BusinessException e) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of("message", e.getMessage()));
		}
	}

	@PutMapping("/{userId}/role")
	@PreAuthorize("hasAnyRole('ADMIN_CLUB', 'ADMIN_OVALTRACK')")
	public ResponseEntity<Object> updateUserRolePut(
			@PathVariable UUID userId,
			@Valid @RequestBody UserRoleUpdateDTO request,
			BindingResult bindingResult,
			Authentication authentication) {
		return updateUserRole(userId, request, bindingResult, authentication);
	}

	@Operation(summary = "Delete a user", description = "Deletes the user identified by the UUID.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "User deleted successfully."),
			@ApiResponse(responseCode = "409", description = "The user cannot be deleted because of related entities.")
	})
	@DeleteMapping("/{userId}")
	public ResponseEntity<Object> deleteUser(@PathVariable UUID userId) {
		try {
			userService.deleteUser(userId);
			return ResponseEntity.ok("Usuario eliminado correctamente");
		} catch (BusinessException anError) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
		} catch (DataIntegrityViolationException anError) {
			return ResponseEntity.status(HttpStatus.CONFLICT)
					.body("Error al eliminar usuario, hay entidades relacionadas");
		}
	}
}
