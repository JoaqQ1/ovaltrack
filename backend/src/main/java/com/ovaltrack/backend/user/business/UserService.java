package com.ovaltrack.backend.user.business;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class UserService {

	@Autowired
	private UserRepository userRepository;

	public Collection<User> findAllUsers() {
		return userRepository.findAll();
	}

	public User findUserById(UUID userId) {
		return userRepository.findById(userId).orElse(null);
	}

	@Transactional
	public User saveUser(User user) {
		return userRepository.save(user);
	}

	@Transactional
	public void deleteUser(UUID userId) {
		userRepository.deleteById(userId);
	}
}
