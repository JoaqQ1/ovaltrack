package com.ovaltrack.backend.user.presenter;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.User;

@RestController
@RequestMapping("user")
public class UserController {

	@Autowired
	private UserService userService;

	@GetMapping
	public ResponseEntity<Object> findAllUsers() {
		return ResponseEntity.ok(userService.findAllUsers());
	}

	@GetMapping("/{userId}")
	public ResponseEntity<Object> findUserById(@PathVariable UUID userId) {
		return ResponseEntity.ok(userService.findUserById(userId));
	}

	@PostMapping
	public ResponseEntity<Object> saveUser(@RequestBody User user) {
		return ResponseEntity.ok(userService.saveUser(user));
	}

	@DeleteMapping("/{userId}")
	public ResponseEntity<Object> deleteUser(@PathVariable UUID userId) {
		userService.deleteUser(userId);
		return ResponseEntity.ok("Usuario eliminado correctamente");
	}
}
