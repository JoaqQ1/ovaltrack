package com.ovaltrack.backend.user.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.ovaltrack.backend.club.repository.ClubRepository;
import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.repository.UserRepository;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.user.domain.UserRole;
import com.ovaltrack.backend.user.domain.dto.UserDTOMapper;
import com.ovaltrack.backend.user.domain.dto.UserResponseDTO;
import org.springframework.security.core.Authentication;

import jakarta.transaction.Transactional;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final ClubRepository clubRepository;

	public UserService(UserRepository userRepository,
			ClubRepository clubRepository) {
		this.userRepository = userRepository;
		this.clubRepository = clubRepository;
	}

	public Collection<User> findAllUsers() {
		return userRepository.findAll();
	}

	public User findUserById(UUID userId) {
		return userRepository.findById(userId).orElse(null);
	}

	public User findUserByEmail(String email) {
		return userRepository.findByLoginEmail(email).orElse(null);
	}

	public boolean existsByEmail(String email) {
		return userRepository.existsByLoginEmail(email);
	}

	@Transactional
	public User saveUser(User user) {
		return userRepository.save(user);
	}

	@Transactional
	public void deleteUser(UUID userId) {
		userRepository.deleteById(userId);
	}

	@Transactional
	public UserResponseDTO updateUserRole(UUID userId, UserRole newRole, Authentication authentication) {
		if (newRole == null)
			throw new BusinessException("El rol es obligatorio");

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

		validateRoleAssignmentPermissions(newRole, authentication);
		validateSelfDemotion(user, newRole, authentication);

		user.setRole(newRole);
		User savedUser = userRepository.save(user);
		return UserDTOMapper.toResponseDTO(savedUser);
	}

	private void validateRoleAssignmentPermissions(UserRole newRole, Authentication authentication) {
		if (newRole == UserRole.ADMIN_OVALTRACK && !isSuperAdmin(authentication)) {
			throw new BusinessException("El administrador de club no puede asignar el rol ADMIN_OVALTRACK");
		}
	}

	private boolean isSuperAdmin(Authentication authentication) {
		if (authentication == null)
			return false;
		String superAdminRole = "ROLE_" + UserRole.ADMIN_OVALTRACK.name();
		return authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(superAdminRole)
				|| a.getAuthority().equals(UserRole.ADMIN_OVALTRACK.name()));
	}

	private void validateSelfDemotion(User user, UserRole newRole, Authentication authentication) {
		if (authentication == null || newRole == UserRole.ADMIN_CLUB)
			return;

		boolean isSelf = user.getLoginEmail() != null
				&& user.getLoginEmail().equalsIgnoreCase(authentication.getName());

		if (isSelf && clubRepository.existsByAdminUserId(user.getId())) {
			throw new BusinessException(
					"No puede cambiar su propio rol mientras sea el administrador designado de un club");
		}
	}
}
