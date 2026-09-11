package com.ovaltrack.backend.club.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.club.domain.ClubStatus;
import com.ovaltrack.backend.club.domain.dto.ClubCreationDTO;
import com.ovaltrack.backend.club.domain.dto.ClubDTOMapper;
import com.ovaltrack.backend.club.domain.dto.ClubResponseDTO;
import com.ovaltrack.backend.club.domain.dto.ClubUpdateDTO;
import com.ovaltrack.backend.club.repository.ClubRepository;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.User;

import jakarta.transaction.Transactional;

@Service
public class ClubService {
    @Autowired
    private ClubRepository clubRepository;

    @Autowired 
    private UserService userService;

    public Collection<ClubResponseDTO> findAllClubs() {
		return clubRepository.findAll().stream().map(ClubDTOMapper::toResponseDTO).toList();
    }

    public ClubResponseDTO findClubById(UUID clubId) {
        return ClubDTOMapper.toResponseDTO(clubRepository.findById(clubId).orElse(null));
    }

    //Paged getAll function

    @Transactional
    public ClubResponseDTO saveClub(ClubCreationDTO aClubRequest) {
        Club aClub = new Club();
        User anUser = userService.findUserById(aClubRequest.adminUserId());
        if (anUser == null) {
            throw new BusinessException("No se puede crear un club sin asignarle un usuario admin");
        }
        aClub.setName(aClubRequest.name());
        aClub.setAdminUser(anUser);
        aClub.setCity(aClubRequest.city());
        aClub.setLogoUrl(aClubRequest.logoUrl());
        aClub.setContactEmail(aClubRequest.contactEmail());
        aClub.setContactPhone(aClubRequest.contactPhone());

        aClub.setStatus(ClubStatus.ACTIVE);

        aClub = clubRepository.save(aClub);
        return ClubDTOMapper.toResponseDTO(aClub);
    }

    @Transactional
    public ClubResponseDTO updateClub(UUID clubId, ClubUpdateDTO request) {
        Club club = clubRepository.findById(clubId).orElse(null);
        if (club == null) {
            throw new BusinessException("Club no encontrado");
        }

        club.setName(request.name());
        club.setCity(request.city());
        club.setLogoUrl(request.logoUrl());
        club.setContactEmail(request.contactEmail());
        club.setContactPhone(request.contactPhone());

        return ClubDTOMapper.toResponseDTO(clubRepository.save(club));
    }


    @Transactional
    public void deleteClub(UUID clubId) {
        //Verifications
       if (findClubById(clubId) == null) {
            throw new BusinessException("Club no encontrado");
       }
        clubRepository.deleteById(clubId);
    }


    public ClubResponseDTO findClubByAdminUserId(UUID adminUserId) {
        return ClubDTOMapper.toResponseDTO(clubRepository.findByAdminUserId(adminUserId).orElse(null));
    }

    public ClubResponseDTO findClubForAuthenticatedUser(org.springframework.security.core.Authentication authentication) {
        Club club = findClubEntityForAuthenticatedUser(authentication);
        if (club == null) {
            throw new BusinessException("No se encontró un club asociado al usuario administrador autenticado");
        }
        return ClubDTOMapper.toResponseDTO(club);
    }

    //PRIVATE

    public Club findClubEntityById(UUID clubId) {
        return clubRepository.findById(clubId).orElse(null);
    }

    public Club findClubEntityForAuthenticatedUser(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        String email = authentication.getName();
        return clubRepository.findByAdminUserLoginEmail(email)
                .orElseGet(() -> {
                    User user = userService.findUserByEmail(email);
                    return (user != null) ? clubRepository.findByAdminUserId(user.getId()).orElse(null) : null;
                });
    }

}


