package com.ovaltrack.backend.user.business;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.ovaltrack.backend.club.repository.ClubRepository;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.domain.UserRole;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class UserPermissionValidator {

	private static final String SUPER_ADMIN_ROLE = "ROLE_" + UserRole.ADMIN_OVALTRACK.name();

	private final ClubRepository clubRepository;

	public void validateCanAssignRole(User targetUser, UserRole newRole, Authentication authentication) {
		validateRoleAssignmentPermissions(newRole, authentication);
		validateSelfDemotion(targetUser, newRole, authentication);
	}

	public void validateCanDeactivate(User targetUser, Authentication authentication) {
		validateSelfDeactivation(targetUser, authentication);
		validateDeactivationPermissions(targetUser, authentication);
	}

	private void validateRoleAssignmentPermissions(UserRole newRole, Authentication authentication) {
		if (newRole == UserRole.ADMIN_OVALTRACK && !isSuperAdmin(authentication)) {
			throw new BusinessException("El administrador de club no puede asignar el rol ADMIN_OVALTRACK");
		}
	}

	private void validateSelfDemotion(User user, UserRole newRole, Authentication authentication) {
		if (authentication == null || newRole == UserRole.ADMIN_CLUB) {
			return;
		}

		if (isSelf(user, authentication) && clubRepository.existsByAdminUserId(user.getId())) {
			throw new BusinessException(
					"No puede cambiar su propio rol mientras sea el administrador designado de un club");
		}
	}

	private void validateSelfDeactivation(User user, Authentication authentication) {
		if (authentication == null) {
			return;
		}

		if (isSelf(user, authentication) && (user.getRole() == UserRole.ADMIN_CLUB
				|| user.getRole() == UserRole.ADMIN_OVALTRACK
				|| clubRepository.existsByAdminUserId(user.getId()))) {
			throw new BusinessException(
					"No puede darse de baja mientras sea el administrador designado de un club");
		}
	}

	private void validateDeactivationPermissions(User user, Authentication authentication) {
		boolean isSelf = isSelf(user, authentication);
		boolean isTargetAdmin = user.getRole() == UserRole.ADMIN_CLUB || user.getRole() == UserRole.ADMIN_OVALTRACK;

		if (!isSelf && isTargetAdmin && !isSuperAdmin(authentication)) {
			throw new BusinessException("No tiene permisos para dar de baja a otro administrador");
		}
	}

	private boolean isSelf(User user, Authentication authentication) {
		return authentication != null && user.getLoginEmail() != null
				&& user.getLoginEmail().equalsIgnoreCase(authentication.getName());
	}

	private boolean isSuperAdmin(Authentication authentication) {
		if (authentication == null) {
			return false;
		}
		return authentication.getAuthorities().stream().anyMatch(a ->
				a.getAuthority().equals(SUPER_ADMIN_ROLE)
				|| a.getAuthority().equals(UserRole.ADMIN_OVALTRACK.name())
		);
	}
}
