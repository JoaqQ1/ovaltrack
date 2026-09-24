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

import com.ovaltrack.backend.person.domain.Person;
import com.ovaltrack.backend.person.repository.PersonRepository;
import com.ovaltrack.backend.user.domain.dto.UserCreateRequestDTO;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final ClubRepository clubRepository;
	private final PersonRepository personRepository;
	private final PasswordEncoder passwordEncoder;

	public UserService(UserRepository userRepository,
			ClubRepository clubRepository,
			PersonRepository personRepository,
			PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.clubRepository = clubRepository;
		this.personRepository = personRepository;
		this.passwordEncoder = passwordEncoder;
	}

	public Collection<User> findAllUsers() {
		return userRepository.findAll();
	}

	public Collection<UserResponseDTO> findAllUsersDTO() {
		return userRepository.findAll().stream()
				.map(UserDTOMapper::toResponseDTO)
				.toList();
	}

	public Collection<UserResponseDTO> findUsersByClubId(UUID clubId) {
		return userRepository.findAllByClubId(clubId).stream()
				.filter(user -> user.getRole() != UserRole.ADMIN_OVALTRACK)
				.map(UserDTOMapper::toResponseDTO)
				.toList();
	}

	public User findUserById(UUID userId) {
		return userRepository.findById(userId).orElse(null);
	}

	public User findUserByPersonId(UUID personId) {
		return userRepository.findByPersonId(personId).orElse(null);
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
	public UserResponseDTO createUser(UserCreateRequestDTO request) {
		String email = request.getEffectiveEmail();
		if (email == null || email.isBlank()) {
			throw new BusinessException("El email es obligatorio");
		}
		if (userRepository.existsByLoginEmail(email)) {
			throw new BusinessException("El email ya se encuentra registrado");
		}

		Person person = null;
		if (request.personId() != null) {
			person = personRepository.findById(request.personId()).orElse(null);
		}
		if (person == null) {
			person = Person.builder()
					.firstName(request.firstName() != null ? request.firstName() : "")
					.lastName(request.lastName() != null ? request.lastName() : "")
					.birthDate(request.birthDate())
					.contactEmail(email)
					.club(request.clubId() != null ? clubRepository.findById(request.clubId()).orElse(null) : null)
					.build();
			person = personRepository.save(person);
		}

		String encodedPassword = (request.password() != null && !request.password().isBlank())
				? passwordEncoder.encode(request.password())
				: passwordEncoder.encode("Default123!");

		User user = User.builder()
				.person(person)
				.loginEmail(email)
				.passwordHash(encodedPassword)
				.role(request.role() != null ? request.role() : UserRole.NO_ROLE)
				.active(request.active() != null ? request.active() : true)
				.build();

		User saved = userRepository.save(user);
		return UserDTOMapper.toResponseDTO(saved);
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

		if (Boolean.FALSE.equals(user.getActive())) {
			throw new BusinessException("No se puede modificar el rol de un usuario dado de baja");
		}

		validateRoleAssignmentPermissions(newRole, authentication);
		validateSelfDemotion(user, newRole, authentication);

		user.setRole(newRole);
		User savedUser = userRepository.save(user);
		return UserDTOMapper.toResponseDTO(savedUser);
	}

	@Transactional
	public UserResponseDTO deactivateUser(UUID userId, Authentication authentication) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

		if (Boolean.FALSE.equals(user.getActive())) {
			throw new BusinessException("El usuario ya se encuentra dado de baja");
		}

		validateSelfDeactivation(user, authentication);
		validateDeactivationPermissions(user, authentication);

		user.setActive(false);
		User savedUser = userRepository.save(user);
		return UserDTOMapper.toResponseDTO(savedUser);
	}

	private void validateDeactivationPermissions(User user, Authentication authentication) {
		boolean isSelf = authentication != null && user.getLoginEmail() != null
				&& user.getLoginEmail().equalsIgnoreCase(authentication.getName());
		boolean isTargetAdmin = user.getRole() == UserRole.ADMIN_CLUB || user.getRole() == UserRole.ADMIN_OVALTRACK;

		if (!isSelf && isTargetAdmin && !isSuperAdmin(authentication)) {
			throw new BusinessException("No tiene permisos para dar de baja a otro administrador");
		}
	}

	private void validateSelfDeactivation(User user, Authentication authentication) {
		if (authentication == null)
			return;

		boolean isSelf = user.getLoginEmail() != null
				&& user.getLoginEmail().equalsIgnoreCase(authentication.getName());

		if (isSelf && (user.getRole() == UserRole.ADMIN_CLUB || user.getRole() == UserRole.ADMIN_OVALTRACK || clubRepository.existsByAdminUserId(user.getId()))) {
			throw new BusinessException(
					"No puede darse de baja mientras sea el administrador designado de un club");
		}
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
